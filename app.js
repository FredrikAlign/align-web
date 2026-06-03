/* =============================================================
   AlignPortfolio — app
   Vanilla JS. States: login → gallery → viewer.
   Plus a public "shared" route for customer links.
   ============================================================= */
(function () {
  "use strict";

  const CFG = window.ALIGN_CONFIG || {};
  const AUTH = CFG.auth || { allowedDomains: ["alignconsulting.se"] };
  const ANALYTICS = CFG.analytics || { mode: "local" };

  /* ---------- view counter (local or Firebase REST) ---------- */
  const Counter = {
    _safe(k) { return String(k).replace(/[^A-Za-z0-9_:-]/g, "_"); },
    _fbUrl(k) {
      return ANALYTICS.firebaseUrl.replace(/\/+$/, "") + "/portfolio_views/" + this._safe(k) + ".json";
    },
    _cloud() { return ANALYTICS.mode === "firebase" && ANALYTICS.firebaseUrl; },
    async hit(key) {
      if (this._cloud()) {
        try {
          const cur = await fetch(this._fbUrl(key)).then((r) => r.json()).catch(() => 0);
          const next = (typeof cur === "number" ? cur : 0) + 1;
          await fetch(this._fbUrl(key), { method: "PUT", body: JSON.stringify(next) });
          return next;
        } catch (e) { return null; }
      }
      const m = JSON.parse(localStorage.getItem("alignportfolio_views") || "{}");
      m[key] = (m[key] || 0) + 1;
      localStorage.setItem("alignportfolio_views", JSON.stringify(m));
      return m[key];
    },
    async get(key) {
      if (this._cloud()) {
        try {
          const cur = await fetch(this._fbUrl(key)).then((r) => r.json());
          return typeof cur === "number" ? cur : 0;
        } catch (e) { return null; }
      }
      const m = JSON.parse(localStorage.getItem("alignportfolio_views") || "{}");
      return m[key] || 0;
    },
  };

  /* ---------- tiny icon set (Lucide paths) ---------- */
  const I = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    restore: '<path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    files: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  };
  const svg = (name, cls) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${cls ? ` class="${cls}"` : ""}>${I[name] || ""}</svg>`;

  const CATS = [
    { id: "landningssida", label: "Landing Pages" },
    { id: "prototyp", label: "Prototypes" },
    { id: "presentation", label: "Presentations" },
    { id: "dashboard", label: "Dashboards" },
    { id: "rapport", label: "Reports" },
    { id: "ovrigt", label: "Other" },
  ];
  const CAT_LABEL = (id) => (CATS.find((c) => c.id === id) || { label: id }).label;
  const LANGS = ["SWE", "NOR", "ENG"];

  const LS = {
    session: "alignportfolio_session",
    local: "alignportfolio_local_projects",
    shares: "alignportfolio_share_keys",
    overrides: "alignportfolio_overrides",
  };

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- state ---------- */
  let state = {
    cat: "all",
    lang: "all",
    q: "",
    view: "active", // active | archived
  };
  const blobUrls = {}; // id -> blobURL for local single-file artifacts
  const multiCache = {}; // id -> blobURL for local multi-file artifacts

  /* ---------- archive / delete overrides ----------
     Works for both baked (GitHub) and local artifacts. Stored in the
     browser; to make permanent for everyone, edit data/projects.js. */
  function loadOverrides() {
    try { return JSON.parse(localStorage.getItem(LS.overrides) || "{}"); }
    catch (e) { return {}; }
  }
  function saveOverrides(o) { localStorage.setItem(LS.overrides, JSON.stringify(o)); }
  function isArchived(id) {
    const o = loadOverrides();
    return !!(o.archived && o.archived[id]);
  }
  function isDeleted(id) {
    const o = loadOverrides();
    return !!(o.deleted && o.deleted[id]);
  }
  function setArchived(id, val) {
    const o = loadOverrides();
    o.archived = o.archived || {};
    if (val) o.archived[id] = true; else delete o.archived[id];
    saveOverrides(o);
  }
  async function deleteProject(id) {
    const local = loadLocalRaw();
    const idx = local.findIndex((p) => p.id === id);
    if (idx !== -1) {
      // local artifact — purge entirely
      local.splice(idx, 1);
      saveLocal(local);
      if (blobUrls[id]) { URL.revokeObjectURL(blobUrls[id]); delete blobUrls[id]; }
      if (multiCache[id]) { URL.revokeObjectURL(multiCache[id]); delete multiCache[id]; }
      if (window.AlignFiles) { try { await AlignFiles.remove(id); } catch (e) {} }
    } else {
      // baked artifact — hide locally
      const o = loadOverrides();
      o.deleted = o.deleted || {};
      o.deleted[id] = true;
      if (o.archived) delete o.archived[id];
      saveOverrides(o);
    }
  }

  /* ---------- local projects ---------- */
  function loadLocalRaw() {
    try { return JSON.parse(localStorage.getItem(LS.local) || "[]"); }
    catch (e) { return []; }
  }
  function loadLocal() {
    const arr = loadLocalRaw();
    arr.forEach((p) => {
      if (p._multi) {
        p.file = multiCache[p.id] || "";
        return;
      }
      if (p._html && !blobUrls[p.id]) {
        blobUrls[p.id] = URL.createObjectURL(new Blob([p._html], { type: "text/html" }));
      }
      if (p._html) p.file = blobUrls[p.id];
    });
    return arr;
  }
  function saveLocal(arr) {
    localStorage.setItem(LS.local, JSON.stringify(arr));
  }
  function allProjects() {
    const baked = (window.ALIGN_PROJECTS || []).map((p) => ({ ...p }));
    const local = loadLocal();
    // local first (most recently added on top), then baked by date desc
    baked.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    let all = [...local, ...baked];
    all = all.filter((p) => !isDeleted(p.id));
    all.forEach((p) => { p._archived = !!p.archived || isArchived(p.id); });
    return all;
  }
  function findProject(id) {
    return allProjects().find((p) => p.id === id);
  }

  /* ---------- hydrate a local multi-file artifact for preview ---------- */
  async function hydrateMulti(id) {
    if (multiCache[id]) return multiCache[id];
    if (!window.AlignFiles) return "";
    const rec = await AlignFiles.load(id);
    if (!rec) return "";
    const handle = await AlignFiles.buildPreviewUrl(rec.files, rec.entry);
    multiCache[id] = handle.url;
    return handle.url;
  }

  /* =============================================================
     AUTH
     ============================================================= */
  let msal = null;
  function entraConfigured() {
    return !!(AUTH.clientId && AUTH.clientId.trim());
  }
  function loadMsalScript() {
    return new Promise((resolve, reject) => {
      if (window.msal) return resolve();
      const s = document.createElement("script");
      s.src = "https://alcdn.msauth.net/browser/3.27.0/js/msal-browser.min.js";
      s.crossOrigin = "anonymous";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function entraEnabled() {
    return !!(entraConfigured() && window.msal);
  }
  function initMsal() {
    if (!AUTH.clientId || !window.msal) return null;
    if (msal) return msal;
    msal = new window.msal.PublicClientApplication({
      auth: {
        clientId: AUTH.clientId,
        authority: "https://login.microsoftonline.com/" + (AUTH.tenantId || "organizations"),
        redirectUri: location.origin + location.pathname,
      },
      cache: { cacheLocation: "localStorage" },
    });
    return msal;
  }
  function domainOk(email) {
    if (!email || !email.includes("@")) return false;
    const dom = email.split("@")[1].toLowerCase();
    return (AUTH.allowedDomains || []).map((d) => d.toLowerCase()).includes(dom);
  }
  function currentUser() {
    if (entraEnabled()) {
      const acc = (msal && msal.getAllAccounts()[0]) || null;
      if (acc) return { name: acc.name || acc.username, email: acc.username };
      return null;
    }
    try {
      const s = JSON.parse(sessionStorage.getItem(LS.session) || "null");
      return s && s.email ? s : null;
    } catch (e) {
      return null;
    }
  }
  async function entraSignIn() {
    try {
      await loadMsalScript();
    } catch (e) {
      renderLogin("Could not load Microsoft sign-in. Check your network and try again.");
      return;
    }
    const m = initMsal();
    if (!m) return;
    try {
      await m.initialize();
      const res = await m.loginPopup({ scopes: ["User.Read"], prompt: "select_account" });
      const email = res.account && res.account.username;
      if (!domainOk(email)) {
        await m.logoutPopup({ account: res.account });
        renderLogin("Access denied — only " + (AUTH.allowedDomains || []).join(", ") + ".");
        return;
      }
      route();
    } catch (e) {
      renderLogin("Sign-in was cancelled.");
    }
  }
  function demoSignIn(email) {
    if (!domainOk(email)) {
      renderLogin("Use a valid Align address (" + (AUTH.allowedDomains || []).join(", ") + ").");
      return;
    }
    const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    sessionStorage.setItem(LS.session, JSON.stringify({ name, email }));
    location.hash = "#/gallery";
    route();
  }
  function signOut() {
    sessionStorage.removeItem(LS.session);
    if (entraEnabled() && msal) {
      const acc = msal.getAllAccounts()[0];
      if (acc) { msal.logoutPopup({ account: acc }).catch(() => {}); }
    }
    location.hash = "";
    route();
  }
  function initials(name) {
    return (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  /* =============================================================
     SHARE LINKS
     ============================================================= */
  function b64urlEncode(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(escape(atob(str)));
  }
  function randKey() {
    return Array.from(crypto.getRandomValues(new Uint8Array(4))).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function makeShareUrl(id, days) {
    const k = randKey();
    const e = days ? Date.now() + days * 86400000 : 0;
    const token = b64urlEncode(JSON.stringify({ i: id, e: e, k: k }));
    // remember locally so the user can review/revoke later
    try {
      const m = JSON.parse(localStorage.getItem(LS.shares) || "{}");
      m[k] = { id: id, exp: e, created: Date.now() };
      localStorage.setItem(LS.shares, JSON.stringify(m));
    } catch (err) {}
    let base = CFG.shareBaseUrl || (location.origin + location.pathname);
    if (!base.endsWith("/") && !base.endsWith(".html")) base += "/";
    return { url: base + "#share=" + token, key: k, exp: e };
  }
  function readShare(token) {
    try {
      const p = JSON.parse(b64urlDecode(token));
      const revoked = (CFG.revokedKeys || []).includes(p.k);
      const expired = p.e && Date.now() > p.e;
      return { id: p.i, exp: p.e, key: p.k, revoked, expired, ok: !revoked && !expired };
    } catch (e) {
      return { ok: false, malformed: true };
    }
  }

  /* =============================================================
     ROUTER
     ============================================================= */
  const root = document.getElementById("root");

  function route() {
    const hash = location.hash || "";

    // public customer link — no auth
    if (hash.startsWith("#share=")) {
      const token = hash.slice("#share=".length);
      return renderShared(token);
    }

    // everything else requires auth
    if (!currentUser()) return renderLogin();

    const m = hash.match(/^#\/view\/(.+)$/);
    if (m) return renderViewer(decodeURIComponent(m[1]));

    return renderGallery();
  }

  /* =============================================================
     LOGIN
     ============================================================= */
  function renderLogin(error) {
    const msSvg =
      '<svg width="18" height="18" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>';
    const entra = entraConfigured();
    const demo = !entra;

    root.innerHTML = `
      <div class="login">
        <div class="login__brand">
          <div class="login__orb login__orb--o"></div>
          <div class="login__orb login__orb--p"></div>
          <div class="login__brandinner">
            <img src="assets/align-logo.png" alt="Align Consulting" />
            <h1>Portfolio</h1>
            <p>Interactive prototypes, client presentations and landing pages — all in one place.</p>
            <div class="login__stats">
              <div class="login__stat"><b>Live</b><span>Prototypes</span></div>
              <div class="login__stat"><b>Shareable</b><span>Per client</span></div>
              <div class="login__stat"><b>Entra ID</b><span>Secure access</span></div>
            </div>
          </div>
        </div>
        <div class="login__form">
          <div class="login__formbox">
            <h2>Sign in</h2>
            <p>Access for Align Consulting employees.</p>

            <button class="btn btn-gradient" id="msBtn" style="width:100%">
              ${msSvg} Sign in with Microsoft
            </button>

            ${demo ? `
              <div class="login__divider">or demo mode</div>
              <form id="demoForm">
                <div class="field">
                  <label class="field-label" for="demoEmail">Align email address</label>
                  <input class="input" id="demoEmail" type="email" placeholder="firstname@alignconsulting.se" autocomplete="email" />
                </div>
                <button class="btn btn-outline" type="submit" style="width:100%">Continue</button>
              </form>
            ` : ``}

            ${error ? `<div class="login__error">${esc(error)}</div>` : ``}

            <p class="login__note">
              ${entra
                ? "Protected with Microsoft Entra ID."
                : "Demo mode active — connect Microsoft Entra in <code>data/projects.js</code> for real sign-in."}
            </p>
          </div>
        </div>
      </div>`;

    document.getElementById("msBtn").addEventListener("click", () => {
      if (entra) entraSignIn();
      else renderLogin("Microsoft sign-in is not configured yet — use demo mode below, or set clientId in data/projects.js.");
    });
    const df = document.getElementById("demoForm");
    if (df) {
      df.addEventListener("submit", (e) => {
        e.preventDefault();
        demoSignIn(document.getElementById("demoEmail").value.trim());
      });
    }
  }

  /* =============================================================
     GALLERY
     ============================================================= */
  function filtered() {
    const q = state.q.trim().toLowerCase();
    return allProjects().filter((p) => {
      if (state.view === "archived" ? !p._archived : p._archived) return false;
      if (state.cat !== "all" && p.cat !== state.cat) return false;
      if (state.lang !== "all" && p.lang !== state.lang) return false;
      if (q && !((p.title || "") + " " + (p.desc || "")).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function renderGallery() {
    const user = currentUser();
    const all = allProjects();
    const active = all.filter((p) => !p._archived);
    const archived = all.filter((p) => p._archived);
    const scope = state.view === "archived" ? archived : active;
    const list = filtered();

    const catCounts = {};
    scope.forEach((p) => { catCounts[p.cat] = (catCounts[p.cat] || 0) + 1; });

    const chip = (id, label, count) =>
      `<button class="chip" data-cat="${id}" aria-pressed="${state.cat === id}">${esc(label)}${count != null ? `<span class="count">${count}</span>` : ""}</button>`;

    const langChip = (id, label) =>
      `<button class="chip" data-lang="${id}" aria-pressed="${state.lang === id}">${esc(label)}</button>`;

    root.innerHTML = `
      <header class="topbar">
        <img class="topbar__logo" src="assets/align-logo.png" alt="Align" />
        <span class="topbar__sep"></span>
        <span class="topbar__title">Portfolio</span>
        <span class="topbar__spacer"></span>
        <button class="btn btn-gradient btn-sm" id="addBtn">${svg("plus")} Add artifact</button>
        <span class="topbar__sep"></span>
        <div class="topbar__user">
          <div class="avatar">${initials(user.name)}</div>
          <span>${esc(user.name)}</span>
        </div>
        ${!(window.AlignGitHub && window.AlignGitHub.isDeployToken()) ? `<button class="btn btn-ghost btn-icon btn-sm" id="settingsBtn" title="GitHub settings">${svg("settings")}</button>` : ""}
        <button class="btn btn-ghost btn-icon btn-sm" id="outBtn" title="Sign out">${svg("logout")}</button>
      </header>

      <main class="page">
        <div class="page__head">
          <span class="eyebrow">Align Consulting</span>
          <h1>Client <span class="grad">presentations</span> &amp; prototypes</h1>
          <p>Browse artifacts, open them in fullscreen, or create a shareable link for a client.</p>
        </div>

        <div class="viewtabs">
          <button class="viewtab" data-view="active" aria-pressed="${state.view === "active"}">${svg("grid")} Active <span class="count">${active.length}</span></button>
          <button class="viewtab" data-view="archived" aria-pressed="${state.view === "archived"}">${svg("archive")} Archive <span class="count">${archived.length}</span></button>
        </div>

        <div class="toolbar">
          <div class="search">
            ${svg("search")}
            <input class="input" id="searchInput" type="search" placeholder="Search artifacts…" value="${esc(state.q)}" />
          </div>
          <span class="toolbar__spacer"></span>
          <div class="chips">${LANGS.map((l) => langChip(l, l)).join("")}${state.lang !== "all" ? `<button class="chip" data-lang="all" aria-pressed="false" title="Clear language filter">${svg("x")}</button>` : ""}</div>
        </div>

        <div class="chips" style="margin-bottom:24px">
          ${chip("all", "All", scope.length)}
          ${CATS.filter((c) => catCounts[c.id]).map((c) => chip(c.id, c.label, catCounts[c.id])).join("")}
        </div>

        ${state.view === "archived" ? `<p class="hint" style="margin:-8px 0 18px">Archived artifacts don't appear in the active view. Archive and delete status is saved in your browser — update <code>data/projects.js</code> to make it permanent for everyone.</p>` : ""}

        <div id="grid">${renderCards(list)}</div>
      </main>`;

    // wire toolbar
    document.getElementById("addBtn").addEventListener("click", openAddModal);
    const settingsBtn = document.getElementById("settingsBtn");
    if (settingsBtn) settingsBtn.addEventListener("click", openSettingsModal);
    document.getElementById("outBtn").addEventListener("click", signOut);
    const si = document.getElementById("searchInput");
    si.addEventListener("input", () => {
      state.q = si.value;
      const g = document.getElementById("grid");
      g.innerHTML = renderCards(filtered());
      wireCards();
    });
    root.querySelectorAll("[data-view]").forEach((b) =>
      b.addEventListener("click", () => { state.view = b.dataset.view; state.cat = "all"; renderGallery(); })
    );
    root.querySelectorAll("[data-cat]").forEach((b) =>
      b.addEventListener("click", () => { state.cat = b.dataset.cat; renderGallery(); })
    );
    root.querySelectorAll("[data-lang]").forEach((b) =>
      b.addEventListener("click", () => { state.lang = b.dataset.lang === state.lang ? "all" : b.dataset.lang; renderGallery(); })
    );
    wireCards();
    // pre-build previews for local multi-file artifacts so Open is instant
    list.filter((p) => p._multi && !multiCache[p.id]).forEach((p) => { hydrateMulti(p.id).catch(() => {}); });
  }

  function renderCards(list) {
    if (!list.length) {
      const archivedView = state.view === "archived";
      return `
        <div class="empty">
          ${svg(archivedView ? "archive" : "grid")}
          <h3>${archivedView ? "The archive is empty" : "No artifacts here yet"}</h3>
          <p>${archivedView ? "Artifacts you archive will show up here." : "Adjust the filters above, or add your first artifact."}</p>
          ${archivedView ? "" : `<button class="btn btn-gradient" id="emptyAdd">${svg("plus")} Add artifact</button>`}
        </div>`;
    }
    return `<div class="grid">${list.map(cardHtml).join("")}</div>`;
  }

  function fmtDate(d) {
    if (!d) return "";
    try {
      return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) { return d; }
  }

  function cardHtml(p) {
    const thumb = p.thumb
      ? `<img src="${esc(p.thumb)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
         <div class="card__thumb-fallback" style="display:none">${svg("file")}<span>No preview</span></div>`
      : `<div class="card__thumb-fallback">${svg("file")}<span>No preview</span></div>`;
    return `
      <article class="card ${p._archived ? "card--archived" : ""}" data-id="${esc(p.id)}">
        <div class="card__thumb" data-open="${esc(p.id)}">
          ${thumb}
          ${p._archived ? `<span class="card__archflag">${svg("archive")} Archived</span>` : ""}
          <div class="card__overlay"><span class="card__open">${svg("expand")} Open</span></div>
        </div>
        <button class="card__menu" data-menu="${esc(p.id)}" title="More actions">${svg("more")}</button>
        <div class="card__body">
          <div class="card__meta">
            <span class="badge badge--cat">${esc(CAT_LABEL(p.cat))}</span>
            <span class="badge badge--lang">${esc(p.lang || "")}</span>
            ${p._multi ? `<span class="badge badge--multi">${svg("files")} ${p.files || ""} files</span>` : ""}
            ${p._local ? `<span class="badge badge--local">Local</span>` : ""}
            <span class="card__date">${fmtDate(p.date)}</span>
          </div>
          <h3 class="card__title">${esc(p.title)}</h3>
          <p class="card__desc">${esc(p.desc || "")}</p>
        </div>
        <div class="card__actions">
          ${p._archived
            ? `<button class="btn btn-outline btn-sm" data-open="${esc(p.id)}">${svg("expand")} Open</button>
               <button class="btn btn-outline btn-sm" data-restore="${esc(p.id)}">${svg("restore")} Restore</button>`
            : `<button class="btn btn-outline btn-sm" data-open="${esc(p.id)}">${svg("expand")} Open</button>
               <button class="btn btn-outline btn-sm" data-share="${esc(p.id)}">${svg("link")} Share</button>`}
        </div>
      </article>`;
  }

  function wireCards() {
    root.querySelectorAll("[data-open]").forEach((el) =>
      el.addEventListener("click", () => { location.hash = "#/view/" + encodeURIComponent(el.dataset.open); })
    );
    root.querySelectorAll("[data-share]").forEach((el) =>
      el.addEventListener("click", (e) => { e.stopPropagation(); openShareModal(el.dataset.share); })
    );
    root.querySelectorAll("[data-restore]").forEach((el) =>
      el.addEventListener("click", (e) => { e.stopPropagation(); setArchived(el.dataset.restore, false); toast("Restored"); renderGallery(); })
    );
    root.querySelectorAll("[data-menu]").forEach((el) =>
      el.addEventListener("click", (e) => { e.stopPropagation(); openCardMenu(el, el.dataset.menu); })
    );
    const ea = document.getElementById("emptyAdd");
    if (ea) ea.addEventListener("click", openAddModal);
  }

  /* ---------- per-card actions menu ---------- */
  function openCardMenu(btn, id) {
    closeCardMenu();
    const p = findProject(id);
    if (!p) return;
    const menu = document.createElement("div");
    menu.className = "cardmenu";
    menu.innerHTML = `
      <button data-act="open">${svg("expand")} Open</button>
      ${p._archived ? "" : `<button data-act="share">${svg("link")} Share with client</button>`}
      ${p._archived
        ? `<button data-act="restore">${svg("restore")} Restore</button>`
        : `<button data-act="archive">${svg("archive")} Archive</button>`}
      <button data-act="delete" class="danger">${svg("trash")} Delete…</button>`;
    document.body.appendChild(menu);
    const r = btn.getBoundingClientRect();
    menu.style.top = (r.bottom + 6) + "px";
    menu.style.left = Math.min(r.left, window.innerWidth - 220) + "px";
    menu.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        const act = b.dataset.act;
        closeCardMenu();
        if (act === "open") location.hash = "#/view/" + encodeURIComponent(id);
        else if (act === "share") openShareModal(id);
        else if (act === "archive") { setArchived(id, true); toast("Archived"); renderGallery(); }
        else if (act === "restore") { setArchived(id, false); toast("Restored"); renderGallery(); }
        else if (act === "delete") confirmDelete(id, p);
      })
    );
    setTimeout(() => document.addEventListener("click", closeCardMenu, { once: true }), 0);
  }
  function closeCardMenu() {
    document.querySelectorAll(".cardmenu").forEach((m) => m.remove());
  }

  function confirmDelete(id, p) {
    const isLocal = loadLocalRaw().some((x) => x.id === id);
    openModal("Delete artifact", `
      <p style="margin:0 0 12px">Delete <b>${esc(p.title)}</b>?</p>
      <p class="hint" style="margin:0">
        ${isLocal
          ? "The artifact and its files will be permanently removed from this browser."
          : "The artifact will be hidden in this browser. To remove it permanently for everyone — delete its row in <code>data/projects.js</code> and commit."}
      </p>`,
      [
        { label: "Cancel", cls: "btn-outline", close: true },
        { label: "Delete", cls: "btn-danger", icon: "trash", id: "confirmDel" },
      ],
      (modal) => {
        modal.querySelector("#confirmDel").addEventListener("click", async () => {
          await deleteProject(id);
          closeModal();
          toast("Deleted");
          renderGallery();
        });
      });
  }

  /* =============================================================
     INTERNAL VIEWER
     ============================================================= */
  async function renderViewer(id) {
    const p = findProject(id);
    if (!p) { location.hash = "#/gallery"; return; }
    let src = p.file;
    if (p._multi && !src) {
      root.innerHTML = `<div class="viewer"><div class="viewer__bar"><button class="btn btn-ghost btn-sm" id="vBack">${svg("back")} Gallery</button></div><div class="loadwrap">${svg("files")}<span>Preparing preview…</span></div></div>`;
      const bb = document.getElementById("vBack");
      if (bb) bb.addEventListener("click", () => { location.hash = "#/gallery"; });
      try { src = await hydrateMulti(id); } catch (e) { src = ""; }
      if (location.hash !== "#/view/" + encodeURIComponent(id)) return; // navigated away
    }
    if (!src) {
      root.innerHTML = `<div class="viewer"><div class="viewer__bar"><button class="btn btn-ghost btn-sm" id="vBack">${svg("back")} Gallery</button></div><div class="loadwrap">${svg("warn")}<span>Could not load the artifact.</span></div></div>`;
      document.getElementById("vBack").addEventListener("click", () => { location.hash = "#/gallery"; });
      return;
    }
    root.innerHTML = `
      <div class="viewer">
        <div class="viewer__bar">
          <button class="btn btn-ghost btn-sm" id="vBack">${svg("back")} Gallery</button>
          <span class="topbar__sep"></span>
          <img class="viewer__logo" src="assets/align-logo.png" alt="Align" />
          <div>
            <div class="viewer__title">${esc(p.title)}</div>
            <div class="viewer__sub">${esc(CAT_LABEL(p.cat))} · ${esc(p.lang || "")}</div>
          </div>
          <span class="viewer__spacer"></span>
          <button class="btn btn-ghost btn-sm" id="vShare">${svg("link")} Share with client</button>
          <a class="btn btn-ghost btn-sm" id="vOpen" href="${esc(src)}" target="_blank" rel="noopener">${svg("external")} New tab</a>
        </div>
        <iframe class="viewer__frame" src="${esc(src)}" title="${esc(p.title)}"></iframe>
      </div>`;
    document.getElementById("vBack").addEventListener("click", () => { location.hash = "#/gallery"; });
    document.getElementById("vShare").addEventListener("click", () => openShareModal(id));
  }

  /* =============================================================
     SHARED (customer) VIEW — public, no auth
     ============================================================= */
  async function renderShared(token) {
    const s = readShare(token);
    if (!s.ok) {
      const reason = s.malformed ? "The link is invalid." : s.revoked ? "This link has been disabled." : "This link has expired.";
      return renderGate(reason, s);
    }
    const p = findProject(s.id);
    if (!p) return renderGate("The artifact could not be found.", s);

    // count this open (per-link + per-project aggregate)
    Counter.hit("link:" + s.key);
    Counter.hit("proj:" + s.id);

    let src = p.file;
    if (p._multi && !src) {
      root.innerHTML = `<div class="viewer viewer--shared"><div class="loadwrap">${svg("files")}<span>Loading…</span></div></div>`;
      try { src = await hydrateMulti(s.id); } catch (e) { src = ""; }
    }
    if (!src) return renderGate("The artifact could not be displayed.", s);

    const expTxt = s.exp
      ? "Link valid until " + new Date(s.exp).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "";

    root.innerHTML = `
      <div class="viewer viewer--shared">
        <div class="viewer__bar">
          <img class="viewer__logo" src="assets/align-logo.png" alt="Align" />
          <div>
            <div class="viewer__title">${esc(p.title)}</div>
            <div class="viewer__sub sharebanner">Presented by Align Consulting</div>
          </div>
          <span class="viewer__spacer"></span>
          ${expTxt ? `<span class="viewer__expnote">${svg("clock")} ${esc(expTxt)}</span>` : ""}
          <a class="btn btn-ghost btn-sm" href="${esc(src)}" target="_blank" rel="noopener">${svg("expand")} Fullscreen</a>
        </div>
        <iframe class="viewer__frame" src="${esc(src)}" title="${esc(p.title)}"></iframe>
      </div>`;
  }

  function renderGate(reason, s) {
    root.innerHTML = `
      <div class="gate">
        <div class="gate__box">
          <img src="assets/align-logo.png" alt="Align Consulting" />
          <div class="gate__icon">${svg(s && s.expired ? "clock" : "lock")}</div>
          <h2>${s && s.expired ? "The link has expired" : s && s.revoked ? "The link is no longer active" : "No access"}</h2>
          <p>${esc(reason)} Contact your Align Consulting contact for a new link.</p>
        </div>
      </div>`;
  }

  /* =============================================================
     SHARE MODAL
     ============================================================= */
  const EXPIRY_OPTS = [
    { d: 7, label: "7 days" },
    { d: 30, label: "30 days" },
    { d: 90, label: "90 days" },
    { d: 0, label: "Never" },
  ];

  function openShareModal(id) {
    const p = findProject(id);
    if (!p) return;
    let days = 30;
    let made = null;

    function body() {
      return `
        <p class="hint" style="margin-top:0;margin-bottom:16px">
          Create a link that gives the client access to <b>this artifact only</b> — no sign-in required.
        </p>
        <div class="field">
          <label class="field-label">Artifact</label>
          <input class="input" value="${esc(p.title)}" readonly />
        </div>
        <div class="field">
          <label class="field-label">Link expires after</label>
          <div class="seg" id="expSeg">
            ${EXPIRY_OPTS.map((o) => `<button data-d="${o.d}" aria-pressed="${o.d === days}">${o.label}</button>`).join("")}
          </div>
        </div>
        <div id="shareResult">${made ? resultHtml(made) : ""}</div>
        <div id="linksSection" style="margin-top:20px;border-top:1px solid hsl(var(--border));padding-top:18px"></div>`;
    }
    function resultHtml(r) {
      return `
        <div class="field" style="margin-bottom:8px">
          <label class="field-label">Shareable link</label>
          <div class="codebox">
            <input class="input" id="shareUrl" value="${esc(r.url)}" readonly />
            <button class="btn btn-gradient btn-sm" id="copyShare">${svg("copy")} Copy</button>
          </div>
        </div>
        <p class="hint">
          ${r.exp ? "Valid until <b>" + new Date(r.exp).toLocaleDateString("en-GB") + "</b>. " : "No expiry. "}
          Key <code>${r.key}</code> — to disable the link early, add the key to
          <code>revokedKeys</code> in <code>data/projects.js</code> and commit.
        </p>`;
    }

    openModal("Share with client", body(), [
      { label: "Done", cls: "btn-outline", close: true },
      { label: "Create link", cls: "btn-gradient", icon: "link", id: "doShare" },
    ], (modal) => {
      modal.querySelectorAll("#expSeg button").forEach((b) =>
        b.addEventListener("click", () => {
          days = Number(b.dataset.d);
          modal.querySelectorAll("#expSeg button").forEach((x) => x.setAttribute("aria-pressed", x === b));
        })
      );
      wireShareGen(modal);
      renderLinks(modal, id);
    });

    function wireShareGen(modal) {
      const btn = modal.querySelector("#doShare");
      btn.addEventListener("click", () => {
        made = makeShareUrl(id, days);
        modal.querySelector("#shareResult").innerHTML = resultHtml(made);
        const cp = modal.querySelector("#copyShare");
        cp.addEventListener("click", () => {
          const inp = modal.querySelector("#shareUrl");
          inp.select();
          navigator.clipboard.writeText(inp.value).then(() => toast("Link copied"));
        });
        btn.textContent = "Create new link";
        renderLinks(modal, id);
      });
    }

    async function renderLinks(modal, pid) {
      const wrap = modal.querySelector("#linksSection");
      if (!wrap) return;
      const cloud = ANALYTICS.mode === "firebase" && ANALYTICS.firebaseUrl;
      let shares = {};
      try { shares = JSON.parse(localStorage.getItem(LS.shares) || "{}"); } catch (e) {}
      const keys = Object.keys(shares)
        .filter((k) => shares[k].id === pid)
        .sort((a, b) => (shares[b].created || 0) - (shares[a].created || 0));

      wrap.innerHTML = `
        <div class="links-head">
          <h4>Created links &amp; opens</h4>
          <span class="links-total" id="totalViews">…</span>
        </div>
        <div id="linkRows">${keys.length ? keys.map(() => `<div class="linkrow"><span class="views zero">…</span></div>`).join("") : `<p class="hint" style="margin:0">No links created yet.</p>`}</div>
        ${cloud ? "" : `<p class="hint">Local mode — the counter only shows opens on <b>this device</b>. Enable Firebase in <code>data/projects.js</code> for real, global numbers.</p>`}`;

      const total = await Counter.get("proj:" + pid);
      const tv = modal.querySelector("#totalViews");
      if (tv) tv.innerHTML = total == null ? "Statistics unavailable" : `Total <b>${total}</b> open${total === 1 ? "" : "s"}`;

      if (!keys.length) return;
      const rows = await Promise.all(keys.map(async (k) => {
        const meta = shares[k];
        const c = await Counter.get("link:" + k);
        const revoked = (CFG.revokedKeys || []).includes(k);
        const expired = meta.exp && Date.now() > meta.exp;
        const status = revoked ? "Disabled" : expired ? "Expired" : "Active";
        const stClass = revoked || expired ? "off" : "ok";
        const created = meta.created ? new Date(meta.created).toLocaleDateString("en-GB") : "";
        const exp = meta.exp ? "until " + new Date(meta.exp).toLocaleDateString("en-GB") : "no expiry";
        const cnt = c == null ? "–" : c;
        return `
          <div class="linkrow">
            <span class="st ${stClass}">${status}</span>
            <span class="info">Created ${created} · ${exp}<br><b>${k}</b></span>
            <span class="views ${c ? "" : "zero"}">${svg("eye")} ${cnt}</span>
          </div>`;
      }));
      const rowsEl = modal.querySelector("#linkRows");
      if (rowsEl) rowsEl.innerHTML = rows.join("");
    }
  }

  /* =============================================================
     SETTINGS MODAL (GitHub token)
     ============================================================= */
  function openSettingsModal() {
    const gh = window.AlignGitHub;
    const ghCfg = (window.ALIGN_CONFIG || {}).github || {};
    const hasGh = !!(ghCfg.repo && ghCfg.branch);
    const hasToken = gh && gh.getToken();

    const body = `
      <p class="hint" style="margin-bottom:16px">Configure the GitHub publish token. The token is stored only in your browser and is never sent to anyone except GitHub.</p>
      ${!hasGh ? `<div class="login__error">GitHub is not configured — add <code>repo</code> and <code>branch</code> to <code>ALIGN_CONFIG.github</code> in <code>data/projects.js</code>.</div>` : `
      <div class="field">
        <label class="field-label" for="ghToken">Personal Access Token (fine-grained)</label>
        <input class="input" id="ghToken" type="password" placeholder="github_pat_…"
          value="${hasToken ? gh.getToken() : ""}" autocomplete="off" spellcheck="false" />
        <p class="hint" style="margin-top:6px">
          Create one at <b>github.com → Settings → Developer settings → Fine-grained tokens</b>.<br>
          Select repo <code>${ghCfg.repo || ""}</code> · permission: <b>Contents — Read and write</b>.
        </p>
      </div>
      ${hasToken ? `<button class="btn btn-outline btn-sm" id="clearTokenBtn" style="margin-top:4px">${svg("trash")} Remove saved token</button>` : ""}
      `}`;

    openModal("GitHub settings", body, [
      { label: "Cancel", cls: "btn-outline", close: true },
      ...(hasGh ? [{ label: "Save token", cls: "btn-gradient", icon: "check", id: "saveTokenBtn" }] : []),
    ], (modal) => {
      const clearBtn = modal.querySelector("#clearTokenBtn");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          gh.clearToken();
          toast("Token removed");
          closeModal();
          renderGallery();
        });
      }
      const saveBtn = modal.querySelector("#saveTokenBtn");
      if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
          const input = modal.querySelector("#ghToken");
          const val = (input.value || "").trim();
          if (!val) { toast("Enter a token first", true); return; }
          saveBtn.disabled = true;
          saveBtn.textContent = "Verifying…";
          try {
            await gh.verifyToken(val);
          } catch (e) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = svg("check") + "Save token";
            toast(e.message, true);
            return;
          }
          gh.saveToken(val);
          toast("Token saved — you can now publish artifacts");
          closeModal();
          renderGallery();
        });
      }
    });
  }

  /* =============================================================
     ADD PROJECT MODAL
     ============================================================= */
  function slugify(s) {
    return (s || "artifact").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "artifact";
  }

  function openAddModal() {
    let mode = "upload"; // upload | url
    let files = null;      // [{path, blob}] uploaded bundle
    let entryPath = null;  // chosen entry HTML within the bundle
    let busy = false;
    let thumbData = null;

    const today = new Date().toISOString().slice(0, 10);

    function uploadFieldHtml() {
      if (busy) {
        return `<label class="field-label">Files</label>
          <div class="dropzone"><div class="spin"></div><b>Reading files…</b></div>`;
      }
      if (files && files.length) {
        const htmls = AlignFiles.htmlFiles(files);
        const shown = files.slice(0, 6).map((f) => `<li>${esc(f.path)}</li>`).join("");
        const more = files.length > 6 ? `<li>+${files.length - 6} more…</li>` : "";
        return `<label class="field-label">Uploaded files</label>
          <div class="dropzone dropzone--filled" id="uplDrop">
            ${svg("check")}<b>${files.length} files loaded</b>
            <small>Click or drop to replace</small>
          </div>
          <ul class="filelist">${shown}${more}</ul>
          ${htmls.length > 1 ? `
            <label class="field-label" for="entrySel" style="margin-top:10px">Start page (entry)</label>
            <select class="select" id="entrySel">${htmls.map((h) => `<option value="${esc(h.path)}" ${AlignFiles.norm(h.path) === AlignFiles.norm(entryPath) ? "selected" : ""}>${esc(h.path)}</option>`).join("")}</select>
          ` : `<p class="hint">Start page: <code>${esc(entryPath || "")}</code></p>`}
          <input type="file" id="uplInput" multiple hidden />
          <input type="file" id="uplDir" webkitdirectory hidden />`;
      }
      return `<label class="field-label">Files (Claude Design export)</label>
        <div class="dropzone" id="uplDrop">
          ${svg("folder")}
          <b>Drop a folder or .zip here</b>
          <small>…or choose below. All files (HTML, CSS, JS, images) are included.</small>
        </div>
        <div class="upl-btns">
          <button type="button" class="btn btn-outline btn-sm" id="pickDir">${svg("folder")} Choose folder</button>
          <button type="button" class="btn btn-outline btn-sm" id="pickFiles">${svg("files")} Choose files</button>
        </div>
        <input type="file" id="uplInput" multiple hidden />
        <input type="file" id="uplDir" webkitdirectory hidden />`;
    }

    function body() {
      return `
        <div class="seg" id="modeSeg">
          <button data-m="upload" aria-pressed="${mode === "upload"}">Upload files / folder</button>
          <button data-m="url" aria-pressed="${mode === "url"}">Link to URL</button>
        </div>

        <div class="row2">
          <div class="field">
            <label class="field-label" for="fTitle">Title</label>
            <input class="input" id="fTitle" placeholder="e.g. Q3 Client Presentation" />
          </div>
          <div class="field">
            <label class="field-label" for="fDate">Date</label>
            <input class="input" id="fDate" type="date" value="${today}" />
          </div>
        </div>

        <div class="row2">
          <div class="field">
            <label class="field-label" for="fCat">Category</label>
            <select class="select" id="fCat">${CATS.map((c) => `<option value="${c.id}">${c.label}</option>`).join("")}</select>
          </div>
          <div class="field">
            <label class="field-label" for="fLang">Language / market</label>
            <select class="select" id="fLang">${LANGS.map((l) => `<option>${l}</option>`).join("")}</select>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="fDesc">Short description</label>
          <input class="input" id="fDesc" placeholder="One sentence about the artifact" />
        </div>

        <div class="field" id="srcField">
          ${mode === "upload" ? uploadFieldHtml() : `
            <label class="field-label" for="fUrl">URL</label>
            <input class="input" id="fUrl" placeholder="https://…" />
            <p class="hint">Link to an external page (e.g. another GitHub Pages site).</p>
          `}
        </div>

        <div class="field">
          <label class="field-label">Preview image (screenshot)</label>
          <div class="dropzone ${thumbData ? "dropzone--filled" : ""}" id="thumbDrop">
            ${thumbData ? `<img src="${thumbData}" style="max-height:90px;border-radius:6px;margin:0 auto 8px" />` : svg("image")}
            <b>${thumbData ? "Image selected" : "Drop an image here or click"}</b>
            <small>${thumbData ? "Click to replace image" : "PNG/JPG — shown on the card (optional)"}</small>
          </div>
          <input type="file" id="thumbInput" accept="image/*" hidden />
        </div>

        <p class="hint">${window.AlignGitHub && window.AlignGitHub.isConfigured()
          ? "Files will be published directly to GitHub and become visible to everyone once GitHub Pages redeploys (~30 s)."
          : "Saved directly in your browser (multi-file artifacts are stored securely on-device) so you can show it now. Use <b>Export for GitHub</b> to add it permanently to the gallery for everyone."
        }</p>`;
    }

    const ghConfigured = window.AlignGitHub && window.AlignGitHub.isConfigured();

    openModal("Add artifact", body(), [
      { label: "Cancel", cls: "btn-outline", close: true },
      ...(ghConfigured ? [] : [{ label: "Export for GitHub", cls: "btn-outline", icon: "external", id: "exportBtn" }]),
      { label: ghConfigured ? "Publish to GitHub" : "Save locally", cls: "btn-gradient", icon: ghConfigured ? "upload" : "check", id: "saveBtn" },
    ], wire);

    function wire(modal) {
      function rebuild() {
        modal.querySelector(".modal__body").innerHTML = body();
        wireUpload(modal);
        wireThumb(modal);
      }
      modal.querySelectorAll("#modeSeg button").forEach((b) =>
        b.addEventListener("click", () => { mode = b.dataset.m; rebuild(); })
      );
      wireUpload(modal);
      wireThumb(modal);

      modal.querySelector("#saveBtn").addEventListener("click", async () => {
        const d = collect(modal);
        if (!d) return;

        if (window.AlignGitHub && window.AlignGitHub.isConfigured() && mode === "upload") {
          // --- GitHub publish path ---
          if (!files || !files.length) { toast("Upload files first", true); return; }
          const btn = modal.querySelector("#saveBtn");
          btn.disabled = true;
          const statusEl = document.createElement("p");
          statusEl.className = "hint";
          statusEl.style.marginTop = "8px";
          btn.parentElement.appendChild(statusEl);
          try {
            await window.AlignGitHub.upload({
              files,
              entryPath,
              entry: d,
              thumbDataUrl: thumbData || null,
              onProgress(done, total, msg) {
                statusEl.textContent = "Uploading… (" + done + "/" + total + ") " + msg;
              },
            });
          } catch (e) {
            btn.disabled = false;
            statusEl.remove();
            toast("GitHub upload failed: " + e.message, true);
            return;
          }
          closeModal();
          toast("Published to GitHub — live in ~30 s");
          renderGallery();
          return;
        }

        // --- local save path ---
        if (mode === "upload") {
          if (!files || !files.length) { toast("Upload files first", true); return; }
          d._local = true; d._multi = true; d.entry = AlignFiles.norm(entryPath); d.files = files.length;
          try { await AlignFiles.save(d.id, files, entryPath); }
          catch (e) { toast("Could not save the files locally", true); return; }
        } else {
          if (!d.file) { toast("Enter a URL first", true); return; }
          d._local = true;
        }
        d.thumb = thumbData || "";
        const local = loadLocalRaw();
        local.unshift(d);
        saveLocal(local);
        closeModal();
        toast("Artifact saved locally");
        renderGallery();
      });

      modal.querySelector("#exportBtn").addEventListener("click", async () => {
        const d = collect(modal);
        if (!d) return;
        if (mode === "upload" && (!files || !files.length)) { toast("Upload files first", true); return; }
        if (mode === "url" && !d.file) { toast("Enter a URL first", true); return; }
        await showExport(modal, d);
      });
    }

    function wireUpload(modal) {
      if (mode !== "upload") return;
      const drop = modal.querySelector("#uplDrop");
      const inp = modal.querySelector("#uplInput");
      const dir = modal.querySelector("#uplDir");
      if (drop) {
        drop.addEventListener("click", () => inp && inp.click());
        dndBundle(drop, (dt) => ingestFiles(modal, () => AlignFiles.fromDataTransfer(dt)));
      }
      if (inp) inp.addEventListener("change", () => inp.files.length && ingestFiles(modal, () => AlignFiles.ingest(inp.files)));
      if (dir) dir.addEventListener("change", () => dir.files.length && ingestFiles(modal, () => AlignFiles.ingest(dir.files)));
      const pd = modal.querySelector("#pickDir"); if (pd) pd.addEventListener("click", () => dir && dir.click());
      const pf = modal.querySelector("#pickFiles"); if (pf) pf.addEventListener("click", () => inp && inp.click());
      const es = modal.querySelector("#entrySel"); if (es) es.addEventListener("change", () => { entryPath = es.value; });
    }

    function wireThumb(modal) {
      const tDrop = modal.querySelector("#thumbDrop");
      const tInput = modal.querySelector("#thumbInput");
      if (tDrop && tInput) {
        tDrop.addEventListener("click", () => tInput.click());
        dnd(tDrop, (file) => readThumb(file, modal));
        tInput.addEventListener("change", () => tInput.files[0] && readThumb(tInput.files[0], modal));
      }
    }

    async function ingestFiles(modal, getter) {
      busy = true; refreshSrc(modal);
      try {
        const f = await getter();
        if (!f || !f.length) { toast("No files found", true); }
        else if (!AlignFiles.htmlFiles(f).length) { toast("No HTML file found in the upload", true); }
        else { files = f; entryPath = AlignFiles.pickEntry(f); }
      } catch (e) { toast("Could not read the files", true); }
      busy = false; refreshSrc(modal);
    }

    function readThumb(file, modal) {
      const r = new FileReader();
      r.onload = () => { thumbData = r.result; refreshThumb(modal); };
      r.readAsDataURL(file);
    }
    function refreshSrc(modal) {
      const f = modal.querySelector("#srcField");
      if (f && mode === "upload") { f.innerHTML = uploadFieldHtml(); wireUpload(modal); }
    }
    function refreshThumb(modal) {
      const drop = modal.querySelector("#thumbDrop");
      drop.classList.add("dropzone--filled");
      drop.innerHTML = `<img src="${thumbData}" style="max-height:90px;border-radius:6px;margin:0 auto 8px" /><b>Image selected</b><small>Click to replace image</small>`;
      wireThumb(modal);
    }

    function collect(modal) {
      const title = modal.querySelector("#fTitle").value.trim();
      if (!title) { toast("Enter a title", true); return null; }
      const id = slugify(title) + "-" + randKey().slice(0, 4);
      const obj = {
        id,
        title,
        cat: modal.querySelector("#fCat").value,
        lang: modal.querySelector("#fLang").value,
        desc: modal.querySelector("#fDesc").value.trim(),
        date: modal.querySelector("#fDate").value || today,
      };
      if (mode === "url") obj.file = (modal.querySelector("#fUrl").value || "").trim();
      return obj;
    }

    async function showExport(modal, d) {
      const slug = slugify(d.title);
      const isMulti = mode === "upload";
      const filePath = isMulti ? "projects/" + slug + "/" + AlignFiles.norm(entryPath) : d.file;
      const thumbPath = thumbData ? "thumbnails/" + slug + ".png" : "";
      const entry = {
        id: slug,
        title: d.title,
        cat: d.cat,
        lang: d.lang,
        desc: d.desc,
        file: filePath,
        thumb: thumbPath,
        date: d.date,
      };
      const snippet = JSON.stringify(entry, null, 2)
        .replace(/^{/, "  {")
        .replace(/\n}/, "\n  },")
        .replace(/\n/g, "\n  ").replace(/^ {2}/, "");

      // trigger downloads
      if (isMulti && files) {
        try { download(slug + ".zip", await AlignFiles.zipFiles(files)); }
        catch (e) { toast("Could not build the zip file", true); return; }
      }
      if (thumbData) {
        download(slug + ".png", dataUrlToBlob(thumbData));
      }

      const body = modal.querySelector(".modal__body");
      body.innerHTML = `
        <div class="export-block">
          <h4>${svg("check")} Files downloaded</h4>
          <ol>
            ${isMulti
              ? `<li>Unzip <code>${slug}.zip</code> into a <b>new folder</b> <code>projects/${slug}/</code> in the repo (so that <code>${esc(filePath)}</code> exists).</li>`
              : `<li>Using external URL: <code>${esc(filePath)}</code></li>`}
            ${thumbData ? `<li>Put <code>${slug}.png</code> in the <code>thumbnails/</code> folder.</li>` : `<li>No preview image — the card shows a placeholder.</li>`}
            <li>Paste the row below into the <code>ALIGN_PROJECTS</code> list in <code>data/projects.js</code>.</li>
            <li>Commit and push — the artifact becomes visible to everyone.</li>
          </ol>
        </div>
        <pre class="snippet" id="snip">${esc(snippet)}</pre>
        <button class="btn btn-outline btn-sm" id="copySnip" style="margin-top:10px">${svg("copy")} Copy manifest row</button>`;
      modal.querySelector(".modal__foot").innerHTML = `<button class="btn btn-gradient" data-close>Done</button>`;
      modal.querySelector("[data-close]").addEventListener("click", closeModal);
      modal.querySelector("#copySnip").addEventListener("click", () => {
        navigator.clipboard.writeText(snippet).then(() => toast("Manifest row copied"));
      });
    }
  }

  /* ---------- drag & drop helper ---------- */
  function dndBundle(zone, onDrop) {
    ["dragenter", "dragover"].forEach((ev) =>
      zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add("drag"); })
    );
    ["dragleave", "drop"].forEach((ev) =>
      zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove("drag"); })
    );
    zone.addEventListener("drop", (e) => { if (e.dataTransfer) onDrop(e.dataTransfer); });
  }
  function dnd(zone, onFile) {
    ["dragenter", "dragover"].forEach((ev) =>
      zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add("drag"); })
    );
    ["dragleave", "drop"].forEach((ev) =>
      zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove("drag"); })
    );
    zone.addEventListener("drop", (e) => {
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    });
  }

  /* ---------- download helpers ---------- */
  function download(name, blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function dataUrlToBlob(dataUrl) {
    const [meta, b64] = dataUrl.split(",");
    const mime = (meta.match(/:(.*?);/) || [])[1] || "image/png";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  /* =============================================================
     MODAL + TOAST primitives
     ============================================================= */
  function openModal(title, bodyHtml, actions, onMount) {
    closeModal();
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__head">
          <h2>${esc(title)}</h2>
          <button class="modal__close" data-close>${svg("x")}</button>
        </div>
        <div class="modal__body">${bodyHtml}</div>
        <div class="modal__foot">
          ${actions.map((a) => `<button class="btn ${a.cls}" ${a.id ? `id="${a.id}"` : ""} ${a.close ? "data-close" : ""}>${a.icon ? svg(a.icon) : ""}${esc(a.label)}</button>`).join("")}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
    overlay.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
    document.addEventListener("keydown", escClose);
    if (onMount) onMount(overlay.querySelector(".modal"));
  }
  function escClose(e) { if (e.key === "Escape") closeModal(); }
  function closeModal() {
    document.querySelectorAll(".modal-overlay").forEach((o) => o.remove());
    document.removeEventListener("keydown", escClose);
  }

  let toastTimer = null;
  function toast(msg, isErr) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.innerHTML = (isErr ? svg("warn") : svg("check")) + `<span>${esc(msg)}</span>`;
    if (isErr) t.querySelector("svg").style.color = "hsl(0 84% 60%)";
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- boot ---------- */
  window.addEventListener("hashchange", route);
  if (entraConfigured() && !location.hash.startsWith("#share=")) {
    loadMsalScript()
      .then(() => initMsal().initialize())
      .then(route)
      .catch(route);
  } else {
    route();
  }
})();
