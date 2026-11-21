/**
 * Köşe temaları: pencereden görünen manzara, renkler, sinideki ikram ve fon müziği ayarı.
 *
 * Altı il için özel tema var. Diğer iller, bölgesine uygun genel bir temayla açılır.
 * Yeni bir ile özel tema eklemek için CUSTOM_THEMES'e bir kayıt eklemek yeterlidir.
 *
 * Manzara çizimleri 140x134 birimlik pencere alanı için yazılmış SVG parçalarıdır.
 * Hepsi sabit, bizim yazdığımız içeriklerdir (kullanıcı verisi içermez).
 */
import { ALL_TURKEY_SLUG, getCity, type Region } from "./cities";

export type MakamName = "rast" | "ussak" | "huseyni" | "hicaz" | "kurdi" | "nihavend";
export type UsulName = "sofyan" | "duyek" | "aksak" | "karadeniz" | "semai";

export interface MusicPreset {
  makam: MakamName;
  usul: UsulName;
  bpm: number;
  ambience: { sea?: boolean; gulls?: boolean; wind?: boolean; rain?: boolean };
}

export interface SceneTheme {
  key: string;
  sky: [string, string];
  kilim: [string, string, string];
  plates: [string, string];
  skyline: string;
  tray: string;
  trayName: string;
  music: MusicPreset;
}

/* ---------------- Sinideki ikramlar ---------------- */

const TRAY = {
  simit: `<circle cx="-46" cy="26" r="7" fill="none" stroke="#b5732f" stroke-width="4"/><circle cx="42" cy="27" r="7" fill="none" stroke="#b5732f" stroke-width="4"/>`,
  boyoz: `<g fill="#d9a441" stroke="#a8742a" stroke-width="1.5"><ellipse cx="-46" cy="26" rx="9" ry="5"/><ellipse cx="42" cy="27" rx="9" ry="5"/></g><path d="M-50 26 q4 -3 8 0 M38 27 q4 -3 8 0" stroke="#a8742a" fill="none"/>`,
  hamsi: `<g fill="#b8c4cc" stroke="#7d8b94" stroke-width="1"><path d="M-56 24 Q-48 20 -40 24 Q-48 28 -56 24 Z"/><path d="M-40 24 L-35 21 L-35 27 Z"/><path d="M30 28 Q38 24 46 28 Q38 32 30 28 Z"/><path d="M46 28 L51 25 L51 31 Z"/><path d="M-20 30 Q-12 26 -4 30 Q-12 34 -20 30 Z"/><path d="M-4 30 L1 27 L1 33 Z"/></g>`,
  comlek: `<g transform="translate(-46 22)"><path d="M-7 -7 Q-11 4 -5 9 L5 9 Q11 4 7 -7 Z" fill="#b55a2e" stroke="#7a3518"/><rect x="-6" y="-9" width="12" height="3" rx="1" fill="#8a4422"/></g><g transform="translate(42 23)"><path d="M-6 -6 Q-9 3 -4 7 L4 7 Q9 3 6 -6 Z" fill="#c26a3a" stroke="#7a3518"/></g>`,
  baklava: `<g stroke="#9c6a1c" stroke-width="1" fill="#e0a83c"><path d="M-52 26 L-46 21 L-40 26 L-46 31 Z"/><path d="M-40 26 L-34 21 L-28 26 L-34 31 Z"/><path d="M30 27 L36 22 L42 27 L36 32 Z"/><path d="M42 27 L48 22 L54 27 L48 32 Z"/></g><g fill="#6a9a3a"><circle cx="-46" cy="26" r="1.6"/><circle cx="-34" cy="26" r="1.6"/><circle cx="36" cy="27" r="1.6"/><circle cx="48" cy="27" r="1.6"/></g>`,
  zeytin: `<g fill="#5d6b2f" stroke="#3d4a1c"><ellipse cx="-50" cy="25" rx="4" ry="3"/><ellipse cx="-42" cy="28" rx="4" ry="3"/><ellipse cx="38" cy="27" rx="4" ry="3"/><ellipse cx="46" cy="24" rx="4" ry="3"/></g><g fill="#2a2a1c"><ellipse cx="-46" cy="22" rx="4" ry="3"/><ellipse cx="42" cy="30" rx="4" ry="3"/></g>`,
  portakal: `<g fill="#f08a24" stroke="#b55f12"><circle cx="-46" cy="25" r="7"/><circle cx="42" cy="26" r="7"/></g><g fill="#4a8a2a"><ellipse cx="-44" cy="18" rx="3" ry="1.5"/><ellipse cx="44" cy="19" rx="3" ry="1.5"/></g>`,
  lokum: `<g stroke="#c7a0a8" stroke-width="1"><rect x="-54" y="21" width="8" height="8" rx="1.5" fill="#f2b8c6"/><rect x="-44" y="23" width="8" height="8" rx="1.5" fill="#fbf3f5"/><rect x="34" y="22" width="8" height="8" rx="1.5" fill="#f2b8c6"/><rect x="44" y="24" width="8" height="8" rx="1.5" fill="#fbf3f5"/></g>`,
  findik: `<g fill="#9a5b2a" stroke="#6b3a17"><circle cx="-50" cy="25" r="3.5"/><circle cx="-43" cy="28" r="3.5"/><circle cx="-46" cy="22" r="3.5"/><circle cx="39" cy="27" r="3.5"/><circle cx="46" cy="25" r="3.5"/></g>`,
  bal: `<g transform="translate(-46 20)"><rect x="-7" y="-4" width="14" height="14" rx="3" fill="#e8a317" stroke="#a86f0c"/><rect x="-8" y="-7" width="16" height="4" rx="1" fill="#c0392b"/></g><g transform="translate(42 22)"><rect x="-6" y="-3" width="12" height="12" rx="3" fill="#f0b429" stroke="#a86f0c"/><rect x="-7" y="-6" width="14" height="4" rx="1" fill="#c0392b"/></g>`,
  fistik: `<g fill="#9cbf4a" stroke="#5d7f2a"><ellipse cx="-50" cy="25" rx="3.5" ry="2.5"/><ellipse cx="-43" cy="28" rx="3.5" ry="2.5"/><ellipse cx="-46" cy="22" rx="3.5" ry="2.5"/><ellipse cx="39" cy="27" rx="3.5" ry="2.5"/><ellipse cx="46" cy="25" rx="3.5" ry="2.5"/></g>`,
};

