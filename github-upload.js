/* =============================================================
   AlignPortfolio — GitHub upload
   -------------------------------------------------------------
   Uploads artifact files to the repo via the GitHub Git Trees API,
   committing all files (including the manifest patch) in a single
   atomic commit. This triggers exactly one CI/CD run per publish.

   Requires window.ALIGN_CONFIG.github:
     repo   — "owner/repo", e.g. "fredrikalign/align-web"
     branch — target branch, e.g. "main"

   Token resolution order (first non-empty wins):
     1. window.ALIGN_SECRET.githubToken  — injected at deploy time
        via GitHub Actions secret (ALIGN_UPLOAD_TOKEN). Preferred.
     2. localStorage "alignportfolio_gh_token"  — fallback for
        local dev. Enter once via the Settings (⚙) icon.

   Exposes window.AlignGitHub.
   ============================================================= */
(function () {
  "use strict";

  const LS_TOKEN = "alignportfolio_gh_token";

  function ghCfg() {
    return (window.ALIGN_CONFIG || {}).github || {};
  }

  /* ---------- token resolution ---------- */

  function getToken() {
    const secret = (window.ALIGN_SECRET || {}).githubToken;
    if (secret && secret.trim()) return secret.trim();
    return localStorage.getItem(LS_TOKEN) || "";
  }
  function isDeployToken() {
    const secret = (window.ALIGN_SECRET || {}).githubToken;
    return !!(secret && secret.trim());
  }
  function saveToken(t) {
    if (t) localStorage.setItem(LS_TOKEN, t.trim());
    else localStorage.removeItem(LS_TOKEN);
  }
  function clearToken() {
    localStorage.removeItem(LS_TOKEN);
  }
  function isConfigured() {
    const c = ghCfg();
    return !!(getToken() && c.repo && c.branch);
  }

  /* ---------- low-level helpers ---------- */

  function apiBase() {
    return "https://api.github.com/repos/" + ghCfg().repo;
  }
  function hdrs() {
    return {
      Authorization: "Bearer " + getToken(),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    };
  }
  async function apiFetch(path, opts) {
    const r = await fetch(apiBase() + path, { headers: hdrs(), ...opts });
    if (r.status === 401) throw new Error("GitHub token is invalid or expired. Update it in Settings.");
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error("GitHub " + r.status + " " + path + ": " + (e.message || r.statusText));
    }
    return r.json();
  }

  /* ---------- blob → base64 ---------- */

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  /* ---------- token verification ---------- */

  async function verifyToken(token) {
    const c = ghCfg();
    if (!c.repo) throw new Error("No repo configured in ALIGN_CONFIG.github");
    const r = await fetch("https://api.github.com/repos/" + c.repo, {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (r.status === 401 || r.status === 403)
      throw new Error("Token rejected — check it has Contents: read+write on this repo.");
    if (r.status === 404) throw new Error("Repo not found — check ALIGN_CONFIG.github.repo.");
    if (!r.ok) throw new Error("GitHub returned status " + r.status);
  }

  /* ---------- projects.js patching ---------- */

  function buildManifestRow(entry) {
    return (
      "  {\n" +
      '    id: "' + entry.id + '",\n' +
      '    title: ' + JSON.stringify(entry.title) + ',\n' +
      '    cat: "' + entry.cat + '",\n' +
      '    lang: "' + entry.lang + '",\n' +
      '    desc: ' + JSON.stringify(entry.desc) + ',\n' +
      '    file: "' + entry.file + '",\n' +
      '    thumb: "' + (entry.thumb || "") + '",\n' +
      '    date: "' + entry.date + '",\n' +
      "  },"
    );
  }

  function patchManifestContent(current, entry) {
    const marker = "window.ALIGN_PROJECTS = [";
    const idx = current.indexOf(marker);
    if (idx === -1) throw new Error("Could not find ALIGN_PROJECTS in data/projects.js");
    const insertAt = idx + marker.length;
    return current.slice(0, insertAt) + "\n" + buildManifestRow(entry) + current.slice(insertAt);
  }

  /* ---------- single-commit upload via Git Trees API ---------- */

  async function upload({ files, entryPath, entry, thumbDataUrl, onProgress }) {
    if (!isConfigured()) throw new Error("GitHub upload is not configured");

    const { branch } = ghCfg();
    const norm = (p) => String(p || "").replace(/\\/g, "/").replace(/^\.?\//, "").replace(/^\/+/, "");
    const slug = entry.id;

    const total = files.length + (thumbDataUrl ? 1 : 0) + 2; // files + thumb + manifest + commit
    let done = 0;
    const tick = (msg) => { done++; if (onProgress) onProgress(done, total, msg); };

    // 1) Get current branch tip
    const ref = await apiFetch("/git/ref/heads/" + branch);
    const baseSha = ref.object.sha;
    const baseCommit = await apiFetch("/git/commits/" + baseSha);
    const baseTreeSha = baseCommit.tree.sha;

    // 2) Create a blob for every artifact file
    const treeItems = [];

    for (const f of files) {
      const path = "projects/" + slug + "/" + norm(f.path);
      const content = await blobToBase64(f.blob);
      const blob = await apiFetch("/git/blobs", {
        method: "POST",
        body: JSON.stringify({ content, encoding: "base64" }),
      });
      treeItems.push({ path, mode: "100644", type: "blob", sha: blob.sha });
      tick(norm(f.path));
    }

    entry.file = "projects/" + slug + "/" + norm(entryPath);
    entry.thumb = "";

    // 3) Thumbnail blob
    if (thumbDataUrl) {
      const path = "thumbnails/" + slug + ".png";
      const content = thumbDataUrl.split(",")[1];
      const blob = await apiFetch("/git/blobs", {
        method: "POST",
        body: JSON.stringify({ content, encoding: "base64" }),
      });
      treeItems.push({ path, mode: "100644", type: "blob", sha: blob.sha });
      entry.thumb = path;
      tick("thumbnail");
    }

    // 4) Fetch and patch data/projects.js
    tick("patching manifest…");
    const manifestFile = await apiFetch("/contents/data/projects.js?ref=" + branch);
    const currentContent = new TextDecoder().decode(
      Uint8Array.from(atob(manifestFile.content.replace(/\n/g, "")), (c) => c.charCodeAt(0))
    );
    const patched = patchManifestContent(currentContent, entry);
    const manifestBlob = await apiFetch("/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content: btoa(unescape(encodeURIComponent(patched))), encoding: "base64" }),
    });
    treeItems.push({ path: "data/projects.js", mode: "100644", type: "blob", sha: manifestBlob.sha });

    // 5) Create new tree, commit, update ref — all in one push
    const newTree = await apiFetch("/git/trees", {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });
    const newCommit = await apiFetch("/git/commits", {
      method: "POST",
      body: JSON.stringify({
        message: "Add artifact: " + entry.title,
        tree: newTree.sha,
        parents: [baseSha],
      }),
    });
    await apiFetch("/git/refs/heads/" + branch, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    tick("done");
    return entry;
  }

  window.AlignGitHub = { isConfigured, isDeployToken, getToken, saveToken, clearToken, verifyToken, upload };
})();
