// wizard.jsx — multi-step content brief. Step grouping driven by `stepCount` tweak.
// Exports to window: Wizard, blankBrief

function blankBrief(lang) {
  return {
    topic: "", topicDocName: "", contentType: "blog",
    webSearch: true, resourceUrls: "", website: "",
    audience: "customers", goal: "engage", tone: "professional",
    voiceProfile: "align", length: 1000,
    include: "", exclude: "", language: lang || "sv", instructions: ""
  };
}

const GROUPS_BY_COUNT = {
  3: [["topic", "type"], ["sources"], ["details"]],
  2: [["topic", "type"], ["details", "sources"]],
  1: [["topic", "type", "sources", "details"]],
};

function Wizard({ t, lang, stepCount, onGenerate, onCancel, initialBrief }) {
  const [brief, setBrief] = React.useState(initialBrief || blankBrief(lang));
  const [step, setStep] = React.useState(0);
  const set = (k, v) => setBrief(b => ({ ...b, [k]: v }));

  const pages = GROUPS_BY_COUNT[stepCount] || GROUPS_BY_COUNT[3];
  const stepLabels = pages.map((groups, i) => {
    if (groups.includes("topic")) return { t: t("step1"), s: t("step1s") };
    if (groups.includes("details") && groups.includes("sources")) return { t: t("step3"), s: t("step2s") + " · " + t("step3s") };
    if (groups.includes("sources")) return { t: t("step2"), s: t("step2s") };
    return { t: t("step3"), s: t("step3s") };
  });

  const curGroups = pages[step];
  const hasTopicGroup = curGroups.includes("topic");
  const topicOk = brief.topic.trim() || brief.topicDocName;
  const canAdvance = !hasTopicGroup || (topicOk && brief.contentType);
  const isLast = step === pages.length - 1;

  function go(dir) {
    if (dir > 0 && !isLast) setStep(step + 1);
    else if (dir < 0 && step > 0) setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function submit() { onGenerate({ ...brief }); }

  // ---------- field group renderers ----------
  const groupRenderers = {
    topic: () => (
      <React.Fragment key="topic">
        <Field label={t("fTopic")} req help={t("fTopicHelp")}>
          <input className="input" placeholder={t("fTopicPh")} value={brief.topic} onChange={e => set("topic", e.target.value)} />
        </Field>
        <Field label={t("fTopicDoc")} optional={t} help={t("fTopicDocHelp")}>
          {brief.topicDocName ? (
            <div className="dropzone has-file">
              <Icon name="file" /> <span style={{ flex: 1, fontWeight: 600 }}>{brief.topicDocName}</span>
              <button className="btn btn-quiet btn-sm" onClick={() => set("topicDocName", "")}><Icon name="x" size={14} /> {t("remove")}</button>
            </div>
          ) : (
            <label className="dropzone">
              <Icon name="upload" /> {t("upload")}
              <input type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) set("topicDocName", f.name); }} />
            </label>
          )}
        </Field>
      </React.Fragment>
    ),
    type: () => (
      <Field key="type" label={t("fType")} req help={t("fTypeHelp")}>
        <div className="typegrid">
          {CONTENT_TYPES.map(ct => (
            <button key={ct.id} className={"typecard" + (brief.contentType === ct.id ? " on" : "")} onClick={() => set("contentType", ct.id)}>
              <span className="tc-icon"><Icon name={ct.icon} /></span>
              <span className="tc-name">{lbl(ct, lang)}</span>
              <span className="tc-desc">{lang === "sv" ? ct.svd : ct.end}</span>
            </button>
          ))}
        </div>
      </Field>
    ),
    sources: () => (
      <React.Fragment key="sources">
        <Field label={t("fWebsite")} optional={t} help={t("fWebsiteHelp")}>
          <input className="input" placeholder={t("fWebsitePh")} value={brief.website} onChange={e => set("website", e.target.value)} />
        </Field>
        <Field label={null}>
          <label className="check" style={{ marginBottom: 4 }}>
            <input type="checkbox" checked={brief.webSearch} onChange={e => set("webSearch", e.target.checked)} />
            <span className="box"><Icon name="check" /></span>
            <span className="check-body">
              <span className="ttl">{t("fWebSearch")}</span>
              <span className="sub">{t("fWebSearchHelp")}</span>
            </span>
          </label>
        </Field>
        <Field label={t("fUrls")} optional={t} help={t("fUrlsHelp")}>
          <textarea className="textarea" style={{ minHeight: 72 }} placeholder={t("fUrlsPh")} value={brief.resourceUrls} onChange={e => set("resourceUrls", e.target.value)} />
        </Field>
      </React.Fragment>
    ),
    details: () => (
      <React.Fragment key="details">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <Field label={t("fAudience")} req help={t("fAudienceHelp")}>
            <select className="select" value={brief.audience} onChange={e => set("audience", e.target.value)}>
              {AUDIENCES.map(a => <option key={a.id} value={a.id}>{lbl(a, lang)}</option>)}
            </select>
          </Field>
          <Field label={t("fGoal")} req help={t("fGoalHelp")}>
            <select className="select" value={brief.goal} onChange={e => set("goal", e.target.value)}>
              {GOALS.map(g => <option key={g.id} value={g.id}>{lbl(g, lang)}</option>)}
            </select>
          </Field>
        </div>
        <Field label={t("fToneSec")} help={t("fToneHelp")}>
          <div className="segmented" style={{ display: "flex", flexWrap: "wrap" }}>
            {TONES.map(tn => (
              <button key={tn.id} className={brief.tone === tn.id ? "on" : ""} onClick={() => set("tone", tn.id)}>{lbl(tn, lang)}</button>
            ))}
          </div>
        </Field>
        <Field label={t("fVoice")} optional={t} helpAccent={t("fVoiceHelp")}>
          <div style={{ position: "relative" }}>
            <select className="select" value={brief.voiceProfile} onChange={e => set("voiceProfile", e.target.value)}>
              {VOICE_PROFILES.map(v => <option key={v.id} value={v.id}>{lbl(v, lang)}{v.std ? "  ·  Standard" : ""}</option>)}
            </select>
          </div>
        </Field>
        <Field label={`${t("fLength")}: ${brief.length} ${t("wordsUnit")}`}>
          <div className="range-wrap">
            <input type="range" className="range" min="500" max="3000" step="100" value={brief.length} onChange={e => set("length", +e.target.value)} />
            <div className="range-scale">
              <span>{t("lenMin")}</span><span className="mid">{t("lenRec")}</span><span>{t("lenMax")}</span>
            </div>
          </div>
        </Field>
        <Field label={t("fInclude")} optional={t} help={t("fIncludeHelp")}>
          <input className="input" placeholder={t("fIncludePh")} value={brief.include} onChange={e => set("include", e.target.value)} />
        </Field>
        <Field label={t("fExclude")} optional={t} help={t("fExcludeHelp")}>
          <input className="input" placeholder={t("fExcludePh")} value={brief.exclude} onChange={e => set("exclude", e.target.value)} />
        </Field>
        <Field label={t("fLang")} req help={t("fLangHelp")}>
          <select className="select" value={brief.language} onChange={e => set("language", e.target.value)}>
            {LANGS.map(l => <option key={l.id} value={l.id}>{lbl(l, lang)}</option>)}
          </select>
        </Field>
        <Field label={t("fInstr")} optional={t} help={t("fInstrHelp")}>
          <textarea className="textarea" placeholder={t("fInstrPh")} value={brief.instructions} onChange={e => set("instructions", e.target.value)} />
        </Field>
      </React.Fragment>
    ),
  };

  return (
    <div className="canvas narrow">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 200, letterSpacing: "-0.025em", color: "var(--navy-800)" }}>{t("wizTitle")}</h1>
        <p style={{ margin: "12px 0 0", fontSize: 15, color: "var(--navy-600)", maxWidth: "62ch", lineHeight: 1.55 }}>{t("wizLede")}</p>
      </div>

      {/* stepper */}
      {pages.length > 1 && (
        <div className="stepper">
          {stepLabels.map((sl, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="step-link"><Icon name="chevRight" size={16} /></span>}
              <div className={"step" + (i === step ? " active" : i < step ? " done" : "")} onClick={() => i < step && setStep(i)}>
                <span className="step-icon">{i < step ? <Icon name="check" /> : i + 1}</span>
                <span className="step-text"><span className="t">{sl.t}</span><span className="s">{sl.s}</span></span>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="card card-pad fadein" key={step}>
        {curGroups.map(g => groupRenderers[g]())}

        <div className="divider" style={{ margin: "8px 0 22px" }}></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <button className="btn btn-ghost" onClick={() => step === 0 ? onCancel() : go(-1)}>
            <Icon name="arrowLeft" size={16} /> {step === 0 ? t("cancel") : t("back")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {!canAdvance && (
              <span style={{ fontSize: 12.5, color: "var(--muted)", maxWidth: "32ch", textAlign: "right" }}>
                {!topicOk ? t("nextHintTopic") : t("nextHintType")}
              </span>
            )}
            {isLast ? (
              <button className="btn btn-primary btn-lg" disabled={!canAdvance} onClick={submit}>
                <Icon name="sparkles" size={17} /> {t("generate")}
              </button>
            ) : (
              <button className="btn btn-primary" disabled={!canAdvance} onClick={() => go(1)}>
                {t("next")} <Icon name="arrowRight" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, req, optional, help, helpAccent, children }) {
  return (
    <div className="field">
      {label !== null && (
        <label className="field-label">
          {label}{req && <span className="req">*</span>}
          {optional && <span className="opt">({optionalWord(optional)})</span>}
        </label>
      )}
      {children}
      {help && <div className="field-help">{help}</div>}
      {helpAccent && <div className="field-help accent">{helpAccent}</div>}
    </div>
  );
}
function optionalWord(tfn) {
  if (!tfn) return "";
  // crude: detect language by a known string
  return tfn("remove") === "Ta bort" ? "valfritt" : "optional";
}

Object.assign(window, { Wizard, blankBrief });
