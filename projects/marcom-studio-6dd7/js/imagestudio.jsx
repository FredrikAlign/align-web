// imagestudio.jsx — branded key-visual generator (canvas renderer + UI). Exports: ImageStudio

const FORMATS = [
  { id: "li_land", key: "fmtLiLand", w: 1200, h: 627 },
  { id: "li_square", key: "fmtLiSquare", w: 1080, h: 1080 },
  { id: "hero", key: "fmtHero", w: 1320, h: 777 },
  { id: "featured", key: "fmtFeatured", w: 1200, h: 792 },
];

const STYLES = {
  navy:     { bg: { type: "solid", c: "#14224a" }, text: "#ffffff", accent: { type: "solid", c: "#ff7a1f" }, logo: "white", eyebrow: "#ff7a1f", swatch: "#14224a" },
  gradient: { bg: { type: "grad" },                text: "#ffffff", accent: { type: "solid", c: "#14224a" }, logo: "white", eyebrow: "#14224a", swatch: "linear-gradient(95deg,#ff7a1f,#ff4a6b)" },
  bone:     { bg: { type: "solid", c: "#f3f1ec" }, text: "#14224a", accent: { type: "grad" },                logo: "navy",  eyebrow: "#ec6a1c", swatch: "#f3f1ec" },
  ink:      { bg: { type: "solid", c: "#0a0d18" }, text: "#ffffff", accent: { type: "solid", c: "#ff7a1f" }, logo: "white", eyebrow: "#ff7a1f", swatch: "#0a0d18" },
};
const STYLE_KEYS = { navy: "styleNavy", gradient: "styleGradient", bone: "styleBone", ink: "styleInk" };

// ---- asset + font preload ----
const ASSETS = { logos: {} };
function ensureAssets() {
  if (ensureAssets._p) return ensureAssets._p;
  ensureAssets._p = (async () => {
    try {
      ASSETS.logos.navy = await loadImageEl("assets/logo-navy.png");
      ASSETS.logos.white = await loadImageEl("assets/logo-white.png");
      ASSETS.logos.orange = await loadImageEl("assets/logo-orange.png");
    } catch (e) {}
    if (document.fonts && document.fonts.load) {
      const specs = ["200 80px Raleway", "300 80px Raleway", "600 80px Raleway", "italic 300 80px Raleway", "italic 400 80px Raleway"];
      await Promise.all(specs.map(s => document.fonts.load(s).catch(() => {})));
    }
  })();
  return ensureAssets._p;
}

function setLS(ctx, px) { try { ctx.letterSpacing = px + "px"; } catch (e) {} }
function hexA(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function drawCover(ctx, img, W, H) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.max(W / iw, H / ih);
  const dw = iw * s, dh = ih * s;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

function wrapWords(ctx, words, size, accentLc, maxW) {
  ctx.font = "300 " + size + "px Raleway";
  const spaceW = ctx.measureText(" ").width;
  const lines = []; let cur = { tokens: [], width: 0 };
  const norm = s => s.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
  words.forEach(w => {
    const isAcc = accentLc && norm(w) === accentLc;
    ctx.font = (isAcc ? "italic " : "") + "300 " + size + "px Raleway";
    const ww = ctx.measureText(w).width;
    const lead = cur.tokens.length ? spaceW : 0;
    if (cur.tokens.length && cur.width + lead + ww > maxW) { lines.push(cur); cur = { tokens: [], width: 0 }; }
    const lead2 = cur.tokens.length ? spaceW : 0;
    cur.tokens.push({ text: w, accent: isAcc, w: ww, space: spaceW });
    cur.width += lead2 + ww;
  });
  if (cur.tokens.length) lines.push(cur);
  return lines;
}

function drawHeadline(ctx, text, accentWord, accentSpec, color, maxW, x, topLimit, bottomLimit, H) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return;
  const accentLc = (accentWord || "").trim().toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
  let size = Math.round(H * 0.12);
  const minSize = Math.round(H * 0.04);
  let lines, lh;
  const avail = bottomLimit - topLimit;
  while (size >= minSize) {
    lh = size * 1.05;
    lines = wrapWords(ctx, words, size, accentLc, maxW);
    const blockH = lines.length * lh;
    const widest = Math.max.apply(null, lines.map(l => l.width));
    if (blockH <= avail && widest <= maxW) break;
    size -= Math.max(2, Math.round(size * 0.07));
  }
  lh = size * 1.05;
  const blockH = lines.length * lh;
  const startBaseline = bottomLimit - blockH + size;
  setLS(ctx, 0);
  lines.forEach((line, li) => {
    let cx = x;
    const by = startBaseline + li * lh;
    line.tokens.forEach(tok => {
      ctx.font = (tok.accent ? "italic " : "") + "300 " + size + "px Raleway";
      if (tok.accent && accentSpec.type === "grad") {
        const g = ctx.createLinearGradient(cx, by - size, cx + tok.w, by);
        g.addColorStop(0, "#ff7a1f"); g.addColorStop(1, "#ff4a6b");
        ctx.fillStyle = g;
      } else if (tok.accent) ctx.fillStyle = accentSpec.c;
      else ctx.fillStyle = color;
      ctx.fillText(tok.text, cx, by);
      cx += tok.w + tok.space;
    });
  });
}

