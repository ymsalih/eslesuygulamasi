/**
 * Şark köşesi sahnesi: minder konumları ve sabit arka plan çizimi.
 * Sahne 800x520 birimlik bir SVG'dir. Kişiler ve konuşma balonları üstüne ayrıca çizilir.
 */
import type { SceneTheme } from "./themes";

export const SCENE_W = 800;
export const SCENE_H = 520;

/** Minderler: arkadaki sedirde 6, iki yanda 2'şer. `tag` isim etiketinin dikey kaydırmasıdır. */
export const SEATS: { x: number; y: number; tag: number }[] = [
  { x: 175, y: 214, tag: 34 }, { x: 265, y: 214, tag: 54 }, { x: 355, y: 214, tag: 34 },
  { x: 445, y: 214, tag: 54 }, { x: 535, y: 214, tag: 34 }, { x: 625, y: 214, tag: 54 },
  { x: 96, y: 318, tag: 34 }, { x: 96, y: 440, tag: 34 },
  { x: 704, y: 318, tag: 34 }, { x: 704, y: 440, tag: 34 },
];

export function buildSceneSvg(theme: SceneTheme): string {
  const W = SCENE_W, H = SCENE_H;
  const cushions = SEATS.map((s, i) => {
    const c = i % 2 ? "#a8322a" : "#8f2a24";
    return `<g transform="translate(${s.x} ${s.y + 22})">
      <rect x="-38" y="-16" width="76" height="34" rx="12" fill="${c}" stroke="#5e1a15" stroke-width="2"/>
      <rect x="-30" y="-10" width="60" height="22" rx="8" fill="none" stroke="#e2b04a" stroke-width="2" stroke-dasharray="4 3"/>
      <circle cx="-38" cy="-16" r="3" fill="#e2b04a"/><circle cx="38" cy="-16" r="3" fill="#e2b04a"/>
      <circle cx="-38" cy="18" r="3" fill="#e2b04a"/><circle cx="38" cy="18" r="3" fill="#e2b04a"/>
    </g>`;
  }).join("");

  const glasses = [-56, -36, 28, 48].map((x, i) => `
    <g transform="translate(${x} ${i % 2 ? 8 : 2})">
      <ellipse cx="0" cy="12" rx="9" ry="3" fill="#f4f1ec" stroke="#b8b0a4"/>
      <path d="M-6 -10 Q-2 0 -5 10 L5 10 Q2 0 6 -10 Z" fill="#b5401f" stroke="#7a2a12" stroke-width="1" opacity=".9"/>
    </g>`).join("");

  const lantern = (x: number) => `
    <circle cx="${x}" cy="60" r="40" fill="url(#glow)"/>
    <line x1="${x}" y1="0" x2="${x}" y2="34" stroke="#5a3d31" stroke-width="2"/>
    <path d="M${x - 12} 34 L${x + 12} 34 L${x + 17} 66 L${x - 17} 66 Z" fill="#c9973f" stroke="#7a4b2a" stroke-width="2"/>
    <rect x="${x - 9}" y="42" width="18" height="18" fill="#ffe7a8"/>`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Şark köşesi">
  <defs>
    <pattern id="kilim" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="${theme.kilim[0]}"/>
      <path d="M20 4 L36 20 L20 36 L4 20 Z" fill="${theme.kilim[1]}"/>
      <path d="M20 12 L28 20 L20 28 L12 20 Z" fill="${theme.kilim[2]}"/>
      <circle cx="20" cy="20" r="2.5" fill="#3b2a1e"/>
    </pattern>
    <pattern id="wall" width="28" height="28" patternUnits="userSpaceOnUse">
      <rect width="28" height="28" fill="#ead6b5"/>
      <path d="M14 6 L18 14 L14 22 L10 14 Z" fill="#e2caa2"/>
    </pattern>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.sky[0]}"/><stop offset="1" stop-color="${theme.sky[1]}"/>
    </linearGradient>
    <radialGradient id="tray" cx=".45" cy=".4" r=".7">
      <stop offset="0" stop-color="#f0cf7a"/><stop offset="1" stop-color="#b8862e"/>
    </radialGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffe7a8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="win"><rect x="0" y="0" width="140" height="134" rx="64"/></clipPath>
  </defs>

  <rect x="0" y="0" width="${W}" height="250" fill="url(#wall)"/>
  <rect x="0" y="236" width="${W}" height="14" fill="#7a4b2a"/>

  <g transform="translate(330 28)">
    <rect x="-8" y="-8" width="156" height="150" rx="70" fill="#6b3f22"/>
    <rect x="0" y="0" width="140" height="134" rx="64" fill="url(#sky)"/>
    <g clip-path="url(#win)">${theme.skyline}</g>
    <line x1="70" y1="0" x2="70" y2="134" stroke="#6b3f22" stroke-width="5"/>
    <line x1="0" y1="70" x2="140" y2="70" stroke="#6b3f22" stroke-width="5"/>
  </g>

  <circle cx="150" cy="80" r="26" fill="${theme.plates[0]}" stroke="#e3b45a" stroke-width="4"/>
  <circle cx="150" cy="80" r="12" fill="#f2e2c4"/>
  <circle cx="650" cy="80" r="26" fill="${theme.plates[1]}" stroke="#e3b45a" stroke-width="4"/>
  <circle cx="650" cy="80" r="12" fill="#f2e2c4"/>
  ${lantern(245)}${lantern(555)}

  <rect x="0" y="250" width="${W}" height="${H - 250}" fill="#6e3b22"/>
  <rect x="150" y="285" width="500" height="215" rx="6" fill="url(#kilim)" stroke="#e3b45a" stroke-width="6"/>
  <rect x="166" y="301" width="468" height="183" rx="4" fill="none" stroke="#3b2a1e" stroke-width="2" stroke-dasharray="10 6"/>

  <rect x="120" y="196" width="560" height="60" rx="10" fill="#4d2a17"/>
  <rect x="128" y="190" width="544" height="34" rx="10" fill="#6d3a20"/>
  <rect x="44" y="230" width="104" height="270" rx="12" fill="#4d2a17"/>
  <rect x="652" y="230" width="104" height="270" rx="12" fill="#4d2a17"/>
  <rect x="40" y="224" width="20" height="282" rx="8" fill="#6d3a20"/>
  <rect x="740" y="224" width="20" height="282" rx="8" fill="#6d3a20"/>
  ${cushions}

  <g transform="translate(400 392)">
    <ellipse cx="0" cy="34" rx="70" ry="10" fill="#000" opacity=".2"/>
    <rect x="-8" y="10" width="16" height="26" fill="#5e3a1f"/>
    <ellipse cx="0" cy="8" rx="82" ry="34" fill="url(#tray)" stroke="#8a6221" stroke-width="3"/>
    <ellipse cx="0" cy="8" rx="64" ry="24" fill="none" stroke="#8a6221" stroke-width="1.5" stroke-dasharray="3 3"/>
    <g transform="translate(-6 -22)">
      <ellipse cx="0" cy="22" rx="20" ry="16" fill="#d9dde1" stroke="#8a9096" stroke-width="2"/>
      <rect x="-11" y="-4" width="22" height="14" rx="5" fill="#e6e9ec" stroke="#8a9096" stroke-width="2"/>
      <circle cx="0" cy="-7" r="4" fill="#8a9096"/>
      <path d="M18 18 Q32 10 30 0" stroke="#8a9096" stroke-width="4" fill="none"/>
      <path d="M-18 14 Q-30 18 -20 30" stroke="#8a9096" stroke-width="3" fill="none"/>
    </g>
    ${glasses}
    ${theme.tray}
  </g>
</svg>`;
}
