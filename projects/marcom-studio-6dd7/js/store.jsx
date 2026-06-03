// store.jsx — persistence, AI pipeline, markdown rendering, stats
// Exports to window: Store, AI, renderMarkdown, computeStats, uid, ALIGN_VOICE

const LS_KEY = "align_marcom_pieces_v1";
const LS_PREFS = "align_marcom_prefs_v1";
const LS_IMGS = "align_marcom_images_v1";

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

const Store = {
  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY));
      if (!Array.isArray(raw)) return [];
      return raw.filter(p => p && p.id && p.brief && Array.isArray(p.versions)).map(p => ({
        id: p.id,
        title: p.title || "Untitled",
        status: p.status === "active" ? "active" : "pending",
        brief: p.brief || {},
        versions: p.versions.filter(v => v && typeof v.content === "string"),
        current: Math.max(0, Math.min((p.versions || []).length - 1, p.current || 0)),
        tags: Array.isArray(p.tags) ? p.tags : [],
        fav: !!p.fav,
        createdAt: p.createdAt || Date.now(),
        updatedAt: p.updatedAt || Date.now(),
      })).filter(p => p.status !== "pending" || p.versions.length > 0 ? true : false);
    } catch (e) { return []; }
  },
  save(pieces) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(pieces)); } catch (e) {}
  },
  loadPrefs() {
    try { return JSON.parse(localStorage.getItem(LS_PREFS)) || {}; } catch (e) { return {}; }
  },
  savePrefs(p) {
    try { localStorage.setItem(LS_PREFS, JSON.stringify(p)); } catch (e) {}
  }
};

// ---- image library ----
const ImgStore = {
  load() {
    try { const r = JSON.parse(localStorage.getItem(LS_IMGS)); return Array.isArray(r) ? r : []; } catch (e) { return []; }
  },
  save(imgs) {
    try { localStorage.setItem(LS_IMGS, JSON.stringify(imgs)); } catch (e) {}
  },
  add(item) {
    const imgs = ImgStore.load();
    imgs.unshift(item);
    // cap to keep within quota
    const capped = imgs.slice(0, 40);
    ImgStore.save(capped);
    return capped;
  },
  remove(id) {
    const imgs = ImgStore.load().filter(i => i.id !== id);
    ImgStore.save(imgs);
    return imgs;
  }
};

// downscale an image source (dataURL/HTMLImageElement) to a JPEG/PNG dataURL within maxDim
function downscaleToDataURL(img, maxDim, mime, quality) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  let w = iw, h = ih;
  if (Math.max(iw, ih) > maxDim) {
    const s = maxDim / Math.max(iw, ih);
    w = Math.round(iw * s); h = Math.round(ih * s);
  }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  return c.toDataURL(mime || "image/jpeg", quality || 0.82);
}
function loadImageEl(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im); im.onerror = rej;
    im.crossOrigin = "anonymous"; im.src = src;
  });
}

// ---- Align tone of voice (fed to the model) ----
const ALIGN_VOICE = `BRAND: Align — an independent IFS/ERP consultancy. Position: "We are the independent IFS experts who, with a twinkle in our eye, ensure that the business system works for the people who use it." Core message: "Passionate about IFS. Dedicated to you."
VOICE ATTRIBUTES:
- Approachable: accessible and easy to engage with; open the door, don't guard it.
- Unpretentious: never use complexity to sound smart; plain words do heavier lifting than jargon.
- Grounded: focused on the practical reality of the client's workday — real friction, real people.
- Committed: loyal to the client's best interest; stand in their corner, not the vendor's.
TONE: Professional, but never stiff. Use light humour to simplify the complex and humility to build trust. Speak as a partner deeply invested in the client's success. Avoid hype, buzzwords, and empty superlatives. Prefer concrete examples over abstractions.`;

// ---- AI helpers ----
async function complete(prompt) {
  if (!window.claude || !window.claude.complete) {
    throw new Error("AI unavailable");
  }
  return await window.claude.complete(prompt);
}

function langName(code) {
  return { sv: "Swedish", en: "English", no: "Norwegian", da: "Danish", fi: "Finnish" }[code] || "Swedish";
}

