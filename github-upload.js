/* =============================================================
   AlignPortfolio — GitHub upload
   -------------------------------------------------------------
   Uploads artifact files to the repo via the GitHub Contents API,
   then patches data/projects.js to add the new manifest entry.

   Requires window.ALIGN_CONFIG.github:
     repo   — "owner/repo", e.g. "fredrikalign/align-web"
     branch — target branch, e.g. "main"

   Token resolution order (first non-empty wins):
     1. window.ALIGN_SECRET.githubToken  — set by GitHub Actions at
        deploy time via data/config.secret.js (gitignored). This is
        the preferred path: only the admin/CI touches the token.
     2. localStorage "alignportfolio_gh_token"  — fallback for local
        dev or when no CI secret is configured. Employees can enter
        it once via the Settings (⚙) icon.

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
    // Prefer token injected by CI/deploy (window.ALIGN_SECRET)
    const secret = (window.ALIGN_SECRET || {}).githubToken;
    if (secret && secret.trim()) return secret.trim();
    return localStorage.getItem(LS_TOKEN) || "";
  }

  // isDeployToken — true when token comes from the deploy secret,
  // so we hide the settings UI (no one needs to manage it manually)
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

  /* ---------- low-level API helpers ---------- */

  function apiUrl(path) {
    return "https://api.github.com/repos/" + ghCfg().repo + path;
  }

  function headers() {
    return {
      Authorization: "Bearer " + getToken(),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    };
  }

  async function getFile(path) {
    const r = await fetch(apiUrl("/contents/" + path + "?ref=" + ghCfg().branch), {
      headers: headers(),
    });
    if (r.status === 404) return null;
    if (r.status === 401) throw new Error("GitHub token is invalid or expired. Update it in Settings.");
    if (!r.ok) throw new Error("GitHub API error " + r.status + " reading " + path);
    return r.json();
  }

  async function putFile(path, base64Content, message, sha) {
    const body = { message, content: base64Content, branch: ghCfg().branch };
    if (sha) body.sha = sha;
    const r = await fetch(apiUrl("/contents/" + path), {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (r.status === 401) throw new Error("GitHub token is invalid or expired. Update it in Settings.");
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error("GitHub API error " + r.status + " writing " + path + ": " + (err.message || ""));
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

  /* ---------- verify a token against the GitHub API ---------- */

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
    if (r.status === 401 || r.status === 403) throw new Error("Token rejected by GitHub — check it has Contents: read+write on this repo.");
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

  async function patchProjectsJs(entry) {
    const filePath = "data/projects.js";
    const existing = await getFile(filePath);
    if (!existing) throw new Error("data/projects.js not found in the repo");

    const currentContent = atob(existing.content.replace(/\n/g, ""));
    const newRow = buildManifestRow(entry);

    const marker = "window.ALIGN_PROJECTS = [";
    const idx = currentContent.indexOf(marker);
    if (idx === -1) throw new Error("Could not find ALIGN_PROJECTS array in data/projects.js");

    const insertAt = idx + marker.length;
    const patched =
      currentContent.slice(0, insertAt) +
      "\n" + newRow +
      currentContent.slice(insertAt);

    const b64 = btoa(unescape(encodeURIComponent(patched)));
    await putFile(filePath, b64, "Add artifact: " + entry.title, existing.sha);
  }

  /* ---------- public upload API ---------- */

  /*
   * upload({ files, entryPath, entry, thumbDataUrl, onProgress })
   *   files       — [{path, blob}] from AlignFiles.ingest
   *   entryPath   — the HTML entry path within the bundle
   *   entry       — manifest object { id, title, cat, lang, desc, date }
   *   thumbDataUrl — data:image/... or null
   *   onProgress(done, total, message)
   */
  async function upload({ files, entryPath, entry, thumbDataUrl, onProgress }) {
    if (!isConfigured()) throw new Error("GitHub upload is not configured");

    const slug = entry.id;
    const norm = (p) => String(p || "").replace(/\\/g, "/").replace(/^\.?\//, "").replace(/^\/+/, "");

    const steps = files.length + (thumbDataUrl ? 1 : 0) + 1;
    let done = 0;
    const tick = (msg) => { done++; if (onProgress) onProgress(done, steps, msg); };

    for (const f of files) {
      const repoPath = "projects/" + slug + "/" + norm(f.path);
      const existing = await getFile(repoPath);
      const b64 = await blobToBase64(f.blob);
      await putFile(repoPath, b64, "Upload artifact: " + slug + " / " + norm(f.path), existing ? existing.sha : undefined);
      tick(norm(f.path));
    }

    entry.file = "projects/" + slug + "/" + norm(entryPath);
    entry.thumb = "";

    if (thumbDataUrl) {
      const thumbPath = "thumbnails/" + slug + ".png";
      const existing = await getFile(thumbPath);
      const b64 = thumbDataUrl.split(",")[1];
      await putFile(thumbPath, b64, "Upload thumbnail: " + slug, existing ? existing.sha : undefined);
      entry.thumb = thumbPath;
      tick("thumbnail");
    }

    tick("updating manifest…");
    await patchProjectsJs(entry);

    return entry;
  }

  window.AlignGitHub = { isConfigured, isDeployToken, getToken, saveToken, clearToken, verifyToken, upload };
})();
