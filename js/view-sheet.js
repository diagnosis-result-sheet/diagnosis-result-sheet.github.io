/* お客様用の結果シート（スマホで見る・A4 の PDF にする） */
window.DS = window.DS || {};
DS.views = DS.views || {};
(function () {
  const V = (DS.views.sheet = {});
  const { h, icon, fmtDate } = DS.util;
  const S = DS.state;
  const Q = DS.q;

  /* ---------- 部品 ---------- */
  // 見出しは文節で折り返す（配列で渡すと、ひとまとまりずつ span.ph で包む。D-32）
  V.secHead = (no, title) => h('div', { class: 'sec-head' },
    h('span', { class: 'sec-no', text: String(no).padStart(2, '0') }),
    h('h2', { class: 'sec-title' }, [].concat(title).map((part) => h('span', { class: 'ph', text: part }))));
  V.sub = (text) => h('h3', { class: 'sub-title', text });
  V.unset = (text) => h('p', { class: 'unset', text }); // 画面だけに出す（印刷しない）

  function says(d, v) { return v < 40 ? d.say[0] : v > 60 ? d.say[2] : d.say[1]; }
  function meter(d, v) {
    const dot = h('span', { class: 'dot' });
    dot.style.left = `${Math.min(96, Math.max(4, v))}%`;
    return h('div', { class: 'meter', role: 'img', 'aria-label': `${d.label}は${says(d, v)}` },
      h('p', { class: 'lab', 'aria-hidden': 'true' }, `${d.label}　`, h('span', { class: 'sub small', text: says(d, v) })),
      h('div', { class: 'track', 'aria-hidden': 'true' }, dot),
      h('div', { class: 'ends', 'aria-hidden': 'true' }, h('span', { text: d.left }), h('span', { text: d.right })));
  }
  V.meter = meter;
  const dots = (colors) => h('div', { class: 'dots' }, colors.map(([n, hex]) => h('span', { class: 'dot-i' }, h('i', { bg: hex, 'aria-hidden': 'true' }), n)));

  /* ---------- 画面全体 ---------- */
  V.render = function () {
    const pane = document.getElementById('pane-sheet');
    const notice = h('p', { class: 'sheet-notice' }, 'お客様に届くシートです。',
      h('span', { class: 'only-sp' }, '［入力］で変えると、このシートも変わります。'),
      h('span', { class: 'only-pc' }, '左で変えると、すぐに変わります。'));
    if (!Q.hasResult()) {
      pane.replaceChildren(notice, h('div', { class: 'empty' },
        h('p', { text: 'まだ結果が入っていません。［入力］でタイプを選ぶと、ここにシートができます。' }),
        h('button', { type: 'button', class: 'btn btn-primary only-sp', onclick: () => DS.app.go('input') }, '入力する')));
      return;
    }
    const modeBar = h('div', { class: 'sheet-mode', role: 'group', 'aria-label': 'シートの形' },
      [['visual', 'イラスト版', 'A4・5枚'], ['detail', 'くわしい版', '文字が中心']].map(([id, label, sub]) =>
        h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(S.ui.sheetMode === id), onclick: () => { S.ui.sheetMode = id; V.render(); } },
          S.ui.sheetMode === id ? icon('check') : null, h('span', null, label, h('small', { text: sub })))));
    const actions = h('div', { class: 'sheet-actions' },
      h('button', { type: 'button', class: 'btn btn-primary', onclick: V.print }, icon('printer'), 'PDFにする'),
      h('button', { type: 'button', class: 'btn', onclick: () => DS.app.go('message') }, icon('message'), '送る文へ'));
    const hint = h('p', { class: 'print-hint', text: '［PDFにする］を押すと、印刷の画面が出ます。プリンターの代わりに「PDFに保存」を選ぶと、A4のPDFになります。' });
    if (S.ui.sheetMode === 'visual') {
      pane.replaceChildren(notice, modeBar, actions, DS.views.visual.build(), hint);
      return;
    }
    const s = Q.season();
    const k = Q.kk();
    const f = Q.face();
    const best = Q.bestList();
    const name = S.client.name.trim();

    const secs = [['sh-sum', '診断の結果', sumSec]];
    if (s) secs.push(['sh-color', '似合う色', V.colorSec]);
    if (k) secs.push(['sh-shape', '形・素材', V.shapeSec]);
    if (f) secs.push(['sh-taste', 'テイスト', V.tasteSec]);
    if (Q.checkGroupsOn().length) secs.push(['sh-checks', '買い物のチェック', V.checksSec]);
    if (S.memo.trim()) secs.push(['sh-letter', 'ひと言', V.letterSec]);

    const sheet = h('article', { class: 'sheet', 'aria-label': `${name ? `${name}様` : 'お客様'}の診断結果シート` });
    if (s) sheet.style.setProperty('--season', s.accent);
    const bandColors = best.length ? best : (s ? Q.palette(s) : []);
    const inner = h('div', { class: 'sheet-in' },
      h('div', { class: 'sh-top' }, h('span', { text: S.settings.salon }), h('span', { text: '診断結果シート' })),
      h('h1', { class: 'sh-name' }, name ? [name, h('small', { text: '様' })] : 'お客様'),
      h('p', { class: 'sh-meta' }, [fmtDate(S.client.date), `担当　${S.settings.staff}`].filter(Boolean).join('　／　')),
      name ? null : V.unset('お客様の呼び名が入っていないため、「お客様」と出しています。'),
      h('nav', { class: 'toc', 'aria-label': 'シートの中の移動' }, secs.map(([id, label]) => h('a', { href: `#${id}` }, label))));
    secs.forEach(([, , fn], i) => inner.append(fn(i + 1, s, k, best)));
    inner.append(h('footer', { class: 'sheet-foot' },
      h('p', { class: 'salon', text: S.settings.salon }),
      h('p', { text: S.settings.contact }),
      h('p', { text: 'このシートは、診断の日の結果をまとめたものです。服やメイクを決めつけるものではありません。好きなものを楽しむときの目安にしてください。' }),
      f ? h('p', { class: 'tm mt-s', text: DS.data.face.trademark }) : null));
    if (bandColors.length) sheet.append(h('div', { class: 'band', 'aria-hidden': 'true' }, bandColors.slice(0, 12).map(([, hex]) => h('span', { bg: hex }))));
    sheet.append(inner);

    pane.replaceChildren(notice, modeBar, actions, sheet, hint);
  };

  /* 01 診断の結果（まとめ） */
  function sumSec(no, s, k, best) {
    const cards = [];
    if (s) {
      cards.push(h('div', { class: 'type-card' },
        h('p', { class: 'k', text: S.settings.names.pc }),
        h('p', { class: 'v' }, Q.typeName(s), Q.typeName(s) !== s.kana ? h('small', { text: s.kana }) : null),
        h('p', { class: 'catch', text: Q.typeCatch(s) }),
        h('div', { class: 'words' }, s.words.map((w) => h('span', { class: 'word', text: w }))),
        h('div', { class: 'minipal', 'aria-hidden': 'true' }, (best.length ? best : Q.palette(s)).slice(0, 8).map(([, hex]) => h('span', { bg: hex })))));
    }
    if (k) {
      cards.push(h('div', { class: 'type-card' },
        h('p', { class: 'k', text: S.settings.names.kk }),
        h('p', { class: 'v', text: Q.typeName(k) }),
        h('p', { class: 'catch', text: Q.typeCatch(k) }),
        h('div', { class: 'words' }, k.words.map((w) => h('span', { class: 'word', text: w })))));
    }
    const f = Q.face();
    if (f) {
      cards.push(h('div', { class: 'type-card' },
        h('p', { class: 'k', text: S.settings.names.face }),
        h('p', { class: 'v', text: Q.typeName(f) }),
        h('p', { class: 'catch', text: Q.typeCatch(f) }),
        h('div', { class: 'words' }, f.words.map((w) => h('span', { class: 'word', text: w })))));
    }
    for (const c of S.custom) {
      if (!c.use || !c.value) continue;
      cards.push(h('div', { class: 'type-card' },
        h('p', { class: 'k', text: c.name }),
        h('p', { class: 'v', text: c.value }),
        c.text.trim() ? h('p', { class: 'catch', text: c.text.trim() }) : null));
    }
    return h('section', { class: 'sec', id: 'sh-sum' }, V.secHead(no, '診断の結果'), h('div', { class: 'types' }, cards));
  }

  /* 02 似合う色 */
  const FACE = { 'メイク': ['lip', 'cheek'], '髪の色': ['hair'], 'アクセサリー': ['metal'] };
  const FACE_ALONE = { 'メイク': 'メイクの色', '髪の色': '髪の色', 'アクセサリー': '金属の色' };
  V.colorSec = function (no, s, k, best) {
    const sc = Q.scalesOf(s);
    const out = h('section', { class: 'sec', id: 'sh-color' }, V.secHead(no, ['似合う色', `（${Q.typeName(s)}）`]),
      h('p', { class: 'lead', text: s.summary }),
      V.sub('色の特徴'),
      h('div', { class: 'meters' }, DS.data.pc.scaleDefs.map((d) => meter(d, sc[d.id]))));

    if (best.length) {
      out.append(V.sub('特に似合う色'), h('div', { class: 'best' }, best.map(([n, hex]) => h('div', null, h('span', { class: 'c', bg: hex, 'aria-hidden': 'true' }), h('p', { class: 'n', text: n })))));
    } else {
      out.append(V.unset('特に似合う色が選ばれていないため、この欄はのせていません（［入力］で選べます）。'));
    }

    const bestNames = new Set(best.map((c) => c[0]));
    out.append(V.sub(`${Q.typeName(s)}の色`),
      h('div', { class: 'palrows' }, s.groups.map((g) => h('div', { class: 'palrow' },
        h('p', { class: 'g', text: g.name }),
        h('div', { class: 'cs' }, g.colors.map(([n, hex]) => h('div', { class: bestNames.has(n) ? 'is-best' : null }, h('i', { bg: hex, 'aria-hidden': 'true' }), n)))))));
    if (best.length) out.append(h('p', { class: 'legend' }, h('i', { 'aria-hidden': 'true' }), '太い枠と太字は、特に似合う色です'));

    out.append(V.sub('配色の例'),
      h('div', { class: 'combos' }, s.combos.map((c) => h('div', { class: 'combo' },
        h('div', { class: 'stack', 'aria-hidden': 'true' }, c.colors.map((n) => h('span', { bg: Q.hexOf(s, n) }))),
        h('p', { class: 't', text: c.title }),
        h('p', { class: 'd', text: `${c.colors.join('・')}。${c.desc}` })))),
      h('p', { class: 'legend', text: '色の帯は、左から「広く使う色」「合わせる色」「差し色」です。' }));

    const worst = Q.worstList();
    if (worst.length) {
      out.append(V.sub('苦手になりやすい色'),
        h('div', { class: 'worst' }, worst.map(([n, hex]) => h('div', null, h('i', { bg: hex, 'aria-hidden': 'true' }), n))),
        h('p', { class: 'note', text: s.worstTip }));
    } else {
      out.append(V.unset('苦手になりやすい色が選ばれていないため、この欄はのせていません。'));
    }

    const tips = Q.tipsList();
    const rows = tips.map(([label, text]) => h('div', null, h('dt', { text: label }),
      h('dd', null, text, S.pc.face && FACE[label] ? dots(FACE[label].flatMap((key) => s.face[key])) : null)));
    if (S.pc.face) {
      const shown = new Set(tips.map((t) => t[0]));
      for (const label of Object.keys(FACE)) {
        if (!shown.has(label)) rows.push(h('div', null, h('dt', { text: FACE_ALONE[label] }), h('dd', null, dots(FACE[label].flatMap((key) => s.face[key])))));
      }
    }
    if (rows.length) out.append(V.sub('色の使い方'), h('dl', { class: 'kv' }, rows));
    return out;
  };

  V.print = function () {
    const old = document.title;
    const name = S.client.name.trim();
    document.title = `診断結果シート_${name ? `${name}様` : 'お客様'}${S.client.date ? `_${S.client.date}` : ''}`;
    const restore = () => { document.title = old; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    window.print();
  };
})();

