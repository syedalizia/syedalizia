// Generates the animated SVG section headers and cards used in README.md.
// Every asset is rendered in a light and a dark variant so it matches the
// viewer's GitHub theme via <picture>. Run: node scripts/generate-readme-assets.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";

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

const svg = (t, h, title, body, extraCss = "", w = W) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0" spreadMethod="reflect">
      <stop offset="0" stop-color="${t.a1}"/>
      <stop offset="1" stop-color="${t.a2}"/>
      <animateTransform attributeName="gradientTransform" type="translate" values="0 0;1 0;0 0" dur="6s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="sheenGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.glow}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${t.glow}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${t.glow}" stop-opacity="0"/>
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

let clipId = 0;
const card = (t, x, y, w, h, sheenAt = null) => {
  const base = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${t.card}" stroke="${t.cardStroke}"/>`;
  if (sheenAt === null) return base;
  const id = `clip${clipId++}`;
  const travel = w + h + 200;
  return `${base}
    <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/></clipPath>
    <g clip-path="url(#${id})"><g transform="translate(${x - 140 - h / 2} ${y}) skewX(-24)">
      <rect width="110" height="${h}" fill="url(#sheenGrad)">
        <animateTransform attributeName="transform" type="translate" values="0 0;${travel} 0;${travel} 0" keyTimes="0;0.28;1" dur="7s" begin="${sheenAt.toFixed(2)}s" repeatCount="indefinite"/>
      </rect>
    </g></g>`;
};

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
    ${card(t, x + 0.5, 0.5, cw - 1, h - 1, 1.6 + 0.35 * i)}
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
    ${card(t, x + 0.5, y + 0.5, cw - 1, cardH - 1, 1.4 + 0.3 * i)}
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

// ─── Certifications: one SVG per card so each can be wrapped in a link ───────
const CERTS = [
  ["Certified Scrum Master", "Agile Leadership", "Team facilitation, iterative delivery, and continuous improvement.", true],
  ["Google Project Management", "Professional Certificate", "Planning, stakeholder and risk management, and delivery governance.", true],
];
const certification = (i) => (t) => {
  const [name, sub, desc, verifiable] = CERTS[i];
  const h = 150, cw = (W - 16) / 2, x = 0;
  const lines = wrap(desc, 46).map((l, n) =>
    `<text x="${x + 96}" y="${y0 + 72 + n * 20}" font-size="13.5" fill="${t.muted}">${esc(l)}</text>`).join("\n    ");
  const verify = verifiable
    ? `<text class="mono fade-in" ${delay(1)} x="${cw - 18}" y="${h - 16}" font-size="11" font-weight="600" fill="url(#accent)" letter-spacing="1" text-anchor="end">VERIFY CREDENTIAL ↗</text>`
    : "";
  const body = `
  <g class="fade-up" ${delay(0.18 * i)}>
    ${card(t, x + 0.5, 0.5, cw - 1, h - 1, 1.5 + 0.5 * i)}
    <circle cx="${x + 54}" cy="62" r="34" fill="none" stroke="url(#accent)" stroke-width="1.5" stroke-dasharray="3 7" opacity="0.7">
      <animateTransform attributeName="transform" type="rotate" from="0 ${x + 54} 62" to="360 ${x + 54} 62" dur="14s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${x + 54}" cy="62" r="26" fill="none" stroke="url(#accent)" stroke-width="3"/>
    <path d="M ${x + 42} 62 l 8 8 l 15 -16" fill="none" stroke="url(#accent)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="40" stroke-dashoffset="40" style="animation: draw .7s ${(0.6 + 0.18 * i).toFixed(2)}s ease-out forwards"/>
    <text x="${x + 96}" y="${y0 + 22}" font-size="17" font-weight="700" fill="${t.text}">${esc(name)}</text>
    <text class="mono" x="${x + 96}" y="${y0 + 44}" font-size="12" font-weight="600" fill="url(#accent)" letter-spacing="1">${esc(sub.toUpperCase())}</text>
    ${lines}
    ${verify}
  </g>`;
  return svg(t, h, `${name} — ${sub}`, body, "", cw);
};

