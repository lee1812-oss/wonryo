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
- 거래처 링크: `https://lee1812-oss.github.io/wonryo/order.html?s=2#t=<토큰>` — 주문서·주문은 중계(3.4 이상)에 보관. v180: 「카톡으로 보내기」(카카오 JS SDK Share, 카드 제목 「○○ 전용 주문서」) — 링크는 ?s=2&t=토큰, 주문서가 열면서 #t= 로 바꿈. 카카오 JavaScript 키는 기기 설정(X.cfg.kakaoKey)에만, 사이트 도메인 등록 필요.
- 품목 사진(3.5): 중계가 구글 드라이브 「빵을그리다 주문서 사진」 폴더에 품목코드.jpg로 보관(링크 공개), 속성 `oimg:map`에 코드→파일 id. 배포 때 드라이브 권한 허용 필요.
- 단가표(3.6~): 가격 자료는 저장소에 넣지 않음 — 사장님 구글 드라이브의 「빵을그리다_…_단가표.json」(kind bggd-catalog, 사진 없음)을 앱 「드라이브에서 가져오기」로 읽음. 제품 사진은 저장소 `cat/<id>.jpg`(F01~ 완제품, 생지는 G01~ 예정). 4.0: 생지 G01~G48(분류 sub·치수 dim·기준일 dt, 사진 없음 → 주문서에서 목록/표로). 거래처가 「⬇ 단가표 PDF」로 받음(이 기기에서 html2canvas+jsPDF로 생성, cdnjs).
- 단가표 제품 사진은 드라이브 사진이 없으면 주문서가 사이트의 `cat/<id>.jpg`를 바로 씀 (v168) — 드라이브 업로드 실패와 무관.
- 중계 드라이브 권한은 배포만으로 안 생김 → Apps Script 편집기에서 `authorizeDrive` 실행 → 허용 (사진 「사진 준비 중」이면 이것부터).
- 주문 링크 단가(3.8): 품목 [코드, 이름, 단가, 지난수량, 단가날짜] — 실제 판매 저장 때 updFormPrices로 더 최근 단가만 덮어씀. 주문 확정 화면에서 수량 수정·빼기. v175부터 단가·금액은 모든 링크에서 항상 보임(「단가 보여 주기」 없앰), 품목마다 단가와 「= 금액」.
- 거래처 안내(4.1): 사진 최대 6장(드라이브 ntc_<안내>_…, notice.imgs = 파일 id)·자세히 보기 링크(url). 주문서 맨 위에 사진 넘겨 보기 카드.
- 주문서 빠른 열기(4.2, v187): 앱이 formSnaps로 받은 주문서(주문 기록 제외)를 토큰 열쇠로 AES-GCM 암호화(gzip) → 중계 ghPutFiles가 GitHub `of/<sha256('bggd-file|'+토큰) 앞 32자>.txt`로 커밋(경로는 of/ 아래만 허용). 열쇠 = SHA-256('bggd-snap|'+토큰). 멈춤·삭제 링크는 'x'. 중계 스크립트 속성 GH_TOKEN(이 저장소 Contents 쓰기 fine-grained) 필요, 처음 checkGithub 실행으로 외부 연결 권한 허용. 링크·단가표·안내·단가 바뀌면 자동, 6시간마다 자동, 「지금 갱신」.
- 발주 회신(3.7): orderDone에 reply {st ok/out/done, msg, ship, dlv, box, lines, sup, vat, slip} → 거래처 주문서 「최근 주문」에 안내·거래명세표. 새 발주 카드의 「확인 회신」은 상태를 그대로 두고 회신만(주문서로 불러오기 전 확인용). 3.9: putOrderImg로 이카운트 거래명세표 캡처를 reply.img(드라이브 stm_<주문>.jpg).

