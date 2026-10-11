/* 入力の画面: イラストを選ぶ（顔・洋服）
   タイプを選ぶと絵は自動でできる（おまかせ）。ここでは、変えたい所だけ絵や色を押して選び直す */
window.DS = window.DS || {};
DS.views = DS.views || {};
(function () {
  const V = (DS.views.look = {});
  const { h, icon } = DS.util;
  const S = DS.state;
  const L = DS.data.look;

  const FACE_ROWS = [['hair', '髪の色'], ['eye', 'アイシャドウ'], ['cheek', 'チーク'], ['lip', 'リップ'], ['nail', 'ネイル'], ['metal', 'アクセサリーの金属']];
  const SLOTS = { pants: ['outer', 'top', 'pants', 'bag', 'shoes'], skirt: ['outer', 'top', 'skirt', 'bag', 'shoes'], dress: ['outer', 'dress', 'bag', 'shoes'] };
  const changed = () => DS.views.input.changed();
  function refocus(key) {
    const el = document.querySelector(`#in-look [data-k="${key}"]`);
    if (el) el.focus({ preventScroll: true });
  }

  const resetBtn = (text, label, onClick) => h('button', { type: 'button', class: 'btn-link', 'aria-label': label, onclick: onClick }, text);

  /* 色を1つ選ぶ（選択中は太い枠・印・太字） */
  function swatchRow(list, current, onPick, keyPrefix) {
    return h('div', { class: 'pal pal-sm' }, list.map(([n, hex]) => {
      const on = n === current;
      return h('button', { type: 'button', class: 'sw', 'aria-pressed': String(on), 'data-k': `${keyPrefix}:${n}`, onclick: () => { onPick(n); changed(); refocus(`${keyPrefix}:${n}`); } },
        h('span', { class: 'c', bg: hex }, h('span', { class: 'mark' }, icon('check'))),
        h('span', { class: 'nm', text: n }));
    }));
  }

  /* 絵のタイル（絵＋名前。選択中は太い枠・印・太字） */
  function tile(svg, label, on, key, onPick) {
    return h('button', { type: 'button', class: 'tile', 'aria-pressed': String(on), 'data-k': key, onclick: () => { onPick(); changed(); refocus(key); } },
      on ? icon('check') : null, svg, h('span', { class: 'tl', text: label }));
  }

  /* ---------- 顔 ---------- */
  function faceBlock(look) {
    const f = look.face;
    const lf = S.look.face;
    const rows = FACE_ROWS.map(([key, label]) => h('div', { class: 'look-row' },
      h('h4', null, h('span', { text: label }), f.over[key] ? resetBtn('おまかせに戻す', `${label}をおまかせに戻す`, () => { delete lf[key]; changed(); refocus(`face-${key}`); }) : h('span', { class: 'count', text: 'おまかせ' })),
      swatchRow(look.opts[key], f[key][0], (n) => { lf[key] = n; }, `face-${key}`)));
    return h('div', null,
      h('h3', null, h('span', { text: '顔（髪型・メイク）' })),
      h('p', { class: 'hint', text: '顔の形は、顔タイプ診断の位置から決まります。髪の色・メイクの色は、パーソナルカラーのタイプの候補から選べます。' }),
      h('div', { class: 'look-prev' }, DS.look.faceSvg(look, '選んでいる髪型と色で描いた顔の絵')),
      h('div', { class: 'look-row' },
        h('h4', null, h('span', { text: '髪型' }), f.over.hairStyle ? resetBtn('おまかせに戻す', '髪型をおまかせに戻す', () => { delete lf.hairStyle; changed(); refocus('hairStyle'); }) : h('span', { class: 'count', text: 'おまかせ' })),
        h('div', { class: 'tiles tiles-5' }, L.hairStyles.map((x) => tile(DS.look.faceSvgWith(look, { hairStyle: x.id, metal: null }), x.label, x.id === f.hairStyle.id, `hairStyle-${x.id}`, () => { lf.hairStyle = x.id; })))),
      rows);
  }

  /* ---------- 洋服 ---------- */
  function slotBlock(look, c, slot) {
    const cs = S.look.coords[c.index];
    const key = slot === 'pants' || slot === 'skirt' || slot === 'dress' ? 'bottom' : slot;
    const part = key === 'bottom' ? c.bottom : c[key];
    const curShape = part ? part.shape : 'none';
    const over = c.over[key];
    const colorOf = (id) => (key === 'outer' ? (part ? part.color : '#B9B4AE') : part.color);
    const innerColor = c.top ? c.top.color : c.bottom.color;
    const tiles = L.shapes[slot].map(([id, label]) => tile(DS.illust.thumb(slot, id, colorOf(id), innerColor), label, id === curShape, `c${c.index}-${slot}-${id}`, () => { cs.shape[slot] = id; }));
    if (slot === 'outer') tiles.unshift(h('button', { type: 'button', class: 'tile tile-text', 'aria-pressed': String(!part), 'data-k': `c${c.index}-outer-none`, onclick: () => { cs.shape.outer = 'none'; changed(); refocus(`c${c.index}-outer-none`); } },
      !part ? icon('check') : null, h('span', { class: 'tl', text: '着ない' })));

    const openKey = `${c.index}:${key}`;
    const open = S.ui.lookColorOpen === openKey;
    const colorBox = part ? h('div', { class: 'look-color' },
      h('button', { type: 'button', class: 'btn btn-color', 'aria-expanded': String(open), 'data-k': `c${c.index}-${key}-open`, onclick: () => { S.ui.lookColorOpen = open ? null : openKey; V.render(); refocus(`c${c.index}-${key}-open`); } },
        h('i', { class: 'pdot', bg: part.color, 'aria-hidden': 'true' }), h('span', { text: `色：${part.colorName}` }), icon(open ? 'chevronLeft' : 'chevronRight')),
      open ? swatchRow(look.candidates, part.colorName, (n) => { cs.color[key] = n; }, `c${c.index}-${key}`) : null) : null;

    return h('div', { class: 'look-row' },
      h('h4', null, h('span', { text: L.slotLabel[slot] }),
        over ? resetBtn('おまかせに戻す', `${L.slotLabel[slot]}をおまかせに戻す`, () => { delete cs.shape[slot]; delete cs.color[key]; changed(); refocus(`c${c.index}-${slot}-open`); }) : h('span', { class: 'count', text: 'おまかせ' })),
      h('div', { class: 'tiles' }, tiles), colorBox);
  }

  function clothesBlock(look) {
    const idx = S.ui.lookCoord;
    const c = look.coords[idx];
    const cs = S.look.coords[idx];
    const tabs = DS.views.input.seg(look.coords.map((x) => ({ id: x.index, label: `コーデ${x.index + 1}`, sub: x.title })), idx,
      (id) => { S.ui.lookCoord = id; S.ui.lookColorOpen = null; V.render(); refocus(`coord-${id}`); }, 'seg-3', 'コーデの切りかえ');
    tabs.querySelectorAll('.seg-btn').forEach((b, i) => b.setAttribute('data-k', `coord-${i}`));
    const styleSeg = h('div', { class: 'seg seg-3', role: 'group', 'aria-label': 'コーデのスタイル' }, L.styles.map((st) => {
      const on = st.id === c.style;
      return h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(on), 'data-k': `c${idx}-style-${st.id}`, onclick: () => { cs.style = st.id === L.defaultStyles[idx] ? null : st.id; S.ui.lookColorOpen = null; changed(); refocus(`c${idx}-style-${st.id}`); } },
        on ? icon('check') : null, h('span', { text: st.label }));
    }));
    return h('div', null,
      h('h3', null, h('span', { text: '洋服（コーデ3つ）' })),
      h('p', { class: 'hint', text: '形は骨格のタイプ、色はパーソナルカラーのタイプから決まります。コーデを選んで、変えたい服の絵を押してください。' }),
      tabs,
      h('div', { class: 'look-prev look-prev-outfit' }, DS.illust.outfit(c, `コーデ${idx + 1}の絵`)),
      h('div', { class: 'look-row' }, h('h4', null, h('span', { text: 'スタイル' }), c.over.style ? resetBtn('おまかせに戻す', 'スタイルをおまかせに戻す', () => { cs.style = null; changed(); refocus(`c${idx}-style-${L.defaultStyles[idx]}`); }) : h('span', { class: 'count', text: 'おまかせ' })), styleSeg),
      SLOTS[c.style].map((slot) => slotBlock(look, c, slot)));
  }

  /* ---------- 全体 ---------- */
  V.render = function () {
    const wrap = document.getElementById('in-look-wrap');
    if (!wrap) return;
    const look = DS.look.resolve();
    const n = DS.look.changeCount();
    wrap.replaceChildren(h('section', { class: 'in-sec', id: 'in-look' },
      h('h2', null, h('span', { text: 'イラストを選ぶ' }), h('span', { class: 'count', text: n ? `選び直した所 ${n}か所` : 'すべておまかせ' })),
      h('p', { class: 'hint', text: 'タイプを選ぶと、シートの顔と洋服の絵は自動でできます。変えたい所だけ、絵や色を押して選び直せます。' }),
      n ? h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn', onclick: () => {
        if (!window.confirm(`選び直した${n}か所を、すべてタイプからのおまかせに戻しますか？`)) return;
        S.look = DS.look.empty(); S.ui.lookColorOpen = null; changed();
      } }, 'すべておまかせに戻す')) : null,
      faceBlock(look), clothesBlock(look)));
  };
})();
