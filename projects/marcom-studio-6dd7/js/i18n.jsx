// i18n.jsx — translations (SV/EN), content types, audiences, goals, tones, voice profiles
// Exports to window: T, useStr, CONTENT_TYPES, AUDIENCES, GOALS, TONES, VOICE_PROFILES, LANGS

const STRINGS = {
  sv: {
    product: "MarCom Studio",
    logout: "Logga ut",
    backStart: "Tillbaka till start",
    // library
    libTitle: "Innehållsbibliotek",
    libLede: "Skapa högkvalitativt innehåll till hemsida, LinkedIn och mer — i Aligns röst.",
    newPiece: "Skapa nytt innehåll",
    searchLib: "Sök bland sparat innehåll…",
    empty: "Inget sparat innehåll ännu",
    emptySub: "Kom igång genom att skapa ditt första innehåll med AI.",
    filterAll: "Alla",
    updated: "Uppdaterad",
    version: "version",
    versions: "versioner",
    words: "ord",
    deletePiece: "Ta bort",
    confirmDelete: "Ta bort detta innehåll permanent?",
    // wizard intro
    wizTitle: "Skapa nytt innehåll",
    wizLede: "Fyll i formuläret nedan för att generera högkvalitativt innehåll med AI. Du kan förfina och iterera resultatet efter generering.",
    // steps
    step1: "Ämne & typ", step1s: "Vad och vilken typ",
    step2: "Källor", step2s: "Underlag (valfritt)",
    step3: "Detaljer", step3s: "Målgrupp, ton, längd m.m",
    // step 1 fields
    fTopic: "Ämne", fTopicPh: "t.ex. Framtiden för AI inom marknadsföring", fTopicHelp: "Vad ska innehållet om?",
    fTopicDoc: "Ämnesdokument", fTopicDocHelp: "Ladda upp ett dokument som ämnet ska utgå från. Du kan fortsätta med antingen ett ämne ovan eller ett dokument här.",
    upload: "Ladda upp ämnesdokument", remove: "Ta bort",
    fType: "Innehållstyp", fTypeHelp: "Välj vilken typ av innehåll du vill skapa.",
    // step 2
    fWebSearch: "Aktivera webbsökning", fWebSearchHelp: "AI:n söker information om ämnet innan innehållet skrivs. Stäng av för helt påhittat eller fritt skrivet innehåll.",
    fUrls: "Resurs-URL:er", fUrlsPh: "https://example.com, https://another-site.com",
    fUrlsHelp: "Klistra in länkar till artiklar eller källor som AI:n ska läsa och referera till. Använd för att grunda innehållet i specifika fakta. Max 10 URL:er.",
    fWebsite: "Webbsida", fWebsitePh: "https://example.se", fWebsiteHelp: "Vilken webbsida innehållet är för. Hjälper AI:n att hålla ton, exempel och referenser relevanta för avsändaren.",
    sourcesTitle: "Källor & underlag", sourcesLede: "Allt här är valfritt. Lägg till källor om du vill grunda innehållet i specifika fakta.",
    // step 3
    fAudience: "Målgrupp", fAudienceHelp: "Vem skriver du för?",
    fGoal: "Primärt mål", fGoalHelp: "Vad är det primära målet med detta innehåll?",
    fToneSec: "Tonalitet", fToneHelp: "Tonaliteten styrs av den valda varumärkesrösten.",
    fVoice: "Varumärkesröst-riktlinjer", fVoiceHelp: "Varumärkestext kommer att tillämpas på genererat innehåll.",
    fLength: "Önskad längd", lenMin: "Min: 500 ord", lenRec: "Rekommenderat: 1000 ord", lenMax: "Max: 3000 ord", wordsUnit: "ord",
    fInclude: "Nyckelord att inkludera", fIncludePh: "t.ex. AI, maskininlärning, automatisering (kommaseparerade)", fIncludeHelp: "Kommaseparerad lista med nyckelord att inkludera",
    fExclude: "Nyckelord att undvika", fExcludePh: "t.ex. billig, rabatt, rea (kommaseparerade)", fExcludeHelp: "Kommaseparerad lista med nyckelord att undvika",
    fLang: "Språk", fLangHelp: "På vilket språk ska innehållet skrivas?",
    fInstr: "Ytterligare instruktioner", fInstrPh: "Eventuella ytterligare instruktioner eller kontext…", fInstrHelp: "Ange ytterligare kontext eller speciella instruktioner",
    detailsTitle: "Detaljer", detailsLede: "Anpassa målgrupp, ton och längd så att innehållet träffar rätt.",
    // nav
    next: "Nästa", back: "Tillbaka", generate: "Generera innehåll",
    nextHintTopic: "Ange ett ämne eller ladda upp ett ämnesdokument för att fortsätta",
    nextHintType: "Välj en innehållstyp för att fortsätta",
    // generating
    genTitle: "Genererar ditt innehåll…", genSub: "Denna sida uppdateras automatiskt när det är klart.",
    activity: "Aktivitet", cancel: "Avbryt",
    actSearch: "Söker", actRead: "Läser", actVoice: "Tillämpar varumärkesröst", actWrite: "Skriver innehåll", actPolish: "Putsar och faktagranskar", actDone: "Klart",
    // result
    restart: "Börja om", restartConfirm: "Generera om allt från grunden? Nuvarande versioner sparas i historiken.",
    settings: "Inställningar",
    nWords: "Antal ord", nChars: "Tecken", nRead: "Lästid", min: "min",
    refineTitle: "Förfina ditt innehåll", refineLede: "Korta ner, lägg till detaljer, ändra ton med mera.",
    genContent: "Genererat innehåll", edit: "Redigera", copy: "Kopiera", copied: "Kopierat!", factcheck: "Faktakontroll",
    refinePh: "t.ex. Gör det kortare och mer engagerande…",
    refining: "Förfinar innehåll… Detta kan ta upp till 1 minut",
    versionOf: "Version {a} av {b}", addTag: "Lägg till tagg", tag: "Tagg",
    quickChips: ["Gör det kortare", "Mer engagerande", "Lägg till en CTA", "Mer professionell ton", "Lägg till underrubriker"],
    // editor
    edTitle: "Genererat innehåll", save: "Spara",
    tBold: "Fet", tItalic: "Kursiv", tList: "Lista", tNumList: "Numrerad", tLink: "Länk", tCode: "Kod", tQuote: "Citat",
    edHint: "Redigera i Markdown. Använd verktygsfältet eller skriv direkt.",
    preview: "Förhandsvisa",
    // factcheck
    fcTitle: "Faktakontroll", fcRunning: "Granskar påståenden i innehållet…", fcClose: "Stäng", fcEmpty: "Inga uppenbara faktafel hittades. Granska alltid känsliga uppgifter manuellt.",
    fcDisclaimer: "AI-genererad granskning. Verifiera viktiga fakta mot primärkällor.",
    // misc
    aiError: "Något gick fel vid generering. Försök igen.",
    // image studio
    createImageCta: "Skapa bild",
    imgTitle: "Skapa bild",
    imgLede: "Skapa en varumärkesbild som förstärker texten – för hemsidan eller LinkedIn. AI föreslår rubrik och layout enligt Align Design System.",
    imgFor: "Innehåll",
    secText: "Text & idéer", secStyle: "Stil & format", secBg: "Bakgrund",
    genIdeas: "Generera förslag", regenIdeas: "Nya förslag", generatingIdeas: "Tar fram förslag…",
    suggestions: "AI-förslag", useThis: "Använd", used: "Vald",
    imgEyebrow: "Överrad", imgEyebrowPh: "t.ex. ARTIKEL · AI",
    imgHeadline: "Rubrik", imgHeadlinePh: "Kort, slagkraftig rubrik",
    imgAccent: "Accentord", imgAccentHelp: "Ett ord i rubriken som färgsätts. Lämna tomt för ingen accent.",
    imgWebsite: "Webbadress (valfritt)", imgWebsitePh: "align.se",
    imgStyle: "Stil", imgFormat: "Format", imgLogo: "Visa logotyp",
    styleNavy: "Marin", styleGradient: "Gradient", styleBone: "Ljus", styleInk: "Svart", stylePhoto: "Foto",
    fmtLiLand: "LinkedIn · inlägg", fmtLiSquare: "LinkedIn · kvadrat", fmtHero: "Hemsida · hero", fmtFeatured: "Hemsida · featured",
    bgGenerated: "Genererad", bgUpload: "Ladda upp", bgLibrary: "Tidigare",
    uploadImg: "Ladda upp en bild", uploadHelp: "PNG eller JPG. Bilden beskärs och får varumärkesöverlägg.",
    scrim: "Mörkhet", noLibImgs: "Inga sparade bilder ännu.",
    download: "Ladda ner", downloadAll: "Exportera alla storlekar", saveToLib: "Spara i bibliotek", savedToLib: "Sparad i bibliotek",
    exporting: "Exporterar…", imgPreview: "Förhandsvisning",
  },
  en: {
    product: "MarCom Studio",
    logout: "Log out",
    backStart: "Back to start",
    libTitle: "Content library",
    libLede: "Create high-quality content for your website, LinkedIn and more — in Align's voice.",
    newPiece: "Create new content",
    searchLib: "Search saved content…",
    empty: "No saved content yet",
    emptySub: "Get started by creating your first piece with AI.",
    filterAll: "All",
    updated: "Updated",
    version: "version",
    versions: "versions",
    words: "words",
    deletePiece: "Delete",
    confirmDelete: "Permanently delete this content?",
    wizTitle: "Create new content",
    wizLede: "Fill in the form below to generate high-quality content with AI. You can refine and iterate the result after generation.",
    step1: "Topic & type", step1s: "What and which type",
    step2: "Sources", step2s: "Material (optional)",
    step3: "Details", step3s: "Audience, tone, length etc.",
    fTopic: "Topic", fTopicPh: "e.g. The future of AI in marketing", fTopicHelp: "What should the content be about?",
    fTopicDoc: "Topic document", fTopicDocHelp: "Upload a document for the topic to draw from. You can continue with either a topic above or a document here.",
    upload: "Upload topic document", remove: "Remove",
    fType: "Content type", fTypeHelp: "Choose which type of content to create.",
    fWebSearch: "Enable web search", fWebSearchHelp: "The AI searches for information about the topic before writing. Turn off for fully invented or freely written content.",
    fUrls: "Resource URLs", fUrlsPh: "https://example.com, https://another-site.com",
    fUrlsHelp: "Paste links to articles or sources for the AI to read and reference. Use to ground content in specific facts. Max 10 URLs.",
    fWebsite: "Website", fWebsitePh: "https://example.com", fWebsiteHelp: "Which website the content is for. Helps the AI keep tone, examples and references relevant.",
    sourcesTitle: "Sources & material", sourcesLede: "Everything here is optional. Add sources to ground the content in specific facts.",
    fAudience: "Audience", fAudienceHelp: "Who are you writing for?",
    fGoal: "Primary goal", fGoalHelp: "What is the primary goal of this content?",
    fToneSec: "Tonality", fToneHelp: "Tonality is governed by the selected brand voice.",
    fVoice: "Brand voice guidelines", fVoiceHelp: "Brand text will be applied to the generated content.",
    fLength: "Desired length", lenMin: "Min: 500 words", lenRec: "Recommended: 1000 words", lenMax: "Max: 3000 words", wordsUnit: "words",
    fInclude: "Keywords to include", fIncludePh: "e.g. AI, machine learning, automation (comma separated)", fIncludeHelp: "Comma-separated list of keywords to include",
    fExclude: "Keywords to avoid", fExcludePh: "e.g. cheap, discount, sale (comma separated)", fExcludeHelp: "Comma-separated list of keywords to avoid",
    fLang: "Language", fLangHelp: "Which language should the content be written in?",
    fInstr: "Additional instructions", fInstrPh: "Any additional instructions or context…", fInstrHelp: "Provide extra context or special instructions",
    detailsTitle: "Details", detailsLede: "Tune audience, tone and length so the content lands right.",
    next: "Next", back: "Back", generate: "Generate content",
    nextHintTopic: "Enter a topic or upload a topic document to continue",
    nextHintType: "Choose a content type to continue",
    genTitle: "Generating your content…", genSub: "This page updates automatically when it's ready.",
    activity: "Activity", cancel: "Cancel",
    actSearch: "Searching", actRead: "Reading", actVoice: "Applying brand voice", actWrite: "Writing content", actPolish: "Polishing and fact-checking", actDone: "Done",
    restart: "Start over", restartConfirm: "Regenerate everything from scratch? Current versions are kept in history.",
    settings: "Settings",
    nWords: "Word count", nChars: "Characters", nRead: "Read time", min: "min",
    refineTitle: "Refine your content", refineLede: "Shorten, add detail, change tone and more.",
    genContent: "Generated content", edit: "Edit", copy: "Copy", copied: "Copied!", factcheck: "Fact-check",
    refinePh: "e.g. Make it shorter and more engaging…",
    refining: "Refining content… This can take up to 1 minute",
    versionOf: "Version {a} of {b}", addTag: "Add tag", tag: "Tag",
    quickChips: ["Make it shorter", "More engaging", "Add a CTA", "More professional tone", "Add subheadings"],
    edTitle: "Generated content", save: "Save",
    tBold: "Bold", tItalic: "Italic", tList: "List", tNumList: "Numbered", tLink: "Link", tCode: "Code", tQuote: "Quote",
    edHint: "Edit in Markdown. Use the toolbar or type directly.",
    preview: "Preview",
    fcTitle: "Fact-check", fcRunning: "Reviewing claims in the content…", fcClose: "Close", fcEmpty: "No obvious factual errors found. Always review sensitive figures manually.",
    fcDisclaimer: "AI-generated review. Verify important facts against primary sources.",
    aiError: "Something went wrong during generation. Please try again.",
    createImageCta: "Create image",
    imgTitle: "Create image",
    imgLede: "Create a branded image that reinforces the text – for the website or LinkedIn. AI suggests a headline and layout following the Align Design System.",
    imgFor: "Content",
    secText: "Text & ideas", secStyle: "Style & format", secBg: "Background",
    genIdeas: "Generate ideas", regenIdeas: "New ideas", generatingIdeas: "Generating ideas…",
    suggestions: "AI suggestions", useThis: "Use", used: "Selected",
    imgEyebrow: "Eyebrow", imgEyebrowPh: "e.g. ARTICLE · AI",
    imgHeadline: "Headline", imgHeadlinePh: "Short, punchy headline",
    imgAccent: "Accent word", imgAccentHelp: "One word in the headline gets colored. Leave empty for no accent.",
    imgWebsite: "Web address (optional)", imgWebsitePh: "align.com",
    imgStyle: "Style", imgFormat: "Format", imgLogo: "Show logo",
    styleNavy: "Navy", styleGradient: "Gradient", styleBone: "Light", styleInk: "Ink", stylePhoto: "Photo",
    fmtLiLand: "LinkedIn · post", fmtLiSquare: "LinkedIn · square", fmtHero: "Website · hero", fmtFeatured: "Website · featured",
    bgGenerated: "Generated", bgUpload: "Upload", bgLibrary: "Previous",
    uploadImg: "Upload an image", uploadHelp: "PNG or JPG. The image is cropped and gets a brand overlay.",
    scrim: "Darkness", noLibImgs: "No saved images yet.",
    download: "Download", downloadAll: "Export all sizes", saveToLib: "Save to library", savedToLib: "Saved to library",
    exporting: "Exporting…", imgPreview: "Preview",
  }
};

