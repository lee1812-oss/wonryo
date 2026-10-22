
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

/* ══ CCP 측정값 자동 입력 (2026-10-22 Aside, 사용자 「키패드 터치 최소화 — 최근 1주 평균을 자동으로 넣고, 다르면 작업자가 고치게」) ══
   - 오븐(가열온도·가열시간·품온) / 급냉(넣을 때·꺼낼 때 온도) / 배합(배합량·품온·작업장) 입력 화면을 열면 빈 칸에 「최근 7일 평균」을 미리 채운다.
     같은 품목의 최근 7일 기록이 없으면 그 품목의 가장 최근 생산일들(최대 10일) 평균. 자료가 없는 품목은 비워 둠(직접 입력).
   - 자료: ① 이 앱 CCP 일지(생산실 앱으로 쓴 기록) + ② ccp_recent.json(K-HACCP CCP 일지에서 뽑은 품목별 최근 측정값, 저장소에 따로 둠 → 파일만 바꾸면 갱신).
   - 저장은 자동으로 하지 않는다. 작업자가 실제 값을 보고 「저장」을 눌러야 들어감(HACCP 기록 원칙). 고치려면 칸을 누르고 숫자를 치면 새 값으로 바뀜.
   - 자동으로 채운 값을 고치지 않고 저장한 칸은 줄에 r.us={f:{칸:값},at,by,src:'avg7'} 표시(v247 「평소와 같음」과 같은 자리 → 같은 값 반복 점검에서 구분). */
(function () {
  if (!window.FIELD_APP) return;
  const LS = 'wonryo_ccp_recent';
  let SEED = null; try { SEED = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) {}
  fetch('ccp_recent.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => { if (j && j.oven) { SEED = j; try { localStorage.setItem(LS, JSON.stringify(j)); } catch (e) {} } }).catch(() => {});
  const F = { oven: { temp: 0, min: 1, core: 2 }, freeze: { v1: 0, v2: 1 }, mix: { kg: 0, temp: 1, room: 2 } };
  const RND = { oven: { temp: 0, min: 0, core: 0 }, freeze: { v1: 1, v2: 1 }, mix: { kg: 2, temp: 0, room: 0 } };
  const keyOf = n => { n = String(n || '').replace(/\((시작|종료|중간|오전|오후)[^)]*\)/g, '').replace(/^(D|DB|Db)\./i, '').replace(/\s+\d+\s*EA/gi, '').replace(/\s/g, '').replace(/\d+EA/gi, '').replace(/BOX/gi, '').replace(/크라상/g, '크로와상');
    if (/크림/.test(n) && /배합|소스/.test(n)) return '크림배합'; if (/마늘/.test(n) && /배합|소스/.test(n) && !/빵|바게트/.test(n)) return '마늘배합'; return n; };
  const ymd = t => t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  const rowsFor = (type, name) => { const k = keyOf(name), out = [];
    const S = (SEED && SEED[type]) || {}; let sk = S[k] ? k : ''; if (!sk) { let bl = 0; Object.keys(S).forEach(x => { if (x.length >= 2 && k.includes(x) && x.length > bl) { bl = x.length; sk = x; } }); }
    if (sk) S[sk].forEach(a => out.push({ d: a[0], v: a.slice(1) }));
    try { Object.values(ccpS().logs || {}).forEach(g => { if (!g || g.skip || g.type !== type) return; (g.rows || []).forEach(r => { if (keyOf(r.name) !== k && keyOf(r.name) !== sk) return;
        const v = Object.keys(F[type]).map(f => { const x = ccpNum(r[f]); return x == null ? null : x; }); if (v.some(x => x != null)) out.push({ d: g.date, v, app: 1 }); }); }); } catch (e) {}
    return out; };
  /* 최근 7일 평균 (없으면 최근 생산일 최대 10일 평균) */
  if (!window.fldAvg7) window.fldAvg7 = function (type, f, name) { const ix = (F[type] || {})[f]; if (ix == null) return null; const D = fldD(); const t0 = new Date(D + 'T00:00:00'); t0.setDate(t0.getDate() - 7); const from = ymd(t0);
    const all = rowsFor(type, name).filter(x => x.v[ix] != null && x.d <= D); if (!all.length) return null;
    let use = all.filter(x => x.d > from), how = '최근 7일 평균'; if (!use.length) { const ds = [...new Set(all.map(x => x.d))].sort().slice(-10); use = all.filter(x => ds.includes(x.d)); how = '최근 생산 ' + ds.length + '일 평균'; }
    const m = use.reduce((s, x) => s + x.v[ix], 0) / use.length, p = Math.pow(10, RND[type][f]); return { v: Math.round(m * p) / p, n: use.length, how }; };
  const _start = fldStartForm;
  fldStartForm = function (row, sec) { const r0 = FLD.render; FLD.autoF = {}; FLD.autoHow = '';
    const _fr = fieldRender; let held = false; fieldRender = function () { held = true; };   /* 원래 함수가 그리기 전에 값을 먼저 채움 */
    try { _start.apply(this, arguments); } finally { fieldRender = _fr; }
    try { if (FLD.step === 'form' && F[FLD.type] && FLD.sec !== 'pass') { const nmx = FLD.name || (row && row.name) || '';
        FLD.fields.forEach(x => { if (F[FLD.type][x.f] == null || FLD.vals[x.f] !== '') return; if (FLD.type === 'freeze' && x.f === 'v2' && !(row && row.t1)) return;
          const a = fldAvg7(FLD.type, x.f, nmx); if (!a) return; let s = String(a.v); if (x.neg) s = s.replace(/^-/, ''); FLD.vals[x.f] = s; FLD.autoF[x.f] = s; FLD.autoHow = a.how; });
        if (Object.keys(FLD.autoF).length) { const i = FLD.fields.findIndex(x => x.k !== 'time' && FLD.vals[x.f] === ''); FLD.fi = i < 0 ? FLD.fields.findIndex(x => FLD.autoF[x.f] != null) : i; if (FLD.fi < 0) FLD.fi = 0; } } } catch (e) {}
    if (held || FLD.step === 'form') fieldRender(); };
  /* 화면: 자동으로 채운 칸에 표시 + 안내 띠 */
  const st = document.createElement('style');
  st.textContent = '#fld .fav-tag{display:inline-block;margin-left:8px;padding:1px 9px;border-radius:99px;background:#E7F5FF;color:#1864AB;font-size:13px;font-weight:800;vertical-align:middle}'
    + '#fld .fav-bar{margin:0 0 12px;padding:12px 16px;border-radius:14px;background:#EBFBEE;border:2px solid #8CE99A;color:#1b4d2a;font-size:17px;line-height:1.5;word-break:keep-all}#fld .fav-bar b{color:#2B8A3E}';
  document.head.appendChild(st);
  const _render2 = fieldRender;
  fieldRender = function () { _render2.apply(this, arguments);
    try { if (FLD.step !== 'form' || !FLD.autoF) return; const keep = FLD.fields.filter(x => FLD.autoF[x.f] != null && FLD.vals[x.f] === FLD.autoF[x.f]); if (!keep.length) return;
      const btns = document.querySelectorAll('#fld .fld-fields > .fld-f'); FLD.fields.forEach((x, i) => { if (FLD.autoF[x.f] == null || FLD.vals[x.f] !== FLD.autoF[x.f]) return; const lb = btns[i] && btns[i].querySelector('label'); if (lb && !lb.querySelector('.fav-tag')) lb.insertAdjacentHTML('beforeend', '<span class="fav-tag">평소</span>'); });
      const form = document.querySelector('#fld .fld-form'); if (form && !document.querySelector('#fld .fav-bar')) form.insertAdjacentHTML('beforebegin', '<div class="fav-bar"><b>✓ ' + esc(FLD.autoHow || '최근 평균') + '(평소 값)으로 미리 채웠습니다.</b> 판넬·온도계 값과 <b>같으면 「저장」만</b> 누르세요. 다르면 그 칸을 누르고 숫자를 치면 바뀝니다.</div>');
    } catch (e) {} };
  /* 저장: 자동 값을 그대로 쓴 칸 표시 */
  const _save = fldSave;
  fldSave = function () { const au = {}; try { (FLD.fields || []).forEach(x => { if (FLD.autoF && FLD.autoF[x.f] != null && FLD.vals[x.f] === FLD.autoF[x.f]) au[x.f] = (x.neg ? '-' : '') + FLD.vals[x.f]; }); } catch (e) {}
    const type = FLD.type; FLD.lastRow = null; const ret = _save.apply(this, arguments);
    try { const row = FLD.lastRow; if (row && Object.keys(au).length) { const old = row.us && row.us.f || {}; row.us = { f: Object.assign({}, old, au), at: new Date().toISOString(), by: fldWk(), src: 'avg7' }; const g = fldLog(type); if (g) { ccpTouch(g); save(); } } } catch (e) {}
    return ret; };
})();

/* ══ 생산실 앱 용어·번호 한 체계로 (2026-10-22 Aside, 사용자 「방향이 왔다 갔다 하지 않게 일관성 있게」) ══
   - 번호(①②③…)는 첫 화면 「단계」에만 쓴다. 단계 안쪽 화면(오븐 시작/2시간/종료, 금속 작업 전/제품/작업 후)은 번호 대신 🟢·⏱·🏁.
   - 「작업 시작」은 품목 고르기(①)에만 쓴다. 오븐 안쪽은 「시작 측정」「종료 측정」.
   - v247(평소 값·작성 완료)이 함께 있으면 평소 값도 fldAvg7(최근 7일 평균) 하나로 맞춘다 → 흐린 글씨·「평소와 같음」·미리 채움 숫자가 같음. */
(function () {
  if (!window.FIELD_APP) return;
  const sym = h => String(h).replace(/<i>①<\/i>/g, '<i>🟢</i>').replace(/<i>②<\/i>/g, '<i>⏱</i>').replace(/<i>③<\/i>/g, '<i>🏁</i>');
  const _mode = fldModeHtml;
  fldModeHtml = function () { let h = sym(_mode()); if (FLD.type === 'oven') h = h.replace('<b>작업 시작</b>', '<b>시작 측정</b>').replace('<b>작업 종료</b>', '<b>종료 측정</b>'); return h; };
  const _type = fldTypeHtml;
  fldTypeHtml = function () { return sym(_type()); };
  if (typeof ccp247Get === 'function' && window.fldAvg7 && !window.__avgGet) { window.__avgGet = 1; const _g = ccp247Get;
    ccp247Get = function (type, name) { const ix = (typeof CCP247_IX !== 'undefined' && CCP247_IX[type]) || null, base = _g(type, name); if (!ix) return base; const a = base ? base.slice() : []; let hit = false;
      Object.keys(ix).forEach(f => { const x = fldAvg7(type, f, name); if (x) { a[ix[f]] = x.v; hit = true; } }); return hit ? a : base; }; }
})();

