/**
 * 빵을그리다(주) 통합재고관리 — 생산일지 중계 (Google Apps Script)  v3
 *
 * v3: 같은 날짜의 생산을 정해진 시각(holdUntil)까지 모아 두었다가 한 전표로 합쳐 전송기에 넘깁니다.
 *     (같은 품목은 수량을 더함 · 「지금 보내기」 release · 들어가기 전 취소 cancel)
 *
 * 이카운트 OAPI는 등록된 IP에서만 받습니다. 구글 서버 IP는 계속 바뀌어 등록할 수 없으므로,
 *   휴대폰·태블릿 「생산일지」 → 이 중계(대기열) → 사무실 PC 「이카운트 전송기」(등록된 IP) → 이카운트
 * 순서로 보냅니다. 이 중계는 입력을 잠시 보관하고 결과를 돌려줄 뿐, 이카운트 인증키를 갖지 않습니다.
 *
 * 스크립트 속성 (프로젝트 설정 → 스크립트 속성)
 *   API_KEY   통합재고관리 설정의 「공유 저장소 열쇠 복사」 값 — 이 열쇠가 있는 요청만 받음
 *   (이전 버전에서 넣은 COM_CODE · USER_ID · API_CERT_KEY · TEST_CERT_KEY 는 이제 쓰지 않으니 지워도 됩니다)
 *
 * 배포: 배포 → 배포 관리 → 연필(수정) → 버전 「새 버전」 → 배포  (주소는 그대로 유지)
 */

function doPost(e) {
  var out;
  try { out = handle_(JSON.parse((e && e.postData && e.postData.contents) || '{}')); }
  catch (err) { out = { ok: false, error: String((err && err.message) || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'wonryo-ecount-relay', version: 3 }))
    .setMimeType(ContentService.MimeType.JSON);
}

var JOB_ = 'job:', KEEP_MS_ = 3 * 24 * 3600 * 1000, TAKE_MS_ = 3 * 60 * 1000;
function props_() { return PropertiesService.getScriptProperties(); }
function getJob_(id) { var v = props_().getProperty(JOB_ + id); return v ? JSON.parse(v) : null; }
function putJob_(j) { props_().setProperty(JOB_ + j.id, JSON.stringify(j)); }
function view_(j) { return j ? { id: j.id, status: j.status, result: j.result || null, ts: j.ts, doneAt: j.doneAt || '', holdUntil: j.holdUntil || 0, date: j.date || '', mergedInto: j.mergedInto || '' } : null; }
function num_(v) { var n = Number(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
// 같은 날짜·같은 테스트 여부의 건들을 한 전표로: 같은 품목(코드·창고·담당자)은 수량을 더하고 적요는 겹치지 않게 이어 붙임
function mergeRows_(jobs) {
  var by = {}, order = [];
  jobs.forEach(function (j) { (j.rows || []).forEach(function (r) {
    var k = [r.PROD_CD, r.WH_CD_F || '', r.WH_CD_T || '', r.EMP_CD || ''].join('|');
    if (!by[k]) { by[k] = JSON.parse(JSON.stringify(r)); by[k].QTY = num_(r.QTY); by[k].__rem = r.REMARKS ? [r.REMARKS] : []; order.push(k); }
    else { by[k].QTY += num_(r.QTY); if (r.REMARKS && by[k].__rem.indexOf(r.REMARKS) < 0) by[k].__rem.push(r.REMARKS); }
  }); });
  return order.map(function (k) { var r = by[k]; r.QTY = String(Math.round(r.QTY * 1000) / 1000); if (r.__rem.length) r.REMARKS = r.__rem.join(' / ').slice(0, 200); else delete r.REMARKS; delete r.__rem; r.UPLOAD_SER_NO = '1'; return r; });
}
function agentSeen_() { return props_().getProperty('agent:seen') || ''; }
function prune_() {
  var all = props_().getProperties(), now = Date.now();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf(JOB_) !== 0) return;
    try { var j = JSON.parse(all[k]); if (now - new Date(j.ts).getTime() > KEEP_MS_) props_().deleteProperty(k); } catch (e) { props_().deleteProperty(k); }
  });
}

