import type { Upgrade } from '../sim/upgrades';

const CLAY = '#de8048';
const GLAZE = '#1c120c';
const INCISED = `stroke="${CLAY}" stroke-width="1.2" fill="none" stroke-linecap="round"`;

const FIGURES: Record<Upgrade, string> = {
  lyceum: `
    <polygon points="27,41 50,28 73,41" fill="${GLAZE}"/>
    <polyline points="33,39 50,31.5 67,39" ${INCISED}/>
    <rect x="27" y="42" width="46" height="4" fill="${GLAZE}"/>
    ${[31, 41.5, 52, 62.5].map((x) => `<rect x="${x}" y="47" width="6.5" height="18" fill="${GLAZE}"/><line x1="${x + 3.25}" y1="49" x2="${x + 3.25}" y2="63" ${INCISED}/>`).join('')}
    <rect x="25" y="66" width="50" height="3.5" fill="${GLAZE}"/>
    <rect x="22" y="70.5" width="56" height="3.5" fill="${GLAZE}"/>`,
  cropRotation: `
    ${[-16, -9, -3, 3, 9, 16].map((dx) => `<path d="M50,74 Q${50 + dx * 0.3},55 ${50 + dx},36" stroke="${GLAZE}" stroke-width="2.2" fill="none"/>`).join('')}
    ${[-16, -9, -3, 3, 9, 16].map((dx) => `<ellipse cx="${50 + dx}" cy="32" rx="3.2" ry="7" transform="rotate(${dx * 1.2} ${50 + dx} 32)" fill="${GLAZE}"/><line x1="${50 + dx}" y1="27" x2="${50 + dx}" y2="37" ${INCISED} transform="rotate(${dx * 1.2} ${50 + dx} 32)"/>`).join('')}
    <rect x="43" y="57" width="14" height="5" rx="1.5" fill="${GLAZE}"/>
    <line x1="44" y1="59.5" x2="56" y2="59.5" ${INCISED}/>`,
  openFields: `
    <circle cx="63" cy="33" r="7.5" fill="${GLAZE}"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="63" y1="22" x2="63" y2="19" stroke="${GLAZE}" stroke-width="2" transform="rotate(${a} 63 33)"/>`).join('')}
    <path d="M8,60 Q30,46 52,57 T94,52 L94,94 L8,94 Z" fill="${GLAZE}" clip-path="url(#field)"/>
    ${[64, 70, 76, 82].map((y, i) => `<path d="M10,${y} Q32,${y - 12 + i * 2} 54,${y - 2} T92,${y - 5}" ${INCISED} clip-path="url(#field)"/>`).join('')}`,
  carrots: `
    ${[
      [38, -14],
      [50, 0],
      [62, 14],
    ]
      .map(
        ([x, turn]) => `<g transform="rotate(${turn} ${x} 46)">
          <path d="M${x - 5},44 L${x + 5},44 L${x},76 Z" fill="${GLAZE}"/>
          <line x1="${x - 3}" y1="52" x2="${x + 2}" y2="51" ${INCISED}/>
          <line x1="${x - 2}" y1="60" x2="${x + 2}" y2="59" ${INCISED}/>
          <path d="M${x},44 Q${x - 7},34 ${x - 6},25 M${x},44 Q${x},33 ${x + 1},23 M${x},44 Q${x + 6},35 ${x + 7},27" stroke="${GLAZE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        </g>`,
      )
      .join('')}`,
  packMules: `
    <line x1="18" y1="75" x2="82" y2="75" stroke="${GLAZE}" stroke-width="1.5"/>
    <ellipse cx="46" cy="55" rx="17" ry="8.5" fill="${GLAZE}"/>
    <polygon points="58,51 66,37 72,39 64,57" fill="${GLAZE}"/>
    <ellipse cx="71" cy="40" rx="7" ry="4" transform="rotate(28 71 40)" fill="${GLAZE}"/>
    <polygon points="66,36 64,25 68,35" fill="${GLAZE}"/>
    <polygon points="69,35 70,24 72,36" fill="${GLAZE}"/>
    ${[33, 39, 52, 58].map((x) => `<rect x="${x}" y="58" width="3.5" height="17" fill="${GLAZE}"/>`).join('')}
    <path d="M30,52 Q25,58 27,66" stroke="${GLAZE}" stroke-width="2" fill="none"/>
    <rect x="37" y="38" width="17" height="12" rx="2" fill="${GLAZE}"/>
    <line x1="40" y1="42" x2="51" y2="42" ${INCISED}/>
    <line x1="40" y1="46" x2="51" y2="46" ${INCISED}/>
    <circle cx="73" cy="39" r="0.9" fill="${CLAY}"/>`,
  amphoras: `
    <path d="M44,23 L56,23 L55,30 Q67,36 67,50 Q67,64 56,72 L58,78 L42,78 L44,72 Q33,64 33,50 Q33,36 45,30 Z" fill="${GLAZE}"/>
    <path d="M46,31 Q36,30 37,41" stroke="${GLAZE}" stroke-width="3" fill="none"/>
    <path d="M54,31 Q64,30 63,41" stroke="${GLAZE}" stroke-width="3" fill="none"/>
    <line x1="35" y1="47" x2="65" y2="47" ${INCISED}/>
    <line x1="35" y1="55" x2="65" y2="55" ${INCISED}/>
    <path d="M37,51 Q40,48.5 43,51 T49,51 T55,51 T61,51 T64,51" ${INCISED}/>
    <line x1="45" y1="26" x2="55" y2="26" ${INCISED}/>`,
  democracy: `
    <path d="M38,44 L62,44 Q66,56 61,70 L58,76 L42,76 L39,70 Q34,56 38,44 Z" fill="${GLAZE}"/>
    <rect x="36" y="41" width="28" height="4" fill="${GLAZE}"/>
    <path d="M38,60 L62,60" ${INCISED}/>
    <path d="M40,66 L60,66" ${INCISED}/>
    ${[
      [44, 24],
      [52, 30],
      [48, 36],
      [57, 21],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${GLAZE}"/>`)
      .join('')}`,
  plutocracy: `
    <circle cx="50" cy="50" r="25" fill="${GLAZE}"/>
    <circle cx="50" cy="50" r="22" ${INCISED} stroke-dasharray="1.5 2.5"/>
    <path d="M43,62 Q38,52 42,42 Q46,35 50,35 Q54,35 58,42 Q62,52 57,62 Z" ${INCISED}/>
    <circle cx="46" cy="44" r="3.4" ${INCISED}/>
    <circle cx="54" cy="44" r="3.4" ${INCISED}/>
    <circle cx="46" cy="44" r="0.9" fill="${CLAY}"/>
    <circle cx="54" cy="44" r="0.9" fill="${CLAY}"/>
    <polyline points="48.5,48 50,51 51.5,48" ${INCISED}/>
    <path d="M45,56 Q50,59 55,56 M46,60 Q50,62 54,60" ${INCISED}/>
    <path d="M60,64 Q66,58 66,49" ${INCISED}/>
    <ellipse cx="65" cy="54" rx="1.6" ry="3" transform="rotate(30 65 54)" fill="${CLAY}"/>`,
};

export function upgradeArt(upgrade: Upgrade): string {
  return `<svg viewBox="0 0 100 100" class="upgrade-art" aria-hidden="true">
    <defs><clipPath id="field"><circle cx="50" cy="50" r="40"/></clipPath></defs>
    <circle cx="50" cy="50" r="49" fill="${GLAZE}"/>
    <circle cx="50" cy="50" r="45.5" fill="none" stroke="${CLAY}" stroke-width="2.4" stroke-dasharray="0.1 4.6" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="42" fill="${CLAY}"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="${GLAZE}" stroke-width="0.8"/>
    ${FIGURES[upgrade]}
  </svg>`;
}
