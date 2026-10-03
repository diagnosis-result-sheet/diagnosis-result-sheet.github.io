/* お客様に送る文（LINE・メールの下書き）。このアプリからは送らない。コピーするだけ */
window.DS = window.DS || {};
DS.views = DS.views || {};
(function () {
  const V = (DS.views.message = {});
  const { h, icon, fmtShort } = DS.util;
  const S = DS.state;
  const Q = DS.q;

  /* 〔 〕の言葉を入れかえる */
  V.fill = function (tpl) {
    const name = S.client.name.trim() || 'お客様';
    const map = {
      'お客様の名前': name,
      'サロン名': S.settings.salon,
      '担当の名前': S.settings.staff,
      '診断日': fmtShort(S.client.date),
      '診断の結果': Q.resultLabel() || '診断'
    };
    return tpl.replace(/〔([^〕]+)〕/g, (all, key) => (key in map ? map[key] : all));
  };
  const text = (key) => (S.msg.edited[key] !== null ? S.msg.edited[key] : V.fill(S.settings.templates[key]));

  async function copy(value, what, err) {
    err.textContent = '';
    const ok = await DS.util.copyText(value);
    if (ok) DS.util.toast(`${what}をコピーしました。LINE やメールに貼ってください`);
    else err.textContent = `${what}をコピーできませんでした。文を長押し（PC は右クリック）して「すべてを選択」→「コピー」を選んでください。`;
  }

  function area(key, id, cls) {
    const ta = h('textarea', { class: `textarea ${cls || ''}`, id, value: text(key) });
    ta.addEventListener('input', () => { S.msg.edited[key] = ta.value; });
    return ta;
  }

  V.render = function () {
    const pane = document.getElementById('pane-message');
    const ch = S.msg.channel;
    const err = h('p', { class: 'err', role: 'alert' });
    const edited = Object.values(S.msg.edited).some((v) => v !== null);
    const body = [];
    if (ch === 'line') {
      const ta = area('line', 'msg-line', 'msg-box');
      body.push(h('div', { class: 'field msg-sec' }, h('label', { for: 'msg-line', class: 'label', text: 'LINE で送る文（ここで直してからコピーできます）' }), ta),
        h('div', { class: 'copy-row' }, h('button', { type: 'button', class: 'btn btn-primary btn-block', onclick: () => copy(ta.value, '文', err) }, icon('copy'), '文をコピー')));
    } else {
      const sub = h('input', { class: 'input', id: 'msg-subject', type: 'text', value: text('mailSubject') });
      sub.addEventListener('input', () => { S.msg.edited.mailSubject = sub.value; });
      const ta = area('mailBody', 'msg-body', 'msg-box');
      body.push(
        h('div', { class: 'field msg-sec' }, h('label', { for: 'msg-subject', class: 'label', text: '件名' }), sub),
        h('div', { class: 'field msg-sec' }, h('label', { for: 'msg-body', class: 'label', text: '本文（ここで直してからコピーできます）' }), ta),
        h('div', { class: 'copy-row' },
          h('button', { type: 'button', class: 'btn btn-primary btn-block', onclick: () => copy(ta.value, '本文', err) }, icon('copy'), '本文をコピー'),
          h('button', { type: 'button', class: 'btn btn-block', onclick: () => copy(sub.value, '件名', err) }, icon('copy'), '件名をコピー')));
    }
    pane.replaceChildren(...[
      h('h1', { class: 'screen-title' }, 'お客様に送る文'),
      h('p', { class: 'msg-note', text: `${S.client.name.trim() || 'お客様'}様に送る文の下書きです。ひな形は［設定］で変えられます。` }),
      h('div', { class: 'seg mt', role: 'group', 'aria-label': '送り方' },
        [['line', 'LINE'], ['mail', 'メール（件名つき）']].map(([id, label]) => h('button', {
          type: 'button', class: 'seg-btn', 'aria-pressed': String(ch === id),
          onclick: () => { S.msg.channel = id; V.render(); document.querySelector('#pane-message .seg-btn[aria-pressed="true"]').focus(); }
        }, ch === id ? icon('check') : null, label))),
      ...body,
      err,
      edited ? h('button', { type: 'button', class: 'btn-link mt-s', onclick: () => {
        if (!window.confirm('直した文を消して、ひな形から作り直しますか？')) return;
        S.msg.edited = { line: null, mailSubject: null, mailBody: null };
        V.render();
      } }, 'ひな形から作り直す') : null,
      h('p', { class: 'msg-note', text: 'このアプリからは送りません。コピーして LINE やメールに貼り、［シート］の［PDFにする］で作った PDF をいっしょに送ってください。' })
    ].filter(Boolean));
  };
})();