/* ---------------- Manzaralar ---------------- */

const SKY = {
  izmir: `
    <circle cx="98" cy="46" r="14" fill="#fff3c4"/>
    <path d="M0 110 L0 92 L18 92 L18 80 L32 80 L32 96 L46 96 L46 74 L52 66 L58 74 L58 96 L76 96 L76 86 L92 86 L92 98 L110 98 L110 84 L124 84 L124 100 L140 100 L140 134 L0 134 Z" fill="#7a5a49" opacity=".85"/>
    <g fill="#5a3d31"><rect x="62" y="56" width="16" height="50"/><rect x="58" y="50" width="24" height="8"/><path d="M60 50 L70 36 L80 50 Z"/></g>
    <rect x="0" y="112" width="140" height="22" fill="#4f7ea8" opacity=".75"/>`,
  istanbul: `
    <circle cx="30" cy="40" r="12" fill="#fff1c9"/>
    <path d="M0 104 L0 96 L60 96 L60 100 L88 100 L88 92 L140 92 L140 134 L0 134 Z" fill="#6c4a4a" opacity=".8"/>
    <g fill="#4a3030">
      <path d="M14 100 Q30 76 46 100 Z"/><path d="M8 100 Q14 90 20 100 Z"/><path d="M40 100 Q46 90 52 100 Z"/>
      <rect x="6" y="66" width="3" height="34"/><path d="M5 66 L7.5 56 L10 66 Z"/>
      <rect x="51" y="66" width="3" height="34"/><path d="M50 66 L52.5 56 L55 66 Z"/>
      <rect x="98" y="56" width="16" height="44"/><rect x="96" y="54" width="20" height="4"/><path d="M96 54 L106 34 L116 54 Z"/>
    </g>
    <rect x="0" y="110" width="140" height="24" fill="#3f6f99" opacity=".85"/>
    <path d="M50 118 L82 118 L78 124 L54 124 Z" fill="#fff"/><rect x="58" y="113" width="14" height="5" fill="#fff"/><rect x="62" y="109" width="3" height="4" fill="#c0392b"/>`,
  ankara: `
    <circle cx="28" cy="36" r="11" fill="#fffbe6"/>
    <path d="M0 100 L0 90 L14 90 L14 78 L26 78 L26 94 L80 94 L80 82 L92 82 L92 96 L118 96 L118 86 L140 86 L140 134 L0 134 Z" fill="#6f7d8c" opacity=".8"/>
    <g fill="#4a5563">
      <path d="M34 104 Q50 78 66 104 Z"/>
      <rect x="30" y="62" width="3" height="42"/><path d="M29 62 L31.5 52 L34 62 Z"/>
      <rect x="67" y="62" width="3" height="42"/><path d="M66 62 L68.5 52 L71 62 Z"/>
      <rect x="101" y="52" width="6" height="52"/><circle cx="104" cy="47" r="9"/><rect x="103" y="30" width="2" height="9"/>
    </g>
    <rect x="0" y="104" width="140" height="30" fill="#8d7a5f"/>`,
  trabzon: `
    <path d="M0 80 L30 48 L55 72 L80 38 L110 70 L140 50 L140 134 L0 134 Z" fill="#2f6b3f"/>
    <rect x="0" y="66" width="140" height="10" fill="#fff" opacity=".35"/>
    <path d="M0 98 L25 84 L50 96 L80 80 L110 94 L140 84 L140 134 L0 134 Z" fill="#3f8a4f"/>
    <ellipse cx="70" cy="122" rx="66" ry="12" fill="#5fa3b8"/>
    <g fill="#e9eef0"><path d="M58 106 Q64 98 70 106 Z"/><rect x="72" y="92" width="2.5" height="14"/><path d="M71.5 92 L73.25 85 L75 92 Z"/></g>`,
  nevsehir: `
    <g><circle cx="34" cy="34" r="9" fill="#e74c3c"/><rect x="32" y="45" width="4" height="4" fill="#6b3f22"/><line x1="29" y1="40" x2="32" y2="45" stroke="#6b3f22"/><line x1="39" y1="40" x2="36" y2="45" stroke="#6b3f22"/></g>
    <g><circle cx="80" cy="24" r="7" fill="#f1c40f"/><rect x="78.5" y="32" width="3" height="3" fill="#6b3f22"/></g>
    <g><circle cx="110" cy="44" r="8" fill="#2e86ab"/><rect x="108" y="53" width="4" height="4" fill="#6b3f22"/></g>
    <g><circle cx="60" cy="56" r="5" fill="#8e44ad"/><rect x="59" y="62" width="2" height="2" fill="#6b3f22"/></g>
    <path d="M0 112 Q70 96 140 112 L140 134 L0 134 Z" fill="#c9a074"/>
    <g fill="#d9b48a" stroke="#a07a55" stroke-width="1"><path d="M14 134 L22 82 L30 134 Z"/><path d="M40 134 L50 74 L60 134 Z"/><path d="M84 134 L94 78 L104 134 Z"/><path d="M110 134 L118 88 L126 134 Z"/></g>
    <g fill="#8a6545"><ellipse cx="22" cy="82" rx="8" ry="4"/><ellipse cx="50" cy="74" rx="9" ry="5"/><ellipse cx="94" cy="78" rx="9" ry="5"/><ellipse cx="118" cy="88" rx="7" ry="4"/></g>`,
  gaziantep: `
    <circle cx="104" cy="34" r="12" fill="#fff3c4"/>
    <path d="M0 110 Q70 70 140 110 L140 134 L0 134 Z" fill="#9c7b55"/>
    <g fill="#6e4f35">
      <rect x="42" y="74" width="56" height="20"/>
      <rect x="36" y="64" width="14" height="30"/><rect x="90" y="64" width="14" height="30"/><rect x="63" y="58" width="14" height="36"/>
      ${[36, 40, 44, 48, 90, 94, 98, 102].map((x) => `<rect x="${x}" y="60" width="2.5" height="4"/>`).join("")}
      ${[63, 67, 71, 75].map((x) => `<rect x="${x}" y="54" width="2.5" height="4"/>`).join("")}
    </g>
    <g fill="#5d7f3a"><circle cx="14" cy="112" r="7"/><circle cx="126" cy="112" r="7"/></g>
    <g fill="#5a3d31"><rect x="13" y="114" width="2" height="8"/><rect x="125" y="114" width="2" height="8"/></g>`,
  turkiye: `
    <circle cx="104" cy="32" r="11" fill="#fffbe6"/>
    <path d="M0 96 L22 70 L44 90 L70 60 L96 88 L120 72 L140 84 L140 134 L0 134 Z" fill="#7f9a6b"/>
    <path d="M0 106 Q35 94 70 104 Q105 114 140 100 L140 134 L0 134 Z" fill="#c9b27a"/>
    <rect x="0" y="118" width="140" height="16" fill="#4f7ea8" opacity=".8"/>`,
  marmara: `
    <circle cx="32" cy="38" r="11" fill="#fff6d8"/>
    <path d="M0 98 Q30 82 60 94 Q95 80 140 92 L140 134 L0 134 Z" fill="#6f8f5f"/>
    <g fill="#4d5a4a"><path d="M86 98 Q96 84 106 98 Z"/><rect x="108" y="76" width="2.5" height="22"/><path d="M107.5 76 L109.25 68 L111 76 Z"/></g>
    <rect x="0" y="106" width="140" height="28" fill="#4a7fa8" opacity=".85"/>
    <path d="M30 60 q4 -4 8 0 q4 -4 8 0 M70 48 q3 -3 6 0 q3 -3 6 0" stroke="#5a4a4a" stroke-width="1.5" fill="none"/>`,
  ege: `
    <circle cx="106" cy="34" r="12" fill="#fff6d0"/>
    <path d="M0 96 Q40 78 80 92 Q110 84 140 94 L140 134 L0 134 Z" fill="#9aa86a"/>
    <g fill="#f7f4ee" stroke="#c9c2b4" stroke-width=".8"><rect x="22" y="84" width="14" height="12"/><rect x="38" y="80" width="12" height="16"/><rect x="52" y="86" width="12" height="10"/></g>
    <g fill="#2e6f8e"><rect x="26" y="88" width="4" height="5"/><rect x="42" y="84" width="4" height="5"/><rect x="55" y="89" width="4" height="4"/></g>
    <g fill="#5d6b2f"><circle cx="96" cy="88" r="7"/><circle cx="106" cy="86" r="6"/><circle cx="118" cy="90" r="6"/></g>
    <rect x="0" y="104" width="140" height="30" fill="#2f86b8" opacity=".9"/>`,
  akdeniz: `
    <circle cx="36" cy="36" r="15" fill="#fff0a8"/>
    <path d="M0 90 L28 62 L52 84 L80 56 L110 82 L140 66 L140 134 L0 134 Z" fill="#8a9a8a" opacity=".8"/>
    <rect x="0" y="102" width="140" height="32" fill="#2a9bc4"/>
    <rect x="0" y="98" width="140" height="6" fill="#f2deb0"/>
    <g stroke="#6b4a2a" stroke-width="3"><path d="M100 100 Q102 84 98 70" fill="none"/></g>
    <g fill="#3f8a3f"><path d="M98 70 q-14 -2 -20 8 q10 -6 20 -8 Z"/><path d="M98 70 q14 -2 20 8 q-10 -6 -20 -8 Z"/><path d="M98 70 q-6 -12 -16 -12 q10 4 16 12 Z"/><path d="M98 70 q6 -12 16 -12 q-10 4 -16 12 Z"/></g>`,
  icanadolu: `
    <circle cx="100" cy="36" r="12" fill="#fff8de"/>
    <path d="M0 92 Q35 80 70 90 Q105 98 140 86 L140 134 L0 134 Z" fill="#b9a46a"/>
    <path d="M0 106 Q50 96 140 108 L140 134 L0 134 Z" fill="#d9b85a"/>
    <g stroke="#a8862f" stroke-width="1">${[10, 22, 34, 46, 58, 70, 82, 94, 106, 118, 130].map((x) => `<line x1="${x}" y1="112" x2="${x + 2}" y2="104"/>`).join("")}</g>
    <g><rect x="32" y="78" width="2.5" height="14" fill="#5a3d31"/><circle cx="33" cy="74" r="8" fill="#6a8a4a"/></g>`,
  karadeniz: `
    <path d="M0 76 L26 46 L52 70 L82 36 L112 66 L140 46 L140 134 L0 134 Z" fill="#2f6b3f"/>
    <rect x="0" y="62" width="140" height="10" fill="#fff" opacity=".4"/>
    <path d="M0 96 L30 82 L60 94 L90 80 L120 92 L140 84 L140 134 L0 134 Z" fill="#4a9a52"/>
    <g stroke="#3a7a3f" stroke-width="2">${[100, 106, 112, 118, 124].map((y) => `<line x1="0" y1="${y}" x2="140" y2="${y - 6}"/>`).join("")}</g>
    <g><rect x="56" y="88" width="18" height="12" fill="#8a5a2a"/><path d="M54 88 L65 80 L76 88 Z" fill="#6b3f22"/></g>`,
  dogu: `
    <circle cx="30" cy="34" r="10" fill="#fffbea"/>
    <path d="M0 96 L30 50 L52 78 L84 30 L116 74 L140 56 L140 134 L0 134 Z" fill="#7a8a9a"/>
    <path d="M30 50 L38 62 L24 60 Z M84 30 L96 48 L74 46 Z M140 56 L134 64 L128 64 Z" fill="#fff"/>
    <path d="M0 104 Q70 92 140 104 L140 134 L0 134 Z" fill="#a8b89a"/>
    <ellipse cx="80" cy="120" rx="50" ry="8" fill="#5f8fb8"/>`,
  guneydogu: `
    <circle cx="104" cy="34" r="13" fill="#fff0c0"/>
    <path d="M0 104 Q70 76 140 104 L140 134 L0 134 Z" fill="#c9a06a"/>
    <g fill="#d9b480" stroke="#a8804a" stroke-width=".8">
      <rect x="30" y="86" width="18" height="14"/><rect x="48" y="80" width="16" height="20"/><rect x="64" y="84" width="20" height="16"/><rect x="84" y="88" width="16" height="12"/>
    </g>
    <g fill="#6b4a2a"><path d="M52 86 q4 -5 8 0 v6 h-8 Z"/><path d="M68 90 q4 -5 8 0 v6 h-8 Z"/><rect x="34" y="90" width="4" height="5"/><rect x="88" y="92" width="4" height="4"/></g>`,
};

