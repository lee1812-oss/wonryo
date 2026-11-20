/* ══ 생산 주문 현황 v002 (2026-11-20 지난 주문·거래처별 발주 예상 탭 추가, 상무님 「과거 거래를 보면서 거래처별 발주 예상」) · v001 · 2026-11-20 18:01 (2026-11-20 Aside 사무실 PC, 사용자 요청
   「키오스크 생산일지 화면에서 『주문현황 알려줘』라고 말하면 상무님 생산 주문 현황이 나오게, 우측 상단 버튼으로도 조회」) ══
   - 상단 오른쪽(작업자 이름 왼쪽)에 「📋 주문현황」 버튼. 누르면 박태일 상무님 생산 주문표와 같은 자료를 큰 글씨로 보여 줌.
   - 자료 = 업무 대시보드 직원용 자료(drawbread/factory.enc.json 의 factory.orders9, 이카운트 판매 전표 · 출고일 기준, 단가·금액·연락처 없음).
     열쇠는 이 파일에 넣지 않고, 같은 주소(lee1812-oss.github.io)의 대시보드 직원 열쇠(localStorage dash_fkey_v1) 또는 dash.html 의 직원 기본 열쇠를 읽어 씀.
   - 말로 열기: 터치 화면 기기(키오스크·태블릿)이고 마이크가 이미 허용돼 있으면 「주문현황 알려줘」를 듣고 창을 엶. 「닫아」라고 하면 닫힘.
     녹음·저장은 하지 않고, 크롬 음성 인식으로 바꾼 글자에서 「주문 현황」이라는 말만 찾음. 화면 버튼에 🎤 표시, 창 아래 버튼으로 끄고 켬(기기마다 기억).
     「말로 개선 요청」·영상통화로 마이크를 쓰는 동안과 화면이 안 보일 때는 듣지 않음.
   - 일지 저장·이카운트 전송 로직은 건드리지 않음. 이 파일을 빼면 예전 화면 그대로. */
