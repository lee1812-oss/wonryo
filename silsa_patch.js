
/* ══ 금요일 실사 전용 앱(silsa.html) — 「금요일 원료 실사」 화면만 보이게 (2026-10-23 Aside) ══
   silsa.html이 index.html을 그대로 불러와 실행하므로 자료·로그인·공유는 통합 재고관리와 100% 같다.
   index.html 안에서는 window.SILSA_APP이 없어서 아래 블록이 아무 일도 하지 않는다. */
(function () {
  if (!window.SILSA_APP) return;
  try { document.title = '빵을그리다 금요일 실사'; } catch (e) {}
  /* 이 앱에서는 다른 화면이 뜨지 않게: 현장 입력 자동 열기, 발주 알림, 주문 알림 소리 끔 */
  try { fieldOpen = function () {}; } catch (e) {}
  try { poAlertOpen = function () {}; } catch (e) {}
  try { saleSound = async function () {}; } catch (e) {}
  const st = document.createElement('style');
  st.textContent = '#wvOv [data-wv="close"],#wvOv .wv-tabs{display:none!important}#fld,#modal{display:none!important}'
    + '#wvOv{z-index:2147483000!important}'
    + '#wvOv .sa-foot{max-width:700px;margin:6px auto 40px;padding:14px 16px;border-radius:14px;background:#fff;border:1px solid #DCE6DE;font-size:17px;color:#2B2B2B;line-height:1.6;word-break:keep-all}'
    + '#wvOv .sa-foot b{color:#2F6B45}#wvOv .sa-foot .sa-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}'
    + '#wvOv .sa-foot button{min-height:54px;padding:6px 18px;font-size:17px;font-weight:700;border-radius:12px;border:1px solid #C9D6CC;background:#F5FAF6;color:#24452F;cursor:pointer}'
    + '#wvOv .sa-foot small{display:block;margin-top:8px;font-size:14px;color:#6b6257}'
    + '@media (min-width:761px) and (max-width:1000px){html body #wvOv .ss-row{grid-template-columns:34px repeat(4,minmax(0,1fr))}html body #wvOv .ss-no{grid-row:1 / span 2}html body #wvOv .ss-nm{grid-column:2 / 4}html body #wvOv .ss-cw{grid-column:4 / 6}html body #wvOv .ss-spec,html body #wvOv .ss-tare,html body #wvOv .ss-tedit{grid-column:2 / -1}html body #wvOv .ss-ok .wv-btn{width:100%;margin-top:18px}}'
    + '#wvOv .wv-h h2::after{content:" · 전용 앱";font-size:14px;color:#2F6B45;font-weight:700}';
  document.head.appendChild(st);
  function foot() {
    const ov = document.getElementById('wvOv'); if (!ov || ov.querySelector('.sa-foot')) return;
    let ver = ''; try { ver = 'v' + APP_VER + ' · ' + APP_BUILT; } catch (e) {}
    const d = document.createElement('div'); d.className = 'sa-foot';
    d.innerHTML = '<b>빵을그리다 금요일 실사 앱</b><br>여기서 넣은 값은 입력하는 순간 저장되고, 사무실 PC <b>통합 재고관리</b>의 실물재고·비교 화면에 같은 값이 보입니다.'
      + '<div class="sa-row"><button type="button" data-sa="reload">🔄 최신 내용 다시 받기</button><button type="button" data-sa="logout">로그아웃</button></div><small>' + ver + '</small>';
    d.addEventListener('click', e => { const b = e.target.closest('[data-sa]'); if (!b) return; e.stopPropagation(); if (b.dataset.sa === 'reload') location.reload(); else if (confirm('로그아웃할까요? 다시 들어오려면 아이디·비밀번호가 필요합니다.')) { try { WLOCK.logout(); } catch (er) { location.reload(); } } });
    ov.appendChild(d);
  }
  const keep = () => { try { if (document.title.indexOf('금요일 실사') < 0) document.title = '빵을그리다 금요일 실사'; if (!document.getElementById('wvOv') && window.silsaOpen) window.silsaOpen(); foot(); } catch (e) {} };
  setTimeout(keep, 500); setInterval(keep, 1000);
})();
