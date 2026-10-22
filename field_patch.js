
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

/* ══ 작업 시작 「🔍 품목 찾기」를 누르면 등록 품목이 바로 아래에 목록으로 뜸 (2026-10-22 Aside, 태블릿 SM-X115N 요청) ══
   - 누르면 등록된 품목 전체(오늘 시작한 품목·자주 만드는 품목 먼저)가 입력칸 바로 아래에 펼쳐지고, 눌러서 고르면 「작업 시작」 카드를 누른 것과 같다(fldWs).
   - 글자를 칠 때마다 화면 전체를 다시 그리지 않고 목록만 거른다 → 갤럭시탭 한글 자판에서 글자가 끊기지 않음. 초성(ㅁㅂㄹ → 몽블랑)으로도 찾는다.
   - 목록 높이는 자판에 가리지 않게 화면에 보이는 높이(visualViewport)에 맞춘다. 원래 함수는 고치지 않는다. */
(function () {
  if (!window.FIELD_APP) return;
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const cho = s => Array.from(String(s || '')).map(ch => { const c = ch.charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 ? CHO[Math.floor((c - 0xAC00) / 588)] : ch; }).join('');
  const norm = s => String(s || '').toLowerCase().replace(/\s+/g, '');
  const st = document.createElement('style');
  st.textContent = '#fld .fsg{margin:-6px 0 14px;border:2px solid #7A4A23;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.18);overflow:hidden;-webkit-user-select:none;user-select:none}'
    + '#fld .fsg-hd{display:flex;align-items:center;gap:8px;padding:8px 10px 8px 14px;background:#FBF3EA;border-bottom:1px solid #E9D9C6;font-size:16px;font-weight:700;color:#5A3A1E}'
    + '#fld .fsg-hd span{flex:1;word-break:keep-all}#fld .fsg-hd button{min-height:44px;padding:4px 16px;font-size:16px;font-weight:700;border-radius:10px;border:1px solid #cfc6b6;background:#fff;color:#3d342a;cursor:pointer}'
    + '#fld .fsg-ls{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;max-height:420px}'
    + '#fld .fsg-r{display:flex;align-items:center;gap:12px;width:100%;min-height:62px;padding:8px 14px;border:0;border-bottom:1px solid #EEE7DD;background:#fff;text-align:left;cursor:pointer;color:#1d2a30}'
    + '#fld .fsg-r:active,#fld .fsg-r.k{background:#FFF4E6}#fld .fsg-r img{width:46px;height:46px;border-radius:10px;object-fit:cover;flex:none;background:#F1F3F5}'
    + '#fld .fsg-r .fsg-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}#fld .fsg-r b{font-size:19px;line-height:1.25;word-break:keep-all;overflow-wrap:anywhere}'
    + '#fld .fsg-r small{font-size:14.5px;color:#607D8B}#fld .fsg-r small.on{color:#2B8A3E;font-weight:700}#fld .fsg-r .go{flex:none;font-size:15px;font-weight:800;color:#7A4A23}'
    + '#fld .fsg-no{padding:18px 14px;font-size:17px;color:#6b6257;word-break:keep-all}';
  document.head.appendChild(st);
  let open = false, shownQ = null;
  const items = () => { const D = fldD(), by = ccpProdByDate()[D] || {}; let st2 = {}; try { st2 = prodStats(); } catch (e) {}
    const its = prodOnItems().filter(it => { const o = ccpOf(it); return o.oven || o.freeze || o.metal || o.mix; });
    its.sort((a, b) => (by[b.code] ? 1 : 0) - (by[a.code] ? 1 : 0) || (/비상품/.test(a.name) ? 1 : 0) - (/비상품/.test(b.name) ? 1 : 0) || ((st2[b.code] || {}).n || 0) - ((st2[a.code] || {}).n || 0) || fldShort(a.name).localeCompare(fldShort(b.name), 'ko'));
    return { its, by }; };
  const match = (it, q) => { if (!q) return true; const n = norm(it.name + ' ' + it.code); if (n.includes(q)) return true;
    return /^[ㄱ-ㅎ]+$/.test(q) && norm(cho(it.name)).includes(q); };
  const inp = () => document.querySelector('#fld [data-f="q"]');
  const fit = () => { const el = inp(), ls = document.querySelector('#fld .fsg-ls'); if (!el || !ls) return; const vv = window.visualViewport;
    const bottom = vv ? vv.height + vv.offsetTop : window.innerHeight; const top = ls.getBoundingClientRect().top;
    ls.style.maxHeight = Math.max(200, Math.floor(bottom - top - 12)) + 'px'; };
  const draw = () => { const el = inp(); if (!el) return; let box = document.querySelector('#fld .fsg');
    if (!box) { box = document.createElement('div'); box.className = 'fsg'; el.insertAdjacentElement('afterend', box);
      box.addEventListener('mousedown', e => { if (!e.target.closest('button[data-x]')) e.preventDefault(); });
      box.addEventListener('click', e => { const x = e.target.closest('button[data-x]'); if (x) { close(true); return; } const r = e.target.closest('.fsg-r'); if (r) { pick(r.dataset.c); } }); }
    const q = norm(el.value), { its, by } = items(), xs = its.filter(it => match(it, q)); shownQ = el.value;
    const row = (it, i) => { const o = ccpOf(it), on = !!by[it.code], u = fldPicUrl(it.name);
      return '<button type="button" class="fsg-r' + (i === 0 && q ? ' k' : '') + '" data-c="' + esc(it.code) + '">' + (u ? '<img src="' + u + '" alt="" loading="lazy" onerror="this.remove()">' : '')
        + '<span class="fsg-t"><b>' + esc(fldShort(it.name)) + '</b><small' + (on ? ' class="on"' : '') + '>' + ['oven', 'freeze', 'metal', 'mix'].filter(t => o[t]).map(t => FLD_T[t].ico + ' ' + FLD_T[t].nm).join(' · ') + (on ? ' · ✓ 오늘 시작함' : '') + '</small></span><span class="go">' + (on ? '열기 ›' : '고르기 ›') + '</span></button>'; };
    box.innerHTML = '<div class="fsg-hd"><span>' + (q ? '「' + esc(el.value.trim()) + '」 찾은 품목 ' + xs.length + '개' : '등록된 품목 ' + xs.length + '개 · 눌러서 고르세요') + '</span><button type="button" data-x="1">✕ 닫기</button></div>'
      + '<div class="fsg-ls">' + (xs.length ? xs.map(row).join('') : '<div class="fsg-no">찾는 품목이 없습니다. 글자를 줄이거나 초성(예: ㅁㅂㄹ)으로 찾아보세요.</div>') + '</div>';
    fit(); };
  const show = () => { if (FLD.step !== 'ws') return; const el = inp(); if (!el) return; open = true; draw();
    const sc = document.getElementById('fld'), hd = document.querySelector('#fld .fld-top');
    try { const dy = el.getBoundingClientRect().top - ((hd ? hd.offsetHeight : 0) + 8); if (sc && Math.abs(dy) > 4) sc.scrollTop += dy; } catch (e) {}
    setTimeout(fit, 350); setTimeout(fit, 800); };
  const close = (byBtn) => { if (!open) return; open = false; const b = document.querySelector('#fld .fsg'); if (b) b.remove(); const el = inp();
    if (byBtn && el) el.blur();
    setTimeout(() => { if (FLD.step === 'ws' && !open && document.activeElement !== inp()) fieldRender(); }, 300); };
  const pick = code => { open = false; FLD.q = ''; try { document.activeElement && document.activeElement.blur(); } catch (e) {} fldWs(code); };
  document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('#fld [data-f="q"]') && FLD.step === 'ws') show(); }, true);
  document.addEventListener('click', e => { if (e.target.matches && e.target.matches('#fld [data-f="q"]') && FLD.step === 'ws' && !open) show(); }, true);
  document.addEventListener('input', e => { const el = e.target; if (!(el.matches && el.matches('#fld [data-f="q"]')) || FLD.step !== 'ws') return;
    e.stopPropagation(); FLD.q = el.value; if (!open) show(); else draw(); }, true);   /* 원래 입력 처리(화면 전체 다시 그리기)는 작업 시작 화면에서만 건너뜀 */
  document.addEventListener('keydown', e => { const el = e.target; if (!(el.matches && el.matches('#fld [data-f="q"]')) || FLD.step !== 'ws') return;
    if (e.key === 'Escape') { close(true); } if (e.key === 'Enter' && !e.isComposing) { const f = document.querySelector('#fld .fsg-r'); if (f) { e.preventDefault(); pick(f.dataset.c); } } }, true);
  document.addEventListener('pointerdown', e => { if (!open) return; if (e.target.closest && (e.target.closest('#fld .fsg') || e.target.closest('#fld [data-f="q"]'))) return; close(false); }, true);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => { if (open) fit(); });
})();
