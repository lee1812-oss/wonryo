/* 빵을그리다 영상통화 v001 · 2026-11-11 18:40
   - 공장 안 PC·키오스크·태블릿끼리 바로 영상통화 (무료, 슬랙 허들 대신)
   - 「연결 안내」만 PeerJS 무료 안내 서버(0.peerjs.com)를 거치고, 화면·소리는 기기끼리 직접(암호화) 오갑니다. 녹화·저장 없음.
   - 받는 쪽이 「받기」를 눌러야만 연결됩니다(자동 연결 없음).
   - 「회사 통화 코드」를 넣은 기기끼리만 서로 보입니다. 코드는 이 파일에 없고 기기마다 한 번 넣습니다.
   - 생산실 앱(field.html)에서는 상단 빵을그리다 로고 옆 📹 버튼, call.html에서는 화면 전체로 동작합니다. */
(function () {
  'use strict';
  if (window.__dbCall) return; window.__dbCall = true;
  var VER = 'v001', BUILT = '2026-11-11 18:40';
  var STANDALONE = !!window.DBCALL_STANDALONE;
  var Q = new URLSearchParams(location.search);
  var FAKE = Q.get('callfake') === '1';            /* 시험용: 카메라 대신 그림 화면 */
  var K_CODE = 'dbcall_code_v1', K_NAME = 'dbcall_name_v1', K_DEV = 'dbcall_dev_v1', K_MISS = 'dbcall_missed_v1', K_SEEN = 'dbcall_seen_v1';
  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function lsSet(k, v) { try { if (v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function rand(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hm(t) { var d = new Date(t); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function md(t) { var d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate(); }
  function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }

  /* 연결 링크(call.html#k=코드)로 열면 코드를 이 기기에 저장하고 주소에서 지움 */
  (function () { var m = location.hash.match(/[#&]k=([A-Za-z0-9-]{6,24})/); if (m) { lsSet(K_CODE, normCode(m[1])); try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} } })();
  var DEV = (Q.get('calldev') || '').replace(/[^a-z0-9]/gi, '').slice(0, 12) || lsGet(K_DEV);
  if (!DEV) { DEV = rand(4); lsSet(K_DEV, DEV); }
  if (Q.get('calldev')) { K_NAME += '_' + DEV; K_MISS += '_' + DEV; K_SEEN += '_' + DEV; }   /* 시험용: 한 PC에서 기기 여러 대 흉내 */
  var TAB = rand(2);
  function myName() { return lsGet(K_NAME) || ''; }

  var S = { prefix: '', me: '', peer: null, hubPeer: null, isHub: false, hubConn: null, hubConns: {}, roster: {}, rosterAt: 0,
            online: false, devices: {}, call: null, ring: null, panel: false, view: '', msg: '', started: false, joining: false };
  var bc = null; try { bc = new BroadcastChannel('dbcall-' + DEV); } catch (e) {}

  /* ───────── 화면 모양 ───────── */
  var CSS = '' +
    '.dbc-ic{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:54px;height:54px;padding:0 14px;margin:0 6px;border-radius:14px;border:3px solid #fff;background:#13834A;color:#fff;font:800 19px/1 Pretendard,"Malgun Gothic",sans-serif;cursor:pointer;box-shadow:0 2px 8px #0005;vertical-align:middle;flex:none}' +
    '.dbc-ic:hover{background:#0f6e3d}.dbc-ic .dbc-i{font-size:26px;line-height:1}.dbc-ic .dbc-dot{position:absolute;right:-5px;bottom:-5px;width:16px;height:16px;border-radius:50%;border:3px solid #fff;background:#9aa3ab}.dbc-ic.on .dbc-dot{background:#2ed36f}' +
    '.dbc-ic .dbc-bd{position:absolute;right:-8px;top:-9px;min-width:24px;height:24px;padding:0 5px;border-radius:12px;background:#d32f2f;color:#fff;font:800 15px/24px sans-serif;border:2px solid #fff}' +
    '@media (max-width:700px){.dbc-ic .dbc-t{display:none}.dbc-ic{padding:0 8px}}' +
    '#dbc,#dbc *{box-sizing:border-box}#dbc{font-family:Pretendard,"Pretendard Variable","Malgun Gothic",sans-serif;color:#15202b;font-size:18px;line-height:1.5;word-break:keep-all}' +
    '#dbc button{font:inherit;cursor:pointer;border:0;border-radius:14px;min-height:56px;padding:8px 18px;font-weight:800}' +
    '#dbc .dbc-mask{position:fixed;inset:0;z-index:2147483000;background:#0009;display:flex;align-items:flex-start;justify-content:center;padding:18px;overflow:auto}' +
    '#dbc .dbc-card{background:#fff;border-radius:18px;width:100%;max-width:760px;padding:22px 24px;box-shadow:0 10px 40px #0006}' +
    '#dbc.home .dbc-card{box-shadow:none;max-width:860px;margin:0 auto;padding:18px 20px}' +
    '#dbc .dbc-hd{display:flex;align-items:center;gap:12px;margin-bottom:6px}#dbc .dbc-hd h2{margin:0;font-size:28px;flex:1}' +
    '#dbc .dbc-x{background:#eceff1;color:#263238}#dbc .dbc-ver{font-size:15px;color:#37474f;font-weight:700;margin:0 0 12px}' +
    '#dbc .dbc-st{display:flex;align-items:center;gap:8px;font-weight:800;margin:6px 0 12px;font-size:18px}#dbc .dbc-st i{width:14px;height:14px;border-radius:50%;background:#9aa3ab;display:inline-block}#dbc .dbc-st.on i{background:#22b35e}' +
    '#dbc .dbc-list{display:flex;flex-direction:column;gap:10px;margin:10px 0}' +
    '#dbc .dbc-row{display:flex;align-items:center;gap:12px;border:2px solid #d5dbe0;border-radius:16px;padding:12px 14px;background:#f7f9fa}' +
    '#dbc .dbc-row b{font-size:23px;flex:1}#dbc .dbc-row small{display:block;font-size:15px;color:#2e7d32;font-weight:800}' +
    '#dbc .dbc-go{background:#13834A;color:#fff;font-size:21px;min-width:170px}#dbc .dbc-go:hover{background:#0f6e3d}' +
    '#dbc .dbc-empty{border:2px dashed #b0bec5;border-radius:16px;padding:18px;color:#263238;font-weight:700;background:#fafbfc}' +
    '#dbc .dbc-sec{margin-top:16px;padding-top:14px;border-top:2px solid #eceff1}#dbc .dbc-sec h3{margin:0 0 8px;font-size:20px}' +
    '#dbc .dbc-btns{display:flex;flex-wrap:wrap;gap:10px}#dbc .dbc-sub{background:#eceff1;color:#1c2830}#dbc .dbc-pri{background:#13834A;color:#fff}' +
    '#dbc input{font:inherit;font-size:24px;font-weight:800;border:3px solid #90a4ae;border-radius:14px;padding:10px 14px;width:100%;min-height:58px;letter-spacing:1px}' +
    '#dbc .dbc-picks{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}#dbc .dbc-picks button{background:#e3f2e9;color:#0f5132;border:2px solid #9fd3b4;min-height:54px}' +
    '#dbc .dbc-note{font-size:16px;color:#37474f;font-weight:600;margin:8px 0}#dbc .dbc-warn{color:#b71c1c;font-weight:800}' +
    '#dbc .dbc-miss{font-size:17px;font-weight:700}#dbc .dbc-miss li{margin:4px 0}#dbc .dbc-lab{display:inline-block;font-size:14px;font-weight:800;border-radius:8px;padding:1px 8px;margin-right:6px}' +
    '#dbc .lab-red{background:#fde7e7;color:#b71c1c}#dbc .lab-grn{background:#e3f4e8;color:#1b5e20}#dbc .lab-gry{background:#eceff1;color:#37474f}' +
    '#dbc .dbc-code{font-size:40px;font-weight:900;letter-spacing:4px;text-align:center;background:#f1f8f4;border:3px solid #13834A;border-radius:16px;padding:10px;margin:8px 0}' +
    /* 받는 화면 */
    '#dbc .dbc-ring{position:fixed;inset:0;z-index:2147483600;background:linear-gradient(160deg,#0b3d24,#13834A);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center}' +
    '#dbc .dbc-ring .r1{font-size:30px;font-weight:800;animation:dbcpulse 1s infinite}#dbc .dbc-ring .r2{font-size:54px;font-weight:900;line-height:1.2}#dbc .dbc-ring .r3{font-size:19px;font-weight:700;opacity:.95}' +
    '#dbc .dbc-ring .rb{display:flex;gap:22px;flex-wrap:wrap;justify-content:center;margin-top:10px}#dbc .dbc-ring button{min-width:220px;min-height:90px;font-size:30px;border-radius:24px}' +
    '#dbc .dbc-acc{background:#fff;color:#0b5d32}#dbc .dbc-rej{background:#c62828;color:#fff}' +
    '@keyframes dbcpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}' +
    /* 통화 화면 */
    '#dbc .dbc-call{position:fixed;inset:0;z-index:2147483500;background:#0d1117;color:#fff;display:flex;flex-direction:column}' +
    '#dbc .dbc-top{display:flex;align-items:center;gap:12px;padding:10px 16px;background:#000a;font-size:21px;font-weight:800;flex-wrap:wrap}#dbc .dbc-top .tm{font-variant-numeric:tabular-nums}' +
    '#dbc .dbc-top .nr{font-size:15px;font-weight:700;background:#ffffff22;border-radius:8px;padding:2px 10px}' +
    '#dbc .dbc-stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center}' +
    '#dbc .dbc-stage .rv{width:100%;height:100%;object-fit:contain;background:#000}' +
    '#dbc .dbc-stage .lv{position:absolute;right:16px;bottom:16px;width:26%;max-width:340px;min-width:140px;border-radius:14px;border:3px solid #fff;background:#222;transform:scaleX(-1);box-shadow:0 4px 18px #000a}' +
    '#dbc .dbc-wait{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-size:34px;font-weight:900;text-align:center;padding:20px}#dbc .dbc-wait small{font-size:20px;font-weight:700;opacity:.9}' +
    '#dbc .dbc-bar{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;padding:12px;background:#000a}' +
    '#dbc .dbc-bar button{min-width:150px;min-height:64px;font-size:21px;background:#eceff1;color:#111}#dbc .dbc-bar .off{background:#ffcdd2;color:#7f0000}#dbc .dbc-bar .end{background:#c62828;color:#fff;min-width:200px}' +
    '#dbc .dbc-play{position:absolute;top:16px;left:50%;transform:translateX(-50%);background:#fff;color:#111}' +
    '#dbc .dbc-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#263238;color:#fff;padding:14px 22px;border-radius:14px;font-size:20px;font-weight:800;box-shadow:0 6px 20px #0007;max-width:92vw;text-align:center}';

  var root = null;
  function ensureRoot() {
    if (root && document.body.contains(root)) return root;
    if (!document.getElementById('dbc-css')) { var st = document.createElement('style'); st.id = 'dbc-css'; st.textContent = CSS; document.head.appendChild(st); }
    root = document.createElement('div'); root.id = 'dbc'; if (STANDALONE) root.className = 'home';
    var home = STANDALONE && document.getElementById('dbcHome');
    (home || document.body).appendChild(root);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') { var b = root.querySelector('[data-a="' + ev.target.getAttribute('data-enter') + '"]'); if (b) b.click(); } });
    return root;
  }
  var layers = { panel: null, ring: null, call: null, toast: null };
  function layer(name) { ensureRoot(); var el = layers[name]; if (!el || !root.contains(el)) { el = document.createElement('div'); el.setAttribute('data-layer', name); root.appendChild(el); layers[name] = el; } return el; }
  function toast(t, ms) { var el = layer('toast'); el.innerHTML = '<div class="dbc-toast">' + E(t) + '</div>'; clearTimeout(toast.tm); toast.tm = setTimeout(function () { el.innerHTML = ''; }, ms || 4500); }

  /* ───────── 상단 📹 버튼 (생산실 앱 로고 옆) ───────── */
  function missedUnseen() { var seen = +lsGet(K_SEEN) || 0; return missed().filter(function (m) { return m.at > seen; }).length; }
  function iconHtml() { var n = missedUnseen(); return '<span class="dbc-i">📹</span><span class="dbc-t">영상통화</span><i class="dbc-dot"></i>' + (n ? '<b class="dbc-bd">' + n + '</b>' : ''); }
  function ensureIcon() {
    if (STANDALONE) return;
    var lg = document.querySelector('.fld-tt .fhd-lg'); if (!lg) return;
    var tt = lg.parentNode, ic = tt.querySelector('.dbc-ic');
    if (!ic) {
      ic = document.createElement('button'); ic.type = 'button'; ic.className = 'dbc-ic'; ic.title = '영상통화 (공장 안 기기끼리)';
      ic.addEventListener('click', function (ev) { ev.stopPropagation(); ev.preventDefault(); openPanel(); }, false);
      ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) { ic.addEventListener(t, function (ev) { ev.stopPropagation(); }, false); });
      lg.insertAdjacentElement('afterend', ic);
    }
    var h = iconHtml(); if (ic.__h !== h) { ic.innerHTML = h; ic.__h = h; }
    ic.classList.toggle('on', !!(S.online && S.rosterAt));
    var sm = document.querySelector('.fld-top .rqbar small');
    if (sm && !sm.querySelector('.dbc-ver')) { var sp = document.createElement('span'); sp.className = 'dbc-ver'; sp.textContent = ' · 영상통화 ' + VER + ' · ' + BUILT; sm.appendChild(sp); }
  }
  var icQueued = false;
  function queueIcon() { if (icQueued) return; icQueued = true; requestAnimationFrame(function () { icQueued = false; ensureIcon(); }); }

  /* ───────── 놓친 통화 ───────── */
  function missed() { try { return JSON.parse(lsGet(K_MISS) || '[]') || []; } catch (e) { return []; } }
  function addMissed(name) { var a = missed(); a.unshift({ name: name, at: Date.now() }); lsSet(K_MISS, JSON.stringify(a.slice(0, 20))); queueIcon(); if (S.panel) renderPanel(); }

  /* ───────── 패널 (기기 목록·설정) ───────── */
  function openPanel() { S.panel = true; S.view = ''; lsSet(K_SEEN, String(Date.now())); queueIcon(); renderPanel(); start(); }
  function closePanel() { S.panel = false; layer('panel').innerHTML = ''; }
  var PICKS = ['생산실 키오스크', '생산실 태블릿', '사무실 PC', '이사님 PC', '대표님', '포장실', '창고'];
  function renderPanel() {
    if (!S.panel && !STANDALONE) return;
    var code = lsGet(K_CODE), name = myName(), h = '';
    var head = '<div class="dbc-hd"><h2>📹 영상통화</h2>' + (STANDALONE ? '' : '<button class="dbc-x" data-a="close">✕ 닫기</button>') + '</div>' +
      (STANDALONE ? '' : '<p class="dbc-ver">영상통화 ' + VER + ' · ' + BUILT + ' 업데이트</p>');
    if (!code || S.view === 'code') {
      h = '<h3 style="font-size:22px;margin:6px 0">① 회사 통화 코드 넣기 (이 기기에서 한 번만)</h3>' +
        '<p class="dbc-note">우리 회사 기기끼리만 서로 보이게 하는 코드예요. 이혜영 이사님께 받아서 넣어 주세요. 영어·숫자 8자리입니다.</p>' +
        '<input data-in="code" data-enter="savecode" autocomplete="off" autocapitalize="characters" placeholder="예) ABCD-1234" value="">' +
        '<div class="dbc-btns" style="margin-top:12px"><button class="dbc-pri" data-a="savecode">저장</button>' + (code ? '<button class="dbc-sub" data-a="back">돌아가기</button>' : '') + '</div>';
    } else if (!name || S.view === 'name') {
      h = '<h3 style="font-size:22px;margin:6px 0">② 이 기기 이름 정하기</h3><p class="dbc-note">다른 기기 목록에 이 이름으로 보여요. 누르거나 직접 써 주세요.</p>' +
        '<div class="dbc-picks">' + PICKS.map(function (p) { return '<button data-a="pick" data-v="' + E(p) + '">' + E(p) + '</button>'; }).join('') + '</div>' +
        '<input data-in="name" data-enter="savename" maxlength="20" placeholder="직접 쓰기 (예: 2층 사무실)" value="' + E(name) + '">' +
        '<div class="dbc-btns" style="margin-top:12px"><button class="dbc-pri" data-a="savename">저장</button>' + (name ? '<button class="dbc-sub" data-a="back">돌아가기</button>' : '') + '</div>';
    } else if (S.view === 'share') {
      h = '<h3 style="font-size:22px;margin:6px 0">다른 기기 연결하기</h3><p class="dbc-note">새 기기에서 📹 영상통화를 누르고 아래 코드를 넣으면 돼요. 회사 밖 사람에게는 알려 주지 마세요.</p>' +
        '<div class="dbc-code">' + E(code.slice(0, 4) + '-' + code.slice(4)) + '</div>' +
        '<div class="dbc-btns"><button class="dbc-sub" data-a="copylink">설치 링크 복사 (카톡 나와의 채팅용)</button><button class="dbc-sub" data-a="back">돌아가기</button></div>';
    } else {
      var devs = Object.keys(S.devices).map(function (k) { return S.devices[k]; }).sort(function (a, b) { return a.name < b.name ? -1 : 1; });
      var st = !S.online ? '<div class="dbc-st"><i></i>연결 중… (인터넷 확인)</div>' : !S.rosterAt ? '<div class="dbc-st"><i></i>목록 받는 중…</div>' : '<div class="dbc-st on"><i></i>이 기기 「' + E(name) + '」 · 전화 받을 수 있음</div>';
      h = st + '<div class="dbc-list">' + (devs.length ? devs.map(function (d) {
        return '<div class="dbc-row"><b>' + E(d.name) + '<small><span class="dbc-lab lab-grn">켜짐</span>지금 받을 수 있어요</small></b><button class="dbc-go" data-a="call" data-dev="' + E(d.dev) + '">📞 영상통화</button></div>';
      }).join('') : '<div class="dbc-empty">지금 켜져 있는 다른 기기가 없어요.<br>상대 기기에서 <b>생산실 앱</b>이나 <b>영상통화 앱</b>이 켜져 있어야 목록에 나와요.</div>') + '</div>';
      var ms = missed().slice(0, 5);
      if (ms.length) h += '<div class="dbc-sec"><h3>놓친 영상통화</h3><ul class="dbc-miss">' + ms.map(function (m) { return '<li><span class="dbc-lab lab-red">놓침</span>' + E(md(m.at) + ' ' + hm(m.at)) + ' · ' + E(m.name) + '</li>'; }).join('') + '</ul><button class="dbc-sub" data-a="clearmiss">목록 지우기</button></div>';
      h += '<div class="dbc-sec"><h3>이 기기 설정</h3><div class="dbc-btns">' +
        '<button class="dbc-sub" data-a="rename">이름 바꾸기</button>' +
        '<button class="dbc-sub" data-a="test">🎥 카메라·마이크 시험</button>' +
        '<button class="dbc-sub" data-a="ringtest">🔔 벨소리 시험</button>' +
        (window.Notification && Notification.permission !== 'granted' ? '<button class="dbc-sub" data-a="notify">🔔 창이 가려져도 알림 받기</button>' : '') +
        '<button class="dbc-sub" data-a="share">다른 기기 연결하기</button>' +
        '<button class="dbc-sub" data-a="refresh">↻ 다시 연결</button></div>' +
        '<p class="dbc-note">받는 쪽이 「받기」를 눌러야만 연결돼요. 녹화·녹음·저장은 하지 않아요. ' + (STANDALONE ? '이 창을 닫으면 전화를 못 받아요(최소화는 괜찮아요).' : '') + '</p></div>';
    }
    var html = '<div class="dbc-card">' + head + h + '</div>';
    var el = layer('panel');
    el.innerHTML = STANDALONE ? html : '<div class="dbc-mask" data-a="mask">' + html + '</div>';
    var inp = el.querySelector('input'); if (inp && !STANDALONE) setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
  }

  function onClick(ev) {
    var b = ev.target.closest('[data-a]'); if (!b || !root.contains(b)) return;
    var a = b.getAttribute('data-a');
    if (a === 'mask') { if (ev.target === b) closePanel(); return; }
    ev.stopPropagation();
    if (a === 'close') return closePanel();
    if (a === 'back') { S.view = ''; return renderPanel(); }
    if (a === 'savecode') {
      var v = normCode((root.querySelector('[data-in="code"]') || {}).value);
      if (v.length < 6) return toast('코드를 다시 확인해 주세요 (영어·숫자 8자리)');
      var chg = v !== lsGet(K_CODE); lsSet(K_CODE, v); S.view = ''; renderPanel(); if (chg) restart(); return;
    }
    if (a === 'pick') { var i = root.querySelector('[data-in="name"]'); if (i) i.value = b.getAttribute('data-v'); return; }
    if (a === 'savename') {
      var n = String((root.querySelector('[data-in="name"]') || {}).value || '').trim().slice(0, 20);
      if (!n) return toast('이 기기 이름을 골라 주세요');
      lsSet(K_NAME, n); S.view = ''; renderPanel(); sendHello(); start(); return;
    }
    if (a === 'rename') { S.view = 'name'; return renderPanel(); }
    if (a === 'share') { S.view = 'share'; return renderPanel(); }
    if (a === 'copylink') {
      var link = location.href.replace(/[^/]*$/, '') + 'call.html#k=' + lsGet(K_CODE);
      (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { toast('복사했어요. 회사 사람에게만 보내 주세요.'); }, function () { toast('복사가 안 돼요. 코드를 직접 알려 주세요.'); });
      return;
    }
    if (a === 'clearmiss') { lsSet(K_MISS, ''); queueIcon(); return renderPanel(); }
    if (a === 'notify') { Notification.requestPermission().then(function () { renderPanel(); }); return; }
    if (a === 'refresh') { restart(); toast('다시 연결하는 중이에요'); return; }
    if (a === 'ringtest') { ringOnce(); return toast('벨소리가 들리면 정상이에요. 안 들리면 스피커 소리를 확인해 주세요.'); }
    if (a === 'test') return selfTest();
    if (a === 'call') return placeCall(b.getAttribute('data-dev'));
    if (a === 'accept') return accept();
    if (a === 'reject') return reject();
    if (a === 'hang') return hangUp();
    if (a === 'mic') return toggle('audio');
    if (a === 'cam') return toggle('video');
    if (a === 'play') { var vs = root.querySelectorAll('video'); vs.forEach(function (v) { v.play().catch(function () {}); }); b.remove(); return; }
    if (a === 'endtest') { stopStream(S.testStream); S.testStream = null; layer('call').innerHTML = ''; return; }
  }

  /* ───────── 연결 (PeerJS) ───────── */
  var PEER_OPT = { debug: 0, config: { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] } };
  function loadLib() {
    if (window.Peer) return Promise.resolve();
    var srcs = ['peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'], i = 0;
    return new Promise(function (ok, no) {
      (function next() { if (i >= srcs.length) return no(new Error('lib')); var s = document.createElement('script'); s.src = srcs[i++]; s.onload = function () { window.Peer ? ok() : next(); }; s.onerror = next; document.head.appendChild(s); })();
    });
  }
  function sha(t) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
  function start() {
    if (S.started || !lsGet(K_CODE) || !myName()) return;
    S.started = true;
    sha('dbcall|' + lsGet(K_CODE)).then(function (h) { S.prefix = 'dbc' + h.slice(0, 20); return loadLib(); })
      .then(connectMain).catch(function () { S.started = false; toast('영상통화 준비가 안 됐어요. 인터넷을 확인해 주세요.'); });
  }
  function teardown() {
    try { if (S.hubConn) S.hubConn.close(); } catch (e) {}
    try { if (S.hubPeer) S.hubPeer.destroy(); } catch (e) {}
    try { if (S.peer) S.peer.destroy(); } catch (e) {}
    S.peer = S.hubPeer = S.hubConn = null; S.isHub = false; S.hubConns = {}; S.roster = {}; S.rosterAt = 0; S.online = false; S.devices = {};
  }
  function restart() { teardown(); S.started = false; refresh(); start(); }
  function setOnline(v) { S.online = v; refresh(); }
  function refresh() { queueIcon(); if (S.panel || STANDALONE) { if (!(root && root.querySelector('input') && document.activeElement && document.activeElement.tagName === 'INPUT')) renderPanel(); } }

  function connectMain() {
    if (S.peer && !S.peer.destroyed) try { S.peer.destroy(); } catch (e) {}
    S.me = S.prefix + '-' + DEV + '-' + TAB;
    var p = new window.Peer(S.me, PEER_OPT); S.peer = p;
    p.on('open', function () { if (p !== S.peer) return; setOnline(true); setTimeout(joinHub, 200 + Math.random() * 1500); });
    p.on('call', onIncoming);
    p.on('connection', function (c) { c.on('data', function (d) { if (d && d.t === 'direct') onMsg(c.peer, d.msg); setTimeout(function () { try { c.close(); } catch (e) {} }, 1500); }); });
    p.on('disconnected', function () { if (p !== S.peer) return; setOnline(false); setTimeout(function () { if (p === S.peer && !p.destroyed && p.disconnected) try { p.reconnect(); } catch (e) {} }, 3000); });
    p.on('error', function (e) {
      if (p !== S.peer) return;
      if (e.type === 'peer-unavailable') { var m = String(e.message || '').match(/peer (\S+)/); return onPeerUnavailable(m ? m[1] : ''); }
      if (e.type === 'unavailable-id') { TAB = rand(2); return setTimeout(connectMain, 1500); }
      setOnline(false);
    });
  }
  /* 지킴이: 15초마다 연결 상태 확인 */
  setInterval(function () {
    if (!S.started || !S.prefix) return;
    if (!S.peer || S.peer.destroyed) return connectMain();
    if (S.peer.disconnected) { try { S.peer.reconnect(); } catch (e) {} return; }
    if (!S.isHub && (!S.hubConn || Date.now() - S.rosterAt > 65000)) joinHub();
    if (S.hubConn && S.hubConn.open) try { S.hubConn.send({ t: 'ping' }); } catch (e) {}
    if (S.isHub) hubSweep();
  }, 15000);

  /* 안내 기기(hub): 켜진 기기 중 하나가 「켜진 기기 목록」을 맡음. 꺼지면 다른 기기가 이어 맡음 */
  function hubId() { return S.prefix + '-hub'; }
  function joinHub() {
    if (!S.peer || S.peer.disconnected || S.isHub || S.joining) return;
    S.joining = true; closeHubClient();
    var hp = new window.Peer(hubId(), PEER_OPT), settled = false;
    var done = function () { settled = true; S.joining = false; };
    hp.on('open', function () { if (settled) { try { hp.destroy(); } catch (e) {} return; } done(); becomeHub(hp); });
    hp.on('error', function (e) {
      if (settled) { if (S.hubPeer === hp && e.type === 'unavailable-id') { resignHub(); connectHubClient(); } return; }
      done(); try { hp.destroy(); } catch (x) {}
      if (e.type === 'unavailable-id') connectHubClient(); else setTimeout(joinHub, 4000 + Math.random() * 4000);
    });
    setTimeout(function () { if (!settled) { done(); try { hp.destroy(); } catch (e) {} connectHubClient(); } }, 9000);
  }
  function becomeHub(hp) {
    S.isHub = true; S.hubPeer = hp; S.hubConns = {}; S.roster = {};
    hp.on('connection', function (c) {
      c.on('open', function () { S.hubConns[c.peer] = c; try { c.send({ t: 'roster', r: S.roster }); } catch (e) {} });
      c.on('data', function (d) { hubData(c, d); });
      c.on('close', function () { if (S.hubConns[c.peer] === c) { delete S.hubConns[c.peer]; delete S.roster[c.peer]; hubPush(); } });
      c.on('error', function () {});
    });
    hp.on('disconnected', function () { if (S.hubPeer === hp && !hp.destroyed) setTimeout(function () { if (S.hubPeer === hp && hp.disconnected) try { hp.reconnect(); } catch (e) {} }, 2000); });
    hubPush();
  }
  function resignHub() { try { if (S.hubPeer) S.hubPeer.destroy(); } catch (e) {} S.hubPeer = null; S.isHub = false; S.hubConns = {}; }
  function hubData(c, d) {
    if (!d) return; var now = Date.now();
    if (d.t === 'hello') { S.roster[c.peer] = { name: String(d.name || '').slice(0, 20), dev: String(d.dev || ''), t: now }; return hubPush(); }
    if (d.t === 'ping') { if (S.roster[c.peer]) S.roster[c.peer].t = now; else try { c.send({ t: 'who' }); } catch (e) {} return; }
    if (d.t === 'relay') { if (!deliver(d.to, c.peer, d.msg)) try { c.send({ t: 'nodeliver', to: d.to, msg: d.msg }); } catch (e) {} return; }
  }
  function deliver(to, from, msg) {
    if (to === S.me) { onMsg(from, msg); return true; }
    var c = S.hubConns[to]; if (c && c.open) { try { c.send({ t: 'msg', from: from, msg: msg }); return true; } catch (e) {} }
    return false;
  }
  function hubPush() {
    S.roster[S.me] = { name: myName(), dev: DEV, t: Date.now() };
    Object.keys(S.hubConns).forEach(function (k) { var c = S.hubConns[k]; if (c.open) try { c.send({ t: 'roster', r: S.roster }); } catch (e) {} });
    S.rosterAt = Date.now(); applyRoster();
  }
  function hubSweep() {
    var now = Date.now();
    Object.keys(S.roster).forEach(function (k) { if (k !== S.me && now - S.roster[k].t > 75000) { delete S.roster[k]; var c = S.hubConns[k]; if (c) { try { c.close(); } catch (e) {} delete S.hubConns[k]; } } });
    hubPush();
  }
  function helloMsg() { return { t: 'hello', name: myName(), dev: DEV }; }
  function sendHello() { if (S.isHub) hubPush(); else if (S.hubConn && S.hubConn.open) try { S.hubConn.send(helloMsg()); } catch (e) {} }
  function closeHubClient() { var c = S.hubConn; S.hubConn = null; if (c) try { c.close(); } catch (e) {} }
  function connectHubClient() {
    if (!S.peer || S.peer.disconnected) return;
    closeHubClient();
    var c = S.peer.connect(hubId(), { reliable: true }), opened = false; S.hubConn = c;
    c.on('open', function () { opened = true; try { c.send(helloMsg()); } catch (e) {} });
    c.on('data', function (d) {
      if (!d || S.hubConn !== c) return;
      if (d.t === 'roster') { S.roster = d.r || {}; S.rosterAt = Date.now(); applyRoster(); }
      else if (d.t === 'msg') onMsg(d.from, d.msg);
      else if (d.t === 'who') try { c.send(helloMsg()); } catch (e) {}
      else if (d.t === 'nodeliver') direct(d.to, d.msg);
    });
    c.on('close', function () { if (S.hubConn === c) { S.hubConn = null; S.rosterAt = 0; refresh(); setTimeout(joinHub, 800 + Math.random() * 3500); } });
    c.on('error', function () {});
    setTimeout(function () { if (!opened && S.hubConn === c) { closeHubClient(); setTimeout(joinHub, 800 + Math.random() * 3500); } }, 12000);
  }
  function applyRoster() {
    var devs = {};
    Object.keys(S.roster).forEach(function (id) { var r = S.roster[id]; if (!r || !r.dev || r.dev === DEV || !r.name) return; (devs[r.dev] = devs[r.dev] || { dev: r.dev, name: r.name, peers: [] }).peers.push(id); });
    S.devices = devs; refresh();
  }
  function sendTo(to, msg) {
    if (S.isHub) { if (deliver(to, S.me, msg)) return; }
    else if (S.hubConn && S.hubConn.open) { try { S.hubConn.send({ t: 'relay', to: to, msg: msg }); return; } catch (e) {} }
    direct(to, msg);
  }
  function direct(to, msg) { try { var c = S.peer.connect(to); c.on('open', function () { c.send({ t: 'direct', msg: msg }); setTimeout(function () { try { c.close(); } catch (e) {} }, 2000); }); c.on('error', function () {}); } catch (e) {} }
  function onPeerUnavailable(id) {
    if (id === hubId()) { if (S.hubConn) closeHubClient(); setTimeout(joinHub, 800 + Math.random() * 2500); return; }
    var c = S.call; if (c && c.state === 'calling' && c.targets.indexOf(id) >= 0) { c.failed[id] = 1; if (c.targets.every(function (t) { return c.failed[t]; })) endCall('상대 기기가 꺼져 있어요. 잠시 뒤 다시 걸어 보세요.'); }
  }

  /* ───────── 카메라·마이크 ───────── */
  function stopStream(s) { if (!s) return; try { s.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} if (s.__stop) s.__stop(); }
  function fakeVideoTrack(label) {
    var cv = document.createElement('canvas'); cv.width = 640; cv.height = 360; var g = cv.getContext('2d');
    var draw = function () { g.fillStyle = '#263238'; g.fillRect(0, 0, 640, 360); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 44px sans-serif'; g.fillText(myName() || '빵을그리다', 320, 160); g.font = 'bold 30px sans-serif'; g.fillText(label + ' · ' + hm(Date.now()), 320, 220); };
    draw(); var iv = setInterval(draw, 1000);
    var s = cv.captureStream(5); var t = s.getVideoTracks()[0]; t.__stop = function () { clearInterval(iv); }; return t;
  }
  function silentAudioTrack() { var a = ac(); if (!a) return null; var o = a.createOscillator(), gn = a.createGain(), d = a.createMediaStreamDestination(); gn.gain.value = 0; o.connect(gn); gn.connect(d); o.start(); var t = d.stream.getAudioTracks()[0]; t.__stop = function () { try { o.stop(); } catch (e) {} }; return t; }
  function fakeStream(label) {
    var s = new MediaStream(), v = fakeVideoTrack(label), au = silentAudioTrack(); s.addTrack(v); if (au) s.addTrack(au);
    s.__fake = true; s.__stop = function () { if (v.__stop) v.__stop(); if (au && au.__stop) au.__stop(); }; return s;
  }
  function getMedia() {
    if (FAKE) return Promise.resolve(fakeStream('시험 화면'));
    var M = navigator.mediaDevices; if (!M || !M.getUserMedia) return Promise.resolve(fakeStream('카메라를 쓸 수 없는 기기'));
    var A = { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, V = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24 } };
    return M.getUserMedia({ video: V, audio: A }).catch(function (e) {
      if (e && e.name === 'NotAllowedError') { toast('카메라·마이크가 막혀 있어요. 주소창 왼쪽 표시를 눌러 「허용」으로 바꿔 주세요.', 8000); return fakeStream('카메라 허용 안 됨'); }
      return M.getUserMedia({ audio: A }).then(function (s) { var v = fakeVideoTrack('카메라 없음 · 소리만'); s.addTrack(v); s.__stop = v.__stop; return s; })
        .catch(function () { return M.getUserMedia({ video: V }).then(function (s) { toast('마이크가 없어 화면만 보내요'); return s; }); })
        .catch(function () { toast('카메라·마이크를 찾지 못했어요. 상대 화면만 보여요.', 7000); return fakeStream('카메라·마이크 없음'); });
    });
  }

  /* ───────── 소리 (벨) ───────── */
  var AC = null;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } return AC; }
  document.addEventListener('pointerdown', function () { var a = ac(); if (a && a.state === 'suspended') a.resume().catch(function () {}); }, true);
  function beep(f, t0, d, vol) { var a = ac(); var o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.4, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + 0.05); }
  function ringOnce() { var a = ac(); if (!a) return; if (a.state === 'suspended') a.resume().catch(function () {}); var t = a.currentTime + 0.05; beep(988, t, 0.3); beep(784, t + 0.35, 0.3); beep(988, t + 0.7, 0.3); beep(784, t + 1.05, 0.3); }
  function backOnce() { var a = ac(); if (!a) return; var t = a.currentTime + 0.05; beep(440, t, 0.9, 0.12); }
  var snd = { iv: null, rel: null };
  function startSound(fn, every) {
    stopSound();
    var go = function () { fn(); snd.iv = setInterval(fn, every); };
    if (navigator.locks && fn === ringOnce) {   /* 같은 기기에 창이 여러 개여도 벨은 한 창에서만 */
      navigator.locks.request('dbcall-bell-' + DEV, { ifAvailable: true }, function (lock) { if (!lock || !S.ring) return; go(); return new Promise(function (res) { snd.rel = res; }); });
    } else go();
  }
  function stopSound() { if (snd.iv) clearInterval(snd.iv); snd.iv = null; if (snd.rel) { snd.rel(); snd.rel = null; } }

  /* ───────── 알림 (창이 가려져 있을 때) ───────── */
  var flash = { iv: null, top: null, title: '', note: null, banner: null };
  function topDoc() { try { if (window.top !== window && window.top.document) return window.top.document; } catch (e) {} return null; }
  function frameHidden() { var f = window.frameElement; if (!f) return false; var r = f.getBoundingClientRect(); return !r.width || !r.height || f.offsetParent === null; }
  function alertOn(name) {
    var d = topDoc() || document; flash.top = d; flash.title = d.title; var on = false;
    flash.iv = setInterval(function () { on = !on; d.title = on ? '📞 영상통화 왔어요!' : flash.title; }, 900);
    if (window.Notification && Notification.permission === 'granted' && (document.hidden || (topDoc() && topDoc().hidden) || frameHidden())) {
      try { flash.note = new Notification('📞 영상통화가 왔어요', { body: name + ' 에서 영상통화가 왔어요. 눌러서 받아 주세요.', tag: 'dbcall', requireInteraction: true }); flash.note.onclick = function () { try { window.top.focus(); } catch (e) {} window.focus(); }; } catch (e) {}
    }
    var td = topDoc();
    if (td && frameHidden()) {   /* 통합재고관리에서 생산일지 탭이 아닌 다른 화면을 보고 있을 때: 맨 위 창에 띠 표시 */
      var bn = td.createElement('div');
      bn.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;background:#13834A;color:#fff;font:800 24px/1.4 Pretendard,"Malgun Gothic",sans-serif;padding:14px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;box-shadow:0 4px 18px #0008';
      bn.innerHTML = '<span style="flex:1">📞 ' + E(name) + ' 에서 영상통화가 왔어요</span>';
      [['받기', '#fff', '#0b5d32', function () { showFrame(); accept(); }], ['거절', '#c62828', '#fff', function () { reject(); }]].forEach(function (x) {
        var b = td.createElement('button'); b.textContent = x[0]; b.style.cssText = 'min-height:60px;min-width:150px;border:0;border-radius:16px;font:800 24px sans-serif;cursor:pointer;background:' + x[1] + ';color:' + x[2]; b.onclick = x[3]; bn.appendChild(b);
      });
      td.body.appendChild(bn); flash.banner = bn;
    }
  }
  function showFrame() { var td = topDoc(); if (!td || !frameHidden()) return; var m = td.querySelector('[data-menu="prod"]'); if (m) try { m.click(); } catch (e) {} }
  function alertOff() {
    if (flash.iv) clearInterval(flash.iv); flash.iv = null; if (flash.top) flash.top.title = flash.title; flash.top = null;
    if (flash.note) try { flash.note.close(); } catch (e) {} flash.note = null;
    if (flash.banner) try { flash.banner.remove(); } catch (e) {} flash.banner = null;
  }

  /* ───────── 전화 받기 ───────── */
  function onIncoming(mc) {
    var m = mc.metadata || {};
    if (S.call || S.testStream || (S.ring && S.ring.cid !== m.cid)) { sendTo(mc.peer, { t: 'busy', cid: m.cid }); setTimeout(function () { try { mc.close(); } catch (e) {} }, 400); return; }
    var r = S.ring = { mc: mc, cid: m.cid, name: String(m.from || '이름 없는 기기').slice(0, 20), from: mc.peer, at: Date.now() };
    mc.on('close', function () { if (S.ring === r) { stopRing(); addMissed(r.name); } });
    r.timer = setTimeout(function () { if (S.ring === r) { stopRing(); addMissed(r.name); try { mc.close(); } catch (e) {} } }, 50000);
    layer('ring').innerHTML = '<div class="dbc-ring"><div class="r1">📞 영상통화가 왔어요</div><div class="r2">' + E(r.name) + '</div>' +
      '<div class="r3">「받기」를 누르면 서로 얼굴과 목소리가 연결돼요 · 녹화하지 않아요</div>' +
      '<div class="rb"><button class="dbc-acc" data-a="accept">📞 받기</button><button class="dbc-rej" data-a="reject">거절</button></div></div>';
    startSound(ringOnce, 2600); alertOn(r.name);
    try { if (navigator.vibrate) navigator.vibrate([400, 200, 400]); } catch (e) {}
  }
  function stopRing() { var r = S.ring; S.ring = null; if (r) clearTimeout(r.timer); stopSound(); alertOff(); layer('ring').innerHTML = ''; }
  if (bc) bc.onmessage = function (ev) {   /* 같은 기기의 다른 창에서 받았거나 거절함 → 이 창의 벨도 끔 */
    var d = ev.data || {}; if (S.ring && S.ring.cid === d.cid && (d.t === 'answered' || d.t === 'rejected')) { var mc = S.ring.mc; stopRing(); try { mc.close(); } catch (e) {} }
  };
  function accept() {
    var r = S.ring; if (!r) return;
    clearTimeout(r.timer); S.ring = null; stopSound(); alertOff(); layer('ring').innerHTML = '';
    if (bc) bc.postMessage({ t: 'answered', cid: r.cid });
    var c = S.call = { cid: r.cid, name: r.name, mc: r.mc, peerId: r.from, state: 'connecting', role: 'in', targets: [r.from], failed: {} };
    renderCall();
    getMedia().then(function (s) {
      if (S.call !== c) return stopStream(s);
      c.local = s; renderCall();
      try { r.mc.answer(s); } catch (e) { return endCall('연결하지 못했어요'); }
      bindLive(c, r.mc);
      c.timer = setTimeout(function () { if (S.call === c && c.state !== 'live') endCall('연결이 안 돼요. 두 기기가 같은 회사 인터넷에 있는지 확인해 주세요.'); }, 20000);
    });
  }
  function reject() {
    var r = S.ring; if (!r) return;
    sendTo(r.from, { t: 'reject', cid: r.cid }); if (bc) bc.postMessage({ t: 'rejected', cid: r.cid });
    var mc = r.mc; stopRing(); setTimeout(function () { try { mc.close(); } catch (e) {} }, 400);
  }

  /* ───────── 전화 걸기 ───────── */
  function placeCall(dev) {
    var d = S.devices[dev]; if (!d) return toast('상대 기기가 방금 꺼졌어요');
    if (S.call || S.ring) return;
    var cid = rand(4), c = S.call = { cid: cid, name: d.name, dev: dev, state: 'calling', role: 'out', mcs: {}, targets: d.peers.slice(), failed: {} };
    renderCall(); startSound(backOnce, 3000);
    getMedia().then(function (s) {
      if (S.call !== c) return stopStream(s);
      c.local = s; renderCall();
      c.targets.forEach(function (pid) {
        var mc; try { mc = S.peer.call(pid, s, { metadata: { cid: cid, from: myName(), dev: DEV } }); } catch (e) {}
        if (!mc) { c.failed[pid] = 1; return; }
        c.mcs[pid] = mc;
        mc.on('stream', function (remote) {
          if (S.call !== c || (c.mc && c.mc !== mc)) return;
          if (!c.mc) {
            c.mc = mc; c.peerId = pid; stopSound();
            Object.keys(c.mcs).forEach(function (k) { if (c.mcs[k] !== mc) { try { c.mcs[k].close(); } catch (e) {} sendTo(k, { t: 'cancel', cid: cid, why: 'elsewhere' }); } });
          }
          goLive(c, remote);
        });
        mc.on('close', function () { if (S.call === c && c.mc === mc) endCall('상대가 통화를 끊었어요'); });
        mc.on('error', function () {});
      });
      if (c.targets.every(function (t) { return c.failed[t]; })) endCall('걸지 못했어요. 다시 연결 후 걸어 보세요.');
    });
    c.timer = setTimeout(function () { if (S.call === c && c.state === 'calling') { cancelOut(c); endCall('받지 않았어요. 잠시 뒤 다시 걸어 보세요.'); } }, 45000);
  }
  function cancelOut(c) { Object.keys(c.mcs || {}).forEach(function (k) { sendTo(k, { t: 'cancel', cid: c.cid }); try { c.mcs[k].close(); } catch (e) {} }); }
  function onMsg(from, m) {
    if (!m) return;
    if (m.t === 'cancel') { if (S.ring && S.ring.cid === m.cid) { var r = S.ring, mc = r.mc; stopRing(); try { mc.close(); } catch (e) {} if (m.why !== 'elsewhere') addMissed(r.name); } return; }
    if (m.t === 'hangup') { if (S.call && S.call.cid === m.cid) endCall('상대가 통화를 끊었어요'); return; }
    var c = S.call; if (!c || c.cid !== m.cid || c.role !== 'out' || c.state !== 'calling') return;
    if (m.t === 'reject') { cancelOut(c); endCall('상대가 지금은 받을 수 없대요'); }
    if (m.t === 'busy') { cancelOut(c); endCall('상대가 다른 통화 중이에요'); }
  }

  /* ───────── 통화 화면 ───────── */
  function bindLive(c, mc) {
    mc.on('stream', function (remote) { if (S.call === c) goLive(c, remote); });
    mc.on('close', function () { if (S.call === c) endCall('통화가 끝났어요'); });
    mc.on('error', function () {});
  }
  function goLive(c, remote) {
    c.remote = remote; if (c.state !== 'live') { c.state = 'live'; c.t0 = Date.now(); clearTimeout(c.timer); watchIce(c); }
    renderCall();
  }
  function watchIce(c) {
    var bad = 0;
    c.iv = setInterval(function () {
      if (S.call !== c) return clearInterval(c.iv);
      var pc = c.mc && c.mc.peerConnection, st = pc ? pc.iceConnectionState : 'closed';
      if (st === 'failed' || st === 'closed') return endCall('연결이 끊겼어요');
      bad = st === 'disconnected' ? bad + 1 : 0; if (bad >= 10) return endCall('연결이 끊겼어요');
      var tm = root && root.querySelector('.dbc-top .tm'); if (tm) tm.textContent = mmss((Date.now() - c.t0) / 1000);
    }, 1000);
  }
  function trackOn(kind) { var c = S.call, s = c && c.local; if (!s || s.__fake) return null; var t = kind === 'audio' ? s.getAudioTracks()[0] : s.getVideoTracks()[0]; return t ? t.enabled : null; }
  function toggle(kind) { var s = S.call && S.call.local; if (!s) return; (kind === 'audio' ? s.getAudioTracks() : s.getVideoTracks()).forEach(function (t) { t.enabled = !t.enabled; }); renderCall(); }
  function renderCall() {
    var c = S.call, el = layer('call'); if (!c) { el.innerHTML = ''; return; }
    var live = c.state === 'live', mic = trackOn('audio'), cam = trackOn('video');
    if (!el.querySelector('.dbc-call')) {
      el.innerHTML = '<div class="dbc-call"><div class="dbc-top"><span>📹</span><span class="nm"></span><span class="tm"></span><span class="nr">녹화하지 않아요</span></div>' +
        '<div class="dbc-stage"><video class="rv" autoplay playsinline></video><div class="dbc-wait"></div><video class="lv" autoplay playsinline muted></video></div><div class="dbc-bar"></div></div>';
    }
    el.querySelector('.nm').textContent = c.name + (live ? ' 와 통화 중' : c.role === 'out' ? ' 부르는 중…' : ' 연결 중…');
    var wait = el.querySelector('.dbc-wait');
    wait.style.display = live ? 'none' : 'flex';
    wait.innerHTML = c.role === 'out' ? '📞 ' + E(c.name) + '<small>상대가 「받기」를 누르면 연결돼요</small>' : '연결하는 중…<small>잠시만 기다려 주세요</small>';
    var rv = el.querySelector('.rv'), lv = el.querySelector('.lv');
    if (c.remote && rv.srcObject !== c.remote) { rv.srcObject = c.remote; rv.play().catch(function () { if (!el.querySelector('.dbc-play')) { var b = document.createElement('button'); b.className = 'dbc-play'; b.setAttribute('data-a', 'play'); b.textContent = '🔊 눌러서 소리 켜기'; el.querySelector('.dbc-stage').appendChild(b); } }); }
    if (c.local && lv.srcObject !== c.local) { lv.srcObject = c.local; lv.play().catch(function () {}); }
    lv.style.display = c.local ? '' : 'none';
    el.querySelector('.dbc-bar').innerHTML =
      (mic === null ? '' : '<button data-a="mic" class="' + (mic ? '' : 'off') + '">' + (mic ? '🎤 마이크 끄기' : '🔇 마이크 꺼짐 · 켜기') + '</button>') +
      (cam === null ? '' : '<button data-a="cam" class="' + (cam ? '' : 'off') + '">' + (cam ? '📷 카메라 끄기' : '🚫 카메라 꺼짐 · 켜기') + '</button>') +
      '<button data-a="hang" class="end">' + (live ? '📞 끊기' : '취소') + '</button>';
    if (live) { var tm = el.querySelector('.tm'); tm.textContent = mmss((Date.now() - c.t0) / 1000); }
  }
  function hangUp() {
    var c = S.call; if (!c) return;
    if (c.state === 'calling') { cancelOut(c); return endCall('통화를 취소했어요'); }
    if (c.peerId) sendTo(c.peerId, { t: 'hangup', cid: c.cid });
    endCall('통화를 끊었어요');
  }
  function endCall(msg) {
    var c = S.call; if (!c) return; S.call = null;
    clearTimeout(c.timer); clearInterval(c.iv); stopSound();
    try { if (c.mc) c.mc.close(); } catch (e) {}
    Object.keys(c.mcs || {}).forEach(function (k) { try { c.mcs[k].close(); } catch (e) {} });
    stopStream(c.local);
    layer('call').innerHTML = '';
    if (msg) toast(msg);
  }
  function selfTest() {
    if (S.call || S.ring) return;
    getMedia().then(function (s) {
      S.testStream = s;
      var el = layer('call');
      el.innerHTML = '<div class="dbc-call"><div class="dbc-top"><span>🎥 카메라·마이크 시험</span><span class="nr">내 모습이 보이면 정상이에요 · 소리 막대가 움직이면 마이크 정상</span></div>' +
        '<div class="dbc-stage"><video class="rv" autoplay playsinline muted style="transform:scaleX(-1)"></video></div>' +
        '<div class="dbc-bar"><div style="flex:1;max-width:420px;height:26px;background:#333;border-radius:13px;overflow:hidden;align-self:center"><i class="lvl" style="display:block;height:100%;width:0;background:#2ed36f"></i></div><button data-a="endtest" class="end">시험 끝</button></div></div>';
      var v = el.querySelector('video'); v.srcObject = s; v.play().catch(function () {});
      var a = ac(), at = s.getAudioTracks()[0];
      if (a && at && !s.__fake) {
        var src = a.createMediaStreamSource(new MediaStream([at])), an = a.createAnalyser(); an.fftSize = 512; src.connect(an); var buf = new Uint8Array(an.fftSize);
        (function loop() { if (S.testStream !== s) return; an.getByteTimeDomainData(buf); var mx = 0; for (var i = 0; i < buf.length; i++) mx = Math.max(mx, Math.abs(buf[i] - 128)); var lv = el.querySelector('.lvl'); if (lv) lv.style.width = Math.min(100, mx * 1.6) + '%'; requestAnimationFrame(loop); })();
      }
    });
  }

  /* ───────── 시작 ───────── */
  function boot() {
    ensureRoot();
    if (STANDALONE) renderPanel();
    else { new MutationObserver(queueIcon).observe(document.body, { childList: true, subtree: true }); queueIcon(); }
    start();   /* 코드·이름이 있으면 바로 연결(전화 받을 준비) */
    window.addEventListener('pagehide', function () { if (S.call && S.call.peerId) sendTo(S.call.peerId, { t: 'hangup', cid: S.call.cid }); });
  }
  window.DBCALL = { ver: VER, built: BUILT, open: openPanel, state: function () { return { online: S.online, hub: S.isHub, devices: Object.keys(S.devices).map(function (k) { return S.devices[k].name; }), me: myName(), call: S.call && S.call.state, ring: !!S.ring }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
