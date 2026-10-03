/* 画面の切りかえと、はじめの表示 */
window.DS = window.DS || {};
(function () {
  const { h, icon } = DS.util;
  const S = DS.state;
  const wide = window.matchMedia('(min-width: 960px)');
  const TABS = [
    { id: 'input', label: '入力', pcLabel: '入力とシート', icon: 'pencil' },
    { id: 'sheet', label: 'シート', icon: 'sheet', spOnly: true },
    { id: 'message', label: '送る文', icon: 'message' },
    { id: 'settings', label: '設定', pcLabel: '項目の設定', icon: 'sliders' }
  ];

  function isCurrent(id) {
    if (wide.matches && id === 'input') return S.view === 'input' || S.view === 'sheet';
    return S.view === id;
  }
  function tabBtn(t, label) {
    return h('button', { type: 'button', class: 'tab', 'aria-current': isCurrent(t.id) ? 'page' : null, onclick: () => go(t.id, { focus: true }) },
      icon(t.icon), h('span', { text: label }));
  }
  function buildNav() {
    document.getElementById('tabbar').replaceChildren(...TABS.map((t) => tabBtn(t, t.label)));
    document.getElementById('topnav').replaceChildren(...TABS.filter((t) => !t.spOnly).map((t) => tabBtn(t, t.pcLabel || t.label)));
  }

  function go(view, opts = {}) {
    S.view = view;
    document.body.dataset.view = view;
    if (view === 'message') DS.views.message.render();
    if (view === 'settings') DS.views.settings.render();
    buildNav();
    window.scrollTo(0, 0);
    if (opts.focus) document.getElementById('main').focus({ preventScroll: true });
  }
  function changed(opts = {}) {
    if (opts.input) DS.views.input.render();
    DS.views.sheet.render();
    DS.views.input.refreshCounts();
  }
  function renderAll() {
    DS.views.input.render();
    DS.views.sheet.render();
    if (S.view === 'message') DS.views.message.render();
    if (S.view === 'settings') DS.views.settings.render();
    buildNav();
  }
  DS.app = { go, changed, renderAll };

  // スマホは、できあがりのシートから見せる。PC は入力とシートを並べる
  DS.q.loadSample('minami');
  S.view = wide.matches ? 'input' : 'sheet';
  document.body.dataset.view = S.view;
  renderAll();
  wide.addEventListener('change', buildNav);
})();