function drawComposition(ctx, W, H, opt) {
  const useImg = opt.bgSource === "image" && opt.imageEl;
  const S = STYLES[opt.style] || STYLES.navy;
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

  // background
  if (useImg) {
    drawCover(ctx, opt.imageEl, W, H);
    const sc = opt.scrim == null ? 0.55 : opt.scrim;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, hexA("#0a0d18", 0.10 + 0.20 * sc));
    g.addColorStop(0.45, hexA("#0a1024", 0.05 + 0.25 * sc));
    g.addColorStop(1, hexA("#0a1024", 0.55 + 0.42 * sc));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else if (S.bg.type === "grad") {
    const g = ctx.createLinearGradient(0, H, W, 0);
    g.addColorStop(0, "#ff4a6b"); g.addColorStop(1, "#ff7a1f");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = S.bg.c; ctx.fillRect(0, 0, W, H);
  }

  const textColor = useImg ? "#ffffff" : S.text;
  const eyebrowColor = useImg ? "#ff7a1f" : S.eyebrow;
  const logoVariant = useImg ? "white" : S.logo;
  const accentSpec = useImg ? { type: "solid", c: "#ff7a1f" } : S.accent;

  const pad = Math.round(Math.min(W, H) * 0.075);
  const colW = W - pad * 2;

  // eyebrow with leading tick
  let eyebrowBottom = pad;
  if (opt.eyebrow) {
    const es = Math.max(12, Math.round(H * 0.023));
    const tickW = Math.round(es * 1.6);
    ctx.strokeStyle = eyebrowColor; ctx.lineWidth = Math.max(1, Math.round(es * 0.08));
    ctx.beginPath(); ctx.moveTo(pad, pad + es * 0.55); ctx.lineTo(pad + tickW, pad + es * 0.55); ctx.stroke();
    ctx.font = "600 " + es + "px Raleway"; ctx.fillStyle = eyebrowColor;
    setLS(ctx, es * 0.16);
    ctx.fillText(opt.eyebrow, pad + tickW + es * 0.6, pad + es * 0.9);
    setLS(ctx, 0);
    eyebrowBottom = pad + es * 1.4;
  }

  // logo
  let logoH = 0;
  if (opt.showLogo && ASSETS.logos[logoVariant]) {
    const lg = ASSETS.logos[logoVariant];
    logoH = Math.round(H * 0.05);
    const lw = logoH * (lg.naturalWidth / lg.naturalHeight);
    ctx.globalAlpha = 1;
    ctx.drawImage(lg, pad, H - pad - logoH, lw, logoH);
  }

  // website bottom-right
  if (opt.website) {
    const ws = Math.max(12, Math.round(H * 0.019));
    ctx.font = "500 " + ws + "px Raleway"; ctx.fillStyle = hexA(textColor === "#ffffff" ? "#ffffff" : "#14224a", 0.72);
    ctx.textAlign = "right"; setLS(ctx, ws * 0.04);
    ctx.fillText(opt.website, W - pad, H - pad - (logoH ? logoH * 0.28 : 0));
    ctx.textAlign = "left"; setLS(ctx, 0);
  }

  const bottomLimit = H - pad - (logoH ? logoH + Math.round(H * 0.045) : 0);
  const topLimit = eyebrowBottom + Math.round(H * 0.03);
  drawHeadline(ctx, opt.headline, opt.accent, accentSpec, textColor, colW, pad, topLimit, bottomLimit, H);
}

