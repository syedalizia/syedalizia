// Generates the animated SVG section headers and cards used in README.md.
// Every asset is rendered in a light and a dark variant so it matches the
// viewer's GitHub theme via <picture>. Run: node scripts/generate-readme-assets.mjs
import { mkdir, writeFile } from "node:fs/promises";

const OUT = "assets";
const W = 880;

const themes = {
  light: {
    text: "#0F172A",
    muted: "#57606A",
    card: "#F8FAFC",
    cardStroke: "#E2E8F0",
    track: "#E2E8F0",
    a1: "#2563EB",
    a2: "#7C3AED",
    glow: "#6366F1",
  },
  dark: {
    text: "#F0F6FC",
    muted: "#8B949E",
    card: "#161B22",
    cardStroke: "#30363D",
    track: "#21262D",
    a1: "#60A5FA",
    a2: "#A78BFA",
    glow: "#818CF8",
  },
};

const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

const esc = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

const wrap = (text, max) => {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max) {
      lines.push(line.trim());
      line = word;
    } else line += " " + word;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
};

const svg = (t, h, title, body, extraCss = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.a1}"/>
      <stop offset="1" stop-color="${t.a2}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <style>
    text { font-family: ${SANS}; }
    .mono { font-family: ${MONO}; }
    .fade-up { opacity: 0; animation: fadeUp .7s cubic-bezier(.2,.7,.2,1) forwards; }
    .fade-in { opacity: 0; animation: fadeIn .8s ease-out forwards; }
    .slide { opacity: 0; animation: slide .8s cubic-bezier(.2,.7,.2,1) forwards; }
    .pulse { animation: pulse 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    .float { animation: float 4s ease-in-out infinite; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { to { opacity: 1; } }
    @keyframes slide { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes sweep { from { transform: translateX(-160px); } to { transform: translateX(${W + 160}px); } }
    ${extraCss}
    ${process.env.PREVIEW ? "* { animation-duration: .001s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; }" : ""}
  </style>
${body}
</svg>`;

const delay = (s) => `style="animation-delay:${s.toFixed(2)}s"`;

const card = (t, x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${t.card}" stroke="${t.cardStroke}"/>`;

// ─── Section header ──────────────────────────────────────────────────────────
const header = (index, title, subtitle) => (t) => {
  const h = 92;
  return svg(t, h, title, `
  <g class="slide">
    <text class="mono" x="2" y="26" font-size="13" font-weight="600" fill="url(#accent)" letter-spacing="2">${String(index).padStart(2, "0")} /</text>
    <text x="2" y="58" font-size="28" font-weight="700" fill="${t.text}" letter-spacing="-0.5">${esc(title)}</text>
  </g>
  <text class="fade-in" ${delay(0.35)} x="${W - 2}" y="58" font-size="14" fill="${t.muted}" text-anchor="end">${esc(subtitle)}</text>
  <line x1="2" y1="78" x2="${W - 2}" y2="78" stroke="${t.track}" stroke-width="2" stroke-linecap="round"/>
  <line x1="2" y1="78" x2="${W - 2}" y2="78" stroke="url(#accent)" stroke-width="2" stroke-linecap="round"
        stroke-dasharray="${W}" stroke-dashoffset="${W}" style="animation: draw 1.4s .2s cubic-bezier(.6,0,.2,1) forwards"/>
  <rect y="76" width="120" height="4" fill="url(#shine)" style="animation: sweep 3.2s 1.6s ease-in-out infinite"/>
  <circle cx="${W - 6}" cy="78" r="4" fill="${t.a2}" class="pulse"/>`);
};

// ─── Stats strip ─────────────────────────────────────────────────────────────
const stats = (t) => {
  const items = [
    ["13+", "Years of experience", 1],
    ["$100K+", "Earned on Upwork", 1],
    ["100%", "Job Success Score", 1],
    ["Top Rated+", "Upwork talent tier", 1],
  ];
  const gap = 16, h = 132, cw = (W - gap * 3) / 4;
  const body = items.map(([value, label], i) => {
    const x = i * (cw + gap);
    return `
  <g class="fade-up" ${delay(0.15 * i)}>
    ${card(t, x + 0.5, 0.5, cw - 1, h - 1)}
    <text x="${x + cw / 2}" y="60" font-size="32" font-weight="800" fill="url(#accent)" text-anchor="middle" letter-spacing="-1">${esc(value)}</text>
    <text x="${x + cw / 2}" y="88" font-size="13" fill="${t.muted}" text-anchor="middle">${esc(label)}</text>
    <rect x="${x + 28}" y="108" width="${cw - 56}" height="4" rx="2" fill="${t.track}"/>
    <rect x="${x + 28}" y="108" width="${cw - 56}" height="4" rx="2" fill="url(#accent)"
          style="transform-box: fill-box; transform-origin: left; transform: scaleX(0); animation: grow 1.2s ${(0.4 + 0.15 * i).toFixed(2)}s cubic-bezier(.6,0,.2,1) forwards"/>
  </g>`;
  }).join("");
  return svg(t, h, "13+ years of experience, $100K+ earned on Upwork, 100% Job Success Score, Top Rated Plus", body,
    "@keyframes grow { to { transform: scaleX(1); } }");
};

// ─── Card grid ───────────────────────────────────────────────────────────────
const grid = (title, items, cols, cardH, wrapAt) => (t) => {
  const gap = 16, cw = (W - gap * (cols - 1)) / cols;
  const rows = Math.ceil(items.length / cols);
  const h = rows * cardH + (rows - 1) * gap;
  const body = items.map(([name, desc], i) => {
    const x = (i % cols) * (cw + gap), y = Math.floor(i / cols) * (cardH + gap);
    const lines = wrap(desc, wrapAt).map((l, n) =>
      `<text x="${x + 24}" y="${y + 92 + n * 20}" font-size="13.5" fill="${t.muted}">${esc(l)}</text>`).join("\n    ");
    return `
  <g class="fade-up" ${delay(0.12 * i)}>
    ${card(t, x + 0.5, y + 0.5, cw - 1, cardH - 1)}
    <rect x="${x + 24}" y="${y + 24}" width="34" height="34" rx="9" fill="url(#accent)"/>
    <text class="mono" x="${x + 41}" y="${y + 46}" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">${String(i + 1).padStart(2, "0")}</text>
    <text x="${x + 72}" y="${y + 47}" font-size="16.5" font-weight="700" fill="${t.text}">${esc(name)}</text>
    <circle cx="${x + cw - 22}" cy="${y + cardH - 22}" r="3.5" fill="${t.a2}" class="pulse" style="animation-delay:${(0.4 * i).toFixed(1)}s"/>
    ${lines}
  </g>`;
  }).join("");
  return svg(t, h, title, body);
};

const capabilities = grid("Core capabilities", [
  ["Applied AI & ML", "LLM integrations, RAG pipelines, AI agents, and production-ready machine learning features."],
  ["Solution Architecture", "Scalable distributed systems, API design, microservices, and cloud-native platforms."],
  ["Full-Stack Engineering", "Refined, responsive interfaces backed by secure, high-performance services."],
  ["Workflow Automation", "n8n and AI-driven automations that remove manual effort from operations."],
  ["Cloud & DevOps", "Containerization, CI/CD pipelines, observability, and repeatable deployments."],
  ["Technical Leadership", "Architecture governance, code quality, team mentorship, and delivery strategy."],
], 3, 168, 32);

const y0 = 26;

// ─── Certifications ──────────────────────────────────────────────────────────
const certifications = (t) => {
  const items = [
    ["Certified Scrum Master", "Agile Leadership", "Team facilitation, iterative delivery, and continuous improvement."],
    ["Google Project Management", "Professional Certificate", "Planning, stakeholder and risk management, and delivery governance."],
  ];
  const gap = 16, h = 150, cw = (W - gap) / 2;
  const body = items.map(([name, sub, desc], i) => {
    const x = i * (cw + gap);
    const lines = wrap(desc, 46).map((l, n) =>
      `<text x="${x + 96}" y="${y0 + 72 + n * 20}" font-size="13.5" fill="${t.muted}">${esc(l)}</text>`).join("\n    ");
    return `
  <g class="fade-up" ${delay(0.18 * i)}>
    ${card(t, x + 0.5, 0.5, cw - 1, h - 1)}
    <circle cx="${x + 54}" cy="62" r="26" fill="none" stroke="url(#accent)" stroke-width="3"/>
    <path d="M ${x + 42} 62 l 8 8 l 15 -16" fill="none" stroke="url(#accent)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="40" stroke-dashoffset="40" style="animation: draw .7s ${(0.6 + 0.18 * i).toFixed(2)}s ease-out forwards"/>
    <text x="${x + 96}" y="${y0 + 22}" font-size="17" font-weight="700" fill="${t.text}">${esc(name)}</text>
    <text class="mono" x="${x + 96}" y="${y0 + 44}" font-size="12" font-weight="600" fill="url(#accent)" letter-spacing="1">${esc(sub.toUpperCase())}</text>
    ${lines}
  </g>`;
  }).join("");
  return svg(t, h, "Certified Scrum Master; Google Project Management Professional Certificate", body);
};

// ─── Philosophy equation ─────────────────────────────────────────────────────
const philosophy = (t) => {
  const terms = ["Thoughtful UX", "Solid Engineering", "Scalable Architecture", "Practical AI"];
  const h = 120, pillH = 44, y = 22, opW = 26, resW = 170;
  const widths = terms.map((term) => Math.round(term.length * 6.9 + 30));
  const total = widths.reduce((a, b) => a + b, 0) + opW * terms.length + resW;
  let x = Math.max(0, (W - total) / 2);
  const parts = [];
  terms.forEach((term, i) => {
    const pw = widths[i];
    parts.push(`
  <g class="fade-up" ${delay(0.25 * i)}>
    <rect x="${x + 0.5}" y="${y}" width="${pw - 1}" height="${pillH}" rx="22" fill="${t.card}" stroke="${t.cardStroke}"/>
    <text x="${x + pw / 2}" y="${y + 27}" font-size="13" font-weight="600" fill="${t.text}" text-anchor="middle">${esc(term)}</text>
  </g>`);
    x += pw;
    const op = i < terms.length - 1 ? "+" : "=";
    parts.push(`<text class="fade-in" ${delay(0.25 * i + 0.15)} x="${x + opW / 2}" y="${y + 29}" font-size="20" font-weight="700" fill="${t.muted}" text-anchor="middle">${op}</text>`);
    x += opW;
  });
  parts.push(`
  <g class="fade-up" ${delay(1.15)}>
    <rect x="${x - 3}" y="${y - 3}" width="${resW + 6}" height="${pillH + 6}" rx="25" fill="none" stroke="${t.glow}" stroke-width="2" class="glow"/>
    <rect x="${x}" y="${y}" width="${resW}" height="${pillH}" rx="22" fill="url(#accent)"/>
    <text x="${x + resW / 2}" y="${y + 27}" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">Products That Last</text>
  </g>
  <text class="fade-in" ${delay(1.5)} x="${W / 2}" y="${h - 12}" font-size="13.5" fill="${t.muted}" text-anchor="middle">Simple where possible, designed for change, and measured by the business value it creates.</text>`);
  return svg(t, h, "Thoughtful UX + Solid Engineering + Scalable Architecture + Practical AI = Products That Last", parts.join(""),
    ".glow { animation: glow 2.6s 1.8s ease-in-out infinite; opacity: 0; } @keyframes glow { 0%,100% { opacity: 0; } 50% { opacity: .9; } }");
};

// ─── Current focus (terminal) ────────────────────────────────────────────────
const focus = (t) => {
  const lines = [
    "Building at the intersection of modern web engineering and applied AI/ML",
    "Designing intelligent automations with n8n and AI agents",
    "Advancing scalable, reliable, and user-centred delivery practices",
    "Partnering with teams on ambitious products and complex challenges",
  ];
  const h = 70 + lines.length * 30 + 64;
  const body = `
  <g class="fade-in">
    ${card(t, 0.5, 0.5, W - 1, h - 1)}
    <path d="M 0.5 40 V 14.5 a 14 14 0 0 1 14 -14 H ${W - 14.5} a 14 14 0 0 1 14 14 V 40 Z" fill="${t.track}"/>
    <circle cx="24" cy="20" r="6" fill="#FF5F57"/><circle cx="44" cy="20" r="6" fill="#FEBC2E"/><circle cx="64" cy="20" r="6" fill="#28C840"/>
    <text class="mono" x="${W / 2}" y="25" font-size="12" fill="${t.muted}" text-anchor="middle">~/syed-ali-zia — current-focus</text>
  </g>
  <text class="mono fade-in" ${delay(0.3)} x="28" y="74" font-size="13.5" fill="${t.muted}"><tspan fill="${t.a1}">$</tspan> cat focus.md</text>
  ${lines.map((l, i) => `<text class="mono slide" ${delay(0.7 + 0.35 * i)} x="28" y="${106 + i * 30}" font-size="13.5" fill="${t.text}"><tspan fill="${t.a2}">▸</tspan>  ${esc(l)}</text>`).join("\n  ")}
  <text class="mono fade-in" ${delay(0.7 + 0.35 * lines.length)} x="28" y="${106 + lines.length * 30}" font-size="13.5" fill="${t.a1}">$ <tspan class="caret">▋</tspan></text>`;
  return svg(t, h, "Current focus: " + lines.join("; "), body,
    ".caret { animation: blink 1s steps(1) infinite; } @keyframes blink { 50% { opacity: 0; } }");
};

// ─── Interests ───────────────────────────────────────────────────────────────
const interests = (t) => {
  const items = ["Chess & Strategy", "Algorithms", "Problem-Solving", "Hiking", "Cycling", "Lifelong Learning"];
  const gap = 12, h = 64, pw = (W - gap * (items.length - 1)) / items.length;
  const body = items.map((item, i) => {
    const x = i * (pw + gap);
    return `
  <g class="fade-up" ${delay(0.1 * i)}>
    <g class="float" style="animation-delay:${(0.5 * i).toFixed(1)}s">
      <rect x="${x + 0.5}" y="10" width="${pw - 1}" height="44" rx="22" fill="${t.card}" stroke="${t.cardStroke}"/>
      <text x="${x + pw / 2}" y="37" font-size="13" font-weight="600" fill="${t.text}" text-anchor="middle">${esc(item)}</text>
    </g>
  </g>`;
  }).join("");
  return svg(t, h, "Interests: " + items.join(", "), body);
};

// ─── Build ───────────────────────────────────────────────────────────────────
const assets = {
  "header-about": header(1, "About", "Architecture · Engineering · Leadership"),
  "header-capabilities": header(2, "Core Capabilities", "What I deliver"),
  "header-toolbox": header(3, "Technical Toolbox", "Technologies I work with"),
  "header-certifications": header(4, "Certifications", "Delivery & leadership credentials"),
  "header-philosophy": header(5, "Engineering Philosophy", "How I approach products"),
  "header-activity": header(6, "GitHub Activity", "2025 contribution journey"),
  "header-focus": header(7, "Current Focus", "What I am working on"),
  "header-beyond": header(8, "Beyond the Code", "What keeps me sharp"),
  "header-contact": header(9, "Let's Work Together", "Consulting · Architecture · Delivery"),
  stats,
  capabilities,
  certifications,
  philosophy,
  focus,
  interests,
};

await mkdir(OUT, { recursive: true });
await Promise.all(Object.entries(assets).flatMap(([name, render]) =>
  Object.entries(themes).map(([mode, t]) => writeFile(`${OUT}/${name}-${mode}.svg`, render(t)))));
console.log(`Generated ${Object.keys(assets).length * 2} SVG assets in ${OUT}/`);