// content types: id, sv label, en label, sv/en desc, icon key
const CONTENT_TYPES = [
  { id: "blog",     icon: "doc",      sv: "Blogginlägg",     en: "Blog post",    svd: "Längre, SEO-vänligt inlägg", end: "Longer, SEO-friendly article" },
  { id: "linkedin", icon: "linkedin", sv: "LinkedIn-inlägg", en: "LinkedIn post", svd: "Kort, personligt och delbart", end: "Short, personal, shareable" },
  { id: "web",      icon: "layout",   sv: "Webbsidetext",    en: "Website copy",  svd: "Sidtext för hemsida", end: "Page copy for a website" },
  { id: "press",    icon: "mega",     sv: "Pressmeddelande", en: "Press release", svd: "Formellt, nyhetsformat", end: "Formal, news format" },
  { id: "news",     icon: "mail",     sv: "Nyhetsbrev",      en: "Newsletter",   svd: "E-post till prenumeranter", end: "Email to subscribers" },
  { id: "case",     icon: "award",    sv: "Kundcase",        en: "Case study",   svd: "Resultat och kundresa", end: "Results and customer journey" },
  { id: "ad",       icon: "spark",    sv: "Annonstext",      en: "Ad copy",      svd: "Kort, säljande copy", end: "Short, persuasive copy" },
];