/* ══ 생산량 입력: 박스·낱개·비상품을 눌러 각각 수량 입력 (2026-10-22 Aside, 사용자 「누르고 각각 수량 입력, 지금 구조는 합계 누적이 이상해」) ══
   - 예전: 숫자 칸이 하나라 박스에서 친 숫자가 낱개로 바꿔도 그대로 남고, 하나씩 따로 「담기」해야 해서 합계가 헷갈림.
   - 지금: 한 화면에 박스·낱개·비상품 칸이 따로 있고, 누른 칸에 숫자판 숫자가 들어감(칸을 바꾸면 처음 누른 숫자는 새로). 「담기」 한 번에 세 칸을 모두 담음.
   - 칸의 숫자 = 이번에 보낼 그 단위의 수량(더하기가 아니라 그 값으로 바꿈). 0이나 빈칸이면 담은 줄을 뺌. 오늘 이미 보낸 수량은 칸 아래에 따로 보여 주고, 맨 아래 합계에 「오늘 보낸 것 + 이번」을 낱개 환산으로 보여 줌.
   - 담는 방식은 원래 fldQtyPut과 같음(P.draft.lines 줄의 qty, mode ''). 보내기(이카운트)는 원래 화면 「이카운트로 보내기」 그대로. */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '#fld .fqu{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:10px;margin:0 0 12px}'
    + '#fld .fqu button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-height:128px;padding:12px 14px;border-radius:16px;border:3px solid #D5DDE0;background:#fff;text-align:left;cursor:pointer;color:#1d2a30}'
    + '#fld .fqu button.on{border-color:#5F3DC4;background:#F3F0FF;box-shadow:0 0 0 3px #D0BFFF}#fld .fqu button .k{font-size:20px;font-weight:800;color:#5F3DC4}#fld .fqu button .k small{font-size:14px;color:#7a7f87;font-weight:600;margin-left:6px}'
    + '#fld .fqu button .v{font-size:44px;font-weight:800;line-height:1.1;white-space:nowrap}#fld .fqu button .v .ph{font-size:20px;color:#adb5bd;font-weight:700}#fld .fqu button .v small{font-size:18px;color:#607D8B;margin-left:4px}'
    + '#fld .fqu button .s{font-size:14.5px;color:#607D8B;word-break:keep-all}#fld .fqu button .s.sent{color:#2B8A3E;font-weight:700}'
    + '#fld .fqsum{margin:12px 0;padding:12px 16px;border-radius:14px;background:#fff;border:2px solid #E5DBFF;font-size:17px;line-height:1.6;color:#2d2a3a;word-break:keep-all}#fld .fqsum b{font-size:20px;color:#5F3DC4}#fld .fqsum .w{color:#B35C00;font-weight:700}'
    + '#fld .fqpad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}#fld .fqpad button{min-height:66px;font-size:30px;font-weight:800;border-radius:14px;border:2px solid #DEE2E6;background:#F8F9FA;color:#173F4B;cursor:pointer}'
    + '#fld .fqgo{display:flex;gap:10px;margin-top:12px}#fld .fqgo button{flex:1;min-height:66px;font-size:21px;font-weight:800;border-radius:14px;cursor:pointer}#fld .fqgo .pri{background:#5F3DC4;border:2px solid #5F3DC4;color:#fff}#fld .fqgo .sub{background:#fff;border:2px solid #C9B79F;color:#4a3a2a;flex:.45}'
    + '#fld .fqchip{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}#fld .fqchip button{min-height:52px;padding:6px 16px;font-size:17px;font-weight:800;border-radius:12px;border:2px solid #C9B79F;background:#FFFBF5;color:#5A3A1E;cursor:pointer}#fld .fqchip button small{display:block;font-size:13px;font-weight:600;color:#8a7a66}'
    + '@media (max-width:520px){#fld .fqu button{min-height:110px;padding:10px}#fld .fqu button .v{font-size:34px}}';
  document.head.appendChild(st);
  const units = () => { const it = prodItem(FLD.code) || { code: FLD.code, name: FLD.code, unit: '' }; const F = prodFamily(it);
    const us = F ? [[F.B, '박스'], [F.E, '낱개'], [F.N, '비상품']].filter(x => x[0]).map(([u, k]) => ({ u, k })) : [{ u: it, k: it.unit || '수량' }]; return { it, F, us }; };
  const famKey = U => U.us.map(x => x.u.code).join('|');
  const draftQty = c => { const P = prodS(); if (!P.draft || P.draft.date !== fldD()) return ''; const l = P.draft.lines.find(x => x.code === c); return l && Number(l.qty) > 0 ? String(l.qty) : ''; };
  const sentQty = c => { let s = 0; try { (prodS().log || []).forEach(en => { if (en.date !== fldD() || en.status === 'cancel') return; (en.lines || []).forEach(l => { if (l.code === c) s += Number(l.qty) || 0; }); }); } catch (e) {} return s; };
  const init = U => { const k = famKey(U); if (FLD.qxKey === k) return; FLD.qxKey = k; FLD.qx = {}; U.us.forEach(x => { FLD.qx[x.u.code] = draftQty(x.u.code); }); FLD.qa = U.us.some(x => x.u.code === FLD.code) ? FLD.code : U.us[0].u.code; FLD.qt = {}; };
  const n0 = v => Number(v) || 0, f1 = n => fmt(Math.round(n * 1000) / 1000);
  fldQtyInHtml = function () { const U = units(); init(U); const pk = U.F && U.F.B ? prodPack(U.F.B) : 0;
    const tile = x => { const c = x.u.code, v = FLD.qx[c] || '', sn = sentQty(c), unit = esc(x.u.unit || '');
      return '<button type="button" data-fqa="' + esc(c) + '"' + (FLD.qa === c ? ' class="on"' : '') + '><span class="k">' + esc(x.k) + '<small>' + unit + '</small></span>'
        + '<span class="v">' + (v === '' ? '<span class="ph">' + (FLD.qa === c ? '숫자를 누르세요' : '눌러서 입력') + '</span>' : esc(v) + '<small>' + unit + '</small>') + '</span>'
        + '<span class="s' + (sn ? ' sent' : '') + '">' + (sn ? '오늘 이미 보냄 ' + f1(sn) + ' ' + unit : esc(c)) + '</span></button>'; };
    let chips = ''; try { const s = (prodStats() || {})[FLD.qa] || {}, a = units().us.find(x => x.u.code === FLD.qa), u = esc((a && a.u.unit) || ''); const b = [];
      const q = v => { const n = Number(v); return n > 0 ? String(Math.round(n * 1000) / 1000) : ''; }; const last = q(s.lastQty), med = q(s.med);
      if (last) b.push('<button type="button" data-fqs="' + last + '">지난번 ' + last + ' ' + u + (s.last ? '<small>' + esc(String(s.last).slice(5).replace('-', '/')) + ' 생산</small>' : '') + '</button>');
      if (med && med !== last) b.push('<button type="button" data-fqs="' + med + '">보통 ' + med + ' ' + u + '<small>자주 만든 양</small></button>');
      if (b.length) chips = '<div class="fqchip">' + b.join('') + '</div>'; } catch (e) {}
    /* 합계 (낱개 환산) */
    let sum = ''; { const parts = [], tot = { now: 0, sent: 0 }; let can = true;
      U.us.forEach(x => { const c = x.u.code, v = n0(FLD.qx[c]), sn = sentQty(c); const per = U.F ? (x.u === U.F.B ? pk : 1) : 1; if (U.F && x.u === U.F.B && !pk) can = false;
        if (v) parts.push(esc(x.k) + ' ' + f1(v) + ' ' + esc(x.u.unit || '')); tot.now += v * per; tot.sent += sn * per; });
      sum = '<div class="fqsum">이번에 담을 것: <b>' + (parts.length ? parts.join(' · ') : '없음') + '</b>'
        + (U.F && can ? '<br>낱개로 환산하면 이번 <b>' + f1(tot.now) + '개</b>' + (tot.sent ? ' + 오늘 이미 보낸 ' + f1(tot.sent) + '개 = <b>오늘 합계 ' + f1(tot.now + tot.sent) + '개</b>' : '') + (pk ? ' <small>(박스 1개 = ' + pk + '개)</small>' : '') : '')
        + (U.F && !can ? '<br><span class="w">박스 입수를 몰라 낱개 합계는 계산하지 않습니다</span>' : '') + '</div>'; }
    const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'].map(k => '<button type="button" data-fqk="' + k + '">' + k + '</button>').join('');
    return '<h1 class="fld-h">' + fldPic(U.it.name, 1) + '📦 ' + esc(fldShort((U.F && (U.F.B || U.F.E) || U.it).name)) + '</h1>'
      + '<p class="fld-p">' + (U.us.length > 1 ? '박스·낱개·비상품 칸을 하나씩 누르고 수량을 넣으세요. 다 넣고 「담기」 한 번이면 모두 담깁니다.' : '수량을 넣고 「담기」를 누르세요.') + '</p>'
      + '<div class="fqu" style="--n:' + U.us.length + '">' + U.us.map(tile).join('') + '</div>' + chips
      + '<div class="fqpad">' + keys + '</div>' + sum
      + '<div class="fqgo"><button type="button" class="sub" data-fqclr="1">이 칸 지우기</button><button type="button" class="pri" data-fqput="1">✓ 담기</button></div>'; };
  const put = () => { const U = units(), D = fldD(), P = prodS(); const codes = U.us.map(x => x.u.code);
    const any = codes.some(c => n0(FLD.qx[c]) > 0), had = codes.some(c => draftQty(c));
    if (!any && !had) { toast('수량을 입력하세요'); return; }
    if (P.draft.date !== D) { if (P.draft.lines.some(l => Number(l.qty) > 0)) { toast('생산 입력에 ' + P.draft.date + ' 날짜로 담긴 품목이 있습니다 — 사무실에서 먼저 보내거나 비워 주세요', 4500); return; } P.draft.date = D; P.draft.lines = []; }
    if (!(P.draft.workers || []).length) P.draft.workers = prodWorkersDefault(P);
    const msg = [];
    codes.forEach((c, i) => { const n = n0(FLD.qx[c]); let l = P.draft.lines.find(x => x.code === c);
      if (n > 0) { if (!l) { l = prodNewLine(c); P.draft.lines.push(l); } l.qty = String(n); l.mode = ''; msg.push(U.us[i].k + ' ' + n); }
      else if (l) P.draft.lines = P.draft.lines.filter(x => x !== l); });
    save(); toast(msg.length ? '담음: ' + fldShort((U.F && (U.F.B || U.F.E) || U.it).name) + ' — ' + msg.join(' · ') : '담은 수량을 뺐습니다', 2500);
    FLD.qxKey = ''; FLD.step = 'qty'; FLD.q = ''; fieldRender(); };
  document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('#fld [data-fqa], #fld [data-fqk], #fld [data-fqput], #fld [data-fqclr], #fld [data-fqs], #fld [data-f="qtygo"], #fld [data-f="qtyedit"]'); if (!t) return;
    if (t.dataset.f === 'qtygo' || t.dataset.f === 'qtyedit') { FLD.qxKey = ''; return; }   /* 원래 처리로 넘김 — 들어갈 때마다 새로 읽음 */
    if (FLD.step !== 'qtyin') return; e.preventDefault(); e.stopPropagation(); FLD.qx = FLD.qx || {}; FLD.qt = FLD.qt || {};
    if (t.dataset.fqa) { FLD.qa = t.dataset.fqa; FLD.qt[FLD.qa] = 0; return fieldRender(); }
    if (t.dataset.fqput) return put();
    if (t.dataset.fqclr) { FLD.qx[FLD.qa] = ''; return fieldRender(); }
    if (t.dataset.fqs) { FLD.qx[FLD.qa] = t.dataset.fqs; FLD.qt[FLD.qa] = 0; return fieldRender(); }
    const k = t.dataset.fqk; let v = String(FLD.qx[FLD.qa] || ''); if (!FLD.qt[FLD.qa] && k !== '⌫') v = ''; FLD.qt[FLD.qa] = 1;   /* 칸을 누른 뒤 처음 숫자는 새로 */
    if (k === '⌫') v = v.slice(0, -1); else if (k === '.') { if (!v.includes('.')) v = (v || '0') + '.'; } else if (v.replace(/\D/g, '').length < 6) v = (v === '0' ? '' : v) + k;
    FLD.qx[FLD.qa] = v; fieldRender(); }, true);
})();

/* ══ 「이카운트로 보내기」 → 이카운트 생산입고 입력 화면 모양 미리보기 (2026-10-22 Aside, 사용자 「이카운트에 입력되는 화면을 이미지로 직관적으로」) ══
   - 보내기 확인 창 맨 위에 이카운트 「생산입고 입력」 화면처럼 그린 그림: 일자·담당자·생산된 공장·받는 창고 + 품목코드·품목명·수량·적요 줄. 값은 실제로 보내는 prodRows()와 같음.
   - 생산량 입력 화면 위에는 오늘 보낸 전표를 같은 모양으로(전송 중·모아 두는 중·입력 완료 전표번호) 보여 줌. */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '.ecv{border:1px solid #B8C4D6;border-radius:10px;overflow:hidden;background:#fff;margin:6px 0 12px;font-family:inherit;box-shadow:0 2px 8px rgba(31,78,140,.12);color:#222}'
    + '.ecv-top{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#1F4E8C;color:#fff;font-size:14px}.ecv-top b{font-size:16px;letter-spacing:.5px}.ecv-top .path{opacity:.85}.ecv-top .tag{margin-left:auto;padding:2px 10px;border-radius:99px;background:#fff;color:#1F4E8C;font-weight:800;font-size:13px;white-space:nowrap}'
    + '.ecv-ttl{padding:8px 12px;font-size:18px;font-weight:800;color:#1F4E8C;border-bottom:1px solid #DDE3EC;background:#F4F7FB}'
    + '.ecv-hd{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:6px 10px;padding:10px 12px;font-size:15px;align-items:center;border-bottom:1px solid #DDE3EC}.ecv-hd .l{color:#556;font-weight:700;white-space:nowrap}.ecv-hd .v{border:1px solid #C9D3E0;border-radius:4px;padding:5px 8px;background:#FBFCFE;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ecv-hd .v.warn{border-color:#F08C00;background:#FFF4E6}'
    + '.ecv table{width:100%;border-collapse:collapse;font-size:15px}.ecv th{background:#E9EEF5;color:#334;font-weight:800;padding:7px 8px;border-bottom:1px solid #C9D3E0;text-align:left;white-space:nowrap}.ecv td{padding:8px;border-bottom:1px solid #EEF1F5;vertical-align:top;word-break:keep-all}.ecv td.n{text-align:right;font-weight:800;white-space:nowrap;font-size:17px}.ecv td.c{color:#1F4E8C;font-weight:700;white-space:nowrap}.ecv td.r{font-size:13px;color:#667}.ecv tr.sum td{background:#F4F7FB;font-weight:800}'
    + '.ecv-ft{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:#F4F7FB;font-size:14px;color:#445;word-break:keep-all}.ecv-ft .btn8{padding:4px 12px;border-radius:4px;background:#1F4E8C;color:#fff;font-weight:800;font-size:13px}.ecv-ft .st{font-weight:800}.ecv-ft .st.ok{color:#2B8A3E}.ecv-ft .st.wait{color:#B35C00}.ecv-ft .st.bad{color:#C92A2A}'
    + '@media (max-width:560px){.ecv-hd{grid-template-columns:auto 1fr}.ecv th.rm,.ecv td.r{display:none}}';
  document.head.appendChild(st);
  const ymd = d => String(d || '').replace(/-/g, '/');
  const lineOf = l => { const it = prodItem(l.code) || {}; return { code: l.code, name: it.name || l.code, unit: l.mode === 'ea' ? '개' : (it.unit || ''), mode: l.mode || '', qty: Number(l.qty), ecQty: prodEcQty(it, l.qty, l.mode), ecUnit: prodEcUnit(it), note: String(l.note || '').trim() }; };
  window.fldEcView = function (entry, opt) { opt = opt || {}; let rows = []; try { rows = prodRows(entry); } catch (e) { return ''; }
    const c = entry.cfg || prodS().cfg;   /* 2026-10-22 사용자 결정: 창고는 구분하지 않음(재고는 전체 합계) → 주황 표시 없음 */
    const tr = rows.map((r, i) => { const l = entry.lines[i] || {}, it = prodItem(r.PROD_CD) || {};
      return '<tr><td class="c">' + esc(r.PROD_CD) + '</td><td>' + esc(it.ecName || l.name || r.PROD_CD) + '</td><td class="n">' + esc(fmt(Number(r.QTY))) + ' <small>' + esc(l.ecUnit || prodEcUnit(it) || '') + '</small></td><td class="r">' + esc(r.REMARKS || '') + '</td></tr>'; }).join('');
    const st = opt.status ? '<span class="st ' + (opt.status.cls || '') + '">' + esc(opt.status.t) + '</span>' : '';
    return '<div class="ecv"><div class="ecv-top"><b>ECOUNT</b><span class="path">재고 › 생산/외주 › 생산입고</span><span class="tag">' + esc(opt.tag || '이렇게 들어갑니다') + '</span></div>'
      + '<div class="ecv-ttl">생산입고 입력' + (entry.test ? ' <small style="color:#C92A2A">(테스트 모드 — 실제로는 안 들어감)</small>' : '') + '</div>'
      + '<div class="ecv-hd"><span class="l">일자</span><span class="v">' + esc(ymd(entry.date)) + '</span><span class="l">담당자</span><span class="v">' + esc(c.emp || '(없음)') + '</span>'
      + '<span class="l">생산된 공장</span><span class="v' + '' + '">' + esc(c.whF || '(없음)') + '</span><span class="l">받는 창고</span><span class="v' + '' + '">' + esc(c.whT || '(없음)') + '</span></div>'
      + '<table><thead><tr><th>품목코드</th><th>품목명</th><th style="text-align:right">수량</th><th class="rm">적요</th></tr></thead><tbody>' + (tr || '<tr><td colspan="4">담은 품목이 없습니다</td></tr>') + '</tbody></table>'
      + '<div class="ecv-ft"><span class="btn8">저장(F8)</span>' + st + '<span>' + esc(opt.foot || '') + '</span></div></div>'; };
  const holdTxt = () => { const c = prodS().cfg; return c.batch === false ? '보내면 바로 이카운트에 들어갑니다' : '오늘 생산은 ' + (c.cutoff || '17:30') + '에 한 전표로 합쳐서 들어갑니다'; };
  /* 1) 보내기 확인 창 맨 위 */
  const _conf = prodConfirm;
  prodConfirm = function () { const r = _conf.apply(this, arguments);
    try { const mb = document.getElementById('modalBody'); const h2 = mb && mb.querySelector('h2'); if (h2 && /이카운트 생산입고로 보낼까요/.test(h2.textContent) && !mb.querySelector('.ecv')) { const P = prodS();
        const entry = { date: P.draft.date, workers: (P.draft.workers || []).slice(), test: !!P.cfg.test, lines: P.draft.lines.filter(l => Number(l.qty) > 0).map(lineOf), cfg: { emp: P.cfg.emp, whF: P.cfg.whF, whT: P.cfg.whT, extra: P.cfg.extra, wkRem: P.cfg.wkRem !== false } };
        h2.insertAdjacentHTML('afterend', fldEcView(entry, { tag: '보내기 전 미리보기', foot: holdTxt() })); } } catch (e) {}
    return r; };
  /* 2) 생산량 입력 화면 위: 오늘 보낸 전표 */
  const stOf = en => en.status === 'sent' ? { t: '✓ 이카운트 입력 완료' + (en.slip ? ' · 전표 ' + (Array.isArray(en.slip) ? en.slip.join(', ') : en.slip) : ''), cls: 'ok' }
    : en.status === 'fail' ? { t: '⚠ 보내지 못함 — ' + (en.err || '사무실에 알려 주세요'), cls: 'bad' } : en.status === 'wait' || en.status === 'queued' ? { t: '⏳ 중계에 모아 두는 중', cls: 'wait' } : { t: '⏳ 보내는 중', cls: 'wait' };
  const _qty = fldQtyHtml;
  fldQtyHtml = function () { let h = _qty(); try { const D = fldD(), es = (prodS().log || []).filter(en => en.date === D && en.status !== 'cancel'); if (!es.length) return h;
      const v = es.map(en => fldEcView(en, { tag: '오늘 보낸 전표', status: stOf(en), foot: en.status === 'sent' ? '' : holdTxt() })).join('');
      const i = h.indexOf('<input class="fld-q"'); return i < 0 ? h + v : h.slice(0, i) + '<h2 class="fld-h2">🧾 오늘 이카운트로 보낸 생산</h2>' + v + h.slice(i); } catch (e) { return h; } };
})();

