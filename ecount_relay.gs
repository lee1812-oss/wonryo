/**
 * 빵을그리다(주) 통합재고관리 — 이카운트 생산입고 중계 (Google Apps Script)
 *
 * 휴대폰·태블릿의 「생산일지」 화면이 이 중계로 입력을 보내면, 중계가 이카운트 OAPI
 * (생산입고I · SaveGoodsReceipt)에 전표를 만듭니다. 이카운트 인증키는 이 스크립트의
 * 「스크립트 속성」에만 두고, 공개 사이트(깃허브)에는 절대 올리지 않습니다.
 *
 * 스크립트 속성 (프로젝트 설정 → 스크립트 속성)
 *   API_KEY        통합재고관리 설정의 「공유 저장소 열쇠 복사」 값 — 이 열쇠가 있는 요청만 받음
 *   COM_CODE       이카운트 회사코드
 *   USER_ID        이카운트 API 사용자 ID (인증키를 발급받은 ID)
 *   API_CERT_KEY   이카운트 실서버 API 인증키
 *   TEST_CERT_KEY  (선택) 테스트 인증키 — 「테스트 모드」 전송은 테스트 서버(sboapi)로 감
 *   ZONE           (선택) 이카운트 존 (예: CB). 비우면 자동으로 찾음
 *
 * 배포: 배포 → 새 배포 → 유형 「웹 앱」, 실행 사용자 「나」, 액세스 「모든 사용자」
 *       → 나온 웹 앱 URL(…/exec)을 통합재고관리 「생산일지 → 연동 설정」에 넣습니다.
 */

function doPost(e) {
  var out;
  try { out = handle_(JSON.parse((e && e.postData && e.postData.contents) || '{}')); }
  catch (err) { out = { ok: false, error: String((err && err.message) || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'wonryo-ecount-relay', version: 1 }))
    .setMimeType(ContentService.MimeType.JSON);
}

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }

function handle_(req) {
  var key = prop_('API_KEY');
  if (!key) return { ok: false, error: '중계의 스크립트 속성 API_KEY가 비어 있습니다' };
  if (req.key !== key) return { ok: false, error: '열쇠가 맞지 않습니다 — 「공유 저장소 열쇠 복사」 값을 중계의 API_KEY에 넣었는지 확인하세요' };
  var test = !!req.test;

  if (req.action === 'ping') {
    var s = session_(test, true);
    return { ok: true, test: test, zone: s.zone, com: prop_('COM_CODE'), user: prop_('USER_ID') };
  }

  if (req.action === 'saveProduction') {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var cache = CacheService.getScriptCache();
      var ck = 'done:' + (test ? 't:' : 'r:') + String(req.clientId || '');
      if (req.clientId) {   // 같은 입력을 두 번 보내도(재전송·두 번 누름) 전표는 한 번만
        var prev = cache.get(ck);
        if (prev) { var p = JSON.parse(prev); p.duplicate = true; return p; }
      }
      var rows = (req.rows || []).map(function (r) {
        var b = {};
        Object.keys(r).forEach(function (k) { if (r[k] !== '' && r[k] != null) b[k] = String(r[k]); });
        if (!b.UPLOAD_SER_NO) b.UPLOAD_SER_NO = '1';
        return { BulkDatas: b };
      });
      if (!rows.length) return { ok: false, error: '보낼 품목이 없습니다' };
      var res = call_(test, '/OAPI/V2/GoodsReceipt/SaveGoodsReceipt', { GoodsReceiptList: rows });
      var d = res.Data || {};
      var details = (d.ResultDetails || []).map(function (x) {
        return { ok: !!x.IsSuccess, error: x.TotalError || '',
          errors: (x.Errors || []).map(function (er) { return (er.ColCd ? er.ColCd + ': ' : '') + (er.Message || ''); }) };
      });
      var out = {
        ok: String(res.Status) === '200' && !(Number(d.FailCnt) > 0) && !res.Error,
        test: test, successCnt: d.SuccessCnt, failCnt: d.FailCnt, slipNos: d.SlipNos || [], details: details,
        error: res.Error ? (res.Error.Message || JSON.stringify(res.Error)) : ''
      };
      if (!out.ok && !out.error) {
        var bad = details.filter(function (x) { return !x.ok; })[0];
        out.error = bad ? (bad.error || bad.errors.join(' / ')) : ('이카운트가 입력을 거절했습니다: ' + JSON.stringify(res).slice(0, 300));
      }
      if (out.ok && req.clientId) cache.put(ck, JSON.stringify(out), 21600);
      return out;
    } finally { lock.releaseLock(); }
  }

  return { ok: false, error: '알 수 없는 요청입니다' };
}

function host_(test, zone) { return 'https://' + (test ? 'sboapi' : 'oapi') + (zone || '') + '.ecount.com'; }

function post_(url, body) {
  var r = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true });
  var t = r.getContentText();
  try { return JSON.parse(t); }
  catch (e) { throw new Error('이카운트 응답을 읽지 못했습니다 (' + r.getResponseCode() + '): ' + t.slice(0, 200)); }
}

function zone_(test) {
  var z = prop_('ZONE'); if (z) return z;
  var c = CacheService.getScriptCache(), k = 'zone:' + (test ? 't' : 'r');
  z = c.get(k); if (z) return z;
  var r = post_(host_(test, '') + '/OAPI/V2/Zone', { COM_CODE: prop_('COM_CODE') });
  z = r && r.Data && r.Data.ZONE;
  if (!z) throw new Error('이카운트 존 조회 실패: ' + JSON.stringify(r).slice(0, 200));
  c.put(k, z, 21600); return z;
}

function session_(test, fresh) {
  var c = CacheService.getScriptCache(), k = 'sess:' + (test ? 't' : 'r');
  if (!prop_('COM_CODE') || !prop_('USER_ID')) throw new Error('중계의 스크립트 속성 COM_CODE · USER_ID를 넣어 주세요');
  var zone = zone_(test);
  if (!fresh) { var s = c.get(k); if (s) return { id: s, zone: zone }; }
  var cert = test ? (prop_('TEST_CERT_KEY') || prop_('API_CERT_KEY')) : prop_('API_CERT_KEY');
  if (!cert) throw new Error('중계의 스크립트 속성 API_CERT_KEY를 넣어 주세요');
  var r = post_(host_(test, zone) + '/OAPI/V2/OAPILogin', { COM_CODE: prop_('COM_CODE'), USER_ID: prop_('USER_ID'), API_CERT_KEY: cert, LAN_TYPE: 'ko-KR', ZONE: zone });
  var id = r && r.Data && r.Data.Datas && r.Data.Datas.SESSION_ID;
  if (!id) throw new Error('이카운트 로그인 실패: ' + ((r && r.Data && r.Data.Message) || (r && r.Error && r.Error.Message) || JSON.stringify(r).slice(0, 200)));
  c.put(k, id, 1200); return { id: id, zone: zone };
}

function call_(test, path, body) {
  var s = session_(test, false);
  var r = post_(host_(test, s.zone) + path + '?SESSION_ID=' + encodeURIComponent(s.id), body);
  if (String(r.Status) !== '200' && /session|세션|로그인|login/i.test(JSON.stringify(r.Error || r.Errors || r.Data || ''))) {
    s = session_(test, true);   // 세션이 끝났으면 한 번 다시 로그인
    r = post_(host_(test, s.zone) + path + '?SESSION_ID=' + encodeURIComponent(s.id), body);
  }
  return r;
}
