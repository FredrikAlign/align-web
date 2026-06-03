// result.jsx — generated-content workspace. Exports: Result
function FactCheckModal({ t, lang, content, onClose }) {
  const [items, setItems] = React.useState(null);
  const [err, setErr] = React.useState(false);
  React.useEffect(() => {
    let live = true;
    AI.factCheck(content, lang).then(r => { if (live) setItems(r); }).catch(() => { if (live) setErr(true); });
    return () => { live = false; };
  }, []);
  const statusMeta = {
    caution: { c: "var(--red-warn)", bg: "#fdf2f0", icon: "alert" },
    verify: { c: "var(--orange-700)", bg: "var(--orange-050)", icon: "info" },
    ok: { c: "var(--green-ok)", bg: "#e8f5ee", icon: "check" },
  };
  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 400, color: "var(--navy-800)", display: "flex", alignItems: "center", gap: 10 }}><Icon name="shield" size={20} /> {t("fcTitle")}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={15} /> {t("fcClose")}</button>
        </div>
        <div style={{ padding: 24, overflow: "auto", background: "var(--bone)" }}>
          {err ? <p style={{ color: "var(--muted)" }}>{t("aiError")}</p>
            : items === null ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--navy-600)", padding: "20px 0" }}>
                <span className="spinner spinner-sm" style={{ width: 20, height: 20 }}></span> {t("fcRunning")}
              </div>
            ) : items.length === 0 ? <p style={{ color: "var(--muted)" }}>{t("fcEmpty")}</p>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((it, i) => {
                    const m = statusMeta[it.status] || statusMeta.verify;
                    return (
                      <div key={i} className="card" style={{ padding: "14px 16px", display: "flex", gap: 12, boxShadow: "none" }}>
                        <span style={{ flex: "none", width: 26, height: 26, borderRadius: 7, background: m.bg, color: m.c, display: "grid", placeItems: "center" }}><Icon name={m.icon} size={15} /></span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy-800)", lineHeight: 1.4 }}>{it.claim}</div>
                          {it.note && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>{it.note}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          <p style={{ fontSize: 12, color: "var(--navy-300)", marginTop: 18, display: "flex", gap: 7, alignItems: "center" }}><Icon name="info" size={13} /> {t("fcDisclaimer")}</p>
        </div>
      </div>
    </div>
  );
}

function Result({ t, lang, piece, refining, onRefine, onCancelRefine, onEdit, onSetVersion, onRestart, onUpdatePiece, onImage }) {
  const [prompt, setPrompt] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [showFC, setShowFC] = React.useState(false);
  const [newTag, setNewTag] = React.useState("");
  const [addingTag, setAddingTag] = React.useState(false);

  const tm = CONTENT_TYPES.find(c => c.id === piece.brief.contentType) || {};
  const version = piece.versions[piece.current] || { content: "" };
  const stats = computeStats(version.content);
  const nVers = piece.versions.length;
  const date = new Date(piece.updatedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  const aud = lbl(AUDIENCES.find(a => a.id === piece.brief.audience), lang);
  const goal = lbl(GOALS.find(g => g.id === piece.brief.goal), lang);
  const tone = lbl(TONES.find(tn => tn.id === piece.brief.tone), lang);

  function doCopy() {
    navigator.clipboard && navigator.clipboard.writeText(version.content);
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  }
  function submitRefine() {
    const p = prompt.trim(); if (!p || refining) return;
    onRefine(p); setPrompt("");
  }
  function addTag() {
    const v = newTag.trim(); if (!v) { setAddingTag(false); return; }
    onUpdatePiece({ tags: [...(piece.tags || []), v] }); setNewTag(""); setAddingTag(false);
  }
  function removeTag(i) { onUpdatePiece({ tags: piece.tags.filter((_, j) => j !== i) }); }

  const settingRows = [
    [t("fAudience"), aud], [t("fGoal"), goal], [t("fToneSec"), tone],
    [t("fVoice"), lbl(VOICE_PROFILES.find(v => v.id === piece.brief.voiceProfile), lang)],
    [t("fLength"), `${piece.brief.length} ${t("wordsUnit")}`],
    [t("fLang"), lbl(LANGS.find(l => l.id === piece.brief.language), lang)],
    [t("fWebSearch"), piece.brief.webSearch ? "✓" : "—"],
    piece.brief.include ? [t("fInclude"), piece.brief.include] : null,
    piece.brief.website ? [t("fWebsite"), piece.brief.website] : null,
    piece.brief.instructions ? [t("fInstr"), piece.brief.instructions] : null,
  ].filter(Boolean);

  return (
    <div className="canvas">
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span className="badge badge-std" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name={tm.icon} size={13} /> {lbl(tm, lang)}</span>
            <span className="badge badge-active"><span className="badge-dot"></span>Active</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 300, letterSpacing: "-0.02em", color: "var(--navy-800)", lineHeight: 1.2, textWrap: "pretty" }}>{piece.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{nVers} {nVers === 1 ? t("version") : t("versions")} · {t("updated")} {date}</span>
            <button className="btn btn-quiet btn-sm" style={{ padding: 6, color: piece.fav ? "var(--accent)" : "var(--navy-300)" }} onClick={() => onUpdatePiece({ fav: !piece.fav })}>
              <Icon name="star" size={17} fill={piece.fav ? "var(--accent)" : "none"} />
            </button>
            <div className="tags-row">
              {(piece.tags || []).map((tg, i) => (
                <span key={i} className="chip"><Icon name="tag" size={12} /> {tg} <button onClick={() => removeTag(i)}><Icon name="x" size={12} /></button></span>
              ))}
              {addingTag ? (
                <input autoFocus className="input" style={{ width: 130, padding: "6px 10px", fontSize: 13 }} value={newTag}
                  onChange={e => setNewTag(e.target.value)} onBlur={addTag} onKeyDown={e => e.key === "Enter" && addTag()} placeholder={t("tag")} />
              ) : (
                <button className="chip" style={{ cursor: "pointer", color: "var(--navy-500)" }} onClick={() => setAddingTag(true)}><Icon name="plus" size={12} /> {t("addTag")}</button>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={onImage}><Icon name="image" size={16} /> {t("createImageCta")}</button>
          <button className="btn btn-ghost" onClick={onRestart}><Icon name="refresh" size={16} /> {t("restart")}</button>
        </div>
      </div>

      {/* stats */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="statgrid">
          <div className="stat"><div className="k">{t("nWords")}</div><div className="v">{stats.words.toLocaleString(lang === "sv" ? "sv-SE" : "en-US")}</div></div>
          <div className="stat"><div className="k">{t("nChars")}</div><div className="v">{stats.chars.toLocaleString(lang === "sv" ? "sv-SE" : "en-US")}</div></div>
          <div className="stat"><div className="k">{t("nRead")}</div><div className="v">{stats.read} {t("min")}</div></div>
        </div>
      </div>

      {/* settings accordion */}
      <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
        <button className="accordion-head" onClick={() => setSettingsOpen(o => !o)}>
          <span className={"accordion-chev" + (settingsOpen ? " open" : "")}><Icon name="chevRight" size={16} /></span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy-800)" }}>{t("settings")}</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>· {aud} · {goal} · {tone}</span>
        </button>
        {settingsOpen && (
          <div style={{ padding: "4px 20px 20px 48px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px 28px" }}>
              {settingRows.map(([k, v], i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 14, color: "var(--navy-800)", wordBreak: "break-word" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }}>
        {/* refine column */}
        <div className="card card-pad" style={{ position: "sticky", top: 84 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 600, color: "var(--navy-800)" }}>{t("refineTitle")}</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{t("refineLede")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {t("quickChips").map((c, i) => (
              <button key={i} className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start", fontWeight: 500 }} disabled={refining} onClick={() => onRefine(c)}>
                <Icon name="sparkles" size={14} /> {c}
              </button>
            ))}
          </div>
        </div>

        {/* content column */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 22px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--navy-800)" }}>{t("genContent")}</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={onEdit}><Icon name="edit" size={15} /> {t("edit")}</button>
              <button className="btn btn-ghost btn-sm" onClick={doCopy}><Icon name={copied ? "check" : "copy"} size={15} /> {copied ? t("copied") : t("copy")}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowFC(true)}><Icon name="shield" size={15} /> {t("factcheck")}</button>
            </div>
          </div>
          <div className="prose" style={{ padding: "30px 40px" }} dangerouslySetInnerHTML={{ __html: renderMarkdown(version.content) }} />
          {nVers > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", borderTop: "1px solid var(--line)", background: "var(--paper)" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--navy-50)", borderRadius: 99, padding: 4 }}>
                <button className="icon-btn" style={{ width: 32, height: 32, border: "none", background: "transparent" }} disabled={piece.current === 0} onClick={() => onSetVersion(piece.current - 1)}><Icon name="chevLeft" size={15} /></button>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--navy-800)", padding: "0 6px" }}>{t("versionOf", { a: piece.current + 1, b: nVers })}</span>
                <button className="icon-btn" style={{ width: 32, height: 32, border: "none", background: "transparent" }} disabled={piece.current === nVers - 1} onClick={() => onSetVersion(piece.current + 1)}><Icon name="chevRight" size={15} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* refine dock */}
      <div className="refine-dock" style={{ marginTop: 22 }}>
        {refining ? (
          <div className="refine-bar" style={{ paddingLeft: 20 }}>
            <span className="spinner spinner-sm"></span>
            <span style={{ flex: 1, fontSize: 14.5, color: "var(--navy-700)" }}>{t("refining")}</span>
            <button className="btn btn-danger-ghost btn-sm" onClick={onCancelRefine} style={{ borderRadius: 99 }}><Icon name="x" size={14} /> {t("cancel")}</button>
          </div>
        ) : (
          <div className="refine-bar">
            <span className="icon-btn" style={{ cursor: "default", color: "var(--navy-400, var(--navy-500))" }}><Icon name="sliders" size={17} /></span>
            <input className="refine-input" placeholder={t("refinePh")} value={prompt}
              onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && submitRefine()} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <button className="icon-btn" style={{ width: 26, height: 20, borderRadius: 7 }} disabled={piece.current === 0} onClick={() => onSetVersion(piece.current - 1)} title="Prev version"><Icon name="chevLeft" size={13} style={{ transform: "rotate(90deg)" }} /></button>
              <button className="icon-btn" style={{ width: 26, height: 20, borderRadius: 7 }} disabled={piece.current === nVers - 1} onClick={() => onSetVersion(piece.current + 1)} title="Next version"><Icon name="chevRight" size={13} style={{ transform: "rotate(90deg)" }} /></button>
            </div>
            <button className="icon-btn round-accent" disabled={!prompt.trim()} onClick={submitRefine}><Icon name="send" size={17} /></button>
          </div>
        )}
      </div>

      {showFC && <FactCheckModal t={t} lang={lang} content={version.content} onClose={() => setShowFC(false)} />}
    </div>
  );
}
Object.assign(window, { Result });
