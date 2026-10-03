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
