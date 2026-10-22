
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
