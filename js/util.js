/* 部品: 要素をつくる・アイコン・日付・知らせ・コピー */
window.DS = window.DS || {};
(function () {
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* 要素をつくる。文字は textContent で入れる（入力した文字が HTML として動かない。S-18）
     bg は色見本の色（CSSOM で入れるので CSP の style-src 'self' のままでよい） */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    setAttrs(el, attrs);
    append(el, kids);
    return el;
  }
  function svg(tag, attrs, ...kids) {
    const el = document.createElementNS(SVGNS, tag);
    setAttrs(el, attrs);
    append(el, kids);
    return el;
  }
  function setAttrs(el, attrs) {
    if (!attrs) return;
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'text') el.textContent = v;
      else if (k === 'bg') el.style.backgroundColor = v;
      else if (k === 'value') el.value = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  function append(el, kids) {
    for (const kid of kids.flat(Infinity)) {
      if (kid === null || kid === undefined || kid === false) continue;
      el.append(kid instanceof Node ? kid : String(kid));
    }
  }

  /* アイコン（線の太さ・角の形をそろえる。D-15） */
  const ICONS = {
    pencil: ['M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3', 'M13.5 8.5l2 2'],
    sheet: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5', 'M9 13h6', 'M9 17h6'],
    message: ['M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z', 'M8 9h8', 'M8 12h5'],
    sliders: ['M6 4v5', 'M6 13v7', 'M12 4v11', 'M12 19v1', 'M18 4v1', 'M18 9v11', 'M4 11a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M10 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M16 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0'],
    check: ['M5 12l5 5L20 7'],
    plus: ['M12 5v14', 'M5 12h14'],
    copy: ['M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1z', 'M16 9V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3'],
    printer: ['M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2', 'M7 9V4h10v5', 'M7 14h10v7H7z'],
    chevronRight: ['M9 6l6 6-6 6'],
    chevronLeft: ['M15 6l-6 6 6 6'],
    arrowRight: ['M5 12h14', 'M13 6l6 6-6 6']
  };
  function icon(name) {
    const s = svg('svg', { class: 'icon', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    for (const d of ICONS[name] || []) s.append(svg('path', { d }));
    return s;
  }

  /* 日付（2026-09-26 → 2026年9月26日 / 9月26日） */
  function parts(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  }
  function fmtDate(iso) { const p = parts(iso); return p ? `${p[0]}年${p[1]}月${p[2]}日` : ''; }
  function fmtShort(iso) { const p = parts(iso); return p ? `${p[1]}月${p[2]}日` : ''; }
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  let timer = null;
  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  async function copyText(text) {
    try {
      if (!navigator.clipboard || !window.isSecureContext) return false;
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  function uid(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 8)}`; }

  DS.util = { h, svg, icon, fmtDate, fmtShort, today, toast, copyText, uid };
})();