const AUDIENCES = [
  { id: "customers", sv: "Kunder", en: "Customers" },
  { id: "prospects", sv: "Potentiella kunder", en: "Prospects" },
  { id: "itleaders", sv: "IT- & systemansvariga", en: "IT & system owners" },
  { id: "execs",     sv: "Ledning & beslutsfattare", en: "Executives & decision-makers" },
  { id: "partners",  sv: "Partners", en: "Partners" },
  { id: "talent",    sv: "Talanger & kandidater", en: "Talent & candidates" },
  { id: "general",   sv: "Allmänheten", en: "General public" },
];

const GOALS = [
  { id: "engage",   sv: "Engagemang", en: "Engagement" },
  { id: "educate",  sv: "Utbilda & informera", en: "Educate & inform" },
  { id: "leads",    sv: "Generera leads", en: "Generate leads" },
  { id: "trust",    sv: "Bygga förtroende", en: "Build trust" },
  { id: "awareness",sv: "Varumärkeskännedom", en: "Brand awareness" },
  { id: "convert",  sv: "Konvertering", en: "Conversion" },
];

const TONES = [
  { id: "professional", sv: "Professionell", en: "Professional" },
  { id: "warm",         sv: "Varm & personlig", en: "Warm & personal" },
  { id: "confident",    sv: "Självsäker", en: "Confident" },
  { id: "playful",      sv: "Lekfull", en: "Playful" },
];

const VOICE_PROFILES = [
  { id: "align", sv: "Align_Tone of Voice Guidelines_final", en: "Align_Tone of Voice Guidelines_final", std: true },
  { id: "none",  sv: "Ingen — fri ton", en: "None — free tone", std: false },
];

const LANGS = [
  { id: "sv", sv: "Svenska", en: "Swedish" },
  { id: "en", sv: "Engelska", en: "English" },
  { id: "no", sv: "Norska", en: "Norwegian" },
  { id: "da", sv: "Danska", en: "Danish" },
  { id: "fi", sv: "Finska", en: "Finnish" },
];

function makeT(lang) {
  const dict = STRINGS[lang] || STRINGS.sv;
  return (key, vars) => {
    let s = dict[key];
    if (s === undefined) s = key;
    if (vars && typeof s === "string") {
      Object.keys(vars).forEach(k => { s = s.split("{" + k + "}").join(vars[k]); });
    }
    return s;
  };
}
// label helper for data objects
function lbl(obj, lang, field) {
  if (!obj) return "";
  return obj[lang] || obj.sv;
}

Object.assign(window, { STRINGS, CONTENT_TYPES, AUDIENCES, GOALS, TONES, VOICE_PROFILES, LANGS, makeT, lbl });