// ─── Philosophy: four pillars converging into one outcome ────────────────────
const philosophy = (t) => {
  const pillars = [
    ["Thoughtful UX", "Interfaces people understand instantly and enjoy using.", "ux"],
    ["Solid Engineering", "Clean, tested, maintainable code built to evolve.", "code"],
    ["Scalable Architecture", "Systems designed for growth, resilience, and change.", "layers"],
    ["Practical AI", "Intelligence applied where it creates measurable value.", "ai"],
  ];
  const gap = 16, cw = (W - gap * 3) / 4, ch = 174;
  const node = { w: 340, h: 72, y: 268 };
  node.x = (W - node.w) / 2;
  const h = node.y + node.h + 56;

  const icon = (kind, cx, cy) => ({
    ux: `<path d="M ${cx - 5} ${cy - 8} L ${cx + 7} ${cy + 2} L ${cx + 1.5} ${cy + 3} L ${cx + 4.5} ${cy + 9} L ${cx + 1.5} ${cy + 10.5} L ${cx - 1.5} ${cy + 4.5} L ${cx - 5} ${cy + 8} Z" fill="#fff"/>`,
    code: `<text class="mono" x="${cx}" y="${cy + 5}" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">&lt;/&gt;</text>`,
    layers: [-7, -1, 5].map((dy, n) => `<rect x="${cx - 9}" y="${cy + dy - 1.5}" width="18" height="4" rx="2" fill="#fff" opacity="${1 - n * 0.2}"/>`).join(""),
    ai: `<path d="M ${cx} ${cy - 10} Q ${cx + 1.5} ${cy - 1.5} ${cx + 10} ${cy} Q ${cx + 1.5} ${cy + 1.5} ${cx} ${cy + 10} Q ${cx - 1.5} ${cy + 1.5} ${cx - 10} ${cy} Q ${cx - 1.5} ${cy - 1.5} ${cx} ${cy - 10} Z" fill="#fff"/>`,
  })[kind];

  const cards = pillars.map(([name, desc, kind], i) => {
    const x = i * (cw + gap);
    const lines = wrap(desc, 27).map((l, n) =>
      `<text x="${x + 20}" y="${110 + n * 19}" font-size="12.5" fill="${t.muted}">${esc(l)}</text>`).join("\n    ");
    return `
  <g class="fade-up" ${delay(0.15 * i)}>
    ${card(t, x + 0.5, 0.5, cw - 1, ch - 1, 2.2 + 0.4 * i)}
    <rect x="${x + 20}" y="20" width="40" height="40" rx="11" fill="url(#accent)"/>
    ${icon(kind, x + 40, 40)}
    <text class="mono" x="${x + cw - 20}" y="34" font-size="11" font-weight="600" fill="${t.muted}" text-anchor="end" letter-spacing="1">0${i + 1}</text>
    <text x="${x + 20}" y="86" font-size="15.5" font-weight="700" fill="${t.text}">${esc(name)}</text>
    ${lines}
  </g>`;
  }).join("");

  const connectors = pillars.map((_, i) => {
    const sx = i * (cw + gap) + cw / 2, sy = ch;
    const ex = W / 2 + (i - 1.5) * 44, ey = node.y;
    const d = `M ${sx} ${sy} C ${sx} ${sy + 52}, ${ex} ${ey - 52}, ${ex} ${ey}`;
    const begin = 0.7 + 0.15 * i;
    return `
  <path d="${d}" fill="none" stroke="${t.cardStroke}" stroke-width="1.5" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"
        style="animation: draw .9s ${begin.toFixed(2)}s ease-out forwards"/>
  <path d="${d}" fill="none" stroke="url(#accent)" stroke-width="2" stroke-dasharray="4 8" class="flow fade-in" ${delay(begin + 0.8)}/>
  <circle r="3.5" fill="${t.a2}" opacity="0">
    <animateMotion path="${d}" dur="2.2s" begin="${(begin + 1 + 0.3 * i).toFixed(2)}s" repeatCount="indefinite" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".5 0 .5 1"/>
    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.2s" begin="${(begin + 1 + 0.3 * i).toFixed(2)}s" repeatCount="indefinite"/>
  </circle>`;
  }).join("");

  const { x: nx, y: ny, w: nw, h: nh } = node;
  const outcome = `
  <g class="fade-up" ${delay(1.5)}>
    <rect class="ring" x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="${nh / 2}" fill="none" stroke="${t.glow}" stroke-width="2"/>
    <rect class="ring" style="animation-delay:1.4s" x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="${nh / 2}" fill="none" stroke="${t.glow}" stroke-width="2"/>
    <rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="${nh / 2}" fill="url(#accent)"/>
    <text x="${W / 2}" y="${ny + 33}" font-size="20" font-weight="800" fill="#fff" text-anchor="middle" letter-spacing="-0.3">Products That Last</text>
    <text x="${W / 2}" y="${ny + 53}" font-size="12" fill="#fff" fill-opacity="0.85" text-anchor="middle">Built to scale, adapt, and deliver real business value</text>
  </g>
  <text class="fade-in" ${delay(2)} x="${W / 2}" y="${h - 14}" font-size="13.5" fill="${t.muted}" text-anchor="middle">Simple where possible · designed for change · measured by the value it creates</text>`;

  return svg(t, h, "Thoughtful UX, Solid Engineering, Scalable Architecture and Practical AI combine into Products That Last",
    cards + connectors + outcome,
    `.flow { animation: fadeIn .8s ease-out forwards, flow 1.2s linear infinite; }
    @keyframes flow { to { stroke-dashoffset: -24; } }
    .ring { opacity: 0; transform-box: fill-box; transform-origin: center; animation: ring 2.8s 2s ease-out infinite; }
    @keyframes ring { 0% { opacity: .7; transform: scale(1); } 100% { opacity: 0; transform: scale(1.12, 1.5); } }`);
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
  ${lines.map((l, i) => {
    const start = 0.8 + 1.1 * i, width = 60 + l.length * 8.2;
    return `<clipPath id="type${i}"><rect x="20" y="${88 + i * 30}" height="26" width="0">
      <animate attributeName="width" from="0" to="${width}" begin="${start.toFixed(2)}s" dur="0.95s" fill="freeze" calcMode="linear"/>
    </rect></clipPath>
  <text class="mono" clip-path="url(#type${i})" x="28" y="${106 + i * 30}" font-size="13.5" fill="${t.text}"><tspan fill="${t.a2}">▸</tspan>  ${esc(l)}</text>`;
  }).join("\n  ")}
  <text class="mono fade-in" ${delay(0.8 + 1.1 * lines.length)} x="28" y="${106 + lines.length * 30}" font-size="13.5" fill="${t.a1}">$ <tspan class="caret">▋</tspan></text>`;
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
      <rect x="${x + 0.5}" y="10" width="${pw - 1}" height="44" rx="22" fill="none" stroke="url(#accent)" stroke-width="1.5" opacity="0">
        <animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.08;0.2;1" dur="6s" begin="${(1 + 0.35 * i).toFixed(2)}s" repeatCount="indefinite"/>
      </rect>
      <text x="${x + pw / 2}" y="37" font-size="13" font-weight="600" fill="${t.text}" text-anchor="middle">${esc(item)}</text>
    </g>
  </g>`;
  }).join("");
  return svg(t, h, "Interests: " + items.join(", "), body);
};