/* ══ 「지금 할 차례」 돋보이게 + 입체 카드 + 도형 채우기 (2026-10-22 Aside, 사용자 「어디를 눌러야 하는지 미리 배경색으로, 다른 화면에도, 처음 화면이 낯설지 않게」) ══
   - 모든 카드: 자기 색의 연한 바탕(채우기) + 아래 그림자(입체), 누르면 쑥 들어감.
   - 지금 누를 곳: 진한 색으로 꽉 채우고 흰 글씨 · 조금 크게 · 빛나는 테두리가 천천히 퍼짐 · 「👆 여기를 누르세요」. 아직 차례가 아닌 단계는 살짝 옅게.
   - 안쪽 화면도 같은 규칙(.fnow): 오븐·급냉·금속 고르기 → 아직 안 한 첫 칸 / 품목 → 기록 안 끝난 첫 품목 / 숫자 다 채운 입력 → 「저장」 / 생산량 → 담았으면 「이카운트로 보내기」, 수량 넣었으면 「담기」. */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = ''
    + '#fld .ft,#fld .fsf-c,#fld .fsg-r,#fld .fqu button,#fld .fsnav button,#fld .fb{position:relative;transition:transform .08s,box-shadow .08s}'
    + '#fld .ft,#fld .fsf-c{box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 4px 0 rgba(0,0,0,.10),0 8px 16px rgba(0,0,0,.07)!important}'
    + '#fld .ft:active,#fld .fsf-c:active,#fld .fb:active,#fld .fsnav button:active,#fld .fqu button:active{transform:translateY(3px)!important;box-shadow:0 1px 0 rgba(0,0,0,.12)!important}'
    /* 채우기: 자기 색의 연한 바탕 */
    + '#fld .fsf-c{background:linear-gradient(180deg,color-mix(in srgb,var(--c) 9%,#fff),color-mix(in srgb,var(--c) 20%,#fff))}'
    + '#fld .ft.big{background:linear-gradient(180deg,color-mix(in srgb,var(--c,#90A4AE) 8%,#fff),color-mix(in srgb,var(--c,#90A4AE) 18%,#fff))}'
    + '#fld .ft:not(.big):not(.on):not(.today):not(.bad){background:linear-gradient(180deg,#fff,#F1F4F6)}'
    + '#fld .ft.on{background:linear-gradient(180deg,#F1FBF3,#DDF5E3)!important}#fld .ft.today{background:linear-gradient(180deg,#F0F7FF,#DCEBFC)!important}'
    + '#fld .fsf-c.done{background:linear-gradient(180deg,#F3FBF5,#DFF3E5)!important;border-color:#8CD3A0!important}#fld .fsf-c.done .t b{color:#2B8A3E!important}'
    + '#fld .fsf-c:not(.now):not(.done){opacity:.8}'
    + '#fld .fsnav button{box-shadow:0 4px 0 rgba(0,0,0,.12)}#fld .fsnav button.nx{box-shadow:0 4px 0 #4E2E14}'
    /* 지금 누를 곳: 꽉 채움 + 흰 글씨 + 빛 */
    + '#fld .fsf-c.now,#fld .fnow{--k:var(--c,#7A4A23);background:linear-gradient(180deg,color-mix(in srgb,var(--k) 82%,#fff),var(--k))!important;border-color:color-mix(in srgb,var(--k) 75%,#000)!important;color:#fff!important;opacity:1!important;'
    + 'box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 6px 0 color-mix(in srgb,var(--k) 60%,#000),0 14px 26px color-mix(in srgb,var(--k) 45%,transparent)!important;transform:translateY(-2px) scale(1.015);z-index:1}'
    + '#fld .fsf-c.now *,#fld .fnow *{color:#fff!important}#fld .fsf-c.now .n{background:#fff!important;color:var(--k)!important}#fld .fsf-c.now .n *{color:var(--k)!important}'
    + '#fld .fsf-c.now .tag{background:#fff!important;color:var(--k)!important}#fld .fsf-c.now .go{font-size:40px}'
    + '#fld .fsf-c.now::after,#fld .fnow::after{content:"";position:absolute;inset:-4px;border-radius:inherit;border:3px solid var(--k);animation:fpulse 1.8s ease-out infinite;pointer-events:none}'
    + '@keyframes fpulse{0%{opacity:.9;transform:scale(1)}80%,100%{opacity:0;transform:scale(1.06)}}'
    + '#fld .fpress{display:inline-block;margin-top:6px;padding:4px 14px;border-radius:99px;background:rgba(255,255,255,.95);color:var(--k)!important;font-size:16px;font-weight:900;box-shadow:0 2px 0 rgba(0,0,0,.15);animation:fbob 1.2s ease-in-out infinite;width:max-content}'
    + '#fld .fsf-c.now .fpress,#fld .fnow .fpress,#fld .fsf-c.now .fpress *,#fld .fnow .fpress *{color:var(--k)!important}#fld .fpress *{color:var(--k)!important}@keyframes fbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}'
    + '#fld .fnow.ft .pimg{outline:3px solid rgba(255,255,255,.8)}'
    + '@media (prefers-reduced-motion:reduce){#fld .fsf-c.now::after,#fld .fnow::after,#fld .fpress{animation:none}}';
  document.head.appendChild(st);
  const press = (el, t) => { if (!el || el.querySelector('.fpress')) return; const host = el.querySelector('.t') || el; host.insertAdjacentHTML('beforeend', '<span class="fpress">👆 ' + (t || '여기를 누르세요') + '</span>'); };
  const mark = (el, t, noLabel, col) => { if (!el) return; if (col) el.style.setProperty('--c', col); el.classList.add('fnow'); if (!noLabel) press(el, t); };
  const vis = el => el && !el.classList.contains('fsx') && el.offsetParent !== null;
  const _r = fieldRender;
  fieldRender = function () { _r.apply(this, arguments);
    try { const body = document.querySelector('#fld .fld-body'); if (!body) return; const s = FLD.step;
      if (s === 'home') { press(body.querySelector('.fsf-c.now'), body.querySelector('.fsf-c.now[data-f="ws"]') ? '여기부터 시작하세요' : '여기를 누르세요'); return; }
      if (s === 'mode' || (s === 'type' && body.querySelector('.fld-grid .ft.big'))) { const t = [...body.querySelectorAll('.fld-grid .ft.big')].find(b => vis(b) && !b.classList.contains('on') && !b.classList.contains('dim')); mark(t); return; }
      if (s === 'type') { const t = [...body.querySelectorAll('[data-f="prod"]')].find(b => vis(b) && !b.classList.contains('on')); mark(t, '이 품목 기록하기'); return; }
      if (s === 'qty') { const send = body.querySelector('[data-f="qtysend"]'); if (send) { mark(send, '', true, '#5F3DC4'); return; } const top = body.querySelector('.fld-gh.top'); const g = top && top.nextElementSibling; const t = g && [...g.querySelectorAll('.ft')].find(b => !b.classList.contains('on')); mark(t, '수량 넣기'); return; }
      if (s === 'qtyin') { const any = Object.values(FLD.qx || {}).some(v => Number(v) > 0); if (any) mark(body.querySelector('[data-fqput]'), '', true, '#5F3DC4'); return; }
      if (s === 'form') { const full = (FLD.fields || []).every(x => FLD.vals[x.f] !== '' && FLD.vals[x.f] != null); if (full) body.querySelectorAll('[data-f="save"]').forEach(b => mark(b, '', true, '#2F9E44')); return; }
      if (s === 'act') { mark(body.querySelector('[data-f="actsave"]'), '', true, '#C92A2A'); }
    } catch (e) {} };
})();

/* ══ 지금 누를 곳 색은 하나 (2026-10-22 Aside, 사용자 「색이 달라지면 머뭇거림 → 모두 동일하게」) ══
   - 첫 화면 단계 카드·안쪽 화면·저장·담기·이카운트로 보내기·개선조치 저장 모두 같은 「누르세요 색」(갈색 #7A4A23, 앱 아이콘·「다음 ›」 버튼과 같은 색).
   - 단계 고유 색(오븐 주황·급냉 파랑 등)은 차례가 아닌 카드의 연한 채우기에만 남김. 생산량 칸 고른 테두리도 같은 색. */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '#fld .fsf-c.now,#fld .fnow{--k:#7A4A23!important}'
    + '#fld .fqu button.on{border-color:#7A4A23!important;background:#FBF3EA!important;box-shadow:0 0 0 3px #E9D3BC!important}#fld .fqu button.on .k{color:#7A4A23!important}';
  document.head.appendChild(st);
})();

/* ══ 한계기준 이탈 경고창 + 저장 전 한 번 더 확인 (2026-10-22 Aside, 사용자 「수동 입력 값이 한계기준을 벗어나면 경고창, 저장할 때 한 번 더 물어봐」) ══
   - 손으로 고친 칸(숫자판·O/X)을 벗어날 때 그 값이 기준 밖이면 큰 경고창: 「값 다시 고치기」(누를 곳 색) / 「이 값이 맞습니다」. 같은 값으로는 한 번만 띄움.
   - 저장을 누를 때 기준 밖 칸이 하나라도 있으면(미리 채운 값 포함) 한 번 더 확인: 「값 다시 확인」 / 「그대로 저장 → 개선조치 적기」. 그대로 저장하면 원래 흐름대로 개선조치 화면으로 감.
   - 판정은 원래 함수 fldFieldBad(그날 기준표 CCP_LIM_HIST) 그대로. */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '.fwarn-bg{position:fixed;inset:0;z-index:100;background:rgba(20,10,5,.55);display:flex;align-items:center;justify-content:center;padding:16px}'
    + '.fwarn{width:min(560px,100%);background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.35);animation:fwin .18s ease-out}@keyframes fwin{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}'
    + '.fwarn-hd{background:#C92A2A;color:#fff;padding:16px 20px;font-size:24px;font-weight:900;line-height:1.3}.fwarn-hd small{display:block;font-size:16px;font-weight:600;opacity:.95;margin-top:4px}'
    + '.fwarn-bd{padding:16px 20px;font-size:18px;color:#2b1d14;line-height:1.55;word-break:keep-all}.fwarn-row{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding:10px 12px;margin:0 0 8px;border-radius:12px;background:#FFF5F5;border:2px solid #FFC9C9}'
    + '.fwarn-row b{font-size:17px;color:#5c3b2a}.fwarn-row .v{font-size:30px;font-weight:900;color:#C92A2A;white-space:nowrap}.fwarn-row .lim{font-size:16px;color:#5c3b2a;white-space:nowrap}'
    + '.fwarn-bt{display:flex;flex-direction:column;gap:10px;padding:0 20px 20px}.fwarn-bt button{min-height:62px;border-radius:14px;font-size:20px;font-weight:900;cursor:pointer}'
    + '.fwarn-bt .go{background:linear-gradient(180deg,#9A6236,#7A4A23);border:2px solid #5a3519;color:#fff;box-shadow:0 5px 0 #4E2E14}.fwarn-bt .go:active{transform:translateY(3px);box-shadow:0 2px 0 #4E2E14}'
    + '.fwarn-bt .alt{background:#fff;border:2px solid #E03131;color:#C92A2A}';
  document.head.appendChild(st);
  const valTxt = x => { const v = FLD.vals[x.f]; if (x.k === 'ox') return v === 'O' ? (x.yes + ' (O)') : v === 'X' ? (x.no + ' (X)') : v; return (x.neg && v !== '' ? '−' : '') + v + (x.u || ''); };
  const limTxt = (x, b) => x.k === 'ox' ? '정상: ' + (x.good === 'O' ? x.yes : x.no) : x.lim ? '기준 ' + x.lim : (b || []).join(', ');
  const badOf = x => { try { const b = fldFieldBad(x); return b && b.length ? b : null; } catch (e) { return null; } };
  const close = () => { const m = document.querySelector('.fwarn-bg'); if (m) m.remove(); };
  const show = (title, sub, xs, goTxt, altTxt, onGo, onAlt) => { close();
    const rows = xs.map(({ x, b }) => '<div class="fwarn-row"><b>' + esc(x.lb) + '</b><span class="v">' + esc(valTxt(x)) + '</span><span class="lim">' + esc(limTxt(x, b)) + '</span></div>').join('');
    const bg = document.createElement('div'); bg.className = 'fwarn-bg';
    bg.innerHTML = '<div class="fwarn" role="alertdialog"><div class="fwarn-hd">⚠ ' + esc(title) + '<small>' + esc(sub) + '</small></div><div class="fwarn-bd">' + rows + '</div>'
      + '<div class="fwarn-bt"><button type="button" class="go">' + esc(goTxt) + '</button><button type="button" class="alt">' + esc(altTxt) + '</button></div></div>';
    (document.getElementById('fld') || document.body).appendChild(bg);
    bg.querySelector('.go').onclick = e => { e.stopPropagation(); close(); onGo && onGo(); };
    bg.querySelector('.alt').onclick = e => { e.stopPropagation(); close(); onAlt && onAlt(); };
    bg.addEventListener('click', e => e.stopPropagation()); };
  window.fldWarnClose = close;
  /* 1) 손으로 고친 칸을 벗어날 때 */
  let lastFields = null, lastFi = -1, lastOx = {}, warned = {};
  const _r = fieldRender;
  fieldRender = function () { _r.apply(this, arguments);
    try { if (FLD.step !== 'form' || !FLD.fields) { lastFields = null; return; }
      if (lastFields !== FLD.fields) { lastFields = FLD.fields; lastFi = FLD.fi; warned = {}; lastOx = {}; FLD.fields.forEach(x => { if (x.k === 'ox') lastOx[x.f] = FLD.vals[x.f]; }); return; }
      let hit = null;
      FLD.fields.forEach((x, i) => { if (hit || x.k !== 'ox') return; const v = FLD.vals[x.f]; if (v !== lastOx[x.f]) { lastOx[x.f] = v; const b = badOf(x); if (b) hit = { x, b, i }; } });
      if (!hit && lastFi !== FLD.fi && lastFi >= 0) { const x = FLD.fields[lastFi]; if (x && x.k !== 'ox' && FLD.typed && FLD.typed[x.f] && FLD.vals[x.f] !== '') { const b = badOf(x); if (b) hit = { x, b, i: lastFi }; } }
      lastFi = FLD.fi;
      if (hit) { const key = hit.x.f + '=' + FLD.vals[hit.x.f]; if (warned[key]) return; warned[key] = 1;
        show('한계기준을 벗어난 값입니다', '판넬·온도계를 다시 보고, 맞으면 그대로 두세요', [hit], '✎ 값 다시 고치기', '이 값이 맞습니다',
          () => { if (hit.x.k !== 'ox') { FLD.fi = hit.i; if (FLD.typed) delete FLD.typed[hit.x.f]; } fieldRender(); }, null); }
    } catch (e) {} };
  /* 2) 저장할 때 한 번 더 */
  const _save = fldSave;
  fldSave = function () { try { if (!FLD.okBad && FLD.step === 'form' && FLD.fields) {
        const xs = FLD.fields.map((x, i) => ({ x, i, b: FLD.vals[x.f] !== '' ? badOf(x) : null })).filter(o => o.b);
        if (xs.length) { const args = arguments, self = this;
          show('기준을 벗어난 값이 있습니다', '그대로 저장하면 다음 화면에서 개선조치를 적어야 합니다', xs, '✎ 값 다시 확인', '그대로 저장 → 개선조치 적기',
            () => { FLD.fi = xs[0].i; if (FLD.typed) delete FLD.typed[xs[0].x.f]; fieldRender(); },
            () => { FLD.okBad = true; try { _save.apply(self, args); } finally { FLD.okBad = false; } });
          return; } } } catch (e) {}
    return _save.apply(this, arguments); };
})();

