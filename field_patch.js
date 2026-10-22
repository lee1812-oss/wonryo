
/* ══ 생산실 전용 앱(field.html) — 생산일지·CCP 현장 입력만 보이게 (2026-10-22 Aside) ══
   field.html이 이 index.html을 그대로 불러와 실행하므로 자료·동기화·저장 방식은 통합 재고관리와 100% 같다.
   index.html 안에서는 window.FIELD_APP이 없어서 아래 블록이 아무 일도 하지 않는다. */
(function () {
  if (!window.FIELD_APP) return;
  try { document.title = '빵을그리다 생산실'; } catch (e) {}
  const st = document.createElement('style');
  st.textContent = '#fld [data-f="close"]{display:none!important}#fld label.fld-auto{display:none!important}'
    + '.fapp-foot{margin:18px 4px 30px;padding:14px 16px;border-radius:14px;background:#fff;border:1px solid #E2DccF;font-size:17px;color:#3d342a;line-height:1.6;word-break:keep-all}'
    + '.fapp-foot b{color:#3d342a}.fapp-foot .fapp-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}'
    + '.fapp-foot button{min-height:54px;padding:6px 18px;font-size:17px;font-weight:700;border-radius:12px;border:1px solid #cfc6b6;background:#FBF8F2;color:#3d342a;cursor:pointer}'
    + '#fld .ft b{word-break:keep-all}@media (max-width:520px){#fld .fld-auto .sub{display:none}#fld .fld-grid.g3{grid-template-columns:1fr 1fr!important}#fld .fld-tt b{font-size:17px}}';
  document.head.appendChild(st);
  /* 닫기 대신 항상 첫 화면으로 — 이 앱에는 다른 메뉴가 없다 */
  fieldClose = function () { FLD.step = 'home'; fieldRender(); };
  const _home = fldHomeHtml;
  fldHomeHtml = function () {
    let ver = ''; try { ver = 'v' + APP_VER + ' · ' + APP_BUILT; } catch (e) {}
    return _home() + '<div class="fapp-foot"><b>빵을그리다 생산실 앱</b><br>여기서 입력한 생산일지·CCP 일지는 사무실 PC의 <b>통합 재고관리</b>에 그대로 들어갑니다. 확인·수정·승인은 PC에서 합니다.'
      + '<div class="fapp-row"><button type="button" onclick="location.reload()">🔄 최신 내용 다시 받기</button>'
      + '<button type="button" onclick="if(confirm(\'로그아웃할까요? 다시 들어오려면 아이디·비밀번호가 필요합니다.\'))WLOCK.logout()">로그아웃</button></div>'
      + '<div style="margin-top:8px;font-size:14px;color:#6b6257">' + ver + '</div></div>';
  };
  const _head = fldHead;
  fldHead = function () { return _head().replace('📱 현장 입력', '🍞 생산실'); };
  const keep = () => { try { if (!FLD.open) fieldOpen(); } catch (e) {} };
  setTimeout(keep, 400);
  setInterval(keep, 3000);
})();

/* ══ 「🔍 품목 찾기」 목록 (2026-10-22 Aside, 태블릿 SM-X115N 요청) — 작업 시작·생산량 입력 둘 다 ══
   - 찾기 칸을 누르면 자판 없이 등록 품목 전체가 칸 바로 아래 목록으로 뜬다(분류 버튼으로 거르기). 한 번 더 누르거나 「⌨ 글자로 찾기」를 누르면 자판이 뜬다.
   - 목록에서 고르면 원래 카드를 누른 것과 똑같이 동작한다(숨은 카드 버튼 wsgo·qtygo를 눌러 원래 처리 그대로 씀 — 원래 함수는 고치지 않음).
   - 글자를 칠 때 화면 전체를 다시 그리지 않아 갤럭시탭 한글 자판이 끊기지 않는다. 초성(ㅁㅂㄹ → 몽블랑) 검색, Enter = 첫 품목.
   - 생산량 숫자판 위에 「지난번 수량」「보통 수량」 버튼(prodStats)을 넣어 한 번에 채운다. */
