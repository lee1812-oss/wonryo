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
- 판매 입력 단가(v218): 거래처 지난 단가(cust) → 없으면 주문서에 보였던 단가 l[4](ord, 「주문서 단가」) → 없으면 우리 평균 판매 단가(avg, 최근 90일 판매금액÷수량, 없으면 전체 기간, 「첫 거래 · 평균 판매 단가」). saleIndex().I[코드].avg. 발주 카드 공급가액(saleOrdAmt)도 단가 모르는 품목은 avg로.
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
- v211: 알림창은 늘 400×680으로 열림(preferInitialWindowPlacement — 크롬이 예전에 줄인 크기를 기억해 작게 열리던 것), 머리글 「가− 가+」 글자 크기(localStorage bggd_mini_zoom, 내용 .mt·.mb·.ft 에만 zoom) · 「⤢」 창 크게.
- v212: 알림창 안에서 크롬 확대/축소가 줄어 있으면(Ctrl+휠) 내용이 깨알처럼 보임 → saleMiniFit이 innerWidth/outerWidth 비율로 html zoom을 되돌림(창 크기 바뀔 때마다). 손으로는 알림창 누르고 Ctrl+0.
- 알림 소리: PC마다 localStorage bggd_snd {ord, msg, vol, rep, ordName, msgName} — 알림창 🔊(또는 운영 상태 「🔊 소리 고르기」)에서. v195: 앱이 만드는 소리 16가지(SALE_SND, _sT로 음 합성) + 「내 소리」 파일(mp3·wav, 1MB·8초 이하, IndexedDB bggd_snd에 저장, decodeAudioData로 재생).
- 자주 쓰는 답장 문구(v193): 대화 화면 입력칸 위 단추(누르면 바로 보냄), 「✎ 문구 관리」에서 추가·고치기·삭제 — PC마다 localStorage bggd_qr (기본: 「네 확인 후 말씀드리겠습니다.」「감사합니다.」). 이카운트 메신저와는 연결 불가(공개 API 없음).
- 빠른 알림(v194, 중계 5.2): 앱이 10초마다 pulse(pl:o 주문·pl:c 대화 바뀐 시각만)를 묻고, 바뀌었을 때만 orders 전체를 받음. pulse 때 adm:last 기록 → 3분 안에 앱이 켜져 있으면 거래처 메시지 메일은 생략. 거래처 주문서는 보내기 누르면 말풍선 먼저 보이고(보내는 중…), 15분 안에 대화했으면 5초마다 답장 확인(아니면 30초).

