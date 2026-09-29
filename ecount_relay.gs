/**
 * 빵을그리다(주) 통합재고관리 — 생산일지 중계 (Google Apps Script)  v2
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
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'wonryo-ecount-relay', version: 2 }))
    .setMimeType(ContentService.MimeType.JSON);
}

var JOB_ = 'job:', KEEP_MS_ = 3 * 24 * 3600 * 1000, TAKE_MS_ = 3 * 60 * 1000;
function props_() { return PropertiesService.getScriptProperties(); }
function getJob_(id) { var v = props_().getProperty(JOB_ + id); return v ? JSON.parse(v) : null; }
function putJob_(j) { props_().setProperty(JOB_ + j.id, JSON.stringify(j)); }
function view_(j) { return j ? { id: j.id, status: j.status, result: j.result || null, ts: j.ts, doneAt: j.doneAt || '' } : null; }
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

  if (req.action === 'ping') return { ok: true, version: 2, agentSeen: agentSeen_() };

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
      if (!j) { prune_(); j = { id: id, test: !!req.test, rows: rows, ts: new Date().toISOString(), status: 'queued', who: String(req.who || '').slice(0, 30) }; putJob_(j); }
      return { ok: true, queued: true, job: view_(j), agentSeen: agentSeen_() };
    }
    // 휴대폰: 보낸 건들의 처리 결과
    if (req.action === 'status') {
      var out = {}; (req.ids || []).slice(0, 50).forEach(function (x) { out[x] = view_(getJob_(String(x))); });
      return { ok: true, jobs: out, agentSeen: agentSeen_() };
    }
    // 사무실 PC 전송기: 처리할 건 가져가기
    if (req.action === 'jobs') {
      props_().setProperty('agent:seen', new Date().toISOString());
      var all = props_().getProperties(), now = Date.now(), list = [];
      Object.keys(all).forEach(function (k) {
        if (k.indexOf(JOB_) !== 0) return; var jj; try { jj = JSON.parse(all[k]); } catch (e) { return; }
        if (jj.status === 'queued' || (jj.status === 'taken' && now - new Date(jj.takenAt).getTime() > TAKE_MS_)) {
          jj.status = 'taken'; jj.takenAt = new Date().toISOString(); putJob_(jj); list.push({ id: jj.id, test: jj.test, rows: jj.rows });
        }
      });
      return { ok: true, jobs: list.slice(0, 20) };
    }
    // 사무실 PC 전송기: 이카운트 결과 돌려주기
    if (req.action === 'done') {
      var d = getJob_(String(req.id || '')); if (!d) return { ok: false, error: '없는 건입니다' };
      var r = req.result || {}; d.status = r.ok ? 'sent' : 'fail'; d.result = r; d.doneAt = new Date().toISOString(); putJob_(d);
      return { ok: true };
    }
  } finally { lock.releaseLock(); }

  return { ok: false, error: '알 수 없는 요청입니다' };
}
