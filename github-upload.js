/* =============================================================
   AlignPortfolio — GitHub upload
   -------------------------------------------------------------
   Uploads artifact files to the repo via the GitHub Contents API,
   then patches data/projects.js to add the new manifest entry.

   Requires window.ALIGN_CONFIG.github:
     token  — fine-grained PAT with Contents: read+write on this repo
     repo   — "owner/repo", e.g. "fredrikalign/align-web"
     branch — target branch, e.g. "main"

   Exposes window.AlignGitHub.
   ============================================================= */
(function () {
  "use strict";

  function cfg() {
    return (window.ALIGN_CONFIG || {}).github || {};
  }

  function isConfigured() {
    const c = cfg();
    return !!(c.token && c.repo && c.branch);
  }

  /* ---------- low-level API helpers ---------- */

  function apiUrl(path) {
    const { repo } = cfg();
    return "https://api.github.com/repos/" + repo + path;
  }

  function headers() {
    return {
      Authorization: "Bearer " + cfg().token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    };
  }

  async function getFile(path) {
    const r = await fetch(apiUrl("/contents/" + path + "?ref=" + cfg().branch), {
      headers: headers(),
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error("GitHub API error " + r.status + " reading " + path);
    return r.json(); // { sha, content (base64), ... }
  }

  async function putFile(path, base64Content, message, sha) {
    const body = { message, content: base64Content, branch: cfg().branch };
    if (sha) body.sha = sha;
    const r = await fetch(apiUrl("/contents/" + path), {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(body),
    });
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
      reader.onload = () => {
        // result is "data:<mime>;base64,<data>" — strip the prefix
        const b64 = reader.result.split(",")[1];
        resolve(b64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
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

    // Insert after the opening bracket of ALIGN_PROJECTS = [
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

  /* ---------- public API ---------- */

  /*
   * upload({ files, entryPath, entry, thumbDataUrl })
   *   files       — [{path, blob}] array (from AlignFiles.ingest)
   *   entryPath   — the HTML entry file path within the bundle
   *   entry       — manifest object { id, title, cat, lang, desc, date }
   *                 (file/thumb will be set here)
   *   thumbDataUrl — data:image/... string or null
   *
   * Returns the completed manifest entry.
   * Calls onProgress(done, total, message) if provided.
   */
  async function upload({ files, entryPath, entry, thumbDataUrl, onProgress }) {
    if (!isConfigured()) throw new Error("GitHub upload is not configured");

    const slug = entry.id;
    const norm = (p) => String(p || "").replace(/\\/g, "/").replace(/^\.?\//, "").replace(/^\/+/, "");

    const steps = files.length + (thumbDataUrl ? 1 : 0) + 1; // files + thumb + manifest
    let done = 0;
    const tick = (msg) => { done++; if (onProgress) onProgress(done, steps, msg); };

    // 1) upload artifact files to projects/<slug>/
    for (const f of files) {
      const repoPath = "projects/" + slug + "/" + norm(f.path);
      const existing = await getFile(repoPath);
      const b64 = await blobToBase64(f.blob);
      await putFile(repoPath, b64, "Upload artifact: " + slug + " / " + norm(f.path), existing ? existing.sha : undefined);
      tick(norm(f.path));
    }

    const filePath = "projects/" + slug + "/" + norm(entryPath);
    entry.file = filePath;
    entry.thumb = "";

    // 2) upload thumbnail if provided
    if (thumbDataUrl) {
      const thumbPath = "thumbnails/" + slug + ".png";
      const existing = await getFile(thumbPath);
      // data URL → base64 content
      const b64 = thumbDataUrl.split(",")[1];
      await putFile(thumbPath, b64, "Upload thumbnail: " + slug, existing ? existing.sha : undefined);
      entry.thumb = thumbPath;
      tick("thumbnail");
    }

    // 3) patch data/projects.js
    tick("updating manifest…");
    await patchProjectsJs(entry);

    return entry;
  }

  window.AlignGitHub = { isConfigured, upload };
})();