(function () {
  if (!window.FIELD_APP) return;
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const cho = s => Array.from(String(s || '')).map(ch => { const c = ch.charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 ? CHO[Math.floor((c - 0xAC00) / 588)] : ch; }).join('');
  const norm = s => String(s || '').toLowerCase().replace(/\s+/g, '');
  const st = document.createElement('style');
  st.textContent = '#fld .fsg{margin:-6px 0 14px;border:2px solid #7A4A23;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.18);overflow:hidden;-webkit-user-select:none;user-select:none}'
    + '#fld .fsg-hd{display:flex;align-items:center;gap:8px;padding:8px 10px 8px 14px;background:#FBF3EA;border-bottom:1px solid #E9D9C6;font-size:16px;font-weight:700;color:#5A3A1E}'
    + '#fld .fsg-hd span{flex:1;word-break:keep-all}#fld .fsg-hd button{min-height:46px;padding:4px 14px;font-size:16px;font-weight:700;border-radius:10px;border:1px solid #cfc6b6;background:#fff;color:#3d342a;cursor:pointer;white-space:nowrap}'
    + '#fld .fsg-gp{display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px;border-bottom:1px solid #EEE7DD;background:#FFFCF8}'
    + '#fld .fsg-gp button{flex:none;min-height:44px;padding:4px 14px;font-size:16px;font-weight:700;border-radius:99px;border:1.5px solid #D8CBB8;background:#fff;color:#4a3a2a;cursor:pointer;white-space:nowrap}#fld .fsg-gp button.on{background:#7A4A23;border-color:#7A4A23;color:#fff}'
    + '#fld .fsg-ls{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;max-height:420px}'
    + '#fld .fsg-r{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;padding:8px 14px;border:0;border-bottom:1px solid #EEE7DD;background:#fff;text-align:left;cursor:pointer;color:#1d2a30}'
    + '#fld .fsg-r:active,#fld .fsg-r.k{background:#FFF4E6}#fld .fsg-r img{width:48px;height:48px;border-radius:10px;object-fit:cover;flex:none;background:#F1F3F5}'
    + '#fld .fsg-r .fsg-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}#fld .fsg-r b{font-size:19px;line-height:1.25;word-break:keep-all;overflow-wrap:anywhere}'
    + '#fld .fsg-r small{font-size:14.5px;color:#607D8B}#fld .fsg-r small.on{color:#2B8A3E;font-weight:700}#fld .fsg-r .go{flex:none;font-size:15px;font-weight:800;color:#7A4A23;white-space:nowrap}'
    + '#fld .fsg-no{padding:18px 14px;font-size:17px;color:#6b6257;word-break:keep-all}'
    + '#fld .fqv{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}#fld .fqv button{min-height:54px;padding:6px 18px;font-size:18px;font-weight:800;border-radius:12px;border:2px solid #C9B79F;background:#FFFBF5;color:#5A3A1E;cursor:pointer}#fld .fqv button small{display:block;font-size:13px;font-weight:600;color:#8a7a66}';
  document.head.appendChild(st);
  const STEPS = { ws: 1, qty: 1 };
  let open = false, grp = '';
  const by = () => ccpProdByDate()[fldD()] || {};
  const stats = () => { try { return prodStats(); } catch (e) { return {}; } };
  const unitOf = it => it.unit || '';
  const cfg = {
    ws: { act: 'wsgo', list() { const b = by(), s = stats(); const its = prodOnItems().filter(it => { const o = ccpOf(it); return o.oven || o.freeze || o.metal || o.mix; });
        its.sort((a, c) => (b[c.code] ? 1 : 0) - (b[a.code] ? 1 : 0) || (/비상품/.test(a.name) ? 1 : 0) - (/비상품/.test(c.name) ? 1 : 0) || ((s[c.code] || {}).n || 0) - ((s[a.code] || {}).n || 0) || fldShort(a.name).localeCompare(fldShort(c.name), 'ko'));
        return its.map(it => { const o = ccpOf(it), on = !!b[it.code]; return { it, on, sub: ['oven', 'freeze', 'metal', 'mix'].filter(t => o[t]).map(t => FLD_T[t].ico + ' ' + FLD_T[t].nm).join(' · ') + (on ? ' · ✓ 오늘 시작함' : ''), go: on ? '열기 ›' : '고르기 ›' }; }); } },
    qty: { act: 'qtygo', list() { const b = by(), s = stats(), P = prodS(), D = fldD(); const dr = P.draft && P.draft.date === D ? P.draft.lines : []; const qn = c => { const l = dr.find(x => x.code === c); return l && Number(l.qty) > 0 ? l.qty : ''; };
        const its = prodOnItems().slice();
        its.sort((a, c) => (qn(c.code) ? 2 : b[c.code] ? 1 : 0) - (qn(a.code) ? 2 : b[a.code] ? 1 : 0) || (/비상품/.test(a.name) ? 1 : 0) - (/비상품/.test(c.name) ? 1 : 0) || ((s[c.code] || {}).n || 0) - ((s[a.code] || {}).n || 0) || fldShort(a.name).localeCompare(fldShort(c.name), 'ko'));
        return its.map(it => { const q = qn(it.code), wk = !!b[it.code]; return { it, on: !!q || wk, sub: (q ? '✓ 담음 ' + q + ' ' + unitOf(it) : wk ? '✓ 오늘 작업 중 · ' + unitOf(it) : unitOf(it)), go: q ? '고치기 ›' : '수량 입력 ›' }; }); } } };
  const match = (it, q) => { if (!q) return true; if (norm(it.name + ' ' + it.code).includes(q)) return true; return /^[ㄱ-ㅎ]+$/.test(q) && norm(cho(it.name)).includes(q); };
  const inp = () => document.querySelector('#fld [data-f="q"]');
  const isQ = el => !!(el && el.matches && el.matches('#fld [data-f="q"]'));
  const fit = () => { const ls = document.querySelector('#fld .fsg-ls'); if (!ls) return; const vv = window.visualViewport;
    const bottom = vv ? vv.height + vv.offsetTop : window.innerHeight; ls.style.maxHeight = Math.max(220, Math.floor(bottom - ls.getBoundingClientRect().top - 12)) + 'px'; };
  const draw = () => { const el = inp(), C = cfg[FLD.step]; if (!el || !C) return; let box = document.querySelector('#fld .fsg');
    if (!box) { box = document.createElement('div'); box.className = 'fsg'; el.insertAdjacentElement('afterend', box);
      box.addEventListener('mousedown', e => { if (!e.target.closest('button[data-x]')) e.preventDefault(); });
      box.addEventListener('click', e => { if (e.target.closest('button[data-x]')) return close(true); if (e.target.closest('button[data-kb]')) return kb();
        const g = e.target.closest('button[data-g]'); if (g) { grp = g.dataset.g; draw(); return; } const r = e.target.closest('.fsg-r'); if (r) pick(r.dataset.c); }); }
    const q = norm(el.value), all = C.list(), xs0 = all.filter(x => match(x.it, q)), xs = grp ? xs0.filter(x => fldGroupOf(x.it) === grp) : xs0;
    const cnt = {}; xs0.forEach(x => { const k = fldGroupOf(x.it); cnt[k] = (cnt[k] || 0) + 1; });
    const gs = ['mb', 'cr', 'salt', 'garlic', 'dough', 'mix', 'etc', 'np'].filter(k => cnt[k]).map(k => FLD_GRP.find(g => g[0] === k));
    const row = (x, i) => { const u = fldPicUrl(x.it.name);
      return '<button type="button" class="fsg-r' + (i === 0 && q ? ' k' : '') + '" data-c="' + esc(x.it.code) + '">' + (u ? '<img src="' + u + '" alt="" loading="lazy" onerror="this.remove()">' : '')
        + '<span class="fsg-t"><b>' + esc(fldShort(x.it.name)) + '</b><small' + (x.on ? ' class="on"' : '') + '>' + esc(x.sub) + '</small></span><span class="go">' + x.go + '</span></button>'; };
    const kbOn = el.inputMode !== 'none';
    box.innerHTML = '<div class="fsg-hd"><span>' + (q ? '「' + esc(el.value.trim()) + '」 찾은 품목 ' + xs0.length + '개' : '등록된 품목 ' + all.length + '개 · 눌러서 고르세요') + '</span>'
      + (kbOn ? '' : '<button type="button" data-kb="1">⌨ 글자로 찾기</button>') + '<button type="button" data-x="1">✕ 닫기</button></div>'
      + (gs.length > 1 ? '<div class="fsg-gp"><button type="button" data-g=""' + (grp ? '' : ' class="on"') + '>전체 ' + xs0.length + '</button>' + gs.map(g => '<button type="button" data-g="' + g[0] + '"' + (grp === g[0] ? ' class="on"' : '') + '>' + esc(g[1]) + ' ' + cnt[g[0]] + '</button>').join('') + '</div>' : '')
      + '<div class="fsg-ls">' + (xs.length ? xs.map(row).join('') : '<div class="fsg-no">찾는 품목이 없습니다. 글자를 줄이거나 초성(예: ㅁㅂㄹ)으로 찾아보세요.</div>') + '</div>';
    fit(); };
  const show = () => { if (!STEPS[FLD.step]) return; const el = inp(); if (!el) return; const was = open; open = true; draw();
    if (!was) { const sc = document.getElementById('fld'), hd = document.querySelector('#fld .fld-top');
      try { const dy = el.getBoundingClientRect().top - ((hd ? hd.offsetHeight : 0) + 8); if (sc && Math.abs(dy) > 4) sc.scrollTop += dy; } catch (e) {} }
    setTimeout(fit, 350); setTimeout(fit, 800); };
  const kb = () => { const el = inp(); if (!el) return; el.inputMode = 'search'; el.blur(); setTimeout(() => { el.focus(); draw(); setTimeout(fit, 400); }, 40); };
  const close = byBtn => { if (!open) return; open = false; grp = ''; const b = document.querySelector('#fld .fsg'); if (b) b.remove(); const el = inp(); if (byBtn && el) el.blur();
    const s0 = FLD.step; setTimeout(() => { if (FLD.step === s0 && STEPS[s0] && !open && document.activeElement !== inp()) fieldRender(); }, 300); };
  const pick = code => { const C = cfg[FLD.step], body = document.querySelector('#fld .fld-body'); if (!C || !body) return; open = false; grp = ''; FLD.q = '';
    try { document.activeElement && document.activeElement.blur(); } catch (e) {}
    const b = document.createElement('button'); b.type = 'button'; b.dataset.f = C.act; b.dataset.c = code; b.style.display = 'none'; body.appendChild(b); b.click(); };
  document.addEventListener('pointerdown', e => { const el = e.target;
    if (isQ(el) && STEPS[FLD.step]) { if (!open && document.activeElement !== el) { el.inputMode = 'none'; } else if (open && el.inputMode === 'none') { e.preventDefault(); kb(); } return; }
    if (!open) return; if (el.closest && el.closest('#fld .fsg')) return; close(false); }, true);
  document.addEventListener('focusin', e => { if (isQ(e.target) && STEPS[FLD.step]) show(); }, true);
  document.addEventListener('input', e => { const el = e.target; if (!isQ(el) || !STEPS[FLD.step]) return;
    e.stopPropagation(); FLD.q = el.value; grp = ''; if (!open) show(); else draw(); }, true);   /* 원래 입력 처리(화면 전체 다시 그리기)는 이 두 화면에서만 건너뜀 */
  document.addEventListener('keydown', e => { const el = e.target; if (!isQ(el) || !STEPS[FLD.step]) return;
    if (e.key === 'Escape') close(true); if (e.key === 'Enter' && !e.isComposing) { const f = document.querySelector('#fld .fsg-r'); if (f) { e.preventDefault(); pick(f.dataset.c); } } }, true);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => { if (open) fit(); });
  /* 생산량 숫자판 위 「지난번·보통 수량」 */
  const _qin = fldQtyInHtml;
  fldQtyInHtml = function () { let h = _qin(); try { const s = stats()[FLD.code] || {}, it = prodItem(FLD.code) || {}, u = esc(unitOf(it)); const bt = [];
      const fq = v => { const n = Number(v); return n > 0 ? String(Math.round(n * 1000) / 1000) : ''; };
      const last = fq(s.lastQty), med = fq(s.med);
      if (last) bt.push('<button type="button" data-fqv="' + last + '">지난번 ' + last + ' ' + u + (s.last ? '<small>' + esc(String(s.last).slice(5).replace('-', '/')) + ' 생산</small>' : '') + '</button>');
      if (med && med !== last) bt.push('<button type="button" data-fqv="' + med + '">보통 ' + med + ' ' + u + '<small>자주 만든 양</small></button>');
      if (bt.length) h = h.replace('<div class="fld-form">', '<div class="fqv">' + bt.join('') + '</div><div class="fld-form">');
    } catch (e) {} return h; };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#fld [data-fqv]'); if (!b || FLD.step !== 'qtyin') return; FLD.qv = b.dataset.fqv; fieldRender(); }, true);
})();

