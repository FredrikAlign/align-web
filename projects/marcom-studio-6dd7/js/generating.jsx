// generating.jsx — live generation screen (presentational). Exports: Generating
function actLabel(t, type) {
  return { search: t("actSearch"), read: t("actRead"), voice: t("actVoice"), plan: t("actWrite"), write: t("actWrite"), polish: t("actPolish"), done: t("actDone") }[type] || type;
}
function actIcon(type) {
  return { search: "search", read: "globe", voice: "shield", plan: "list", write: "edit", polish: "sparkles", done: "check" }[type] || "info";
}

function Generating({ t, lang, piece, activity, onCancel, error, onRetry }) {
  const tm = CONTENT_TYPES.find(c => c.id === piece.brief.contentType) || {};
  const date = new Date(piece.updatedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="canvas narrow">
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span className="badge badge-std" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Icon name={tm.icon} size={13} /> {lbl(tm, lang)}
          </span>
          <span className="badge badge-pending"><span className="badge-dot"></span>Pending</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 300, letterSpacing: "-0.02em", color: "var(--navy-800)", lineHeight: 1.2, textWrap: "pretty" }}>{piece.title}</h1>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--muted)" }}>{t("updated")} {date}</p>
      </div>

      <div className="card card-pad">
        {error ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div className="empty-illus" style={{ background: "#fdf2f0", color: "var(--red-warn)" }}><Icon name="alert" size={26} /></div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 400, color: "var(--navy-800)" }}>{t("aiError")}</h3>
            <button className="btn btn-primary" onClick={onRetry} style={{ marginTop: 12 }}><Icon name="refresh" size={16} /> {t("generate")}</button>
          </div>
        ) : (
          <React.Fragment>
            <div style={{ textAlign: "center", padding: "20px 0 26px" }}>
              <div className="spinner" style={{ margin: "0 auto 22px" }}></div>
              <h3 style={{ margin: "0 0 6px", fontSize: 21, fontWeight: 500, color: "var(--navy-800)" }}>{t("genTitle")}</h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>{t("genSub")}</p>
            </div>

            {activity.length > 0 && (
              <div style={{ background: "var(--navy-50)", border: "1px solid var(--line-soft)", borderRadius: "var(--r-md)", padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy-500)", marginBottom: 6 }}>{t("activity")}</div>
                <div className="activity">
                  {activity.map((a, i) => (
                    <div key={i} className={"activity-row" + (a.type === "done" ? " done" : "")}>
                      <span className="ico">{a.type === "done" ? <Icon name="check" size={15} /> : (i === activity.length - 1 ? <span className="spinner spinner-sm"></span> : <Icon name={actIcon(a.type)} size={15} />)}</span>
                      <span className="txt"><b>{actLabel(t, a.type)}</b>{a.text ? ": " + a.text : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </React.Fragment>
        )}
      </div>

      {!error && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button className="btn btn-danger-ghost" onClick={onCancel}><Icon name="x" size={15} /> {t("cancel")}</button>
        </div>
      )}
    </div>
  );
}
Object.assign(window, { Generating });
