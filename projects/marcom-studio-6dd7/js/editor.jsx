// editor.jsx — markdown editor modal with toolbar + version history. Exports: Editor
function Editor({ t, piece, onSave, onClose }) {
  const [vIndex, setVIndex] = React.useState(piece.current);
  const [text, setText] = React.useState((piece.versions[piece.current] || {}).content || "");
  const [showPreview, setShowPreview] = React.useState(false);
  const ref = React.useRef(null);

  function loadVersion(idx) {
    setVIndex(idx);
    setText((piece.versions[idx] || {}).content || "");
  }

  function apply(before, after, opts) {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = text.slice(s, e);
    let insert, caret;
    if (opts && opts.line) {
      // prefix at line start
      const lineStart = text.lastIndexOf("\n", s - 1) + 1;
      insert = text.slice(0, lineStart) + before + text.slice(lineStart);
      caret = e + before.length;
      setText(insert);
      requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = caret; });
      return;
    }
    const mid = sel || (opts && opts.placeholder) || "";
    insert = text.slice(0, s) + before + mid + after + text.slice(e);
    setText(insert);
    caret = s + before.length + mid.length + after.length;
    requestAnimationFrame(() => { el.focus(); el.selectionStart = s + before.length; el.selectionEnd = s + before.length + mid.length; });
  }

  const tools = [
    { k: "bold", icon: "bold", label: t("tBold"), fn: () => apply("**", "**", { placeholder: "text" }) },
    { k: "italic", icon: "italic", label: t("tItalic"), fn: () => apply("*", "*", { placeholder: "text" }) },
    { k: "h1", txt: "H1", fn: () => apply("# ", "", { line: true }) },
    { k: "h2", txt: "H2", fn: () => apply("## ", "", { line: true }) },
    { k: "h3", txt: "H3", fn: () => apply("### ", "", { line: true }) },
    { k: "ul", icon: "list", label: t("tList"), fn: () => apply("- ", "", { line: true }) },
    { k: "ol", icon: "numlist", label: t("tNumList"), fn: () => apply("1. ", "", { line: true }) },
    { k: "link", icon: "link", label: t("tLink"), fn: () => apply("[", "](https://)", { placeholder: "text" }) },
    { k: "code", icon: "code", label: t("tCode"), fn: () => apply("`", "`", { placeholder: "code" }) },
    { k: "quote", icon: "quote", label: t("tQuote"), fn: () => apply("> ", "", { line: true }) },
  ];

  const nVers = piece.versions.length;

  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 940 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", background: "var(--paper)", borderBottom: "1px solid var(--line)" }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 300, letterSpacing: "-0.01em", color: "var(--navy-800)" }}>{t("edTitle")}</h3>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose}><Icon name="x" size={16} /> {t("cancel")}</button>
            <button className="btn btn-primary" onClick={() => onSave(text, vIndex)}><Icon name="check" size={16} /> {t("save")}</button>
          </div>
        </div>

        {/* toolbar */}
        <div style={{ padding: "14px 24px", background: "var(--paper)", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="md-toolbar">
            {tools.map(tool => (
              <button key={tool.k} className={"md-tool" + (tool.k === "italic" ? " italic" : "")} onClick={tool.fn} title={tool.label || tool.txt}>
                {tool.icon ? <Icon name={tool.icon} size={14} /> : null}{tool.txt || tool.label}
              </button>
            ))}
          </div>
          <div className="segmented">
            <button className={!showPreview ? "on" : ""} onClick={() => setShowPreview(false)}>Markdown</button>
            <button className={showPreview ? "on" : ""} onClick={() => setShowPreview(true)}>{t("preview")}</button>
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflow: "auto", padding: 24, background: "var(--bone)" }}>
          {showPreview ? (
            <div className="card card-pad prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
          ) : (
            <textarea
              ref={ref}
              className="textarea"
              style={{ width: "100%", minHeight: 360, fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 14, lineHeight: 1.7, background: "#fff", border: "1px solid var(--accent-100)", boxShadow: "0 0 0 3px var(--accent-050)" }}
              value={text}
              onChange={e => setText(e.target.value)}
              spellCheck={false}
            />
          )}
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "12px 2px 0" }}>{t("edHint")}</p>
        </div>

        {/* version navigator */}
        {nVers > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "var(--paper)", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--navy-50)", borderRadius: 99, padding: 4 }}>
              <button className="icon-btn" style={{ width: 34, height: 34, border: "none", background: "transparent" }} disabled={vIndex === 0} onClick={() => loadVersion(vIndex - 1)}><Icon name="chevLeft" size={16} /></button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy-800)", padding: "0 6px" }}>{t("versionOf", { a: vIndex + 1, b: nVers })}</span>
              <button className="icon-btn" style={{ width: 34, height: 34, border: "none", background: "transparent" }} disabled={vIndex === nVers - 1} onClick={() => loadVersion(vIndex + 1)}><Icon name="chevRight" size={16} /></button>
            </div>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{t("updated")} {new Date((piece.versions[vIndex] || {}).at || piece.updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
Object.assign(window, { Editor });
