/* イラストシートの「おまかせ」: 診断のタイプから、顔と洋服の絵を自動で決める
   S.look には「診断士が選び直した所」だけを入れる。入っていない所は、そのつどタイプから決める（タイプを変えると、おまかせの所は追いかけて変わる） */
window.DS = window.DS || {};
(function () {
  const S = DS.state;
  const Q = DS.q;
  const L = DS.data.look;
  const lum = (hex) => DS.illust.lum(hex);

  const emptyCoord = () => ({ style: null, shape: {}, color: {} });
  const empty = () => ({ face: {}, coords: [emptyCoord(), emptyCoord(), emptyCoord()] });
  S.look = empty();

  const uniq = (list) => { const seen = new Set(); return list.filter((c) => (seen.has(c[0]) ? false : seen.add(c[0]))); };
  const pick = (list, name) => list.find((c) => c[0] === name) || list[0];

  /* 顔まわりの候補（髪・アイシャドウ・チーク・リップ・ネイル・金属） */
  function faceOptions(s) {
    const N = L.neutral;
    if (!s) return { hair: N.hair, eye: N.eye, cheek: N.cheek, lip: N.lip, nail: N.nail, metal: N.metal };
    const mk = L.makeup[s.id] || {};
    return { hair: s.face.hair, eye: mk.eye || N.eye, cheek: s.face.cheek, lip: s.face.lip, nail: mk.nail || N.nail, metal: s.face.metal };
  }

  /* 色の役わり: 基本の色（ベージュ・白・紺・グレーなど）と、アクセントの色 */
  function roles(s) {
    if (!s) return { basics: L.neutral.basics, accents: L.neutral.accents, bestAll: [] };
    const best = Q.bestList();
    const bestNames = new Set(best.map((c) => c[0]));
    const isBasic = (g) => /茶|白|グレー/.test(g.name);
    const basicsAll = s.groups.filter(isBasic).flatMap((g) => g.colors);
    const accentsAll = s.groups.filter((g) => !isBasic(g)).flatMap((g) => g.colors);
    const prefer = (all) => { const hit = all.filter((c) => bestNames.has(c[0])); return hit.length >= 3 ? hit : all; };
    const byLight = (list) => [...list].sort((a, b) => lum(b[1]) - lum(a[1]));
    return { basics: byLight(prefer(basicsAll)), accents: prefer(accentsAll), basicsAll, bestAll: best };
  }
  const spread = (list, n) => [0, 1, 2].map((i) => list[Math.floor((list.length * i) / 3) % list.length] || list[0]).slice(0, n);

  /* 色をえらぶときの候補 */
  function colorCandidates(s) {
    if (!s) return uniq([...L.neutral.basics, ...L.neutral.accents]);
    const r = roles(s);
    return uniq(r.bestAll.length ? [...r.bestAll, ...r.basicsAll] : Q.palette(s));
  }

  /* 顔の形（顔タイプ診断の位置から。曲線ほど丸く、大人顔ほど面長に） */
  function profile(f) {
    if (!f) return { round: 0.5, adult: 0.5 };
    const pos = Q.posOf(f);
    return { round: 1 - Math.min(100, Math.max(0, pos.x)) / 100, adult: Math.min(100, Math.max(0, pos.y)) / 100 };
  }

  /* ---------- 全部をまとめて決める ---------- */
  function resolve() {
    const s = Q.season();
    const k = Q.kk();
    const f = Q.face();
    const lk = S.look;
    const prof = profile(f);
    const opts = faceOptions(s);
    const rl = roles(s);
    const acc = spread(rl.accents, 3);
    // 基本の色から、明るさが目標にいちばん近いものを選ぶ（明るい＝アイボリー系、中間＝キャメル系、暗い＝ネイビー・チャコール系）
    const near = (target) => rl.basics.reduce((a, b) => (Math.abs(lum(b[1]) - target) < Math.abs(lum(a[1]) - target) ? b : a));
    const light = rl.basics[0];
    const dark = near(0.28);
    const mid = near(0.55);
    const curvy = f ? Q.posOf(f).x < 40 : false;

    /* 顔 */
    const hairStyleId = lk.face.hairStyle || (f && L.faceHair[f.id]) || 'mid';
    const face = {
      hairStyle: L.hairStyles.find((x) => x.id === hairStyleId) || L.hairStyles[2],
      hair: pick(opts.hair, lk.face.hair), eye: pick(opts.eye, lk.face.eye), cheek: pick(opts.cheek, lk.face.cheek),
      lip: pick(opts.lip, lk.face.lip), nail: pick(opts.nail, lk.face.nail), metal: pick(opts.metal, lk.face.metal),
      over: { hairStyle: Boolean(lk.face.hairStyle), hair: Boolean(lk.face.hair), eye: Boolean(lk.face.eye), cheek: Boolean(lk.face.cheek), lip: Boolean(lk.face.lip), nail: Boolean(lk.face.nail), metal: Boolean(lk.face.metal) }
    };

    /* 洋服 */
    const byK = L.byKokkaku[k ? k.id : L.fallbackKokkaku] || L.byKokkaku[L.fallbackKokkaku];
    const autoColor = [
      { top: acc[0], bottom: mid, outer: null, bag: acc[1], shoes: dark },
      { top: light, bottom: acc[1], outer: mid, bag: dark, shoes: mid },
      { top: null, bottom: acc[2], outer: dark, bag: acc[0], shoes: mid }
    ];
    // 同じ色が続いて見分けにくくならないよう、となり合う服は別の色にする
    const pool = [light, mid, dark, acc[0], acc[1], acc[2]];
    const differ = (cur, others) => (others.some((o) => o && o[0] === cur[0]) ? pool.find((c) => !others.some((o) => o && o[0] === c[0])) || cur : cur);
    for (const c of autoColor) {
      if (c.top) c.top = differ(c.top, [c.bottom]);
      if (c.outer) c.outer = differ(c.outer, [c.bottom, c.top]);
      c.shoes = differ(c.shoes, [c.bag]);
    }
    const cands = colorCandidates(s);
    const colorOf = (i, slot) => {
      const name = lk.coords[i].color[slot];
      const hit = name && uniq([...cands, ...rl.basicsAll || [], ...rl.accents, ...rl.basics]).find((c) => c[0] === name);
      return hit || autoColor[i][slot] || mid;
    };
    const shapeName = (slot, id) => (L.shapes[slot].find((x) => x[0] === id) || [id, id])[1];

    const coords = [0, 1, 2].map((i) => {
      const cs = lk.coords[i];
      const style = cs.style || L.defaultStyles[i];
      const styleDef = L.styles.find((x) => x.id === style);
      const autoTop = (i === 1 && curvy && byK.top[1] !== 'turtle') ? 'roundcollar' : byK.top[i];
      const autoShape = {
        outer: byK.outer[i] || 'none', top: autoTop, pants: byK.pants, skirt: byK.skirt, dress: byK.dress, bag: byK.bag[i], shoes: byK.shoes[i]
      };
      const shape = (slot) => cs.shape[slot] || autoShape[slot];
      const over = (slot) => Boolean(cs.shape[slot]) || Boolean(cs.color[slot === 'pants' || slot === 'skirt' || slot === 'dress' ? 'bottom' : slot]);
      const bottomSlot = style === 'pants' ? 'pants' : style === 'skirt' ? 'skirt' : 'dress';
      const outerId = shape('outer');
      const c = {
        index: i, style, title: styleDef.title, bottomSlot,
        outer: outerId === 'none' ? null : { shape: outerId, color: colorOf(i, 'outer')[1], colorName: colorOf(i, 'outer')[0] },
        top: style === 'dress' ? null : { shape: shape('top'), color: colorOf(i, 'top')[1], colorName: colorOf(i, 'top')[0] },
        bottom: { shape: shape(bottomSlot), color: colorOf(i, 'bottom')[1], colorName: colorOf(i, 'bottom')[0] },
        bag: { shape: shape('bag'), color: colorOf(i, 'bag')[1], colorName: colorOf(i, 'bag')[0] },
        shoes: { shape: shape('shoes'), color: colorOf(i, 'shoes')[1], colorName: colorOf(i, 'shoes')[0] }
      };
      c.over = { style: Boolean(cs.style), outer: over('outer'), top: over('top'), bottom: over(bottomSlot), bag: over('bag'), shoes: over('shoes') };
      c.parts = [
        c.outer ? { slot: 'outer', label: 'アウター', shape: shapeName('outer', c.outer.shape), color: [c.outer.colorName, c.outer.color] } : null,
        c.top ? { slot: 'top', label: 'トップス', shape: shapeName('top', c.top.shape), color: [c.top.colorName, c.top.color] } : null,
        { slot: bottomSlot, label: L.slotLabel[bottomSlot], shape: shapeName(bottomSlot, c.bottom.shape), color: [c.bottom.colorName, c.bottom.color] },
        { slot: 'bag', label: 'バッグ', shape: shapeName('bag', c.bag.shape), color: [c.bag.colorName, c.bag.color] },
        { slot: 'shoes', label: 'くつ', shape: shapeName('shoes', c.shoes.shape), color: [c.shoes.colorName, c.shoes.color] }
      ].filter(Boolean);
      return c;
    });

    const warm = s ? s.scales.temp < 50 : true;
    return {
      face, opts, prof, skin: warm ? L.skin.warm : L.skin.cool,
      drape: coords[0].top ? [coords[0].top.colorName, coords[0].top.color] : acc[0],
      coords, candidates: cands, basics: rl.basics, accents: rl.accents, pool: [acc[0], mid, acc[1], dark, acc[2], light]
    };
  }

  /* 顔の絵を、いま選んでいる髪型・色で描く（patch で一部だけ変えられる） */
  function faceSvgWith(look, patch) {
    const f = look.face;
    return DS.illust.face(Object.assign({
      hairStyle: f.hairStyle.id, hair: f.hair[1], eye: f.eye[1], cheek: f.cheek[1], lip: f.lip[1], metal: f.metal[1],
      drape: look.drape[1], skin: look.skin, round: look.prof.round, adult: look.prof.adult
    }, patch));
  }
  const faceSvg = (look, label) => faceSvgWith(look, { label });

  /* 診断士が選び直した数 */
  function changeCount() {
    const lk = S.look;
    let n = Object.keys(lk.face).length;
    for (const c of lk.coords) n += (c.style ? 1 : 0) + Object.keys(c.shape).length + Object.keys(c.color).length;
    return n;
  }

  DS.look = { empty, resolve, faceSvg, faceSvgWith, changeCount, colorCandidates, roles };
})();
