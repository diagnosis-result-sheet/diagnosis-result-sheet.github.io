/* 入力の画面（診断士が使う） */
window.DS = window.DS || {};
DS.views = DS.views || {};
(function () {
  const V = (DS.views.input = {});
  const { h, icon } = DS.util;
  const S = DS.state;
  const Q = DS.q;

  // 入力を変えたら印をつける（見本の切りかえで消える前に確かめるため。D-50）
  V.changed = () => { S.dirty = true; DS.app.changed(); };
  const same = (a, b) => Object.keys(b).every((k) => a[k] === b[k]);

  /* ---------- 部品 ---------- */
  // ひとつだけ選ぶ（選択中は太い枠・印・太字）
  V.seg = function (items, current, onPick, cls, label) {
    const wrap = h('div', { class: `seg ${cls || ''}`, role: 'group', 'aria-label': label });
    for (const it of items) {
      const on = it.id === current;
      wrap.append(h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(on), onclick: () => onPick(it.id) },
        on ? icon('check') : null,
        h('span', null, it.label, it.sub ? h('small', { text: it.sub }) : null)));
    }
    return wrap;
  };
  function toggler(btn, onToggle) {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(next));
      onToggle(next);
    });
    return btn;
  }
  V.chip = (label, on, onToggle) =>
    toggler(h('button', { type: 'button', class: 'chip', 'aria-pressed': String(on) }, icon('check'), h('span', { text: label })), onToggle);
  V.checkrow = (text, sub, on, onToggle) =>
    toggler(h('button', { type: 'button', class: 'checkrow', 'aria-pressed': String(on) },
      h('span', { class: 'box' }, icon('check')),
      h('span', { class: 'txt' }, text, sub ? h('small', { text: sub }) : null)), onToggle);
  V.swatch = (name, hex, on, onToggle) =>
    toggler(h('button', { type: 'button', class: 'sw', 'aria-pressed': String(on) },
      h('span', { class: 'c', bg: hex }, h('span', { class: 'mark' }, icon('check'))),
      h('span', { class: 'nm', text: name })), onToggle);
  V.count = (key) => h('span', { class: 'count', 'data-count': key });
  V.empty = (text) => h('p', { class: 'empty', text });

  // 書き足す欄（空・同じものがあるときは、何がだめでどうすればよいかを出す。D-53）
  V.addRow = function (placeholder, labelText, onAdd) {
    const id = DS.util.uid('add');
    const input = h('input', { class: 'input', id, type: 'text', maxlength: '40', placeholder, autocomplete: 'off' });
    const err = h('p', { class: 'err', role: 'alert' });
    const submit = () => {
      const v = input.value.trim();
      if (!v) { err.textContent = '書き足す言葉を入れてから、［足す］を押してください。'; input.focus(); return; }
      const msg = onAdd(v);
      if (msg) { err.textContent = msg; input.focus(); }
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); submit(); } });
    input.addEventListener('input', () => { err.textContent = ''; });
    return h('div', { class: 'add' },
      h('label', { class: 'visually-hidden', for: id, text: labelText }),
      h('div', { class: 'add-row' }, input, h('button', { type: 'button', class: 'btn', onclick: submit }, icon('plus'), '足す')),
      err);
  };

  function focusSelected(secId) {
    const b = document.querySelector(`#${secId} .seg-btn[aria-pressed="true"]`);
    if (b) b.focus({ preventScroll: true });
  }

  /* ---------- 画面全体 ---------- */
  V.render = function () {
    const pane = document.getElementById('pane-input');
    pane.replaceChildren(
      V.head(),
      V.diagSec(),
      h('div', { id: 'in-pc-wrap' }),
      h('div', { id: 'in-kk-wrap' }),
      h('div', { id: 'in-face-wrap' }),
      h('div', { id: 'in-custom-wrap' }),
      h('div', { id: 'in-checks-wrap' }),
      V.memoSec(),
      h('button', { type: 'button', class: 'btn btn-primary btn-block go-sheet only-sp', onclick: () => DS.app.go('sheet') }, 'シートを見る', icon('arrowRight'))
    );
    V.renderPc(); V.renderStyle('kk'); V.renderStyle('face'); V.renderCustom(); V.renderChecks();
    V.refreshCounts();
  };
  V.renderPc = () => document.getElementById('in-pc-wrap').replaceChildren(S.use.pc ? V.pcSec() : '');
  V.renderStyle = (key) => document.getElementById(`in-${key}-wrap`).replaceChildren(S.use[key] ? V.styleSec(key) : '');
  V.renderCustom = () => document.getElementById('in-custom-wrap').replaceChildren(...S.custom.filter((c) => c.use).map(V.customSec));
  V.renderChecks = () => document.getElementById('in-checks-wrap').replaceChildren(V.checksSec());

  V.head = function () {
    const sel = h('select', { class: 'select', id: 'in-sample' });
    for (const smp of DS.data.samples) sel.append(h('option', { value: smp.id, text: smp.label }));
    sel.value = S.sampleId;
    sel.addEventListener('change', () => {
      const edited = S.dirty || Object.values(S.msg.edited).some((v) => v !== null);
      if (edited && !window.confirm('いま入力した内容（呼び名・選んだ色や候補・ひと言メモ・直した送る文）は消えて、見本のお客様に切りかわります。切りかえますか？')) {
        sel.value = S.sampleId;
        return;
      }
      Q.loadSample(sel.value);
      DS.app.renderAll();
      document.getElementById('in-sample').focus();
      DS.util.toast(sel.value === 'blank' ? '空にしました。上から選んでいくと、シートができます。' : '見本のお客様を切りかえました');
    });
    const name = h('input', { class: 'input', id: 'in-name', type: 'text', value: S.client.name, maxlength: '20', autocomplete: 'off', placeholder: 'みなみ' });
    name.addEventListener('input', () => { S.client.name = name.value; V.changed(); });
    const date = h('input', { class: 'input', id: 'in-date', type: 'date', value: S.client.date });
    date.addEventListener('input', () => { S.client.date = date.value; V.changed(); });
    return h('div', null,
      h('div', { class: 'in-head' },
        h('h1', { class: 'screen-title' }, '結果を入力'),
        h('div', { class: 'field' }, h('label', { for: 'in-sample', class: 'label', text: '見本のお客様を切りかえる' }), sel)),
      h('div', { class: 'grid-2' },
        h('div', { class: 'field' }, h('label', { for: 'in-name', class: 'label', text: 'お客様の呼び名' }), h('div', { class: 'input-row' }, name, h('span', { text: '様' }))),
        h('div', { class: 'field' }, h('label', { for: 'in-date', class: 'label', text: '診断日' }), date)),
      h('nav', { class: 'jump', 'aria-label': '入力の中の移動' },
        h('a', { href: '#in-pc' }, S.settings.names.pc), h('a', { href: '#in-kk' }, S.settings.names.kk), h('a', { href: '#in-face' }, S.settings.names.face),
        h('a', { href: '#in-checks' }, '買い物のチェック'), h('a', { href: '#in-memo' }, 'ひと言メモ')));
  };

  V.diagSec = function () {
    const chips = h('div', { class: 'chips' },
      V.chip(S.settings.names.pc, S.use.pc, (on) => { S.use.pc = on; V.renderPc(); V.renderChecks(); V.changed(); }),
      V.chip(S.settings.names.kk, S.use.kk, (on) => { S.use.kk = on; V.renderStyle('kk'); V.renderChecks(); V.changed(); }),
      V.chip(S.settings.names.face, S.use.face, (on) => { S.use.face = on; V.renderStyle('face'); V.renderChecks(); V.changed(); }),
      S.custom.map((c) => V.chip(c.name, c.use, (on) => { c.use = on; V.renderCustom(); V.changed(); })));
    return h('section', { class: 'in-sec', id: 'in-diag' },
      h('h2', null, '診断の種類'),
      h('p', { class: 'hint', text: 'この日に行った診断を選びます。診断の名前や、ほかの診断は［設定］で変えられます。' }),
      chips);
  };

  /* ---------- パーソナルカラー ---------- */
  V.pcSec = function () {
    const t = Q.season();
    const sec = h('section', { class: 'in-sec', id: 'in-pc' },
      h('h2', null, S.settings.names.pc),
      h('p', { class: 'hint', text: 'タイプを選ぶと、そのタイプの色がまとめて出ます。' }),
      V.seg(DS.data.pc.types.map((x) => ({ id: x.id, label: Q.typeName(x), sub: Q.typeName(x) !== x.kana ? x.kana : null })), S.pc.season,
        (id) => { S.pc.season = id; V.renderPc(); V.renderChecks(); V.changed(); focusSelected('in-pc'); }, 'seg-4', `${S.settings.names.pc}のタイプ`));
    if (!t) { sec.append(V.empty('タイプを選ぶと、ここに色の候補が出ます。')); return sec; }

    sec.append(h('div', { class: 'sumbox' },
      h('p', { class: 'catch', text: Q.typeCatch(t) }),
      h('span', { class: 'label', text: '与える印象' }),
      h('div', { class: 'words' }, t.words.map((w) => h('span', { class: 'word', text: w }))),
      h('span', { class: 'label', text: '向いている色' }),
      h('p', { text: t.summary })));

    // 色の特徴（ものさし）
    const sc = Q.scalesOf(t);
    const scales = h('div', { class: 'scales' });
    for (const d of DS.data.pc.scaleDefs) {
      const id = `scale-${d.id}`;
      const says = (v) => (v < 40 ? d.say[0] : v > 60 ? d.say[2] : d.say[1]);
      const input = h('input', { type: 'range', id, min: '0', max: '100', step: '5', value: String(sc[d.id]), 'aria-valuetext': says(sc[d.id]) });
      input.addEventListener('input', () => { sc[d.id] = Number(input.value); input.setAttribute('aria-valuetext', says(sc[d.id])); V.changed(); });
      scales.append(h('div', { class: 'scale-in' },
        h('label', { for: id, text: d.label }), input,
        h('div', { class: 'ends', 'aria-hidden': 'true' }, h('span', { text: d.left }), h('span', { text: d.right }))));
    }
    sec.append(
      h('h3', null, h('span', { text: '色の特徴' }),
        h('button', { type: 'button', class: 'btn-link', onclick: () => {
          if (!same(sc, t.scales) && !window.confirm('動かしたものさしを、タイプの目安に戻しますか？')) return;
          Object.assign(sc, t.scales); V.renderPc(); V.changed();
        } }, 'タイプの目安に戻す')),
      h('p', { class: 'hint', text: 'タイプの目安を入れています。お客様に合わせて動かせます（シートの「色の特徴」に出ます）。' }),
      scales);

    // 特に似合う色（いくつでも）
    const best = Q.setOf(S.pc.best, t.id);
    sec.append(
      h('h3', null, h('span', { text: '特に似合う色' }), V.count('pc-best')),
      h('p', { class: 'hint', text: `${Q.typeName(t)}の色（${Q.palette(t).length}色）から、診断で特に似合った色を押して選びます。いくつでも選べます。選ばなかった色も、シートには「${Q.typeName(t)}の色」としてのります。` }));
    for (const g of t.groups) {
      sec.append(h('div', { class: 'pal-group' }, h('p', { text: g.name }),
        h('div', { class: 'pal' }, g.colors.map(([n, hex]) => V.swatch(n, hex, best.has(n), (on) => { if (on) best.add(n); else best.delete(n); V.changed(); })))));
    }
    sec.append(h('div', { class: 'btn-row mt' },
      h('button', { type: 'button', class: 'btn', onclick: () => {
        if (!best.size) { DS.util.toast('選んでいる色はありません'); return; }
        if (!window.confirm(`選んだ${best.size}色を、すべて外しますか？`)) return;
        best.clear(); V.renderPc(); V.changed();
      } }, '選んだ色をすべて外す')));

    // 苦手になりやすい色
    const worst = Q.setOf(S.pc.worst, t.id);
    sec.append(
      h('h3', null, h('span', { text: '苦手になりやすい色' }), V.count('pc-worst')),
      h('p', { class: 'hint', text: '診断で当てはまった色を押して選びます。選んだ色だけが、シートにのります。' }),
      h('div', { class: 'pal' }, t.worst.map(([n, hex]) => V.swatch(n, hex, worst.has(n), (on) => { if (on) worst.add(n); else worst.delete(n); V.changed(); }))));

    // 色の使い方
    const off = Q.setOf(S.pc.tipsOff, t.id);
    sec.append(
      h('h3', null, h('span', { text: '色の使い方' }), V.count('pc-tips')),
      h('p', { class: 'hint', text: 'シートにのせる項目です。押すと、のせる／のせないが切りかわります。' }),
      h('div', null, t.tips.map(([k, v]) => V.checkrow(k, v, !off.has(k), (on) => { if (on) off.delete(k); else off.add(k); V.changed(); }))),
      V.checkrow('メイク・髪・アクセの色見本', 'リップ・チーク・髪の色・金属の色を、色見本でのせる', S.pc.face, (on) => { S.pc.face = on; V.changed(); }));
    return sec;
  };
})();