(function () {
  if (!window.FIELD_APP || window.__fieldOrders) return;
  window.__fieldOrders = true;
  const VER = 'v002', BUILT = '2026-11-20 18:01';
  const ORIGIN = 'https://lee1812-oss.github.io';
  const DATA_URL = ORIGIN + '/drawbread/factory.enc.json', DASH_URL = ORIGIN + '/drawbread/dash.html';
  const LS_VOICE = 'fld_ord_voice_v1';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const V = { on: false, live: false, rec: null, wait: 0, fails: 0, micBusy: 0 };
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const addD = (s, n) => { const x = new Date(s + 'T00:00:00'); x.setDate(x.getDate() + n); return ymd(x); };
  const md = s => { const x = new Date(s + 'T00:00:00'); return (x.getMonth() + 1) + '/' + x.getDate() + '(' + WD[x.getDay()] + ')'; };

  /* ── 화면 모양 ── */
  const css = document.createElement('style');
  css.textContent = [
    '#fld .fld-top .ford-btn{min-height:54px;padding:6px 16px;font-size:20px;font-weight:900;background:#FFD84D;color:#1d2433;border:3px solid #1E5BB8;border-radius:12px;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}',
    '#fld .fld-top .ford-btn i{font-style:normal;font-size:15px;background:#fff;border:2px solid #1E5BB8;border-radius:9px;padding:1px 6px;font-weight:800;color:#1E5BB8}',
    '#fld .fld-top .ford-btn i.live{color:#fff;background:#C62828;border-color:#C62828}',
    '#ford{position:fixed;inset:0;z-index:2147482900;background:#F4F5F7;color:#111;font-family:inherit;overflow:auto;-webkit-overflow-scrolling:touch}',
    '#ford .fo-wrap{max-width:1500px;margin:0 auto;padding:14px 18px 40px;box-sizing:border-box}',
    '#ford .fo-head{position:sticky;top:0;z-index:2;background:#0D1C42;color:#fff;margin:-14px -18px 14px;padding:12px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}',
    '#ford .fo-head h1{margin:0;font-size:30px;font-weight:900;flex:1 1 auto;word-break:keep-all}',
    '#ford .fo-head h1 small{display:block;font-size:17px;font-weight:700;color:#FCF1D0;margin-top:2px}',
    '#ford button{font-family:inherit;cursor:pointer}',
    '#ford .fo-x{min-height:64px;min-width:150px;font-size:24px;font-weight:900;background:#FFD84D;color:#111;border:3px solid #1E5BB8;border-radius:14px}',
    '#ford .fo-src{font-size:18px;font-weight:700;color:#333;margin:0 0 12px;line-height:1.5;word-break:keep-all}',
    '#ford .fo-src b{color:#111}',
    '#ford .fo-warn{background:#FFF3E0;border:2px solid #E65100;color:#7a2e00;border-radius:12px;padding:12px 14px;font-size:19px;font-weight:800;margin:0 0 12px}',
    '#ford .fo-err{background:#FFEBEE;border:2px solid #C62828;color:#8e0000;border-radius:12px;padding:16px;font-size:21px;font-weight:800;margin:20px 0;line-height:1.6}',
    '#ford h2{font-size:24px;margin:18px 0 10px;font-weight:900;color:#0D1C42}',
    '#ford .fo-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}',
    '#ford .fo-tile{background:#fff;border:2px solid #cfd5df;border-radius:14px;padding:10px 12px;min-height:96px;box-sizing:border-box}',
    '#ford .fo-tile .nm{font-size:18px;font-weight:800;color:#222;word-break:keep-all;line-height:1.3}',
    '#ford .fo-tile .n{font-size:40px;font-weight:900;color:#0D1C42;line-height:1.15;font-variant-numeric:tabular-nums}',
    '#ford .fo-tile .n small{font-size:18px;font-weight:800;margin-left:3px;color:#333}',
    '#ford .fo-tile.zero{background:#eceef2;border-color:#dfe2e8}#ford .fo-tile.zero .n{color:#555}',
    '#ford .fo-tile.top{border-color:#1E5BB8;box-shadow:inset 0 0 0 2px #1E5BB8}',
    '#ford .fo-day{background:#fff;border:2px solid #cfd5df;border-radius:16px;margin:0 0 12px;overflow:hidden;break-inside:avoid}',
    '#ford .fo-day.today{border-color:#1E5BB8;box-shadow:0 0 0 2px #1E5BB8}',
    '#ford .fo-dh{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 14px;background:#E8EEF8;font-size:24px;font-weight:900;color:#0D1C42}',
    '#ford .fo-day.today .fo-dh{background:#1E5BB8;color:#fff}',
    '#ford .fo-dh .lb{font-size:17px;font-weight:900;border-radius:8px;padding:3px 9px;background:#fff;color:#1E5BB8;border:2px solid #1E5BB8}',
    '#ford .fo-dh .sum{margin-left:auto;font-size:22px}',
    '#ford .fo-rows{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:0}',
    '#ford .fo-r{padding:10px 14px;border-top:1px solid #e3e6ec;display:flex;gap:10px;align-items:flex-start}',
    '#ford .fo-r .pn{flex:0 0 auto;min-width:118px;font-size:20px;font-weight:900;color:#111;word-break:keep-all}',
    '#ford .fo-r .pn b{display:block;font-size:30px;color:#0D1C42;font-variant-numeric:tabular-nums}',
    '#ford .fo-r ul{list-style:none;margin:0;padding:0;flex:1;font-size:18px;font-weight:700;line-height:1.45;color:#222;word-break:keep-all;overflow-wrap:anywhere}',
    '#ford .fo-r li b{white-space:nowrap;color:#111}',
    '#ford .fo-new{display:inline-block;font-size:15px;font-weight:900;color:#fff;background:#2E7D32;border-radius:6px;padding:0 6px;margin-left:4px;white-space:nowrap}',
    '#ford .fo-gap{font-size:18px;font-weight:800;color:#444;background:#eceef2;border-radius:10px;padding:8px 14px;margin:0 0 12px}',
    '#ford .fo-more{display:block;width:100%;min-height:64px;font-size:22px;font-weight:900;background:#fff;color:#0D1C42;border:3px solid #1E5BB8;border-radius:14px;margin:6px 0 14px}',
    '#ford .fo-foot{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:18px;font-size:17px;font-weight:700;color:#333}',
    '#ford .fo-foot button{min-height:58px;padding:6px 18px;font-size:19px;font-weight:900;background:#fff;color:#111;border:2px solid #8a93a3;border-radius:12px}',
    '#ford .fo-foot .ver{margin-left:auto}',
    '#ford .fo-tabs{display:flex;gap:10px;margin:0 0 14px;flex-wrap:wrap}',
    '#ford .fo-tabs button{flex:1 1 200px;min-height:64px;font-size:22px;font-weight:900;background:#fff;color:#0D1C42;border:3px solid #9aa6bb;border-radius:14px}',
    '#ford .fo-tabs button.on{background:#FFD84D;border-color:#1E5BB8;color:#111}',
    '#ford .fo-seg{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}',
    '#ford .fo-seg button{min-height:54px;padding:4px 16px;font-size:19px;font-weight:800;background:#fff;color:#111;border:2px solid #9aa6bb;border-radius:12px}',
    '#ford .fo-seg button.on{background:#0D1C42;color:#fff;border-color:#0D1C42}',
    '#ford .fo-tile .sub{font-size:16px;font-weight:800;color:#333;margin-top:2px}',
    '#ford .fo-ch{width:100%;border:0;text-align:left;font-family:inherit;cursor:pointer}',
    '#ford .fo-fr{display:grid;grid-template-columns:150px 240px 1fr;gap:4px 14px;align-items:center;padding:10px 14px;border-top:1px solid #e3e6ec}',
    '#ford .fo-fr .pn{font-size:20px;font-weight:900;word-break:keep-all}',
    '#ford .fo-st{font-size:17px;font-weight:900;border-radius:10px;padding:6px 10px;border:2px solid;line-height:1.3}',
    '#ford .fo-st b{display:block;font-size:20px}',
    '#ford .fo-st.lt{background:#FFF3E0;border-color:#E65100;color:#7a2e00}',
    '#ford .fo-st.wk{background:#E3F2FD;border-color:#1565C0;color:#0d3c7a}',
    '#ford .fo-st.lr{background:#fff;border-color:#9aa6bb;color:#222}',
    '#ford .fo-st.in{background:#E8F5E9;border-color:#2E7D32;color:#14501a}',
    '#ford .fo-st.gy{background:#eceef2;border-color:#c3c8d2;color:#333}',
    '#ford .fo-meta{font-size:18px;font-weight:700;color:#222}',
    '#ford .fo-rec{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:17px;font-weight:700;color:#333}',
    '#ford .fo-rec .fu,#ford .fo-hist .fu{color:#14501a}',
    '#ford .fo-hist{padding:8px 14px 12px;border-top:2px solid #cfd5df;background:#fafbfc}',
    '#ford .fo-hist .hh{font-size:18px;font-weight:900;margin:4px 0 6px;color:#0D1C42}',
    '#ford .fo-hist .fo-hr{display:flex;gap:14px;font-size:18px;font-weight:700;line-height:1.5;padding:4px 0;border-bottom:1px dashed #c9ced8;word-break:keep-all;position:static}',
    '#ford .fo-hist .fo-hr em{flex:0 0 130px;font-style:normal;font-weight:900;color:#111}',
    '#ford .fo-hist .fo-hr span{flex:1;display:block;color:#222}',
    '#ford .fo-hist .fo-hr b{display:inline;color:#111}',
    '@media(max-width:900px){#ford .fo-fr{grid-template-columns:1fr 1fr}#ford .fo-fr .pn{grid-column:1/-1}}',
    '#ford .fo-load{font-size:26px;font-weight:900;text-align:center;padding:60px 0;color:#0D1C42}',
    '@media(min-width:1000px){#ford .fo-tiles{grid-template-columns:repeat(9,minmax(0,1fr))}#ford .fo-tile{padding:10px 8px}#ford .fo-tile .n{font-size:32px;white-space:nowrap}#ford .fo-tile .n small{font-size:16px;margin-left:2px}}',
    '@media(max-width:700px){#ford .fo-head h1{font-size:24px}#ford .fo-x{min-width:110px;font-size:21px}#ford .fo-rows{grid-template-columns:1fr}#ford .fo-tile .n{font-size:32px}}'
  ].join('\n');
  document.head.appendChild(css);

  /* ── 상단 오른쪽 버튼 (작업자 이름 왼쪽) ── */
  const btnHtml = () => '<button type="button" class="fb ford-btn" data-ford-open="1" title="상무님 생산 주문표와 같은 자료 · 「주문현황 알려줘」라고 말해도 열림">📋 주문현황' + (V.on ? '<i class="' + (V.live ? 'live' : '') + '">🎤</i>' : '') + '</button>';
  const oldHead = fldHead;
  fldHead = function () {
    let h = oldHead.apply(this, arguments);
    const who = '<button class="fb who"';
    if (h.includes(who)) h = h.replace(who, btnHtml() + who);
    else { const c = h.indexOf('<button class="fb" data-f="close"'); h = c >= 0 ? h.slice(0, c) + btnHtml() + h.slice(c) : h; }
    /* 상세 버전 목록에 한 줄 (맨 위 「업데이트」 시각도 이 날짜를 따라감) */
    h = h.replace(/(<div class="rqbar"><small>[^<]*)(<\/small>|<span)/, '$1 · 주문현황 ' + VER + ' · ' + BUILT + '$2');
    return h;
  };
  function paintBtn() { document.querySelectorAll('#fld .ford-btn').forEach(b => { const want = btnHtml().replace(/^<button[^>]*>|<\/button>$/g, ''); if (b.innerHTML !== want) b.innerHTML = want; }); }

  /* ── 자료 받기 ── */
  let cache = null, cacheAt = 0, keyMem = '';
  async function decrypt(e, pw) {
    const b = s => Uint8Array.from(atob(s), c => c.charCodeAt(0)); const enc = new TextEncoder();
    const it = +((e.kdf || '').match(/(\d+)$/) || [0, 100000])[1];
    const base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b(e.salt), iterations: it, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(e.iv) }, key, b(e.ct))));
  }
  async function keys() {
    const out = [];
    if (keyMem) out.push(keyMem);
    try { const k = localStorage.getItem('dash_fkey_v1'); if (k && !out.includes(k)) out.push(k); } catch (e) {}
    try { const t = await (await fetch(DASH_URL + '?t=' + Date.now(), { cache: 'no-store' })).text(); const m = t.match(/DEF_F\s*=\s*'([^']+)'/); if (m && !out.includes(m[1])) out.push(m[1]); } catch (e) {}
    return out;
  }
  async function load(force) {
    if (!force && cache && Date.now() - cacheAt < 5 * 60e3) return cache;
    if (!(window.crypto && crypto.subtle)) throw new Error('이 브라우저에서는 주문 자료를 열 수 없습니다. 크롬으로 열어 주세요.');
    const r = await fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('주문 자료 파일을 받지 못했습니다 (' + r.status + '). 인터넷 연결을 확인해 주세요.');
    const enc = await r.json();
    const tryKeys = keyMem ? [keyMem] : [];
    let d = null;
    for (const k of tryKeys) { try { d = await decrypt(enc, k); break; } catch (e) {} }
    if (!d) for (const k of await keys()) { try { d = await decrypt(enc, k); keyMem = k; break; } catch (e) {} }
    if (!d) throw new Error('주문 자료를 열지 못했습니다 (열쇠가 바뀐 것 같습니다). 사무실에 알려 주세요.');
    const o = d.factory && d.factory.orders9;
    if (!o || !o.ok) throw new Error('생산 주문 자료가 아직 없습니다. 사무실 PC가 자료를 만든 뒤(오전 7:50·오후 5:50) 다시 눌러 주세요.');
    cache = o; cacheAt = Date.now();
    return o;
  }

  /* ── 보여 주기 ── */
  let box = null, showAll = false, idleT = 0, tab = 'fut', pastN = 14, fcProd = -1, fcAll = false; const custOpen = new Set();
  const nm = (o, k) => ((o.cols || []).find(c => c.k === k) || {}).nm || k;
  const qtyTxt = c => (c.box ? c.box + '박스' : '') + (c.box && c.ea ? ' + ' : '') + (c.ea ? c.ea + '개' : '');
  function view(o) {
    const today = ymd(new Date()), tomorrow = addD(today, 1), n7 = addD(today, 7), n30 = addD(today, 30), yday = addD(today, -1);
    const days = (o.days || []).filter(d => d.d >= today && d.d <= n30 && Object.keys(d.cells || {}).length).sort((a, b) => a.d.localeCompare(b.d));
    /* 앞으로 7일 합계 (오늘~6일 뒤) — 날짜는 기기 오늘 기준으로 다시 계산 */
    const tot = {}, totEa = {}; let all7 = 0;
    for (const d of days) if (d.d < n7) for (const [k, c] of Object.entries(d.cells)) { tot[k] = (tot[k] || 0) + (c.box || 0); totEa[k] = (totEa[k] || 0) + (c.ea || 0); all7 += c.box || 0; }
    const topK = Object.keys(tot).sort((a, b) => tot[b] - tot[a])[0];
    let h = '';
    const snap = String(o.snap || '');
    h += '<p class="fo-src">이카운트 판매 전표 · <b>출고일 기준</b> · 자료 <b>' + E(snap.slice(5, 10).replace('-', '/') + ' ' + snap.slice(11, 16)) + '</b> 확인분 (사무실 PC가 매일 오전 7:50·오후 5:50 새로 만듦)<br>상무님께 드리는 생산 주문표와 같은 자료입니다. 서로도우 거래처·생지·비상품은 빠져 있습니다.</p>';
    const age = Date.now() - new Date(snap.replace(' ', 'T') + ':00+09:00').getTime();
    if (!snap || !(age < 36 * 3600e3)) h += '<div class="fo-warn">주의: 자료가 하루 넘게 새로 만들어지지 않았습니다. 최근 주문이 빠졌을 수 있으니 사무실에 확인해 주세요.</div>';
    if ((o.missing || []).length) h += '<p class="fo-src">참고: ' + E(o.missing.join('·')) + '은(는) 이카운트 판매 품목에서 찾지 못해 표시되지 않습니다.</p>';
    h += '<h2>앞으로 7일 출고 합계 · ' + E(md(today)) + '~' + E(md(addD(today, 6))) + ' · 총 ' + all7 + '박스</h2><div class="fo-tiles">';
    for (const c of (o.cols || [])) { const v = tot[c.k] || 0, ea = totEa[c.k] || 0; h += '<div class="fo-tile' + (v || ea ? '' : ' zero') + (c.k === topK && v ? ' top' : '') + '"><div class="nm">' + E(c.nm) + '</div><div class="n">' + v + '<small>박스</small>' + (ea ? '<small> +' + ea + '개</small>' : '') + '</div></div>'; }
    h += '</div>';
    h += '<h2>출고일별 주문 · 거래처와 수량</h2>';
    const list = showAll ? days : days.filter(d => d.d < n7);
    if (!list.length) h += '<div class="fo-gap">' + (showAll ? '앞으로 30일' : '앞으로 7일') + ' 안에 들어온 생산 주문이 없습니다.</div>';
    let prev = '';
    for (const d of list) {
      if (prev && d.d > addD(prev, 1)) { const a = addD(prev, 1), b = addD(d.d, -1); h += '<div class="fo-gap">' + E(md(a)) + (a === b ? '' : ' ~ ' + E(md(b))) + ' · 주문 없음</div>'; }
      prev = d.d;
      let sum = 0; for (const c of Object.values(d.cells)) sum += c.box || 0;
      h += '<div class="fo-day' + (d.d === today ? ' today' : '') + '"><div class="fo-dh">' + E(md(d.d)) + ' 출고' + (d.d === today ? '<span class="lb">오늘</span>' : d.d === tomorrow ? '<span class="lb">내일</span>' : '') + '<span class="sum">합계 ' + sum + '박스</span></div><div class="fo-rows">';
      for (const c of (o.cols || [])) {
        const cell = d.cells[c.k]; if (!cell) continue;
        const lines = (cell.lines || []).slice().sort((a, b) => b.q - a.q);
        h += '<div class="fo-r"><div class="pn">' + E(c.nm) + '<b>' + E(qtyTxt(cell)) + '</b></div><ul>' + lines.map(l => '<li>' + E(l.c) + ' <b>' + E(l.q + l.u) + '</b>' + (l.in && l.in >= yday ? '<span class="fo-new">새 주문</span>' : '') + '</li>').join('') + '</ul></div>';
      }
      h += '</div></div>';
    }
    if (!showAll && days.some(d => d.d >= n7)) h += '<button type="button" class="fo-more" data-fo="all">30일 모두 보기 (' + E(md(n7)) + ' 이후 ' + days.filter(d => d.d >= n7).length + '일 더)</button>';
    else if (showAll) h += '<button type="button" class="fo-more" data-fo="seven">7일만 보기</button>';
    h += '<p class="fo-src">「새 주문」 = 어제·오늘 이카운트에 처음 보인 주문입니다.</p>';
    return { html: h, speak: speakText(o, days, today, tomorrow, all7, tot, topK) };
  }
  /* ── 지난 주문 (v002) ── */
  const dd = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
  const histOk = o => o.hist && o.hist.d && o.hist.c;
  const noHist = '<div class="fo-warn">지난 주문 자료가 아직 없습니다. 사무실 PC가 다음 자료(오전 7:50·오후 5:50)를 만든 뒤 다시 열어 주세요.</div>';
  function qStr(box, ea) { return (box ? box + '박스' : '') + (box && ea ? '+' : '') + (ea ? ea + '개' : ''); }
  function viewPast(o) {
    if (!histOk(o)) return noHist;
    const today = ymd(new Date()), from = addD(today, -pastN), cols = o.cols || [], H = o.hist;
    const days = Object.keys(H.d).filter(d => d >= from && d < today).sort().reverse();
    const tot = {}, totEa = {}; let all = 0;
    for (const d of days) for (const r of H.d[d]) { tot[r[0]] = (tot[r[0]] || 0) + r[2]; totEa[r[0]] = (totEa[r[0]] || 0) + r[3]; all += r[2]; }
    let h = '<div class="fo-seg">' + [[7, '지난 7일'], [14, '2주'], [31, '한 달'], [92, '3개월'], [183, '6개월']].map(x => '<button type="button" data-fo="pn" data-n="' + x[0] + '"' + (pastN === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>').join('') + '</div>';
    h += '<p class="fo-src">이카운트 판매 전표 · 출고일 기준 · 이력 ' + E(md(H.from)) + '부터 · 서로도우 거래처·생지·비상품 제외</p>';
    h += '<h2>' + E(md(from)) + '~' + E(md(addD(today, -1))) + ' 출고 합계 · 총 ' + all + '박스</h2><div class="fo-tiles">';
    cols.forEach((c, i) => { const v = tot[i] || 0, ea = totEa[i] || 0; h += '<div class="fo-tile' + (v || ea ? '' : ' zero') + '"><div class="nm">' + E(c.nm) + '</div><div class="n">' + v + '<small>박스</small>' + (ea ? '<small> +' + ea + '개</small>' : '') + '</div></div>'; });
    h += '</div><h2>날짜별 · 최근 날짜부터</h2>';
    if (!days.length) h += '<div class="fo-gap">이 기간에 생산 제품 출고가 없습니다.</div>';
    for (const d of days) {
      const rows = H.d[d]; let sum = 0; rows.forEach(r => sum += r[2]);
      h += '<div class="fo-day"><div class="fo-dh">' + E(md(d)) + ' 출고<span class="sum">합계 ' + sum + '박스</span></div><div class="fo-rows">';
      cols.forEach((c, i) => {
        const rs = rows.filter(r => r[0] === i); if (!rs.length) return; let b = 0, ea = 0; rs.forEach(r => { b += r[2]; ea += r[3]; });
        h += '<div class="fo-r"><div class="pn">' + E(c.nm) + '<b>' + E(qStr(b, ea)) + '</b></div><ul>' + rs.sort((x, y) => y[2] - x[2]).map(r => '<li>' + E(H.c[r[1]]) + ' <b>' + E(qStr(r[2], r[3])) + '</b></li>').join('') + '</ul></div>';
      });
      h += '</div></div>';
    }
    return h;
  }
  /* ── 거래처별 발주 예상 (v002): 지난 주문 간격의 중간값으로 다음 주문일을 어림 ── */
  function fcData(o) {
    const today = ymd(new Date()), H = o.hist, start = addD(today, -180), recent = addD(today, -120);
    const map = {};
    for (const d of Object.keys(H.d)) { if (d < start) continue; for (const r of H.d[d]) { const k = r[1] + '|' + r[0]; const m = map[k] || (map[k] = { ci: r[1], fi: r[0], ord: {} }); const x = m.ord[d] || (m.ord[d] = [0, 0]); x[0] += r[2]; x[1] += r[3]; } }
    const list = [];
    for (const m of Object.values(map)) {
      const ds = Object.keys(m.ord).sort(); const past = ds.filter(d => d < today), fut = ds.filter(d => d >= today);
      if (!ds.length || ds[ds.length - 1] < recent) continue;
      const gaps = []; for (let i = 1; i < ds.length; i++) gaps.push(dd(ds[i - 1], ds[i]));
      gaps.sort((a, b) => a - b); const med = gaps.length ? gaps[Math.floor((gaps.length - 1) / 2)] : 0;
      const last5 = past.slice(-5); const unitEa = last5.length && last5.every(d => !m.ord[d][0]);
      const avg = last5.length ? Math.round(last5.reduce((s, d) => s + (unitEa ? m.ord[d][1] : m.ord[d][0]), 0) / last5.length * 10) / 10 : 0;
      const lastD = ds[ds.length - 1]; let st, key, exp = '';
      if (fut.length) { st = 'in'; key = fut[0]; }
      else if (!med || ds.length < 3) { st = 'one'; key = '9999'; if (med) exp = addD(lastD, med); }
      else { exp = addD(lastD, med); key = exp; if (exp < addD(today, -Math.max(Math.round(med / 2), 7))) { st = 'gone'; key = '9998'; } else if (exp < today) st = 'late'; else if (exp < addD(today, 7)) st = 'week'; else st = 'later'; }
      const dist = st === 'in' ? dd(today, fut[0]) : exp ? Math.abs(dd(today, exp)) : 9999;
      list.push({ dist, ci: m.ci, fi: m.fi, ds, past, fut, med, avg, unitEa, n: ds.length, lastPast: past[past.length - 1] || '', exp, st, key, ord: m.ord });
    }
    return list;
  }
  const ST_LB = { late: ['예상일 지남', 'lt'], week: ['이번 주 예상', 'wk'], later: ['예상', 'lr'], in: ['주문 들어옴', 'in'], one: ['주문 적음', 'gy'], gone: ['뜸해짐', 'gy'] };
  function viewFc(o) {
    if (!histOk(o)) return noHist;
    const today = ymd(new Date()), cols = o.cols || [], H = o.hist;
    const all = fcData(o).filter(x => fcProd < 0 || x.fi === fcProd);
    /* 앞으로 7일 안에 들어올 것 같은데 아직 안 들어온 주문 (예상일 지남 + 이번 주 예상) */
    const exp = {}, expN = {}; for (const x of all) if ((x.st === 'late' || x.st === 'week') && !x.unitEa) { exp[x.fi] = (exp[x.fi] || 0) + x.avg; expN[x.fi] = (expN[x.fi] || 0) + 1; }
    let h = '<p class="fo-src">최근 6개월 주문 간격의 <b>중간값</b>으로 다음 주문일을, 최근 5번 평균으로 수량을 어림한 <b>참고값</b>입니다. 실제 주문은 거래처 사정에 따라 달라집니다.</p>';
    h += '<h2>앞으로 7일 예상 주문 · 아직 이카운트에 안 들어온 것</h2><div class="fo-tiles">';
    cols.forEach((c, i) => { const v = Math.round(exp[i] || 0); h += '<div class="fo-tile' + (v ? '' : ' zero') + '"><div class="nm">' + E(c.nm) + '</div><div class="n">' + v + '<small>박스</small></div><div class="sub">' + (expN[i] ? expN[i] + '곳 예상' : '예상 없음') + '</div></div>'; });
    h += '</div><p class="fo-src">※ 몇 주에 한 번 크게 주문하는 거래처가 있으면 합계가 커질 수 있습니다. 아래 거래처별 내용을 함께 봐 주세요. 낱개(개) 주문은 합계에서 뺐습니다.</p>';
    h += '<div class="fo-seg"><button type="button" data-fo="fp" data-i="-1"' + (fcProd < 0 ? ' class="on"' : '') + '>전체 제품</button>' + cols.map((c, i) => '<button type="button" data-fo="fp" data-i="' + i + '"' + (fcProd === i ? ' class="on"' : '') + '>' + E(c.nm) + '</button>').join('') + '</div>';
    /* 거래처로 묶기 */
    const byC = {}; for (const x of all) (byC[x.ci] || (byC[x.ci] = [])).push(x);
    const rank = { late: 0, week: 1, in: 2, later: 3, one: 4, gone: 5 };
    let cs = Object.keys(byC).map(ci => { const xs = byC[ci].sort((a, b) => rank[a.st] - rank[b.st] || a.dist - b.dist); return { ci: +ci, xs, r: rank[xs[0].st], dist: xs[0].dist }; });
    cs.sort((a, b) => a.r - b.r || a.dist - b.dist);
    const hidden = cs.filter(c => c.r >= 4).length; if (!fcAll) cs = cs.filter(c => c.r < 4);
    h += '<h2>거래처별 · 예상일 가까운 순 (' + cs.length + '곳)</h2>';
    for (const c of cs) {
      const open = custOpen.has(c.ci);
      h += '<div class="fo-day fo-cu"><button type="button" class="fo-dh fo-ch" data-fo="cu" data-c="' + c.ci + '">' + E(H.c[c.ci]) + '<span class="sum">' + (open ? '▲ 접기' : '▼ 전체 이력') + '</span></button>';
      for (const x of c.xs) {
        const lb = ST_LB[x.st]; const u = x.unitEa ? '개' : '박스';
        const when = x.st === 'in' ? md(x.fut[0]) + ' 출고 ' + qStr(x.ord[x.fut[0]][0], x.ord[x.fut[0]][1]) : x.exp ? md(x.exp) + '쯤' : '';
        const recentL = x.ds.slice(-6).reverse().map(d => '<span class="' + (d >= today ? 'fu' : '') + '">' + E(md(d)) + ' <b>' + E(qStr(x.ord[d][0], x.ord[d][1])) + '</b></span>').join('');
        h += '<div class="fo-fr"><div class="pn">' + E(cols[x.fi].nm) + '</div><div class="fo-st ' + lb[1] + '">' + lb[0] + (when ? '<b>' + E(when) + '</b>' : '') + '</div><div class="fo-meta">' + (x.med && x.n >= 3 ? '보통 <b>' + x.med + '일</b>마다 · ' : '') + '평균 <b>' + x.avg + u + '</b> · 6개월 ' + x.n + '번</div><div class="fo-rec">' + recentL + '</div></div>';
      }
      if (open) {
        const ds = Object.keys(H.d).filter(d => H.d[d].some(r => r[1] === c.ci)).sort().reverse();
        h += '<div class="fo-hist"><div class="hh">전체 이력 · ' + E(md(H.from)) + '부터 ' + ds.length + '번 출고</div>' + ds.map(d => '<div class="fo-hr' + (d >= today ? ' fu' : '') + '"><em>' + E(md(d)) + (d.slice(0, 4) !== today.slice(0, 4) ? ' ' + d.slice(0, 4) : '') + '</em><span>' + H.d[d].filter(r => r[1] === c.ci).map(r => E(cols[r[0]].nm) + ' <b>' + E(qStr(r[2], r[3])) + '</b>').join(' · ') + '</span></div>').join('') + '</div>';
      }
      h += '</div>';
    }
    if (hidden || fcAll) h += '<button type="button" class="fo-more" data-fo="fa">' + (fcAll ? '예상 있는 거래처만 보기' : '주문이 적거나 뜸해진 거래처 ' + hidden + '곳 더 보기') + '</button>';
    return h;
  }
  const josa = w => { const c = String(w).charCodeAt(String(w).length - 1); if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 ? '이' : '가'; return /[0-9]$/.test(w) ? ((/[013678]$/.test(w)) ? '이' : '가') : '이'; };
  function speakText(o, days, today, tomorrow, all7, tot, topK) {
    const sumOf = d => { if (!d) return 0; let s = 0; for (const c of Object.values(d.cells)) s += c.box || 0; return s; };
    const dT = days.find(d => d.d === today), dM = days.find(d => d.d === tomorrow);
    const part = (lb, d) => { const s = sumOf(d); if (!s) return lb + ' 출고 주문은 없습니다.'; const items = (o.cols || []).filter(c => d.cells[c.k] && d.cells[c.k].box).map(c => c.nm + ' ' + d.cells[c.k].box + '박스'); return lb + ' 출고는 ' + items.slice(0, 4).join(', ') + (items.length > 4 ? ' 등' : '') + ', 모두 ' + s + '박스입니다.'; };
    return '생산 주문 현황입니다. ' + part('오늘', dT) + ' ' + part('내일', dM) + ' 7일 합계는 ' + all7 + '박스' + (topK && tot[topK] ? '이고, ' + nm(o, topK) + josa(nm(o, topK)) + ' ' + tot[topK] + '박스로 가장 많습니다.' : '입니다.');
  }
  function frame(inner) {
    return '<div class="fo-wrap"><div class="fo-head"><h1>📋 생산 주문 현황<small>박태일 상무님 생산 주문표 · ' + E(md(ymd(new Date()))) + ' 기준</small></h1><button type="button" class="fo-x" data-fo="close">✕ 닫기</button></div><div class="fo-tabs">' + [['fut', '앞으로 주문'], ['past', '지난 주문'], ['fc', '거래처별 발주 예상']].map(t => '<button type="button" data-fo="tab" data-t="' + t[0] + '"' + (tab === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>').join('') + '</div>' + inner +
      '<div class="fo-foot"><button type="button" data-fo="reload">🔄 새 자료 다시 받기</button><button type="button" data-fo="voice">' + (V.on ? '🎤 말로 열기 켜짐 · 끄기' : '🎤 말로 열기 꺼짐 · 켜기') + '</button><span>' + (V.on ? '「주문현황 알려줘」라고 말하면 열리고, 「닫아」라고 하면 닫힙니다. 녹음·저장은 하지 않습니다.' : '켜면 「주문현황 알려줘」라는 말로 이 창을 열 수 있습니다.') + '</span><span class="ver">주문현황 ' + VER + ' · ' + BUILT + '</span></div></div>';
  }
  function bump() { clearTimeout(idleT); idleT = setTimeout(close, 3 * 60e3); /* 3분 동안 안 만지면 일지로 돌아감 */ }
  async function open(opts) {
    opts = opts || {};
    if (!box) {
      box = document.createElement('div'); box.id = 'ford'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '생산 주문 현황');
      document.body.appendChild(box);
      box.addEventListener('click', ev => {
        bump(); const b = ev.target.closest('[data-fo]'); if (!b) return; const a = b.dataset.fo;
        if (a === 'close') return close();
        if (a === 'all') { showAll = true; return draw(false); }
        if (a === 'seven') { showAll = false; return draw(false); }
        if (a === 'reload') return draw(true);
        if (a === 'voice') { setVoice(!V.on); return draw(false); }
        if (a === 'tab') { tab = b.dataset.t; keepTop = true; return draw(false); }
        if (a === 'pn') { pastN = +b.dataset.n; return draw(false); }
        if (a === 'fp') { fcProd = +b.dataset.i; return draw(false); }
        if (a === 'fa') { fcAll = !fcAll; return draw(false); }
        if (a === 'cu') { const c = +b.dataset.c; custOpen.has(c) ? custOpen.delete(c) : custOpen.add(c); return draw(false); }
      });
      box.addEventListener('scroll', bump, { passive: true });
    }
    if (opts.tab) { tab = opts.tab; keepTop = true; }
    bump();
    await draw(!!opts.force, opts.speak);
  }
  let keepTop = false;
  async function draw(force, speak) {
    if (!box) return;
    if (!cache || force) box.innerHTML = frame('<div class="fo-load">주문 자료를 받는 중입니다…</div>');
    try {
      const o = await load(force); if (!box) return;
      const v = tab === 'fut' ? view(o) : { html: tab === 'past' ? viewPast(o) : viewFc(o) }; const y = box.scrollTop; box.innerHTML = frame(v.html); if (!force && !keepTop) box.scrollTop = y; else box.scrollTop = 0; keepTop = false;
      if (speak && v.speak) say(v.speak);
    } catch (e) {
      if (!box) return;
      box.innerHTML = frame('<div class="fo-err">' + E(e.message || e) + '</div>');
      if (speak) say('주문 자료를 열지 못했습니다. 화면을 확인해 주세요.');
    }
  }
  function close() { clearTimeout(idleT); tab = 'fut'; custOpen.clear(); fcAll = false; try { speechSynthesis.cancel(); } catch (e) {} if (box) { box.remove(); box = null; } showAll = false; }
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-ford-open]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); open({}); }, true);
  addEventListener('keydown', ev => { if (box && ev.key === 'Escape') close(); });

  /* ── 소리로 읽어 주기 (말로 열었을 때만) ── */
  let speaking = false;
  function say(t) {
    try {
      if (!window.speechSynthesis || !t) return; speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t); u.lang = 'ko-KR'; u.rate = 1.05;
      const ko = speechSynthesis.getVoices().find(v => /ko[-_]KR/i.test(v.lang)); if (ko) u.voice = ko;
      speaking = true; stopRec();
      u.onend = u.onerror = () => { speaking = false; setTimeout(tick, 400); };
      speechSynthesis.speak(u);
    } catch (e) { speaking = false; }
  }

  /* ── 말로 열기 (계속 듣기) ── */
  const touch = () => { try { return matchMedia('(any-pointer:coarse)').matches; } catch (e) { return false; } };
  function saved() { try { return localStorage.getItem(LS_VOICE); } catch (e) { return null; } }
  function setVoice(on) { V.on = !!on && !!SR; try { localStorage.setItem(LS_VOICE, V.on ? 'on' : 'off'); } catch (e) {} if (!V.on) stopRec(); V.fails = 0; V.wait = 0; paintBtn(); tick(); }
  /* 다른 기능이 마이크를 쓰는 중인지: 영상통화·말로 개선 요청이 연 마이크를 셈 */
  try {
    const M = navigator.mediaDevices;
    if (M && M.getUserMedia && !M.__fordWrapped) {
      const g = M.getUserMedia.bind(M); M.__fordWrapped = true;
      M.getUserMedia = function (c) {
        const audio = c && c.audio; if (audio) { V.micBusy++; stopRec(); }
        return g(c).then(s => {
          if (audio) { let left = s.getAudioTracks().length; const done = () => { if (--left <= 0) { V.micBusy = Math.max(0, V.micBusy - 1); setTimeout(tick, 800); } }; if (!left) done(); else s.getAudioTracks().forEach(t => { const st = t.stop.bind(t); let ended = false; const fin = () => { if (ended) return; ended = true; done(); }; t.stop = function () { st(); fin(); }; t.addEventListener('ended', fin); }); }
          return s;
        }, e => { if (audio) V.micBusy = Math.max(0, V.micBusy - 1); throw e; });
      };
    }
  } catch (e) {}
  const blocked = () => !V.on || speaking || V.micBusy > 0 || document.visibilityState !== 'visible' || !!document.getElementById('frq') || !document.getElementById('fld');
  function stopRec() { const r = V.rec; V.rec = null; V.live = false; if (r) { try { r.onend = null; r.abort(); } catch (e) {} } paintBtn(); }
  function heard(t) {
    const s = String(t || '').replace(/\s+/g, '');
    if (/발주예상|주문예상|발주예측|주문예측/.test(s)) { open({ tab: 'fc' }); return true; }
    if (/지난주문|과거주문|지난거래|지난출고/.test(s)) { open({ tab: 'past' }); return true; }
    if (/주문현황|주문상황|주문현항|주문내역알려|주문알려|주문보여/.test(s)) { tab = 'fut'; if (!box) open({ speak: true }); else draw(true, true); return true; }
    if (box && /닫아|닫기|닫아줘|그만|창닫/.test(s)) { close(); return true; }
    return false;
  }
  function startRec() {
    if (V.rec || blocked() || Date.now() < V.wait) return;
    let r; try { r = new SR(); } catch (e) { return; }
    r.lang = 'ko-KR'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 3;
    let fired = false;
    r.onresult = ev => {
      V.fails = 0;
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        for (let j = 0; j < res.length; j++) if (!fired && heard(res[j].transcript)) { fired = true; setTimeout(() => { fired = false; }, 4000); break; }
      }
    };
    r.onerror = ev => {
      const er = ev && ev.error;
      if (er === 'not-allowed' || er === 'service-not-allowed') { V.wait = Date.now() + 10 * 60e3; if (saved() !== 'on') { V.on = false; } }
      else if (er === 'network') V.wait = Date.now() + 30e3;
      else if (er === 'audio-capture') V.wait = Date.now() + 60e3;
      else if (er !== 'no-speech' && er !== 'aborted') V.fails++;
      if (V.fails > 5) V.wait = Date.now() + 60e3;
    };
    r.onend = () => { if (V.rec === r) { V.rec = null; V.live = false; paintBtn(); } setTimeout(tick, 600); };
    r.onstart = () => { V.live = true; paintBtn(); };
    try { r.start(); V.rec = r; } catch (e) { V.rec = null; }
  }
  function tick() { if (blocked()) { if (V.rec) stopRec(); return; } startRec(); }
  async function boot() {
    if (!SR) return;
    const s = saved();
    if (s === 'off') return;
    if (s === 'on') { V.on = true; paintBtn(); return tick(); }
    /* 처음: 터치 기기(키오스크·태블릿)이고 마이크가 이미 허용된 경우에만 자동으로 켬 → 사무실 PC·휴대폰에서 허용 창이 뜨지 않음 */
    if (!touch()) return;
    try { const p = await navigator.permissions.query({ name: 'microphone' }); if (p.state === 'granted') { V.on = true; paintBtn(); tick(); } } catch (e) {}
  }
  document.addEventListener('visibilitychange', () => setTimeout(tick, 300));
  setInterval(tick, 3000);
  setTimeout(boot, 2500);
  window.fieldOrders = { open: () => open({}), close, ver: VER + ' · ' + BUILT, voice: () => ({ on: V.on, live: V.live, micBusy: V.micBusy }), test: t => heard(t) };
})();