/* ══ 한 화면 자동 맞춤 (2026-10-22 Aside, 사용자 「태블릿에서 한 화면에 꽉 차게, 스크롤 없이, 휴대폰도 자동 맞춤」) ══
   - 화면을 그릴 때마다 내용 높이를 재서 화면(위 제목줄·아래 저장줄 뺀 높이)에 꽉 차게 비율대로 줄이거나 키움(zoom, 70%~140%). 첫 화면은 그래도 남는 높이만큼 단계 카드를 늘려 꽉 채움.
   - 너무 작아지지 않게 최소 70%. 품목 목록처럼 원래 아주 긴 화면(화면 2배 넘음)은 줄이지 않고 그 부분만 스크롤.
   - 첫 화면 아래 「화면 가장자리 여백」·앱 안내는 「⚙ 설정·새로고침」 한 줄로 접어 자리 확보. 화면을 돌리거나 크기가 바뀌면 다시 맞춤. */
(function () {
  if (!window.FIELD_APP) return;
  const MIN = 0.7, MAX = 1.4;
  const st = document.createElement('style');
  st.textContent = '#fld .fld-body{padding-top:10px!important;padding-bottom:12px!important}'
    + '#fld .fset-hide .fld-auto,#fld .fset-hide .fapp-foot{display:none!important}'
    + '#fld .fset-btn{display:block;width:100%;min-height:48px;margin:10px 0 0;border-radius:12px;border:1.5px dashed #C9B79F;background:transparent;color:#6b5a48;font-size:16px;font-weight:700;cursor:pointer}'
    + '#fld .fsf{margin-bottom:10px}#fld .fld-card{margin-bottom:10px}#fld .fsf-c .t b,#fld .ft b{word-break:keep-all}';
  document.head.appendChild(st);
  let setOpen = false;
  const listy = () => FLD.step === 'ws' || FLD.step === 'qty' || FLD.step === 'who';
  window.fldFit = function () { try { const box = document.getElementById('fld'), body = box && box.querySelector('.fld-body'); if (!body || !FLD.open) return;
      const top = box.querySelector('.fld-top'), sv = [...box.querySelectorAll('.fld-save')].find(x => x.offsetParent !== null && getComputedStyle(x).position === 'fixed');
      const saveH = sv ? sv.offsetHeight : 0; body.style.paddingBottom = saveH ? (saveH + 12) + 'px' : '';
      body.querySelectorAll('.fsf-c').forEach(c => { c.style.minHeight = ''; }); body.style.zoom = ''; const avail = box.clientHeight - (top ? top.offsetHeight : 0); const need = body.scrollHeight;
      if (listy()) { const s0 = avail / need; body.style.zoom = s0 < 1 && s0 >= 0.9 ? String(Math.floor(s0 * 995) / 1000) : ''; return; }   /* 목록 화면은 글씨를 줄이거나 키우지 않음 */
      let s = need > 0 ? avail / need : 1; if (s < MIN) s = need > avail * 2 ? 1 : MIN; if (s > MAX) s = MAX;
      for (let k = 0; k < 4; k++) { body.style.zoom = String(Math.floor(s * 995) / 1000); const over = box.scrollHeight - box.clientHeight;
        if (over <= 1 || s <= MIN) break; const h2 = body.getBoundingClientRect().height; s = Math.max(MIN, s * (h2 - over) / h2); }
      if (Math.abs(s - 1) < 0.02) body.style.zoom = '';
      /* 첫 화면: 그래도 남는 높이는 단계 카드를 늘려서 채움 (가로 = 카드 높이, 세로 = 카드마다 나눠서) */
      const fsf = body.querySelector('.fsf'), cs = fsf ? [...fsf.querySelectorAll('.fsf-c')] : [];
      if (FLD.step === 'home' && cs.length) { const z = Number(body.style.zoom) || 1, left = (avail - body.getBoundingClientRect().height) / z - 6;
        if (left > 16) { const row = getComputedStyle(fsf).flexDirection === 'row'; const hs = cs.map(c => c.getBoundingClientRect().height / z); cs.forEach((c, i) => { c.style.minHeight = Math.floor(hs[i] + Math.min(160, row ? left : left / cs.length)) + 'px';   /* 한 카드가 너무 커지지 않게 최대 160px만 늘림 */ });
          for (let k = 0; k < 3; k++) { const over = box.scrollHeight - box.clientHeight; if (over <= 0) break; cs.forEach(c => { c.style.minHeight = Math.max(60, parseFloat(c.style.minHeight) - (row ? over : over / cs.length) / z - 2) + 'px'; }); } } } } catch (e) {} };
  const _r = fieldRender;
  fieldRender = function () { _r.apply(this, arguments);
    try { const body = document.querySelector('#fld .fld-body'); if (body && FLD.step === 'home') { const foot = body.querySelector('.fapp-foot');
        if (foot && !body.querySelector('.fset-btn')) { body.classList.toggle('fset-hide', !setOpen); const b = document.createElement('button'); b.type = 'button'; b.className = 'fset-btn';
          b.textContent = setOpen ? '▲ 설정 접기' : '⚙ 설정·새로고침·로그아웃'; b.onclick = e => { e.stopPropagation(); setOpen = !setOpen; fieldRender(); }; const first = body.querySelector('.fld-auto') || foot; first.parentNode.insertBefore(b, first); } } } catch (e) {}
    fldFit(); requestAnimationFrame(fldFit); };
  let tm = 0; window.addEventListener('resize', () => { const a = document.activeElement; if (a && a.matches && a.matches('#fld [data-f="q"]')) return; clearTimeout(tm); tm = setTimeout(fldFit, 150); });
  window.addEventListener('orientationchange', () => setTimeout(fldFit, 300));
})();

/* ══ 누를 곳만 갈색, 나머지 도형은 모두 연회색 + 읽기 쉬운 진한 글꼴 + 보내기 창은 미리보기만 (2026-10-22 Aside, 사용자 요청) ══
   - 색은 딱 두 가지: 지금 누를 곳 = 갈색, 나머지 카드·버튼·칸 = 연회색(#F1F3F5). 단계별 색·완료 초록·고른 칸 보라 등은 모두 회색 계열로. 기준 이탈(⚠) 빨간 글씨만 남김.
   - 글꼴: Pretendard(인터넷으로 받음, 못 받으면 기기 기본 글꼴), 본문 굵게(600)·제목 더 굵게(800)·글자색 진하게.
   - 「이카운트 생산입고로 보낼까요?」 창: 이카운트 화면 미리보기 + 경고(있을 때만) + 취소/보내기만 남기고 아래 표·생지 소모·안내 글은 숨김. */
(function () {
  if (!window.FIELD_APP) return;
  const lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'; document.head.appendChild(lk);
  const G = '#F1F3F5', GB = '#CED4DA', TX = '#1F2328', T2 = '#343A40';
  const st = document.createElement('style');
  st.textContent = ''
    + '#fld,#fld button,#fld input,.fwarn,.ecv,#modalBody{font-family:"Pretendard Variable",Pretendard,"Noto Sans KR","Malgun Gothic",-apple-system,sans-serif!important}'
    + '#fld .fld-body{font-weight:600;color:' + TX + '}#fld .fld-body b,#fld .fld-h,#fld .fld-h2,#fld .fld-gh{font-weight:800!important;color:' + TX + '}#fld .fld-p,#fld .fld-body small{color:' + T2 + '}'
    /* 단계 카드 (차례 아닌 것 · 완료 포함) */
    + '#fld .fsf-c:not(.now){background:' + G + '!important;border-color:' + GB + '!important;opacity:1!important}'
    + '#fld .fsf-c:not(.now) .t b{color:' + TX + '!important}#fld .fsf-c:not(.now) .t small{color:' + T2 + '!important;font-weight:600}#fld .fsf-c:not(.now) .t small.bad{color:#C92A2A!important}'
    + '#fld .fsf-c:not(.now) .n{background:#868E96!important;color:#fff!important}#fld .fsf-c:not(.now) .go{color:#868E96!important}#fld .fsf-c:not(.now) .tag{background:#495057!important;color:#fff!important}'
    + '#fld .fsf-ar{color:#ADB5BD!important}'
    /* 안쪽 카드·목록·칸·버튼 */
    + '#fld .ft:not(.fnow),#fld .fsg-r,#fld .fqu button:not(.fnow),#fld .fqchip button,#fld .fqv button,#fld .fsmore,#fld .fsnav button:not(.fnow),#fld .fld-body .fb:not(.fnow),#fld .fsg-hd button,#fld .fsg-gp button,#fld .fsf-pk button{background:' + G + '!important;border-color:' + GB + '!important;color:' + TX + '!important}'
    + '#fld .ft:not(.fnow) b,#fld .ft:not(.fnow) small,#fld .fsg-r b{color:' + TX + '!important}#fld .ft:not(.fnow) small{color:' + T2 + '!important}#fld .ft:not(.fnow) small.bad{color:#C92A2A!important}'
    + '#fld .fsnav button.nx:not(.fnow){box-shadow:0 4px 0 rgba(0,0,0,.12)!important}#fld .fsg-r .go{color:#495057!important}#fld .fsg-r small.on{color:' + T2 + '!important}'
    + '#fld .fsg-gp button.on,#fld .fsf-pk button.on{background:#495057!important;border-color:#495057!important;color:#fff!important}'
    + '#fld .fqu button.on{background:#fff!important;border-color:#495057!important;box-shadow:0 0 0 3px ' + GB + '!important}#fld .fqu button .k,#fld .fqu button.on .k{color:' + TX + '!important}#fld .fqu button .s.sent{color:' + T2 + '!important}'
    + '#fld .fld-f{background:#F8F9FA!important;border-color:' + GB + '!important}#fld .fld-f.on{background:#fff!important;border-color:#495057!important;box-shadow:0 0 0 3px ' + GB + '}#fld .fld-f.bad{border-color:#E03131!important;background:#FFF5F5!important}'
    + '#fld .fld-f label{color:' + T2 + '!important;font-weight:700}#fld .fav-tag{background:#E9ECEF!important;color:#495057!important}#fld .fav-bar{background:#F8F9FA!important;border-color:' + GB + '!important;color:' + TX + '!important}#fld .fav-bar b{color:' + TX + '!important}'
    + '#fld .fld-card.ok{background:#F8F9FA!important;border-color:' + GB + '!important}#fld .fld-card.ok b{color:' + TX + '!important}'
    + '#fld .keys button{background:' + G + '!important;border-color:' + GB + '!important;color:' + TX + '!important}';
  document.head.appendChild(st);
  try { document.fonts && document.fonts.ready.then(() => { try { fldFit(); } catch (e) {} }); lk.onload = () => setTimeout(() => { try { fldFit(); } catch (e) {} }, 200); } catch (e) {}
  /* 보내기 창: 미리보기만 */
  const _conf = prodConfirm;
  prodConfirm = function () { const r = _conf.apply(this, arguments);
    try { const mb = document.getElementById('modalBody'); if (mb && mb.querySelector('.ecv')) { const ecv = mb.querySelector('.ecv');
        [...mb.children].forEach(el => { if (el === ecv || el.tagName === 'H2') return; const t = el.textContent || '';
          const keep = el.querySelector && (el.querySelector('#pSendOk') || /보낼 수 없습니다|2배가 넘습니다|오늘\(.*\)이 아닙니다/.test(t));
          if (!keep) el.style.display = 'none'; }); } } catch (e) {}
    return r; };
})();

