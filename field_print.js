/* 생산실 일지 출력 v001 · 2026-11-12 00:06
   - 「말로 개선 요청」 왼쪽에 「🖨 일지 출력」 버튼.
   - 고른 날짜의 생산품목(박스·낱개·비상품)과 CCP 입력값(오븐·급냉·배합·금속)만 72mm 영수증(키오스크 kiosk1)으로 출력.
   - 읽기 전용: 일지·CCP·이카운트 자료는 바꾸지 않는다. 이 파일을 지우면 버튼만 사라진다. */
(function () {
  if (!window.FIELD_APP || window.__fieldPrint) return;
  window.__fieldPrint = true;
  const VER = 'v001', BUILT = '2026-11-12 00:06';
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const W = ['일', '월', '화', '수', '목', '금', '토'];
  const has = (r, fs) => fs.some(f => r[f] !== '' && r[f] != null && String(r[f]).trim() !== '');
  const short = n => String(n || '').replace(/^(D|DB|Db)\./, '').replace(/^\[비상품\]\s*/, '').trim();
  const v = x => (x === '' || x == null) ? '-' : E(x);
  const tmin = t => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})/); return m ? (+m[1]) * 60 + (+m[2]) : 9999; };
  const addD = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const todayS = () => (typeof today === 'function' ? today() : addD(new Date().toISOString().slice(0, 10), 0));
  const logs = D => { try { const L = ccpS().logs || {}; const o = {}; ['prod', 'oven', 'freeze', 'mix', 'metal'].forEach(t => { o[t] = L[D + '|' + t] || null; }); return o; } catch (e) { return {}; } };
  const live = g => (g && g.rows || []).filter(r => !(g.del || []).includes(r.id));
  const badOf = (type, sec, r, D) => { try { return ccpRowState(type, sec, r, D).bad || []; } catch (e) { return []; } };
  const signers = rows => { const s = [...new Set(rows.map(r => r.sg).filter(Boolean))]; return s.length ? s.join('·') : ''; };
  const devNote = g => { if (!g) return ''; const a = []; if (g.dev && !/^이탈\s*내용\s*없음$/.test(g.dev.trim())) a.push('<div class="nt">이탈내용: ' + E(g.dev) + '</div>'); if (g.act && !/^특이\s*사항\s*없음$/.test(g.act.trim())) a.push('<div class="nt">개선조치: ' + E(g.act) + '</div>'); return a.join(''); };
  const sec = (title, no, sg, body) => '<div class="sec"><div class="sh"><b>■ ' + title + '</b>' + (no ? '<span>' + no + '</span>' : '') + '</div>' + (sg ? '<div class="sg">기록 ' + E(sg) + '</div>' : '') + body + '</div>';
  const badRow = (b, span) => b.length ? '<tr class="bd"><td colspan="' + span + '">※ 이탈: ' + E(b.join(', ')) + '</td></tr>' : '';

  /* ── 생산품목 ── */
  function prodHtml(D, g) {
    let rows = live(g).filter(r => has(r, ['box', 'ea', 'np'])).map(r => ({ n: short(r.name), box: r.box, ea: r.ea, np: r.np, unit: r.unit }));
    if (!rows.length) { try { const by = ccpProdByDate()[D] || {}; rows = Object.values(by).map(x => ({ n: short(x.name), box: x.ec ? String(Math.round(x.ec * 1000) / 1000) : '', ea: '', np: '' })); } catch (e) {} }
    if (!rows.length) return '';
    const kg = rows.some(r => r.unit === 'kg');
    return sec('생산품목 (' + rows.length + ')', '', '', '<table class="pt"><thead><tr><th class="l">품목</th><th>박스' + (kg ? '/kg' : '') + '</th><th>낱개</th><th>비상품</th></tr></thead><tbody>' +
      rows.map(r => '<tr><td class="l">' + E(r.n) + '</td><td>' + v(r.box) + '</td><td>' + v(r.ea) + '</td><td>' + v(r.np) + '</td></tr>').join('') + '</tbody></table>');
  }
  /* 품목별로 묶기 (처음 나온 순서), 묶음 안은 시각 순 */
  function groups(rows, keyOf) { const m = new Map(); rows.forEach(r => { const k = keyOf(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); }); return [...m.entries()]; }

  /* ── 오븐 가열 ── */
  function ovenHtml(D, g) {
    const rows = live(g).filter(r => has(r, ['time', 'temp', 'min', 'core'])); if (!rows.length) return '';
    const tagOrd = t => t === '시작' ? 0 : t === '종료' ? 2 : 1;
    const body = groups(rows, r => r.code || r.name).map(([, rs]) => {
      rs.sort((a, b) => tmin(a.time) - tmin(b.time) || tagOrd(a.tag) - tagOrd(b.tag));
      return '<div class="pn">' + E(short(rs[0].name)) + '</div><table><thead><tr><th class="l">구분</th><th>시각</th><th>온도℃</th><th>시간분</th><th>품온℃</th></tr></thead><tbody>' +
        rs.map(r => '<tr><td class="l">' + E(r.tag || '') + '</td><td>' + v(r.time) + '</td><td>' + v(r.temp) + '</td><td>' + v(r.min) + '</td><td>' + v(r.core) + '</td></tr>' + badRow(badOf('oven', 'rows', r, D), 5)).join('') + '</tbody></table>';
    }).join('');
    return sec('오븐 가열', 'CCP-1B', signers(rows), body + devNote(g));
  }
  /* ── 급속냉동 ── */
  function freezeHtml(D, g) {
    const rows = live(g).filter(r => has(r, ['t1', 'v1', 't2', 'v2'])); if (!rows.length) return '';
    const dur = r => { const a = tmin(r.t1), b = tmin(r.t2); if (a > 2000 || b > 2000) return '-'; let d = b - a; if (d <= 0) d += 1440; return d >= 60 ? Math.floor(d / 60) + '시간' + (d % 60 ? ' ' + d % 60 + '분' : '') : d + '분'; };
    const body = rows.map(r => '<div class="pn">' + E(short(r.name)) + '</div><table><thead><tr><th>전 시각</th><th>전 ℃</th><th>후 시각</th><th>후 ℃</th></tr></thead><tbody><tr><td>' + v(r.t1) + '</td><td>' + v(r.v1) + '</td><td>' + v(r.t2) + '</td><td>' + v(r.v2) + '</td></tr><tr class="sm"><td colspan="4">급냉 시간 ' + dur(r) + '</td></tr>' + badRow(badOf('freeze', 'rows', r, D), 4) + '</tbody></table>').join('');
    return sec('급속냉동', 'CCP-1B', signers(rows), body + devNote(g));
  }
  /* ── 크림·마늘 배합 ── */
  function mixHtml(D, g) {
    const rows = live(g).filter(r => has(r, ['start', 'kg', 'temp', 'room', 'end'])); if (!rows.length) return '';
    const body = groups(rows, r => r.name).map(([n, rs]) => { rs.sort((a, b) => tmin(a.start) - tmin(b.start));
      return '<div class="pn">' + E(short(n)) + '</div><table><thead><tr><th>시작</th><th>배합kg</th><th>품온℃</th><th>작업장℃</th><th>소진</th></tr></thead><tbody>' +
        rs.map(r => '<tr><td>' + v(r.start) + '</td><td>' + v(r.kg) + '</td><td>' + v(r.temp) + '</td><td>' + v(r.room) + '</td><td>' + v(r.end) + '</td></tr>' + badRow(badOf('mix', 'rows', r, D), 5)).join('') + '</tbody></table>'; }).join('');
    return sec('크림·마늘 배합', 'CCP-1B', signers(rows), body + devNote(g));
  }
  /* ── 금속검출 ── */
  function metalHtml(D, g) {
    const rows = live(g).filter(r => has(r, ['time', 'fe', 'sus', 'p', 'fep', 'susp'])); const pass = (g && g.pass || []).filter(p => has(p, ['passed', 'det']));
    if (!rows.length && !pass.length) return '';
    const kOrd = k => k === 'pre' ? 0 : k === 'post' ? 2 : 1, kNm = r => r.kind === 'pre' ? '작업 전' : r.kind === 'post' ? '작업 후' : '제품';
    const named = {}; rows.forEach(r => { if (r.kind === 'item' && r.code) named[r.code] = r.name; }); pass.forEach(p => { if (p.code && !named[p.code]) named[p.code] = p.name; });
    const gs = groups(rows, r => r.code || '_'); pass.forEach(p => { if (!gs.some(([k]) => k === p.code)) gs.push([p.code, []]); });
    const body = gs.map(([code, rs]) => { rs.sort((a, b) => kOrd(a.kind) - kOrd(b.kind) || tmin(a.time) - tmin(b.time));
      const p = pass.find(x => x.code === code);
      return '<div class="pn">' + E(short(named[code] || (code === '_' ? '공통' : code))) + '</div><table class="mt"><thead><tr><th class="l">구분</th><th>시각</th><th>Fe</th><th>STS</th><th>제품</th><th>Fe+<br>제품</th><th>STS+<br>제품</th></tr></thead><tbody>' +
        rs.map(r => '<tr><td class="l">' + kNm(r) + '</td><td>' + v(r.time) + '</td><td>' + v(r.fe) + '</td><td>' + v(r.sus) + '</td><td>' + (r.kind === 'item' ? v(r.p) : '') + '</td><td>' + (r.kind === 'item' ? v(r.fep) : '') + '</td><td>' + (r.kind === 'item' ? v(r.susp) : '') + '</td></tr>' + badRow(badOf('metal', 'rows', r, D), 7)).join('') +
        (p ? '<tr class="sm"><td colspan="7">통과량 ' + v(p.passed) + ' · 검출량 ' + v(p.det) + '</td></tr>' : '') + '</tbody></table>'; }).join('');
    return sec('금속검출', 'CCP-2P', signers(rows), body + devNote(g));
  }

  const CSS = '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#000}body{width:72mm;padding:1mm 1.5mm 4mm;font-family:"Malgun Gothic","맑은 고딕","Noto Sans KR",sans-serif;font-size:12.5px;line-height:1.3;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact;word-break:keep-all}' +
    '.hd{text-align:center;border-bottom:2px solid #000;padding-bottom:1.5mm;margin-bottom:1mm}.hd .t{font-size:17px;font-weight:900}.hd .d{font-size:19px;font-weight:900;margin-top:.5mm}.hd .s{font-size:11px;font-weight:700}' +
    '.sec{border-bottom:1.5px dashed #000;padding:1.2mm 0 1.5mm}.sh{display:flex;justify-content:space-between;align-items:baseline;background:#000;color:#fff;padding:.6mm 1.2mm;font-size:14px}.sh span{font-size:11px}.sg{font-size:11px;text-align:right;margin:.4mm 0 0}' +
    '.pn{font-size:13.5px;font-weight:900;margin:1.2mm 0 .3mm;border-left:3px solid #000;padding-left:1.2mm}' +
    'table{width:100%;border-collapse:collapse;table-layout:fixed}th{font-size:10.5px;font-weight:700;border-bottom:1px solid #000;padding:.3mm .2mm;text-align:center;line-height:1.15}td{text-align:center;padding:.5mm .2mm;border-bottom:1px dotted #000;font-variant-numeric:tabular-nums;font-size:13px}' +
    'th.l,td.l{text-align:left}.pt td.l{font-size:12.5px;width:52%}.pt th.l{width:52%}.mt td,.mt th{padding-left:0;padding-right:0}.mt th.l,.mt td.l{width:17%}.mt td{font-size:12.5px}' +
    'tr.sm td{font-size:11.5px;text-align:left;border-bottom:0}tr.bd td{text-align:left;font-size:11.5px;font-weight:900;border:1.5px solid #000;padding:.6mm 1mm}' +
    '.nt{font-size:11.5px;margin-top:.8mm;border:1px solid #000;padding:.5mm 1mm}.none{padding:6mm 0;text-align:center;font-size:14px}.ft{font-size:10px;text-align:center;margin-top:1.5mm}';

  function receipt(D) {
    const L = logs(D), wd = W[new Date(D + 'T00:00:00').getDay()], p = D.split('-');
    const parts = [prodHtml(D, L.prod), ovenHtml(D, L.oven), freezeHtml(D, L.freeze), mixHtml(D, L.mix), metalHtml(D, L.metal)].filter(Boolean);
    const now = new Date(), hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const head = '<div class="hd"><div class="t">빵을그리다 생산·CCP 기록</div><div class="d">' + (+p[0]) + '년 ' + (+p[1]) + '월 ' + (+p[2]) + '일 (' + wd + ')</div><div class="s">일지 대조용 · 출력 ' + (now.getMonth() + 1) + '/' + now.getDate() + ' ' + hm + '</div></div>';
    const body = parts.length ? parts.join('') : '<div class="none">이 날짜에 입력된<br>생산·CCP 기록이 없어요</div>';
    return { n: parts.length, html: '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>생산·CCP ' + D + '</title><style id="pg">@page{size:72mm 200mm;margin:0}</style><style>' + CSS + '</style></head><body>' + head + body + '<div class="ft">생산실 일지 출력 ' + VER + '</div></body></html>' };
  }

  /* ── 인쇄: 숨은 틀에 영수증을 넣고 길이에 맞춰 종이 높이를 정한 뒤 인쇄 ── */
  function doPrint(D) {
    const r = receipt(D), f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:80mm;height:10px;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(f);
    const d = f.contentDocument; d.open(); d.write(r.html); d.close();
    setTimeout(() => {
      try {
        const h = Math.ceil(d.body.scrollHeight * 25.4 / 96) + 6;
        d.getElementById('pg').textContent = '@page{size:72mm ' + Math.max(60, h) + 'mm;margin:0}';
        f.contentWindow.focus(); f.contentWindow.print();
      } catch (e) { try { toast('출력하지 못했어요. 다시 눌러 주세요'); } catch (x) {} }
      setTimeout(() => f.remove(), 60000);
    }, 350);
  }

  /* ── 미리보기 창 ── */
  let box = null, cur = '';
  const css = document.createElement('style');
  css.textContent = '#fld .rqbar button[data-fp-open]{background:#FFE066;color:#1f1f1f;border:3px solid #1C5DB8}' +
    '#fpr{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:10px;box-sizing:border-box;font-family:inherit;color:#1b1b1b}' +
    '#fpr .fc{background:#fff;border-radius:16px;width:100%;max-width:640px;max-height:calc(100dvh - 20px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 32px #0005}' +
    '#fpr .ft{padding:14px 16px 10px;border-bottom:2px solid #ddd}#fpr h1{margin:0;font-size:26px;font-weight:900;color:#0D1C42}#fpr .fv{font-size:17px;font-weight:700;color:#333;margin-top:4px}' +
    '#fpr .fd{display:flex;align-items:center;gap:10px;margin-top:10px}#fpr .fd b{flex:1;text-align:center;font-size:26px;font-weight:900}#fpr .fd button{min-height:58px;min-width:96px;font-size:20px;font-weight:900;border:2px solid #999;border-radius:12px;background:#f3f3f3;color:#1b1b1b}#fpr .fd button:disabled{opacity:.35}' +
    '#fpr .fb{flex:1;overflow:auto;background:#e9e9e9;padding:14px;display:flex;justify-content:center}#fpr .paper{background:#fff;box-shadow:0 2px 10px #0003;zoom:1.45}#fpr .paper iframe{display:block;width:72mm;border:0}' +
    '#fpr .fbt{display:flex;gap:12px;padding:12px 16px;border-top:2px solid #ddd}#fpr .fbt button{flex:1;min-height:72px;font-size:24px;font-weight:900;border-radius:12px;border:2px solid #999;background:#fff;color:#1b1b1b}#fpr .fbt button.go{background:#FFE066;border:3px solid #1C5DB8}#fpr .fbt button.go:disabled{opacity:.45}' +
    '#fpr .hint{font-size:17px;font-weight:700;color:#333;padding:0 16px 12px;word-break:keep-all}' +
    '@media(max-width:600px){#fpr .paper{zoom:1.15}#fpr .fd button{min-width:72px;font-size:18px}#fpr .fd b{font-size:21px}#fpr h1{font-size:23px}#fpr .fbt button{font-size:21px}}';
  document.head.appendChild(css);

  function paint() {
    if (!box) return; const r = receipt(cur), t = todayS(), wd = W[new Date(cur + 'T00:00:00').getDay()];
    box.innerHTML = '<div class="fc" role="document"><div class="ft"><h1>🖨 생산·CCP 기록 출력</h1><div class="fv">생산실 일지 출력 ' + VER + ' · 업데이트 ' + BUILT + '</div>' +
      '<div class="fd"><button type="button" data-fp="prev">‹ 전날</button><b>' + cur.slice(5).replace('-', '/') + ' (' + wd + ')' + (cur === t ? ' 오늘' : '') + '</b><button type="button" data-fp="next"' + (cur >= t ? ' disabled' : '') + '>다음날 ›</button></div></div>' +
      '<div class="fb"><div class="paper"><iframe title="출력 미리보기"></iframe></div></div>' +
      '<div class="hint">' + (r.n ? '입력된 값만 나옵니다. 인쇄 창이 뜨면 프린터 「kiosk1」을 확인하고 「인쇄」를 누르세요.' : '이 날짜에는 입력된 기록이 없어 출력할 내용이 없어요.') + '</div>' +
      '<div class="fbt"><button type="button" class="go" data-fp="print"' + (r.n ? '' : ' disabled') + '>🖨 인쇄</button><button type="button" data-fp="close">닫기</button></div></div>';
    const f = box.querySelector('iframe'), d = f.contentDocument; d.open(); d.write(r.html.replace('</head>', '<style>html,body{overflow:hidden}</style></head>')); d.close();
    const fit = () => { try { f.style.height = (d.body.scrollHeight + 2) + 'px'; } catch (e) {} };
    fit(); setTimeout(fit, 80); setTimeout(fit, 400);
  }
  function open() {
    if (box) return; cur = (typeof fldD === 'function' ? fldD() : '') || todayS();
    box = document.createElement('div'); box.id = 'fpr'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '생산·CCP 기록 출력');
    document.body.appendChild(box);
    box.addEventListener('click', ev => { const b = ev.target.closest('[data-fp]'); if (!b) { if (ev.target === box) close(); return; } const a = b.dataset.fp;
      if (a === 'close') return close(); if (a === 'prev') { cur = addD(cur, -1); return paint(); } if (a === 'next') { if (cur < todayS()) { cur = addD(cur, 1); paint(); } return; }
      if (a === 'print') { doPrint(cur); try { toast('인쇄 창을 열었어요'); } catch (e) {} } });
    paint();
  }
  function close() { if (box) box.remove(); box = null; }
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('#fld [data-fp-open]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); open(); }, true);
  document.addEventListener('keydown', ev => { if (box && ev.key === 'Escape') { ev.preventDefault(); close(); } });

  /* ── 버튼 붙이기: 「말로 개선 요청」 바로 왼쪽 (요청 버튼이 없으면 자체 줄) ── */
  const BTN = '<button type="button" data-fp-open="1">🖨 일지 출력</button>';
  const oldHead = fldHead;
  fldHead = function () {
    let h = oldHead.apply(this, arguments);
    const tag = '<button type="button" data-rq-open="1">';
    if (h.includes(tag)) { h = h.replace(tag, BTN + tag).replace(/(<div class="rqbar"><small>[^<]*)(<\/small>)/, '$1 · 일지 출력 ' + VER + ' (' + BUILT.slice(5) + ')$2'); return h; }
    const end = h.lastIndexOf('</div>'); if (end < 0) return h;
    return h.slice(0, end) + '<div class="rqbar"><small>일지 출력 ' + VER + ' · 업데이트 ' + BUILT + '</small>' + BTN + '</div>' + h.slice(end);
  };
  window.fieldPrintReceipt = receipt;   /* 시험용 */
  try { if (typeof fieldRender === 'function') fieldRender(); } catch (e) {}
})();
