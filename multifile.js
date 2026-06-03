/* =============================================================
   AlignPortfolio — multi-file artifact support
   -------------------------------------------------------------
   A Claude Design export is usually a folder (index.html + css,
   js, images, fonts). This module lets the gallery:
     • read a whole folder OR a .zip
     • preview it locally (assets rewired to blob URLs)
     • persist it durably in the browser (IndexedDB)
     • export it as a zip the user drops into projects/<slug>/

   Exposes window.AlignFiles.
   ============================================================= */
(function () {
  "use strict";

  const JSZIP_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

  function loadJSZip() {
    return new Promise((resolve, reject) => {
      if (window.JSZip) return resolve(window.JSZip);
      const s = document.createElement("script");
      s.src = JSZIP_URL;
      s.onload = () => resolve(window.JSZip);
      s.onerror = () => reject(new Error("Could not load zip support."));
      document.head.appendChild(s);
    });
  }

  /* ---------- path helpers ---------- */
  function norm(p) {
    return String(p || "").replace(/\\/g, "/").replace(/^\.?\//, "").replace(/^\/+/, "");
  }
  // strip a common top-level folder (Claude zips often wrap everything
  // in one directory) so paths line up with the entry HTML.
  function stripCommonRoot(files) {
    const tops = new Set(files.map((f) => norm(f.path).split("/")[0]));
    const allNested = files.every((f) => norm(f.path).includes("/"));
    if (tops.size === 1 && allNested) {
      const root = [...tops][0] + "/";
      return files.map((f) => ({ ...f, path: norm(f.path).slice(root.length) }));
    }
    return files.map((f) => ({ ...f, path: norm(f.path) }));
  }
  function dirOf(p) {
    const i = norm(p).lastIndexOf("/");
    return i === -1 ? "" : norm(p).slice(0, i + 1);
  }
  function ext(p) {
    const m = norm(p).match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "";
  }
  function isExternal(ref) {
    return /^(https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/)/i.test(ref.trim());
  }
  // resolve a relative ref from a file path → normalized project path
  function resolve(fromPath, ref) {
    try {
      const u = new URL(ref, "http://_/" + dirOf(fromPath));
      if (u.host !== "_") return null;
      return decodeURIComponent(u.pathname.replace(/^\//, ""));
    } catch (e) {
      return null;
    }
  }

  /* ---------- entry detection ---------- */
  function htmlFiles(files) {
    return files.filter((f) => ext(f.path) === "html" || ext(f.path) === "htm");
  }
  function pickEntry(files) {
    const html = htmlFiles(files);
    if (!html.length) return null;
    // prefer an index.html closest to the root
    const byDepth = (a, b) => norm(a.path).split("/").length - norm(b.path).split("/").length;
    const indexes = html.filter((f) => /(^|\/)index\.html?$/i.test(norm(f.path))).sort(byDepth);
    if (indexes.length) return norm(indexes[0].path);
    return norm(html.slice().sort(byDepth)[0].path);
  }

  /* ---------- read inputs ---------- */
  async function fromFileList(fileList) {
    const arr = [];
    for (const f of fileList) {
      arr.push({ path: norm(f.webkitRelativePath || f.name), blob: f });
    }
    return stripCommonRoot(arr);
  }
  async function fromZip(file) {
    const JSZip = await loadJSZip();
    const zip = await JSZip.loadAsync(file);
    const out = [];
    const entries = Object.values(zip.files).filter((e) => !e.dir);
    for (const e of entries) {
      const blob = await e.async("blob");
      out.push({ path: norm(e.name), blob });
    }
    return stripCommonRoot(out);
  }
  // accepts a FileList/array; if it's a single .zip, unpack it
  async function ingest(fileList) {
    const files = Array.from(fileList);
    if (files.length === 1 && /\.zip$/i.test(files[0].name)) {
      return fromZip(files[0]);
    }
    return fromFileList(files);
  }

  // read a drag-and-drop DataTransfer — supports dropping a whole folder
  async function walkEntry(entry, prefix, out) {
    if (entry.isFile) {
      const file = await new Promise((res) => entry.file(res));
      out.push({ path: norm(prefix + entry.name), blob: file });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      let batch;
      do {
        batch = await new Promise((res) => reader.readEntries(res, () => res([])));
        for (const e of batch) await walkEntry(e, prefix + entry.name + "/", out);
      } while (batch.length);
    }
  }
  async function fromDataTransfer(dt) {
    const items = Array.from(dt.items || []);
    const entries = items.map((i) => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
    // single zip dropped
    const files = Array.from(dt.files || []);
    if (files.length === 1 && /\.zip$/i.test(files[0].name)) return fromZip(files[0]);
    if (entries.length) {
      const out = [];
      for (const e of entries) await walkEntry(e, "", out);
      return stripCommonRoot(out);
    }
    return fromFileList(files);
  }

  /* ---------- build a local preview (blob URLs) ---------- */
  const MIME = {
    html: "text/html", htm: "text/html", css: "text/css", js: "text/javascript",
    mjs: "text/javascript", json: "application/json", svg: "image/svg+xml",
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
    webp: "image/webp", ico: "image/x-icon", woff: "font/woff", woff2: "font/woff2",
    ttf: "font/ttf", otf: "font/otf", map: "application/json", txt: "text/plain",
  };
  function typed(blob, path) {
    const t = MIME[ext(path)];
    if (t && blob.type !== t) return blob.slice(0, blob.size, t);
    return blob;
  }

  async function buildPreviewUrl(files, entryPath) {
    files = files.map((f) => ({ path: norm(f.path), blob: f.blob }));
    entryPath = norm(entryPath || pickEntry(files));
    const byPath = {};
    files.forEach((f) => { byPath[f.path] = f; });

    const urlMap = {}; // path -> blob URL
    const track = [];
    const make = (path, blob) => {
      const u = URL.createObjectURL(typed(blob, path));
      urlMap[path] = u; track.push(u); return u;
    };

    // 1) assets (everything that isn't css/html) get direct blob URLs
    for (const f of files) {
      const e = ext(f.path);
      if (e === "css" || e === "html" || e === "htm") continue;
      make(f.path, f.blob);
    }

    // 2) css — rewrite url(...) / @import to asset blob URLs, then blob the css
    function rewriteCss(text, fromPath) {
      return text
        .replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q, ref) => {
          if (isExternal(ref)) return m;
          const t = resolve(fromPath, ref.split(/[?#]/)[0]);
          return t && urlMap[t] ? `url("${urlMap[t]}")` : m;
        })
        .replace(/@import\s+(['"])([^'"]+)\1/gi, (m, q, ref) => {
          if (isExternal(ref)) return m;
          const t = resolve(fromPath, ref.split(/[?#]/)[0]);
          return t && urlMap[t] ? `@import "${urlMap[t]}"` : m;
        });
    }
    for (const f of files) {
      if (ext(f.path) !== "css") continue;
      const text = await f.blob.text();
      make(f.path, new Blob([rewriteCss(text, f.path)], { type: "text/css" }));
    }

    // 3) the entry HTML — rewrite src/href + inline url() to blob URLs
    const entryFile = byPath[entryPath];
    if (!entryFile) throw new Error("No entry page found (index.html).");
    let html = await entryFile.blob.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const swap = (el, attr) => {
      const ref = el.getAttribute(attr);
      if (!ref || isExternal(ref)) return;
      const [bare, hash] = ref.split("#");
      const t = resolve(entryPath, bare.split("?")[0]);
      if (t && urlMap[t]) {
        el.setAttribute(attr, urlMap[t] + (hash ? "#" + hash : ""));
      }
    };
    doc.querySelectorAll("[src]").forEach((el) => swap(el, "src"));
    doc.querySelectorAll("link[href]").forEach((el) => swap(el, "href"));
    // anchors only if they point at another bundled HTML page
    doc.querySelectorAll("a[href]").forEach((el) => {
      const ref = el.getAttribute("href");
      if (!ref || isExternal(ref)) return;
      const t = resolve(entryPath, ref.split(/[?#]/)[0]);
      if (t && urlMap[t]) swap(el, "href");
    });
    // inline style="...url()..."
    doc.querySelectorAll("[style*='url(']").forEach((el) => {
      el.setAttribute("style", rewriteCss(el.getAttribute("style"), entryPath));
    });
    // <style> blocks
    doc.querySelectorAll("style").forEach((el) => {
      el.textContent = rewriteCss(el.textContent, entryPath);
    });

    const out = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    const url = URL.createObjectURL(new Blob([out], { type: "text/html" }));
    track.push(url);
    return { url: url, revoke: () => track.forEach((u) => URL.revokeObjectURL(u)) };
  }

  /* ---------- export as zip ---------- */
  async function zipFiles(files) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    files.forEach((f) => zip.file(norm(f.path), f.blob));
    return zip.generateAsync({ type: "blob" });
  }

  /* ---------- IndexedDB persistence ---------- */
  const DB_NAME = "alignportfolio";
  const STORE = "artifacts";
  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbSave(id, files, entry) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ id, entry: norm(entry), files: files.map((f) => ({ path: norm(f.path), blob: f.blob })) });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async function idbLoad(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbRemove(id) {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  window.AlignFiles = {
    ingest, fromDataTransfer, pickEntry, htmlFiles, buildPreviewUrl, zipFiles, norm, ext,
    save: idbSave, load: idbLoad, remove: idbRemove,
  };
})();