// ─── Technical toolbox ───────────────────────────────────────────────────────
// Icons are vendored in assets/icons: skill-icons (MIT) for most technologies,
// Simple Icons (CC0) glyphs on a matching tile for those skill-icons lacks.
const TILE = "#242938";
const brandIcon = (glyphFile, color) => async () => {
  const d = (await readFile(`${OUT}/icons/${glyphFile}`, "utf8")).match(/ d="([^"]+)"/)[1];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="60" fill="${TILE}"/><g transform="translate(60 60) scale(5.667)"><path fill="${color}" d="${d}"/></g></svg>`;
};
const aiIcon = async () => {
  const nodes = [[70, 84], [70, 128], [70, 172], [128, 106], [128, 150], [186, 128]];
  const edges = [[0, 3], [0, 4], [1, 3], [1, 4], [2, 3], [2, 4], [3, 5], [4, 5]];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60A5FA"/><stop offset="1" stop-color="#C084FC"/></linearGradient></defs><rect width="256" height="256" rx="60" fill="${TILE}"/>${edges.map(([a, b]) => `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="url(#g)" stroke-width="7" stroke-linecap="round" opacity=".75"/>`).join("")}${nodes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="url(#g)"/>`).join("")}</svg>`;
};
const skillIcon = (id) => async () => {
  const raw = await readFile(`${OUT}/icons/${id}.svg`, "utf8");
  return raw.match(/<g transform="translate\(0, 0\)">\s*([\s\S]*?)\s*<\/g>\s*<\/svg>\s*$/)[1];
};

