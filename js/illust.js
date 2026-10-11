/* イラスト（顔・洋服・バッグ・くつ・体型・素材）を SVG で描く
   塗りは「ベタ」だけ（グラデーション・ぼかしなし）。線は塗りの色を暗くした細い線。色は呼び出し側が渡す（絵の中身なので直接の色コードでよい。D-35） */
window.DS = window.DS || {};
(function () {
  const { svg } = DS.util;

  /* ---------- 色の計算 ---------- */
  const toRgb = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    const n = m ? parseInt(m[1], 16) : 0xcccccc;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const toHex = (rgb) => `#${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
  const shade = (hex, k) => toHex(toRgb(hex).map((v) => v * (1 - k)));
  const tint = (hex, k) => toHex(toRgb(hex).map((v) => v + (255 - v) * k));
  const lum = (hex) => { const [r, g, b] = toRgb(hex); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };

  const P = (d, attrs) => svg('path', Object.assign({ d }, attrs));
  const C = (cx, cy, r, attrs) => svg('circle', Object.assign({ cx, cy, r }, attrs));
  const E = (cx, cy, rx, ry, attrs) => svg('ellipse', Object.assign({ cx, cy, rx, ry }, attrs));
  const G = (attrs, ...kids) => svg('g', attrs, ...kids);
  const mirror = (node) => G({ transform: 'translate(120 0) scale(-1 1)' }, node);
  let uid = 0;
  /* 絵の描き方: 'solid'＝輪郭つきのベタ塗り（標準）／'line'＝細い線が主役／'flat'＝輪郭線なしの平らな色のかたち */
  const STYLE = { mode: 'solid' };
  const wash = (fill, k) => (STYLE.mode === 'line' ? tint(fill, (k === undefined ? 0.26 : k) * Math.min(1, 0.25 + lum(fill) * 1.5)) : fill);

  /* 線・かげの色をそろえる */
  const inkOf = (fill) => shade(fill, lum(fill) > 0.75 ? 0.36 : 0.28);
  const lineInk = (fill) => (STYLE.mode === 'line' ? shade(fill, lum(fill) > 0.8 ? 0.5 : 0.42) : inkOf(fill));
  const base = (fill) => {
    if (STYLE.mode === 'flat') return { fill, stroke: shade(fill, lum(fill) > 0.85 ? 0.2 : 0.1), 'stroke-width': '0.5', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
    return { fill: wash(fill), stroke: lineInk(fill), 'stroke-width': STYLE.mode === 'line' ? '0.75' : '1', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  };
  const line = (fill, extra) => Object.assign({ fill: 'none', stroke: STYLE.mode === 'flat' ? shade(fill, 0.2) : lineInk(fill), 'stroke-width': STYLE.mode === 'solid' ? '0.8' : '0.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: STYLE.mode === 'flat' ? '0.7' : '1' }, extra);
  const soft = (fill, k) => ({ fill: shade(fill, k || 0.14), opacity: STYLE.mode === 'line' ? '0' : STYLE.mode === 'flat' ? '0.28' : '0.6', stroke: 'none' }); // 服のかげ（ベタ）
  // かげは、服の形の内側だけに入れる（右がわ・すその一部）
  const RIGHT = 'M72 -10 L140 -10 L140 240 L72 240 Z';
  function shadeIn(shapeD, shadeD, fill) {
    const id = `sd${uid++}`;
    return G(null, svg('defs', null, svg('clipPath', { id }, P(shapeD))), G({ 'clip-path': `url(#${id})` }, P(shadeD, soft(fill))));
  }

  /* ---------- トップス ---------- */
  const TOPS = {
    vknit: { neck: 'v', sleeve: 'long', hem: 98, knit: true },
    uknit: { neck: 'u', sleeve: 'long', hem: 94, knit: true },
    boat: { neck: 'boat', sleeve: 'q3', hem: 90 },
    square: { neck: 'square', sleeve: 'puff', hem: 88 },
    turtle: { neck: 'turtle', sleeve: 'long', hem: 104, knit: true },
    shirt: { neck: 'collar', sleeve: 'long', hem: 100 },
    roundcollar: { neck: 'roundc', sleeve: 'puff', hem: 90 },
    tee: { neck: 'crew', sleeve: 'short', hem: 94 }
  };
  const NECK = {
    v: { a: [49, 15], seg: 'C54 26 58 36 60 40 C62 36 66 26 71 15' },
    u: { a: [49, 15], seg: 'C48 36 72 36 71 15' },
    boat: { a: [40, 18], seg: 'C52 26 68 26 80 18' },
    square: { a: [49, 15], seg: 'L49 33 Q49 34 51 34 L69 34 Q71 34 71 33 L71 15' },
    turtle: { a: [50, 15], seg: 'L70 15' },
    collar: { a: [49, 15], seg: 'L60 37 L71 15' },
    roundc: { a: [49, 15], seg: 'C49 31 71 31 71 15' },
    crew: { a: [49, 15], seg: 'C50 28 70 28 71 15' }
  };
  const SLEEVE = {
    long: 'M35 23 C27 24 21 29 19 37 L8 82 C7 87 10 90 15 91 C20 92 24 90 26 86 L39 46 Z',
    q3: 'M35 23 C27 24 22 29 20 36 L12 66 C11 71 14 73 18 73 C23 74 26 72 27 68 L39 44 Z',
    short: 'M35 23 C27 24 23 28 22 34 L17 52 C16 56 19 58 23 58 C27 58 30 56 31 52 L39 38 Z',
    puff: 'M35 23 C21 19 11 30 14 45 C15 50 21 53 27 52 C32 51 36 48 39 40 Z'
  };

  function topNodes(shape, color, opt) {
    const t = TOPS[shape] || TOPS.vknit;
    const o = opt || {};
    const sleeve = o.sleeve || t.sleeve;
    const hem = o.hem || t.hem;
    const n = NECK[t.neck];
    const out = [];
    const sl = (node) => [mirror(node), node];
    out.push(...sl(P(SLEEVE[sleeve], base(color))));
    out.push(...sl(P(sleeve === 'puff' ? 'M16 47 Q27 50 37 43' : sleeve === 'long' ? 'M9 80 L24 86' : sleeve === 'q3' ? 'M13 66 L26 70' : 'M18 50 L31 54', line(color))));
    const body = `M35 23 L${n.a[0]} ${n.a[1]} ${n.seg} L85 23 C87 45 87 70 86 ${hem} Q60 ${hem + 5} 34 ${hem} C33 70 33 45 35 23 Z`;
    out.push(P(body, base(color)));
    out.push(shadeIn(body, 'M76 -10 L120 -10 L120 200 L76 200 Z', color));
    out.push(P(`M44 ${hem - 18} Q50 ${hem - 12} 47 ${hem - 4}`, line(color, { opacity: '0.5' })));
    if (t.knit) out.push(P(`M34 ${hem - 5} Q60 ${hem} 86 ${hem - 5}`, line(color)));
    if (t.neck === 'turtle') {
      out.push(P('M50 15 L50 4 Q60 0 70 4 L70 15 Z', base(color)));
      out.push(P('M50 9 Q60 13 70 9', line(color)));
    }
    if (t.neck === 'collar') {
      out.push(P('M49 14 L39 26 L54 31 L60 37 L54 21 Z', base(color)), P('M71 14 L81 26 L66 31 L60 37 L66 21 Z', base(color)));
      out.push(P(`M60 37 L60 ${hem + 2}`, line(color)));
      for (let y = 50; y < hem - 4; y += 14) out.push(C(60, y, 1.3, { fill: lineInk(color) }));
    }
    if (t.neck === 'roundc') out.push(P('M47 15 C46 34 74 34 73 15 L69 18 C68 27 52 27 51 18 Z', base(tint(color, 0.5))));
    return out;
  }

  /* ---------- ボトムス・ワンピース ---------- */
  const PANTS = {
    straight: 'M37 88 L83 88 C84 112 86 140 87 177 L65 177 C63 150 61 130 60 114 C59 130 57 150 55 177 L33 177 C34 140 36 112 37 88 Z',
    wide: 'M37 88 L83 88 C86 120 94 150 101 179 L65 179 C63 150 61 130 60 114 C59 130 57 150 55 179 L19 179 C26 150 34 120 37 88 Z',
    tapered: 'M36 88 L84 88 C85 112 83 140 80 175 L66 175 C64 150 62 130 60 112 C58 130 56 150 54 175 L40 175 C37 140 35 112 36 88 Z'
  };
  const SKIRT = {
    tight: 'M38 88 L82 88 C84 110 86 130 86 150 Q60 156 34 150 C34 130 36 110 38 88 Z',
    aline: 'M38 88 L82 88 C86 112 90 132 94 152 Q60 160 26 152 C30 132 34 112 38 88 Z',
    flare: 'M38 88 L82 88 C88 116 94 138 100 160 Q82 166 60 162 Q38 166 20 160 C26 138 32 116 38 88 Z',
    maxi: 'M38 88 L82 88 C90 124 98 152 106 178 Q84 184 60 180 Q36 184 14 178 C22 152 30 124 38 88 Z'
  };
  function bottomNodes(shape, color) {
    const out = [];
    if (PANTS[shape]) {
      out.push(P(PANTS[shape], base(color)));
      out.push(shadeIn(PANTS[shape], 'M61 80 L140 80 L140 200 L61 200 Z', color));
      out.push(P('M37 96 Q60 99 83 96', line(color)), P('M60 98 L60 113', line(color)));
      out.push(P('M44 98 L44 175', line(color, { opacity: '0.35' })), P('M76 98 L76 175', line(color, { opacity: '0.35' })));
    } else if (SKIRT[shape]) {
      out.push(P(SKIRT[shape], base(color)));
      out.push(P('M38 96 Q60 99 82 96', line(color)));
      const bottom = { tight: 150, aline: 154, flare: 163, maxi: 181 }[shape];
      const sp = { tight: 0, aline: 7, flare: 12, maxi: 16 }[shape];
      if (sp) out.push(P(`M50 98 Q${50 - sp / 2} ${bottom / 2 + 40} ${50 - sp} ${bottom}`, line(color)), P(`M60 99 L60 ${bottom + 1}`, line(color)), P(`M70 98 Q${70 + sp / 2} ${bottom / 2 + 40} ${70 + sp} ${bottom}`, line(color)));
      else out.push(P('M60 134 L60 152', line(color)));
      out.push(shadeIn(SKIRT[shape], 'M76 80 L140 80 L140 200 L76 200 Z', color));
    }
    return out;
  }
  const DRESS = {
    shirtdress: { top: 'shirt', skirt: 'aline', hem: 96, belt: true },
    vdress: { top: 'vknit', sleeve: 'short', skirt: 'flare', hem: 94 },
    boatdress: { top: 'boat', skirt: 'tight', hem: 92 },
    knitlong: { top: 'turtle', skirt: 'maxi', hem: 98 },
    girly: { top: 'roundcollar', skirt: 'flare', hem: 92 }
  };
  function dressNodes(shape, color) {
    const d = DRESS[shape] || DRESS.shirtdress;
    const out = [P(SKIRT[d.skirt], base(color))];
    out.push(shadeIn(SKIRT[d.skirt], 'M76 80 L140 80 L140 200 L76 200 Z', color));
    out.push(...topNodes(d.top, color, { sleeve: d.sleeve, hem: d.hem }));
    if (d.belt) out.push(P(`M34 ${d.hem - 2} Q60 ${d.hem + 3} 86 ${d.hem - 2}`, line(color, { 'stroke-width': '2.6' })));
    return out;
  }

  /* ---------- アウター（前をあけて、中のトップスが見える） ---------- */
  const OUTER = {
    jacket: { hem: 108, spread: 0, collar: 'lapel' },
    cardi: { hem: 86, spread: 0, collar: 'round' },
    longcardi: { hem: 128, spread: 4, collar: 'round' },
    coat: { hem: 138, spread: 3, collar: 'stand', belt: true }
  };
  function outerNodes(shape, color) {
    const o = OUTER[shape] || OUTER.jacket;
    const L = `M28 24 C34 18 42 14 47 12 L51 12 C52 40 53 70 53 ${o.hem} L${28 - o.spread} ${o.hem} C26 80 26 50 28 24 Z`;
    const sleeve = 'M30 23 C22 24 15 29 13 38 L4 88 C3 92 7 95 12 95 C17 95 20 93 21 89 L33 48 Z';
    const out = [];
    out.push(mirror(P(sleeve, base(color))), P(sleeve, base(color)));
    out.push(P(L, base(color)), mirror(P(L, base(color))));
    out.push(mirror(shadeIn(L, 'M0 0 L36 0 L36 200 L0 200 Z', color)));
    if (o.collar === 'lapel') {
      const lap = P('M51 12 L40 26 L49 44 L56 35 Z', base(tint(color, 0.14)));
      out.push(lap, mirror(P('M51 12 L40 26 L49 44 L56 35 Z', base(tint(color, 0.14)))));
      out.push(C(54, 72, 1.6, { fill: lineInk(color) }), C(66, 72, 1.6, { fill: lineInk(color) }));
    }
    if (o.collar === 'round') {
      out.push(P(`M52 14 L53 ${o.hem}`, line(color)), P(`M68 14 L67 ${o.hem}`, line(color)));
      for (let y = 30; y < o.hem - 6; y += 16) out.push(C(57, y, 1.3, { fill: lineInk(color) }));
    }
    if (o.collar === 'stand') {
      const st = 'M47 13 L43 4 L52 8 L53 14 Z';
      out.push(P(st, base(tint(color, 0.14))), mirror(P(st, base(tint(color, 0.14)))));
      for (let y = 34; y < 100; y += 22) out.push(C(57, y, 1.4, { fill: lineInk(color) }));
    }
    if (o.belt) out.push(P('M27 94 L53 94', line(color, { 'stroke-width': '2.2' })), mirror(P('M27 94 L53 94', line(color, { 'stroke-width': '2.2' }))));
    return out;
  }

  /* ---------- くつ（横から見た図・左右ひと組） ---------- */
  const SHOE = {
    pumps: { d: 'M1 24 C1 19 5 18 10 17 C16 15 20 9 25 5 L28 7 L28 15 C28 19 26 22 25 24 Z', extra: ['M24 17 L27 17 L26 27 L24 27 Z'], sole: true },
    loafer: { d: 'M1 24 C1 17 7 15 12 15 C18 15 24 11 29 11 L31 13 L31 24 Z', lines: ['M10 16 Q16 19 22 14', 'M22 12 L22 17'], sole: true },
    flat: { d: 'M1 24 C1 17 7 15 12 15 C18 15 24 11 29 11 L31 13 L31 24 Z', lines: ['M11 16 Q19 21 27 13'], dot: [24, 12.5, 2], sole: true },
    boots: { d: 'M2 24 C2 19 8 18 12 18 L14 1 L29 1 L30 24 Z', lines: ['M14 8 L29 8'], sole: true },
    sneaker: { d: 'M1 24 C1 17 6 15 11 15 C16 15 20 10 26 10 L30 12 L30 24 Z', lines: ['M14 14 L17 18', 'M18 12 L21 16', 'M22 11 L25 15'], whiteSole: true }
  };
  function shoesNodes(shape, color) {
    const s = SHOE[shape] || SHOE.pumps;
    const one = (x, y) => G({ transform: `translate(${x} ${y})` },
      ...(s.extra || []).map((d) => P(d, base(shade(color, 0.1)))),
      P(s.d, base(color)),
      ...(s.lines || []).map((d) => P(d, line(color))),
      s.dot ? C(s.dot[0], s.dot[1], s.dot[2], { fill: lineInk(color) }) : null,
      s.whiteSole ? P('M1 24 L30 24 L30 27 L1 27 Z', base('#FFFFFF')) : P('M1 24 L30 24 L30 25.6 L1 25.6 Z', { fill: lineInk(color), stroke: 'none' }));
    return [one(8, 190), one(40, 196)];
  }

  /* ---------- バッグ（36×40 の枠を、右下に置く） ---------- */
  const BAG = {
    hand: { d: 'M3 16 Q18 14 33 16 L35 38 Q18 40 1 38 Z', strap: 'M10 16 C10 3 26 3 26 16', lines: ['M3 24 Q18 26 33 24'], dot: [18, 25, 2] },
    shoulder: { d: 'M4 14 Q18 12 32 14 L33 38 Q18 40 3 38 Z', strap: 'M4 14 C-3 -3 39 -3 32 14', lines: ['M4 14 L18 27 L32 14'], dot: [18, 27, 1.8] },
    tote: { d: 'M2 14 Q18 12 34 14 L32 38 Q18 40 4 38 Z', strap: 'M9 14 C9 2 27 2 27 14', lines: [], dot: null },
    mini: { d: 'M6 20 Q18 18 30 20 L31 38 Q18 40 5 38 Z', strap: 'M6 20 C6 5 30 5 30 20', lines: ['M6 27 Q18 29 30 27'], dot: [18, 28, 1.8] }
  };
  function bagNodes(shape, color) {
    const b = BAG[shape] || BAG.hand;
    return [G({ transform: 'translate(76 184)' },
      P(b.strap, line(color, { 'stroke-width': '1.8' })),
      P(b.d, base(color)), ...b.lines.map((d) => P(d, line(color))),
      b.dot ? C(b.dot[0], b.dot[1], b.dot[2], { fill: lineInk(color) }) : null)];
  }

  /* ---------- 1着ぶんのコーデの絵 ---------- */
  function outfit(c, label) {
    const root = svg('svg', { viewBox: '0 0 120 232', role: 'img', 'aria-label': label || 'コーデの絵', focusable: 'false' });
    const nodes = [];
    if (c.style === 'dress') nodes.push(...dressNodes(c.bottom.shape, c.bottom.color));
    else nodes.push(...bottomNodes(c.bottom.shape, c.bottom.color), ...topNodes(c.top.shape, c.top.color));
    if (c.outer) nodes.push(...outerNodes(c.outer.shape, c.outer.color));
    nodes.push(...shoesNodes(c.shoes.shape, c.shoes.color), ...bagNodes(c.bag.shape, c.bag.color));
    root.append(...nodes.filter(Boolean));
    return root;
  }

  /* えらぶ画面・一覧の小さな絵（1つの部品だけ） */
  const CROP = { outer: '0 0 120 156', top: '0 0 120 106', pants: '10 84 100 100', skirt: '10 84 100 100', dress: '0 0 120 182', bag: '70 178 48 52', shoes: '2 184 76 48' };
  function thumb(slot, shape, color, innerColor) {
    const root = svg('svg', { viewBox: CROP[slot], 'aria-hidden': 'true', focusable: 'false' });
    let nodes = [];
    if (slot === 'outer') nodes = [...topNodes('vknit', innerColor || '#F3EDE6'), ...outerNodes(shape, color)];
    else if (slot === 'top') nodes = topNodes(shape, color);
    else if (slot === 'pants' || slot === 'skirt') nodes = bottomNodes(shape, color);
    else if (slot === 'dress') nodes = dressNodes(shape, color);
    else if (slot === 'bag') nodes = bagNodes(shape, color);
    else if (slot === 'shoes') nodes = shoesNodes(shape, color);
    root.append(...nodes.filter(Boolean));
    return root;
  }

  /* ---------- 顔（やわらかい、かわいい顔立ち） ---------- */
  // opt: { hairStyle, hair, eye, cheek, lip, metal, drape(首まわりの服の色), skin, round(0〜1: 曲線ほど1), adult(0〜1: 大人顔ほど1) }
  const HAIR_BACK = {
    short: 'M38 122 C24 66 62 16 100 16 C140 16 178 66 162 122 C164 142 156 150 148 152 C140 154 136 148 134 142 L66 142 C64 148 60 154 52 152 C44 150 36 142 38 122 Z',
    bob: 'M34 118 C20 60 62 12 100 12 C140 12 180 60 166 118 C170 148 162 174 148 182 C136 187 130 180 128 172 L72 172 C70 180 64 187 52 182 C38 174 30 148 34 118 Z',
    mid: 'M32 118 C16 60 62 10 100 10 C140 10 184 60 168 118 C174 152 180 182 170 208 C164 218 148 214 144 204 L56 204 C52 214 36 218 30 208 C20 182 26 152 32 118 Z',
    long: 'M30 118 C12 60 62 8 100 8 C140 8 188 60 170 118 C180 160 186 200 176 232 C172 246 154 248 150 238 L50 238 C46 248 28 246 24 232 C14 200 20 160 30 118 Z',
    updo: 'M40 122 C28 66 62 20 100 20 C140 20 172 66 160 122 Z'
  };
  const HAIR_FRONT = {
    short: 'M42 122 C28 66 62 20 100 20 C140 20 174 66 158 122 C157 100 150 82 136 72 C124 88 94 90 76 76 C62 84 48 100 42 122 Z',
    bob: 'M40 122 C26 64 62 18 100 18 C140 18 176 64 160 122 C158 100 150 82 136 72 C124 88 94 90 76 76 C62 84 46 100 40 122 Z',
    mid: 'M38 126 C24 64 62 16 100 16 C140 16 178 64 162 126 C160 102 150 82 136 72 C124 88 94 90 76 76 C62 84 46 104 38 126 Z',
    long: 'M36 130 C22 64 62 14 100 14 C140 14 180 64 164 130 C162 104 150 82 136 72 C124 88 94 90 76 76 C62 84 44 106 36 130 Z',
    updo: 'M42 122 C28 66 62 22 100 22 C140 22 174 66 158 122 C154 92 138 62 100 58 C62 62 46 92 42 122 Z'
  };

  function face(opt) {
    const o = opt;
    const id = `fc${uid++}`;
    const root = svg('svg', { viewBox: '0 0 200 250', role: 'img', 'aria-label': o.label || '顔の絵', focusable: 'false' });
    const skin = o.skin;
    const skinInk = shade(skin, 0.16);
    const hair = o.hair;
    const hairInk = shade(hair, 0.4);
    const r = o.round;
    const a = o.adult;
    const hw = 56 + 6 * r;
    const cw = 9 + 6 * r;
    const chinY = 164 + 6 * a;
    const eyeY = 106 + 3 * (1 - a);
    const eyeRx = 11.5 - 1.5 * a;
    const eyeRy = 9 - 1.5 * a;
    const mY = eyeY + 41;
    const add = (n) => root.append(n);
    const defs = svg('defs');
    add(defs);

    // うしろ髪（まとめ髪は、おだんごも）。幅を少しせまくして、顔とのバランスをとる
    const NARROW = { transform: 'translate(100 0) scale(0.94 1) translate(-100 0)' };
    const backG = G(NARROW);
    add(backG);
    backG.append(P(HAIR_BACK[o.hairStyle] || HAIR_BACK.mid, { fill: hair, stroke: hairInk, 'stroke-width': '0.9', 'stroke-linejoin': 'round' }));
    if (o.hairStyle === 'updo') {
      backG.append(C(100, 22, 24, { fill: hair, stroke: hairInk, 'stroke-width': '0.9' }));
      backG.append(P('M84 14 Q100 4 116 14', { fill: 'none', stroke: tint(hair, 0.4), 'stroke-width': '2.4', 'stroke-linecap': 'round', opacity: '0.7' }));
      backG.append(P('M72 36 Q100 30 128 36', { fill: 'none', stroke: o.drape, 'stroke-width': '4', 'stroke-linecap': 'round' }));
    }
    // 首・かたと首まわりの服
    add(P('M90 148 L90 192 L110 192 L110 148 Z', { fill: shade(skin, 0.04), stroke: skinInk, 'stroke-width': '0.8' }));
    add(P('M16 250 C18 218 54 198 90 192 L110 192 C146 198 182 218 184 250 Z', { fill: o.drape, stroke: inkOf(o.drape), 'stroke-width': '1', 'stroke-linejoin': 'round' }));
    add(P('M88 192 C92 206 96 214 100 218 C104 214 108 206 112 192 Z', { fill: shade(skin, 0.04), stroke: skinInk, 'stroke-width': '0.8', 'stroke-linejoin': 'round' }));
    add(P('M90 168 Q100 182 110 168 L110 150 L90 150 Z', { fill: shade(skin, 0.14), opacity: '0.6' }));
    if (o.metal) {
      add(P('M89 194 Q100 232 111 194', { fill: 'none', stroke: o.metal, 'stroke-width': '1.6' }));
      add(C(100, 213, 3, { fill: o.metal, stroke: shade(o.metal, 0.3), 'stroke-width': '0.8' }));
    }
    // 顔（あごが小さい、やわらかいたまご形）
    add(P(`M100 44 C${100 + hw * 0.8} 44 ${100 + hw} 66 ${100 + hw} 100 C${100 + hw} 130 ${100 + cw + 16} 154 ${100 + cw} ${chinY - 5} Q100 ${chinY + 4} ${100 - cw} ${chinY - 5} C${100 - cw - 16} 154 ${100 - hw} 130 ${100 - hw} 100 C${100 - hw} 66 ${100 - hw * 0.8} 44 100 44 Z`,
      { fill: skin, stroke: skinInk, 'stroke-width': '0.9', 'stroke-linejoin': 'round' }));
    // チーク（ふんわり）
    for (const x of [100 - hw * 0.64, 100 + hw * 0.64]) add(E(x, eyeY + 22, 12, 7.5, { fill: o.cheek, opacity: '0.55' }));
    // 目
    for (const sd of [-1, 1]) {
      const ex = 100 + sd * 24;
      const rx = eyeRx;
      const ry = eyeRy;
      const clip = `${id}-${sd > 0 ? 'r' : 'l'}`;
      const eyePath = `M${ex - rx} ${eyeY} C${ex - rx * 0.55} ${eyeY - ry * 1.55} ${ex + rx * 0.55} ${eyeY - ry * 1.55} ${ex + rx} ${eyeY} C${ex + rx * 0.55} ${eyeY + ry * 0.95} ${ex - rx * 0.55} ${eyeY + ry * 0.95} ${ex - rx} ${eyeY} Z`;
      defs.append(svg('clipPath', { id: clip }, P(eyePath)));
      add(E(ex, eyeY - ry * 1.15, rx + 4, ry * 0.8, { fill: o.eye, opacity: '0.6' })); // アイシャドウ
      add(P(eyePath, { fill: '#FFFFFF' }));
      add(G({ 'clip-path': `url(#${clip})` },
        C(ex, eyeY - 0.5, ry * 0.98, { fill: '#6A4636' }),
        C(ex, eyeY + 1.5, ry * 0.62, { fill: '#8E6450' }),
        C(ex, eyeY - 0.5, ry * 0.46, { fill: '#2A1A16' }),
        C(ex - 2.6, eyeY - 3.4, 2.4, { fill: '#FFFFFF' }),
        C(ex + 2.8, eyeY + 2.6, 1.1, { fill: '#FFFFFF' })));
      const flick = `${ex + sd * rx} ${eyeY} L${ex + sd * (rx + 3.5)} ${eyeY - 3}`;
      add(P(`M${ex - rx} ${eyeY} C${ex - rx * 0.55} ${eyeY - ry * 1.55} ${ex + rx * 0.55} ${eyeY - ry * 1.55} ${ex + rx} ${eyeY} M${flick}`, { fill: 'none', stroke: '#2A1A16', 'stroke-width': '2', 'stroke-linecap': 'round' }));
      add(P(`M${ex - rx + 2} ${eyeY - ry * 1.5} Q${ex} ${eyeY - ry * 2.15} ${ex + rx - 2} ${eyeY - ry * 1.5}`, { fill: 'none', stroke: skinInk, 'stroke-width': '0.8', opacity: '0.8', 'stroke-linecap': 'round' }));
      add(P(`M${ex - rx + 1} ${eyeY + 0.5} C${ex - rx * 0.5} ${eyeY + ry * 0.9} ${ex + rx * 0.5} ${eyeY + ry * 0.9} ${ex + rx - 1} ${eyeY + 0.5}`, { fill: 'none', stroke: '#2A1A16', 'stroke-width': '0.6', opacity: '0.45' }));
      add(P(`M${ex - rx - 2} ${eyeY - 17} Q${ex} ${eyeY - 22 - 3 * r} ${ex + rx + 2} ${eyeY - 17.5}`, { fill: 'none', stroke: shade(hair, 0.1), 'stroke-width': '2', 'stroke-linecap': 'round', opacity: '0.8' }));
    }
    // 鼻・くち（小さく、やさしく）
    add(P(`M98.5 ${eyeY + 22} Q100 ${eyeY + 25} 102 ${eyeY + 22.5}`, { fill: 'none', stroke: skinInk, 'stroke-width': '1', 'stroke-linecap': 'round' }));
    add(P(`M91 ${mY} Q95.5 ${mY - 3.4} 100 ${mY - 1.6} Q104.5 ${mY - 3.4} 109 ${mY} Q100 ${mY + 1.6} 91 ${mY} Z`, { fill: shade(o.lip, 0.1), stroke: shade(o.lip, 0.28), 'stroke-width': '0.6', 'stroke-linejoin': 'round' }));
    add(P(`M92 ${mY + 0.6} Q100 ${mY + 2.2} 108 ${mY + 0.6} Q104.5 ${mY + 7.4} 100 ${mY + 7.4} Q95.5 ${mY + 7.4} 92 ${mY + 0.6} Z`, { fill: o.lip, stroke: shade(o.lip, 0.28), 'stroke-width': '0.6', 'stroke-linejoin': 'round' }));
    add(E(100, mY + 4, 2.6, 1, { fill: '#FFFFFF', opacity: '0.5' }));
    add(P(`M91 ${mY} Q89.6 ${mY - 0.6} 89.2 ${mY - 2}`, { fill: 'none', stroke: skinInk, 'stroke-width': '0.8', 'stroke-linecap': 'round' }));
    add(P(`M109 ${mY} Q110.4 ${mY - 0.6} 110.8 ${mY - 2}`, { fill: 'none', stroke: skinInk, 'stroke-width': '0.8', 'stroke-linecap': 'round' }));
    // 前髪（流した前髪・つやのすじ）
    const frontG = G(NARROW);
    add(frontG);
    frontG.append(P(HAIR_FRONT[o.hairStyle] || HAIR_FRONT.mid, { fill: hair, stroke: hairInk, 'stroke-width': '0.9', 'stroke-linejoin': 'round' }));
    const gloss = { fill: 'none', stroke: tint(hair, 0.42), 'stroke-width': '2.2', 'stroke-linecap': 'round', opacity: '0.6' };
    frontG.append(P('M64 44 Q100 24 138 44', gloss));
    const strand = { fill: 'none', stroke: hairInk, 'stroke-width': '0.7', 'stroke-linecap': 'round', opacity: '0.55' };
    frontG.append(P('M78 76 Q70 58 76 38', strand));
    frontG.append(P('M92 82 Q86 56 96 30', strand));
    frontG.append(P('M122 80 Q130 60 124 36', strand));
    if (o.hairStyle !== 'updo' && o.hairStyle !== 'short') {
      frontG.append(P('M44 130 Q40 160 46 184', strand));
      frontG.append(P('M156 130 Q160 160 154 184', strand));
    }
    // ピアス
    if (o.metal) for (const sd of [-1, 1]) {
      add(P(`M${100 + sd * (hw - 1)} ${eyeY + 22} L${100 + sd * (hw - 1)} ${eyeY + 27}`, { fill: 'none', stroke: o.metal, 'stroke-width': '0.8' }));
      add(C(100 + sd * (hw - 1), eyeY + 30, 3.2, { fill: o.metal, stroke: shade(o.metal, 0.3), 'stroke-width': '0.7' }));
    }
    return root;
  }

  /* ---------- 骨格の体型（3つ並べて見せる） ---------- */
  // 左半分の輪郭を点で決め、なめらかな線でつなぐ。数字は中心(60)からの幅
  const BODY = {
    straight: { sw: 22, bust: 20, waist: 14, hip: 21, hipY: 124, knee: 10, ankle: 5.5, thick: true },
    wave: { sw: 18, bust: 15, waist: 11, hip: 20, hipY: 130, knee: 9, ankle: 5, thick: false },
    natural: { sw: 25, bust: 17, waist: 14, hip: 18, hipY: 124, knee: 10, ankle: 6, thick: false, frame: true }
  };
  function smoothPath(pts) {
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]} ${p2[1]}`;
    }
    return d;
  }
  function body(kind, tone, on) {
    const b = BODY[kind] || BODY.straight;
    const root = svg('svg', { viewBox: '0 0 120 262', 'aria-hidden': 'true', focusable: 'false' });
    const fill = on ? tint(tone, 0.1) : tint(tone, 0.6);
    const ink = on ? shade(tone, 0.45) : shade(tone, 0.2);
    const st = { fill, stroke: ink, 'stroke-width': on ? '1.4' : '1', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
    const half = `${smoothPath([[57, 30], [57.5, 38], [60 - b.sw, 44], [60 - b.bust, 66], [60 - b.waist, 92], [60 - b.hip, b.hipY], [60 - b.hip + 3, 156], [60 - b.knee, 190], [60 - b.ankle, 240], [60 - b.ankle - 0.5, 254]])} L58.5 254 L58 205 L58 165 L60 138 L60 30 Z`;
    // うで（太い線を2本かさねて、ふちどりつきの腕にする）
    const armL = `M${60 - b.sw + 1.5} 46 C${60 - b.sw - 5} 70 ${60 - b.sw - 7} 100 ${60 - b.sw - 8} 134`;
    const lw = b.thick ? 7.4 : 6;
    for (const m of [false, true]) {
      const wrap = (n) => (m ? mirror(n) : n);
      root.append(wrap(P(armL, { fill: 'none', stroke: ink, 'stroke-width': lw + 1.6, 'stroke-linecap': 'round' })));
      root.append(wrap(P(armL, { fill: 'none', stroke: fill, 'stroke-width': lw, 'stroke-linecap': 'round' })));
    }
    root.append(P('M55 26 L55 36 L65 36 L65 26 Z', st));
    root.append(P(half, st), mirror(P(half, st)));
    root.append(C(60, 16, 11.5, st));
    root.append(P(`M${60 - b.waist} 92 Q60 95 ${60 + b.waist} 92`, { fill: 'none', stroke: ink, 'stroke-width': '0.7', opacity: '0.7', 'stroke-dasharray': '2 2' }));
    root.append(P(`M${60 - b.hip} ${b.hipY} Q60 ${b.hipY + 3} ${60 + b.hip} ${b.hipY}`, { fill: 'none', stroke: ink, 'stroke-width': '0.7', opacity: '0.7', 'stroke-dasharray': '2 2' }));
    if (b.frame) for (const [x, y] of [[60 - b.sw + 1, 44], [60 + b.sw - 1, 44], [60 - b.sw - 8, 134], [60 + b.sw + 8, 134], [60 - b.knee + 3, 190], [60 + b.knee - 3, 190]]) root.append(C(x, y, 2.6, { fill: shade(fill, 0.12), stroke: ink, 'stroke-width': '0.7' }));
    if (b.thick) for (const y of [64, 78]) root.append(P(`M${60 - 9} ${y} Q60 ${y + 3} ${60 + 9} ${y}`, { fill: 'none', stroke: ink, 'stroke-width': '0.7', opacity: '0.55' }));
    return root;
  }

  /* ---------- 素材・柄の見本（ベタ塗り＋細い線だけ） ---------- */
  function fabric(kind, color) {
    const id = `fb${uid++}`;
    const root = svg('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true', focusable: 'false' });
    root.append(svg('defs', null, svg('clipPath', { id }, svg('rect', { x: 1, y: 1, width: 62, height: 62, rx: 4 }))));
    const dk = shade(color, 0.22);
    const lt = tint(color, 0.45);
    const g = svg('g', { 'clip-path': `url(#${id})` }, svg('rect', { x: 0, y: 0, width: 64, height: 64, fill: color }));
    const ln = (d, c, w, op) => g.append(P(d, { fill: 'none', stroke: c, 'stroke-width': w || 1, opacity: op || 1 }));
    const rep = (n, f) => { for (let i = 0; i < n; i++) f(i); };
    switch (kind) {
      case 'knit': rep(12, (i) => ln(`M${3 + i * 5.4} 0 L${3 + i * 5.4} 64`, dk, 1.6, 0.45)); rep(12, (i) => ln(`M${3 + i * 5.4 + 2.7} 0 L${3 + i * 5.4 + 2.7} 64`, lt, 1.2, 0.6)); break;
      case 'twill': rep(14, (i) => ln(`M${-10 + i * 7} 70 L${i * 7 + 20} 0`, dk, 1.2, 0.4)); break;
      case 'denim': rep(18, (i) => ln(`M${-14 + i * 5} 70 L${i * 5 + 20} 0`, dk, 1, 0.5)); rep(8, (i) => ln(`M0 ${i * 9} L64 ${i * 9}`, lt, 0.5, 0.4)); break;
      case 'sheer': rep(8, (i) => rep(8, (j) => g.append(C(4 + i * 8 + (j % 2) * 4, 4 + j * 8, 1.2, { fill: lt, opacity: 0.8 })))); g.append(svg('rect', { x: 0, y: 0, width: 64, height: 64, fill: '#FFFFFF', opacity: 0.35 })); break;
      case 'leather': g.append(P('M8 56 Q22 20 52 8', { fill: 'none', stroke: lt, 'stroke-width': 3, opacity: 0.7, 'stroke-linecap': 'round' })); g.append(P('M16 60 Q30 34 58 22', { fill: 'none', stroke: lt, 'stroke-width': 1.5, opacity: 0.5, 'stroke-linecap': 'round' })); break;
      case 'linen': rep(16, (i) => ln(`M0 ${i * 4 + 2} L64 ${i * 4 + 2}`, dk, 0.7, 0.4)); rep(16, (i) => ln(`M${i * 4 + 2} 0 L${i * 4 + 2} 64`, lt, 0.7, 0.6)); break;
      case 'tweed': rep(10, (i) => rep(10, (j) => g.append(C(3 + i * 6.4 + ((i * 7 + j * 3) % 4), 3 + j * 6.4 + ((i * 3 + j * 5) % 4), 1.1, { fill: (i + j) % 2 ? dk : lt, opacity: 0.8 })))); break;
      case 'check-l': rep(4, (i) => { g.append(svg('rect', { x: 0, y: 8 + i * 16, width: 64, height: 6, fill: dk, opacity: 0.35 })); g.append(svg('rect', { x: 8 + i * 16, y: 0, width: 6, height: 64, fill: dk, opacity: 0.35 })); }); break;
      case 'check-s': rep(8, (i) => { g.append(svg('rect', { x: 0, y: 3 + i * 8, width: 64, height: 3, fill: dk, opacity: 0.35 })); g.append(svg('rect', { x: 3 + i * 8, y: 0, width: 3, height: 64, fill: dk, opacity: 0.35 })); }); break;
      case 'stripe-l': rep(5, (i) => g.append(svg('rect', { x: 4 + i * 14, y: 0, width: 7, height: 64, fill: lt, opacity: 0.85 }))); break;
      case 'stripe-s': rep(11, (i) => g.append(svg('rect', { x: 3 + i * 6, y: 0, width: 2, height: 64, fill: lt, opacity: 0.9 }))); break;
      case 'border': rep(5, (i) => g.append(svg('rect', { x: 0, y: 4 + i * 13, width: 64, height: 6, fill: lt, opacity: 0.85 }))); break;
      case 'dot-l': rep(4, (i) => rep(4, (j) => g.append(C(8 + i * 16 + (j % 2) * 8, 8 + j * 16, 4, { fill: lt })))); break;
      case 'dot-s': rep(8, (i) => rep(8, (j) => g.append(C(4 + i * 8 + (j % 2) * 4, 4 + j * 8, 1.7, { fill: lt })))); break;
      case 'floral-s': rep(4, (i) => rep(4, (j) => { const x = 8 + i * 16 + (j % 2) * 8; const y = 8 + j * 16; for (let k = 0; k < 5; k++) g.append(C(x + 2.6 * Math.cos(k * 1.2566), y + 2.6 * Math.sin(k * 1.2566), 1.5, { fill: lt })); g.append(C(x, y, 1, { fill: dk })); })); break;
      case 'floral-l': rep(2, (i) => rep(2, (j) => { const x = 16 + i * 32 + (j % 2) * 8; const y = 16 + j * 32; for (let k = 0; k < 5; k++) g.append(C(x + 6 * Math.cos(k * 1.2566), y + 6 * Math.sin(k * 1.2566), 3.8, { fill: lt })); g.append(C(x, y, 2.4, { fill: dk })); g.append(P(`M${x} ${y + 7} Q${x + 6} ${y + 14} ${x + 12} ${y + 12}`, { fill: 'none', stroke: dk, 'stroke-width': 1 })); })); break;
      case 'geo': rep(4, (i) => rep(4, (j) => g.append(P(`M${i * 16 + 8} ${j * 16 + 2} L${i * 16 + 14} ${j * 16 + 14} L${i * 16 + 2} ${j * 16 + 14} Z`, { fill: (i + j) % 2 ? lt : dk, opacity: 0.6 })))); break;
      default: g.append(P('M6 58 L58 6', { fill: 'none', stroke: lt, 'stroke-width': 1, opacity: 0.35 }));
    }
    root.append(g, svg('rect', { x: 1, y: 1, width: 62, height: 62, rx: 4, fill: 'none', stroke: inkOf(color), 'stroke-width': 1 }));
    return root;
  }

  DS.illust = { face, outfit, thumb, body, fabric, shade, tint, lum, setStyle: (m) => { STYLE.mode = m; } };
})();
