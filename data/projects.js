/* =============================================================
   AlignPortfolio — configuration
   Edit this file, commit it to the repo, and everyone sees the
   same gallery / settings on GitHub Pages.
   ============================================================= */

window.ALIGN_CONFIG = {

  /* ----------------------------------------------------------
     1) AUTHENTICATION
     ----------------------------------------------------------
     Real Microsoft Entra (Azure AD) sign-in runs entirely in
     the browser via MSAL.js — no backend needed. To turn it on:

       1. In the Azure portal → "App registrations" → New
          registration. Platform = "Single-page application".
       2. Add the published Redirect URI, e.g.
          https://fredrikalign.github.io/AlignPortfolio/
       3. Copy the "Application (client) ID" and your
          "Directory (tenant) ID" into the fields below.

     While clientId is empty the app runs in DEMO MODE: it shows
     the same login screen but accepts any e-mail on an allowed
     domain (below). Good for showing the portfolio before Azure
     is wired up — NOT real security.                            */
  auth: {
    clientId: "",            // e.g. "11111111-2222-3333-4444-555555555555"
    tenantId: "",            // your Align tenant id, or "organizations"
    allowedDomains: ["alignconsulting.se"],
  },

  /* ----------------------------------------------------------
     2) SHARE LINKS
     ----------------------------------------------------------
     Customer links carry a random key. To switch a link OFF
     after you've sent it, paste its key (shown when you create
     the link, or in localStorage) into this list and commit.    */
  revokedKeys: [
    // "ab12cd34",
  ],

  // Base URL used when generating share links. Leave "" to use
  // whatever URL the page is currently served from.
  shareBaseUrl: "",

  /* ----------------------------------------------------------
     2b) GITHUB UPLOAD
     ----------------------------------------------------------
     Employees can publish artifacts directly from the browser.
     The token is NOT stored here — it is injected at deploy time
     via a GitHub Actions secret (GITHUB_UPLOAD_TOKEN). See
     .github/workflows/deploy.yml for details.                    */
  github: {
    repo:   "fredrikalign/align-web", // owner/repo
    branch: "main",
  },

  /* ----------------------------------------------------------
     3) VIEW COUNTER (how many times a shared link was opened)
     ----------------------------------------------------------
     GitHub Pages has no server, so counting real visits needs a
     tiny hosted data store. Two modes:

       "local"    — counts live in the viewer's own browser only.
                    Good for demoing the UI, but it will NOT show
                    a customer's opens in your gallery (different
                    browser = different counter).

       "firebase" — real, global counts via a free Firebase
                    Realtime Database (no SDK, plain REST):
                      1. console.firebase.google.com → new project
                      2. Build → Realtime Database → Create
                      3. Rules: allow read/write on "portfolio_views"
                         (or open read/write while testing)
                      4. Paste the database URL below, e.g.
                         https://your-app-default-rtdb.firebaseio.com
                    Then set mode to "firebase".                  */
  analytics: {
    mode: "local",          // "local" | "firebase"
    firebaseUrl: "",        // e.g. "https://align-portfolio-default-rtdb.firebaseio.com"
  },
};

/* =============================================================
   THE GALLERY
   -------------------------------------------------------------
   Each entry is one artifact. Drop the HTML file in projects/
   and a screenshot in thumbnails/, then add a row here.
   Fields:
     id     unique slug (also used in share links) — don't reuse
     title  display name
     cat     one of: landningssida | prototyp | presentation |
                     dashboard | rapport | ovrigt
     lang    SWE | NOR | ENG
     desc    one short sentence
     file    path to the HTML artifact
     thumb   path to the screenshot (or "" for a placeholder)
     date    YYYY-MM-DD (shown + used for sorting)
   ============================================================= */

window.ALIGN_PROJECTS = [
  {
    id: "nordstrom-saas-landing",
    title: "Nordström SaaS — Landing Page",
    cat: "landningssida",
    lang: "SWE",
    desc: "Conversion-driven landing page for a B2B cloud service, built in the Align style.",
    file: "projects/nordstrom-saas-landing.html",
    thumb: "thumbnails/nordstrom-saas-landing.png",
    date: "2026-05-21",
  },
  {
    id: "ifs-onboarding-proto",
    title: "IFS Cloud — Onboarding Prototype",
    cat: "prototyp",
    lang: "ENG",
    desc: "Clickable multi-step onboarding flow with live form validation and progress.",
    file: "projects/ifs-onboarding-proto.html",
    thumb: "thumbnails/ifs-onboarding-proto.png",
    date: "2026-05-28",
  },
  {
    id: "q2-kundpresentation",
    title: "Q2 Client Presentation — Align Monitoring",
    cat: "presentation",
    lang: "SWE",
    desc: "Sales presentation in slide format for Align Monitoring, ready for fullscreen.",
    file: "projects/q2-kundpresentation.html",
    thumb: "thumbnails/q2-kundpresentation.png",
    date: "2026-06-01",
  },
];
