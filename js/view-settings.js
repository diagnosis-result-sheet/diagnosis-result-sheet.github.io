/* 項目の設定（診断士のやり方に合わせる）。見本なので保存しない */
window.DS = window.DS || {};
DS.views = DS.views || {};
(function () {
  const V = (DS.views.settings = {});
  const { h, icon } = DS.util;
  const S = DS.state;
  const Q = DS.q;

  const changed = () => DS.app.changed({ input: true });
  function field(id, label, value, onInput, opts = {}) {
    const el = opts.area
      ? h('textarea', { class: 'textarea', id, value, maxlength: opts.max || '400' })
      : h('input', { class: 'input', id, type: 'text', value, maxlength: opts.max || '40', autocomplete: 'off' });
    el.addEventListener('input', () => onInput(el.value));
    return h('div', { class: 'field' },
      h('label', { for: id, class: 'label', text: label }), el,
      opts.help ? h('p', { class: 'ph-help', text: opts.help }) : null);
  }
  function open(page) {
    S.ui.settingsPage = page;
    V.render();
    window.scrollTo(0, 0);
    const first = document.querySelector('#pane-settings .back');
    if (first) first.focus({ preventScroll: true });
  }
  function row(name, meta, page) {
    return h('button', { type: 'button', class: 'set-row', onclick: () => open(page) },
      h('span', { text: name }), h('span', { class: 'meta' }, meta, icon('chevronRight')));
  }

  V.render = function () {
    const pane = document.getElementById('pane-settings');
    if (S.ui.settingsPage) { renderDetail(pane, S.ui.settingsPage); return; }
    const pcColors = DS.data.pc.types.reduce((n, t) => n + Q.palette(t).length, 0);
    const items = (data) => data.types.reduce((n, t) => n + t.cats.reduce((m, c) => m + c[2].length, 0), 0);
    pane.replaceChildren(
      h('h1', { class: 'screen-title' }, '項目の設定'),
      h('p', { class: 'msg-note', text: '診断のやり方に合わせて、名前や項目を変えられます。見本のため保存されません（開き直すと元に戻ります）。' }),
      h('section', { class: 'in-sec' }, h('h2', null, 'サロン'),
        h('div', { class: 'set-stack' },
          field('set-salon', 'サロン名（シートの上と下に出ます）', S.settings.salon, (v) => { S.settings.salon = v.trim() || DS.data.salon.name; changed(); }),
          field('set-staff', '担当の名前（「〇〇からのひと言」に出ます）', S.settings.staff, (v) => { S.settings.staff = v.trim() || DS.data.salon.staff; changed(); }),
          field('set-contact', 'シートの最後に出る、連絡のひと言', S.settings.contact, (v) => { S.settings.contact = v; changed(); }, { max: '80' }))),
      h('section', { class: 'in-sec' }, h('h2', null, '診断の種類'),
        h('p', { class: 'hint', text: '押すと、診断の名前・結果の名前・説明を変えられます。' }),
        h('div', { class: 'set-list' },
          row(S.settings.names.pc, `結果${DS.data.pc.types.length}つ・色${pcColors}色`, 'pc'),
          row(S.settings.names.kk, `結果${DS.data.kokkaku.types.length}つ・候補${items(DS.data.kokkaku)}個`, 'kk'),
          row(S.settings.names.face, `結果${DS.data.face.types.length}つ・候補${items(DS.data.face)}個`, 'face'),
          S.custom.map((c) => row(c.name, c.options.length ? `結果${c.options.length}つ` : '結果の候補なし', c.id))),
        h('button', { type: 'button', class: 'btn mt', onclick: addDiag }, icon('plus'), '診断を足す')),
      h('section', { class: 'in-sec' }, h('h2', null, '送る文のひな形'),
        h('p', { class: 'ph-help', text: `〔 〕の言葉は、送る文を作るときに入れかわります: ${DS.data.placeholders.map((p) => `〔${p}〕`).join(' ')}` }),
        h('div', { class: 'set-stack' },
          field('set-tpl-line', 'LINE', S.settings.templates.line, (v) => { S.settings.templates.line = v; }, { area: true, max: '800' }),
          field('set-tpl-subject', 'メールの件名', S.settings.templates.mailSubject, (v) => { S.settings.templates.mailSubject = v; }, { max: '80' }),
          field('set-tpl-body', 'メールの本文', S.settings.templates.mailBody, (v) => { S.settings.templates.mailBody = v; }, { area: true, max: '1200' })),
        h('button', { type: 'button', class: 'btn-link mt-s', onclick: () => {
          if (!window.confirm('ひな形を最初の文に戻しますか？直した文は消えます。')) return;
          S.settings.templates = { ...DS.data.templates };
          V.render();
          DS.util.toast('ひな形を最初に戻しました');
        } }, 'ひな形を最初に戻す')));
  };

  function addDiag() {
    const c = { id: DS.util.uid('diag'), name: '新しい診断', options: [], use: true, value: null, text: '' };
    S.custom.push(c);
    changed();
    open(c.id);
    const nameInput = document.getElementById('set-cn');
    if (nameInput) { nameInput.focus(); nameInput.select(); }
  }

  function renderDetail(pane, page) {
    const back = h('button', { type: 'button', class: 'btn-link back', onclick: () => { S.ui.settingsPage = null; V.render(); } }, icon('chevronLeft'), '項目の設定にもどる');
    if (page === 'pc' || page === 'kk' || page === 'face') {
      const data = { pc: DS.data.pc, kk: DS.data.kokkaku, face: DS.data.face }[page];
      pane.replaceChildren(back,
        h('h1', { class: 'screen-title', text: S.settings.names[page] }),
        h('section', { class: 'in-sec' },
          field(`set-name-${page}`, '診断の名前（入力とシートに出ます）', S.settings.names[page], (v) => { S.settings.names[page] = v.trim() || data.name; changed(); })),
        h('section', { class: 'in-sec' }, h('h2', null, '結果の名前と説明'),
          h('p', { class: 'hint', text: { pc: '自分の理論での呼び方に合わせて変えられます（例: 「イエベ春」を「スプリング」に）。', kk: '自分の理論での呼び方に合わせて変えられます。', face: '8タイプの名前と並びは、一般的な顔タイプ診断®に合わせています。呼び方を変えたいときは、ここで変えられます。' }[page] }),
          page === 'face' ? h('p', { class: 'hint tm', text: `${DS.data.face.note}${DS.data.face.trademark}` }) : null,
          data.types.map((t) => h('div', { class: 'type-edit mt' },
            field(`set-tn-${t.id}`, `結果の名前（もとは「${t.name}」）`, Q.typeName(t), (v) => { S.settings.typeNames[t.id] = v.trim(); changed(); }),
            field(`set-tc-${t.id}`, 'ひと言の説明（シートの「診断の結果」に出ます）', Q.typeCatch(t), (v) => { S.settings.typeCatch[t.id] = v.trim(); changed(); }, { area: true, max: '80' })))),
        h('p', { class: 'msg-note', text: page === 'pc'
          ? '色見本の入れかえ・追加は、見本ではできません（本番で作ります）。'
          : '候補の入れかえは、見本ではできません。入力画面の［足す］で、お客様ごとに書き足せます。' }));
      return;
    }
    const c = S.custom.find((x) => x.id === page);
    if (!c) { S.ui.settingsPage = null; V.render(); return; }
    pane.replaceChildren(back,
      h('h1', { class: 'screen-title', text: c.name }),
      h('section', { class: 'in-sec' }, h('div', { class: 'set-stack' },
        field('set-cn', '診断の名前', c.name, (v) => { c.name = v.trim() || '新しい診断'; changed(); }),
        field('set-co', '結果の候補（「、」で区切る）', c.options.join('、'), (v) => {
          c.options = [...new Set(v.split(/[、,，]/).map((x) => x.trim()).filter(Boolean))];
          if (!c.options.includes(c.value)) c.value = null;
          changed();
        }, { max: '120', help: '例: ショート、ミディアム、ロング。入力画面で、この中から選べるようになります。' }))),
      h('button', { type: 'button', class: 'btn mt', onclick: () => {
        if (!window.confirm(`「${c.name}」を消しますか？この診断で入力した結果も消えます。`)) return;
        S.custom = S.custom.filter((x) => x !== c);
        S.ui.settingsPage = null;
        V.render();
        changed();
        DS.util.toast('診断を消しました');
      } }, 'この診断を消す'));
  }
})();