/* ══ 오븐: 시작·종료를 저장하면 그 사이 2시간 측정 줄을 자동으로 만들어 줌 (2026-10-22 Aside, 사용자 「K-HACCP처럼 시작·종료 사이 2시간 단위 자동 생성」) ══
   - 「종료 측정」을 저장하면(시작 측정이 있을 때) 시작 + 2시간, + 4시간 … (종료 10분 전까지) 칸 중 「중간」 기록이 없는 시각만 골라 확인 창을 띄움.
     예) 시작 07:58 · 종료 13:09 → 09:58, 11:58 두 줄.
   - 값: 가열온도·가열시간 = 시작 측정 값(오븐 설정), 품온 = 시작·종료 품온 평균. 「✓ N줄 만들기」를 눌러야 들어감(자동 저장 없음), 만든 줄은 r.us src:'auto2h' 표시 → PC에서 구분.
   - 이미 손으로 넣은 2시간 측정(±30분 안)이 있으면 그 칸은 건너뜀. 만든 뒤 「오늘 기록」에서 줄을 눌러 고칠 수 있음. */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '.f2h .fwarn-hd{background:#495057}.f2h .fwarn-row{background:#F8F9FA;border-color:#DEE2E6}.f2h .fwarn-row .v{color:#1F2328;font-size:26px}.f2h .note{font-size:16px;color:#495057;margin-top:6px}';
  document.head.appendChild(st);
  const mm = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); return m ? (+m[1]) * 60 + (+m[2]) : null; };
  const hm = n => String(Math.floor(n / 60) % 24).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  const plan = code => { const g = fldLog('oven'); if (!g) return null; const rs = (g.rows || []).filter(r => r.code === code);
    const s = rs.find(r => r.tag === '시작' && mm(r.time) != null), e = rs.find(r => r.tag === '종료' && mm(r.time) != null); if (!s || !e) return null;
    const S = mm(s.time), E = mm(e.time); if (!(E > S)) return null; const mids = rs.filter(r => r.tag !== '시작' && r.tag !== '종료' && mm(r.time) != null).map(r => mm(r.time));
    const core = (() => { const a = Number(s.core), b = Number(e.core); return isFinite(a) && isFinite(b) && s.core !== '' && e.core !== '' ? Math.round((a + b) / 2) : (s.core || e.core || ''); })();
    const slots = []; for (let t = S + 120; t < E - 10; t += 120) { if (!mids.some(m => Math.abs(m - t) <= 30)) slots.push(hm(t)); }
    return slots.length ? { g, s, e, slots, temp: s.temp, min: s.min, core: String(core), name: s.name } : null; };
  const make = (code, P) => { const D = fldD(), wk = fldWk(); P.slots.forEach(t => { const nr = fldNewRow(P.g, 'oven', code, '중간'); const i = fldIdx(P.g, 'rows', nr.id);
      [['time', t], ['temp', P.temp], ['min', P.min], ['core', P.core]].forEach(([f, v]) => { if (v !== '' && v != null) ccpSet(D + '|oven|rows|' + i + '|' + f, String(v)); });
      nr.sg = wk; nr.mt = new Date().toISOString(); nr.us = { f: { temp: String(P.temp), min: String(P.min), core: String(P.core) }, at: nr.mt, by: wk, src: 'auto2h' }; });
    ccpTouch(P.g); save(); toast('⏱ 2시간 측정 ' + P.slots.length + '줄을 만들었습니다 — 「오늘 기록」에서 눌러 고칠 수 있습니다', 3500); };
  const ask = code => { const P = plan(code); if (!P) return; const old = document.querySelector('.fwarn-bg'); if (old) old.remove();
    const bg = document.createElement('div'); bg.className = 'fwarn-bg f2h';
    bg.innerHTML = '<div class="fwarn" role="dialog"><div class="fwarn-hd">⏱ 2시간 측정 줄 만들기<small>' + esc(fldShort(P.name)) + ' · 시작 ' + esc(P.s.time) + ' ~ 종료 ' + esc(P.e.time) + '</small></div><div class="fwarn-bd">'
      + P.slots.map(t => '<div class="fwarn-row"><span class="v">' + esc(t) + '</span><b>' + esc(P.temp) + '℃ · ' + esc(P.min) + '분 · 품온 ' + esc(P.core) + '℃</b></div>').join('')
      + '<div class="note">2시간마다 확인한 값이 이와 같을 때 만드세요. 다른 값은 만든 뒤 「오늘 기록」에서 그 줄을 눌러 고치면 됩니다.</div></div>'
      + '<div class="fwarn-bt"><button type="button" class="go">✓ ' + P.slots.length + '줄 만들기</button><button type="button" class="alt" style="border-color:#ADB5BD;color:#495057">만들지 않기</button></div></div>';
    (document.getElementById('fld') || document.body).appendChild(bg); bg.addEventListener('click', e => e.stopPropagation());
    bg.querySelector('.go').onclick = e => { e.stopPropagation(); bg.remove(); try { make(code, P); } catch (er) { toast('만들기 오류: ' + er.message); } fieldRender(); };
    bg.querySelector('.alt').onclick = e => { e.stopPropagation(); bg.remove(); }; };
  window.fld2hAsk = ask; window.fld2hPlan = plan;
  let pend = '';
  const _save = fldSave;
  fldSave = function () { const type = FLD.type, mode = FLD.mode, code = FLD.code, prev = FLD.step; const r = _save.apply(this, arguments);
    try { if (type === 'oven' && (mode === '종료' || mode === '시작') && FLD.step !== 'form' && plan(code)) { if (window.__f2hDirect) { window.__f2hDirect = false; if (FLD.step !== 'act') { make(code, plan(code)); setTimeout(() => { try { fieldRender(); } catch (e) {} }, 50); } else pend = code; } else { pend = code; if (FLD.step !== 'act') { pend = ''; setTimeout(() => ask(code), 200); } } } } catch (e) {}
    window.__f2hDirect = false;
    return r; };
  const _r = fieldRender;
  fieldRender = function () { _r.apply(this, arguments); try { if (pend && FLD.step !== 'act' && FLD.step !== 'form') { const c = pend; pend = ''; setTimeout(() => ask(c), 200); } } catch (e) {}
    try { if (FLD.step === 'mode' && FLD.type === 'oven') { const g = fldLog('oven'), e = g && (g.rows || []).find(r => r.code === FLD.code && r.tag === '종료' && r.time);   /* 종료까지 끝난 품목은 더 누를 곳 없음 */
        if (e) document.querySelectorAll('#fld .fld-body .fnow').forEach(b => { b.classList.remove('fnow'); const p = b.querySelector('.fpress'); if (p) p.remove(); }); } } catch (e) {} };
})();

