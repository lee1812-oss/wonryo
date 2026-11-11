/* 생산실 앱 「수기 일지 B · K-HACCP 양식」 v001 · 2026-11-12 01:12 (Aside 조조, 사용자 요청 2026-11-12 00:5x)
   왜: 인증원 심사 때 키오스크 단계 화면(A)은 「평소 값이 미리 채워진 화면」으로 보여 신뢰를 못 받을 수 있다.
       그래서 K-HACCP 일지와 같은 표 모양에서 직원이 칸을 하나씩 눌러 직접 입력하는 화면(B)을 따로 둔다.
   - 생산일지 형식을 기기마다 A(기존 단계 입력) / B(수기 일지 · K-HACCP 양식) 중에서 고른다(localStorage wonryo_field_form).
   - B: [D1] 오븐 가열 · [D2] 크림배합 · [D3] 금속검출 · [D4] 급속냉동 일지를 K-HACCP 화면과 같은 칸 순서·용어로 보여 준다.
        칸은 모두 빈칸에서 시작한다(평소 값·자동 시각 없음). 직원이 눌러서 숫자판/O·X로 직접 넣고, 판정·서명도 직접 누른다.
   - 저장 길은 A와 같다(ccpSet → 같은 CCP 일지). 그래서 A·B·PC 화면이 같은 기록을 보고, 조조의 K-HACCP 자동 작성도 그대로 이어진다.
     B에서 넣은 줄에는 fm:'B'(수기 입력 표시), 판정은 jd(직원이 고른 O/X)로 남긴다. 처음 입력 시각(at)·마지막 수정(mt)·서명(sg)은 A와 같다.
   - 기록을 지우거나 덮지 않는다. 이 파일을 빼면 A만 남고 기록은 그대로다. */