## 거래처 주문 앱 (바탕화면 설치, v199)
- order.webmanifest(이름 「빵을그리다 주문」, start_url `./order.html?app=1`, scope `./order.html`) + order-sw.js(주문서 화면만, 네트워크 우선·끊기면 저장본) + 아이콘 order_192/512/maskable/apple.png(크루아상+「빵을그리다」).
- 주문서가 토큰을 localStorage `bggd_app_t`에 저장 → 앱 아이콘(?app=1)으로 열면 마지막 링크로 바로 열림. 처음이면 「주문서 링크를 한 번 눌러 열어 주세요」.
- v203: 카톡 「크롬으로 열기」 링크에 inst=1 → 크롬에서 열리자마자 오른쪽 위 ⋮를 가리키는 「⋮ → 앱 설치」 말풍선(.ptip, 삼성 인터넷은 아래 ≡ 안내). ⋮ 메뉴의 「앱 설치」는 기다림 없이 바로 됨(30초 기다림은 페이지 안 설치 창만 해당).
- v213: 요즘 크롬 ⋮ 메뉴 이름은 「설치 및 바로가기 만들기」 → 뜨는 창에서 「설치」. v202: 크롬 안내는 「앱 설치」(또는 홈 화면에 추가 → 「설치」)로, 「바로가기 만들기」는 주소창이 보이는 바로가기라 고르지 말라고 안내. 크롬 설치 창(beforeinstallprompt)은 화면을 한 번 누르고 30초쯤 지나야 준비되므로, 안내 화면이 열려 있는 동안 준비되면 「지금 바로 설치하기」 버튼이 나타남.
- v201: 카카오톡 등 앱 안 브라우저(INAPP: KAKAOTALK·NAVER(inapp)·; wv) 등)는 display-mode standalone 으로 보고해서 배너가 숨던 문제 → INAPP이면 설치 앱으로 안 봄. 앱 안이면 배너가 바로 「크롬으로 열기」(안드로이드 intent://…;package=com.android.chrome, 없으면 기본 브라우저) · 아이폰 카톡은 「사파리로 열기」(kakaotalk://web/openExternal). 링크는 ?s=2&t=토큰.
- 주문서 맨 위 「📲 바탕화면에 앱 설치」 배너(✕ 누르면 7일 숨김, 설치하면 안 보임): 안드로이드 크롬 = 설치 창(beforeinstallprompt), 카카오톡 안 = `kakaotalk://web/openExternal?url=`로 다른 브라우저, 아이폰 = 사파리 공유 → 홈 화면에 추가 안내(아이폰은 manifest를 안 넣어 #t= 주소째로 저장), 삼성 인터넷 = ≡ → 현재 페이지 추가.
- v217: 휴대폰 크롬이 주문 앱을 계속 「이미 설치됨」으로 봐서 → 주문 manifest start_url ./order.html?app=2 · id ./wonryo/order.html?app=2 (실제 id https://lee1812-oss.github.io/wonryo/order.html?app=2). 주문서는 app=1·2 모두 앱 실행으로 봄(예전 설치 앱 그대로 동작).
- v216: 아이콘 admin_/order_ 192·512 를 둥근 모서리(초타원, 모서리 투명)로 — 크롬 바로가기로 설치돼도 다른 앱처럼 둥글게. maskable·apple 은 그대로(꽉 찬 사각).
- v215: 휴대폰 크롬이 지운 앱을 「이미 설치됨」으로 기억해 열리지 않던 것 → 두 manifest id 를 바꿈(관리 ./index.html?pwa=2 · 주문 ./order.html?pwa=2, 새 앱으로 인식). id 는 함부로 바꾸지 말 것(설치된 앱 갱신이 끊김). 주의: id 는 사이트 맨 앞(lee1812-oss.github.io/)을 기준으로 풀려서 실제 id 는 https://lee1812-oss.github.io/index.html?pwa=2 (휴대폰 chrome://webapks 로 확인) — 같은 주소의 다른 저장소 앱(edu·utca-report 등)과 겹치지 않게.
- v214: 관리 앱 manifest scope 를 ./index.html 로 좁힘(예전 ./ 는 order.html 까지 포함해 한 휴대폰에 두 앱이 겹침), sw.js 는 order*·privacy.html 요청을 건드리지 않음.
- 관리 앱(v200): manifest.webmanifest 아이콘을 admin_192/512/maskable/apple.png(남색 바탕·크루아상·「빵을그리다」·「관리」)로, short_name 「빵을그리다 관리」. 설치 안내 그림은 대화에서 만들어 전달(저장소에 없음).
- 플레이스토어 등록(검색 노출)은 이 웹앱을 PWABuilder로 포장 — 개발자 계정 25달러, 개인 계정은 테스터 12명·14일(회사 계정은 D-U-N-S), 도메인 루트의 assetlinks 필요(도메인 구매 후).

## 중계 5.7 (v219) — 사진·손글씨 발주 넣기 · 표현 기억 공유
- 판매 입력 「📋 카톡 붙여넣기」 창의 「📷 사진·캡처」: 중계 readOrderImg → Claude(claude-opus-5-5, effort low, json_schema, fallbacks default)가 줄별 {raw 쓴 그대로, name 우리 품목 이름, qty, unit}. 앱이 거래처 품목·자주 팔린 품목 이름(최대 300)을 힌트로 보냄. 스크립트 속성 **ANTHROPIC_KEY** 없으면 예전 Tesseract(이 PC)로 — 손글씨는 잘 못 읽음.
- 품목 맞추기: 음절 2글자 비교(saleDice) + 자모 비교(saleJSim — 깐모소→맘모스, 닮은 자모는 0.5) + 이 거래처가 산 품목 가산. **기억한 표현만 「기억」**, 나머지는 모두 노란 줄 「맞아요 ✓」를 눌러야 담김(확인 필요 n줄).
- 확인·고른 표현은 X.alias[거래처][표현]=코드 + 중계 al:<거래처>(aliasPut/aliasAll, 9KB 넘으면 오래된 것부터 버림) → 모든 PC가 공유. 다른 거래처가 기억한 표현도 후보(「다른 거래처 기억」).
- 백업·되살리기는 비밀 열쇠(API_KEY·GH_TOKEN·ANTHROPIC_KEY·SOLAPI_KEY·SOLAPI_SECRET)를 빼고 다룸(secretKey_).
- v225: 링크 「주문 마감」을 7일 전까지 고를 수 있게(중계는 원래 0~7 허용) — 꽃우물처럼 월요일 마감·금요일 배송.
- v224(중계 5.9) 거래처 맞춤: 링크 품목 it[5] 표시(예: 계란 미포함·6개입, 품목 옆 초록 칩)·it[6] 고르기('밤|단호박|흑임자', 수량 넣으면 칩, 안 고르면 주문 못 함 → 주문 줄 이름 「품목 · 밤」, l[5]=고른 것, 판매 입력 적요로). 링크 편집 「품목 표시·고르기」(st.ext, listOrderForms가 ext·note 돌려줌 — 예전엔 고치면 안내 글이 지워졌음).
  「🙅 이번 주는 주문 없어요」(orderSkip → sk:<토큰20자> 'YYYY-MM-DD HH:MM', 그 주 월요일 기준, 주문하면 풀림, 메일 알림, 마감 알림톡 안 보냄) → 발주 접수 「새 발주」 줄에 「이번 주 주문 없음: …」(orders.skips).
  같은 배송일에 또 주문하면 o.add → 카드 「➕ 추가 주문」·메일 제목 「발주 추가 주문」, 주문서에 「이 날 배송할 주문이 이미 있어요」 안내.
- v223: 발주 카드 버튼 이름 「주문서·회신(보냈으면 ✓)·반려·소통·삭제」 5칸 격자(.so-act)로 카드 안에 맞춤. 새 발주 머리 「선택 삭제 n건」(체크한 것 한꺼번에 orderDel).
- v222(중계 5.8): 발주 삭제 🗑 — 새 발주 카드·처리한 발주 표. 중계 orderDel(ord:<id> 지움, 거래처 화면에서도 사라짐). 정기 주문의 마지막 회차를 지우면 다음 회차도 안 생김(건너뛰기는 「반려」). 중계가 5.7 이하면 orderDone status 'deleted'로 숨김(앱·주문서 모두 deleted 거름).
- v221: 발주 카드 오른쪽 「배송 …」 위에 「접수 M/D(요일) HH:MM」(o.at, 거래처가 고쳤으면 고친 시각).
- v220: 발주를 불러올 때 판매현황에 없는 거래처는 주문의 이름(o.name)을 X.cust에 넣음, 이카운트로는 이름을 모르면 CUST_DES를 비움(코드가 거래처명으로 들어가던 것 — 이카운트가 등록된 이름을 씀).
- v219: 「＋ 주문 링크 만들기」는 그 PC에 판매현황 자료가 없으면 회색으로 막지 않고 「판매 입력」에서 엑셀 올리기로 안내.

## 중계 5.4 (v204) — 사고 예방 묶음
- autoRun(1시간마다, setupAll → setupTriggers가 예약): 정기 주문 만들기(repeatGen_)·정리/백업(maint_)·미확인 발주 메일(remind_: 들어온 지 2시간 o.rm1, 배송 오늘·내일 o.rm2). 결과는 trig:last → 앱 운영 상태 「✓ 자동 실행」.
- 예약에는 appsscript.json oauthScopes 에 `https://www.googleapis.com/auth/script.scriptapp` 필요(2026-10-06 추가 안내).
- 구글 하루 한도 절약: pulse(pl:o·pl:c·adm:last)·대화(cv:chat…)·대화용 링크 확인(fl:토큰)은 CacheService. 링크 저장·멈춤·삭제 때 formLiteDrop_.
- 주문 줄 [코드, 이름, 수량, 종류, 주문 시점 단가] (단가표 추가 품목은 null, 샘플 0) → 발주 카드 「주문 시점 공급가액」. 거래처 수정 시 이전 내용 o.hist(최근 5개) → 발주 카드 「이력 보기」.
- 백업에서 되살리기(backupList/backupRestore, confirm '되살리기', 되돌리기 전 상태도 relay_backup_before_restore_*로 남김). 공휴일 불러오기(앱 KR_HOLI 2026~2027 — 해마다 다음 해 추가). 앱은 확인 안 한 발주가 30분 넘으면 30분마다 다시 알림.

## 중계 5.5 (v205~v206) — 편의 묶음
- 거래처 주문서: 확인된 주문에 「✓ 잘 받았어요」(orderAck → o.ack) / 「⚠ 문제 있어요」(orderClaim → o.claim {msg, imgs 드라이브 clm_…(사진 3장, 1280px JPEG로 줄여 보냄), st open/done, reply}) / 「💬 이 주문 문의」(대화 칸에 「[날짜 배송 주문]」 채움).
- 관리: 발주 접수 맨 위 「⚠ 거래처 문제 신고」 카드(claimReply: 답하고 처리 완료 / 답만), 알림창에도 표시. 처리 중 신고가 있는 주문은 보관 이동·orders 목록에서 빠지지 않음.
- 여러 발주 차례 입력: 새 발주 카드 체크 → 「선택한 n건 차례로 이카운트 입력」(saleQueueStart) — 같은 거래처·같은 배송일은 한 전표로 합침(D.ordIds → 저장 때 모두 accepted, 전송 완료 때 모두 done), 저장하면 다음 발주 자동으로 열림. 카드의 💬 = 그 거래처 대화.
- 배송일별 생산 합계에 완제품·생지 재고 비교: finished.html finSummary가 stk {이카운트코드: [수량, 단위, 안전재고]}·stkAt 를 보냄(완제품 화면을 열어야 갱신, S.finSum) → 앞 배송일 누적이 재고보다 많으면 「⚠ n박스 부족」.
- v208: 좁은 왼쪽 메뉴 = 2열 타일(--side-w 156px, 모듈 버튼 .menusw·하위 메뉴 .subgrid 모두 2열, 아이콘 위·이름 아래), 타일 높이 clamp(36px,6.4vh,54px)로 창 높이에 맞춰 스크롤 없음.
- v206 화면: html,body{height:100%} 때문에 머리글 고정이 한 화면만큼만 되던 것 → body min-height. 넓은 화면 머리글 낮게, 왼쪽 메뉴 좁게(body.navmini, --side-w 76px, 맨 위 「»」로 넓히기, S.ui.navMini).

## 중계 5.6 (v209) — 비밀번호·미수금·알림톡·플레이스토어 준비
- 링크별 추가 설정 fx:<토큰24자> {pin: SHA-256('bggd-pin|'+토큰+'|'+숫자), ph, al} — 주문 링크 저장과 따로(링크 고쳐도 유지). 앱 주문 링크 표 「🔒 설정」(setFormExtra).
- PIN 건 링크: 공개 요청(PIN_ACTS_)마다 req.pin 확인, 10번 틀리면 10분 잠금(cache pf:). 거래처 주문서는 비밀번호 화면 → localStorage bggd_pin_<토큰10자>, call()이 자동으로 붙임. 빠른 열기 자료(of/)는 만들지 않음(formSnaps null), 비밀번호 걸 때 앱이 다시 올림.
- 미수금: 앱 운영 상태 「엑셀 올리기」 — 이카운트 채권(미수금) 현황 엑셀에서 「거래처코드/거래처명」+「잔액·미수·채권」 칸을 찾음(주문 링크 있는 거래처만) → putBalances → cfg2:bal {at, show, b}. 발주 카드·링크 표에 「미수 ○원」, show 켜면 거래처 주문서에 「현재 외상 잔액」.
- 알림톡(솔라피): 스크립트 속성 SOLAPI_KEY·SOLAPI_SECRET·SOLAPI_PFID·SOLAPI_FROM·TPL_OK·TPL_OUT·TPL_REMIND. 변수 #{거래처}·#{배송일}·#{품목}·#{안내}(확인·출고) / #{거래처}·#{배송일}·#{마감}(마감 알림). orderDone 회신 st ok/out 때 종류마다 한 번(o.alim), autoRun의 alimRemind_가 마감 3시간 안 미주문 거래처에 한 번(arm:). 기록 alim:log, 운영 상태 「시험 보내기」(alimTest).
- privacy.html = 개인정보처리방침(플레이스토어 등록용). 플레이스토어는 도메인 구매 → PWABuilder로 포장 → assetlinks.json 을 도메인 루트 /.well-known 에.


## 생산일지 ↔ CCP 일지 (v226, 2026-10-11 Aside가 K-HACCP 연동 분석 후 반영)
- K-HACCP 흐름: 「CCP 제품 선택」에서 품목 ON → saveOperationLogList(수량 0) → /mgmt/ccp/startWork 가 그 품목에 연결된 CCP 일지(공정별 하루 한 장, 품목마다 칸)를 만든다 → 태블릿에서 측정 → 「생산실적(CCP관리)」 수량이 생산작업일지로. 품목→CCP 연결은 서버에 있고 화면에는 안 보임 → todayHomeCcpDirectionList(createDt) 186일분으로 확인.
- K-HACCP 품목코드 = 이카운트 품목코드. 실제 연결표를 CCP_KH_LINK(코드 → o오븐·f급냉·m금속·x크림배합)로 넣고 ccpDefault 가 이름 추정보다 먼저 씀. 바뀐 것: Db.마늘바게트(SD50)는 크림배합 없음(fm).
- K-HACCP 기록 3,415건 분석(2025-01~2026-10): CCP 일지 351장 중 347장이 품목 1개만 측정 — 여러 품목을 만든 날 나머지 품목 칸은 비어 있음(예 10/08 통밀소금빵 250박스). 크림배합 배치 합계 = 생산일지 배합량은 61일 중 36일(예 9/30 73.23kg vs 111.19kg). 금속 통과량 = 생산량 약 63%.
- 그래서 ccpLinkCheck/ccpLinkHtml: 일지 화면 맨 위 「🔗 생산 ↔ CCP 연동 점검」 — ① 쓰기 시작한 공정 일지에서 측정이 하나도 없는 품목 ② 배치 합계 ≠ 생산일지 배합량(배치 줄이 다 찼을 때만) ③ 금속 통과량 ≠ 생산량. 측정값은 지어 넣지 않음.
- 배치 수는 기록마다 달라(평소 크기로 예측해도 66일 중 33일만 맞음) 30kg 올림 그대로 두고 「배치 추가」로 맞춤.