/* ══ 오븐 화면 간단하게: 시작 측정 · 2시간 측정 · 종료 측정을 맨 위 한 줄 (2026-10-22 Aside, 사용자 「생산실은 시작·종료만 누르면 되게, 직관적으로」) ══
   - 오븐 품목 화면 = 🟢 시작 측정 → ⏱ 2시간 측정(자동) → 🏁 종료 측정 세 칸 한 줄. 누를 곳(시작 → 종료)만 갈색.
   - 시작·종료 칸을 누르면 작은 확인 창: 지금 시각 + 평소 값(가열온도·가열시간·품온) → 「✓ 저장」 한 번. 값·시각이 다르면 「고치기」로 원래 입력 화면.
   - 종료 저장 때 사이 2시간 측정 줄을 함께 만듦(확인 창에 미리 보여 주고, 끄고 싶으면 체크 해제). 저장은 원래 fldSave 흐름 그대로(기준 이탈 경고·개선조치 포함). */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '#fld .fov3{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:stretch;gap:8px;margin:4px 0 14px}'
    + '#fld .fov3 .ar{align-self:center;font-size:30px;font-weight:900;color:#ADB5BD}'
    + '#fld .fov3 .ft.big{min-height:170px;align-items:center;text-align:center;justify-content:center;gap:6px}#fld .fov3 .ft.big i{font-size:34px}'
    + '#fld .fov3 .ft.big b{font-size:24px}#fld .fov3 .tm{font-size:34px;font-weight:900;line-height:1.1;letter-spacing:.5px}#fld .fov3 .tm.ph{font-size:18px;font-weight:800;opacity:.8}'
    + '#fld .fov3 .vv{font-size:15px;font-weight:700;word-break:keep-all;line-height:1.35}#fld .fov3 .mid .tm{font-size:22px}'
    + '@media (max-width:620px){#fld .fov3{grid-template-columns:1fr 1fr 1fr;gap:6px}#fld .fov3 .ar{display:none}#fld .fov3 .ft.big{min-height:150px;padding:10px 6px}#fld .fov3 .ft.big b{font-size:18px}#fld .fov3 .tm{font-size:26px}#fld .fov3 .vv{font-size:13px}}'
    + '.fq2 .fwarn-hd{background:#495057}.fq2 .tmbox{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 12px}.fq2 .tmbig{font-size:52px;font-weight:900;color:#1F2328;letter-spacing:1px}.fq2 .tmlab{font-size:16px;color:#495057;font-weight:700}'
    + '.fq2 .vals{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.fq2 .vals div{background:#F1F3F5;border:2px solid #CED4DA;border-radius:12px;padding:8px;text-align:center}.fq2 .vals small{display:block;font-size:14px;color:#495057;font-weight:700}.fq2 .vals b{font-size:28px;color:#1F2328}'
    + '.fq2 .mid2{margin-top:12px;display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:#F8F9FA;border:2px solid #DEE2E6;font-size:17px;font-weight:700;color:#1F2328}.fq2 .mid2 input{width:28px;height:28px}'
    + '.fq2 .src{font-size:14px;color:#495057;margin-top:8px}.fq2 .fwarn-bt .row2{display:flex;gap:10px}.fq2 .fwarn-bt .row2 button{flex:1}';
  document.head.appendChild(st);
  const rowsOf = code => { const g = fldLog('oven'); return g ? (g.rows || []).filter(r => r.code === code) : []; };
  const valsFor = (code, name, row) => { const out = {}; ['temp', 'min', 'core'].forEach(f => { let v = row && row[f] !== '' && row[f] != null ? String(row[f]) : ''; if (!v) { try { const a = fldAvg7('oven', f, name); if (a) v = String(a.v); } catch (e) {} } out[f] = v; }); return out; };
  const _mode = fldModeHtml;
  fldModeHtml = function () { if (FLD.type !== 'oven') return _mode();
    try { const g = fldLog('oven'); if (!g) return _mode(); const rs = rowsOf(FLD.code), s = rs.find(r => r.tag === '시작'), e = rs.find(r => r.tag === '종료'), mids = rs.filter(r => r.tag !== '시작' && r.tag !== '종료' && r.time);
      const card = (r, tag, ico) => { const done = !!(r && r.time); return '<button type="button" class="ft big' + (done ? ' on' : '') + '" data-fq2="' + tag + '"><i>' + ico + '</i><b>' + tag + ' 측정</b>'
        + (done ? '<span class="tm">' + esc(r.time) + '</span><span class="vv">' + esc((r.temp || '—') + '℃ · ' + (r.min || '—') + '분') + '<br>' + esc('품온 ' + (r.core || '—') + '℃') + '</span>' : '<span class="tm ph">눌러서 저장</span><span class="vv">지금 시각으로</span>') + '</button>'; };
      let plan = null; try { plan = s && s.time && !(e && e.time) ? null : fld2hPlan(FLD.code); } catch (er) {}
      const midTxt = mids.length ? mids.map(r => r.time).join(' · ') : (s && s.time && !(e && e.time) ? '종료를 저장하면 자동' : '—');
      const mid = '<button type="button" class="ft big mid" data-f="mode" data-m="중간"><i>⏱</i><b>2시간 측정</b><span class="tm">' + (mids.length ? mids.length + '줄' : '자동') + '</span><span class="vv">' + esc(midTxt) + '</span></button>';
      return '<h1 class="fld-h">' + fldPic(FLD.name, 1) + '🔥 ' + esc(fldShort(FLD.name)) + '</h1><div class="fld-grid fov3">' + card(s, '시작', '🟢') + '<span class="ar">→</span>' + mid + '<span class="ar">→</span>' + card(e, '종료', '🏁') + '</div>' + fldRecHtml(g, FLD.code);
    } catch (er) { return _mode(); } };
  /* 누를 곳: 시작 안 했으면 시작, 시작했으면 종료, 다 했으면 없음 (2시간 칸은 강조 안 함) */
  const _r = fieldRender;
  fieldRender = function () { _r.apply(this, arguments);
    try { if (FLD.step !== 'mode' || FLD.type !== 'oven') return; const body = document.querySelector('#fld .fld-body'); if (!body || !body.querySelector('.fov3')) return;
      body.querySelectorAll('.fnow').forEach(b => { b.classList.remove('fnow'); const p = b.querySelector('.fpress'); if (p) p.remove(); });
      const s = body.querySelector('[data-fq2="시작"]'), e = body.querySelector('[data-fq2="종료"]'); const t = !s.classList.contains('on') ? s : !e.classList.contains('on') ? e : null;
      if (t) { t.classList.add('fnow'); t.insertAdjacentHTML('beforeend', '<span class="fpress">👆 여기를 누르세요</span>'); } try { fldFit(); } catch (er) {} } catch (e) {} };
  /* 시작·종료 빠른 저장 창 */
  const sheet = tag => { const code = FLD.code, name = FLD.name, rs = rowsOf(code), row = rs.find(r => r.tag === tag); const V = valsFor(code, name, row); const now = fldHM();
    let mids = []; if (tag === '종료') { const s = rs.find(r => r.tag === '시작' && r.time); if (s) { const m = t => { const x = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return x ? +x[1] * 60 + +x[2] : null; }; const S = m(s.time), E = m(now), have = rs.filter(r => r.tag !== '시작' && r.tag !== '종료' && r.time).map(r => m(r.time));
        for (let t = S + 120; E != null && t < E - 10; t += 120) if (!have.some(h => Math.abs(h - t) <= 30)) mids.push(String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0')); } }
    const old = document.querySelector('.fwarn-bg'); if (old) old.remove(); const bg = document.createElement('div'); bg.className = 'fwarn-bg fq2';
    bg.innerHTML = '<div class="fwarn" role="dialog"><div class="fwarn-hd">' + (tag === '시작' ? '🟢' : '🏁') + ' ' + tag + ' 측정<small>' + esc(fldShort(name)) + '</small></div><div class="fwarn-bd">'
      + '<div class="tmbox"><span class="tmlab">측정 시각</span><span class="tmbig">' + esc(now) + '</span><span class="tmlab">지금</span></div>'
      + '<div class="vals"><div><small>가열온도</small><b>' + esc(V.temp || '—') + '</b>℃</div><div><small>가열시간</small><b>' + esc(V.min || '—') + '</b>분</div><div><small>품온</small><b>' + esc(V.core || '—') + '</b>℃</div></div>'
      + '<div class="src">' + (row && row.temp ? '지금 기록된 값' : '평소 값(최근 7일 평균)') + ' — 판넬·온도계와 다르면 「고치기」</div>'
      + (mids.length ? '<label class="mid2"><input type="checkbox" checked> 사이 2시간 측정 ' + mids.length + '줄도 함께 만들기 (' + esc(mids.join(', ')) + ')</label>' : '')
      + '</div><div class="fwarn-bt"><button type="button" class="go">✓ 저장</button><div class="row2"><button type="button" class="alt fix" style="border-color:#ADB5BD;color:#1F2328">✎ 값·시각 고치기</button><button type="button" class="alt no" style="border-color:#ADB5BD;color:#495057">취소</button></div></div></div>';
    (document.getElementById('fld') || document.body).appendChild(bg); bg.addEventListener('click', ev => ev.stopPropagation());
    const open = () => { FLD.mode = tag; const tg = fldTarget('oven', code, tag); if (!tg) return false; fldStartForm(tg.row, tg.sec); return true; };
    bg.querySelector('.no').onclick = ev => { ev.stopPropagation(); bg.remove(); };
    bg.querySelector('.fix').onclick = ev => { ev.stopPropagation(); bg.remove(); open(); };
    bg.querySelector('.go').onclick = ev => { ev.stopPropagation(); const cb = bg.querySelector('.mid2 input'); bg.remove(); if (!open()) return;
      FLD.vals.time = now; ['temp', 'min', 'core'].forEach(f => { if (V[f] !== '' && FLD.fields.some(x => x.f === f)) FLD.vals[f] = V[f]; });
      window.__f2hDirect = !!(cb && cb.checked); window.__fq2Back = true; fldSave(); if (FLD.step === 'form') window.__f2hDirect = false; };
  };
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('#fld [data-fq2]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); sheet(b.dataset.fq2); }, true);
  /* 빠른 저장 뒤에는 품목 목록 대신 이 3칸 화면으로 돌아옴 */
  const _r2 = fieldRender;
  fieldRender = function () { if (window.__fq2Back && FLD.step === 'type' && FLD.type === 'oven') { window.__fq2Back = false; FLD.step = 'mode'; } else if (FLD.step !== 'form') window.__fq2Back = false; return _r2.apply(this, arguments); };
})();

/* ══ 급냉·배합·금속도 오븐처럼 「3칸 한 줄 + 빠른 저장」 (2026-10-22 Aside, 사용자 「한계기준에 맞춰 직관적으로」) ══
   - 급냉: ⬇ 넣음 → ⏳ 급냉 중(지난 시간·기준 1~24시간·꺼낼 수 있는 시각) → ⬆ 꺼냄
   - 배합: 🥣 배합 시작 → ⏳ 사용 중(2시간 안에 다 쓰기·남은 시간) → ✅ 소진
   - 금속: 🟢 작업 전 점검 → ⏱ 제품 확인(2시간마다) → 🏁 작업 후 점검 (아래 통과량·검출량은 그대로)
   - 칸을 누르면 작은 확인 창: 지금 시각 + 평소 값(O/X는 정상 값) + 각 칸의 한계기준 → 「✓ 저장」 한 번. 다르면 「값·시각 고치기」(원래 입력 화면).
   - 저장은 원래 fldSave 그대로(이탈 경고·개선조치 포함), 저장 뒤 3칸 화면으로 돌아옴. 누를 곳만 갈색. 화면에 있는 동안 1분마다 시간 표시 새로 고침. */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '#fld .fov3 .tm{word-break:keep-all}#fld .fov3 .mid .tm{font-size:21px}#fld .fov3 .lim{font-size:13px;font-weight:700;opacity:.85;word-break:keep-all;line-height:1.3}#fld .fov3 .warnt{color:#C92A2A!important;font-weight:900}'
    + '.fq2 .vals.n4{grid-template-columns:repeat(2,1fr)}.fq2 .vals .l{display:block;font-size:12.5px;color:#6c757d;font-weight:700;margin-top:2px}.fq2 .ox b{font-size:20px}.fq2 .el{margin:0 0 10px;padding:10px 12px;border-radius:12px;background:#F8F9FA;border:2px solid #DEE2E6;font-size:18px;font-weight:800;color:#1F2328;text-align:center}.fq2 .el.bad{background:#FFF5F5;border-color:#FFC9C9;color:#C92A2A}'
    + '.fq2 .pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.fq2 .pick button{min-height:60px;border-radius:12px;border:2px solid #CED4DA;background:#F1F3F5;font-size:17px;font-weight:800;color:#1F2328;cursor:pointer}';
  document.head.appendChild(st);
  const mm = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : null; };
  const hm = n => String(Math.floor(n / 60) % 24).padStart(2, '0') + ':' + String(((n % 60) + 60) % 60).padStart(2, '0');
  const dur = n => n < 60 ? n + '분' : Math.floor(n / 60) + '시간' + (n % 60 ? ' ' + (n % 60) + '분' : '');
  const nowM = () => mm(fldHM());
  const lim = () => { try { return ccpLimAt(fldD()); } catch (e) { return {}; } };
  const rowsOf = (type, key) => { const g = fldLog(type); if (!g) return []; return (g.rows || []).filter(r => type === 'mix' ? r.name === key : r.code === key); };
  const card = (attr, ico, title, tm, vv, on, extra) => '<button type="button" class="ft big' + (on ? ' on' : '') + (extra || '') + '" ' + attr + '><i>' + ico + '</i><b>' + title + '</b><span class="tm' + (tm && tm.ph ? ' ph' : '') + '">' + esc(tm ? (tm.t || tm) : '') + '</span>' + (vv || '') + '</button>';
  const row3 = (a, b, c) => '<div class="fld-grid fov3">' + a + '<span class="ar">→</span>' + b + '<span class="ar">→</span>' + c + '</div>';
  /* ── 빠른 저장 창 (공통) ── */
  const qsheet = o => { const { type, mode, code, name, row, sec, title, back } = o; FLD.type = type;
    let fs = []; try { const sv = FLD.name; FLD.name = name; fs = fldFieldsFor(type, mode); FLD.name = sv; } catch (e) {}
    const now = fldHM(), V = {};
    fs.forEach(x => { if (x.k === 'time') { V[x.f] = now; return; } if (x.k === 'ox') { V[x.f] = x.good; return; }
      let v = row && row[x.f] !== '' && row[x.f] != null ? String(row[x.f]) : ''; if (!v) { try { const a = fldAvg7(type, x.f, name); if (a) v = String(a.v); } catch (e) {} } if (x.neg) v = v.replace(/^-/, ''); V[x.f] = v; });
    const nums = fs.filter(x => x.k === 'num'), oxs = fs.filter(x => x.k === 'ox');
    const box = x => '<div><small>' + esc(x.lb) + '</small><b>' + (x.neg && V[x.f] ? '−' : '') + esc(V[x.f] || '—') + '</b>' + esc(x.u || '') + (x.lim ? '<span class="l">기준 ' + esc(x.lim) + '</span>' : '') + '</div>';
    const oxb = x => '<div class="ox"><small>' + esc(x.lb) + '</small><b>' + esc(x.good === 'O' ? x.yes : x.no) + '</b><span class="l">정상</span></div>';
    const old = document.querySelector('.fwarn-bg'); if (old) old.remove(); const bg = document.createElement('div'); bg.className = 'fwarn-bg fq2';
    bg.innerHTML = '<div class="fwarn" role="dialog"><div class="fwarn-hd">' + esc(title) + '<small>' + esc(fldShort(name)) + '</small></div><div class="fwarn-bd">'
      + '<div class="tmbox"><span class="tmlab">' + esc((fs.find(x => x.k === 'time') || {}).lb || '시각') + '</span><span class="tmbig">' + esc(now) + '</span><span class="tmlab">지금</span></div>' + (o.info || '')
      + (nums.length ? '<div class="vals' + (nums.length === 2 || nums.length === 4 ? ' n4' : '') + '">' + nums.map(box).join('') + '</div>' : '')
      + (oxs.length ? '<div class="vals' + (oxs.length === 2 || oxs.length === 4 ? ' n4' : '') + '" style="margin-top:8px">' + oxs.map(oxb).join('') + '</div>' : '')
      + '<div class="src">' + (nums.length ? (row && nums.some(x => row[x.f]) ? '지금 기록된 값' : '평소 값(최근 7일 평균)') + ' — 실제와 다르면 「고치기」' : '모두 정상으로 저장합니다 — 하나라도 다르면 「고치기」') + '</div>'
      + '</div><div class="fwarn-bt"><button type="button" class="go">✓ 저장</button><div class="row2"><button type="button" class="alt fix" style="border-color:#ADB5BD;color:#1F2328">✎ 값·시각 고치기</button><button type="button" class="alt no" style="border-color:#ADB5BD;color:#495057">취소</button></div></div></div>';
    (document.getElementById('fld') || document.body).appendChild(bg); bg.addEventListener('click', ev => ev.stopPropagation());
    const open = () => { FLD.type = type; FLD.mode = mode; FLD.code = code; FLD.name = name; fldStartForm(row || null, sec || 'rows'); return FLD.step === 'form'; };
    bg.querySelector('.no').onclick = ev => { ev.stopPropagation(); bg.remove(); };
    bg.querySelector('.fix').onclick = ev => { ev.stopPropagation(); bg.remove(); open(); };
    bg.querySelector('.go').onclick = ev => { ev.stopPropagation(); bg.remove(); if (!open()) return; Object.keys(V).forEach(f => { if (FLD.fields.some(x => x.f === f) && V[f] !== '') FLD.vals[f] = V[f]; });
      window.__fqBack = back || ''; fldSave(); }; };
  /* 저장 뒤 돌아갈 화면 */
  const _rb = fieldRender;
  fieldRender = function () { if (window.__fqBack && FLD.step !== 'form' && FLD.step !== 'act') { const b = window.__fqBack; window.__fqBack = ''; if (FLD.step !== b) FLD.step = b; } else if (FLD.step !== 'form' && FLD.step !== 'act') window.__fqBack = ''; return _rb.apply(this, arguments); };
  /* ── 급냉 ── */
  const freezeHtml = () => { const rs = rowsOf('freeze', FLD.code), open = [...rs].reverse().find(r => r.t1 && !r.t2), done = rs.filter(r => r.t1 && r.t2), last = done[done.length - 1];
    const L = lim().frz || [60, 1440], n = nowM();
    let inC, midC, outC, target = '';
    if (open) { const el = n != null && mm(open.t1) != null ? (n - mm(open.t1) + 1440) % 1440 : null, ok = el != null && el >= L[0];
      inC = card('data-fq3="freeze:in"', '⬇', '넣음', open.t1, '<span class="vv">' + esc(open.v1 || '—') + '℃</span>', true);
      midC = card('data-fq3="none"', '⏳', '급냉 중', el != null ? dur(el) : '—', '<span class="lim' + (el != null && el > L[1] ? ' warnt' : '') + '">기준 ' + dur(L[0]) + '~' + dur(L[1]) + '<br>' + (ok ? '꺼내도 돼요' : hm(mm(open.t1) + L[0]) + '부터 꺼내기') + '</span>', false, ' mid');
      outC = card('data-fq3="freeze:out"', '⬆', '꺼냄', { t: '눌러서 저장', ph: 1 }, '<span class="vv">꺼낼 때 온도</span>', false); target = 'freeze:out'; }
    else { inC = card('data-fq3="freeze:in"', '⬇', '넣음', last ? { t: '새로 넣기', ph: 1 } : { t: '눌러서 저장', ph: 1 }, '<span class="vv">넣을 때 온도 · 기준 −30~−35℃</span>', false);
      midC = card('data-fq3="none"', '⏳', '급냉 중', done.length ? '오늘 ' + done.length + '회' : '—', '<span class="lim">기준 ' + dur(L[0]) + '~' + dur(L[1]) + '</span>', false, ' mid');
      outC = card('data-fq3="none"', '⬆', '꺼냄', last ? last.t2 : { t: '넣은 뒤에', ph: 1 }, last ? '<span class="vv">' + esc(last.v2 || '—') + '℃ · ' + esc(dur((mm(last.t2) - mm(last.t1) + 1440) % 1440)) + '</span>' : '', !!last); if (!done.length) target = 'freeze:in'; }
    return { html: row3(inC, midC, outC), target }; };
  /* ── 배합 ── */
  const mixHtml = () => { const rs = rowsOf('mix', FLD.code), open = [...rs].reverse().find(r => r.start && !r.end), done = rs.filter(r => r.start && r.end), last = done[done.length - 1], n = nowM();
    let a, b, c, target = '';
    if (open) { const el = n != null && mm(open.start) != null ? (n - mm(open.start) + 1440) % 1440 : null, left = el != null ? 120 - el : null;
      a = card('data-fq3="mix:start"', '🥣', '배합 시작', open.start, '<span class="vv">' + esc((open.kg || '—') + 'kg · 품온 ' + (open.temp || '—') + '℃') + '</span>', true);
      b = card('data-fq3="none"', '⏳', '사용 중', el != null ? dur(el) : '—', '<span class="lim' + (left != null && left < 0 ? ' warnt' : '') + '">' + (left != null && left >= 0 ? hm(mm(open.start) + 120) + '까지 다 쓰기<br>남은 ' + dur(left) : '⚠ 2시간 지남 — 바로 소진 기록') + '</span>', false, ' mid');
      c = card('data-fq3="mix:end"', '✅', '소진', { t: '눌러서 저장', ph: 1 }, '<span class="vv">다 쓴 시각</span>', false); target = 'mix:end'; }
    else { const Lx = lim(); a = card('data-fq3="mix:start"', '🥣', '배합 시작', { t: done.length ? '다음 배치' : '눌러서 저장', ph: 1 }, '<span class="lim">배합량 ' + esc(((Lx.mixKg || [10, 50]).join('~'))) + 'kg · 작업장 ' + esc(Lx.room || 24) + '℃ 이하</span>', false);
      b = card('data-fq3="none"', '⏳', '사용 중', done.length ? '오늘 ' + done.length + '배치' : '—', '<span class="lim">배합 후 2시간 안에 다 쓰기</span>', false, ' mid');
      c = card('data-fq3="none"', '✅', '소진', last ? last.end : { t: '배합 뒤에', ph: 1 }, last ? '<span class="vv">' + esc(dur((mm(last.end) - mm(last.start) + 1440) % 1440)) + ' 만에 다 씀</span>' : '', !!last); target = 'mix:start'; }
    return { html: row3(a, b, c), target }; };
  const _mode = fldModeHtml;
  fldModeHtml = function () { if (FLD.type !== 'freeze' && FLD.type !== 'mix') return _mode();
    try { const g = fldLog(FLD.type); if (!g) return _mode(); const T = FLD_T[FLD.type], R = FLD.type === 'freeze' ? freezeHtml() : mixHtml(); window.__fq3Target = R.target;
      return '<h1 class="fld-h">' + (FLD.type === 'freeze' ? fldPic(FLD.name, 1) : '') + T.ico + ' ' + esc(fldShort(FLD.name)) + '</h1>' + R.html + fldRecHtml(g, FLD.code); } catch (e) { return _mode(); } };
  /* ── 금속 (품목 고르기 없이 바로 3칸) ── */
  const _type = fldTypeHtml;
  fldTypeHtml = function () { let h = _type(); if (FLD.type !== 'metal') return h;
    try { const s = h.indexOf('<div class="fld-grid g3">'), p = h.indexOf('data-m="post"', s), e = p < 0 ? -1 : h.indexOf('</button></div>', p); if (s < 0 || e < 0) return h;
      const g = fldLog('metal'); const pre = (g.rows || []).find(r => r.kind === 'pre'), post = (g.rows || []).find(r => r.kind === 'post'), items = (g.rows || []).filter(r => r.kind === 'item' && r.time);
      const lastI = items[items.length - 1], n = nowM(), nextI = lastI && mm(lastI.time) != null ? mm(lastI.time) + 120 : null;
      const a = card('data-fq3="metal:pre"', '🟢', '작업 전 점검', pre && pre.time ? pre.time : { t: '눌러서 저장', ph: 1 }, '<span class="vv">테스트피스 Fe·STS</span>', !!(pre && pre.time));
      const b = card('data-fq3="metal:item"', '⏱', '제품 확인', items.length ? items.length + '회' : { t: '2시간마다', ph: 1 }, '<span class="lim' + (nextI != null && n != null && n > nextI && !(post && post.time) ? ' warnt' : '') + '">' + (nextI != null ? '다음 ' + hm(nextI) + '까지' : '품목 바뀔 때도') + '</span>', false, ' mid');
      const c = card('data-fq3="metal:post"', '🏁', '작업 후 점검', post && post.time ? post.time : { t: '작업 끝나고', ph: 1 }, '<span class="vv">테스트피스 Fe·STS</span>', !!(post && post.time));
      window.__fq3Target = !(pre && pre.time) ? 'metal:pre' : (post && post.time) ? '' : (nextI == null || (n != null && n >= nextI - 10)) ? 'metal:item' : '';
      return h.slice(0, s) + row3(a, b, c) + h.slice(e + '</button></div>'.length); } catch (er) { return h; } };
  /* 누를 곳 */
  const _r = fieldRender;
  fieldRender = function () { window.__fq3Target = ''; _r.apply(this, arguments);
    try { const body = document.querySelector('#fld .fld-body'); if (!body || !body.querySelector('[data-fq3]')) return;
      body.querySelectorAll('.fnow').forEach(b => { b.classList.remove('fnow'); const p = b.querySelector('.fpress'); if (p) p.remove(); });
      const t = window.__fq3Target && body.querySelector('[data-fq3="' + window.__fq3Target + '"]'); if (t) { t.classList.add('fnow'); t.insertAdjacentHTML('beforeend', '<span class="fpress">👆 여기를 누르세요</span>'); } try { fldFit(); } catch (e) {} } catch (e) {} };
  /* 칸 누르기 */
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('#fld [data-fq3]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); const [type, m] = b.dataset.fq3.split(':'); if (!m) return;
    if (type === 'freeze') { const tg = fldTarget('freeze', FLD.code, m); if (!tg || tg.none) return; let info = '';
      if (m === 'out' && tg.row && tg.row.t1) { const L = lim().frz || [60, 1440], el = (nowM() - mm(tg.row.t1) + 1440) % 1440, bad = el < L[0] || el > L[1]; info = '<div class="el' + (bad ? ' bad' : '') + '">넣은 시각 ' + esc(tg.row.t1) + ' → 급냉 ' + dur(el) + (bad ? ' ⚠ 기준 ' + dur(L[0]) + '~' + dur(L[1]) : ' ✓') + '</div>'; }
      return qsheet({ type, mode: m, code: FLD.code, name: FLD.name, row: tg.row, title: m === 'in' ? '⬇ 급냉 넣음' : '⬆ 급냉 꺼냄', info, back: 'mode' }); }
    if (type === 'mix') { if (m === 'start') { const tg = fldTarget('mix', FLD.code, 'start'); return qsheet({ type, mode: 'start', code: FLD.code, name: FLD.name, row: tg && tg.row, title: '🥣 배합 시작', back: 'mode' }); }
      const rs = rowsOf('mix', FLD.code), r = [...rs].reverse().find(x => x.start && !x.end); if (!r) return; const el = (nowM() - mm(r.start) + 1440) % 1440;
      return qsheet({ type, mode: 'end', code: FLD.code, name: FLD.name, row: r, title: '✅ 소진(다 씀)', info: '<div class="el' + (el > 120 ? ' bad' : '') + '">' + esc(r.start) + ' 배합 → ' + dur(el) + (el > 120 ? ' ⚠ 기준 2시간 이내' : ' ✓ 2시간 이내') + '</div>', back: 'mode' }); }
    if (type === 'metal') { const g = fldLog('metal'); if (!g) return;
      if (m === 'pre' || m === 'post') { const tg = fldTarget('metal', m, m); return qsheet({ type, mode: m, code: m, name: m === 'pre' ? '작업 전' : '작업 후', row: tg && tg.row, title: m === 'pre' ? '🟢 작업 전 점검' : '🏁 작업 후 점검', back: 'type' }); }
      const ps = fldProds('metal'); const go = p => { const tg = fldTarget('metal', p.code, 'item'); qsheet({ type, mode: 'item', code: p.code, name: p.name, row: tg && tg.row, title: '⏱ 제품 확인', back: 'type' }); };
      if (ps.length === 1) return go(ps[0]); if (!ps.length) { toast('오늘 금속검출 품목이 없습니다 — 먼저 작업 시작'); return; }
      const old = document.querySelector('.fwarn-bg'); if (old) old.remove(); const bg = document.createElement('div'); bg.className = 'fwarn-bg fq2';
      bg.innerHTML = '<div class="fwarn"><div class="fwarn-hd">⏱ 어느 제품을 확인하나요?</div><div class="fwarn-bd"><div class="pick">' + ps.map((p, i) => '<button type="button" data-i="' + i + '">' + esc(fldShort(p.name)) + '</button>').join('') + '</div></div><div class="fwarn-bt"><button type="button" class="alt no" style="border-color:#ADB5BD;color:#495057">취소</button></div></div>';
      (document.getElementById('fld') || document.body).appendChild(bg); bg.addEventListener('click', e2 => { e2.stopPropagation(); const k = e2.target.closest('[data-i]'); if (k) { bg.remove(); go(ps[+k.dataset.i]); } else if (e2.target.closest('.no')) bg.remove(); }); } }, true);
  /* 1분마다 시간 표시 새로 고침 (창이 떠 있거나 입력 중이면 건너뜀) */
  setInterval(() => { try { if (FLD.open && (FLD.step === 'mode' || FLD.step === 'type') && !document.querySelector('.fwarn-bg') && document.querySelector('#fld [data-fq3], #fld [data-fq2]')) fieldRender(); } catch (e) {} }, 60000);
})();