(function () {
  if (!window.FIELD_APP || window.__khForm) return;
  window.__khForm = true;
  const VER = 'v001', BUILT = '2026-11-12 01:12';
  const KEY = 'wonryo_field_form';
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isB = () => { try { return localStorage.getItem(KEY) === 'B'; } catch (e) { return false; } };
  const setB = on => { try { localStorage.setItem(KEY, on ? 'B' : 'A'); } catch (e) {} };
  const say = (m, ms) => { try { toast(m, ms || 2600); } catch (e) { alert(m); } };
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const dd = () => { try { return fldD(); } catch (e) { return today(); } };
  const isToday = () => { try { return dd() === today(); } catch (e) { return true; } };
  const wk = () => { try { return fldWk() || ''; } catch (e) { return ''; } };
  const nmD = n => { const s = String(n || '').trim(); return /^(DB|Db|D)\./.test(s) ? 'D.' + s.replace(/^(DB|Db|D)\./, '') : s; };
  const hmNow = () => { const n = new Date(); return String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'); };
  const hmIso = iso => { try { const t = new Date(iso); return isNaN(t) ? '' : String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0'); } catch (e) { return ''; } };
  const mm = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim()); return m && +m[1] < 24 && +m[2] < 60 ? (+m[1]) * 60 + (+m[2]) : null; };
  const ampm = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim()); if (!m) return String(t || ''); const h = +m[1]; return (h < 12 ? '오전 ' : '오후 ') + String(h % 12 === 0 ? 12 : h % 12).padStart(2, '0') + ':' + m[2]; };
  const blank = v => v === '' || v == null || String(v).trim() === '';

  /* ── K-HACCP 일지 양식 (2026-11-12 K-HACCP 작성 화면에서 그대로 옮김: [D1] 1203 · [D2] 1225 · [D3] 1204 · [D4] 1224) ── */
  const NAME = { f: 'name', lb: '품명', k: 'name' }, JD = { f: 'jd', lb: '판정', k: 'jd', pl: '판정' }, SG = { f: 'sg', lb: '서명', k: 'sg', pl: '서명' };
  const T = {
    oven: { no: 'D1', ccp: 'CCP-1B', nm: '오븐 가열공정', ico: '🔥',
      cols: [NAME, { f: 'time', lb: '측정시간', k: 'time', pl: '측정시간' }, { f: 'temp', lb: '가열온도<br>(판넬온도)(℃)', k: 'num', u: '℃', pl: '가열온도(판넬온도)' }, { f: 'min', lb: '가열시간(분)', k: 'num', u: '분', pl: '가열시간' }, { f: 'core', lb: '품온 (℃)', k: 'num', u: '℃', pl: '품온' }, JD, SG],
      sub: '[오븐 가열공정] <span class="r">2026.3.13. 제품추가(2종)</span><br><span class="r">구운쌀소금빵, 구운통밀소금빵</span>',
      lim: [['빅몽블랑', '155±3℃', '27분±3분', '85℃ ∼ 99℃'], ['몽블랑', '155±3℃', '27분±3분', '85℃ ∼ 99℃'], ['구운크라상78', '170±3℃', '15분±3분', '85℃ ∼ 99℃'], ['빅크로와상', '170±3℃', '15분±3분', '85℃ ∼ 99℃'], ['빵을그리다 K1', '170±3℃', '15분±3분', '85℃ ∼ 99℃'], ['구운냉동소금빵', '170±3℃', '15분±3분', '85℃ ∼ 99℃'], ['구운 쌀 소금빵', '170±3℃', '15분±3분', '85℃ ∼ 99℃'], ['구운 통밀 소금빵', '170±3℃', '15분±3분', '85℃ ∼ 99℃']],
      cyc: '작업시작시, 작업 이후 2시간 마다, 품목 변경시 마다, 작업 종료 후',
      how: '○ 가열온도 · 가열시간 · 품온 : 모니터링 담당자는 육안 확인한 후 일지에 기록한다.<br>※ 가열기 온도계/타이머는 연 1회 검·교정을 실시한다.',
      act: '○ 가열온도 또는 가열시간 미달 시<br>- 모니터링 담당자는 한계기준 이탈시 즉시 작업을 중지한다.<br>- 가열온도와 가열시간을 재조정한 후 미달된 제품에 대해 재가열을 실시하고 제품검사(관능 등)를 실시하여 이상이 없는 경우 다음 공정을 진행한다.<br>- 한계기준 이탈내용과 개선조치 내용을 모니터링 일지에 기록한다.<br>○ 가열온도 또는 가열시간 초과 시<br>- 모니터링 담당자는 한계기준 이탈시 즉시 작업을 중지한다.<br>- 제품검사(관능 등)를 실시하여 이상이 없는 경우 다음공정을 진행한다.<br>- 한계기준 이탈내용과 개선조치 내용을 모니터링 일지에 기록한다.<br>○ 기계고장 시<br>- 모니터링 담당자는 가열기 등 기계고장 시 즉시 작업을 중지한다.<br>- 수리 후 정상적으로 작동 시 재가동한다.<br>※ 즉각적인 수리가 불가능할 경우 교차오염이 되지 않도록 보호조치하여 보관한 후, 수리가 끝나면 제품 생산을 계속한다.<br>○ 공통 : 개선조치 시<br>- 문제 발생 시 HACCP팀장에게 보고 후 조치하며, 개선조치 후 모니터링 일지에 기록 후 HACCP팀장에게 승인을 받는다.' },
    mix: { no: 'D2', ccp: 'CCP-1B', nm: '크림배합공정', ico: '🥣',
      cols: [NAME, { f: 'start', lb: '보관시작<br>시간', k: 'time', pl: '보관시작 시간(배합 시각)' }, { f: 'kg', lb: '배합량(kg)', k: 'num', u: 'kg', pl: '배합량' }, { f: 'temp', lb: '품온(℃)', k: 'num', u: '℃', pl: '품온' }, { f: 'room', lb: '작업장온도(℃)', k: 'num', u: '℃', pl: '작업장온도' }, { f: 'end', lb: '소진시간', k: 'time', pl: '소진시간(다 쓴 시각)' }, JD, SG],
      sub: '[크림배합공정]',
      act: '◌ 시간 미달 시<br>1. 모니터링 담당자는 한계기준 이탈시 즉시 작업을 중지한다.<br>2. 배합을 재실시하고 제품검사(관능) 이상이 없을 시 다음공정을 진행하고, 이상이 있을 경우 전량 폐기한다<br>3. 이전 모니터링 이후 생산된 제품에 대하여 제품(관능)검사를 실시하여 이상이 있을 시 전량 폐기한다.<br>4. 한계기준 이탈내용과 개선조치 내용을 모니터링 일지에 기록<br>◌ 배합 온도, 시간 초과 시<br>1. 모니터링 담당자는 한계기준 이탈시 즉시 작업을 중지한다.<br>2. 제품(관능)검사를 실시하여 이상이 없을 시 다음 공정을 진행하며 한다.<br>3. 한계기준 이탈내용과 개선조치 내용을 모니터링 일지에 기록<br>◌ 기계고장 시<br>1. 모니터링 담당자는 가열기 등 기계고장 시 즉시 작업을 중지한다.<br>2. 수리 후 정상적으로 작동 시 재가동한다.<br>☆ 즉각적인 수리가 불가능할 경우 교차오염이 되지 않도록 보호 조치하여 즉시 생산을 중단한다.<br>◌ 공통 : 개선조치 시<br>1. 문제 발생 시 HACCP팀장에게 보고 후 조치하며, 개선조치 후 모니터링 일지에 기록 후 HACCP팀장에게 승인을 받는다.' },
    metal: { no: 'D3', ccp: 'CCP-2P', nm: '빵류 금속검출공정', ico: '🧲',
      cols: [NAME, { f: 'time', lb: '통과시간', k: 'time', pl: '통과시간' }, { f: 'fe', lb: 'FE만<br>통과', k: 'ox', pl: 'FE만 통과', good: 'O' }, { f: 'sus', lb: 'SUS만<br>통과', k: 'ox', pl: 'SUS만 통과', good: 'O' }, { f: 'p', lb: '제품만<br>통과', k: 'ox', pl: '제품만 통과', good: 'X', item: 1 }, { f: 'fep', lb: 'FE+<br>제품통과', k: 'ox', pl: 'FE+제품 통과', good: 'O', item: 1 }, { f: 'susp', lb: 'SUS+<br>제품통과', k: 'ox', pl: 'SUS+제품 통과', good: 'O', item: 1 }, JD, SG],
      sub: '[빵류 금속검출공정]',
      how: '○ 기기감도 : 모니터링담당자는 기기 중간에 Test piece를 통과시켜 검출여부를 확인하고 일지에 기록한다.<br>○ 제품감도 : 모니터링담당자는 제품 중간에 Test piece를 넣고 기기에 통과시켜 검출여부를 확인하고 일지에 기록한다.<br>○ 통과량 및 검출량 : 모니터링담당자는 통과된 양과 검출된 양을 일지에 기록하고 HACCP팀장에 보고한다.<br>※ 금속검출기는 연1회 이상 정상작동 유무 확인',
      act: '○ 기기감도 : 모니터링담당자는 기기 중간에 Test piece를 통과시켜 검출여부를 확인하고 일지에 기록한다.<br>○ 제품감도 : 모니터링담당자는 제품 중간에 Test piece를 넣고 기기에 통과시켜 검출여부를 확인하고 일지에 기록한다.<br>○ 통과량 및 검출량 : 모니터링담당자는 통과된 양과 검출된 양을 일지에 기록하고 HACCP팀장에 보고한다.<br>※ 금속검출기는 연1회 이상 정상작동 유무 확인' },
    freeze: { no: 'D4', ccp: 'CCP-1B', nm: '급속냉동공정', ico: '❄️',
      cols: [NAME, { f: 't1', lb: '측정시간', k: 'time', pl: '급냉 전 측정시간' }, { f: 'v1', lb: '급냉실 온도', k: 'num', u: '℃', neg: 1, pl: '급냉 전 급냉실 온도' }, { f: 't2', lb: '측정시간', k: 'time', pl: '급냉 후 측정시간' }, { f: 'v2', lb: '급냉실 온도', k: 'num', u: '℃', neg: 1, pl: '급냉 후 급냉실 온도' }, Object.assign({}, JD, { lb: '판정<br>(적합/부적합)' }), SG],
      sub: '[급속냉동공정] <span class="r">2025.11.11. 한계기준변경(시간변경)</span>',
      act: '○ 급냉온도 또는 급냉시간 미달 시<br>- 모니터링 담당자는 한계기준 이탈시 즉시 작업을 중지한다.<br>- 급냉온도와 급냉시간을 재조정한 후 미달된 제품에 대해 급냉을 재실시하고 제품검사(관능 등)를 실시하여 이상이 없는 경우 다음 공정을 진행한다.<br>- 한계기준 이탈내용과 개선조치 내용을 모니터링 일지에 기록한다.<br>○ 급냉온도 또는 급냉시간 초과 시<br>- 모니터링 담당자는 한계기준 이탈시 즉시 작업을 중지한다.<br>- 제품검사(관능 등)를 실시하여 이상이 없는 경우 다음공정을 진행한다.<br>- 한계기준 이탈내용과 개선조치 내용을 모니터링 일지에 기록한다.<br>○ 기계고장 시<br>- 모니터링 담당자는 가열기 등 기계고장 시 즉시 작업을 중지한다.<br>- 수리 후 정상적으로 작동 시 재가동한다.<br>※ 즉각적인 수리가 불가능할 경우 교차오염이 되지 않도록 보호조치하여 냉동창고에 보관한 후, 수리가 끝나면 제품 생산을 계속한다.<br>○ 공통 : 개선조치 시<br>- 문제 발생 시 HACCP팀장에게 보고 후 조치하며, 개선조치 후 모니터링 일지에 기록 후 HACCP팀장에게 승인을 받는다.' }
  };
  const ORDER = ['oven', 'mix', 'metal', 'freeze'];
  const ST = { view: 'home', type: '', code: '', sel: '', back: false };

  /* ── 자료 ── */
  const logOf = type => { try { return fldLog(type) || null; } catch (e) { return null; } };
  const live = g => { const del = new Set((g && g.del) || []); return ((g && g.rows) || []).filter(r => !del.has(r.id)); };
  function mixTitle(g) { const ns = []; ((g && g.items) || []).forEach(c => { try { const it = prodItem(c); if (it && it.name && !/배합/.test(it.name)) ns.push(nmD(it.name)); } catch (e) {} }); return ns.length ? ns.join(', ') : '크림·마늘 배합'; }
  function prods(type, g) {
    if (!g) return [];
    if (type === 'mix') return live(g).length ? [{ code: '*', name: mixTitle(g) }] : [];
    const m = new Map(); const add = (c, n) => { if (c && !m.has(c)) m.set(c, { code: c, name: n || c }); };
    if (type === 'metal') (g.pass || []).forEach(p => add(p.code, p.name));
    live(g).forEach(r => { if (type === 'metal' && r.kind !== 'item') return; add(r.code, r.name); });
    return [...m.values()];
  }
  const ordTag = t => t === '시작' ? 0 : t === '종료' ? 2 : 1;
  function rowsOf(type, g, p) {
    if (!g || !p) return [];
    if (type === 'mix') return live(g);
    if (type === 'oven') return live(g).filter(r => r.code === p.code).map((r, i) => ({ r, i })).sort((a, b) => ordTag(a.r.tag) - ordTag(b.r.tag) || ((mm(a.r.time) ?? 9999) - (mm(b.r.time) ?? 9999)) || a.i - b.i).map(x => x.r);
    if (type === 'freeze') return live(g).filter(r => r.code === p.code);
    /* 금속: 품목마다 작업 전 · 제품(작업중) · 작업 후 (K-HACCP와 같은 3줄) */
    let x = null; try { x = window.__fm3 && __fm3.rowsFor ? __fm3.rowsFor(p.code) : null; } catch (e) { x = null; }
    if (!x) { const rs = live(g); const pick = k => rs.find(r => r.kind === k && r.code === p.code) || rs.find(r => r.kind === k && !r.code && r.time) || null; const its = rs.filter(r => r.kind === 'item' && r.code === p.code); x = { pre: pick('pre'), post: pick('post'), item: its.find(r => r.time) || null, tmpl: its.find(r => !r.time) || null }; }
    const v = k => ({ id: 'v:' + k + ':' + p.code, kind: k, code: p.code, name: k === 'pre' ? '작업 전' : k === 'post' ? '작업 후' : p.name, virt: 1 });
    return [x.pre || v('pre'), x.item || x.tmpl || v('item'), x.post || v('post')];
  }
  const colsFor = (type, r) => T[type].cols.filter(c => !(type === 'metal' && c.item && r.kind !== 'item'));
  const needCols = (type, r) => colsFor(type, r).filter(c => c.k !== 'name' && c.k !== 'sg');
  function rowBad(type, r) { try { return (ccpRowState(type, 'rows', r, dd()).bad) || []; } catch (e) { return []; } }
  function limTxt(type, r, c) {
    const D = dd(); let L = {}; try { L = ccpLimAt(D) || {}; } catch (e) {}
    if (type === 'oven') { let OL = null; try { OL = ccpOvenLimit(r.name, D); } catch (e) {} if (!OL) return ''; if (OL.none && /temp|min/.test(c.f)) return '기준표에 없는 제품 — HACCP팀장 확인'; return c.f === 'temp' ? '기준 ' + OL.t + '±' + OL.tt + '℃' : c.f === 'min' ? '기준 ' + OL.m + '±' + OL.mt + '분' : c.f === 'core' ? '기준 ' + (OL.core[1] >= 999 ? OL.core[0] + '℃ 이상' : OL.core[0] + '℃ ∼ ' + OL.core[1] + '℃') : ''; }
    if (type === 'freeze') return /v/.test(c.f) ? '기준 -30℃ ~ -35℃' : '급냉 시간 1시간 ~ 24시간 이내';
    if (type === 'mix') return c.f === 'kg' ? '기준 ' + ((L.mixKg || [10, 50]).join('kg~')) + 'kg' : c.f === 'temp' ? '기준 10℃±5 ~ 20℃±5' : c.f === 'room' ? '기준 ' + (L.room || 24) + '℃ 이하' : c.f === 'end' ? '제조 후 2시간 이내' : '';
    if (type === 'metal') return c.k === 'ox' ? (c.good === 'O' ? '정상: O (검출)' : '정상: X (불검출)') : '';
    return '';
  }
  function typo(type, f, v) {
    const n = parseFloat(v); if (isNaN(n)) return '';
    if (type === 'oven') { if (f === 'temp' && (n < 80 || n > 300)) return '가열온도 ' + v + '℃ — 자릿수를 확인하세요'; if (f === 'min' && (n <= 0 || n > 180)) return '가열시간 ' + v + '분 — 자릿수를 확인하세요'; if (f === 'core' && (n < 30 || n > 150)) return '품온 ' + v + '℃ — 자릿수를 확인하세요'; }
    if (type === 'freeze' && (n < -60 || n > 30)) return '급냉실 온도 ' + v + '℃ — 자릿수를 확인하세요';
    if (type === 'mix') { if (f === 'kg' && (n <= 0 || n > 200)) return '배합량 ' + v + 'kg — 자릿수를 확인하세요'; if ((f === 'temp' || f === 'room') && (n < -10 || n > 60)) return v + '℃ — 자릿수를 확인하세요'; }
    return '';
  }

  /* ── 쓰기: A와 같은 저장 길(ccpSet). 줄에 fm:'B'(수기 입력)와 서명(sg)을 남김 ── */
  function realRow(type, g, r, p) {
    if (!r.virt) return r;
    if (type !== 'metal') return null;
    try { if (window.__fm3 && __fm3.writeRow) { if (!__fm3.writeRow(r.kind, { code: p.code, name: p.name }, '', {})) return null; const rs = rowsOf(type, logOf(type), p); return rs.find(x => x.kind === r.kind && !x.virt) || null; } } catch (e) {}
    /* 예비: 같은 모양으로 직접 만듦 */
    const nr = { id: (r.kind === 'item' ? 'm:' + p.code + ':' : 'm:' + r.kind + ':' + p.code + ':') + Date.now().toString(36), kind: r.kind, code: p.code, name: r.kind === 'item' ? p.name : r.name, time: '', fe: '', sus: '' };
    if (r.kind === 'item') Object.assign(nr, { p: '', fep: '', susp: '' });
    const post = g.rows.findIndex(x => x.kind === 'post' && x.code === p.code);
    if (r.kind === 'pre') { const it = g.rows.findIndex(x => x.code === p.code); g.rows.splice(it < 0 ? g.rows.length : it, 0, nr); } else if (r.kind === 'item' && post >= 0) g.rows.splice(post, 0, nr); else g.rows.push(nr);
    return nr;
  }
  function setCell(type, r, f, v, p) {
    const who = wk(); if (!who) { pickWho(n => { try { fldSetWk(n); } catch (e) {} setCell(type, r, f, v, p); }); return false; }
    const g = logOf(type); if (!g) { say('일지를 찾지 못했습니다 — 「CCP 제품 선택」을 먼저 하세요'); return false; }
    const row = realRow(type, g, r, p); if (!row) { say('줄을 만들지 못했습니다. 다시 눌러 주세요'); return false; }
    const i = g.rows.indexOf(row); if (i < 0) { say('줄을 찾지 못했습니다. 다시 눌러 주세요'); return false; }
    if (f !== 'sg') row.sg = row.sg && f === 'jd' ? row.sg : who;
    row.fm = 'B';
    /* 칸마다 입력한 시각(ft) — 판정·서명을 나중에 눌러도 「몰아서 적음」으로 잘못 보이지 않게, 측정값 칸만 */
    if (!/^(jd|sg|note)$/.test(f)) row.ft = Object.assign({}, row.ft || {}, { [f]: new Date().toISOString() });
    const res = ccpSet(dd() + '|' + type + '|rows|' + i + '|' + f, v);
    if (!res) { say('저장하지 못했습니다. 다시 눌러 주세요'); return false; }
    return row;
  }
  function setLog(type, f, v) { const g = logOf(type); if (!g) return false; ccpSet(dd() + '|' + type + '|log|0|' + f, v); return true; }
  function setPass(code, f, v) { const g = logOf('metal'); if (!g) return false; const i = (g.pass || []).findIndex(x => x.code === code); if (i < 0) return false; ccpSet(dd() + '|metal|pass|' + i + '|' + f, v); return true; }

  /* ── 화면: 덮개(헤더 아래 전체) ── */
  const st = document.createElement('style');
  st.textContent = [
    '.khb{position:fixed;left:0;right:0;bottom:0;z-index:9000;background:#E9ECF1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;font-family:"Malgun Gothic","맑은 고딕","Noto Sans KR",sans-serif;color:#111;word-break:keep-all;overflow-wrap:break-word}',
    '.khb *{box-sizing:border-box}',
    '.khb .kw{max-width:1180px;margin:0 auto;padding:14px 14px 120px}',
    '.khb .ksw{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:2px solid #CBD3DF;border-radius:16px;padding:10px 12px;margin-bottom:12px}',
    '.khb .ksw b.t,.khsw b.t{font-size:18px;color:#1F2A44;margin-right:4px}',
    '.ksw button,.khsw button{min-height:58px;padding:6px 18px;border-radius:14px;border:2px solid #9AA7BA;background:#F4F6F9;color:#1F2A44;font-size:19px;font-weight:800;cursor:pointer;line-height:1.2}',
    '.ksw button.on,.khsw button.on,.ksw button.on small,.khsw button.on small{background:#1F4E99;border-color:#1F4E99;color:#fff!important}',
    '.ksw button:not(.on) small,.khsw button:not(.on) small{color:#333!important}',
    '.khb .nw{white-space:nowrap}',
    '.ksw button small,.khsw button small{display:block;font-size:14px;font-weight:700;opacity:.95}',
    '.khsw{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:2px solid #CBD3DF;border-radius:16px;padding:10px 12px;margin:0 0 12px;font-family:inherit}',
    '.khb .kcard{background:#fff;border-radius:22px;padding:18px 18px 22px;box-shadow:0 2px 10px rgba(0,0,0,.08)}',
    '.khb .kh1{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:2px 0 12px}',
    '.khb .kh1 h2{flex:1 1 auto;margin:0;font-size:30px;font-weight:700;color:#111}',
    '.khb .kh1 h2:before{content:"▶";display:inline-block;background:#111;color:#fff;font-size:16px;border-radius:3px;padding:2px 6px;margin-right:10px;vertical-align:5px}',
    '.khb .kbtn{min-height:58px;padding:6px 18px;border-radius:14px;border:2px solid #1F4E99;background:#fff;color:#1F4E99;font-size:19px;font-weight:800;cursor:pointer}',
    '.khb .kbtn.pri{background:#1F4E99;color:#fff}',
    '.khb .kbtn.y{background:#FFE066;border-color:#1F4E99;color:#111}',
    '.khb .kmeta{font-size:18px;color:#222;font-weight:700;margin:0 0 10px}',
    '.khb .kmeta b{color:#1F4E99}',
    /* 일지 목록 */
    '.khb .klist{width:100%;border-collapse:collapse;font-size:19px}',
    '.khb .klist th{background:#C5D9F1;border:1px solid #6D7F99;padding:10px 8px;font-weight:700}',
    '.khb .klist td{border:1px solid #6D7F99;padding:10px 8px;text-align:center;background:#fff}',
    '.khb .klist td.l{text-align:left;font-weight:700}',
    '.khb .klist tr.go td{cursor:pointer}',
    '.khb .klist tr.go:active td{background:#FFF3BF}',
    '.khb .lab{display:inline-block;padding:4px 10px;border-radius:8px;font-weight:800;font-size:17px;white-space:nowrap}',
    '.khb .lab.no{background:#FFE3E3;color:#B00020;border:1px solid #B00020}',
    '.khb .lab.ing{background:#FFF0D6;color:#8A4B00;border:1px solid #B35C00}',
    '.khb .lab.ok{background:#E3F6E8;color:#1B5E20;border:1px solid #1B5E20}',
    '.khb .lab.bad{background:#B00020;color:#fff}',
    '.khb .klinks{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}',
    '.khb .klinks .kbtn{width:100%;text-align:left;padding:12px 18px}',
    '.khb .klinks .kbtn small{display:block;font-size:15px;font-weight:700;color:#333;margin-top:2px}',
    '.khb .kreq{margin-top:14px;padding:14px 16px;border-radius:16px;background:#EAF2FF;border:2px solid #1F4E99}',
    '.khb .kreq .kbtn{width:100%}',
    '.khb .kreq p{margin:8px 0 0;font-size:17px;font-weight:700;color:#1F2A44}',
    '.khb .knote{margin-top:14px;font-size:17px;line-height:1.6;color:#222;background:#F7F8FA;border-radius:14px;padding:12px 16px}',
    /* 결재 칸 */
    '.khb .kap{border-collapse:collapse;font-size:16px;margin-left:auto}',
    '.khb .kap td{border:1px solid #555;padding:4px 10px;text-align:center;min-width:92px;background:#fff}',
    '.khb .kap td.h{background:#F1F3F5;font-weight:700}',
    '.khb .kap td.big{writing-mode:horizontal-tb;font-weight:700;font-size:18px;min-width:60px}',
    '.khb .kap td.nm{height:54px;font-weight:800;font-size:18px}',
    '.khb .kap td.nm.wait{color:#8A4B00}',
    /* 품목 탭 */
    '.khb .ktabs{display:flex;gap:0;border-bottom:2px solid #1F6FD1;margin:14px 0 14px;overflow-x:auto}',
    '.khb .ktabs button{min-height:60px;padding:8px 22px;border:1px solid #D0D7E2;border-bottom:0;background:#fff;color:#555;font-size:19px;font-weight:700;cursor:pointer;white-space:nowrap;border-radius:10px 10px 0 0}',
    '.khb .ktabs button.on{background:#1F6FD1;color:#fff;border-color:#1F6FD1}',
    /* 일지 종이 */
    '.khb .kp{border:2px solid #111;background:#fff;font-size:18px}',
    '.khb .kp .bar{display:flex;height:22px}.khb .kp .bar i{flex:3;background:#E6B8B7}.khb .kp .bar i+i{flex:1;background:#F2453D}',
    '.khb .kp table{width:100%;border-collapse:collapse;table-layout:fixed}',
    '.khb .kp td,.khb .kp th{border:1px solid #333;padding:6px 6px;text-align:center;vertical-align:middle;font-weight:400}',
    '.khb .kp .hd{background:#C5D9F1}',
    '.khb .kp .ttl{background:#C5D9F1;text-align:center;font-size:28px;font-weight:700;padding:10px 6px 2px;border:0}',
    '.khb .kp .stl{background:#C5D9F1;text-align:right;font-size:20px;padding:0 8px 8px;border:0}',
    '.khb .kp .r{color:#E03131}',
    '.khb .kp .tl{text-align:left;line-height:1.55;font-size:17px;padding:8px 10px}',
    '.khb .kp .gap{height:18px;border-left:0;border-right:0}',
    '.khb .kdt th{background:#C5D9F1;font-size:17px;line-height:1.25;padding:8px 4px}',
    '.khb .kdt td{height:66px;padding:4px}',
    '.khb .kc{display:flex;align-items:center;justify-content:center;width:100%;min-height:56px;padding:4px 6px;border-radius:8px;border:2px dashed #1F6FD1;background:#F3F8FF;color:#1F4E99;font-size:20px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1.2}',
    '.khb .kc.v{border:2px solid transparent;background:transparent;color:#111;font-weight:600}',
    '.khb .kc.v:active,.khb .kc:active{background:#FFF3BF}',
    '.khb .kc.bad{background:#FFE3E3;color:#B00020;border-color:#B00020;font-weight:800}',
    '.khb .kc.na{border:0;background:transparent;color:#111;cursor:default}',
    '.khb .kc.nm{justify-content:center;border:2px solid transparent;background:transparent;color:#333;font-size:18px;font-weight:600;cursor:pointer}',
    '.khb tr.sel td{background:#FFF3BF}',
    '.khb .kc .tm{margin-left:4px;font-size:14px}',
    '.khb .kc.t{white-space:nowrap;font-size:18px;padding:4px 2px}',
    '.khb .krow{display:flex;justify-content:flex-end;gap:10px;margin:10px 0 0;flex-wrap:wrap}',
    '.khb .krow button{min-height:56px;padding:6px 18px;border-radius:28px;border:1px solid #CBD3DF;background:#fff;font-size:18px;font-weight:800;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.12)}',
    '.khb .krow .add b{color:#2B8A3E}.khb .krow .del b{color:#E03131}',
    '.khb .kdv{display:block;width:100%;min-height:56px;padding:6px 8px;border:2px dashed #1F6FD1;border-radius:8px;background:#F3F8FF;color:#111;font-size:18px;cursor:pointer;font-family:inherit;line-height:1.4}',
    '.khb .kdv.v{border-style:solid;border-color:transparent;background:transparent}',
    '.khb .kmsg{margin:10px 0 0;padding:10px 14px;border-radius:12px;font-size:18px;font-weight:700;line-height:1.5}',
    '.khb .kmsg.bad{background:#FFE3E3;color:#8B0000;border:2px solid #B00020}',
    '.khb .kmsg.info{background:#EAF2FF;color:#1F2A44;border:2px solid #8DB4EA}',
    '.khb .klog{margin-top:16px;font-size:16px;line-height:1.6;background:#F7F8FA;border-radius:14px;padding:12px 16px}',
    '.khb .klog summary{font-size:18px;font-weight:800;cursor:pointer;min-height:44px;display:flex;align-items:center}',
    '.khb .klog li{margin:2px 0}',
    '.khb .kcap{font-size:18px;font-weight:700;text-align:center;padding:8px;background:#fff}',
    /* 입력 창 */
    '.khp-bg{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:12px;font-family:"Malgun Gothic","Noto Sans KR",sans-serif}',
    '.khp{width:min(560px,100%);max-height:96vh;overflow:auto;background:#fff;border-radius:22px;padding:18px 18px 16px;box-shadow:0 10px 40px rgba(0,0,0,.35);color:#111}',
    '.khp h3{margin:0;font-size:22px;line-height:1.35}',
    '.khp .sub{margin:4px 0 0;font-size:18px;font-weight:700;color:#1F4E99}',
    '.khp .dsp{margin:12px 0;min-height:76px;border:3px solid #1F4E99;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:800;letter-spacing:1px;background:#F3F8FF}',
    '.khp .dsp small{font-size:22px;margin-left:8px;font-weight:700}',
    '.khp .dsp.empty{color:#555;font-size:24px}',
    '.khp .pad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}',
    '.khp .pad button,.khp .act button,.khp .ox button,.khp .who button,.khp .chips button{min-height:68px;border-radius:14px;border:2px solid #9AA7BA;background:#fff;font-size:28px;font-weight:800;cursor:pointer;color:#111;font-family:inherit}',
    '.khp .pad button:active,.khp .ox button:active{background:#FFF3BF}',
    '.khp .act{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}',
    '.khp .act button{font-size:21px}',
    '.khp .act .ok{background:#1F4E99;color:#fff;border-color:#1F4E99}',
    '.khp .now{width:100%;margin:0 0 10px;min-height:64px;border-radius:14px;border:2px solid #2B8A3E;background:#E3F6E8;color:#1B5E20;font-size:21px;font-weight:800;cursor:pointer}',
    '.khp .ox{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0 4px}',
    '.khp .ox button{min-height:120px;font-size:52px;line-height:1.1}',
    '.khp .ox button small{display:block;font-size:19px;font-weight:700;margin-top:6px}',
    '.khp .ox button.on{border-color:#1F4E99;background:#EAF2FF;box-shadow:0 0 0 3px #1F4E99 inset}',
    '.khp .who{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}',
    '.khp .who button{font-size:22px}',
    '.khp .who button.on{border-color:#1F4E99;background:#EAF2FF}',
    '.khp textarea{width:100%;min-height:120px;margin-top:12px;font-size:20px;padding:10px;border:2px solid #1F4E99;border-radius:12px;font-family:inherit}',
    '.khp .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
    '.khp .chips button{min-height:54px;font-size:18px;padding:4px 14px}',
    '.khp .warn{margin-top:10px;padding:10px 12px;border-radius:12px;background:#FFE3E3;color:#8B0000;border:2px solid #B00020;font-size:18px;font-weight:800;line-height:1.45}',
    '.khp .hint{margin-top:8px;font-size:16px;font-weight:700;color:#333}',
    '.khb-back{position:fixed;left:12px;bottom:12px;z-index:8990;min-height:60px;padding:8px 20px;border-radius:30px;border:3px solid #fff;background:#1F4E99;color:#fff;font-size:19px;font-weight:800;box-shadow:0 4px 16px rgba(0,0,0,.35);cursor:pointer;font-family:inherit}',
    '@media (max-width:760px){.khb .kh1 h2{font-size:22px}.khb .kp{font-size:15px}.khb .kdt th{font-size:13px}.khb .kc{font-size:16px;min-height:52px}.khb .klinks{grid-template-columns:1fr}.khb .kp .ttl{font-size:21px}.khb .kp .stl{font-size:15px}.khb .kp .tl{font-size:14px}}'
  ].join('\n');
  document.head.appendChild(st);

  let box = null, backBtn = null, lastSig = '';
  function ensureBox() { if (box && document.body.contains(box)) return box; box = document.createElement('div'); box.className = 'khb'; box.id = 'khb'; box.style.display = 'none'; document.body.appendChild(box); return box; }
  function topY() { try { const t = document.querySelector('#fld .fld-top'); if (!t) return 0; const r = t.getBoundingClientRect(); return Math.max(0, Math.round(r.bottom)); } catch (e) { return 0; } }
  const sig = () => { try { const L = ccpS().logs, d = dd(); return [d, wk(), ST.view, ST.type, ST.code, ST.sel].join('|') + '|' + ORDER.map(t => { const g = L[d + '|' + t]; return g ? (g.ts || '') + ':' + (g.rows || []).length + ':' + (g.del || []).length + ':' + (g.apAt || '') + ':' + (g.dev || '').length + ':' + (g.act || '').length : '-'; }).join(','); } catch (e) { return String(Math.random()); } };
  const wantShow = () => { try { return isB() && FLD.open && FLD.step === 'home'; } catch (e) { return false; } };

  function swHtml(b) { return '<div class="' + (b ? 'ksw' : 'khsw') + '"><b class="t">생산일지 형식</b>'
    + '<button type="button" data-kbsw="A" class="' + (b ? '' : 'on') + '">A 단계 입력<small>지금까지 쓰던 화면</small></button>'
    + '<button type="button" data-kbsw="B" class="' + (b ? 'on' : '') + '">B 수기 일지<small>K-HACCP 일지와 같은 양식</small></button></div>'; }

  function dateTxt() { const d = dd(); const t = new Date(d + 'T00:00:00'); return d + ' (' + WD[t.getDay()] + ')'; }
  function fillCount(type, g) { let need = 0, got = 0; prods(type, g).forEach(p => rowsOf(type, g, p).forEach(r => needCols(type, r).forEach(c => { if (c.k === 'jd') return; need++; if (!r.virt && !blank(r[c.f])) got++; }))); return { need, got }; }
  function stOf(type, g) {
    const fc = fillCount(type, g); let bad = 0; try { bad = (ccpState(g) || {}).bad || 0; } catch (e) {}
    const lab = g.apAt ? '<span class="lab ok">승인완료 ✓</span>' : !fc.got ? '<span class="lab no">미작성</span>' : fc.got < fc.need ? '<span class="lab ing">작성중</span>' : '<span class="lab ok">작성완료</span>';
    return { fc, bad, lab: lab + (bad ? ' <span class="lab bad">한계기준 이탈 ' + bad + '</span>' : '') };
  }

  function homeHtml() {
    const D = dd(); const rows = [];
    ORDER.forEach(t => { const g = logOf(t); if (!g || g.skip) return; const ps = prods(t, g); if (!ps.length) return; const s = stOf(t, g);
      rows.push('<tr class="go" data-kbo="' + t + '"><td class="l">[' + T[t].no + '] ' + T[t].ccp + ' [' + T[t].nm + ']</td><td class="l" style="font-weight:600">' + ps.map(p => '<span class="nw">' + E(t === 'mix' ? p.name : nmD(p.name)) + '</span>').join(', ') + '</td><td>' + s.fc.got + ' / ' + s.fc.need + '칸</td><td>' + s.lab + '</td><td><button type="button" class="kbtn pri" data-kbo="' + t + '">열기</button></td></tr>'); });
    let rq = ''; if (isToday()) { let sub = ''; try { const s = window.__khReq && __khReq.state ? __khReq.state() : null; sub = s && s.sub ? s.sub : ''; } catch (e) {} rq = '<div class="kreq"><button type="button" class="kbtn pri" data-kbreq="1">📤 작성 완료 · K-HACCP 반영 요청</button><p>' + E(sub || '다 적었으면 눌러 주세요. 조조가 입력값 그대로 K-HACCP 일지에 옮깁니다.') + '</p></div>'; }
    return swHtml(true) + '<div class="kcard"><div class="kh1"><h2>CCP 모니터링 일지 · 수기 작성</h2></div>'
      + '<p class="kmeta">작성일자 <b>' + E(dateTxt()) + '</b> · 점검자 <b>' + E(wk() || '고르기 전') + '</b> <button type="button" class="kbtn" data-kbwho="1" style="min-height:54px;margin-left:8px">점검자 바꾸기</button></p>'
      + (rows.length ? '<table class="klist"><thead><tr><th style="width:34%">일지</th><th>품목</th><th style="width:11%">입력</th><th style="width:17%">상태</th><th style="width:11%"></th></tr></thead><tbody>' + rows.join('') + '</tbody></table>'
        : '<div class="kmsg info">이 날짜의 CCP 일지가 아직 없습니다. 아래 「CCP 제품 선택」에서 오늘 만들 품목을 먼저 고르세요.</div>')
      + '<div class="klinks"><button type="button" class="kbtn y" data-kbgo="ws">✅ CCP 제품 선택<small>오늘 만들 품목 고르기 (A의 ① 작업 시작과 같음)</small></button><button type="button" class="kbtn" data-kbgo="qty">📦 생산작업일지 · 생산량 입력<small>박스·낱개·소비기한 (A의 생산량 입력과 같음)</small></button></div>'
      + rq
      + '<div class="knote">• 칸은 모두 빈칸에서 시작합니다. 잰 값을 눌러서 직접 넣고, 판정(O/X)도 직접 고르세요.<br>• 넣은 값은 A 화면·사무실 PC와 같은 일지에 바로 저장되고, 조조가 같은 값을 K-HACCP 일지에 옮깁니다.<br>• 줄마다 처음 입력한 시각과 서명이 남습니다(일지 아래 「입력 기록」).</div></div>';
  }

  function apBox(g, signer) { return '<table class="kap"><tr><td class="big" rowspan="3">결재</td><td class="h">작성</td><td class="h">승인</td></tr><tr><td class="nm' + (signer ? '' : ' wait') + '">' + E(signer || '작성 중') + '</td><td class="nm' + (g.apBy ? '' : ' wait') + '">' + E(g.apBy || '승인 전') + '</td></tr><tr><td class="h">작성자</td><td class="h">승인자</td></tr></table>'; }

  function headHtml(type, g, signer) {
    const t = T[type], D = dd();
    let h = '<div class="kp"><div class="bar"><i></i><i></i></div><table>';
    h += '<tr><td class="ttl" colspan="12">중요관리점(' + t.ccp + ') 모니터링일지</td></tr><tr><td class="stl" colspan="12">' + t.sub + '</td></tr>';
    if (type !== 'freeze') h += '<tr><td class="hd" colspan="2">작성일자</td><td colspan="4">' + E(D) + '</td><td class="hd" colspan="2">점검자</td><td colspan="4">' + E(signer || '') + '</td></tr>';
    if (type === 'oven') {
      h += '<tr><td class="hd" colspan="2" rowspan="' + (t.lim.length + 1) + '">한계기준</td><td colspan="3">제품</td><td colspan="3">가열온도</td><td colspan="2">가열시간</td><td colspan="2">품온</td></tr>';
      t.lim.forEach(l => { h += '<tr><td colspan="3">' + E(l[0]) + '</td><td colspan="3">' + E(l[1]) + '</td><td colspan="2">' + E(l[2]) + '</td><td colspan="2">' + E(l[3]) + '</td></tr>'; });
      h += '<tr><td class="hd" colspan="2">주 기</td><td colspan="10">' + t.cyc + '</td></tr><tr><td class="hd" colspan="2">방 법</td><td colspan="10" class="tl">' + t.how + '</td></tr>';
    } else if (type === 'metal') {
      h += '<tr><td class="hd" colspan="2">한계기준</td><td colspan="10" class="tl">○ Fe 2.5mmΦ. STS 3.5mmΦ 이상 금속이물 불검출 [생지 및 완제품 : 감도 150 / 물성 200]</td></tr>';
      h += '<tr><td class="hd" colspan="2" rowspan="2">주기</td><td colspan="4">금속검출기 정상작동 여부 확인</td><td colspan="6">작업 시작전, 작업 후 2시간마다, 작업 종료 후, 품목변경시 마다</td></tr><tr><td colspan="4">금속검출기에 의한 공정품 확인</td><td colspan="6">작업 중 상시</td></tr>';
      h += '<tr><td class="hd" colspan="2">방법</td><td colspan="10" class="tl">' + t.how + '</td></tr>';
    } else if (type === 'mix') {
      let L = {}; try { L = ccpLimAt(D) || {}; } catch (e) {}
      h += '<tr><td class="hd" colspan="2" rowspan="2">한계기준</td><td colspan="3" class="hd">배합량</td><td colspan="3" class="hd">품온</td><td colspan="2" class="hd">소진시간</td><td colspan="2" class="hd">작업장온도</td></tr><tr><td colspan="3">10kg~50kg</td><td colspan="3">10℃±5~20℃±5</td><td colspan="2">제조 후 2시간 이내</td><td colspan="2">24℃ 이하</td></tr>';
      h += '<tr><td class="hd" colspan="2">주기</td><td colspan="10">매 배치별(30kg, 1회)</td></tr><tr><td class="hd" colspan="2">모니터링방법</td><td colspan="10" class="tl">○ 저울 표시 중량 : 육안 확인<br>○ 탐침 온도계 표시온도 : 육안 확인<br>○ 온도계 표시 온도 : 육안 확인<br>○ 타이머 표시시간 : 육안 확인</td></tr>';
      void L;
    } else if (type === 'freeze') {
      h += '<tr><td class="hd" colspan="2">작성일자</td><td colspan="4">' + E(D) + '</td><td class="hd" colspan="2">점검자</td><td colspan="4">' + E(signer || '') + '</td></tr>';
      h += '<tr><td class="hd" colspan="4" rowspan="2">한계기준</td><td class="hd" colspan="8">모니터링방법</td></tr><tr><td class="hd" colspan="3">대상</td><td class="hd" colspan="2">방법</td><td class="hd" colspan="3">주기</td></tr>';
      h += '<tr><td class="hd" colspan="2">냉동온도</td><td colspan="2">- 30℃~-35℃</td><td colspan="3">냉동창고 컨트롤 판넬 표시온도</td><td colspan="2">육안확인</td><td colspan="3" rowspan="2">1) 급속냉동 전<br>2) 급속냉동 후</td></tr>';
      h += '<tr><td class="hd" colspan="2">시간</td><td colspan="2">1시간 ~ 24시간 이내</td><td colspan="3">타이머 표시 시간</td><td colspan="2">육안확인</td></tr>';
    }
    return h + '</table>';
  }

  function cellHtml(type, r, c, p, bad) {
    const id = E(r.id), at = ' data-kbr="' + id + '" data-kbf="' + c.f + '"';
    if (c.k === 'name') { let n = type === 'metal' ? (r.kind === 'item' ? nmD(r.name || p.name) : r.name) : nmD(r.name); if (type === 'oven') n += r.tag === '시작' ? '(시작)' : r.tag === '종료' ? '(종료)' : ''; return '<button type="button" class="kc nm" data-kbsel="' + id + '">' + E(n) + '</button>'; }
    if (type === 'metal' && c.item && r.kind !== 'item') return '<span class="kc na">-</span>';
    let v = r.virt ? '' : r[c.f];
    /* A 화면으로 적은 줄(판정 칸 없음)은 값이 다 있으면 K-HACCP에 옮길 판정(기준 안 O / 밖 X)을 보여 줌. 눌러서 바꿀 수 있음 */
    if (c.k === 'jd' && blank(v) && !r.virt && r.fm !== 'B' && needCols(type, r).filter(x => x.k !== 'jd').every(x => !blank(r[x.f]))) v = bad.length ? 'X' : 'O';
    if (c.k === 'sg') return blank(v) ? '<button type="button" class="kc"' + at + '>서명</button>' : '<button type="button" class="kc v"' + at + '>' + E(v) + '</button>';
    if (blank(v)) return '<button type="button" class="kc"' + at + '>' + (c.k === 'time' ? '시간 ⏱' : c.k === 'ox' || c.k === 'jd' ? 'O / X' : '입력') + '</button>';
    const isBad = c.k === 'jd' ? v === 'X' : c.k === 'ox' ? (c.good && v !== c.good) : bad.some(b => fieldHit(type, c.f, b));
    return '<button type="button" class="kc v' + (isBad ? ' bad' : '') + (c.k === 'time' ? ' t' : '') + '"' + at + '>' + (c.k === 'time' ? E(ampm(v)) + '<span class="tm">🕘</span>' : E(v)) + '</button>';
  }
  function fieldHit(type, f, b) { b = String(b); if (type === 'oven') return f === 'temp' ? /온도/.test(b) && !/품온/.test(b) : f === 'min' ? /시간/.test(b) : f === 'core' ? /품온/.test(b) : f === 'time' ? /시각|시간 형식/.test(b) : false;
    if (type === 'freeze') return (f === 'v1' || f === 'v2') ? /온도|℃/.test(b) && (f === 'v1' ? /전|넣/.test(b) || !/후|꺼/.test(b) : /후|꺼/.test(b) || !/전|넣/.test(b)) : (f === 't2' ? /시간|시각/.test(b) : false);
    if (type === 'mix') return f === 'kg' ? /배합량|kg/.test(b) : f === 'temp' ? /품온/.test(b) : f === 'room' ? /작업장/.test(b) : f === 'end' ? /소진|시간/.test(b) : false;
    return false; }

  function sheetHtml() {
    const type = ST.type, t = T[type], g = logOf(type); if (!g) { ST.view = 'home'; return homeHtml(); }
    const ps = prods(type, g); if (!ps.length) { ST.view = 'home'; return homeHtml(); }
    let p = ps.find(x => x.code === ST.code) || ps[0]; ST.code = p.code;
    const rs = rowsOf(type, g, p);
    const sgReal = (rs.find(r => !r.virt && r.sg) || {}).sg || (live(g).find(r => r.sg) || {}).sg || '';
    const signer = sgReal || wk();
    let h = swHtml(true) + '<div class="kcard"><div class="kh1"><button type="button" class="kbtn" data-kbhome="1">‹ 일지 목록</button><h2>[' + t.no + '] ' + t.ccp + ' [' + t.nm + '] 작성</h2>' + apBox(g, sgReal) + '</div>';
    h += '<div class="ktabs">' + ps.map(x => '<button type="button" class="' + (x.code === p.code ? 'on' : '') + '" data-kbtab="' + E(x.code) + '">' + E(type === 'mix' ? x.name : nmD(x.name)) + '</button>').join('') + '</div>';
    h += headHtml(type, g, signer);
    const cols = t.cols;
    /* 측정 표 */
    h += '<div class="krow">' + (type === 'metal' ? '' : '<button type="button" class="add" data-kbadd="1"><b>＋</b> 행추가</button>') + '<button type="button" class="del" data-kbdel="1"><b>－</b> 행삭제</button></div>';
    h += '<table class="kdt" style="margin-top:8px">';
    if (type === 'metal') h += '<tr><td class="kcap" colspan="' + cols.length + '">금속검출기 감도 모니터링(판정 - 검출 : O, 불검출 : X)</td></tr>';
    if (type === 'freeze') h += '<tr><th rowspan="2" style="width:22%">품명</th><th colspan="2">급냉 전</th><th colspan="2">급냉 후</th><th rowspan="2" style="width:11%">판정<br>(적합/부적합)</th><th rowspan="2" style="width:11%">서명</th></tr><tr><th>측정시간</th><th>급냉실 온도</th><th>측정시간</th><th>급냉실 온도</th></tr>';
    else h += '<tr>' + cols.map(c => '<th' + (c.k === 'name' ? ' style="width:' + (type === 'metal' ? 19 : 24) + '%"' : c.k === 'time' ? ' style="width:' + (type === 'metal' ? 15 : 16) + '%"' : '') + '>' + c.lb + '</th>').join('') + '</tr>';
    rs.forEach(r => { const bad = r.virt ? [] : rowBad(type, r); h += '<tr' + (ST.sel === r.id ? ' class="sel"' : '') + '>' + cols.map(c => '<td>' + cellHtml(type, r, c, p, bad) + '</td>').join('') + '</tr>'; });
    if (!rs.length) h += '<tr><td colspan="' + cols.length + '" style="height:80px;font-size:18px">줄이 없습니다 — 오른쪽 위 「＋ 행추가」를 누르세요</td></tr>';
    h += '</table>';
    /* 금속: 통과량·검출량·특이사항 (K-HACCP 아래 표) */
    if (type === 'metal') {
      const ps0 = (g.pass || []).find(x => x.code === p.code) || null; const it = rs.find(r => r.kind === 'item');
      const note = [it, rs[0], rs[2]].map(r => r && !r.virt && r.note && String(r.note).trim()).find(Boolean) || '';
      h += '<table class="kdt" style="margin-top:14px"><tr><th style="width:26%">품명</th><th style="width:16%">통과량</th><th style="width:16%">검출량</th><th>특이사항</th></tr><tr><td>' + E(nmD(p.name)) + '</td>'
        + '<td>' + (ps0 && !blank(ps0.passed) ? '<span class="kc na">' + E(ps0.passed) + '</span>' : '<span class="kc na" style="font-size:15px">생산량 입력 후 자동</span>') + '</td>'
        + '<td>' + (ps0 ? (blank(ps0.det) ? '<button type="button" class="kc" data-kbpass="det">입력</button>' : '<button type="button" class="kc v' + (Number(ps0.det) > 0 ? ' bad' : '') + '" data-kbpass="det">' + E(ps0.det) + '</button>') : '<span class="kc na">-</span>') + '</td>'
        + '<td><button type="button" class="kdv' + (note ? ' v' : '') + '" data-kbnote="1">' + E(note || '특이사항 없음') + '</button></td></tr></table>';
    }
    /* 이탈 안내 */
    const bads = []; rs.forEach(r => { if (r.virt) return; const b = rowBad(type, r); if (b.length) bads.push((type === 'mix' ? r.name : r.kind === 'pre' ? '작업 전' : r.kind === 'post' ? '작업 후' : nmD(r.name) + (r.tag ? ' ' + r.tag : '')) + (r.time || r.t1 || r.start ? ' ' + (r.time || r.t1 || r.start) : '') + ': ' + b.join(', ')); });
    const jdLeft = rs.some(r => !r.virt && rowBad(type, r).length && r.jd !== 'X');
    if (bads.length) h += '<div class="kmsg bad">⚠ 한계기준 이탈 — ' + E(bads.join(' / ')) + '<br>' + (jdLeft ? '판정을 X로 하고, ' : '') + '아래 「한계기준 이탈내용」·「개선조치 및 결과」를 적고 HACCP팀장에게 보고하세요.</div>';
    /* 개선조치 방법 + 이탈내용 */
    h += '<table style="margin-top:14px;border:2px solid #111;width:100%;border-collapse:collapse;table-layout:fixed;background:#fff;font-size:17px">'
      + '<tr><td class="hd" style="width:16%;border:1px solid #333;background:#C5D9F1;text-align:center">개선조치<br>방법</td><td class="tl" style="border:1px solid #333;text-align:left;line-height:1.55;padding:8px 10px;font-size:16px">' + t.act + '</td></tr></table>';
    const dv = String(g.dev || '').trim(), ac = String(g.act || '').trim();
    h += '<table style="width:100%;border-collapse:collapse;table-layout:fixed;background:#fff;border:2px solid #111;border-top:0;font-size:18px"><tr>'
      + ['한계기준 이탈내용', '개선조치 및 결과', '조 치 자', '확 인'].map((x, i) => '<td style="border:1px solid #333;background:#C5D9F1;text-align:center;padding:6px;width:' + [30, 30, 20, 20][i] + '%">' + x + '</td>').join('') + '</tr><tr>'
      + '<td style="border:1px solid #333;padding:4px"><button type="button" class="kdv' + (dv ? ' v' : '') + '" data-kblog="dev">' + E(dv || '이탈내용 없음') + '</button></td>'
      + '<td style="border:1px solid #333;padding:4px"><button type="button" class="kdv' + (ac ? ' v' : '') + '" data-kblog="act"' + (!ac && dv && !/^이탈\s*내용\s*없음$/.test(dv) ? ' style="border-color:#B00020;background:#FFE3E3;color:#8B0000;font-weight:800">⚠ 개선조치를 적어 주세요' : '>' + E(ac || '개선조치 특이 사항 없음')) + '</button></td>'
      + '<td style="border:1px solid #333;text-align:center">' + E(signer || '') + '</td><td style="border:1px solid #333;text-align:center">' + E(g.apBy || 'HACCP팀장 확인 전') + '</td></tr></table>';
    h += '</div>';
    /* 입력 기록 (언제·누가) */
    const lg = rs.filter(r => !r.virt && (r.at || r.mt)).map(r => { const lab = type === 'mix' ? r.name : type === 'metal' ? (r.kind === 'pre' ? '작업 전' : r.kind === 'post' ? '작업 후' : '제품 확인') : (r.tag || ''); const tm = r.time || r.t1 || r.start || ''; return '<li>' + E(lab) + (tm ? ' · 측정 ' + E(tm) : '') + ' · 처음 입력 ' + E(hmIso(r.at) || '-') + ' · 마지막 ' + E(hmIso(r.mt) || '-') + ' · ' + E(r.sg || '서명 없음') + ' · ' + (r.fm === 'B' ? '수기 일지(B)' : 'A 단계 입력') + '</li>'; });
    const hs = (g.hist || []).slice(-8).reverse().map(x => '<li>수정 ' + E(hmIso(x.at)) + ' · ' + E(x.by || '') + ' · ' + E(x.f || '') + ' ' + E(x.from || '') + ' → ' + E(x.to || '') + '</li>');
    h += '<details class="klog"><summary>🕘 입력 기록 (' + lg.length + '줄' + (hs.length ? ' · 수정 ' + hs.length + '건' : '') + ')</summary><ul>' + (lg.join('') || '<li>아직 입력이 없습니다</li>') + hs.join('') + '</ul></details>';
    return h + '</div>';
  }

  function paint(force) {
    ensureBox();
    const show = wantShow();
    if (backBtn) backBtn.style.display = (isB() && !show && (() => { try { return FLD.open && FLD.step !== 'who'; } catch (e) { return false; } })()) ? '' : 'none';
    if (!show) { if (box.style.display !== 'none') { box.style.display = 'none'; } return; }
    box.style.top = topY() + 'px';
    const s = sig(); if (!force && s === lastSig && box.style.display !== 'none' && box.innerHTML) return;
    const y = box.scrollTop; lastSig = s;
    let h = ''; try { h = ST.view === 'sheet' && ST.type ? sheetHtml() : homeHtml(); } catch (e) { h = '<div class="kw"><div class="kmsg bad">화면 오류: ' + E(e && e.message || e) + '</div></div>'; }
    box.innerHTML = '<div class="kw">' + h + '</div>' + verTag();
    box.style.display = '';
    box.scrollTop = y;
  }
  const verTag = () => '<div style="text-align:center;font-size:14px;color:#333;padding:0 0 20px">수기 일지(B) ' + VER + ' · ' + BUILT + '</div>';

  /* ── 입력 창 ── */
  let PAD = null;
  function closePad() { if (PAD && PAD.el) PAD.el.remove(); PAD = null; }
  function openPad(o) {
    closePad(); const el = document.createElement('div'); el.className = 'khp-bg'; document.body.appendChild(el); PAD = Object.assign({ el, val: o.val == null ? '' : String(o.val), warn: '', ok2: false }, o); drawPad();
    el.addEventListener('click', e => { if (e.target === el) closePad(); });
  }
  function fmtTime(s) { const d = String(s || '').replace(/\D/g, '').slice(0, 4); if (d.length <= 2) return d; return d.slice(0, d.length - 2).padStart(2, '0') + ':' + d.slice(-2); }
  function drawPad() {
    if (!PAD) return; const o = PAD; let h = '<div class="khp"><h3>' + E(o.title || '') + '</h3>' + (o.sub ? '<p class="sub">' + E(o.sub) + '</p>' : '');
    if (o.kind === 'num' || o.kind === 'time') {
      const shown = o.kind === 'time' ? fmtTime(o.val) : o.val;
      h += '<div class="dsp' + (shown ? '' : ' empty') + '">' + (shown ? E(shown) + (o.kind === 'time' && mm(shown) != null ? '<small>(' + E(ampm(shown)) + ')</small>' : o.unit ? '<small>' + E(o.unit) + '</small>' : '') : (o.kind === 'time' ? '시:분 (예: 0902)' : '숫자를 누르세요')) + '</div>';
      if (o.kind === 'time') h += '<button type="button" class="now" data-kp="now">⏱ 지금 시각 ' + E(hmNow()) + ' 넣기</button>';
      h += '<div class="pad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', o.kind === 'num' ? (o.neg ? '-' : '.') : '', '0', '⌫'].map(k => k ? '<button type="button" data-kp="' + k + '">' + k + '</button>' : '<span></span>').join('') + '</div>';
      if (o.kind === 'num' && o.neg) h += '<div class="pad" style="margin-top:10px;grid-template-columns:1fr 1fr"><button type="button" data-kp=".">.</button><button type="button" data-kp="clr" style="font-size:20px">모두 지우기</button></div>';
      else h += '<div class="pad" style="margin-top:10px;grid-template-columns:1fr"><button type="button" data-kp="clr" style="font-size:20px;min-height:56px">모두 지우기</button></div>';
    } else if (o.kind === 'ox') {
      h += '<div class="ox">' + o.opts.map(x => '<button type="button" class="' + (o.val === x.v ? 'on' : '') + '" data-kpv="' + E(x.v) + '">' + E(x.v) + '<small>' + E(x.t) + '</small></button>').join('') + '</div>';
      if (o.hint) h += '<div class="hint">' + E(o.hint) + '</div>';
    } else if (o.kind === 'who') {
      h += '<div class="who">' + o.names.map(n => '<button type="button" class="' + (n === o.val ? 'on' : '') + '" data-kpv="' + E(n) + '">' + E(n) + '</button>').join('') + '<button type="button" data-kp="newwho" style="font-size:19px">＋ 다른 이름</button></div>';
    } else if (o.kind === 'text') {
      h += '<textarea id="khpTa" placeholder="여기에 적으세요">' + E(o.val) + '</textarea>';
      if (o.chips && o.chips.length) h += '<div class="chips">' + o.chips.map(c => '<button type="button" data-kpc="' + E(c) + '">' + E(c) + '</button>').join('') + '</div>';
    }
    if (o.warn) h += '<div class="warn">' + o.warn + '</div>';
    if (o.kind === 'ox' || o.kind === 'who') h += '<div class="act" style="grid-template-columns:1fr"><button type="button" data-kp="cancel">닫기</button></div>';
    else h += '<div class="act"><button type="button" data-kp="cancel">닫기</button><button type="button" class="ok" data-kp="ok">' + (o.ok2 ? '이대로 입력' : '입력') + '</button></div>';
    PAD.el.innerHTML = h + '</div>';
    if (o.kind === 'text') { const ta = PAD.el.querySelector('#khpTa'); if (ta) { ta.addEventListener('input', () => { if (PAD) PAD.val = ta.value; }); } }
  }
  function padKey(k) {
    if (!PAD) return; const o = PAD;
    if (k === 'cancel') { closePad(); return; }
    if (k === 'now') { o.val = hmNow().replace(':', ''); o.warn = ''; o.ok2 = false; drawPad(); return; }
    if (k === 'clr') { o.val = ''; o.warn = ''; o.ok2 = false; drawPad(); return; }
    if (k === '⌫') { o.val = String(o.val).slice(0, -1); o.warn = ''; o.ok2 = false; drawPad(); return; }
    if (k === 'newwho') { const n = (prompt('이름을 입력하세요') || '').trim(); if (n) { const cb = o.onOk; closePad(); cb(n); } return; }
    if (k === 'ok') { const v = o.kind === 'time' ? fmtTime(o.val) : o.kind === 'text' ? String(o.val || '').trim() : String(o.val || '').trim(); const cb = o.onOk; const r = cb(v, o.ok2); if (r === true) closePad(); else if (typeof r === 'string') { o.warn = r; o.ok2 = /이대로/.test(r) ? true : o.ok2; drawPad(); } else if (r && r.warn) { o.warn = r.warn; o.ok2 = !!r.ok2; drawPad(); } return; }
    if (/^[0-9]$/.test(k) || k === '.' || k === '-') {
      if (o.kind === 'time') { const d = String(o.val).replace(/\D/g, ''); if (d.length >= 4) return; o.val = d + k; }
      else { let s = String(o.val); if (k === '-') { s = s.startsWith('-') ? s.slice(1) : '-' + s; } else if (k === '.') { if (s.includes('.')) return; s = (s === '' || s === '-' ? s + '0' : s) + '.'; } else { if (s.replace(/[-.]/g, '').length >= 6) return; s = s + k; } o.val = s; }
      o.warn = ''; o.ok2 = false; drawPad();
    }
  }
  function workers() { try { const P = prodS(); return [...new Set(prodWorkersDefault(P).concat((P.draft && P.draft.workers) || [], [fldWk(), S.settings.reporter].filter(Boolean)))]; } catch (e) { return [wk()].filter(Boolean); } }
  function pickWho(cb, cur) { openPad({ kind: 'who', title: '누가 기록하나요? (서명)', sub: '고른 이름이 이 일지의 서명으로 들어갑니다', names: workers(), val: cur || wk(), onOk: n => { cb(n); return true; } }); }

  /* 칸 하나 열기 */
  function openCell(rid, f) {
    const type = ST.type, g = logOf(type); if (!g) return; const ps = prods(type, g); const p = ps.find(x => x.code === ST.code) || ps[0]; if (!p) return;
    const r = rowsOf(type, g, p).find(x => x.id === rid); if (!r) { say('줄을 찾지 못했습니다'); paint(true); return; }
    const c = T[type].cols.find(x => x.f === f); if (!c) return;
    const rl = type === 'mix' ? r.name : type === 'metal' ? (r.kind === 'pre' ? nmD(p.name) + ' · 작업 전' : r.kind === 'post' ? nmD(p.name) + ' · 작업 후' : nmD(p.name) + ' · 작업중(제품 확인)') : nmD(r.name) + (r.tag === '시작' ? '(시작)' : r.tag === '종료' ? '(종료)' : '');
    const title = rl + ' — ' + (c.pl || c.lb.replace(/<br>/g, ' '));
    const cur = r.virt ? '' : (r[f] == null ? '' : String(r[f]));
    const after = () => { lastSig = ''; paint(true); setTimeout(() => nextCell(rid, f), 60); };
    if (c.k === 'sg') { pickWho(n => { if (setCell(type, r, 'sg', n, p)) { lastSig = ''; paint(true); } }, cur); return; }
    if (c.k === 'ox') { openPad({ kind: 'ox', title, sub: limTxt(type, r, c), val: cur, opts: [{ v: 'O', t: '검출됨' }, { v: 'X', t: '검출 안 됨' }], hint: '판정 - 검출 : O, 불검출 : X', onOk: v => { if (setCell(type, r, f, v, p)) after(); return true; } }); return; }
    if (c.k === 'jd') {
      const bad = r.virt ? [] : rowBad(type, r);
      openPad({ kind: 'ox', title, sub: bad.length ? '⚠ 기준 밖 값이 있어요: ' + bad.join(', ') : '이 줄의 값이 기준 안이면 O(적합)', val: cur, opts: [{ v: 'O', t: '적합' }, { v: 'X', t: '부적합' }],
        onOk: v => { if (v === 'O' && bad.length && !(PAD && PAD.ok2)) { PAD.ok2 = true; PAD.warn = '기준 밖 값이 있는데 O(적합)를 골랐어요. 맞으면 O를 한 번 더 누르세요. 보통은 X(부적합)입니다.'; drawPad(); return false; }
          if (setCell(type, r, 'jd', v, p)) { lastSig = ''; paint(true); if (v === 'X') say('부적합(X) — 아래 「한계기준 이탈내용」과 「개선조치 및 결과」를 적어 주세요', 4000); } return true; } });
      return; }
    /* 숫자·시간 */
    openPad({ kind: c.k, title, sub: limTxt(type, r, c), val: c.k === 'time' ? cur.replace(':', '') : cur, unit: c.u || '', neg: !!c.neg,
      onOk: (v, ok2) => {
        if (v === '') { if (cur === '') return '값을 넣어 주세요'; if (!confirm('이 칸의 값을 지울까요?')) return false; if (setCell(type, r, f, '', p)) { lastSig = ''; paint(true); } return true; }
        if (c.k === 'time') { if (mm(v) == null) return '시각이 올바르지 않아요 (예: 0902 → 09:02, 1344 → 13:44)';
          if (isToday() && !ok2) { const n = mm(hmNow()); if (mm(v) - n > 10) return { warn: '지금은 ' + hmNow() + '인데 ' + v + '를 넣었어요. 측정한 시각을 넣어 주세요. 맞으면 「이대로 입력」', ok2: true }; } }
        else { if (isNaN(Number(v)) || v === '-' || v === '.') return '숫자가 올바르지 않아요'; const ty = typo(type, f, v); if (ty) return ty;
          if (!ok2) { const before = r.virt ? [] : rowBad(type, r); const tmp = Object.assign({}, r.virt ? {} : r, { [f]: v }); const now = rowBad(type, tmp).filter(b => !before.includes(b)); if (now.length) return { warn: '⚠ 한계기준을 벗어났어요: ' + E(now.join(', ')) + '<br>다시 재 보고, 실제 값이 맞으면 「이대로 입력」(이탈로 기록됩니다)', ok2: true }; } }
        if (setCell(type, r, f, v, p)) after(); return true; } });
  }
  function nextCell(rid, f) {
    const type = ST.type, g = logOf(type); if (!g) return; const ps = prods(type, g); const p = ps.find(x => x.code === ST.code) || ps[0]; if (!p) return;
    const r = rowsOf(type, g, p).find(x => x.id === rid) || rowsOf(type, g, p).find(x => x.kind && rid.indexOf('v:' + x.kind + ':') === 0); if (!r || r.virt) return;
    const cs = needCols(type, r); const i = cs.findIndex(c => c.f === f); const nx = cs.slice(i + 1).find(c => blank(r[c.f])); if (nx) openCell(r.id, nx.f);
  }

  /* 행추가 · 행삭제 */
  function addRow() {
    const type = ST.type, g = logOf(type); if (!g) return; const ps = prods(type, g); const p = ps.find(x => x.code === ST.code) || ps[0]; if (!p) return;
    if (!wk()) { pickWho(n => { try { fldSetWk(n); } catch (e) {} addRow(); }); return; }
    if (type === 'mix') { openPad({ kind: 'ox', title: '어떤 배합을 한 줄 더 넣을까요?', val: '', opts: [{ v: '크림배합', t: '배치 한 줄' }, { v: '마늘배합', t: '배치 한 줄' }], onOk: nm => { const last = [...live(g)].reverse().find(r => r.name === nm); const nr = { id: ccpRid(), code: last ? last.code : 'mix:' + nm, name: nm, start: '', kg: '', temp: '', room: '', end: '', fm: 'B' }; const at = last ? g.rows.lastIndexOf(last) + 1 : g.rows.length; g.rows.splice(at, 0, nr); ccpTouch(g); lastSig = ''; paint(true); return true; } }); return; }
    const rs = rowsOf(type, g, p); let mode = '';
    if (type === 'oven') mode = !rs.some(r => r.tag === '시작') ? '시작' : !rs.some(r => r.tag === '종료') ? '종료' : '중간';
    const keep = FLD.name; FLD.name = p.name; let nr = null; try { nr = fldNewRow(g, type, p.code, mode); } catch (e) { nr = null; } FLD.name = keep;
    if (!nr) { say('줄을 더하지 못했습니다'); return; }
    nr.fm = 'B'; ccpTouch(g); lastSig = ''; paint(true); say('＋ ' + (type === 'oven' ? (mode === '중간' ? '2시간 측정' : mode) + ' 줄' : '한 줄') + '을 더했습니다 — 칸을 눌러 입력하세요', 2500);
  }
  function delRow() {
    const type = ST.type, g = logOf(type); if (!g) return; const ps = prods(type, g); const p = ps.find(x => x.code === ST.code) || ps[0]; if (!p) return;
    const r = rowsOf(type, g, p).find(x => x.id === ST.sel); if (!r) { say('지울 줄의 「품명」 칸을 먼저 눌러 고르세요 (노랗게 표시됩니다)', 3500); return; }
    if (r.virt) { say('아직 입력이 없는 줄입니다'); return; }
    const lab = type === 'metal' ? (r.kind === 'pre' ? '작업 전' : r.kind === 'post' ? '작업 후' : '작업중(제품 확인)') : type === 'mix' ? r.name : (r.tag || '');
    if (!confirm(nmD(p.name) + ' · ' + lab + (r.time || r.t1 || r.start ? ' ' + (r.time || r.t1 || r.start) : '') + ' 줄을 지울까요?\n(지운 기록은 일지에서 빠지고, 승인된 일지면 승인이 풀립니다)')) return;
    const i = g.rows.indexOf(r); if (i < 0) return; g.rows.splice(i, 1);
    if (g.apAt) { g.hist = (g.hist || []).slice(-30); g.hist.push({ at: new Date().toISOString(), by: wk(), f: nmD(p.name) + ' ' + lab + ' 줄 삭제(수기 일지 B)', from: '', to: '', ap: g.apBy || '' }); g.apAt = ''; g.apBy = ''; }
    g.del = (g.del || []).concat([r.id]).slice(-300); try { ccpAutoDev(g); } catch (e) {} ccpTouch(g); ST.sel = ''; lastSig = ''; paint(true); say('🗑 줄을 지웠습니다', 2000);
  }

  /* K-HACCP 반영 요청 (생산실 앱 「고친 내용 K-HACCP 반영 요청」과 같은 줄을 남김) */
  async function sendReq() {
    const D = dd(); if (D !== today()) { say('지난 날짜는 조조에게 말로 요청해 주세요'); return; }
    const miss = []; ORDER.forEach(t => { const g = logOf(t); if (!g || g.skip || !prods(t, g).length) return; const s = stOf(t, g); if (s.fc.got < s.fc.need) miss.push('[' + T[t].no + '] ' + T[t].nm + ' ' + (s.fc.need - s.fc.got) + '칸'); });
    if (!confirm((miss.length ? '아직 빈칸이 있어요:\n' + miss.join('\n') + '\n\n빈칸이 있는 일지는 조조가 옮기지 않고 「보류」로 알립니다.\n' : '') + '적은 일지를 K-HACCP에 그대로 옮겨 달라고 조조에게 요청할까요?')) return;
    const ts = new Date().toISOString(); const by = wk() || (S.settings && S.settings.reporter) || '';
    const row = { ts, week: '', code: 'khreq~' + D + '~' + ts, name: 'K-HACCP 반영 요청', kind: 'plog', note: JSON.stringify({ x: 'khreq', n: JSON.stringify({ d: D, by, form: 'B' }) }) };
    try { const sh = shareCfg(); await shareApi({ rows: [row], user: (S.settings && S.settings.reporter) || '', device: sh.device });
      try { const l = JSON.parse(localStorage.getItem('wonryo_khreq') || '[]').filter(x => x.d >= D).concat({ d: D, ts, by }).slice(-20); localStorage.setItem('wonryo_khreq', JSON.stringify(l)); } catch (e) {}
      try { window.__khReq && __khReq.load && __khReq.load(true); } catch (e) {}
      say('📤 요청했어요 — 조조가 다음 확인 때 K-HACCP에 그대로 옮깁니다', 3500); lastSig = ''; paint(true);
    } catch (x) { alert('요청을 보내지 못했습니다: ' + (x && x.message || x) + '\n인터넷 연결을 확인하고 다시 눌러 주세요.'); }
  }

  /* A 화면 단계로 잠깐 가기 (CCP 제품 선택·생산량 입력) */
  function goA(f) { try { const b = document.createElement('button'); b.type = 'button'; b.dataset.f = f; b.style.display = 'none'; const host = document.querySelector('#fld .fld-body') || document.querySelector('#fld'); host.appendChild(b); b.click(); b.remove(); } catch (e) { say('화면을 열지 못했습니다'); } paint(); }

  /* ── 누르기 ── */
  document.addEventListener('click', e => {
    const t = e.target; if (!t || !t.closest) return;
    const sw = t.closest('[data-kbsw]'); if (sw) { e.preventDefault(); e.stopPropagation(); const b = sw.dataset.kbsw === 'B'; setB(b); if (b) { ST.view = 'home'; ST.sel = ''; try { if (FLD.step !== 'home') { FLD.step = 'home'; } } catch (x) {} } lastSig = ''; try { fieldRender(); } catch (x) {} paint(true); if (b) say('B 수기 일지 — K-HACCP 일지 양식으로 직접 입력합니다', 2500); return; }
    if (PAD && PAD.el.contains(t)) { const k = t.closest('[data-kp]'), v = t.closest('[data-kpv]'), c = t.closest('[data-kpc]');
      if (k) { e.preventDefault(); padKey(k.dataset.kp); return; }
      if (v) { e.preventDefault(); const cb = PAD.onOk; const r = cb(v.dataset.kpv); if (r === true) closePad(); return; }
      if (c) { e.preventDefault(); PAD.val = c.dataset.kpc; const ta = PAD.el.querySelector('#khpTa'); if (ta) ta.value = PAD.val; return; }
      return; }
    if (backBtn && t.closest('.khb-back')) { e.preventDefault(); try { FLD.step = 'home'; fieldRender(); } catch (x) {} paint(true); return; }
    if (!box || !box.contains(t)) return;
    const q = s => t.closest(s);
    let b;
    if ((b = q('[data-kbo]'))) { ST.view = 'sheet'; ST.type = b.dataset.kbo; ST.code = ''; ST.sel = ''; lastSig = ''; paint(true); box.scrollTop = 0; return; }
    if (q('[data-kbhome]')) { ST.view = 'home'; ST.sel = ''; lastSig = ''; paint(true); box.scrollTop = 0; return; }
    if ((b = q('[data-kbtab]'))) { ST.code = b.dataset.kbtab; ST.sel = ''; lastSig = ''; paint(true); return; }
    if ((b = q('[data-kbsel]'))) { ST.sel = ST.sel === b.dataset.kbsel ? '' : b.dataset.kbsel; lastSig = ''; paint(true); return; }
    if ((b = q('[data-kbr]'))) { openCell(b.dataset.kbr, b.dataset.kbf); return; }
    if (q('[data-kbadd]')) { addRow(); return; }
    if (q('[data-kbdel]')) { delRow(); return; }
    if (q('[data-kbwho]')) { pickWho(n => { try { fldSetWk(n); } catch (x) {} lastSig = ''; try { fieldRender(); } catch (x) {} paint(true); }); return; }
    if ((b = q('[data-kbgo]'))) { goA(b.dataset.kbgo); return; }
    if (q('[data-kbreq]')) { sendReq(); return; }
    if ((b = q('[data-kblog]'))) { const f = b.dataset.kblog, type = ST.type, g = logOf(type); if (!g) return;
      const chips = f === 'dev' ? ['이탈내용 없음'] : ['개선조치 특이 사항 없음', '재측정 후 기준 안 확인, 작업 계속', '재가열 후 관능검사 이상 없음', 'HACCP팀장 보고 후 조치'];
      openPad({ kind: 'text', title: f === 'dev' ? '한계기준 이탈내용' : '개선조치 및 결과', sub: f === 'dev' ? '기준을 벗어난 내용(언제·무엇이·얼마나)' : '어떻게 조치했고 결과가 어땠는지', val: String(g[f] || '').replace(/^\[자동\]\s*/, ''), chips,
        onOk: v => { if (!v) return '내용을 적거나 아래 버튼을 고르세요'; if (!wk()) { pickWho(n => { try { fldSetWk(n); } catch (x) {} }); return '먼저 서명할 사람을 고르세요'; } setLog(type, f, v); lastSig = ''; paint(true); return true; } }); return; }
    if (q('[data-kbnote]')) { const g = logOf('metal'); const ps = prods('metal', g); const p = ps.find(x => x.code === ST.code) || ps[0]; if (!p) return; const rs = rowsOf('metal', g, p); const it = rs.find(r => r.kind === 'item');
      openPad({ kind: 'text', title: nmD(p.name) + ' — 특이사항', sub: '금속검출 표 아래 특이사항 칸 (빈칸이면 「특이사항 없음」으로 옮깁니다)', val: (it && !it.virt && it.note) || '', chips: ['특이사항 없음'],
        onOk: v => { if (!v) return '내용을 적거나 「특이사항 없음」을 누르세요'; if (setCell('metal', it, 'note', v, p)) { lastSig = ''; paint(true); } return true; } }); return; }
    if ((b = q('[data-kbpass]'))) { const g = logOf('metal'); const ps = prods('metal', g); const p = ps.find(x => x.code === ST.code) || ps[0]; if (!p) return; const pr = (g.pass || []).find(x => x.code === p.code); if (!pr) return;
      openPad({ kind: 'num', title: nmD(p.name) + ' — 검출량', sub: '금속이 검출된 제품 수 (없으면 0)', val: pr.det || '', unit: '개', onOk: v => { if (v === '' || isNaN(Number(v))) return '숫자를 넣어 주세요 (없으면 0)'; if (!wk()) { pickWho(n => { try { fldSetWk(n); } catch (x) {} }); return '먼저 서명할 사람을 고르세요'; } setPass(p.code, 'det', v); lastSig = ''; paint(true); if (Number(v) > 0) say('검출량이 있어요 — 이탈내용·개선조치를 적고 HACCP팀장에게 보고하세요', 4500); return true; } }); return; }
  }, true);

  /* 키보드(숫자·Enter·Esc·⌫) — 입력 창이 열렸을 때만 */
  window.addEventListener('keydown', e => {
    if (!PAD) return; const o = PAD; if (o.kind === 'text') { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closePad(); } return; }
    let k = null; if (/^[0-9]$/.test(e.key)) k = e.key; else if (e.key === '.' || e.key === '-') k = e.key; else if (e.key === 'Backspace') k = '⌫'; else if (e.key === 'Enter') k = 'ok'; else if (e.key === 'Escape') k = 'cancel';
    if (o.kind === 'ox' && /^[oOxX]$/.test(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); const r = o.onOk(e.key.toUpperCase()); if (r === true) closePad(); return; }
    if (!k) return; e.preventDefault(); e.stopImmediatePropagation(); if ((o.kind === 'ox' || o.kind === 'who') && k !== 'cancel') return; padKey(k);
  }, true);

  /* A 첫 화면에 형식 고르기 줄 + 버전 표시 */
  function decorateA() {
    try {
      if (!FLD.open) return;
      const sm = document.querySelector('#fld .rqbar small'); if (sm && !sm.querySelector('.khb-ver')) sm.insertAdjacentHTML('beforeend', '<span class="khb-ver"> · 수기 일지(B) ' + VER + ' · ' + BUILT + '</span>');
      if (FLD.step !== 'home' || isB()) return;
      const body = document.querySelector('#fld .fld-body'); if (!body || body.querySelector('.khsw')) return;
      const main = body.querySelector('.fpc-main') || body; main.insertAdjacentHTML('afterbegin', swHtml(false));
    } catch (e) {}
  }
  const _r = fieldRender; fieldRender = function () { const r = _r.apply(this, arguments); decorateA(); try { paint(); } catch (e) {} return r; };
  backBtn = document.createElement('button'); backBtn.type = 'button'; backBtn.className = 'khb-back'; backBtn.textContent = '◀ B 수기 일지로'; backBtn.style.display = 'none'; document.body.appendChild(backBtn);
  window.addEventListener('resize', () => { if (box && box.style.display !== 'none') box.style.top = topY() + 'px'; });
  setInterval(() => { try { if (box && box.style.display !== 'none') { box.style.top = topY() + 'px'; paint(); } } catch (e) {} }, 4000);
  window.__khForm = { VER, BUILT, paint, ST, isB, setB };
  try { if (typeof FLD !== 'undefined' && FLD.open) fieldRender(); } catch (e) {}
})();