## 중계 5.0 (v188~v190)
- 처음 한 번: Apps Script 편집기에서 `setupAll` 실행 → 허용 (드라이브·메일·외부 연결 권한).
- 저장 공간: 처리 끝난 지 10일 지난 주문·40일 지난 모든 주문은 드라이브 「빵을그리다 중계 자료/주문 보관/orders_YYYY-MM.json」으로 옮김(maint_, 6시간마다 orders 요청 때), 매일 「백업」에 14일치(API_KEY·GH_TOKEN 제외).
- 새 발주 메일(MailApp, 속성 ALERT_EMAIL / ALERT_OFF) — 새 발주·수정·취소·정기 자동 접수. 판매 기록은 드라이브 판매기록.json(saleLogSync), 판매 설정은 cfg2:sale.
- 휴무일 cfg2:holidays(배송일로 못 고름) · 거래처가 발주 확인 전까지 주문 수정(editOf)·취소(orderCancel) · 월별 주문 내역(orderHistory, 보관분 포함).
- 품절·최소 주문 금액: cfg2:shop {so: [이카운트 코드 | cat:단가표id], min: 공급가액} — 운영 상태 카드에서. 단가표 제품의 이카운트 코드가 품절이면 그 제품도 품절(shopPub_). 단가 모르는 품목이 있으면 최소 금액 검사는 건너뜀.
- 정기 주문: 주문 확정 때 매주/2주마다 → o.repeat {ev, on, ch, nx}. 지난 회차가 발주 확인(또는 배송일 지남)되면 다음 orders 요청 때 repeatGen_이 같은 품목으로 새 발주(note 「정기 주문 자동」). 멈추기 repeatStop(같은 ch 전부).
- 거래처별 사용 현황(usage): 링크 연 날(seen:<토큰12자>, orderForm 때 하루 한 번 기록)·마지막 주문·30일 주문.
- 중계 Apps Script 매니페스트(appsscript.json)에 oauthScopes 직접 적음(drive, script.external_request, script.send_mail, userinfo.email) — 2026-10-05 메일 권한이 빠져 있어 추가. 새 권한이 필요하면 여기에도 넣어야 허용 창이 뜸.

## 발주 알림창·거래처 대화 (v191, 중계 5.1)
- 앱 판매 입력 → 발주 접수 「🪟 발주 알림창」: 크롬은 Document Picture-in-Picture(항상 위 작은 창), 안 되면 팝업. 앱 탭의 코드가 그 창을 그림(열쇠를 넘기지 않음) — 앱 탭을 닫으면 같이 멈춤. 열려 있으면 30초마다 확인.
- 새 발주 탭: 「✓ 발주 확인」 = 확인 회신(reply st ok, 상태는 new 그대로). 대화방 탭: 거래처별 대화(chat:<토큰16자>, 최근 40개), 거래처 글은 알림 메일도.
- 거래처 주문서 맨 아래 「💬 빵을그리다에 문의하기」(chatGet/chatSend, 30초마다 새 답장 확인).
- v198(중계 5.3): 거래처 주문서 머리글 오른쪽 「💬 문의」 버튼(안 읽은 답장 숫자) → 전체 화면 대화(#chatOv, 뒤로 가기로 닫힘). 내가 보낸 메시지를 누르면 지움(거래처 chatSend del · 관리 chatAdmin del, 보낸 사람 것만) → 양쪽에서 사라짐.
- v197: 거래처 입력칸은 글 길이에 맞춰 늘어남(최대 150px), 입력 중엔 아래 주문 막대 숨김, 요청은 30초 넘으면 실패 처리(보내기가 멈춰 있지 않게). 거래처도 자주 쓰는 문구(기기마다 localStorage <LS>_qr, 기본 「확인 후 회신 부탁드립니다.」「감사합니다.」, 누르면 바로 보냄, 「✎ 문구 관리」).
- 알림 소리: PC마다 localStorage bggd_snd {ord, msg, vol, rep, ordName, msgName} — 알림창 🔊(또는 운영 상태 「🔊 소리 고르기」)에서. v195: 앱이 만드는 소리 16가지(SALE_SND, _sT로 음 합성) + 「내 소리」 파일(mp3·wav, 1MB·8초 이하, IndexedDB bggd_snd에 저장, decodeAudioData로 재생).
- 자주 쓰는 답장 문구(v193): 대화 화면 입력칸 위 단추(누르면 바로 보냄), 「✎ 문구 관리」에서 추가·고치기·삭제 — PC마다 localStorage bggd_qr (기본: 「네 확인 후 말씀드리겠습니다.」「감사합니다.」). 이카운트 메신저와는 연결 불가(공개 API 없음).
- 빠른 알림(v194, 중계 5.2): 앱이 10초마다 pulse(pl:o 주문·pl:c 대화 바뀐 시각만)를 묻고, 바뀌었을 때만 orders 전체를 받음. pulse 때 adm:last 기록 → 3분 안에 앱이 켜져 있으면 거래처 메시지 메일은 생략. 거래처 주문서는 보내기 누르면 말풍선 먼저 보이고(보내는 중…), 15분 안에 대화했으면 5초마다 답장 확인(아니면 30초).