/* ══ 누를 곳 색: 갈색 → 신뢰감 있는 진한 파랑 + 보색(주황) 테두리 (2026-10-22 Aside, 사용자 「갈색은 안 예뻐, 고퀄리티 색으로, 보색 테두리」) ══
   - 채우기: 진한 로열 블루 그라데이션(#2F6BFF → #1D4ED8), 흰 글씨. 테두리·빛나는 링: 주황(#F59E0B, 파랑의 보색).
   - 확인 창의 「✓ 저장」「✎ 값 다시 고치기」 같은 주 버튼도 같은 색. 나머지는 그대로 연회색. */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '#fld .fsf-c.now,#fld .fnow{--k:#1D4ED8!important;background:linear-gradient(180deg,#3B76FF 0%,#1D4ED8 100%)!important;border:3px solid #F59E0B!important;'
    + 'box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 6px 0 #1E3A8A,0 14px 28px rgba(29,78,216,.40)!important}'
    + '#fld .fsf-c.now::after,#fld .fnow::after{border-color:#F59E0B!important;border-width:3px!important}'
    + '#fld .fsf-c.now .tag{background:#F59E0B!important;color:#fff!important}#fld .fsf-c.now .n{background:#fff!important;color:#1D4ED8!important}#fld .fsf-c.now .n *{color:#1D4ED8!important}'
    + '#fld .fsf-c.now .fpress,#fld .fnow .fpress,#fld .fsf-c.now .fpress *,#fld .fnow .fpress *{color:#1D4ED8!important}#fld .fpress{border:2px solid #F59E0B}'
    + '.fwarn-bt .go{background:linear-gradient(180deg,#3B76FF,#1D4ED8)!important;border:3px solid #F59E0B!important;color:#fff!important;box-shadow:0 5px 0 #1E3A8A!important}.fwarn-bt .go:active{box-shadow:0 2px 0 #1E3A8A!important}'
    + '#fld .fov3 .ft.fnow .tm,#fld .fov3 .ft.fnow .vv,#fld .fov3 .ft.fnow .lim{color:#fff!important}';
  document.head.appendChild(st);
})();

/* ══ 남은 갈색 정리 (2026-10-22 Aside): 찾기 목록 테두리·머리, 단계 번호 배지, 안내 상자, 설정 버튼 등 → 회색/파랑 계열로 (누를 곳 파랑+주황 원칙과 맞춤) ══ */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '#fld .fsg{border-color:#1D4ED8!important}#fld .fsg-hd{background:#EEF3FF!important;color:#1F2328!important;border-bottom-color:#D0DBFF!important}'
    + '#fld .fsg-r:active,#fld .fsg-r.k{background:#EEF3FF!important}#fld .fsg-gp{background:#F8F9FA!important}'
    + '#fld .fsn-b{background:#495057!important}#fld .fsf-hint{background:#F8F9FA!important;border-color:#CED4DA!important;color:#343A40!important}#fld .fsf-pk .lb{color:#343A40!important}'
    + '#fld .fset-btn{border-color:#CED4DA!important;color:#495057!important}#fld .fqchip button small,#fld .fqv button small{color:#6C757D!important}'
    + '#fld .fsnav button.nx.fnow{border-color:#F59E0B!important}';
  document.head.appendChild(st);
})();

/* ══ 누를 곳 채우기: 노랑 + 보색(파랑) 테두리 (2026-10-22 Aside, 사용자 「배경 채우기 노랑색으로」) ══
   - 채우기: 밝은 노랑 그라데이션 #FFE45C → #FFC915, 글씨는 진한 남색(#1E2A4A, 노랑 위에서 잘 읽힘).
   - 테두리·빛나는 링: 파랑 #1D4ED8(노랑의 보색 쪽). 「지금 할 차례」·번호는 남색 바탕 흰 글씨, 「여기를 누르세요」는 흰 바탕 남색 글씨.
   - 확인 창 주 버튼(✓ 저장 등)도 같은 노랑. */
(function () {
  if (!window.FIELD_APP) return;
  const Y1 = '#FFE45C', Y2 = '#FFC915', NV = '#1E2A4A', BL = '#1D4ED8';
  const st = document.createElement('style');
  st.textContent = 'html body #fld .fsf-c.now,html body #fld .fnow{--k:' + NV + '!important;background:linear-gradient(180deg,' + Y1 + ' 0%,' + Y2 + ' 100%)!important;border:3px solid ' + BL + '!important;color:' + NV + '!important;'
    + 'box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 6px 0 #C79A00,0 14px 28px rgba(199,154,0,.35)!important}'
    + 'html body #fld .fsf-c.now *,html body #fld .fnow *{color:' + NV + '!important}'
    + 'html body #fld .fsf-c.now::after,html body #fld .fnow::after{border-color:' + BL + '!important}'
    + 'html body #fld .fsf-c.now .tag{background:' + NV + '!important;color:#fff!important}html body #fld .fsf-c.now .n{background:' + NV + '!important;color:#fff!important}html body #fld .fsf-c.now .n *{color:#fff!important}'
    + 'html body #fld .fsf-c.now .fpress,html body #fld .fnow .fpress{background:#fff!important;border:2px solid ' + BL + '!important;color:' + NV + '!important}html body #fld .fsf-c.now .fpress *,html body #fld .fnow .fpress *{color:' + NV + '!important}'
    + 'html body #fld .fov3 .ft.fnow .tm,html body #fld .fov3 .ft.fnow .vv,html body #fld .fov3 .ft.fnow .lim{color:' + NV + '!important}'
    + 'html body .fwarn-bt .go{background:linear-gradient(180deg,' + Y1 + ',' + Y2 + ')!important;border:3px solid ' + BL + '!important;color:' + NV + '!important;box-shadow:0 5px 0 #C79A00!important}html body .fwarn-bt .go:active{box-shadow:0 2px 0 #C79A00!important}';
  document.head.appendChild(st);
})();

/* ══ 전체 바탕 남색 (2026-10-22 Aside, 사용자 「전체 바탕 배경색은 남색」) ══
   - 바탕 #16233F(남색), 위 제목줄 #0E1830(더 진한 남색). 카드·칸은 지금처럼 연회색, 누를 곳은 노랑+파랑 테두리 → 남색 위에서 노랑이 가장 먼저 보임.
   - 바탕 위에 바로 놓인 글자(화면 제목·설명·화살표·설정 버튼)는 흰색·연한 회청색으로 바꿔 읽히게. 아래 고정 저장줄도 남색. */
(function () {
  if (!window.FIELD_APP) return;
  const BG = '#16233F', TOP = '#0E1830';
  const st = document.createElement('style');
  st.textContent = 'html body #fld{background:' + BG + '!important}html body #fld .fld-top{background:' + TOP + '!important;border-bottom:1px solid #26365C}'
    + 'html body #fld .fld-body .fld-h,html body #fld .fld-body .fld-h2{color:#FFFFFF!important}html body #fld .fld-body .fld-h *{color:#FFFFFF}html body #fld .fld-body .fld-h .ed{color:#8F5F00}'
    + 'html body #fld .fld-body > .fld-p,html body #fld .fld-body .fld-p{color:#C9D3E6!important}'
    + 'html body #fld .fsf-ar,html body #fld .fov3 .ar{color:#7E8DB0!important}'
    + 'html body #fld .fset-btn{color:#C9D3E6!important;border-color:#4A5A80!important}html body #fld .fld-auto{color:#C9D3E6!important}'
    + 'html body #fld .fsn-b{background:#F1F3F5!important;color:' + BG + '!important}'
    + 'html body #fld .fld-save{background:rgba(14,24,48,.96)!important;border-top-color:#26365C!important}'
    + 'html body #fld .fsf-pk .lb{color:#C9D3E6!important}';
  document.head.appendChild(st);
})();