/* 結果シート（続き）: 形・素材・買い物のチェック・ひと言 */
(function () {
  const V = DS.views.sheet;
  const { h } = DS.util;
  const S = DS.state;
  const Q = DS.q;

  /* 似合う形・素材 */
  V.shapeSec = function (no, s, k, best) {
    const fills = best.length ? best.map((c) => c[1]) : (s ? Q.palette(s).map((c) => c[1]) : []);
    const out = h('section', { class: 'sec', id: 'sh-shape' }, V.secHead(no, ['似合う形・素材', `（${S.settings.names.kk}${Q.typeName(k)}）`]),
      h('p', { class: 'lead', text: k.summary }),
      V.sub('体の特徴'),
      h('ul', { class: 'bullets feat' }, k.features.map((f) => h('li', { text: f }))),
      V.sub('ひと目でわかる形'),
      h('div', { class: 'figs' }, k.figures.map(([id, label], i) => h('figure', { class: 'fig' },
        DS.figure(id, fills.length ? fills[i % fills.length] : null),
        h('figcaption', { text: label })))));
    if (fills.length) out.append(h('p', { class: 'legend', text: '絵は、似合う色でぬっています。' }));

    const cats = Q.catsOn('kk', k);
    if (cats.length) {
      out.append(V.sub('向いているもの'), h('dl', { class: 'kv' }, cats.map((c) => h('div', null, h('dt', { text: c.name }), h('dd', { text: c.items.join('、') })))));
    } else {
      out.append(V.unset('向いている形・素材が、すべて外れているため、この欄はのせていません。'));
    }
    const kufu = Q.kufuOf('kk', k);
    if (kufu.length) {
      out.append(V.sub('取り入れるときは工夫を'), h('ul', { class: 'kufu' }, kufu.map(([it, tip]) => h('li', null, h('p', { class: 'i', text: it }), h('p', { class: 't', text: tip })))));
    }
    return out;
  };

  /* 似合うテイスト（顔タイプ診断） */
  const say = (a, v) => (v < 40 ? a.say[0] : v > 60 ? a.say[2] : a.say[1]);
  const clamp = (v) => Math.min(94, Math.max(6, v));
  function faceMap(f, pos) {
    const [ax, ay] = DS.data.face.axes;
    const types = [...DS.data.face.types].sort((a, b) => (a.pos.y - b.pos.y) || (a.pos.x - b.pos.x));
    const dot = h('span', { class: 'fmap-dot' });
    dot.style.left = `${clamp(pos.x)}%`;
    dot.style.top = `${clamp(pos.y)}%`;
    return h('div', { class: 'fmap', role: 'img', 'aria-label': `顔立ちの位置。${ax.label}は${say(ax, pos.x)}、${ay.label}は${say(ay, pos.y)}で、${Q.typeName(f)}のあたりです` },
      h('p', { class: 'ax ax-top', 'aria-hidden': 'true', text: ay.left }),
      h('div', { class: 'fmap-grid', 'aria-hidden': 'true' }, types.map((t) => h('div', { class: t.id === f.id ? 'q is-on' : 'q' },
        (S.settings.typeNames[t.id] ? [Q.typeName(t)] : (t.mapLabel || [t.name])).map((part) => h('span', { class: 'ph', text: part })))), dot),
      h('p', { class: 'ax ax-bottom', 'aria-hidden': 'true', text: ay.right }),
      h('p', { class: 'ax ax-x', 'aria-hidden': 'true' }, h('span', { text: `← ${ax.left}` }), h('span', { text: `${ax.right} →` })));
  }
  V.tasteSec = function (no) {
    const f = Q.face();
    const out = h('section', { class: 'sec', id: 'sh-taste' }, V.secHead(no, ['似合うテイスト', `（${Q.typeName(f)}）`]),
      h('p', { class: 'lead', text: f.summary }),
      V.sub('顔立ちの特徴'),
      h('ul', { class: 'bullets feat' }, f.features.map((x) => h('li', { text: x }))),
      V.sub('顔立ちの位置'),
      faceMap(f, Q.posOf(f)),
      h('p', { class: 'legend', text: '黒い丸が診断での位置、枠で囲んだところがあなたのタイプです。' }));
    const cats = Q.catsOn('face', f);
    if (cats.length) {
      out.append(V.sub('向いているもの'), h('dl', { class: 'kv' }, cats.map((c) => h('div', null, h('dt', { text: c.name }), h('dd', { text: c.items.join('、') })))));
    } else {
      out.append(V.unset('向いているテイスト・デザインが、すべて外れているため、この欄はのせていません。'));
    }
    const kufu = Q.kufuOf('face', f);
    if (kufu.length) {
      out.append(V.sub('取り入れるときは工夫を'), h('ul', { class: 'kufu' }, kufu.map(([it, tip]) => h('li', null, h('p', { class: 'i', text: it }), h('p', { class: 't', text: tip })))));
    }
    return out;
  };

  /* 買い物のときのチェックポイント */
  V.checksSec = function (no) {
    return h('section', { class: 'sec', id: 'sh-checks' }, V.secHead(no, ['買い物のときの', 'チェックポイント']),
      h('p', { class: 'lead', text: 'お店で迷ったときに、上から確かめてください。' }),
      Q.checkGroupsOn().map((g) => h('div', { class: 'cl-group mt' },
        h('h4', { text: g.title }),
        h('ul', { class: 'cl' }, g.items.map((it) => h('li', { text: it.text }))))));
  };

  /* 診断士からのひと言 */
  V.letterSec = function (no) {
    return h('section', { class: 'sec', id: 'sh-letter' }, V.secHead(no, `${S.settings.staff}からのひと言`),
      h('div', { class: 'letter' },
        h('p', { class: 'body', text: S.memo.trim() }),
        h('p', { class: 'from', text: `${S.settings.salon}　${S.settings.staff}` })));
  };
})();
