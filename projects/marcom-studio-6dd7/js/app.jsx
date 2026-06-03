// app.jsx — controller: routing, state, AI orchestration, tweaks
const { useState, useEffect, useRef } = React;

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("App crashed:", err, info); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ maxWidth: 560, margin: "80px auto", padding: 32, fontFamily: "Raleway, system-ui, sans-serif", textAlign: "center" }}>
          <h2 style={{ fontWeight: 300, color: "#14224a" }}>Något gick fel</h2>
          <p style={{ color: "#6b6f7a", fontSize: 14 }}>Ett fel uppstod när appen laddades. Återställ för att börja om.</p>
          <pre style={{ textAlign: "left", background: "#f3f1ec", padding: 14, borderRadius: 10, fontSize: 12, color: "#c0392b", overflow: "auto", whiteSpace: "pre-wrap" }}>{String(this.state.err && this.state.err.message || this.state.err)}</pre>
          <button onClick={() => { try { localStorage.removeItem("align_marcom_pieces_v1"); } catch (e) {} location.reload(); }}
            style={{ marginTop: 16, padding: "11px 20px", background: "#ec6a1c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Återställ &amp; ladda om
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ACCENTS = {
  orange: { label: "Align Orange", swatch: "#ec6a1c", vars: { "--accent": "#ec6a1c", "--accent-600": "#d65614", "--accent-050": "#fff4ea", "--accent-100": "#ffe2cc", "--accent-ink": "#ffffff" } },
  coral:  { label: "Warm Coral",   swatch: "#ff4a6b", vars: { "--accent": "#ff4a6b", "--accent-600": "#e63057", "--accent-050": "#fff0f3", "--accent-100": "#ffd4dd", "--accent-ink": "#ffffff" } },
  navy:   { label: "Align Navy",   swatch: "#14224a", vars: { "--accent": "#14224a", "--accent-600": "#0e1a35", "--accent-050": "#eef0f5", "--accent-100": "#d9dde7", "--accent-ink": "#ffffff" } },
  amber:  { label: "Amber",        swatch: "#ff7a1f", vars: { "--accent": "#ff7a1f", "--accent-600": "#e2660f", "--accent-050": "#fff4ea", "--accent-100": "#ffe2cc", "--accent-ink": "#ffffff" } },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "orange",
  "stepCount": 3
}/*EDITMODE-END*/;

function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const prefs = Store.loadPrefs();
  const [lang, setLang] = useState(prefs.lang || "sv");
  const [route, setRoute] = useState("library");
  const [pieces, setPieces] = useState(() => Store.load());
  const [activeId, setActiveId] = useState(null);
  const [activity, setActivity] = useState([]);
  const [genError, setGenError] = useState(false);
  const [refining, setRefining] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [wizardBrief, setWizardBrief] = useState(null);
  const cancelRef = useRef(false);

  const t = makeT(lang);

  useEffect(() => { Store.save(pieces); }, [pieces]);
  useEffect(() => { Store.savePrefs({ ...Store.loadPrefs(), lang }); document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    const a = ACCENTS[tw.accent] || ACCENTS.orange;
    Object.entries(a.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  }, [tw.accent]);

  const active = pieces.find(p => p.id === activeId) || null;

  function updatePiece(id, patch) {
    setPieces(ps => ps.map(p => p.id === id ? { ...p, ...patch, updatedAt: patch.updatedAt || p.updatedAt } : p));
  }

  // ---- create + generate ----
  function startNew() { setWizardBrief(null); setRoute("wizard"); }

  async function handleGenerate(brief) {
    const id = uid();
    const provisional = brief.topic.trim() || brief.topicDocName || (lang === "sv" ? "Nytt innehåll" : "New content");
    const piece = {
      id, title: provisional, status: "pending", brief,
      versions: [], current: 0, tags: [], fav: false,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    setPieces(ps => [piece, ...ps]);
    setActiveId(id);
    setActivity([]); setGenError(false);
    setRoute("generating");
    runGeneration(id, brief);
  }

  async function runGeneration(id, brief) {
    cancelRef.current = false;
    const onAct = (type, text) => {
      if (cancelRef.current) return;
      if (type === "title") { updatePiece(id, { title: text }); return; }
      setActivity(a => [...a, { type, text }]);
    };
    try {
      const md = await AI.generate(brief, lang, onAct);
      if (cancelRef.current) return;
      const titleMatch = md.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : (brief.topic || (lang === "sv" ? "Nytt innehåll" : "New content"));
      setPieces(ps => ps.map(p => p.id === id ? {
        ...p, title, status: "active",
        versions: [{ content: md, at: Date.now() }], current: 0, updatedAt: Date.now()
      } : p));
      setRoute("result");
    } catch (e) {
      if (!cancelRef.current) setGenError(true);
    }
  }

  function cancelGeneration() {
    cancelRef.current = true;
    setPieces(ps => ps.filter(p => p.id !== activeId));
    setActiveId(null);
    setRoute("library");
  }

  // ---- refine ----
  async function handleRefine(prompt) {
    if (!active || refining) return;
    setRefining(true); cancelRef.current = false;
    const cur = active.versions[active.current].content;
    try {
      const out = await AI.refine(cur, prompt, active.brief, lang);
      if (cancelRef.current) { setRefining(false); return; }
      setPieces(ps => ps.map(p => {
        if (p.id !== active.id) return p;
        const versions = [...p.versions, { content: out, at: Date.now(), note: prompt }];
        return { ...p, versions, current: versions.length - 1, updatedAt: Date.now() };
      }));
    } catch (e) { /* keep current */ }
    setRefining(false);
  }
  function cancelRefine() { cancelRef.current = true; setRefining(false); }

  function setVersion(idx) { if (active) updatePiece(active.id, { current: idx }); }

  function saveEdit(text, vIndex) {
    if (!active) return;
    setPieces(ps => ps.map(p => {
      if (p.id !== active.id) return p;
      const versions = p.versions.map((v, i) => i === vIndex ? { ...v, content: text, at: Date.now() } : v);
      return { ...p, versions, current: vIndex, updatedAt: Date.now() };
    }));
    setShowEditor(false);
  }

  function openPiece(id) {
    const p = pieces.find(x => x.id === id); if (!p) return;
    setActiveId(id);
    setRoute(p.status === "pending" ? "library" : "result");
  }
  function deletePiece(id) {
    if (!confirm(t("confirmDelete"))) return;
    setPieces(ps => ps.filter(p => p.id !== id));
  }
  function restart() {
    if (!active) return;
    if (!confirm(t("restartConfirm"))) return;
    setWizardBrief(active.brief);
    setRoute("wizard");
  }

  // ---- render ----
  let view;
  if (route === "library") {
    view = <Library t={t} lang={lang} pieces={pieces} onNew={startNew} onOpen={openPiece} onDelete={deletePiece} />;
  } else if (route === "wizard") {
    view = <Wizard t={t} lang={lang} stepCount={tw.stepCount} initialBrief={wizardBrief} onGenerate={handleGenerate} onCancel={() => setRoute("library")} />;
  } else if (route === "generating" && active) {
    view = <Generating t={t} lang={lang} piece={active} activity={activity} error={genError}
              onCancel={cancelGeneration} onRetry={() => { setGenError(false); setActivity([]); runGeneration(active.id, active.brief); }} />;
  } else if (route === "result" && active && active.versions.length) {
    view = <Result t={t} lang={lang} piece={active} refining={refining}
              onRefine={handleRefine} onCancelRefine={cancelRefine} onEdit={() => setShowEditor(true)}
              onSetVersion={setVersion} onRestart={restart} onImage={() => setRoute("image")} onUpdatePiece={(patch) => updatePiece(active.id, { ...patch, updatedAt: Date.now() })} />;
  } else if (route === "image" && active) {
    view = <ImageStudio t={t} lang={lang} piece={active} onBack={() => setRoute("result")} />;
  } else {
    view = <Library t={t} lang={lang} pieces={pieces} onNew={startNew} onOpen={openPiece} onDelete={deletePiece} />;
  }

  const showCrumb = route !== "library";
  function crumbBack() {
    if (route === "generating") { cancelGeneration(); return; }
    if (route === "image") { setRoute("result"); return; }
    setRoute("library");
  }

  return (
    <div className="app">
      <Topbar t={t} lang={lang} setLang={setLang} onLogout={() => setRoute("library")}
        crumb={showCrumb ? t("backStart") : null} onCrumb={crumbBack} />
      {view}
      {showEditor && active && <Editor t={t} piece={active} onSave={saveEdit} onClose={() => setShowEditor(false)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label={lang === "sv" ? "Utseende" : "Appearance"} />
        <TweakColor label={lang === "sv" ? "Accentfärg" : "Accent color"} value={ACCENTS[tw.accent].swatch}
          options={Object.values(ACCENTS).map(a => a.swatch)}
          onChange={(hex) => { const key = Object.keys(ACCENTS).find(k => ACCENTS[k].swatch === hex); if (key) setTweak("accent", key); }} />
        <TweakSection label={lang === "sv" ? "Formulär" : "Form"} />
        <TweakRadio label={lang === "sv" ? "Antal steg" : "Step count"} value={tw.stepCount}
          options={[1, 2, 3]} onChange={(v) => setTweak("stepCount", +v)} />
        <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "8px 4px 0", lineHeight: 1.5 }}>
          {lang === "sv" ? "3 = Ämne · Källor · Detaljer. 2 slår ihop källor i detaljer. 1 = allt på en sida." : "3 = Topic · Sources · Details. 2 merges sources into details. 1 = single page."}
        </p>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ErrorBoundary><App /></ErrorBoundary>);