/* 入力の画面（続き）: 骨格・足した診断・買い物のチェック・ひと言メモ・数の表示 */
(function () {
  const V = DS.views.input;
  const { h, icon } = DS.util;
  const S = DS.state;
  const Q = DS.q;

  const ADD_EXAMPLE = {
    shape: '例: Hライン', neck: '例: カシュクール', tops: '例: ボウタイのブラウス', bottoms: '例: ラップスカート',
    dress: '例: カシュクールのワンピース', length: '例: ジャケットはお尻が隠れる丈', material: '例: 厚手のサテン',
    pattern: '例: レオパード柄', items: '例: 細めのバングル',
    taste: '例: ナチュラル', design: '例: ボウタイ', acc: '例: フープピアス', hair: '例: レイヤーの入ったロング', makeup: '例: 下まぶたに色を入れる'
  };
  function focusIn(selector) {
    const el = document.querySelector(selector);
    if (el) el.focus({ preventScroll: true });
  }

  /* ---------- 骨格・顔タイプ診断（同じ作り） ---------- */
  const STYLE_TEXT = {
    kk: {
      hint: 'タイプを選ぶと、印象と特徴のまとめと、向いている形・素材の候補が出ます。',
      empty: 'タイプを選ぶと、ここに形・素材の候補が出ます。',
      feat: '体の特徴', cand: '向いている形・素材', seg: 'seg-3'
    },
    face: {
      hint: 'タイプを選ぶと、印象と顔立ちの特徴のまとめと、似合うテイスト・髪型・メイクの候補が出ます。',
      empty: 'タイプを選ぶと、ここにテイスト・髪型・メイクの候補が出ます。',
      feat: '顔立ちの特徴', cand: '向いているテイスト・デザイン', seg: 'seg-4'
    }
  };
  V.styleSec = function (key) {
    const t = Q.style(key);
    const st = S[key];
    const tx = STYLE_TEXT[key];
    const secId = `in-${key}`;
    const name = S.settings.names[key];
    const sec = h('section', { class: 'in-sec', id: secId },
      h('h2', null, name),
      h('p', { class: 'hint', text: tx.hint }),
      key === 'face' ? h('p', { class: 'hint tm', text: `${DS.data.face.note}${DS.data.face.trademark}` }) : null,
      V.seg(Q.styleData(key).types.map((x) => ({ id: x.id, label: Q.typeName(x), sub: x.sub && !S.settings.typeNames[x.id] ? x.sub : null })), st.type,
        (id) => { st.type = id; V.renderStyle(key); V.renderChecks(); V.changed(); focusIn(`#${secId} .seg-btn[aria-pressed="true"]`); }, tx.seg, `${name}のタイプ`));
    if (!t) { sec.append(V.empty(tx.empty)); return sec; }

    sec.append(h('div', { class: 'sumbox' },
      h('p', { class: 'catch', text: Q.typeCatch(t) }),
      h('span', { class: 'label', text: '与える印象' }),
      h('div', { class: 'words' }, t.words.map((w) => h('span', { class: 'word', text: w }))),
      h('span', { class: 'label', text: tx.feat }),
      h('ul', { class: 'bullets' }, t.features.map((f) => h('li', { text: f }))),
      h('span', { class: 'label', text: '向いているもの' }),
      h('p', { text: t.summary })));

    // 顔立ちの位置（顔タイプ診断だけ）
    if (key === 'face') {
      const pos = Q.posOf(t);
      const box = h('div', { class: 'scales' });
      for (const a of DS.data.face.axes) {
        const id = `pos-${a.id}`;
        const says = (v) => (v < 40 ? a.say[0] : v > 60 ? a.say[2] : a.say[1]);
        const input = h('input', { type: 'range', id, min: '0', max: '100', step: '5', value: String(pos[a.id]), 'aria-valuetext': says(pos[a.id]) });
        input.addEventListener('input', () => { pos[a.id] = Number(input.value); input.setAttribute('aria-valuetext', says(pos[a.id])); V.changed(); });
        box.append(h('div', { class: 'scale-in' },
          h('label', { for: id, text: a.label }), input,
          h('div', { class: 'ends', 'aria-hidden': 'true' }, h('span', { text: a.left }), h('span', { text: a.right }))));
      }
      sec.append(
        h('h3', null, h('span', { text: '顔立ちの位置' }),
          h('button', { type: 'button', class: 'btn-link', onclick: () => {
            if (!same(pos, t.pos) && !window.confirm('動かした顔立ちの位置を、タイプの目安に戻しますか？')) return;
            Object.assign(pos, t.pos); V.renderStyle('face'); V.changed();
          } }, 'タイプの目安に戻す')),
        h('p', { class: 'hint', text: 'タイプの目安を入れています。お客様に合わせて動かせます（シートの図に出ます）。' }),
        box);
    }

    const off = Q.setOf(st.off, t.id);
    sec.append(
      h('h3', null, h('span', { text: tx.cand }), V.count(`${key}-items`)),
      h('p', { class: 'hint', text: 'タイプの基本の候補を、最初から選んでいます。お客様に合わないものは押して外します。足りないものは［足す］で書き足せます。' }));
    for (const c of Q.catsOf(key, t)) {
      const chips = h('div', { class: 'chips' }, c.items.map((it) => V.chip(it, !off.has(`${c.id}:${it}`), (on) => {
        const k = `${c.id}:${it}`;
        if (on) off.delete(k); else off.add(k);
        V.changed();
      })));
      const addBtn = h('button', { type: 'button', class: 'chip chip-add', 'aria-expanded': 'false', 'data-add': c.id }, icon('plus'), h('span', { text: '足す' }));
      chips.append(addBtn);
      const cat = h('div', { class: 'cat' }, h('h4', { text: c.name }), chips);
      addBtn.addEventListener('click', () => {
        const open = cat.querySelector('.add');
        if (open) { open.remove(); addBtn.setAttribute('aria-expanded', 'false'); return; }
        addBtn.setAttribute('aria-expanded', 'true');
        const row = V.addRow(ADD_EXAMPLE[c.id] || '例: 書き足す言葉', `${c.name}に書き足す`, (v) => {
          if (c.items.includes(v)) return 'その言葉は、もう候補にあります。';
          st.extra[t.id] = st.extra[t.id] || {};
          (st.extra[t.id][c.id] = st.extra[t.id][c.id] || []).push(v);
          V.renderStyle(key); V.changed();
          focusIn(`#${secId} [data-add="${c.id}"]`);
          DS.util.toast(`「${v}」を足しました`);
          return '';
        });
        cat.append(row);
        row.querySelector('input').focus();
      });
      sec.append(cat);
    }

    const koff = Q.setOf(st.kufuOff, t.id);
    sec.append(
      h('h3', null, h('span', { text: '取り入れるときは工夫を' }), V.count(`${key}-kufu`)),
      h('p', { class: 'hint', text: '苦手になりやすいものと、取り入れるときのこつです。押すと、のせる／のせないが切りかわります。' }),
      h('div', null, t.kufu.map(([it, tip]) => V.checkrow(it, tip, !koff.has(it), (on) => { if (on) koff.delete(it); else koff.add(it); V.changed(); }))));
    return sec;
  };

  /* ---------- ［設定］で足した診断 ---------- */
  V.customSec = function (c) {
    const text = h('textarea', { class: 'textarea', id: `in-${c.id}-text`, value: c.text, maxlength: '300' });
    text.addEventListener('input', () => { c.text = text.value; V.changed(); });
    return h('section', { class: 'in-sec', id: `in-${c.id}` },
      h('h2', { text: c.name }),
      c.options.length
        ? V.seg(c.options.map((o) => ({ id: o, label: o })), c.value, (v) => { c.value = v; V.renderCustom(); V.changed(); focusIn(`#in-${c.id} .seg-btn[aria-pressed="true"]`); }, 'seg-3', `${c.name}の結果`)
        : h('p', { class: 'hint', text: '結果の候補がまだありません。［設定］の「診断の種類」で入れてください。' }),
      h('div', { class: 'field mt' }, h('label', { for: `in-${c.id}-text`, class: 'label', text: 'シートにのせる説明' }), text));
  };

  /* ---------- 買い物のチェック ---------- */
  V.checksSec = function () {
    const sec = h('section', { class: 'in-sec', id: 'in-checks' },
      h('h2', null, h('span', { text: '買い物のチェックポイント' }), V.count('checks')),
      h('p', { class: 'hint', text: 'タイプに合わせた候補を、最初から選んでいます。押すと、のせる／のせないが切りかわります。' }));
    for (const g of Q.checkGroups()) {
      sec.append(h('h3', { text: g.inputTitle }),
        h('div', null, g.items.map((it) => V.checkrow(it.text, null, !S.checks.off.has(it.key), (on) => {
          if (on) S.checks.off.delete(it.key); else S.checks.off.add(it.key);
          V.changed();
        }))));
    }
    sec.append(h('h3', { text: 'チェックポイントを書き足す' }),
      V.addRow('例: 洗濯機で洗えるかを見る', 'チェックポイントを書き足す', (v) => {
        const exists = Q.checkGroups().some((g) => g.items.some((it) => it.text === v));
        if (exists) return 'その言葉は、もうチェックポイントにあります。';
        S.checks.extra.push(v);
        V.renderChecks(); V.changed();
        focusIn('#in-checks .add input');
        DS.util.toast('チェックポイントを足しました');
        return '';
      }));
    return sec;
  };

  /* ---------- ひと言メモ ---------- */
  V.memoSec = function () {
    const ta = h('textarea', { class: 'textarea', id: 'in-memo-text', value: S.memo, maxlength: '400', placeholder: '診断のときに気づいたことや、お客様へのひと言' });
    ta.addEventListener('input', () => { S.memo = ta.value; V.changed(); });
    return h('section', { class: 'in-sec', id: 'in-memo' },
      h('h2', null, 'ひと言メモ'),
      h('p', { class: 'hint', text: `シートの最後に「${S.settings.staff}からのひと言」としてのります。空のときは、のせません。` }),
      h('label', { class: 'visually-hidden', for: 'in-memo-text', text: 'ひと言メモ' }),
      ta,
      h('p', { class: 'hint mt-s num', 'data-count': 'memo' }));
  };

  /* ---------- 数の表示（「選んでいない」と「0」を分ける。D-55） ---------- */
  V.refreshCounts = function () {
    const put = (key, text) => document.querySelectorAll(`[data-count="${key}"]`).forEach((el) => { el.textContent = text; });
    const s = Q.season();
    if (s) {
      const nb = Q.setOf(S.pc.best, s.id).size;
      const nw = Q.setOf(S.pc.worst, s.id).size;
      put('pc-best', nb ? `選んだ色 ${nb}色` : 'まだ選んでいません');
      put('pc-worst', nw ? `選んだ色 ${nw}色` : 'まだ選んでいません');
      put('pc-tips', `のせる ${Q.tipsList().length} / ${s.tips.length}`);
    }
    for (const key of ['kk', 'face']) {
      const t = Q.style(key);
      if (!t) continue;
      const c = Q.catsCount(key, t);
      put(`${key}-items`, `のせる ${c.on} / ${c.all}`);
      put(`${key}-kufu`, `のせる ${Q.kufuOf(key, t).length} / ${t.kufu.length}`);
    }
    const all = Q.checkGroups().reduce((n, g) => n + g.items.length, 0);
    const on = Q.checkGroupsOn().reduce((n, g) => n + g.items.length, 0);
    put('checks', `のせる ${on} / ${all}`);
    put('memo', `${S.memo.length} / 400文字`);
  };
})();