/* ---------------- Temalar ---------------- */

const T = (key: string, t: Omit<SceneTheme, "key">): SceneTheme => ({ key, ...t });

const CUSTOM_THEMES: Record<string, SceneTheme> = {
  izmir: T("izmir", { sky: ["#f5a35c", "#fbd7a0"], kilim: ["#a43d2a", "#c4593c", "#e3b45a"], plates: ["#2e6f8e", "#8e2f2a"], skyline: SKY.izmir, tray: TRAY.boyoz, trayName: "boyoz", music: { makam: "ussak", usul: "sofyan", bpm: 84, ambience: { sea: true, gulls: true } } }),
  istanbul: T("istanbul", { sky: ["#f29b6b", "#fcd8b0"], kilim: ["#7a2233", "#a8384a", "#d9b45a"], plates: ["#1f5f8b", "#b03a48"], skyline: SKY.istanbul, tray: TRAY.simit, trayName: "simit", music: { makam: "huseyni", usul: "duyek", bpm: 80, ambience: { sea: true, gulls: true } } }),
  ankara: T("ankara", { sky: ["#8fb6d9", "#dbe9f3"], kilim: ["#6b3a2a", "#8f5a3c", "#d6c08a"], plates: ["#3a5f7a", "#8a4a2a"], skyline: SKY.ankara, tray: TRAY.simit, trayName: "Ankara simidi", music: { makam: "rast", usul: "sofyan", bpm: 76, ambience: {} } }),
  trabzon: T("trabzon", { sky: ["#9cc7c9", "#e2efe9"], kilim: ["#2f5a3a", "#4c7d4f", "#e3c05a"], plates: ["#2f6b3f", "#3a5f8a"], skyline: SKY.trabzon, tray: TRAY.hamsi, trayName: "hamsi", music: { makam: "kurdi", usul: "karadeniz", bpm: 128, ambience: { rain: true } } }),
  nevsehir: T("nevsehir", { sky: ["#f2a7a0", "#fde2c4"], kilim: ["#9a5b3a", "#c0825a", "#f0d6a0"], plates: ["#b5542e", "#6b7f3a"], skyline: SKY.nevsehir, tray: TRAY.comlek, trayName: "çömlek", music: { makam: "nihavend", usul: "semai", bpm: 72, ambience: { wind: true } } }),
  gaziantep: T("gaziantep", { sky: ["#f4b860", "#fbe3b0"], kilim: ["#7a2a2a", "#9c3d2e", "#a8c45a"], plates: ["#6a9a3a", "#9c3d2e"], skyline: SKY.gaziantep, tray: TRAY.baklava, trayName: "baklava", music: { makam: "hicaz", usul: "aksak", bpm: 88, ambience: {} } }),
  [ALL_TURKEY_SLUG]: T(ALL_TURKEY_SLUG, { sky: ["#7fb3d5", "#e8f1f7"], kilim: ["#8f2a24", "#b5452f", "#e3b45a"], plates: ["#c0392b", "#2e6f8e"], skyline: SKY.turkiye, tray: TRAY.simit, trayName: "simit", music: { makam: "rast", usul: "duyek", bpm: 80, ambience: {} } }),
};

