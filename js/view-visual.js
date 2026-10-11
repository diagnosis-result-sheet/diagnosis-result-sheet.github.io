/* イラストシート（A4・2枚）: 1枚目＝色・顔まわり、2枚目＝洋服のコーデ。
   タイプを選ぶと、色・顔・洋服の絵が自動でできる。入力画面の［イラストを選ぶ］で選び直した所だけ変わる */
window.DS = window.DS || {};
DS.views = DS.views || {};
(function () {
  const V = (DS.views.visual = {});
  const { h, fmtDate } = DS.util;
  const S = DS.state;
  const Q = DS.q;
  const SV = () => DS.views.sheet;

  let pageNo = 0;
  let pageTotal = 3;
  const head = () => h('header', { class: 'vp-head' },
    h('span', { text: S.settings.salon }),
    h('span', { text: `診断結果シート　${++pageNo} / ${pageTotal}` }));

  const swatch = (name, hex, on) => h('div', { class: on ? 'vs is-on' : 'vs' }, h('i', { bg: hex, 'aria-hidden': 'true' }), h('span', { text: name }));
  function group(label, list, current) {
    return h('div', { class: 'vf-group' }, h('p', { class: 'vf-gl', text: label }),
      h('div', { class: 'vf-sw' }, list.map(([n, hex]) => swatch(n, hex, n === current[0]))));
  }

  /* ---------- 1枚目 ---------- */
  function page1(look, s) {
    const name = S.client.name.trim();
    const best = Q.bestList();
    const f = look.face;
    const hero = h('div', { class: 'vp-hero' },
      h('p', { class: 'k', text: s ? S.settings.names.pc : '診断の結果' }),
      s ? h('h1', { class: 'vp-type' }, Q.typeName(s), Q.typeName(s) !== s.kana ? h('small', { text: s.kana }) : null)
        : h('h1', { class: 'vp-type', text: Q.resultLabel() || 'お客様' }),
      s ? h('p', { class: 'vp-catch', text: Q.typeCatch(s) }) : null,
      s ? h('div', { class: 'words' }, s.words.map((w) => h('span', { class: 'word', text: w }))) : null,
      h('p', { class: 'vp-who' }, [`${name ? `${name}様` : 'お客様'}`, fmtDate(S.client.date), `担当　${S.settings.staff}`].filter(Boolean).join('　／　')));

    const boxes = [];
    if (s) {
      const bestNames = new Set(best.map((c) => c[0]));
      boxes.push(h('section', { class: 'vp-box' },
        h('h2', { class: 'vp-h', text: 'カラーパレット' }),
        h('div', { class: 'vpal' }, Q.palette(s).map(([n, hex]) => h('div', { class: bestNames.has(n) ? 'vp-c is-best' : 'vp-c' }, h('i', { bg: hex, 'aria-hidden': 'true' }), h('span', { text: n })))),
        best.length ? h('p', { class: 'legend' }, h('i', { 'aria-hidden': 'true' }), '太い枠と太字は、特に似合う色です') : null));
      const sc = Q.scalesOf(s);
      boxes.push(h('section', { class: 'vp-box' },
        h('h2', { class: 'vp-h', text: '色の特徴' }),
        h('div', { class: 'meters' }, DS.data.pc.scaleDefs.map((d) => SV().meter(d, sc[d.id]))),
        h('p', { class: 'vp-sum', text: s.summary })));
    }

    const fig = h('figure', { class: 'vf-fig' }, DS.look.faceSvg(look, `顔の絵。髪型は${f.hairStyle.label}、髪の色は${f.hair[0]}、リップは${f.lip[0]}です`),
      h('figcaption', { text: `髪型：${f.hairStyle.label}` }));
    const faceBox = h('section', { class: 'vp-box vp-facebox' },
      h('h2', { class: 'vp-h', text: '髪・メイク・アクセサリーの色' }),
      h('div', { class: 'vp-face' },
        h('div', { class: 'vf-col' }, group('髪の色', look.opts.hair, f.hair), group('アイシャドウ', look.opts.eye, f.eye), group('ネイル', look.opts.nail, f.nail)),
        fig,
        h('div', { class: 'vf-col' }, group('チーク', look.opts.cheek, f.cheek), group('リップ', look.opts.lip, f.lip), group('アクセサリーの金属', look.opts.metal, f.metal))),
      h('p', { class: 'legend' }, h('i', { 'aria-hidden': 'true' }), '太い枠は、絵に使っている色です'));

    return h('section', { class: 'vpage vp1', 'aria-label': '色・髪・メイク' }, head(), hero, ...boxes, faceBox);
  }

  /* ---------- 2枚目 ---------- */
  function row(list) { return h('div', { class: 'vp-row' }, list.slice(0, 8).map(([n, hex]) => swatch(n, hex, false))); }
  function coordFig(c) {
    const parts = c.parts.map((p) => h('li', null,
      h('i', { class: 'pdot', bg: p.color[1], 'aria-hidden': 'true' }),
      h('span', { class: 'pl', text: p.label }),
      h('span', { class: 'pn', text: `${p.shape}（${p.color[0]}）` })));
    const label = `${c.title}のコーデの絵。${c.parts.map((p) => `${p.label}は${p.color[0]}の${p.shape}`).join('、')}`;
    return h('figure', { class: 'vp-coord' }, DS.illust.outfit(c, label), h('figcaption', null, h('h3', { text: c.title }), h('ul', { class: 'vp-parts' }, parts)));
  }
  /* ---------- 骨格のページ（体型の図・似合う服の一覧） ---------- */
  const SLOT_OF = { top: 'top', pants: 'pants', skirt: 'skirt', outer: 'outer', dress: 'dress', bag: 'bag', shoes: 'shoes' };
  function lineupItem(look, entry, idx, rowKind) {
    const [rawId, why] = entry;
    const [slot, shape] = rawId.includes(':') ? rawId.split(':') : ['top', rawId];
    const label = (DS.data.look.shapes[SLOT_OF[slot]].find((x) => x[0] === shape) || [shape, shape])[1];
    const color = look.pool[(idx + (rowKind === 'top' ? 0 : rowKind === 'bottom' ? 2 : rowKind === 'mix' ? 4 : 1)) % look.pool.length];
    return h('figure', { class: 'vl-item' },
      DS.illust.thumb(slot, shape, color[1], look.pool[5][1]),
      h('figcaption', null, h('p', { class: 'vl-name', text: label }), h('p', { class: 'vl-why', text: why })));
  }
  function lineupRow(look, row) {
    return h('section', { class: 'vp-box' }, h('h2', { class: 'vp-h', text: row[0] }),
      h('div', { class: 'vl-row' }, row[2].map((e, i) => lineupItem(look, e, i, row[1]))));
  }

  function pageBody(look, k) {
    const note = DS.data.look.kkNote[k.id] || DS.data.look.kkNote[DS.data.look.fallbackKokkaku];
    const trio = DS.data.kokkaku.types.map((t) => h('figure', { class: t.id === k.id ? 'vb is-on' : 'vb' },
      DS.illust.body(t.id, look.skin, t.id === k.id),
      h('figcaption', { text: `${Q.typeName(t)}${t.id === k.id ? '（このタイプ）' : ''}` })));
    return h('section', { class: 'vpage vp-kk1', 'aria-label': `${S.settings.names.kk}：体の特徴と似合う服` }, head(),
      h('div', { class: 'vp-hero' },
        h('p', { class: 'k', text: S.settings.names.kk }),
        h('h1', { class: 'vp-type', text: Q.typeName(k) }),
        h('p', { class: 'vp-catch', text: Q.typeCatch(k) }),
        h('div', { class: 'words' }, k.words.map((w) => h('span', { class: 'word', text: w })))),
      h('div', { class: 'vp-bodybox' },
        h('div', { class: 'vbodies', role: 'group', 'aria-label': '骨格の3タイプの体型' }, trio),
        h('div', { class: 'vp-feat' },
          h('h2', { class: 'vp-h', text: '体の特徴' }),
          h('ul', { class: 'bullets' }, k.features.map((f) => h('li', { text: f }))),
          h('p', { class: 'vp-sum', text: note.feel }))),
      lineupRow(look, note.lineup[0]), lineupRow(look, note.lineup[1]), lineupRow(look, note.lineup[2]));
  }

  function pageMaterial(look, k) {
    const note = DS.data.look.kkNote[k.id] || DS.data.look.kkNote[DS.data.look.fallbackKokkaku];
    const kufu = Q.kufuOf('kk', k).slice(0, 4);
    const sw = (list, cls) => h('div', { class: cls }, list.map(([name, kind, why], i) => h('figure', { class: 'vm-item' },
      DS.illust.fabric(kind, look.pool[(i * 2) % look.pool.length][1]),
      h('figcaption', null, h('p', { class: 'vl-name', text: name }), h('p', { class: 'vl-why', text: why })))));
    return h('section', { class: 'vpage vp-kk2', 'aria-label': `${S.settings.names.kk}：素材・柄・小物` }, head(),
      lineupRow(look, note.lineup[3]),
      h('section', { class: 'vp-box' }, h('h2', { class: 'vp-h', text: '素材の選び方' }), sw(note.materials, 'vm-grid')),
      h('section', { class: 'vp-box' }, h('h2', { class: 'vp-h', text: '柄の選び方' }), sw(note.patterns, 'vm-grid vm-4'),
        h('p', { class: 'legend', text: '見本の色は、タイプに合わせた色です。素材の見た目は、目安の絵です。' })),
      kufu.length ? h('section', { class: 'vp-box vp-kufu' }, h('h2', { class: 'vp-h', text: '取り入れるときは工夫を' }),
        h('ul', { class: 'kufu' }, kufu.map(([it, tip]) => h('li', null, h('p', { class: 'i', text: it }), h('p', { class: 't', text: tip }))))) : null);
  }

  function page2(look, s) {
    return h('section', { class: 'vpage vp2', 'aria-label': '洋服のコーデ' }, head(),
      h('h2', { class: 'vp-title', text: 'ファッション' }),
      h('section', { class: 'vp-box' }, h('h2', { class: 'vp-h', text: '基本の色' }), row(look.basics)),
      h('section', { class: 'vp-box' }, h('h2', { class: 'vp-h', text: 'アクセントの色' }), row(look.accents)),
      h('div', { class: 'vp-coords' }, look.coords.map(coordFig)),
      h('p', { class: 'legend' }, '絵は、タイプからの目安です。同じ形・色でなくても、雰囲気の参考にしてください。'));
  }

  function page3(k, f, s) {
    const worst = Q.worstList();
    const groups = Q.checkGroupsOn();
    const typeCards = [k, f].filter(Boolean).map((t, i) => h('div', { class: 'type-card' },
      h('p', { class: 'k', text: i === 0 && k ? S.settings.names.kk : S.settings.names.face }),
      h('p', { class: 'v', text: Q.typeName(t) }),
      h('p', { class: 'catch', text: Q.typeCatch(t) }),
      h('p', { class: 'vp-sum', text: t.summary }),
      h('div', { class: 'words' }, t.words.map((w) => h('span', { class: 'word', text: w })))));
    return h('section', { class: 'vpage vp3', 'aria-label': '形・買い物のヒント' }, head(),
      typeCards.length ? h('section', { class: 'vp-box' }, h('h2', { class: 'vp-h', text: '似合う形・テイスト' }), h('div', { class: 'types' }, typeCards)) : null,
      worst.length ? h('section', { class: 'vp-box' }, h('h2', { class: 'vp-h', text: '苦手になりやすい色' }),
        h('div', { class: 'worst' }, worst.map(([n, hex]) => h('div', null, h('i', { bg: hex, 'aria-hidden': 'true' }), n))),
        s ? h('p', { class: 'note', text: s.worstTip }) : null) : null,
      groups.length ? h('section', { class: 'vp-box' }, h('h2', { class: 'vp-h', text: '買い物のときのチェック' }),
        h('div', { class: 'cl-groups' }, groups.map((g) => h('div', { class: 'cl-group' }, h('h4', { text: g.title }), h('ul', { class: 'cl' }, g.items.map((it) => h('li', { text: it.text }))))))) : null,
      S.memo.trim() ? h('section', { class: 'vp-box' }, h('h2', { class: 'vp-h', text: `${S.settings.staff}からのひと言` }), h('div', { class: 'letter' }, h('p', { class: 'body', text: S.memo.trim() }))) : null,
      h('footer', { class: 'sheet-foot' },
        h('p', null, h('span', { class: 'salon', text: S.settings.salon }), '　', S.settings.contact),
        h('p', { text: 'このシートは、診断の日の結果をまとめたものです。服やメイクを決めつけるものではありません。好きなものを楽しむときの目安にしてください。' }),
        f ? h('p', { class: 'tm mt-s', text: DS.data.face.trademark }) : null));
  }

  V.build = function () {
    const s = Q.season();
    const k = Q.kk();
    const f = Q.face();
    const look = DS.look.resolve();
    const name = S.client.name.trim();
    const sheet = h('article', { class: 'sheet vsheet', 'aria-label': `${name ? `${name}様` : 'お客様'}の診断結果シート（イラスト版）` });
    if (s) sheet.style.setProperty('--season', s.accent);
    pageNo = 0;
    pageTotal = k ? 5 : 3;
    sheet.append(page1(look, s));
    if (k) sheet.append(pageBody(look, k), pageMaterial(look, k));
    sheet.append(page2(look, s), page3(k, f, s));
    return sheet;
  };
})();