// ============ component ============
function ImageStudio({ t, lang, piece, onBack }) {
  const pi0 = piece || { title: "", brief: {}, versions: [{ content: "" }], current: 0 };
  const ctLabel = (() => { const c = CONTENT_TYPES.find(x => x.id === pi0.brief.contentType); return c ? lbl(c, lang).toUpperCase() : "ALIGN"; })();

  const [ready, setReady] = React.useState(false);
  const [spec, setSpec] = React.useState({
    style: "navy",
    eyebrow: ctLabel,
    headline: (pi0.title || "").slice(0, 70),
    accent: "",
    website: pi0.brief.website ? pi0.brief.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : "",
    showLogo: true,
    format: "li_land",
    bgSource: "generated",
    imageSrc: "",
    scrim: 0.55,
  });
  const [ideas, setIdeas] = React.useState([]);
  const [ideasLoading, setIdeasLoading] = React.useState(false);
  const [usedIdea, setUsedIdea] = React.useState(-1);
  const [library, setLibrary] = React.useState(() => ImgStore.load());
  const [exporting, setExporting] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const canvasRef = React.useRef(null);
  const imgElRef = React.useRef(null);
  const [imgTick, setImgTick] = React.useState(0);

  const fmt = FORMATS.find(f => f.id === spec.format) || FORMATS[0];
  const set = (k, v) => { setSpec(s => ({ ...s, [k]: v })); setSaved(false); };

  React.useEffect(() => { ensureAssets().then(() => setReady(true)); }, []);
  // auto-load AI ideas once content exists
  React.useEffect(() => {
    if (pi0.versions && pi0.versions.length && (pi0.versions[pi0.current] || {}).content) fetchIdeas();
    // eslint-disable-next-line
  }, []);

  // load background image element when source changes
  React.useEffect(() => {
    if (spec.bgSource === "image" && spec.imageSrc) {
      loadImageEl(spec.imageSrc).then(im => { imgElRef.current = im; setImgTick(x => x + 1); }).catch(() => {});
    }
  }, [spec.imageSrc, spec.bgSource]);

  // draw preview
  React.useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const c = canvasRef.current;
    if (c.width !== fmt.w || c.height !== fmt.h) { c.width = fmt.w; c.height = fmt.h; }
    drawComposition(c.getContext("2d"), fmt.w, fmt.h, { ...spec, imageEl: imgElRef.current });
  }, [ready, spec, fmt.w, fmt.h, imgTick]);

  async function fetchIdeas() {
    setIdeasLoading(true);
    try { const r = await AI.imageIdeas(pi0, lang); setIdeas(r); } catch (e) {}
    setIdeasLoading(false);
  }
  function applyIdea(idea, i) {
    setSpec(s => ({ ...s, headline: idea.headline, eyebrow: idea.eyebrow || s.eyebrow, accent: idea.accent || "", style: idea.style || s.style, bgSource: "generated" }));
    setUsedIdea(i); setSaved(false);
  }

  function slug() { return (pi0.title || "align").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "align"; }
  function renderTo(w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    drawComposition(c.getContext("2d"), w, h, { ...spec, imageEl: imgElRef.current });
    return c;
  }
  function downloadCanvas(c, name) {
    c.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click();
      a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, "image/png");
  }
  function exportCurrent() {
    downloadCanvas(renderTo(fmt.w, fmt.h), `align-${slug()}-${fmt.id}-${fmt.w}x${fmt.h}.png`);
  }
  async function exportAll() {
    setExporting(true);
    for (const f of FORMATS) {
      downloadCanvas(renderTo(f.w, f.h), `align-${slug()}-${f.id}-${f.w}x${f.h}.png`);
      await new Promise(r => setTimeout(r, 450));
    }
    setExporting(false);
  }
  function saveToLib() {
    const thumbC = renderTo(640, Math.round(640 * fmt.h / fmt.w));
    const thumb = thumbC.toDataURL("image/jpeg", 0.8);
    const item = { id: uid(), type: "generated", spec: { ...spec }, thumb, w: fmt.w, h: fmt.h, label: spec.headline.slice(0, 40), createdAt: Date.now() };
    setLibrary(ImgStore.add(item)); setSaved(true);
  }
  function handleUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const im = await loadImageEl(reader.result);
        const src = downscaleToDataURL(im, 1600, "image/jpeg", 0.82);
        const thumb = downscaleToDataURL(im, 400, "image/jpeg", 0.8);
        const item = { id: uid(), type: "upload", src, thumb, w: im.naturalWidth, h: im.naturalHeight, createdAt: Date.now() };
        setLibrary(ImgStore.add(item));
        setSpec(s => ({ ...s, bgSource: "image", imageSrc: src })); setSaved(false);
      } catch (e) {}
    };
    reader.readAsDataURL(file);
  }
  function useLibItem(item) {
    if (item.type === "upload") setSpec(s => ({ ...s, bgSource: "image", imageSrc: item.src }));
    else if (item.spec) { setSpec({ ...item.spec }); }
    setSaved(false);
  }
  function removeLibItem(id, e) { e.stopPropagation(); setLibrary(ImgStore.remove(id)); }

  const styleDotBg = k => STYLES[k].bg.type === "grad" ? "linear-gradient(95deg,#ff7a1f,#ff4a6b)" : STYLES[k].bg.c;

  return (
    <div className="canvas">
      <div style={{ marginBottom: 18 }}>
        <button className="btn btn-quiet btn-sm" onClick={onBack} style={{ marginLeft: -8, marginBottom: 10 }}><Icon name="arrowLeft" size={15} /> {t("genContent")}</button>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 200, letterSpacing: "-0.025em", color: "var(--navy-800)" }}>{t("imgTitle")}</h1>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "var(--navy-600)", maxWidth: "66ch", lineHeight: 1.55 }}>{t("imgLede")}</p>
        {pi0.title && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--muted)" }}><b style={{ color: "var(--navy-700)", fontWeight: 600 }}>{t("imgFor")}:</b> {pi0.title}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>
        {/* ---- controls ---- */}
        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <SecLabel>{t("secText")}</SecLabel>
          <MiniField label={t("imgEyebrow")}>
            <input className="input" value={spec.eyebrow} onChange={e => set("eyebrow", e.target.value)} placeholder={t("imgEyebrowPh")} />
          </MiniField>
          <MiniField label={t("imgHeadline")}>
            <textarea className="textarea" style={{ minHeight: 70 }} value={spec.headline} onChange={e => set("headline", e.target.value)} placeholder={t("imgHeadlinePh")} />
          </MiniField>
          <MiniField label={t("imgAccent")} help={t("imgAccentHelp")}>
            <input className="input" value={spec.accent} onChange={e => set("accent", e.target.value)} placeholder="—" />
          </MiniField>
          <MiniField label={t("imgWebsite")}>
            <input className="input" value={spec.website} onChange={e => set("website", e.target.value)} placeholder={t("imgWebsitePh")} />
          </MiniField>

          <SecLabel style={{ marginTop: 14 }}>{t("secStyle")}</SecLabel>
          <MiniField label={t("imgFormat")}>
            <select className="select" value={spec.format} onChange={e => set("format", e.target.value)}>
              {FORMATS.map(f => <option key={f.id} value={f.id}>{t(f.key)} · {f.w}×{f.h}</option>)}
            </select>
          </MiniField>
          <MiniField label={t("imgStyle")}>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.keys(STYLES).map(k => (
                <button key={k} onClick={() => { set("style", k); if (spec.bgSource === "image") set("bgSource", "generated"); }}
                  title={t(STYLE_KEYS[k])}
                  style={{ flex: 1, height: 40, borderRadius: 9, cursor: "pointer", background: styleDotBg(k), border: spec.style === k && spec.bgSource !== "image" ? "2.5px solid var(--navy-800)" : "1px solid var(--line)", boxShadow: spec.style === k && spec.bgSource !== "image" ? "0 0 0 2px #fff inset" : "none" }} />
              ))}
            </div>
          </MiniField>
          <label className="check" style={{ marginTop: 6 }}>
            <input type="checkbox" checked={spec.showLogo} onChange={e => set("showLogo", e.target.checked)} />
            <span className="box"><Icon name="check" /></span>
            <span className="check-body"><span className="ttl">{t("imgLogo")}</span></span>
          </label>

          <SecLabel style={{ marginTop: 16 }}>{t("secBg")}</SecLabel>
          <div className="segmented" style={{ display: "flex", marginBottom: 12 }}>
            <button className={spec.bgSource === "generated" ? "on" : ""} onClick={() => set("bgSource", "generated")} style={{ flex: 1 }}>{t("bgGenerated")}</button>
            <button className={spec.bgSource === "image" ? "on" : ""} onClick={() => { if (spec.imageSrc) set("bgSource", "image"); }} style={{ flex: 1 }}>{t("bgUpload")}</button>
            <button className={spec.bgSource === "library" ? "on" : ""} onClick={() => set("bgSource", "library")} style={{ flex: 1 }}>{t("bgLibrary")}</button>
          </div>

          {spec.bgSource !== "library" && (
            <label className="dropzone" style={{ marginBottom: 10 }}>
              <Icon name="upload" /> {t("uploadImg")}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleUpload(e.target.files[0])} />
            </label>
          )}
          {spec.bgSource !== "library" && <div className="field-help" style={{ marginBottom: 8 }}>{t("uploadHelp")}</div>}

          {spec.bgSource === "image" && spec.imageSrc && (
            <MiniField label={`${t("scrim")}`}>
              <input type="range" className="range" min="0" max="1" step="0.05" value={spec.scrim} onChange={e => set("scrim", +e.target.value)} />
            </MiniField>
          )}

          {spec.bgSource === "library" && (
            library.length === 0 ? <div className="field-help">{t("noLibImgs")}</div> : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {library.map(item => (
                  <div key={item.id} onClick={() => useLibItem(item)} style={{ position: "relative", borderRadius: 8, overflow: "hidden", cursor: "pointer", border: "1px solid var(--line)", aspectRatio: "16/10", background: "var(--navy-50)" }}>
                    <img src={item.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button onClick={e => removeLibItem(item.id, e)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(10,13,24,0.7)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="x" size={12} /></button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* ---- preview + suggestions ---- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--navy-800)", display: "flex", alignItems: "center", gap: 8 }}><Icon name="image" size={15} /> {t(fmt.key)} · {fmt.w}×{fmt.h}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={saveToLib}><Icon name={saved ? "check" : "layers"} size={15} /> {saved ? t("savedToLib") : t("saveToLib")}</button>
                <button className="btn btn-ghost btn-sm" onClick={exportAll} disabled={exporting}><Icon name="layers" size={15} /> {exporting ? t("exporting") : t("downloadAll")}</button>
                <button className="btn btn-primary btn-sm" onClick={exportCurrent}><Icon name="download" size={15} /> {t("download")}</button>
              </div>
            </div>
            <div style={{ padding: 24, background: "var(--navy-50)", display: "grid", placeItems: "center" }}>
              <canvas ref={canvasRef} style={{ width: "100%", maxWidth: Math.min(720, fmt.w), height: "auto", borderRadius: 6, boxShadow: "var(--shadow-card)", display: ready ? "block" : "none" }} />
              {!ready && <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--navy-500)", padding: 60 }}><span className="spinner spinner-sm"></span> {t("imgPreview")}…</div>}
            </div>
          </div>

          {/* AI suggestions */}
          <div className="card card-pad">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--navy-800)", display: "flex", alignItems: "center", gap: 8 }}><Icon name="wand" size={16} /> {t("suggestions")}</h3>
              <button className="btn btn-ghost btn-sm" onClick={fetchIdeas} disabled={ideasLoading}>
                {ideasLoading ? <span className="spinner spinner-sm"></span> : <Icon name="refresh" size={14} />} {ideas.length ? t("regenIdeas") : t("genIdeas")}
              </button>
            </div>
            {ideasLoading && ideas.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", padding: "8px 0" }}><span className="spinner spinner-sm"></span> {t("generatingIdeas")}</div>
            ) : ideas.length === 0 ? (
              <div className="field-help">{t("genIdeas")} →</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10 }}>
                {ideas.map((idea, i) => (
                  <button key={i} onClick={() => applyIdea(idea, i)} style={{ textAlign: "left", background: usedIdea === i ? "var(--accent-050)" : "#fff", border: "1px solid " + (usedIdea === i ? "var(--accent)" : "var(--line)"), borderRadius: 10, padding: 14, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 4, background: styleDotBg(idea.style), border: "1px solid var(--line)", flex: "none" }} />
                      <span style={{ fontSize: 9.5, letterSpacing: "0.12em", color: "var(--muted)", fontWeight: 600 }}>{idea.eyebrow}</span>
                    </span>
                    <span style={{ fontSize: 14.5, fontWeight: 500, color: "var(--navy-800)", lineHeight: 1.3 }}>{idea.headline}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: usedIdea === i ? "var(--accent-600)" : "var(--navy-500)", display: "flex", alignItems: "center", gap: 5 }}>
                      {usedIdea === i ? <><Icon name="check" size={13} /> {t("used")}</> : <>{t("useThis")} <Icon name="arrowRight" size={13} /></>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SecLabel({ children, style }) {
  return <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent-600)", marginBottom: 12, ...style }}>{children}</div>;
}
function MiniField({ label, help, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--navy-800)", marginBottom: 6 }}>{label}</div>
      {children}
      {help && <div className="field-help" style={{ marginTop: 5 }}>{help}</div>}
    </div>
  );
}

Object.assign(window, { ImageStudio });
