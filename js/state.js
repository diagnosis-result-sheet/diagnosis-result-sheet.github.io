/* 画面の状態（見本なので保存しない。開き直すと元に戻る）と、データを引くための関数 */
window.DS = window.DS || {};
(function () {
  const D = DS.data;
  const emptyStyle = (type) => ({ type, off: {}, extra: {}, kufuOff: {}, pos: {} });

  const S = {
    view: 'sheet',
    sampleId: 'minami',
    client: { name: '', date: '' },
    use: { pc: true, kk: true, face: true },
    pc: { season: null, best: {}, worst: {}, tipsOff: {}, scales: {}, face: true },
    kk: emptyStyle(null),   // 骨格
    face: emptyStyle(null), // 顔タイプ診断
    checks: { off: new Set(), extra: [] },
    memo: '',
    custom: [], // 足した診断: { id, name, options: [], use, value, text }
    msg: { channel: 'line', edited: { line: null, mailSubject: null, mailBody: null } },
    settings: {
      salon: D.salon.name, staff: D.salon.staff, contact: D.salon.contact,
      names: { pc: D.pc.name, kk: D.kokkaku.name, face: D.face.name },
      typeNames: {}, typeCatch: {},
      templates: { ...D.templates }
    },
    ui: { settingsPage: null }
  };

  /* タイプごとの Set（タイプを切りかえても、前に選んだものは残る） */
  function setOf(bucket, key) {
    if (!bucket[key]) bucket[key] = new Set();
    return bucket[key];
  }

  const pcType = (id) => D.pc.types.find((t) => t.id === id) || null;
  const season = () => (S.use.pc ? pcType(S.pc.season) : null);
  const typeName = (t) => (t ? (S.settings.typeNames[t.id] || t.name) : '');
  const typeCatch = (t) => (t ? (S.settings.typeCatch[t.id] || t.catch) : '');

  function palette(t) { return t ? t.groups.flatMap((g) => g.colors) : []; }
  function hexOf(t, name) {
    const hit = palette(t).find((c) => c[0] === name);
    return hit ? hit[1] : null;
  }
  /* 特に似合う色（パレットの並び順） */
  function bestList() {
    const t = season();
    if (!t) return [];
    const sel = setOf(S.pc.best, t.id);
    return palette(t).filter((c) => sel.has(c[0]));
  }
  function worstList() {
    const t = season();
    if (!t) return [];
    const sel = setOf(S.pc.worst, t.id);
    return t.worst.filter((c) => sel.has(c[0]));
  }
  function tipsList() {
    const t = season();
    if (!t) return [];
    const off = setOf(S.pc.tipsOff, t.id);
    return t.tips.filter((tip) => !off.has(tip[0]));
  }
  function scalesOf(t) {
    if (!t) return null;
    if (!S.pc.scales[t.id]) S.pc.scales[t.id] = { ...t.scales };
    return S.pc.scales[t.id];
  }

  /* 骨格・顔タイプ診断（同じ形のデータ）: key は 'kk' か 'face' */
  const STYLE_DATA = { kk: () => D.kokkaku, face: () => D.face };
  const styleData = (key) => STYLE_DATA[key]();
  const styleTypeById = (key, id) => styleData(key).types.find((t) => t.id === id) || null;
  const style = (key) => (S.use[key] ? styleTypeById(key, S[key].type) : null);
  const kk = () => style('kk');
  const face = () => style('face');

  function catsOf(key, t) {
    if (!t) return [];
    const extra = S[key].extra[t.id] || {};
    return t.cats.map(([id, name, items]) => ({ id, name, items: [...items, ...(extra[id] || [])] }));
  }
  function catsOn(key, t) {
    if (!t) return [];
    const off = setOf(S[key].off, t.id);
    return catsOf(key, t).map((c) => ({ ...c, items: c.items.filter((it) => !off.has(`${c.id}:${it}`)) })).filter((c) => c.items.length);
  }
  function catsCount(key, t) {
    const all = catsOf(key, t).reduce((n, c) => n + c.items.length, 0);
    const on = catsOn(key, t).reduce((n, c) => n + c.items.length, 0);
    return { all, on };
  }
  function kufuOf(key, t) {
    if (!t) return [];
    const off = setOf(S[key].kufuOff, t.id);
    return t.kufu.filter((k) => !off.has(k[0]));
  }
  /* 顔立ちの位置（タイプの目安から始めて、お客様に合わせて動かせる） */
  function posOf(t) {
    if (!t) return null;
    if (!S.face.pos[t.id]) S.face.pos[t.id] = { ...t.pos };
    return S.face.pos[t.id];
  }

  /* 買い物のチェック: 色から・形から・テイストから・書き足したもの */
  function checkGroups() {
    const groups = [];
    const s = season();
    const k = kk();
    const f = face();
    if (s) groups.push({ id: 'pc', title: `色（${typeName(s)}）`, inputTitle: `色（${typeName(s)}）から`, items: s.checks.map((text) => ({ key: `pc:${s.id}:${text}`, text })) });
    if (k) groups.push({ id: 'kk', title: `形・素材（${typeName(k)}）`, inputTitle: `形・素材（${typeName(k)}）から`, items: k.checks.map((text) => ({ key: `kk:${k.id}:${text}`, text })) });
    if (f) groups.push({ id: 'face', title: `テイスト（${typeName(f)}）`, inputTitle: `テイスト（${typeName(f)}）から`, items: f.checks.map((text) => ({ key: `face:${f.id}:${text}`, text })) });
    if (S.checks.extra.length) groups.push({ id: 'extra', title: 'そのほか', inputTitle: '書き足したもの', items: S.checks.extra.map((text) => ({ key: `extra:${text}`, text })) });
    return groups;
  }
  function checkGroupsOn() {
    return checkGroups().map((g) => ({ ...g, items: g.items.filter((it) => !S.checks.off.has(it.key)) })).filter((g) => g.items.length);
  }

  /* 送る文などで使う「診断の結果」（例: イエベ春・骨格ストレート・顔タイプフレッシュ） */
  function resultLabel() {
    const out = [];
    const s = season();
    const k = kk();
    const f = face();
    if (s) out.push(typeName(s));
    if (k) out.push(`${S.settings.names.kk}${typeName(k)}`);
    if (f) out.push(S.settings.names.face === D.face.name ? `${D.face.prefix}${typeName(f)}` : typeName(f));
    for (const c of S.custom) if (c.use && c.value) out.push(`${c.name}${c.value}`);
    return out.join('・');
  }
  function hasResult() {
    return Boolean(season() || kk() || face() || S.custom.some((c) => c.use && c.value));
  }

  /* 見本のお客様を読み込む（サロンの設定・足した診断の定義は残す） */
  function loadStyle(key, typeId, offList) {
    S[key] = emptyStyle(typeId);
    if (!typeId) return;
    const t = styleTypeById(key, typeId);
    if (!t) { S[key].type = null; return; } // データにないタイプは、選んでいない扱いにする
    for (const [cid, , items] of t.cats) for (const it of items) if ((offList || []).includes(it)) setOf(S[key].off, typeId).add(`${cid}:${it}`);
  }
  function loadSample(id) {
    const smp = D.samples.find((x) => x.id === id) || D.samples[0];
    S.sampleId = smp.id;
    S.client = { name: smp.name, date: smp.date || DS.util.today() };
    S.use = { pc: true, kk: true, face: true };
    S.pc = { season: smp.pc, best: {}, worst: {}, tipsOff: {}, scales: {}, face: true };
    if (smp.pc) {
      smp.best.forEach((n) => setOf(S.pc.best, smp.pc).add(n));
      smp.worst.forEach((n) => setOf(S.pc.worst, smp.pc).add(n));
    }
    loadStyle('kk', smp.kk, smp.kkOff);
    loadStyle('face', smp.face, smp.faceOff);
    S.checks = { off: new Set(), extra: [] };
    S.memo = smp.memo;
    for (const c of S.custom) { c.use = true; c.value = null; c.text = ''; }
    S.msg.edited = { line: null, mailSubject: null, mailBody: null };
    S.dirty = false;
  }

  DS.state = S;
  DS.q = {
    setOf, pcType, season, typeName, typeCatch, palette, hexOf, bestList, worstList, tipsList, scalesOf,
    styleData, style, kk, face, catsOf, catsOn, catsCount, kufuOf, posOf,
    checkGroups, checkGroupsOn, resultLabel, hasResult, loadSample
  };
})();
