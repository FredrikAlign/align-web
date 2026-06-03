// library.jsx — Topbar + Library (start) screen
// Exports to window: Topbar, Library

function Topbar({ t, lang, setLang, onLogout, crumb, onCrumb }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src="assets/logo-navy.png" alt="Align" />
        <div className="topbar-sep"></div>
        <span className="topbar-product">{t("product")}</span>
        {crumb && (
          <button className="btn btn-quiet btn-sm" onClick={onCrumb} style={{ marginLeft: 6 }}>
            <Icon name="arrowLeft" size={15} /> {crumb}
          </button>
        )}
      </div>
      <div className="topbar-right">
        <div className="segmented" role="group" aria-label="language">
          <button className={lang === "sv" ? "on" : ""} onClick={() => setLang("sv")}>SV</button>
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>{t("logout")}</button>
      </div>
    </header>
  );
}

function typeMeta(id) { return CONTENT_TYPES.find(c => c.id === id) || CONTENT_TYPES[0]; }

function PieceCard({ piece, lang, t, onOpen, onDelete }) {
  const tm = typeMeta(piece.brief.contentType);
  const stats = computeStats((piece.versions[piece.current] || {}).content || "");
  const isPending = piece.status === "pending";
  const date = new Date(piece.updatedAt);
  const dStr = date.toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <div className="card fadein" style={{ display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer" }} onClick={() => onOpen(piece.id)}>
      <div style={{ padding: "20px 22px 16px", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span className="badge badge-std" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Icon name={tm.icon} size={13} /> {lbl(tm, lang)}
          </span>
          <span className={"badge " + (isPending ? "badge-pending" : "badge-active")}>
            <span className="badge-dot"></span>{isPending ? "Pending" : "Active"}
          </span>
        </div>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em", color: "var(--navy-900)", textWrap: "pretty" }}>
          {piece.title}
        </h3>
      </div>
      <div className="divider"></div>
      <div style={{ padding: "12px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: "var(--muted)" }}>
        <span>{t("updated")} {dStr}{!isPending && ` · ${stats.words} ${t("words")}`}</span>
        <button className="btn btn-quiet btn-sm" style={{ padding: 6, color: "var(--navy-300)" }}
          onClick={(e) => { e.stopPropagation(); onDelete(piece.id); }} title={t("deletePiece")}>
          <Icon name="trash" size={15} />
        </button>
      </div>
    </div>
  );
}

function Library({ t, lang, pieces, onNew, onOpen, onDelete }) {
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const filtered = pieces
    .filter(p => filter === "all" || p.brief.contentType === filter)
    .filter(p => !q || p.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const typesPresent = Array.from(new Set(pieces.map(p => p.brief.contentType)));

  return (
    <div className="canvas">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginBottom: 30, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent-600)", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 28, height: 1, background: "var(--accent-600)" }}></span>Align · MarCom
          </div>
          <h1 style={{ margin: 0, fontSize: 46, fontWeight: 200, letterSpacing: "-0.03em", color: "var(--navy-800)", lineHeight: 1 }}>{t("libTitle")}</h1>
          <p style={{ margin: "16px 0 0", fontSize: 16, color: "var(--navy-600)", maxWidth: "52ch", lineHeight: 1.55 }}>{t("libLede")}</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onNew}>
          <Icon name="plus" size={17} /> {t("newPiece")}
        </button>
      </div>

      {pieces.length > 0 && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 22, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 380 }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--navy-300)" }}><Icon name="search" size={16} /></span>
            <input className="input" style={{ paddingLeft: 38 }} placeholder={t("searchLib")} value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button className={"chip" + (filter === "all" ? " on" : "")} style={chipBtn(filter === "all")} onClick={() => setFilter("all")}>{t("filterAll")}</button>
            {typesPresent.map(id => {
              const tm = typeMeta(id);
              return <button key={id} style={chipBtn(filter === id)} onClick={() => setFilter(id)}>{lbl(tm, lang)}</button>;
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "72px 32px", textAlign: "center" }}>
          <div className="empty-illus"><Icon name="sparkles" size={26} /></div>
          <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 300, color: "var(--navy-800)" }}>{t("empty")}</h3>
          <p style={{ margin: "0 auto 22px", color: "var(--muted)", maxWidth: "40ch" }}>{t("emptySub")}</p>
          <button className="btn btn-primary" onClick={onNew}><Icon name="plus" size={16} /> {t("newPiece")}</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map(p => <PieceCard key={p.id} piece={p} lang={lang} t={t} onOpen={onOpen} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

function chipBtn(on) {
  return {
    display: "inline-flex", alignItems: "center", gap: 7,
    background: on ? "var(--navy-800)" : "#fff",
    color: on ? "#fff" : "var(--navy-700)",
    border: "1px solid " + (on ? "var(--navy-800)" : "var(--line)"),
    borderRadius: 99, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer"
  };
}

Object.assign(window, { Topbar, Library });