const TECH = {
  php: ["PHP", skillIcon("php")], laravel: ["Laravel", skillIcon("laravel")], symfony: ["Symfony", skillIcon("symfony")],
  codeigniter: ["CodeIgniter", brandIcon("si-codeigniter.svg", "#EF4223")],
  nodejs: ["Node.js", skillIcon("nodejs")], express: ["Express", skillIcon("express")], py: ["Python", skillIcon("py")],
  java: ["Java", skillIcon("java")], cs: ["C#", skillIcon("cs")],
  js: ["JavaScript", skillIcon("js")], ts: ["TypeScript", skillIcon("ts")], react: ["React", skillIcon("react")],
  vue: ["Vue.js", skillIcon("vue")], angular: ["Angular", skillIcon("angular")], html: ["HTML5", skillIcon("html")], css: ["CSS3", skillIcon("css")],
  ai: ["AI / ML", aiIcon], llm: ["LLMs & RAG", brandIcon("si-openai.svg", "#FFFFFF")], n8n: ["n8n", brandIcon("si-n8n.svg", "#EA4B71")],
  mysql: ["MySQL", skillIcon("mysql")], postgres: ["PostgreSQL", skillIcon("postgres")], mongodb: ["MongoDB", skillIcon("mongodb")],
  firebase: ["Firebase", skillIcon("firebase")],
  aws: ["AWS", skillIcon("aws")], azure: ["Azure", skillIcon("azure")], gcp: ["Google Cloud", skillIcon("gcp")],
  docker: ["Docker", skillIcon("docker")], kubernetes: ["Kubernetes", skillIcon("kubernetes")],
  jenkins: ["Jenkins", skillIcon("jenkins")], githubactions: ["GitHub Actions", skillIcon("githubactions")],
};

const CATEGORIES = [
  ["Backend & APIs", ["php", "laravel", "symfony", "codeigniter", "nodejs", "express", "py", "java", "cs"]],
  ["Frontend", ["js", "ts", "react", "vue", "angular", "html", "css"]],
  ["AI, Data & Automation", ["ai", "llm", "n8n", "mysql", "postgres", "mongodb", "firebase"]],
  ["Cloud & DevOps", ["aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "githubactions"]],
];

const iconCache = {};
let iconSeq = 0;
const loadIcon = async (key) => (iconCache[key] ??= await TECH[key][1]());
const namespaced = (markup) => {
  const ns = `i${iconSeq++}-`;
  return markup
    .replace(/<svg([^>]*?)\s(width|height)="[^"]*"/g, "<svg$1")
    .replace(/<svg([^>]*?)\s(width|height)="[^"]*"/g, "<svg$1")
    .replace(/id="([^"]+)"/g, `id="${ns}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${ns}$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${ns}$1"`);
};

const toolbox = async (t) => {
  const rowH = 118, gap = 14, size = 48, step = 70, left = 236;
  const h = CATEGORIES.length * rowH + (CATEGORIES.length - 1) * gap;
  let n = 0;
  const rows = [];
  for (const [ci, [label, keys]] of CATEGORIES.entries()) {
    const y = ci * (rowH + gap);
    const icons = [];
    for (const [k, key] of keys.entries()) {
      const x = left + k * step;
      const markup = namespaced(await loadIcon(key)).replace("<svg", `<svg x="${x}" y="${y + 20}" width="${size}" height="${size}"`);
      const d = 0.25 + n++ * 0.05;
      icons.push(`
    <g class="pop" style="animation-delay:${d.toFixed(2)}s">
      <g class="bob" style="animation-delay:${(k * 0.35).toFixed(2)}s">${markup}</g>
      <text x="${x + size / 2}" y="${y + 92}" font-size="11" fill="${t.muted}" text-anchor="middle">${esc(TECH[key][0])}</text>
    </g>`);
    }
    rows.push(`
  <g class="fade-up" ${delay(0.12 * ci)}>
    ${card(t, 0.5, y + 0.5, W - 1, rowH - 1, 2 + 0.6 * ci)}
    <rect x="0.5" y="${y + 24}" width="4" height="${rowH - 48}" rx="2" fill="url(#accent)"/>
    <text class="mono" x="26" y="${y + 50}" font-size="11" font-weight="600" fill="url(#accent)" letter-spacing="1.5">0${ci + 1} / ${String(keys.length).padStart(2, "0")} TOOLS</text>
    <text x="26" y="${y + 74}" font-size="16" font-weight="700" fill="${t.text}">${esc(label)}</text>
    ${icons.join("")}
  </g>`);
  }
  return svg(t, h, "Technical toolbox: " + CATEGORIES.map(([l, k]) => `${l}: ${k.map((x) => TECH[x][0]).join(", ")}`).join("; "), rows.join(""),
    `.pop { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .55s cubic-bezier(.3,1.6,.5,1) forwards; }
    @keyframes pop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
    .bob { animation: bob 3.6s ease-in-out infinite; }
    @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }`);
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
  toolbox,
  capabilities,
  "cert-scrum-master": certification(0),
  "cert-google-pm": certification(1),
  philosophy,
  focus,
  interests,
};

await mkdir(OUT, { recursive: true });
await Promise.all(Object.entries(assets).flatMap(([name, render]) =>
  Object.entries(themes).map(async ([mode, t]) => writeFile(`${OUT}/${name}-${mode}.svg`, await render(t)))));
console.log(`Generated ${Object.keys(assets).length * 2} SVG assets in ${OUT}/`);
