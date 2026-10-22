
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
