/* 形の絵（首元・シルエット）。線は文字の色、塗りはお客様の「特に似合う色」 */
window.DS = window.DS || {};
(function () {
  const { svg } = DS.util;
  // 袖なしのトップスの外形。首の開きの形だけを変える
  const body = (neck) => `${neck} L52 17 L54 58 L10 58 L12 17 Z`;
  const FIG = {
    neckV: { fill: body('M24 12 L32 31 L40 12') },
    neckU: { fill: body('M24 12 C24 33 40 33 40 12') },
    neckBoat: { fill: 'M18 14 C26 19 38 19 46 14 L53 17 L54 58 L10 58 L11 17 Z' },
    neckSquare: { fill: body('M24 12 L24 25 L40 25 L40 12') },
    neckTurtle: { fill: 'M26 13 L26 4 L38 4 L38 13 L52 17 L54 58 L10 58 L12 17 Z', lines: ['M26 9 L38 9'] },
    neckShirt: { fill: body('M24 12 L32 27 L40 12'), lines: ['M24 12 L21 23 L30 24', 'M40 12 L43 23 L34 24', 'M32 27 L32 58'] },
    silI: { fill: 'M25 5 L39 5 L41 60 L23 60 Z' },
    silA: { fill: 'M27 5 L37 5 L51 60 L13 60 Z' },
    silX: { fill: 'M21 5 L43 5 L36 29 L49 60 L15 60 L28 29 Z' },
    silY: { fill: 'M13 5 L51 5 L39 30 L37 60 L27 60 L25 30 Z' },
    silO: { fill: 'M26 5 L38 5 C53 18 53 46 41 60 L23 60 C11 46 11 18 26 5 Z' }
  };

  function figure(id, color) {
    const f = FIG[id];
    const s = svg('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true', focusable: 'false' });
    if (!f) return s;
    const g = svg('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    g.append(svg('path', { d: f.fill, fill: color || 'none' }));
    for (const d of f.lines || []) g.append(svg('path', { d }));
    s.append(g);
    return s;
  }

  DS.figure = figure;
})();