function extractJSON(text) {
  if (!text) return null;
  // try fenced (build regex without backtick literals — they break in-browser Babel)
  const FENCE = String.fromCharCode(96, 96, 96);
  let m = text.match(new RegExp(FENCE + "(?:json)?\\s*([\\s\\S]*?)" + FENCE));
  let raw = m ? m[1] : text;
  // find first balanced object or array
  const startObj = raw.indexOf("{"); const startArr = raw.indexOf("[");
  let start = -1;
  if (startObj === -1) start = startArr;
  else if (startArr === -1) start = startObj;
  else start = Math.min(startObj, startArr);
  if (start === -1) return null;
  const open = raw[start]; const close = open === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === open) depth++;
    else if (raw[i] === close) { depth--; if (depth === 0) { try { return JSON.parse(raw.slice(start, i + 1)); } catch (e) { return null; } } }
  }
  return null;
}

function briefContext(brief) {
  const parts = [];
  const ct = (CONTENT_TYPES.find(c => c.id === brief.contentType) || {}).en || brief.contentType;
  parts.push(`Content type: ${ct}.`);
  if (brief.topic) parts.push(`Topic: ${brief.topic}.`);
  if (brief.topicDocName) parts.push(`A source document was provided: "${brief.topicDocName}". Treat the topic as derived from it.`);
  const aud = AUDIENCES.find(a => a.id === brief.audience); if (aud) parts.push(`Target audience: ${aud.en}.`);
  const goal = GOALS.find(g => g.id === brief.goal); if (goal) parts.push(`Primary goal: ${goal.en}.`);
  const tone = TONES.find(t => t.id === brief.tone); if (tone) parts.push(`Tonality: ${tone.en}.`);
  if (brief.include) parts.push(`Keywords to include naturally: ${brief.include}.`);
  if (brief.exclude) parts.push(`Words/phrases to avoid: ${brief.exclude}.`);
  if (brief.website) parts.push(`Published on: ${brief.website}.`);
  if (brief.resourceUrls) parts.push(`Reference sources provided by the author: ${brief.resourceUrls}. Reflect their likely subject matter.`);
  if (brief.instructions) parts.push(`Additional instructions: ${brief.instructions}.`);
  if (brief.webSearch) parts.push(`Draw broadly on well-established public knowledge about this topic and the IFS/ERP domain.`);
  else parts.push(`Write from the provided material and reasonable general knowledge; do not invent specific statistics.`);
  return parts.join(" ");
}

const SHORT_TYPES = ["linkedin", "ad"];