const REGION_THEMES: Record<Region, SceneTheme> = {
  Marmara: T("marmara", { sky: ["#9ec5e0", "#e6f0f6"], kilim: ["#5a2a3a", "#7d3a4f", "#d9b45a"], plates: ["#2e6f8e", "#7d3a4f"], skyline: SKY.marmara, tray: TRAY.simit, trayName: "simit", music: { makam: "huseyni", usul: "duyek", bpm: 80, ambience: { sea: true, gulls: true } } }),
  Ege: T("ege", { sky: ["#7fc1e8", "#e9f6fc"], kilim: ["#2d5f8a", "#3f7fb0", "#e9d29a"], plates: ["#2e6f8e", "#5d6b2f"], skyline: SKY.ege, tray: TRAY.zeytin, trayName: "zeytin", music: { makam: "ussak", usul: "sofyan", bpm: 84, ambience: { sea: true } } }),
  Akdeniz: T("akdeniz", { sky: ["#5fb0e0", "#fdf1c7"], kilim: ["#b5452f", "#d9773f", "#f4d27a"], plates: ["#f08a24", "#2a9bc4"], skyline: SKY.akdeniz, tray: TRAY.portakal, trayName: "portakal", music: { makam: "hicaz", usul: "aksak", bpm: 92, ambience: { sea: true } } }),
  "İç Anadolu": T("icanadolu", { sky: ["#a8c8e0", "#f3ead2"], kilim: ["#7a4a2a", "#9c6a3c", "#e3c58a"], plates: ["#8a4a2a", "#3a5f7a"], skyline: SKY.icanadolu, tray: TRAY.lokum, trayName: "lokum", music: { makam: "rast", usul: "semai", bpm: 72, ambience: { wind: true } } }),
  Karadeniz: T("karadeniz", { sky: ["#a9cbd0", "#e8f1ee"], kilim: ["#2f5a3a", "#4c7d4f", "#e3c05a"], plates: ["#2f6b3f", "#9a5b2a"], skyline: SKY.karadeniz, tray: TRAY.findik, trayName: "fındık", music: { makam: "kurdi", usul: "karadeniz", bpm: 124, ambience: { rain: true } } }),
  "Doğu Anadolu": T("dogu", { sky: ["#8fb3d9", "#eef3f8"], kilim: ["#5a2a2a", "#8a3a2a", "#e3c05a"], plates: ["#8a3a2a", "#3a5f8a"], skyline: SKY.dogu, tray: TRAY.bal, trayName: "bal", music: { makam: "huseyni", usul: "semai", bpm: 70, ambience: { wind: true } } }),
  "Güneydoğu Anadolu": T("guneydogu", { sky: ["#f2b56b", "#fbe6bf"], kilim: ["#8a2a1f", "#b5452f", "#a8c45a"], plates: ["#9c3d2e", "#6a9a3a"], skyline: SKY.guneydogu, tray: TRAY.fistik, trayName: "fıstık", music: { makam: "hicaz", usul: "aksak", bpm: 84, ambience: {} } }),
};