/* ══ 한계기준 이탈 말풍선 (2026-10-22 Aside, 사용자 「이탈 시 말풍선 설명 화살표, 쉽게 이해되도록」) ══
   - 입력 화면에서 기준 밖 칸 바로 아래에 빨간 말풍선(위로 향한 화살표)이 붙음: 「⚠ 기준보다 17℃ 높아요」 + 「기준 152~158℃ · 판넬을 다시 보세요」.
   - 기준 글(155±3℃, 85~99℃, -30 ~ -35℃, 10~50kg, 24℃ 이하, 10℃±5 ~ 20℃±5, 0 이어야 정상)을 숫자 범위로 바꿔 높다/낮다·얼마나를 계산. 시간 기준(급냉 시간·소진 2시간)과 O/X는 원래 판정 문구를 쉬운 말로.
   - 같은 설명을 이탈 경고창(값 다시 고치기)에도 한 줄 넣음. 칸 아래 작은 「⚠ 기준을 벗어났습니다」 글은 말풍선으로 대신함. */
(function () {
  if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '#fld .fbub{position:relative;display:block;margin:12px 0 2px;padding:10px 12px;border-radius:12px;background:#C92A2A;color:#fff!important;text-align:left;box-shadow:0 4px 12px rgba(201,42,42,.35);animation:fbubin .2s ease-out}'
    + '#fld .fbub::before{content:"";position:absolute;top:-10px;left:24px;border:10px solid transparent;border-top:0;border-bottom-color:#C92A2A}'
    + '#fld .fbub b{display:block;font-size:19px;font-weight:900;color:#fff!important;line-height:1.3}#fld .fbub span{display:block;font-size:15px;font-weight:700;color:#FFE3E3!important;margin-top:2px;line-height:1.35;word-break:keep-all}'
    + '@keyframes fbubin{from{transform:translateY(-4px);opacity:0}to{transform:none;opacity:1}}'
    + '#fld .fld-f.has-bub > small.bad{display:none!important}'
    + '.fwarn-row .why{flex-basis:100%;font-size:17px;font-weight:900;color:#C92A2A}';
  document.head.appendChild(st);
  const num = s => Number(String(s).replace(/[^\d.\-]/g, ''));
  /* 기준 글 → [아래, 위] */
  const range = (lim, neg) => { const s = String(lim || '').replace(/\s/g, ''); if (!s) return null; let m;
    if (/~/.test(s) && /±/.test(s)) { const [l, r] = s.split('~'); const a = /(-?\d+(?:\.\d+)?)[^\d±-]*±(\d+(?:\.\d+)?)/.exec(l), b = /(-?\d+(?:\.\d+)?)[^\d±-]*±(\d+(?:\.\d+)?)/.exec(r); if (a && b) return [Math.min(+a[1] - +a[2], +b[1] - +b[2]), Math.max(+a[1] + +a[2], +b[1] + +b[2])]; }
    if ((m = /(-?\d+(?:\.\d+)?)±(\d+(?:\.\d+)?)/.exec(s))) return [+m[1] - +m[2], +m[1] + +m[2]];
    if ((m = /(-?\d+(?:\.\d+)?)[^\d~-]*~(-?\d+(?:\.\d+)?)/.exec(s))) { const a = +m[1], b = +m[2]; return [Math.min(a, b), Math.max(a, b)]; }
    if ((m = /(-?\d+(?:\.\d+)?).*이하/.exec(s))) return [-Infinity, +m[1]];
    if ((m = /(-?\d+(?:\.\d+)?).*이상/.exec(s))) return [+m[1], Infinity];
    if (/^0이어야/.test(s)) return [0, 0]; return null; };
  const r1 = n => Math.round(n * 10) / 10;
  window.fldBubText = function (x, bad) { const v = FLD.vals[x.f]; if (x.k === 'ox') return { t: '⚠ 「' + (v === 'O' ? x.yes : x.no) + '」은(는) 비정상이에요', s: '정상은 「' + (x.good === 'O' ? x.yes : x.no) + '」 · 기계를 다시 확인하세요' };
    const u = x.u || '', val = (x.neg ? -1 : 1) * num(v), R = x.k === 'num' ? range(x.lim, x.neg) : null;
    if (R && isFinite(val)) { const lo = R[0], hi = R[1], rt = (isFinite(lo) ? r1(lo) : '') + (isFinite(lo) && isFinite(hi) ? '~' : '') + (isFinite(hi) ? r1(hi) : '') + u + (!isFinite(lo) ? ' 이하' : !isFinite(hi) ? ' 이상' : '');
      const what = /온도|품온/.test(x.lb) ? (/판넬/.test(x.lb) ? '판넬 온도를 다시 보세요' : '온도계로 다시 재 보세요') : /시간/.test(x.lb) ? '시간을 다시 확인하세요' : /배합량/.test(x.lb) ? '저울 무게를 다시 보세요' : /검출/.test(x.lb) ? '검출된 제품을 따로 두세요' : '값을 다시 확인하세요';
      if (x.neg) { if (val > hi) return { t: '⚠ 기준보다 ' + r1(val - hi) + u + ' 덜 차가워요', s: '기준 ' + rt + ' · ' + what }; if (val < lo) return { t: '⚠ 기준보다 ' + r1(lo - val) + u + ' 더 차가워요', s: '기준 ' + rt + ' · ' + what }; }
      const W = /kg|개/.test(u) ? ['많아요', '적어요'] : u === '분' ? ['길어요', '짧아요'] : ['높아요', '낮아요'];
      if (val > hi) return { t: '⚠ 기준보다 ' + r1(val - hi) + u + ' ' + W[0], s: '기준 ' + rt + ' · ' + what }; if (val < lo) return { t: '⚠ 기준보다 ' + r1(lo - val) + u + ' ' + W[1], s: '기준 ' + rt + ' · ' + what }; }
    const msg = (bad || []).join(', '); return { t: '⚠ 기준을 벗어났어요', s: (msg || ('기준 ' + (x.lim || ''))) + (x.k === 'time' ? ' · 시각을 다시 확인하세요' : '') }; };
  const _r = fieldRender;
  fieldRender = function () { _r.apply(this, arguments);
    try { if (FLD.step !== 'form' || !FLD.fields) return; const els = document.querySelectorAll('#fld .fld-fields > .fld-f');
      FLD.fields.forEach((x, i) => { const el = els[i]; if (!el || FLD.vals[x.f] === '' || FLD.vals[x.f] == null) return; let b = null; try { b = fldFieldBad(x); } catch (e) {} if (!b || !b.length) return;
        const T = fldBubText(x, b); el.classList.add('has-bub'); el.insertAdjacentHTML('beforeend', '<span class="fbub"><b>' + esc(T.t) + '</b><span>' + esc(T.s) + '</span></span>'); });
      try { fldFit(); } catch (e) {} } catch (e) {} };
  /* 이탈 경고창에도 같은 한 줄 */
  const mo = new MutationObserver(() => { document.querySelectorAll('.fwarn-bg:not(.fq2):not(.f2h) .fwarn-row:not([data-why])').forEach(row => { row.setAttribute('data-why', '1'); try { const lb = (row.querySelector('b') || {}).textContent; const x = (FLD.fields || []).find(f => f.lb === lb); if (!x) return; const T = fldBubText(x, fldFieldBad(x)); row.insertAdjacentHTML('beforeend', '<span class="why">' + esc(T.t.replace(/^⚠ /, '')) + '</span>'); } catch (e) {} }); });
  mo.observe(document.body, { childList: true, subtree: true });
})();

/* ══ 값 고치기·통과량 화면 아래쪽 가림 방지 (2026-10-22 Aside, 10/21 일지 시뮬레이션에서 발견) ══
   아래 고정 저장 줄(.form-save, 약 106px)이 마지막 칸·숫자판 아랫줄을 가렸음 → 그 높이만큼 아래 여백을 두면 fldFit이 여백까지 재서 한 화면에 맞춤. */
(function () { if (!window.FIELD_APP) return; const st = document.createElement('style'); st.textContent = '#fld:has(.form-save){padding-bottom:118px!important;box-sizing:border-box}'; document.head.appendChild(st); })();

/* ══ 생산실 앱에서는 「오늘 발주 알림」 자동 창을 띄우지 않음 (2026-10-22 Aside, 사용자 「작업 시작을 누르면 왜 발주창이 뜨나」) ══
   통합재고관리(index.html)를 그대로 불러오므로 v247~ 발주 알림(poAuto: 열고 6초 뒤 + 5분마다, 기기당 하루 한 번)이 생산실 화면에도 떴음.
   이 페이지 안에서만 po_alert_auto 값을 'off'로 읽히게 함 — 저장된 설정은 안 바꿔서 같은 기기의 PC 통합재고관리 알림은 그대로. */
(function () { if (!window.FIELD_APP) return; try { const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (k === 'po_alert_auto' && this === window.localStorage) return 'off'; return g.apply(this, arguments); }; } catch (e) {} })();

/* ══ 작업 시작 품목 빼기 (2026-10-22 Aside, 사용자 「제품 선택 후 삭제 버튼이 없어」) ══
   「작업 시작」 화면 위에 오늘 시작한 품목마다 「✕ 빼기」 버튼. 누르면 확인 창 → 작업 시작 기록(pday ws:)을 지우고(다른 기기에도 취소 전달),
   그 품목의 CCP 줄은 「지운 줄(del)」로 표시해 모든 기기에서 같이 빠지게 함(이미 적은 기록이 있으면 몇 줄인지 먼저 물어봄).
   이카운트로 이미 보낸 생산이 있는 품목은 여기서 못 뺌(PC 생산일지에서 전송 취소). 같은 날 다시 고르면 새 줄로 다시 생김(ccpAddItem did()가 지운 id는 새 id로). */
(function () { if (!window.FIELD_APP) return;
  const st = document.createElement('style');
  st.textContent = '#fld .fwsdel{margin:0 0 14px;padding:12px 14px;border-radius:14px;background:#fff;border:2px solid #E5E7EB}#fld .fwsdel .t{font-size:16px;font-weight:800;color:#1E2A4A;margin-bottom:8px;word-break:keep-all}#fld .fwsdel .row{display:flex;gap:8px;flex-wrap:wrap}#fld .fwsdel button{min-height:54px;padding:6px 16px;font-size:17px;font-weight:800;border-radius:12px;border:2px solid #C62828;background:#fff;color:#C62828;cursor:pointer}';
  document.head.appendChild(st);
  const F = ['time', 'temp', 'min', 'core', 't1', 'v1', 't2', 'v2', 'start', 'kg', 'room', 'end', 'fe', 'sus', 'p', 'fep', 'susp', 'passed', 'det'];
  const hasVal = r => F.some(f => r[f] !== '' && r[f] != null);
  const started = () => { const D = fldD(), P = prodS(), out = []; Object.keys(P.pday || {}).forEach(k => { const m = /^ws:(\d{4}-\d{2}-\d{2}):(.+)$/.exec(k); if (!m || m[1] !== D) return; const code = m[2]; const sent = (P.log || []).some(en => en.date === D && en.status !== 'cancel' && (en.lines || []).some(l => l.code === code)); if (!sent && !out.includes(code)) out.push(code); }); return out; };
  const _ws = fldWsHtml;
  fldWsHtml = function () { let h = _ws.apply(this, arguments); try { const cs = started(); if (cs.length) { const bar = '<div class="fwsdel"><div class="t">오늘 시작한 품목 — 잘못 골랐으면 「✕ 빼기」</div><div class="row">' + cs.map(c => { const it = prodItem(c); return '<button type="button" data-fwsdel="' + esc(c) + '">✕ ' + esc(fldShort((it && it.name) || c)) + ' 빼기</button>'; }).join('') + '</div></div>'; const i = h.indexOf('</p>'); h = i >= 0 ? h.slice(0, i + 4) + bar + h.slice(i + 4) : bar + h; } } catch (e) {} return h; };
  const _home = fldHomeHtml;
  fldHomeHtml = function () { const h = _home.apply(this, arguments); return started().length ? h.replace('눌러서 품목 추가', '눌러서 품목 추가·빼기') : h; };
  /* 같은 날 다시 고를 때: 일지 items에만 남은 품목(줄 없음)은 지워야 새 줄이 생김 */
  const _wsgo = fldWs;
  fldWs = function (code) { try { const D = fldD(), L = ccpS().logs; Object.keys(L).forEach(k => { const g = L[k]; if (!g || g.date !== D || !(g.items || []).includes(code)) return; if (!(g.rows || []).some(r => r.code === code) && !(g.pass || []).some(r => r.code === code)) g.items = g.items.filter(c => c !== code); }); } catch (e) {} const ret = _wsgo.apply(this, arguments); try { const D = fldD(), L = ccpS().logs; Object.keys(L).forEach(k => { const g = L[k]; if (!g || g.date !== D || !g.skip || g.by === 'K-HACCP 기록') return; if ((g.rows || []).some(r => r.code === code)) { g.skip = false; ccpTouch(g); } }); save(); fieldRender(); } catch (e) {} return ret; };
  function wsDel(code) { const D = fldD(), P = prodS(), L = ccpS().logs, it = prodItem(code), nm = fldShort((it && it.name) || code);
    let nVal = 0; Object.keys(L).forEach(k => { const g = L[k]; if (!g || g.date !== D) return; ['rows', 'pass'].forEach(sec => (g[sec] || []).forEach(r => { if (r.code === code && hasVal(r) && !(sec === 'pass' && !r.pe)) nVal++; })); });
    if (!confirm(nVal ? nm + ' — 이미 적은 CCP 기록이 ' + nVal + '줄 있어요.\n품목과 그 기록을 모두 지울까요?' : nm + ' 을(를) 오늘 품목에서 뺄까요?')) return;
    const key = 'ws:' + D + ':' + code, ts = new Date().toISOString();
    delete P.pday[key];
    try { if (shareOn()) nbQueue({ ts, week: '', code: key, name: '작업 시작 취소', kind: 'pday', note: '', del: true }); } catch (e) {}
    Object.keys(L).forEach(k => { const g = L[k]; if (!g || g.date !== D) return; let ch = false;
      ['rows', 'pass'].forEach(sec => { g[sec] = (g[sec] || []).filter(r => { if (r.code !== code) return true; if (r.id) g.del = (g.del || []).concat(r.id).slice(-300); ch = true; return false; }); });
      if ((g.items || []).includes(code)) { g.items = g.items.filter(c => c !== code); ch = true; }
      if (ch) { if (g.apAt) { g.apAt = ''; g.apBy = ''; } try { ccpAutoDev(g); } catch (e) {} ccpTouch(g); } });
    try { ccpSyncDate(D, true); } catch (e) {}
    save(); toast('✕ ' + nm + ' — 오늘 품목에서 뺐습니다', 3000); fieldRender(); }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-fwsdel]'); if (!b) return; e.preventDefault(); e.stopPropagation(); wsDel(b.dataset.fwsdel); }, true);
})();