/* ══ 작업 시작한 품목에 맞춘 단계 화면 (2026-10-22 Aside, 사용자 요청 「몽블랑을 누르면 오븐·급냉·금속·생산량만, 숫자·화살표로 단계적으로」) ══
   - 첫 화면: ① 작업 시작 → (그 품목에 필요한 CCP만: 배합 → 오븐 → 급냉 → 금속) → 마지막 생산량 입력. 관련 없는 단계는 안 보임. 지금 할 차례를 강조.
   - 오늘 품목이 여러 개면 위에 품목 버튼(전체·몽블랑·…)으로 한 품목만 골라 그 단계만 볼 수 있음. 고른 품목은 각 단계 화면에서도 그 품목만 보임(「다른 품목도 보기」로 펼침).
   - 각 단계 화면 제목에 번호, 아래에 「‹ 이전 단계 / 다음 단계 ›」. 생산량 입력은 오늘 작업한 품목만 먼저 보임. 원래 함수는 감싸기만 함. */
(function () {
  if (!window.FIELD_APP) return;
  const NUM = ['①', '②', '③', '④', '⑤', '⑥', '⑦'], ORDER = ['mix', 'oven', 'freeze', 'metal'];
  const st = document.createElement('style');
  st.textContent = '#fld .fsf{display:flex;flex-direction:column;align-items:stretch;gap:0;margin:4px 0 14px}'
    + '#fld .fsf-ar{align-self:center;font-size:26px;line-height:1;color:#9C8670;padding:4px 0}'
    + '#fld .fsf-c{display:flex;align-items:center;gap:14px;width:100%;min-height:96px;padding:12px 16px;border-radius:16px;border:3px solid var(--c,#90A4AE);background:#fff;text-align:left;cursor:pointer;color:#1d2a30;box-shadow:0 2px 0 rgba(0,0,0,.06)}'
    + '#fld .fsf-c .n{flex:none;width:54px;height:54px;border-radius:50%;background:var(--c,#90A4AE);color:#fff;font-size:30px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1}'
    + '#fld .fsf-c .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}#fld .fsf-c .t b{font-size:24px;color:var(--c,#173F4B);line-height:1.25}'
    + '#fld .fsf-c .t small{font-size:16px;color:#546E7A;line-height:1.35;word-break:keep-all}#fld .fsf-c .t small.ok{color:#2B8A3E;font-weight:700}#fld .fsf-c .t small.bad{color:#C92A2A;font-weight:700}#fld .fsf-c .t small.warn{color:#B35C00;font-weight:700}#fld .fsf-c .t small.due{color:#1864AB}'
    + '#fld .fsf-c .go{flex:none;font-size:30px;color:var(--c,#90A4AE)}#fld .fsf-c.now{box-shadow:0 0 0 4px #FFD8A8;background:#FFFCF5}#fld .fsf-c.done{background:#F4FBF5}#fld .fsf-c.done .n{background:#2F9E44}'
    + '#fld .fsf-c .tag{display:inline-block;margin-left:8px;padding:2px 10px;border-radius:99px;background:#E8590C;color:#fff;font-size:14px;font-weight:800;vertical-align:middle}#fld .fsf-c.done .tag{background:#2F9E44}'
    + '#fld .fsf-hint{font-size:17px;color:#5A4632;background:#FFF8EE;border:1.5px dashed #D8B98F;border-radius:14px;padding:14px 16px;line-height:1.55;word-break:keep-all}'
    + '#fld .fsf-pk{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}#fld .fsf-pk .lb{width:100%;font-size:16px;font-weight:700;color:#5A4632}'
    + '#fld .fsf-pk button{min-height:50px;padding:6px 16px;font-size:17px;font-weight:700;border-radius:99px;border:2px solid #D8CBB8;background:#fff;color:#3d342a;cursor:pointer}#fld .fsf-pk button.on{background:#7A4A23;border-color:#7A4A23;color:#fff}'
    + '#fld .fsn-b{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#7A4A23;color:#fff;font-size:24px;font-weight:800;margin-right:8px;vertical-align:middle;line-height:1}'
    + '#fld .fsnav{display:flex;gap:10px;margin:22px 0 8px}#fld .fsnav button{flex:1;min-height:64px;padding:8px 14px;font-size:19px;font-weight:800;border-radius:14px;border:2px solid #C9B79F;background:#fff;color:#4a3a2a;cursor:pointer;word-break:keep-all}#fld .fsnav button.nx{background:#7A4A23;border-color:#7A4A23;color:#fff}'
    + '#fld .fsmore{width:100%;min-height:56px;margin:10px 0;font-size:17px;font-weight:700;border-radius:12px;border:2px dashed #C9B79F;background:#FFFCF8;color:#5A3A1E;cursor:pointer}'
    + '#fld .fsx{display:none!important}'
    + '@media (min-width:1100px){#fld .fsf{flex-direction:row;align-items:stretch}#fld .fsf-ar{align-self:center;padding:0 6px}#fld .fsf-ar::before{content:"▶"}#fld .fsf-ar span{display:none}#fld .fsf-c{flex-direction:column;align-items:flex-start;flex:1;min-height:170px}#fld .fsf-c .go{display:none}}';
  document.head.appendChild(st);
  let focus = '', showAll = false, lastKey = '';
  const today = () => { try { return ccpProdByDate()[fldD()] || {}; } catch (e) { return {}; } };
  const typesOf = code => { const it = prodItem(code); if (!it) return []; const o = ccpOf(it); return ORDER.filter(t => o[t]); };
  const flow = () => { const by = today(), codes = Object.keys(by); if (focus && !by[focus]) focus = '';
    const use = focus ? [focus] : codes, set = new Set(); use.forEach(c => typesOf(c).forEach(t => set.add(t)));
    return { by, codes, types: ORDER.filter(t => set.has(t)) }; };
  const nameOf = (by, c) => fldShort((by[c] && by[c].name) || (prodItem(c) || {}).name || c);
  const numOf = (F, step) => { if (step === 'ws') return NUM[0]; const i = F.types.indexOf(step); if (i >= 0) return NUM[i + 1]; if (step === 'qty') return NUM[F.types.length + 1]; return ''; };
  const badge = (h, n) => n ? h.replace('<h1 class="fld-h">', '<h1 class="fld-h"><span class="fsn-b">' + n + '</span>') : h;
  /* 첫 화면 */
  const _home = fldHomeHtml;
  fldHomeHtml = function () { const h = _home(); try {
      const s = h.indexOf('<div class="fld-grid g3">'), q = h.indexOf('data-f="qty"', s), e = q < 0 ? -1 : h.indexOf('</button></div>', q); if (s < 0 || e < 0) return h;
      const F = flow(), D = fldD(), P = prodS(), cartN = (P.draft && P.draft.date === D ? P.draft.lines : []).filter(l => Number(l.qty) > 0).length;
      const sentN = (P.log || []).filter(en => en.date === D && en.status !== 'cancel').length;
      const use = focus ? [focus] : F.codes;
      const steps = [{ k: 'ws', ico: '▶', nm: '작업 시작', c: '#0B7285', f: 'data-f="ws"', done: F.codes.length > 0, sub: F.codes.length ? '오늘 품목: ' + F.codes.map(c => nameOf(F.by, c)).join(', ') + ' · 눌러서 품목 추가' : '오늘 만들 품목을 고르세요', cls: F.codes.length ? 'ok' : '' }];
      F.types.forEach(t => { const T = FLD_T[t], sx = fldTileStat(t), nx = fldNext(t), rel = use.filter(c => typesOf(c).includes(t)).map(c => nameOf(F.by, c));
        steps.push({ k: t, ico: T.ico, nm: T.nm, c: T.c, f: 'data-fgo="' + t + '"', done: sx.cls === 'ok', sub: (rel.length ? rel.join(', ') + ' · ' : '') + sx.t, cls: sx.cls === 'mute' ? '' : sx.cls, due: nx }); });
      if (F.codes.length) steps.push({ k: 'qty', ico: '📦', nm: '생산량 입력', c: '#5F3DC4', f: 'data-f="qty"', done: sentN > 0 && !cartN, sub: cartN ? '담은 품목 ' + cartN + '개 — 「이카운트로 보내기」 전' : sentN ? '오늘 보낸 생산 ' + sentN + '건' : '작업이 끝나면 박스 수 입력 → 이카운트·생산작업일보', cls: cartN ? 'warn' : sentN ? 'ok' : '' });
      const nowI = steps.findIndex(x => !x.done);
      let g = '';
      if (F.codes.length > 1) g += '<div class="fsf-pk"><span class="lb">어떤 품목의 단계를 볼까요?</span><button type="button" data-ffocus=""' + (focus ? '' : ' class="on"') + '>전체 ' + F.codes.length + '개</button>' + F.codes.map(c => '<button type="button" data-ffocus="' + esc(c) + '"' + (focus === c ? ' class="on"' : '') + '>' + esc(nameOf(F.by, c)) + '</button>').join('') + '</div>';
      g += '<div class="fsf">' + steps.map((x, i) => (i ? '<div class="fsf-ar"><span>▼</span></div>' : '')
        + '<button type="button" class="fsf-c' + (x.done ? ' done' : '') + (i === nowI ? ' now' : '') + '" ' + x.f + ' style="--c:' + x.c + '"><span class="n">' + NUM[i] + '</span><span class="t"><b>' + x.ico + ' ' + esc(x.nm)
        + (x.done ? '<span class="tag">✓ 완료</span>' : i === nowI ? '<span class="tag">지금 할 차례</span>' : '') + '</b><small class="' + (x.cls || '') + '">' + esc(x.sub) + '</small>' + (x.due ? '<small class="due">⏰ ' + esc(x.due) + '</small>' : '') + '</span><span class="go">›</span></button>').join('') + '</div>';
      if (!F.codes.length) g += '<div class="fsf-hint">① 「작업 시작」에서 만들 품목을 누르면, 그 품목에 필요한 단계만 순서대로 나옵니다.<br>예) 몽블랑 → ② 🔥 오븐 가열 → ③ ❄ 급속냉동 → ④ 🧲 금속검출 → ⑤ 📦 생산량 입력</div>';
      return h.slice(0, s) + g + h.slice(e + '</button></div>'.length);
    } catch (er) { return h; } };
  /* 단계 화면 제목 번호 + 이전·다음 */
  const navHtml = (F, cur) => { const seq = ['home'].concat(F.types, F.codes.length ? ['qty'] : []), i = seq.indexOf(cur); if (i < 0) return '';
    const lab = k => k === 'home' ? '처음 화면' : k === 'qty' ? numOf(F, 'qty') + ' 📦 생산량 입력' : numOf(F, k) + ' ' + FLD_T[k].ico + ' ' + FLD_T[k].nm;
    const pv = seq[i - 1] || 'home', nx = seq[i + 1];
    return '<div class="fsnav"><button type="button" data-fgo="' + pv + '">‹ ' + esc(lab(pv)) + '</button>' + (nx ? '<button type="button" class="nx" data-fgo="' + nx + '">다음 ' + esc(lab(nx)) + ' ›</button>' : '<button type="button" class="nx" data-fgo="home">✓ 처음 화면으로</button>') + '</div>'; };
  const _type = fldTypeHtml;
  fldTypeHtml = function () { let h = _type(); try { const F = flow(); h = badge(h, numOf(F, FLD.type)) + navHtml(F, FLD.type); } catch (e) {} return h; };
  const _qty = fldQtyHtml;
  fldQtyHtml = function () { let h = _qty(); try { const F = flow(); h = badge(h, numOf(F, 'qty')) + navHtml(F, 'qty'); } catch (e) {} return h; };
  const _ws = fldWsHtml;
  fldWsHtml = function () { return badge(_ws(), NUM[0]); };
  /* 그린 뒤: 고른 품목만 보이기 (단계 화면 · 생산량) */
  const _render = fieldRender;
  fieldRender = function () { const key = FLD.step + '|' + FLD.type; if (key !== lastKey) { showAll = false; lastKey = key; } _render.apply(this, arguments);
    try { const body = document.querySelector('#fld .fld-body'); if (!body) return; let hid = 0;
      if (FLD.step === 'type' && focus) { body.querySelectorAll('[data-f="prod"][data-c], [data-f="mode"][data-m="pass"][data-c]').forEach(b => { if (b.dataset.c !== focus && !showAll) { b.classList.add('fsx'); hid++; } }); }
      if (FLD.step === 'qty' && !FLD.q) { const top = body.querySelector('.fld-gh.top'); if (top && !showAll) { let n = top.nextElementSibling; n = n && n.nextElementSibling; while (n) { if (n.matches('.fld-gh, .fld-grid')) { n.classList.add('fsx'); if (n.matches('.fld-grid')) hid += n.querySelectorAll('[data-c]').length; } n = n.nextElementSibling; } } }
      if (hid) { const nav = body.querySelector('.fsnav'), b = document.createElement('button'); b.type = 'button'; b.className = 'fsmore'; b.dataset.fall = '1';
        b.textContent = FLD.step === 'qty' ? '＋ 오늘 작업 안 한 품목도 보기 (' + hid + '개)' : '＋ 다른 품목도 보기 (' + hid + '개)'; if (nav) body.insertBefore(b, nav); else body.appendChild(b); }
    } catch (e) {} };
  document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('#fld [data-fgo], #fld [data-ffocus], #fld [data-fall]'); if (!t) return; e.preventDefault(); e.stopPropagation();
    if (t.dataset.fall) { showAll = true; return fieldRender(); }
    if (t.dataset.ffocus != null) { focus = t.dataset.ffocus; return fieldRender(); }
    const g = t.dataset.fgo; FLD.q = ''; if (g === 'home') FLD.step = 'home'; else if (g === 'qty') FLD.step = 'qty'; else { FLD.type = g; FLD.step = 'type'; }
    try { document.getElementById('fld').scrollTop = 0; } catch (er) {} fieldRender(); }, true);
})();