export function themeFor(citySlug: string): SceneTheme {
  if (CUSTOM_THEMES[citySlug]) return CUSTOM_THEMES[citySlug];
  const city = getCity(citySlug);
  return city ? REGION_THEMES[city.region] : CUSTOM_THEMES[ALL_TURKEY_SLUG];
}

export function hasCustomTheme(citySlug: string): boolean {
  return Boolean(CUSTOM_THEMES[citySlug]);
}

/* ---------------- Makam ve usul tanımları (fon müziği için) ---------------- */

/** Makam dizileri: karar perdesinden itibaren sent cinsinden (yaklaşık, 8 perde). */
export const MAKAMS: Record<MakamName, { label: string; tonicHz: number; cents: number[] }> = {
  rast: { label: "Rast", tonicHz: 196, cents: [0, 204, 384, 498, 702, 906, 1088, 1200] },
  ussak: { label: "Uşşak", tonicHz: 220, cents: [0, 150, 294, 498, 702, 792, 996, 1200] },
  huseyni: { label: "Hüseyni", tonicHz: 220, cents: [0, 150, 294, 498, 702, 906, 996, 1200] },
  hicaz: { label: "Hicaz", tonicHz: 220, cents: [0, 114, 384, 498, 702, 792, 996, 1200] },
  kurdi: { label: "Kürdi", tonicHz: 220, cents: [0, 90, 294, 498, 702, 792, 996, 1200] },
  nihavend: { label: "Nihavend", tonicHz: 196, cents: [0, 204, 294, 498, 702, 792, 1088, 1200] },
};

/** Usuller: sekizlik vuruşlar. D = düm (pes), T = tek (tiz), k = hafif tek, "" = sus. */
export const USULS: Record<UsulName, { label: string; pattern: string[] }> = {
  sofyan: { label: "Sofyan", pattern: ["D", "", "", "", "T", "", "k", ""] },
  duyek: { label: "Düyek", pattern: ["D", "", "T", "T", "D", "", "T", ""] },
  aksak: { label: "Aksak", pattern: ["D", "", "T", "", "D", "", "T", "", ""] },
  karadeniz: { label: "Karadeniz (7/8)", pattern: ["D", "", "T", "", "T", "k", ""] },
  semai: { label: "Semai", pattern: ["D", "", "T", "", "T", ""] },
};