function handle_(req) {
  var key = props_().getProperty('API_KEY');
  if (!key) return { ok: false, error: '중계의 스크립트 속성 API_KEY가 비어 있습니다' };
  if (req.key !== key) return { ok: false, error: '열쇠가 맞지 않습니다 — 「공유 저장소 열쇠 복사」 값을 중계의 API_KEY에 넣었는지 확인하세요' };

  if (req.action === 'ping') return { ok: true, version: 3, agentSeen: agentSeen_() };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    // 휴대폰: 생산입고 한 건을 대기열에 넣음 (같은 clientId는 한 번만)
    if (req.action === 'saveProduction') {
      var id = String(req.clientId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
      if (!id) return { ok: false, error: 'clientId가 없습니다' };
      var rows = (req.rows || []).map(function (r) {
        var b = {}; Object.keys(r).forEach(function (k) { if (r[k] !== '' && r[k] != null) b[k] = String(r[k]); });
        if (!b.UPLOAD_SER_NO) b.UPLOAD_SER_NO = '1'; return b;
      });
      if (!rows.length) return { ok: false, error: '보낼 품목이 없습니다' };
      var j = getJob_(id);
      if (!j) { prune_(); j = { id: id, test: !!req.test, rows: rows, ts: new Date().toISOString(), status: 'queued', who: String(req.who || '').slice(0, 30), date: String(rows[0].IO_DATE || ''), holdUntil: Number(req.holdUntil) || 0 }; putJob_(j); }
      return { ok: true, queued: true, job: view_(j), agentSeen: agentSeen_() };
    }
    // 휴대폰: 보낸 건들의 처리 결과
    if (req.action === 'status') {
      var out = {}; (req.ids || []).slice(0, 50).forEach(function (x) { out[x] = view_(getJob_(String(x))); });
      return { ok: true, jobs: out, agentSeen: agentSeen_() };
    }
    // 휴대폰: 모아 둔 날짜 건을 지금 보내기 (holdUntil 해제)
    if (req.action === 'release') {
      var alr = props_().getProperties(), n = 0;
      Object.keys(alr).forEach(function (k) { if (k.indexOf(JOB_) !== 0) return; var q; try { q = JSON.parse(alr[k]); } catch (e) { return; }
        if (q.status === 'queued' && q.holdUntil && String(q.date) === String(req.date || '') && !!q.test === !!req.test) { q.holdUntil = 0; putJob_(q); n++; } });
      return { ok: true, released: n };
    }
    // 휴대폰: 아직 이카운트에 들어가지 않은(모아 두는 중인) 건 취소
    if (req.action === 'cancel') {
      var cj = getJob_(String(req.id || '')); if (!cj) return { ok: false, error: '없는 건입니다' };
      if (cj.status !== 'queued') return { ok: false, error: '이미 이카운트로 넘어가 취소할 수 없습니다 — 이카운트에서 수정하세요', job: view_(cj) };
      cj.status = 'cancel'; cj.doneAt = new Date().toISOString(); putJob_(cj); return { ok: true, job: view_(cj) };
    }
    // 사무실 PC 전송기: 처리할 건 가져가기 — 모을 시각이 지난 건만, 같은 날짜·같은 테스트 여부는 한 전표로 합침
    if (req.action === 'jobs') {
      props_().setProperty('agent:seen', new Date().toISOString());
      var all = props_().getProperties(), now = Date.now(), list = [], ready = {};
      Object.keys(all).forEach(function (k) {
        if (k.indexOf(JOB_) !== 0) return; var jj; try { jj = JSON.parse(all[k]); } catch (e) { return; }
        if (jj.status === 'taken' && !jj.mergedInto && now - new Date(jj.takenAt).getTime() > TAKE_MS_) {   // 가져갔는데 결과가 안 온 건(합친 건 포함)은 같은 id로 다시 줌
          jj.takenAt = new Date().toISOString(); putJob_(jj); list.push({ id: jj.id, test: jj.test, rows: jj.rows }); return; }
        if (jj.status === 'queued' && !(jj.holdUntil > now)) { var g = (jj.date || (jj.rows && jj.rows[0] && jj.rows[0].IO_DATE) || '') + '|' + (jj.test ? 1 : 0); (ready[g] = ready[g] || []).push(jj); }
      });
      Object.keys(ready).forEach(function (g) {
        var js = ready[g].sort(function (a, b) { return String(a.ts).localeCompare(String(b.ts)); }); var t = new Date().toISOString();
        if (js.length === 1) { var one = js[0]; one.status = 'taken'; one.takenAt = t; putJob_(one); list.push({ id: one.id, test: one.test, rows: one.rows }); return; }
        var mid = 'M' + js[0].id.slice(0, 24) + '_' + js.length;
        var m = { id: mid, test: js[0].test, rows: mergeRows_(js), ts: t, status: 'taken', takenAt: t, date: js[0].date, members: js.map(function (x) { return x.id; }) };
        putJob_(m); js.forEach(function (x) { x.status = 'taken'; x.takenAt = t; x.mergedInto = mid; putJob_(x); });
        list.push({ id: m.id, test: m.test, rows: m.rows });
      });
      return { ok: true, jobs: list.slice(0, 20) };
    }
    // 사무실 PC 전송기: 이카운트 결과 돌려주기
    if (req.action === 'done') {
      var d = getJob_(String(req.id || '')); if (!d) return { ok: false, error: '없는 건입니다' };
      var r = req.result || {}; d.status = r.ok ? 'sent' : 'fail'; d.result = r; d.doneAt = new Date().toISOString(); putJob_(d);
      (d.members || []).forEach(function (mid2) { var x = getJob_(mid2); if (!x) return; x.status = d.status; x.result = r; x.doneAt = d.doneAt; putJob_(x); });   // 합친 건: 각 휴대폰 건에도 같은 결과
      return { ok: true };
    }
  } finally { lock.releaseLock(); }

  return { ok: false, error: '알 수 없는 요청입니다' };
}
