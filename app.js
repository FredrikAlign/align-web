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
  };
  const svg = (name, cls) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${cls ? ` class="${cls}"` : ""}>${I[name] || ""}</svg>`;

  const CATS = [
    { id: "landningssida", label: "Landningssidor" },
    { id: "prototyp", label: "Prototyper" },
    { id: "presentation", label: "Presentationer" },
    { id: "dashboard", label: "Dashboards" },
    { id: "rapport", label: "Rapporter" },
    { id: "ovrigt", label: "Övrigt" },
  ];
  const CAT_LABEL = (id) => (CATS.find((c) => c.id === id) || { label: id }).label;
  const LANGS = ["SWE", "NOR", "ENG"];

  const LS = {
    session: "alignportfolio_session",
    local: "alignportfolio_local_projects",
    shares: "alignportfolio_share_keys",
  };

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- state ---------- */
  let state = {
    cat: "all",
    lang: "all",
    q: "",
  };
  const blobUrls = {}; // id -> blobURL for local artifacts

  /* ---------- local projects ---------- */
  function loadLocal() {
    try {
      const arr = JSON.parse(localStorage.getItem(LS.local) || "[]");
      arr.forEach((p) => {
        if (p._html && !blobUrls[p.id]) {
          blobUrls[p.id] = URL.createObjectURL(new Blob([p._html], { type: "text/html" }));
        }
        if (p._html) p.file = blobUrls[p.id];
      });
      return arr;
    } catch (e) {
      return [];
    }
  }
  function saveLocal(arr) {
    localStorage.setItem(LS.local, JSON.stringify(arr));
  }
  function allProjects() {
    const baked = (window.ALIGN_PROJECTS || []).map((p) => ({ ...p }));
    const local = loadLocal();
    // local first (most recently added on top), then baked by date desc
    baked.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return [...local, ...baked];
  }
  function findProject(id) {
    return allProjects().find((p) => p.id === id);
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
      renderLogin("Kunde inte ladda Microsoft-inloggning. Kontrollera nätverket och försök igen.");
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
        renderLogin("Åtkomst nekad — endast " + (AUTH.allowedDomains || []).join(", ") + ".");
        return;
      }
      route();
    } catch (e) {
      renderLogin("Inloggningen avbröts.");
    }
  }
  function demoSignIn(email) {
    if (!domainOk(email)) {
      renderLogin("Använd en giltig Align-adress (" + (AUTH.allowedDomains || []).join(", ") + ").");
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
            <h1>Design&shy;portfölj</h1>
            <p>Interaktiva prototyper, kundpresentationer och landningssidor — samlade på ett ställe.</p>
            <div class="login__stats">
              <div class="login__stat"><b>Live</b><span>Prototyper</span></div>
              <div class="login__stat"><b>Delbart</b><span>Per kund</span></div>
              <div class="login__stat"><b>Entra ID</b><span>Säker access</span></div>
            </div>
          </div>
        </div>
        <div class="login__form">
          <div class="login__formbox">
            <h2>Logga in</h2>
            <p>Åtkomst för medarbetare på Align Consulting.</p>

            <button class="btn btn-gradient" id="msBtn" style="width:100%">
              ${msSvg} Logga in med Microsoft
            </button>

            ${demo ? `
              <div class="login__divider">eller demo-läge</div>
              <form id="demoForm">
                <div class="field">
                  <label class="field-label" for="demoEmail">Align-e-postadress</label>
                  <input class="input" id="demoEmail" type="email" placeholder="fornamn@alignconsulting.se" autocomplete="email" />
                </div>
                <button class="btn btn-outline" type="submit" style="width:100%">Fortsätt</button>
              </form>
            ` : ``}

            ${error ? `<div class="login__error">${esc(error)}</div>` : ``}

            <p class="login__note">
              ${entra
                ? "Skyddad med Microsoft Entra ID."
                : "Demo-läge aktivt — koppla in Microsoft Entra i <code>data/projects.js</code> för riktig inloggning."}
            </p>
          </div>
        </div>
      </div>`;

    document.getElementById("msBtn").addEventListener("click", () => {
      if (entra) entraSignIn();
      else renderLogin("Microsoft-inloggning är inte konfigurerad ännu — använd demo-läget nedan, eller fyll i clientId i data/projects.js.");
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
      if (state.cat !== "all" && p.cat !== state.cat) return false;
      if (state.lang !== "all" && p.lang !== state.lang) return false;
      if (q && !((p.title || "") + " " + (p.desc || "")).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function renderGallery() {
    const user = currentUser();
    const all = allProjects();
    const list = filtered();

    const catCounts = {};
    all.forEach((p) => { catCounts[p.cat] = (catCounts[p.cat] || 0) + 1; });

    const chip = (id, label, count) =>
      `<button class="chip" data-cat="${id}" aria-pressed="${state.cat === id}">${esc(label)}${count != null ? `<span class="count">${count}</span>` : ""}</button>`;

    const langChip = (id, label) =>
      `<button class="chip" data-lang="${id}" aria-pressed="${state.lang === id}">${esc(label)}</button>`;

    root.innerHTML = `
      <header class="topbar">
        <img class="topbar__logo" src="assets/align-logo.png" alt="Align" />
        <span class="topbar__sep"></span>
        <span class="topbar__title">Designportfölj</span>
        <span class="topbar__spacer"></span>
        <button class="btn btn-gradient btn-sm" id="addBtn">${svg("plus")} Lägg till alster</button>
        <span class="topbar__sep"></span>
        <div class="topbar__user">
          <div class="avatar">${initials(user.name)}</div>
          <span>${esc(user.name)}</span>
        </div>
        <button class="btn btn-ghost btn-icon btn-sm" id="outBtn" title="Logga ut">${svg("logout")}</button>
      </header>

      <main class="page">
        <div class="page__head">
          <span class="eyebrow">Align Consulting</span>
          <h1>Kund <span class="grad">Presentationer</span> &amp; prototyper</h1>
          <p>Bläddra bland alster, öppna dem i helskärm, eller skapa en delbar länk till en kund.</p>
        </div>

        <div class="toolbar">
          <div class="search">
            ${svg("search")}
            <input class="input" id="searchInput" type="search" placeholder="Sök bland alster…" value="${esc(state.q)}" />
          </div>
          <span class="toolbar__spacer"></span>
          <div class="chips">${LANGS.map((l) => langChip(l, l)).join("")}${state.lang !== "all" ? `<button class="chip" data-lang="all" aria-pressed="false" title="Rensa språkfilter">${svg("x")}</button>` : ""}</div>
        </div>

        <div class="chips" style="margin-bottom:24px">
          ${chip("all", "Alla", all.length)}
          ${CATS.filter((c) => catCounts[c.id]).map((c) => chip(c.id, c.label, catCounts[c.id])).join("")}
        </div>

        <div id="grid">${renderCards(list)}</div>
      </main>`;

    // wire toolbar
    document.getElementById("addBtn").addEventListener("click", openAddModal);
    document.getElementById("outBtn").addEventListener("click", signOut);
    const si = document.getElementById("searchInput");
    si.addEventListener("input", () => {
      state.q = si.value;
      const g = document.getElementById("grid");
      g.innerHTML = renderCards(filtered());
      wireCards();
    });
    root.querySelectorAll("[data-cat]").forEach((b) =>
      b.addEventListener("click", () => { state.cat = b.dataset.cat; renderGallery(); })
    );
    root.querySelectorAll("[data-lang]").forEach((b) =>
      b.addEventListener("click", () => { state.lang = b.dataset.lang === state.lang ? "all" : b.dataset.lang; renderGallery(); })
    );
    wireCards();
  }

  function renderCards(list) {
    if (!list.length) {
      return `
        <div class="empty">
          ${svg("grid")}
          <h3>Inga alster här ännu</h3>
          <p>Justera filtren ovan, eller lägg till ditt första alster.</p>
          <button class="btn btn-gradient" id="emptyAdd">${svg("plus")} Lägg till alster</button>
        </div>`;
    }
    return `<div class="grid">${list.map(cardHtml).join("")}</div>`;
  }

  function fmtDate(d) {
    if (!d) return "";
    try {
      return new Date(d + "T00:00:00").toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) { return d; }
  }

  function cardHtml(p) {
    const thumb = p.thumb
      ? `<img src="${esc(p.thumb)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
         <div class="card__thumb-fallback" style="display:none">${svg("file")}<span>Förhandsvisning saknas</span></div>`
      : `<div class="card__thumb-fallback">${svg("file")}<span>Förhandsvisning saknas</span></div>`;
    return `
      <article class="card" data-id="${esc(p.id)}">
        <div class="card__thumb" data-open="${esc(p.id)}">
          ${thumb}
          <div class="card__overlay"><span class="card__open">${svg("expand")} Öppna</span></div>
        </div>
        <div class="card__body">
          <div class="card__meta">
            <span class="badge badge--cat">${esc(CAT_LABEL(p.cat))}</span>
            <span class="badge badge--lang">${esc(p.lang || "")}</span>
            ${p._local ? `<span class="badge badge--local">Lokal</span>` : ""}
            <span class="card__date">${fmtDate(p.date)}</span>
          </div>
          <h3 class="card__title">${esc(p.title)}</h3>
          <p class="card__desc">${esc(p.desc || "")}</p>
        </div>
        <div class="card__actions">
          <button class="btn btn-outline btn-sm" data-open="${esc(p.id)}">${svg("expand")} Öppna</button>
          <button class="btn btn-outline btn-sm" data-share="${esc(p.id)}">${svg("link")} Dela</button>
        </div>
      </article>`;
  }

  function wireCards() {
    root.querySelectorAll("[data-open]").forEach((el) =>
      el.addEventListener("click", () => { location.hash = "#/view/" + encodeURIComponent(el.dataset.open); })
    );
    root.querySelectorAll("[data-share]").forEach((el) =>
      el.addEventListener("click", () => openShareModal(el.dataset.share))
    );
    const ea = document.getElementById("emptyAdd");
    if (ea) ea.addEventListener("click", openAddModal);
  }

  /* =============================================================
     INTERNAL VIEWER
     ============================================================= */
  function renderViewer(id) {
    const p = findProject(id);
    if (!p) { location.hash = "#/gallery"; return; }
    root.innerHTML = `
      <div class="viewer">
        <div class="viewer__bar">
          <button class="btn btn-ghost btn-sm" id="vBack">${svg("back")} Galleri</button>
          <span class="topbar__sep"></span>
          <img class="viewer__logo" src="assets/align-logo.png" alt="Align" />
          <div>
            <div class="viewer__title">${esc(p.title)}</div>
            <div class="viewer__sub">${esc(CAT_LABEL(p.cat))} · ${esc(p.lang || "")}</div>
          </div>
          <span class="viewer__spacer"></span>
          <button class="btn btn-ghost btn-sm" id="vShare">${svg("link")} Dela med kund</button>
          <a class="btn btn-ghost btn-sm" id="vOpen" href="${esc(p.file)}" target="_blank" rel="noopener">${svg("external")} Ny flik</a>
        </div>
        <iframe class="viewer__frame" src="${esc(p.file)}" title="${esc(p.title)}"></iframe>
      </div>`;
    document.getElementById("vBack").addEventListener("click", () => { location.hash = "#/gallery"; });
    document.getElementById("vShare").addEventListener("click", () => openShareModal(id));
  }

  /* =============================================================
     SHARED (customer) VIEW — public, no auth
     ============================================================= */
  function renderShared(token) {
    const s = readShare(token);
    if (!s.ok) {
      const reason = s.malformed ? "Länken är ogiltig." : s.revoked ? "Den här länken har stängts av." : "Den här länken har gått ut.";
      return renderGate(reason, s);
    }
    const p = findProject(s.id);
    if (!p) return renderGate("Alstret kunde inte hittas.", s);

    // count this open (per-link + per-project aggregate)
    Counter.hit("link:" + s.key);
    Counter.hit("proj:" + s.id);

    const expTxt = s.exp
      ? "Länk giltig t.o.m. " + new Date(s.exp).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })
      : "";

    root.innerHTML = `
      <div class="viewer viewer--shared">
        <div class="viewer__bar">
          <img class="viewer__logo" src="assets/align-logo.png" alt="Align" />
          <div>
            <div class="viewer__title">${esc(p.title)}</div>
            <div class="viewer__sub sharebanner">Presenterat av Align Consulting</div>
          </div>
          <span class="viewer__spacer"></span>
          ${expTxt ? `<span class="viewer__expnote">${svg("clock")} ${esc(expTxt)}</span>` : ""}
          <a class="btn btn-ghost btn-sm" href="${esc(p.file)}" target="_blank" rel="noopener">${svg("expand")} Helskärm</a>
        </div>
        <iframe class="viewer__frame" src="${esc(p.file)}" title="${esc(p.title)}"></iframe>
      </div>`;
  }

  function renderGate(reason, s) {
    root.innerHTML = `
      <div class="gate">
        <div class="gate__box">
          <img src="assets/align-logo.png" alt="Align Consulting" />
          <div class="gate__icon">${svg(s && s.expired ? "clock" : "lock")}</div>
          <h2>${s && s.expired ? "Länken har gått ut" : s && s.revoked ? "Länken är inte längre aktiv" : "Åtkomst saknas"}</h2>
          <p>${esc(reason)} Kontakta din kontakt på Align Consulting för en ny länk.</p>
        </div>
      </div>`;
  }

  /* =============================================================
     SHARE MODAL
     ============================================================= */
  const EXPIRY_OPTS = [
    { d: 7, label: "7 dagar" },
    { d: 30, label: "30 dagar" },
    { d: 90, label: "90 dagar" },
    { d: 0, label: "Aldrig" },
  ];

  function openShareModal(id) {
    const p = findProject(id);
    if (!p) return;
    let days = 30;
    let made = null;

    function body() {
      return `
        <p class="hint" style="margin-top:0;margin-bottom:16px">
          Skapa en länk som ger kunden åtkomst till <b>endast detta alster</b> — utan inloggning.
        </p>
        <div class="field">
          <label class="field-label">Alster</label>
          <input class="input" value="${esc(p.title)}" readonly />
        </div>
        <div class="field">
          <label class="field-label">Länken slutar gälla efter</label>
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
          <label class="field-label">Delbar länk</label>
          <div class="codebox">
            <input class="input" id="shareUrl" value="${esc(r.url)}" readonly />
            <button class="btn btn-gradient btn-sm" id="copyShare">${svg("copy")} Kopiera</button>
          </div>
        </div>
        <p class="hint">
          ${r.exp ? "Giltig t.o.m. <b>" + new Date(r.exp).toLocaleDateString("sv-SE") + "</b>. " : "Ingen utgång. "}
          Nyckel <code>${r.key}</code> — för att stänga av länken i förväg, lägg nyckeln i
          <code>revokedKeys</code> i <code>data/projects.js</code> och committa.
        </p>`;
    }

    openModal("Dela med kund", body(), [
      { label: "Klar", cls: "btn-outline", close: true },
      { label: "Skapa länk", cls: "btn-gradient", icon: "link", id: "doShare" },
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
          navigator.clipboard.writeText(inp.value).then(() => toast("Länk kopierad"));
        });
        btn.textContent = "Skapa ny länk";
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
          <h4>Skapade länkar &amp; öppningar</h4>
          <span class="links-total" id="totalViews">…</span>
        </div>
        <div id="linkRows">${keys.length ? keys.map(() => `<div class="linkrow"><span class="views zero">…</span></div>`).join("") : `<p class="hint" style="margin:0">Inga länkar skapade ännu.</p>`}</div>
        ${cloud ? "" : `<p class="hint">Lokalt läge — räknaren visar bara öppningar på <b>den här enheten</b>. Aktivera Firebase i <code>data/projects.js</code> för riktiga, globala siffror.</p>`}`;

      const total = await Counter.get("proj:" + pid);
      const tv = modal.querySelector("#totalViews");
      if (tv) tv.innerHTML = total == null ? "Statistik ej tillgänglig" : `Totalt <b>${total}</b> öppning${total === 1 ? "" : "ar"}`;

      if (!keys.length) return;
      const rows = await Promise.all(keys.map(async (k) => {
        const meta = shares[k];
        const c = await Counter.get("link:" + k);
        const revoked = (CFG.revokedKeys || []).includes(k);
        const expired = meta.exp && Date.now() > meta.exp;
        const status = revoked ? "Avstängd" : expired ? "Utgången" : "Aktiv";
        const stClass = revoked || expired ? "off" : "ok";
        const created = meta.created ? new Date(meta.created).toLocaleDateString("sv-SE") : "";
        const exp = meta.exp ? "t.o.m. " + new Date(meta.exp).toLocaleDateString("sv-SE") : "ingen utgång";
        const cnt = c == null ? "–" : c;
        return `
          <div class="linkrow">
            <span class="st ${stClass}">${status}</span>
            <span class="info">Skapad ${created} · ${exp}<br><b>${k}</b></span>
            <span class="views ${c ? "" : "zero"}">${svg("eye")} ${cnt}</span>
          </div>`;
      }));
      const rowsEl = modal.querySelector("#linkRows");
      if (rowsEl) rowsEl.innerHTML = rows.join("");
    }
  }

  /* =============================================================
     ADD PROJECT MODAL
     ============================================================= */
  function slugify(s) {
    return (s || "alster").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "alster";
  }

  function openAddModal() {
    let mode = "file"; // file | url
    let htmlText = null;
    let htmlName = null;
    let thumbData = null;

    const today = new Date().toISOString().slice(0, 10);

    function body() {
      return `
        <div class="seg" id="modeSeg">
          <button data-m="file" aria-pressed="${mode === "file"}">Ladda upp HTML-fil</button>
          <button data-m="url" aria-pressed="${mode === "url"}">Länka till URL</button>
        </div>

        <div class="row2">
          <div class="field">
            <label class="field-label" for="fTitle">Titel</label>
            <input class="input" id="fTitle" placeholder="t.ex. Kundpresentation Q3" />
          </div>
          <div class="field">
            <label class="field-label" for="fDate">Datum</label>
            <input class="input" id="fDate" type="date" value="${today}" />
          </div>
        </div>

        <div class="row2">
          <div class="field">
            <label class="field-label" for="fCat">Kategori</label>
            <select class="select" id="fCat">${CATS.map((c) => `<option value="${c.id}">${c.label}</option>`).join("")}</select>
          </div>
          <div class="field">
            <label class="field-label" for="fLang">Språk / marknad</label>
            <select class="select" id="fLang">${LANGS.map((l) => `<option>${l}</option>`).join("")}</select>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="fDesc">Kort beskrivning</label>
          <input class="input" id="fDesc" placeholder="En mening om alstret" />
        </div>

        <div class="field" id="srcField">
          ${mode === "file" ? `
            <label class="field-label">HTML-fil</label>
            <div class="dropzone ${htmlText ? "dropzone--filled" : ""}" id="htmlDrop">
              ${svg(htmlText ? "check" : "upload")}
              <b>${htmlText ? esc(htmlName) : "Släpp HTML-fil här eller klicka"}</b>
              <small>${htmlText ? "Klicka för att byta fil" : "En fristående .html-sida"}</small>
            </div>
            <input type="file" id="htmlInput" accept=".html,text/html" hidden />
          ` : `
            <label class="field-label" for="fUrl">URL</label>
            <input class="input" id="fUrl" placeholder="https://…" />
            <p class="hint">Länk till en extern sida (t.ex. en annan GitHub Pages-sida).</p>
          `}
        </div>

        <div class="field">
          <label class="field-label">Förhandsbild (skärmdump)</label>
          <div class="dropzone ${thumbData ? "dropzone--filled" : ""}" id="thumbDrop">
            ${thumbData ? `<img src="${thumbData}" style="max-height:90px;border-radius:6px;margin:0 auto 8px" />` : svg("image")}
            <b>${thumbData ? "Bild vald" : "Släpp en bild här eller klicka"}</b>
            <small>${thumbData ? "Klicka för att byta bild" : "PNG/JPG — visas på kortet (valfritt)"}</small>
          </div>
          <input type="file" id="thumbInput" accept="image/*" hidden />
        </div>

        <p class="hint">Sparas direkt i din webbläsare så du kan visa det nu. Använd <b>Exportera för GitHub</b> för att lägga till det permanent i galleriet för alla.</p>`;
    }

    openModal("Lägg till alster", body(), [
      { label: "Avbryt", cls: "btn-outline", close: true },
      { label: "Exportera för GitHub", cls: "btn-outline", icon: "external", id: "exportBtn" },
      { label: "Spara lokalt", cls: "btn-gradient", icon: "check", id: "saveBtn" },
    ], wire);

    function wire(modal) {
      function rebuild() {
        modal.querySelector(".modal__body").innerHTML = body();
        wireFields(modal);
      }
      modal.querySelectorAll("#modeSeg button").forEach((b) =>
        b.addEventListener("click", () => { mode = b.dataset.m; rebuild(); })
      );
      wireFields(modal);

      modal.querySelector("#saveBtn").addEventListener("click", () => {
        const d = collect(modal);
        if (!d) return;
        const local = loadLocal();
        if (mode === "file") {
          if (!htmlText) { toast("Välj en HTML-fil först", true); return; }
          d._local = true; d._html = htmlText;
        } else {
          if (!d.file) { toast("Ange en URL först", true); return; }
          d._local = true;
        }
        d.thumb = thumbData || "";
        local.unshift(d);
        saveLocal(local);
        closeModal();
        toast("Alster sparat lokalt");
        renderGallery();
      });

      modal.querySelector("#exportBtn").addEventListener("click", () => {
        const d = collect(modal);
        if (!d) return;
        showExport(modal, d);
      });
    }

    function wireFields(modal) {
      const hDrop = modal.querySelector("#htmlDrop");
      const hInput = modal.querySelector("#htmlInput");
      if (hDrop && hInput) {
        hDrop.addEventListener("click", () => hInput.click());
        dnd(hDrop, (file) => readHtml(file, modal));
        hInput.addEventListener("change", () => hInput.files[0] && readHtml(hInput.files[0], modal));
      }
      const tDrop = modal.querySelector("#thumbDrop");
      const tInput = modal.querySelector("#thumbInput");
      if (tDrop && tInput) {
        tDrop.addEventListener("click", () => tInput.click());
        dnd(tDrop, (file) => readThumb(file, modal));
        tInput.addEventListener("change", () => tInput.files[0] && readThumb(tInput.files[0], modal));
      }
    }

    function readHtml(file, modal) {
      const r = new FileReader();
      r.onload = () => { htmlText = r.result; htmlName = file.name; refreshSrc(modal); };
      r.readAsText(file);
    }
    function readThumb(file, modal) {
      const r = new FileReader();
      r.onload = () => { thumbData = r.result; refreshThumb(modal); };
      r.readAsDataURL(file);
    }
    function refreshSrc(modal) {
      const f = modal.querySelector("#srcField");
      const drop = modal.querySelector("#htmlDrop");
      if (drop) {
        drop.classList.add("dropzone--filled");
        drop.innerHTML = `${svg("check")}<b>${esc(htmlName)}</b><small>Klicka för att byta fil</small>`;
      }
    }
    function refreshThumb(modal) {
      const drop = modal.querySelector("#thumbDrop");
      drop.classList.add("dropzone--filled");
      drop.innerHTML = `<img src="${thumbData}" style="max-height:90px;border-radius:6px;margin:0 auto 8px" /><b>Bild vald</b><small>Klicka för att byta bild</small>`;
      modal.querySelector("#thumbInput") || wireFields(modal);
      wireFields(modal);
    }

    function collect(modal) {
      const title = modal.querySelector("#fTitle").value.trim();
      if (!title) { toast("Ange en titel", true); return null; }
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
      else obj.file = "projects/" + slugify(title) + ".html";
      return obj;
    }

    function showExport(modal, d) {
      const slug = slugify(d.title);
      const filePath = mode === "url" ? d.file : "projects/" + slug + ".html";
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
      if (mode === "file" && htmlText) {
        download(slug + ".html", new Blob([htmlText], { type: "text/html" }));
      }
      if (thumbData) {
        download(slug + ".png", dataUrlToBlob(thumbData));
      }

      const body = modal.querySelector(".modal__body");
      body.innerHTML = `
        <div class="export-block">
          <h4>${svg("check")} Filer nedladdade</h4>
          <ol>
            ${mode === "file" ? `<li>Lägg <code>${slug}.html</code> i mappen <code>projects/</code> i repot.</li>` : `<li>Använder extern URL: <code>${esc(filePath)}</code></li>`}
            ${thumbData ? `<li>Lägg <code>${slug}.png</code> i mappen <code>thumbnails/</code>.</li>` : `<li>Ingen förhandsbild — kortet visar en platshållare.</li>`}
            <li>Klistra in raden nedan i listan <code>ALIGN_PROJECTS</code> i <code>data/projects.js</code>.</li>
            <li>Committa och pusha — alstret syns för alla.</li>
          </ol>
        </div>
        <pre class="snippet" id="snip">${esc(snippet)}</pre>
        <button class="btn btn-outline btn-sm" id="copySnip" style="margin-top:10px">${svg("copy")} Kopiera manifest-rad</button>`;
      modal.querySelector(".modal__foot").innerHTML = `<button class="btn btn-gradient" data-close>Klar</button>`;
      modal.querySelector("[data-close]").addEventListener("click", closeModal);
      modal.querySelector("#copySnip").addEventListener("click", () => {
        navigator.clipboard.writeText(snippet).then(() => toast("Manifest-rad kopierad"));
      });
    }
  }

  /* ---------- drag & drop helper ---------- */
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
