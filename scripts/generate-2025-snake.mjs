import { mkdir, writeFile } from "node:fs/promises";

const user = process.env.GITHUB_USER;
const token = process.env.GITHUB_TOKEN;

if (!user || !token) {
  throw new Error("GITHUB_USER and GITHUB_TOKEN are required");
}

const YEAR = 2025;
const FROM = `${YEAR}-01-01T00:00:00Z`;
const TO = `${YEAR}-12-31T23:59:59Z`;
const DURATION = 20;

const query = `
  query ContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": `${user}-profile-readme`,
  },
  body: JSON.stringify({ query, variables: { login: user, from: FROM, to: TO } }),
});

if (!response.ok) {
  throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
}

const payload = await response.json();
if (payload.errors?.length) {
  throw new Error(`GitHub GraphQL error: ${payload.errors.map(({ message }) => message).join("; ")}`);
}

const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar) {
  throw new Error(`No contribution calendar found for ${user}`);
}

const days = calendar.weeks
  .flatMap(({ contributionDays }) => contributionDays)
  .filter(({ date }) => date.startsWith(`${YEAR}-`));

const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);

const firstDay = new Date(Date.UTC(YEAR, 0, 1));
const graphStart = new Date(firstDay);
graphStart.setUTCDate(firstDay.getUTCDate() - firstDay.getUTCDay());

const CELL = 10;
const GAP = 3;
const STEP = CELL + GAP;
const COLS = 53;
const ROWS = 7;
const LEFT = 78;
const TOP = 58;
const WIDTH = 820;
const HEIGHT = 184;

const positionForDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  const elapsedDays = Math.round((date - graphStart) / 86_400_000);
  return { col: Math.floor(elapsedDays / 7), row: date.getUTCDay() };
};

const snakeIndex = (col, row) => col * ROWS + (col % 2 === 0 ? row : ROWS - 1 - row);
const positiveCounts = days.map(({ contributionCount }) => contributionCount).filter(Boolean).sort((a, b) => a - b);
const thresholds = [0.25, 0.5, 0.75].map((point) =>
  positiveCounts[Math.floor((positiveCounts.length - 1) * point)] ?? 1,
);

const levelForCount = (count) => {
  if (count === 0) return 0;
  if (count <= thresholds[0]) return 1;
  if (count <= thresholds[1]) return 2;
  if (count <= thresholds[2]) return 3;
  return 4;
};

const pathPoints = [];
for (let col = 0; col < COLS; col += 1) {
  const rows = col % 2 === 0
    ? Array.from({ length: ROWS }, (_, index) => index)
    : Array.from({ length: ROWS }, (_, index) => ROWS - 1 - index);

  for (const row of rows) {
    pathPoints.push([LEFT + col * STEP + CELL / 2, TOP + row * STEP + CELL / 2]);
  }
}

const [startX, startY] = pathPoints[0];
const [endX, endY] = pathPoints.at(-1);
const returnY = TOP + ROWS * STEP + 13;
const motionPath = [
  `M ${startX} ${startY}`,
  ...pathPoints.slice(1).map(([x, y]) => `L ${x} ${y}`),
  `L ${endX + 20} ${endY + 20}`,
  `L ${endX + 20} ${returnY}`,
  `L ${startX - 20} ${returnY}`,
  `L ${startX - 20} ${startY}`,
  "Z",
].join(" ");

const monthLabels = Array.from({ length: 12 }, (_, month) => {
  const date = new Date(Date.UTC(YEAR, month, 1));
  const { col } = positionForDate(date.toISOString().slice(0, 10));
  const name = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(date);
  return `<text class="month" x="${LEFT + col * STEP}" y="43">${name}</text>`;
}).join("\n");

const dayLabels = [[1, "Mon"], [3, "Wed"], [5, "Fri"]]
  .map(([row, label]) => `<text class="day" x="${LEFT - 12}" y="${TOP + row * STEP + 8}" text-anchor="end">${label}</text>`)
  .join("\n");

const render = ({ background, border, empty, levels, text, muted, snake, eye }) => {
  const cells = days.map(({ contributionCount, date }) => {
    const { col, row } = positionForDate(date);
    const x = LEFT + col * STEP;
    const y = TOP + row * STEP;
    const index = snakeIndex(col, row);
    const eatenAt = Math.min(0.87, (index / (COLS * ROWS)) * 0.84);
    const resetAt = Math.min(0.995, eatenAt + 0.008);
    const fill = contributionCount ? levels[levelForCount(contributionCount) - 1] : empty;
    const animation = contributionCount
      ? `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${eatenAt.toFixed(4)};${resetAt.toFixed(4)};0.94;1" dur="${DURATION}s" repeatCount="indefinite"/>`
      : "";
    return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}"><title>${date}: ${contributionCount} contribution${contributionCount === 1 ? "" : "s"}</title>${animation}</rect>`;
  }).join("\n");

  const tail = [0.18, 0.36, 0.54, 0.72].map((delay, index) => `
    <circle r="${4.2 - index * 0.55}" fill="${snake}" opacity="${0.82 - index * 0.12}">
      <animateMotion dur="${DURATION}s" begin="-${(DURATION - delay).toFixed(2)}s" repeatCount="indefinite" path="${motionPath}"/>
    </circle>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(user)}'s animated 2025 contribution snake</title>
  <desc id="description">An animated snake travels through and eats ${calendar.totalContributions} GitHub contributions made during 2025.</desc>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: ${text}; }
    .heading { font-size: 16px; font-weight: 700; }
    .summary { font-size: 12px; fill: ${muted}; }
    .month, .day { font-size: 10px; fill: ${muted}; }
  </style>
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="12" fill="${background}" stroke="${border}"/>
  <text class="heading" x="22" y="25">${escapeXml(user)}'s 2025 contribution journey</text>
  <text class="summary" x="${WIDTH - 22}" y="25" text-anchor="end">${calendar.totalContributions} contributions</text>
  ${monthLabels}
  ${dayLabels}
  <g>${cells}</g>
  <path d="${motionPath}" fill="none" stroke="none"/>
  <g>${tail}</g>
  <g>
    <circle r="5.4" fill="${snake}"/>
    <circle cx="2.2" cy="-1.8" r="1" fill="${eye}"/>
    <circle cx="2.2" cy="1.8" r="1" fill="${eye}"/>
    <animateMotion dur="${DURATION}s" repeatCount="indefinite" path="${motionPath}"/>
  </g>
  <text class="summary" x="${WIDTH / 2}" y="${HEIGHT - 13}" text-anchor="middle">🐍 replaying January 1 — December 31, 2025</text>
</svg>`;
};

await mkdir("dist", { recursive: true });

await Promise.all([
  writeFile("dist/github-contribution-grid-snake.svg", render({
    background: "#ffffff",
    border: "#d0d7de",
    empty: "#ebedf0",
    levels: ["#9be9a8", "#40c463", "#30a14e", "#216e39"],
    text: "#1f2328",
    muted: "#656d76",
    snake: "#7c3aed",
    eye: "#ffffff",
  })),
  writeFile("dist/github-contribution-grid-snake-dark.svg", render({
    background: "#0d1117",
    border: "#30363d",
    empty: "#161b22",
    levels: ["#0e4429", "#006d32", "#26a641", "#39d353"],
    text: "#f0f6fc",
    muted: "#8b949e",
    snake: "#c084fc",
    eye: "#0d1117",
  })),
]);

console.log(`Generated animated ${YEAR} contribution snake for ${user} (${calendar.totalContributions} contributions).`);
