# wonryo — 작업 메모

## 사무실 PC 이카운트 전송기 (ecount_relay_pc.bat)
- 저장소의 `ecount_relay_pc.bat`이 원본. 사무실 PC에서는 이름을 바꿔 **`C:\ecount_sender\production_sender.bat`** 으로 실행 중 (2026-09-29 설치, curl로 받음).
- 같은 폴더: `ecount_relay_pc.json`(설정·이카운트 인증키 — 절대 저장소에 올리지 않음), `ecount_relay_pc.done.json`(만든 전표 기록), `ecount_relay_pc.log`.
- 자동 실행: 시작프로그램 폴더(`shell:startup`)의 `생산일지_이카운트_전송기.bat` → `C:\ecount_sender\production_sender.bat`를 최소화로 실행.
- 새 버전 반영: 전송기 창 닫기 → 새 파일로 `C:\ecount_sender\production_sender.bat`을 덮어쓰기(설정 json은 그대로) → 더블클릭.
- 파일은 CRLF 줄끝 유지. 중계(`ecount_relay.gs`)를 바꾸면 Apps Script에서 새 버전으로 배포해야 함.

## 배포할 때마다
- `index.html`의 `APP_VER`(+1)과 `APP_BUILT`(한국 시각 `YYYY-MM-DD HH:MM`)를 함께 바꿈 — 머리글 전화번호 아래에 「v버전 · 시각 업데이트」로 보임.
- `sw.js`의 `CACHE` 이름 숫자도 +1.
- 중계(ecount_relay.gs) version을 올리면 `index.html`의 `RELAY_WANT`도 같게 — 머리글에 「중계 3.9」(낮으면 빨간 「배포 필요」).

## 거래처 주문서 (order.html)
- `order.html`의 `RELAY` 주소는 `index.html`의 `DEFAULT_RELAY_URL`과 글자 하나까지 같아야 함 (손으로 옮겨 적지 말고 복사 — 2026-10-04 `9O8`/`908` 오타로 주문서가 안 열린 적 있음).
- 거래처 링크: `https://lee1812-oss.github.io/wonryo/order.html?s=2#t=<토큰>` — 주문서·주문은 중계(3.4 이상)에 보관.
- 품목 사진(3.5): 중계가 구글 드라이브 「빵을그리다 주문서 사진」 폴더에 품목코드.jpg로 보관(링크 공개), 속성 `oimg:map`에 코드→파일 id. 배포 때 드라이브 권한 허용 필요.
- 단가표(3.6~): 가격 자료는 저장소에 넣지 않음 — 사장님 구글 드라이브의 「빵을그리다_…_단가표.json」(kind bggd-catalog, 사진 없음)을 앱 「드라이브에서 가져오기」로 읽음. 제품 사진은 저장소 `cat/<id>.jpg`(F01~ 완제품, 생지는 G01~ 예정). 4.0: 생지 G01~G48(분류 sub·치수 dim·기준일 dt, 사진 없음 → 주문서에서 목록/표로). 거래처가 「⬇ 단가표 PDF」로 받음(이 기기에서 html2canvas+jsPDF로 생성, cdnjs).
- 단가표 제품 사진은 드라이브 사진이 없으면 주문서가 사이트의 `cat/<id>.jpg`를 바로 씀 (v168) — 드라이브 업로드 실패와 무관.
- 중계 드라이브 권한은 배포만으로 안 생김 → Apps Script 편집기에서 `authorizeDrive` 실행 → 허용 (사진 「사진 준비 중」이면 이것부터).
- 주문 링크 단가(3.8): 품목 [코드, 이름, 단가, 지난수량, 단가날짜] — 실제 판매 저장 때 updFormPrices로 더 최근 단가만 덮어씀. 주문 확정 화면에서 수량 수정·빼기.
- 발주 회신(3.7): orderDone에 reply {st ok/out/done, msg, ship, dlv, box, lines, sup, vat, slip} → 거래처 주문서 「최근 주문」에 안내·거래명세표. 새 발주 카드의 「확인 회신」은 상태를 그대로 두고 회신만(주문서로 불러오기 전 확인용). 3.9: putOrderImg로 이카운트 거래명세표 캡처를 reply.img(드라이브 stm_<주문>.jpg).