const AI = {
  // returns {title, headings:[...]}
  async outline(brief, lang) {
    const ln = langName(brief.language || lang);
    const target = brief.length || 1000;
    const nSec = Math.max(2, Math.min(6, Math.round(target / 240)));
    const prompt = `${ALIGN_VOICE}

You are Align's senior content strategist. Plan a piece of marketing content.
${briefContext(brief)}

Produce a JSON object with:
- "title": a compelling ${ln} title (no markdown, plain text)
- "sections": an array of exactly ${nSec} objects, each {"heading": "<short ${ln} section heading>", "focus": "<one sentence on what this section covers, in ${ln}>"}

Return ONLY the JSON object.`;
    const res = await complete({ messages: [{ role: "user", content: prompt }] });
    const j = extractJSON(res);
    if (j && j.title && Array.isArray(j.sections)) return j;
    // fallback
    return { title: brief.topic || "Untitled", sections: [{ heading: "", focus: brief.topic || "" }] };
  },

  async section(brief, lang, title, sec, prevHeadings) {
    const ln = langName(brief.language || lang);
    const wordsPer = Math.round((brief.length || 1000) / Math.max(1, prevHeadings.totalSections));
    const voice = brief.voiceProfile === "align" ? ALIGN_VOICE + "\nApply this brand voice strictly." : "Write in a clear, natural marketing voice.";
    const prompt = `${voice}

You are writing one section of a longer ${ln} piece titled "${title}".
${briefContext(brief)}

Write ONLY the section with heading "${sec.heading}". Focus: ${sec.focus}
Rules:
- Language: ${ln}.
- Start with a "## ${sec.heading}" markdown heading (omit if the heading is empty).
- About ${wordsPer} words. Use short paragraphs; add a bullet list only if it genuinely helps.
- Do NOT repeat the document title. Do NOT write a conclusion unless this is the final section.
- Plain markdown only.`;
    const res = await complete({ messages: [{ role: "user", content: prompt }] });
    return (res || "").trim();
  },

  // short single-call types
  async single(brief, lang) {
    const ln = langName(brief.language || lang);
    const ct = (CONTENT_TYPES.find(c => c.id === brief.contentType) || {}).en;
    const voice = brief.voiceProfile === "align" ? ALIGN_VOICE + "\nApply this brand voice strictly." : "Write in a clear, natural marketing voice.";
    const lenNote = brief.contentType === "linkedin" ? "120–220 words, punchy, with 2–3 relevant hashtags at the end" : "60–120 words, persuasive, with a clear call to action";
    const prompt = `${voice}

Write a ${ct} in ${ln}.
${briefContext(brief)}

Rules: ${lenNote}. Use a "# " markdown title line, then the body. Natural line breaks. Plain markdown only.`;
    const res = await complete({ messages: [{ role: "user", content: prompt }] });
    return (res || "").trim();
  },

  // Full pipeline with activity callback. onAct(type, text)
  async generate(brief, lang, onAct) {
    const ln = langName(brief.language || lang);
    if (brief.webSearch) {
      onAct("search", `${brief.topic || (brief.topicDocName || "")} ${(CONTENT_TYPES.find(c=>c.id===brief.contentType)||{}).en || ""}`.trim());
      if (brief.resourceUrls) {
        brief.resourceUrls.split(/[,\n]/).map(s => s.trim()).filter(Boolean).slice(0, 4).forEach(u => onAct("read", u));
      }
    }
    if (brief.voiceProfile === "align") onAct("voice", "Align_Tone of Voice Guidelines_final");

    if (SHORT_TYPES.includes(brief.contentType)) {
      onAct("write", brief.topic || (CONTENT_TYPES.find(c=>c.id===brief.contentType)||{}).en);
      const body = await this.single(brief, lang);
      onAct("done", "");
      return body;
    }

    onAct("plan", "");
    const plan = await this.outline(brief, lang);
    plan.sections.forEach(s => {}); // noop
    let md = `# ${plan.title}\n\n`;
    const ctx = { totalSections: plan.sections.length };
    for (let i = 0; i < plan.sections.length; i++) {
      const sec = plan.sections[i];
      onAct("write", sec.heading || plan.title);
      const txt = await this.section(brief, lang, plan.title, sec, ctx);
      md += txt.replace(/^#\s+.*$/m, "").trim() + "\n\n";
    }
    onAct("polish", "");
    onAct("done", "");
    return md.trim();
  },

  // refine: chunk by ## headings so long docs survive the token cap
  async refine(content, instruction, brief, lang) {
    const ln = langName(brief.language || lang);
    const voice = brief.voiceProfile === "align" ? ALIGN_VOICE : "";
    // split keeping the leading title chunk
    const lines = content.split("\n");
    const chunks = [];
    let cur = [];
    lines.forEach(l => {
      if (/^##\s/.test(l) && cur.length) { chunks.push(cur.join("\n")); cur = [l]; }
      else cur.push(l);
    });
    if (cur.length) chunks.push(cur.join("\n"));
    // if small enough, single pass
    if (content.length < 2200 || chunks.length <= 1) {
      const prompt = `${voice}
Revise the following ${ln} marketing content according to this instruction: "${instruction}".
Keep markdown formatting. Return ONLY the revised content, no commentary.

CONTENT:
${content}`;
      const res = await complete({ messages: [{ role: "user", content: prompt }] });
      return (res || content).trim();
    }
    const out = [];
    for (let i = 0; i < chunks.length; i++) {
      const prompt = `${voice}
You are revising part ${i + 1} of ${chunks.length} of a ${ln} marketing piece. Apply this instruction to THIS part only: "${instruction}".
Preserve the markdown heading if present. Return ONLY the revised part, no commentary.

PART:
${chunks[i]}`;
      const res = await complete({ messages: [{ role: "user", content: prompt }] });
      out.push((res || chunks[i]).trim());
    }
    return out.join("\n\n");
  },

  async factCheck(content, lang) {
    const ln = langName(lang);
    const prompt = `Review the following marketing content for factual accuracy. Identify specific factual claims (statistics, dates, names, capabilities) that should be verified.
Return ONLY a JSON array (max 6 items): [{"claim":"<the claim, in ${ln}>","status":"verify"|"caution"|"ok","note":"<short note in ${ln}>"}].
status: "caution" = likely inaccurate or risky; "verify" = plausible but should be confirmed; "ok" = uncontroversial.

CONTENT:
${content.slice(0, 4000)}`;
    const res = await complete({ messages: [{ role: "user", content: prompt }] });
    const j = extractJSON(res);
    return Array.isArray(j) ? j : [];
  },

  // image headline/layout ideas
  async imageIdeas(piece, lang) {
    const ln = langName(piece.brief.language || lang);
    const content = (piece.versions[piece.current] || {}).content || "";
    const aud = (AUDIENCES.find(a => a.id === piece.brief.audience) || {}).en || "";
    const goal = (GOALS.find(g => g.id === piece.brief.goal) || {}).en || "";
    const prompt = `${ALIGN_VOICE}

You design social/website key visuals for Align. Based on this piece, propose 4 distinct image concepts.
Title: ${piece.title}
Audience: ${aud}. Goal: ${goal}.
Excerpt: ${content.slice(0, 900)}

For each concept return: a very short headline for the image (max 7 words, ${ln}, no quotes, sentence case), an eyebrow label (2-3 words, ${ln}, UPPERCASE), the single most impactful word from the headline to accent, and a style from: navy, gradient, bone, ink.
Return ONLY a JSON array of 4 objects: [{"headline":"...","eyebrow":"...","accent":"...","style":"navy"}]`;
    const res = await complete({ messages: [{ role: "user", content: prompt }] });
    const j = extractJSON(res);
    if (!Array.isArray(j)) return [];
    const styles = ["navy", "gradient", "bone", "ink"];
    return j.filter(x => x && x.headline).map((x, i) => ({
      headline: String(x.headline).replace(/^["']|["']$/g, ""),
      eyebrow: String(x.eyebrow || "").toUpperCase(),
      accent: String(x.accent || "").replace(/[^\p{L}\p{N}-]/gu, ""),
      style: styles.includes(x.style) ? x.style : styles[i % 4],
    }));
  }
};

// ---- stats ----
function computeStats(md) {
  let text = String(md || "").split(String.fromCharCode(96)).join(" ");
  text = text.replace(/https?:\/\/\S+/g, " ").replace(/[#>*_~\[\]()!\-]+/g, " ");
  const words = (text.trim().match(/\S+/g) || []).length;
  const chars = (md || "").length;
  const read = Math.max(1, Math.round(words / 200));
  return { words, chars, read };
}

// ---- markdown -> html ----
function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function inline(s) {
  s = esc(s);
  const BT = String.fromCharCode(96);
  s = s.replace(new RegExp(BT + "([^" + BT + "]+)" + BT, "g"), "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/\b_([^_\n]+)_\b/g, "<em>$1</em>");
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
function renderMarkdown(md) {
  if (!md) return "";
  const lines = md.replace(/\r/g, "").split("\n");
  let html = ""; let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    if (/^---+$/.test(line.trim())) { html += "<hr/>"; i++; continue; }
    let h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { const lvl = h[1].length; html += `<h${lvl}>${inline(h[2])}</h${lvl}>`; i++; continue; }
    if (/^\s*>/.test(line)) {
      let buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      html += `<blockquote>${inline(buf.join(" "))}</blockquote>`; continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      let buf = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { buf.push("<li>" + inline(lines[i].replace(/^\s*[-*+]\s+/, "")) + "</li>"); i++; }
      html += `<ul>${buf.join("")}</ul>`; continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      let buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push("<li>" + inline(lines[i].replace(/^\s*\d+\.\s+/, "")) + "</li>"); i++; }
      html += `<ol>${buf.join("")}</ol>`; continue;
    }
    // paragraph (gather until blank)
    let buf = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,3}\s|>|\s*[-*+]\s|\s*\d+\.\s|---+$)/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    html += `<p>${inline(buf.join(" "))}</p>`;
  }
  return html;
}

Object.assign(window, { Store, ImgStore, AI, renderMarkdown, computeStats, uid, ALIGN_VOICE, downscaleToDataURL, loadImageEl });
