/**
 * 빵을그리다(주) 통합재고관리 — 생산일지 중계 (Google Apps Script)  v3
 *
 * v3: 같은 날짜의 생산을 정해진 시각(holdUntil)까지 모아 두었다가 한 전표로 합쳐 전송기에 넘깁니다.
 *     (같은 품목은 수량을 더함 · 「지금 보내기」 release · 들어가기 전 취소 cancel)
 * v3.1: 생산일지 설정 전달(putCfg/getCfg) — 관리자 PC가 올린 품목·작업자·설정을 다른 기기가 중계에서 받음
 *       최근 보낸 생산(recent) — 모든 기기의 「지난번 수량·생산 횟수」를 맞춤
 * v3.9: 발주 회신에 거래명세표 캡처 사진 (putOrderImg — 드라이브 「빵을그리다 주문서 사진」에 stm_<주문>.jpg, reply.img)
 * v3.8: 주문 링크 단가를 판매 저장 때마다 최근 단가로 (updFormPrices) · 단가 날짜 함께 보관
 * v3.7: 발주 회신(reply) — 확인·배송 안내·거래명세표를 거래처 주문서에 보여 줌 (orderDone에 reply)
 * v3.7: 드라이브에서 단가표 가져오기(catDriveList · catDriveRead) — 내 드라이브의 「…단가표….json」 파일을 읽음
 *       ※ 사진·단가표가 안 되면: 위 함수 목록에서 authorizeDrive 를 골라 ▷실행 → 권한 허용 (드라이브 권한은 배포만으로는 안 생김)
 * v3.6: 거래처 안내(신제품 출시 등) — 모든 주문서 맨 위에 보임, 기존 링크 그대로 (putNotices · getNotices)
 * v3.6: 단가표(카탈로그) — 거래처 주문서에서 빵을그리다 제품 전체를 보고 주문·샘플 신청 (putCatalog · getCatalog, 사진은 cat_<id>로 같은 사진 보관)
 * v3.5: 주문서 품목 사진 — 구글 드라이브 「빵을그리다 주문서 사진」 폴더에 품목코드.jpg로 보관(링크가 있는 사람 보기), orderForm에 그 주문서 품목의 사진 id를 함께 줌
 *       (처음 배포할 때 「구글 드라이브」 사용을 허용해야 합니다)
 * v3.4: 거래처 주문 링크 — 거래처마다 비밀 토큰으로 주문서(orderForm)를 열고 주문(orderSubmit)을 넣음 (열쇠 없이, 토큰 한 곳의 자료만)
 *       통합재고관리(열쇠 필요): putOrderForm · delOrderForm · listOrderForms · orders · orderDone
 * v3.2: 로그인 계정(acct · putAcct · delAcct · listAcct)과 접속 이력(logLogin · logins)
 *       계정에는 「재고 비밀번호」를 그 사람 비밀번호로 잠근 값만 보관합니다 (이 중계는 비밀번호를 모름)
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

// 드라이브 권한 받기 — 편집기에서 이 함수를 골라 ▷실행 하고 「허용」을 누르면 사진·단가표 가져오기가 됩니다
function authorizeDrive() { DriveApp.getRootFolder(); imgDir_(); return 'ok'; }

function doPost(e) {
  var out;
  try { out = handle_(JSON.parse((e && e.postData && e.postData.contents) || '{}')); }
  catch (err) { out = { ok: false, error: String((err && err.message) || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'wonryo-ecount-relay', version: 3.9 }))
    .setMimeType(ContentService.MimeType.JSON);
}

var ACCT_ = 'acct:', LOG_ = 'login:', LOG_KEEP_DAYS_ = 120;
function acctId_(v) { return String(v == null ? '' : v).replace(/\s/g, '').slice(0, 30); }
function ymd_(d) { return Utilities.formatDate(d, 'Asia/Seoul', 'yyyyMMdd'); }
function logAdd_(en) {
  en = en || {}; var t = String(en.t || new Date().toISOString()), d = new Date(t); if (isNaN(d.getTime())) d = new Date();
  var row = [t.slice(0, 25), acctId_(en.id), String(en.dev || '').slice(0, 40), String(en.ua || '').slice(0, 40), String(en.how || '').slice(0, 10)];
  var k = LOG_ + ymd_(d), arr = []; try { arr = JSON.parse(props_().getProperty(k) || '[]'); } catch (e) {}
  if (arr.some(function (r) { return r[0] === row[0] && r[1] === row[1]; })) return;   // 같은 건 두 번 받지 않음
  arr.push(row); arr.sort(function (a, b) { return String(a[0]).localeCompare(String(b[0])); });
  while (JSON.stringify(arr).length > 8500) arr.shift();
  props_().setProperty(k, JSON.stringify(arr));
  var cut = ymd_(new Date(Date.now() - LOG_KEEP_DAYS_ * 86400000)), all = props_().getKeys();
  all.forEach(function (x) { if (x.indexOf(LOG_) === 0 && x.slice(LOG_.length) < cut) props_().deleteProperty(x); });
}
var JOB_ = 'job:', KEEP_MS_ = 3 * 24 * 3600 * 1000, TAKE_MS_ = 3 * 60 * 1000;
function props_() { return PropertiesService.getScriptProperties(); }
function getJob_(id) { var v = props_().getProperty(JOB_ + id); return v ? JSON.parse(v) : null; }
function putJob_(j) { props_().setProperty(JOB_ + j.id, JSON.stringify(j)); }
function view_(j) { return j ? { id: j.id, kind: j.kind || '', status: j.status, result: j.result || null, ts: j.ts, doneAt: j.doneAt || '', holdUntil: j.holdUntil || 0, date: j.date || '', mergedInto: j.mergedInto || '' } : null; }
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
function agentVer_() { return Number(props_().getProperty('agent:ver') || 2); }   // v3.3: 사무실 PC 전송기 버전 (3부터 판매입력)
function prune_() {
  var all = props_().getProperties(), now = Date.now();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf(JOB_) !== 0) return;
    try { var j = JSON.parse(all[k]); if (now - new Date(j.ts).getTime() > KEEP_MS_) props_().deleteProperty(k); } catch (e) { props_().deleteProperty(k); }
  });
}

// ── v3.4 거래처 주문 링크 ──
var ORDF_ = 'ordf:', ORD_ = 'ord:', ORD_KEEP_DAYS_ = 45;
function tok_(v) { var t = String(v || '').replace(/[^A-Za-z0-9_-]/g, ''); return t.length >= 16 && t.length <= 64 ? t : ''; }
function kst_(d) { return new Date((d ? d.getTime() : Date.now()) + 9 * 3600000); }   // 한국 시각을 UTC 필드로
function ymdK_(d) { var k = kst_(d); return k.getUTCFullYear() + '-' + ('0' + (k.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + k.getUTCDate()).slice(-2); }
// 배송일이 주문 가능한지: 허용 요일이고, (배송일 - lead일) cutoff시(한국 시각) 전
function shipOk_(f, ship) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ship || '')) return false;
  var p = ship.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  if ((f.days || []).indexOf(d.getUTCDay()) < 0) return false;
  var dl = Date.UTC(+p[0], +p[1] - 1, +p[2] - (Number(f.lead) || 0), Number(f.cut == null ? 15 : f.cut), 0) - 9 * 3600000;   // 한국 시각 → UTC
  return Date.now() < dl && d.getTime() - Date.now() < 45 * 86400000;
}
function ordList_(filter) { var all = props_().getProperties(), out = [], cut = Date.now() - ORD_KEEP_DAYS_ * 86400000;
  Object.keys(all).forEach(function (k) { if (k.indexOf(ORD_) !== 0) return; var o; try { o = JSON.parse(all[k]); } catch (e) { props_().deleteProperty(k); return; }
    if (new Date(o.at).getTime() < cut) { props_().deleteProperty(k); return; } if (!filter || filter(o)) out.push(o); });
  return out.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }); }
var IMG_MAP_ = 'oimg:map', IMG_DIR_ = 'oimg:folder';
function imgMap_() { try { return JSON.parse(props_().getProperty(IMG_MAP_) || '{}'); } catch (e) { return {}; } }
function imgDir_() { var id = props_().getProperty(IMG_DIR_); if (id) { try { var d = DriveApp.getFolderById(id); if (!d.isTrashed()) return d; } catch (e) {} }
  var f = DriveApp.createFolder('빵을그리다 주문서 사진'); try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {} props_().setProperty(IMG_DIR_, f.getId()); return f; }
var CAT_ = 'cat:';
function catGet_() { var meta = props_().getProperty(CAT_ + 'meta'); if (!meta) return null; var m = JSON.parse(meta), parts = []; for (var i = 0; i < m.n; i++) parts.push(props_().getProperty(CAT_ + i) || '');
  try { m.items = JSON.parse(parts.join('') || '[]'); } catch (e) { m.items = []; } return m; }
function catPut_(c) { var old = props_().getProperty(CAT_ + 'meta'); if (old) { var om = JSON.parse(old); for (var i = 0; i < om.n; i++) props_().deleteProperty(CAT_ + i); }
  var js = JSON.stringify(c.items || []), n = 0; for (var p = 0; p < js.length; p += 8000) { props_().setProperty(CAT_ + n, js.slice(p, p + 8000)); n++; }
  props_().setProperty(CAT_ + 'meta', JSON.stringify({ n: n, title: String(c.title || '').slice(0, 60), on: c.on !== false, at: new Date().toISOString() })); }
function noticesGet_() { try { return JSON.parse(props_().getProperty('ord:notices') || '[]'); } catch (e) { return []; } }
function noticesLive_(im) { var t = ymdK_(); return noticesGet_().filter(function (n) { return n.on !== false && (!n.from || n.from <= t) && (!n.to || n.to >= t); }).map(function (n) { return { id: n.id, title: n.title, body: n.body || '', cat: n.cat || '', img: n.cat ? (im['cat_' + n.cat] || '') : '', from: n.from || '', pin: !!n.pin }; }); }
function catPublic_(cat, im) { if (!cat || cat.on === false) return null; return { title: cat.title, items: (cat.items || []).filter(function (it) { return !it.hide; }).map(function (it) { return { id: it.id, grp: it.grp, name: it.name, spec: it.spec || '', pe: it.pe == null ? null : it.pe, pb: it.pb == null ? null : it.pb, bq: it.bq || null, unit: it.unit || 'Box', img: im['cat_' + it.id] || '' }; }) }; }
function ordView_(o) { return { id: o.id, at: o.at, ship: o.ship, memo: o.memo || '', lines: o.lines, status: o.status, slip: o.slip || '', doneAt: o.doneAt || '', note: o.note || '', reply: o.reply || null }; }
function reply_(old, r) { var o = old || {}, s = function (v, n) { return String(v == null ? '' : v).slice(0, n); };
  if (r.msg != null) o.msg = s(r.msg, 400); if (r.st != null) o.st = s(r.st, 8); if (r.ship != null && /^\d{4}-\d{2}-\d{2}$/.test(r.ship)) o.ship = r.ship; if (r.dlv != null) o.dlv = s(r.dlv, 12); if (r.box != null) o.box = Math.max(0, Math.min(9999, Math.floor(Number(r.box) || 0)));
  if (r.slip != null) o.slip = s(r.slip, 60); if (r.lines) { o.lines = r.lines.slice(0, 80).map(function (l) { return [s(l[0], 60), num_(l[1]), num_(l[2]), num_(l[3]), num_(l[4])]; }); o.sup = num_(r.sup); o.vat = num_(r.vat); }
  o.at = new Date().toISOString(); return o; }

function handle_(req) {
  // v3.2: 로그인 화면 — 아이디 하나의 잠긴 계정 값만 돌려줌 (열쇠 없이, 목록은 주지 않음)
  if (req.action === 'acct') { var aid = acctId_(req.id); if (!aid) return { ok: true, acct: null };
    var av = props_().getProperty(ACCT_ + aid); return { ok: true, acct: av ? JSON.parse(av) : null }; }
  // v3.4: 거래처 주문서 열기 (토큰 한 곳의 주문서와 최근 주문만)
  if (req.action === 'orderForm') { var t1 = tok_(req.t); var fv = t1 && props_().getProperty(ORDF_ + t1); if (!fv) return { ok: false, error: '주문 링크가 맞지 않거나 사용이 멈춰 있습니다 — 빵을그리다에 문의해 주세요' };
    var f1 = JSON.parse(fv); if (f1.on === false) return { ok: false, error: '이 주문 링크는 지금 사용이 멈춰 있습니다 — 빵을그리다에 문의해 주세요' };
    var mine = ordList_(function (o) { return o.tok === t1; }).slice(0, 10).map(ordView_);
    var im1 = imgMap_(), imgs = {}; (f1.items || []).forEach(function (it) { if (im1[it[0]]) imgs[it[0]] = im1[it[0]]; });
    return { ok: true, form: { name: f1.name, items: f1.items, days: f1.days, cut: f1.cut, lead: f1.lead, price: !!f1.price, last: f1.last || [], note: f1.note || '', imgs: imgs, cat: f1.cat === false ? null : catPublic_(catGet_(), im1), notices: noticesLive_(im1) }, orders: mine, now: new Date().toISOString() }; }
  // v3.4: 거래처 주문 넣기 — 품목은 그 주문서에 있는 것만, 수량 1~9999, 배송일·마감 확인, 같은 cid는 한 번만, 하루 30건까지
  if (req.action === 'orderSubmit') { var t2 = tok_(req.t); var fv2 = t2 && props_().getProperty(ORDF_ + t2); if (!fv2) return { ok: false, error: '주문 링크가 맞지 않습니다' };
    var f2 = JSON.parse(fv2); if (f2.on === false) return { ok: false, error: '이 주문 링크는 사용이 멈춰 있습니다' };
    var cid = String(req.cid || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 30); if (!cid) return { ok: false, error: '주문 번호가 없습니다' };
    var lk2 = LockService.getScriptLock(); lk2.waitLock(15000);
    try {
      var oid = t2.slice(0, 6) + '_' + cid, ex = props_().getProperty(ORD_ + oid); if (ex) return { ok: true, order: ordView_(JSON.parse(ex)), dup: true };
      if (!shipOk_(f2, String(req.ship || ''))) return { ok: false, error: '고른 배송일은 주문 마감이 지났거나 배송하지 않는 날입니다 — 다른 날을 골라 주세요' };
      var codes = {}; (f2.items || []).forEach(function (it) { codes[it[0]] = it[1]; });
      var cat2 = f2.cat === false ? null : catGet_(), cmap = {}; ((cat2 && cat2.on !== false && cat2.items) || []).forEach(function (it) { if (!it.hide) cmap[it.id] = it; });
      var lines = []; (req.lines || []).slice(0, 80).forEach(function (l) { var c = String(l && l[0] || ''), q = Math.floor(Number(l && l[1])), kd = String(l && l[2] || '') === 's' ? 's' : ''; if (!(q >= 1 && q <= 9999)) return;
        if (c.indexOf('cat:') === 0) { var ci = cmap[c.slice(4)]; if (!ci) return; lines.push([ci.code || c, ci.name + (ci.spec ? ' (' + ci.spec + ')' : ''), q, kd || 'c']); }   // 단가표 제품: 이카운트 코드가 있으면 그 코드, 없으면 cat:id
        else if (codes[c] != null) lines.push([c, codes[c], q, kd]); });
      if (!lines.length) return { ok: false, error: '주문할 품목의 수량을 넣어 주세요' };
      var today = ymdK_(), nToday = ordList_(function (o) { return o.tok === t2 && ymdK_(new Date(o.at)) === today; }).length; if (nToday >= 30) return { ok: false, error: '오늘 주문이 너무 많습니다 — 빵을그리다에 문의해 주세요' };
      var o2 = { id: oid, tok: t2, cust: f2.cust, name: f2.name, at: new Date().toISOString(), ship: String(req.ship), memo: String(req.memo || '').slice(0, 300), who: String(req.who || '').slice(0, 30), lines: lines, status: 'new' };
      props_().setProperty(ORD_ + oid, JSON.stringify(o2));
      return { ok: true, order: ordView_(o2) };
    } finally { lk2.releaseLock(); } }
  var key = props_().getProperty('API_KEY');
  if (!key) return { ok: false, error: '중계의 스크립트 속성 API_KEY가 비어 있습니다' };
  if (req.key !== key) return { ok: false, error: '열쇠가 맞지 않습니다 — 「공유 저장소 열쇠 복사」 값을 중계의 API_KEY에 넣었는지 확인하세요' };

  // v3.2: 계정 관리 (관리자 화면)
  if (req.action === 'listAcct') { var al = props_().getProperties(), outA = [];
    Object.keys(al).forEach(function (k) { if (k.indexOf(ACCT_) !== 0) return; try { var a = JSON.parse(al[k]); outA.push({ id: a.id, role: a.role || 'staff', at: a.at || '', by: a.by || '' }); } catch (e) {} });
    return { ok: true, accts: outA }; }
  if (req.action === 'putAcct') { var a2 = req.acct || {}, id2 = acctId_(a2.id);
    if (!id2 || !a2.s || !a2.iv || !a2.ct) return { ok: false, error: '계정 정보가 비어 있습니다' };
    props_().setProperty(ACCT_ + id2, JSON.stringify({ id: id2, role: a2.role === 'admin' ? 'admin' : 'staff', s: String(a2.s), i: Number(a2.i) || 600000, iv: String(a2.iv), ct: String(a2.ct), at: new Date().toISOString(), by: acctId_(req.by) }));
    return { ok: true }; }
  if (req.action === 'delAcct') { var id3 = acctId_(req.id); if (id3) props_().deleteProperty(ACCT_ + id3); return { ok: true }; }
  // v3.2: 접속 이력 — 날짜별로 보관 (최근 120일)
  if (req.action === 'logLogin') { var lk = LockService.getScriptLock(); lk.waitLock(10000);
    try { (req.entries || []).slice(0, 50).forEach(function (en) { logAdd_(en); }); } finally { lk.releaseLock(); }
    return { ok: true }; }
  if (req.action === 'logins') { var days = Math.min(Math.max(Number(req.days) || 30, 1), 120), lg = [], now2 = Date.now();
    for (var di = 0; di < days; di++) { var dv = props_().getProperty(LOG_ + ymd_(new Date(now2 - di * 86400000))); if (dv) { try { lg = lg.concat(JSON.parse(dv).reverse()); } catch (e) {} } }
    return { ok: true, logins: lg }; }

  if (req.action === 'ping') return { ok: true, version: 3.9, agentSeen: agentSeen_(), agentVer: agentVer_() };
  // v3.4: 주문 링크 관리 (통합재고관리)
  if (req.action === 'putOrderForm') { var t3 = tok_(req.t), f3 = req.form || {}; if (!t3 || !f3.cust) return { ok: false, error: '토큰·거래처가 없습니다' };
    var keep = { cust: String(f3.cust).slice(0, 40), name: String(f3.name || '').slice(0, 60), items: (f3.items || []).slice(0, 50).map(function (it) { return [String(it[0]).slice(0, 30), String(it[1]).slice(0, 60), it[2] == null ? null : num_(it[2]), it[3] == null ? null : num_(it[3]), /^\d{4}-\d{2}-\d{2}$/.test(it[4] || '') ? it[4] : '']; }),
      days: (f3.days || []).map(Number).filter(function (x) { return x >= 0 && x <= 6; }), cut: Math.min(23, Math.max(0, Number(f3.cut == null ? 15 : f3.cut))), lead: Math.min(7, Math.max(0, Number(f3.lead == null ? 1 : f3.lead))),
      price: !!f3.price, last: (f3.last || []).slice(0, 50).map(function (x) { return [String(x[0]).slice(0, 30), num_(x[1])]; }), note: String(f3.note || '').slice(0, 200), on: f3.on !== false, at: new Date().toISOString() };
    var js3 = JSON.stringify(keep); if (js3.length > 8800) return { ok: false, error: '품목이 너무 많습니다 — 40개 이하로 줄여 주세요' };
    props_().setProperty(ORDF_ + t3, js3); return { ok: true }; }
  // v3.5: 주문서 품목 사진 (품목 하나에 한 장 — 모든 거래처 주문서에 같이 나옴)
  if (req.action === 'listItemImgs') return { ok: true, imgs: imgMap_() };
  if (req.action === 'putItemImg') { var code = String(req.code || '').slice(0, 30), m6 = String(req.data || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+\/=]+)$/);
    if (!code || !m6) return { ok: false, error: '사진 자료가 올바르지 않습니다' }; if (m6[2].length > 1400000) return { ok: false, error: '사진이 너무 큽니다' };
    var lk6 = LockService.getScriptLock(); lk6.waitLock(20000);
    try { var dir = imgDir_(), map6 = imgMap_(); if (map6[code]) { try { DriveApp.getFileById(map6[code]).setTrashed(true); } catch (e) {} }
      var blob = Utilities.newBlob(Utilities.base64Decode(m6[2]), 'image/' + m6[1], code.replace(/[^A-Za-z0-9_.-]/g, '_') + '.' + (m6[1] === 'jpeg' ? 'jpg' : m6[1]));
      var file = dir.createFile(blob); file.setDescription(String(req.name || '').slice(0, 100)); try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { file.setTrashed(true); return { ok: false, error: '드라이브가 「링크가 있는 모든 사용자」 공유를 막았습니다: ' + e.message }; }
      map6[code] = file.getId(); var js6 = JSON.stringify(map6); if (js6.length > 8800) return { ok: false, error: '사진 목록이 가득 찼습니다' }; props_().setProperty(IMG_MAP_, js6);
      return { ok: true, id: file.getId() }; } finally { lk6.releaseLock(); } }
  if (req.action === 'delItemImg') { var code7 = String(req.code || ''), map7 = imgMap_(); if (map7[code7]) { try { DriveApp.getFileById(map7[code7]).setTrashed(true); } catch (e) {} delete map7[code7]; props_().setProperty(IMG_MAP_, JSON.stringify(map7)); } return { ok: true }; }
  // v3.6: 단가표(카탈로그)
  if (req.action === 'getCatalog') return { ok: true, cat: catGet_() };
  if (req.action === 'catDriveList') { var it9 = DriveApp.searchFiles("title contains '단가표' and trashed = false"), L9 = [];
    while (it9.hasNext() && L9.length < 40) { var f9 = it9.next(); if (!/\.json$/i.test(f9.getName())) continue; L9.push({ id: f9.getId(), name: f9.getName(), at: f9.getLastUpdated().toISOString(), size: f9.getSize() }); }
    L9.sort(function (a, b) { return a.at < b.at ? 1 : -1; }); return { ok: true, files: L9.slice(0, 10) }; }
  if (req.action === 'catDriveRead') { var fr = DriveApp.getFileById(String(req.id || '')); if (fr.getSize() > 4000000) return { ok: false, error: '파일이 너무 큽니다' };
    var jr; try { jr = JSON.parse(fr.getBlob().getDataAsString('UTF-8')); } catch (e) { return { ok: false, error: '단가표 파일을 읽지 못했습니다' }; }
    if (!jr || jr.kind !== 'bggd-catalog') return { ok: false, error: '빵을그리다 단가표 파일이 아닙니다' }; return { ok: true, cat: jr, name: fr.getName() }; }
  if (req.action === 'getNotices') return { ok: true, notices: noticesGet_() };
  if (req.action === 'putNotices') { var ns = (req.notices || []).slice(0, 30).map(function (n) { return { id: String(n.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20), title: String(n.title || '').slice(0, 60), body: String(n.body || '').slice(0, 500), cat: String(n.cat || '').slice(0, 20), from: /^\d{4}-\d{2}-\d{2}$/.test(n.from || '') ? n.from : '', to: /^\d{4}-\d{2}-\d{2}$/.test(n.to || '') ? n.to : '', on: n.on !== false, pin: !!n.pin, at: String(n.at || new Date().toISOString()).slice(0, 30) }; }).filter(function (n) { return n.id && n.title; });
    var jsn = JSON.stringify(ns); if (jsn.length > 8800) return { ok: false, error: '안내가 너무 깁니다 — 오래된 안내를 지워 주세요' }; props_().setProperty('ord:notices', jsn); return { ok: true, n: ns.length }; }
  if (req.action === 'putCatalog') { var c8 = req.cat || {}; var items8 = (c8.items || []).slice(0, 300).map(function (it) { return { id: String(it.id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20), grp: String(it.grp || '완제품').slice(0, 10), name: String(it.name || '').slice(0, 60), spec: String(it.spec || '').slice(0, 40), pe: it.pe == null || it.pe === '' ? null : num_(it.pe), pb: it.pb == null || it.pb === '' ? null : num_(it.pb), bq: it.bq ? num_(it.bq) : null, unit: String(it.unit || 'Box').slice(0, 8), code: String(it.code || '').slice(0, 30), hide: !!it.hide }; }).filter(function (it) { return it.id && it.name; });
    catPut_({ items: items8, title: c8.title, on: c8.on }); return { ok: true, n: items8.length }; }
  if (req.action === 'putOrderImg') { var lk10 = LockService.getScriptLock(); lk10.waitLock(20000);
    try { var ov10 = props_().getProperty(ORD_ + String(req.id || '')); if (!ov10) return { ok: false, error: '없는 주문입니다' }; var o10 = JSON.parse(ov10); o10.reply = o10.reply || {};
      if (o10.reply.img) { try { DriveApp.getFileById(o10.reply.img).setTrashed(true); } catch (e) {} delete o10.reply.img; }
      if (!req.del) { var m10 = String(req.data || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+\/=]+)$/); if (!m10) return { ok: false, error: '사진 자료가 올바르지 않습니다' }; if (m10[2].length > 2800000) return { ok: false, error: '사진이 너무 큽니다' };
        var f10 = imgDir_().createFile(Utilities.newBlob(Utilities.base64Decode(m10[2]), 'image/' + m10[1], 'stm_' + o10.id.replace(/[^A-Za-z0-9_-]/g, '_') + '.' + (m10[1] === 'jpeg' ? 'jpg' : m10[1])));
        f10.setDescription('거래명세표 · ' + String(o10.name || '').slice(0, 60)); try { f10.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { f10.setTrashed(true); return { ok: false, error: '드라이브가 링크 공유를 막았습니다: ' + e.message }; }
        o10.reply.img = f10.getId(); }
      o10.reply.at = new Date().toISOString(); props_().setProperty(ORD_ + o10.id, JSON.stringify(o10)); return { ok: true, img: o10.reply.img || '' }; } finally { lk10.releaseLock(); } }
  // v3.8: 판매를 저장할 때 그 거래처 주문 링크의 단가를 가장 최근 날짜 단가로 바꿈 (prices: {코드: [단가, 날짜]})
  if (req.action === 'updFormPrices') { var cu9 = String(req.cust || ''), pr9 = req.prices || {}, n9 = 0, all9 = props_().getProperties();
    Object.keys(all9).forEach(function (k) { if (k.indexOf(ORDF_) !== 0) return; var f = JSON.parse(all9[k]); if (f.cust !== cu9) return; var ch = false;
      (f.items || []).forEach(function (it) { var v = pr9[it[0]]; if (!v || !(num_(v[0]) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(v[1] || '') || (it[4] && it[4] > v[1])) return; it[2] = num_(v[0]); it[4] = v[1]; ch = true; });
      if (ch) { props_().setProperty(k, JSON.stringify(f)); n9++; } }); return { ok: true, forms: n9 }; }
  if (req.action === 'setOrderFormOn') { var t5 = tok_(req.t), v5 = t5 && props_().getProperty(ORDF_ + t5); if (!v5) return { ok: false, error: '없는 링크입니다' }; var f5 = JSON.parse(v5); f5.on = !!req.on; props_().setProperty(ORDF_ + t5, JSON.stringify(f5)); return { ok: true }; }
  if (req.action === 'delOrderForm') { var t4 = tok_(req.t); if (t4) props_().deleteProperty(ORDF_ + t4); return { ok: true }; }
  if (req.action === 'listOrderForms') { var af = props_().getProperties(), lf = [];
    Object.keys(af).forEach(function (k) { if (k.indexOf(ORDF_) !== 0) return; try { var f = JSON.parse(af[k]); lf.push({ t: k.slice(ORDF_.length), cust: f.cust, name: f.name, on: f.on !== false, at: f.at, n: (f.items || []).length, codes: (f.items || []).map(function (it) { return it[0]; }), days: f.days, cut: f.cut, lead: f.lead, price: !!f.price }); } catch (e) {} });
    return { ok: true, forms: lf }; }
  if (req.action === 'orders') { var since = Date.now() - Math.min(45, Math.max(1, Number(req.days) || 14)) * 86400000;
    return { ok: true, orders: ordList_(function (o) { return o.status === 'new' || new Date(o.at).getTime() >= since; }).slice(0, 200).map(function (o) { var v = ordView_(o); v.cust = o.cust; v.name = o.name; v.tok = o.tok; v.who = o.who || ''; return v; }) }; }
  if (req.action === 'orderDone') { var lk3 = LockService.getScriptLock(); lk3.waitLock(10000);
    try { var ov = props_().getProperty(ORD_ + String(req.id || '')); if (!ov) return { ok: false, error: '없는 주문입니다' }; var o3 = JSON.parse(ov);
      if (req.status) o3.status = String(req.status).slice(0, 12); if (req.slip != null) o3.slip = String(req.slip).slice(0, 60); if (req.note != null) o3.note = String(req.note).slice(0, 200); if (req.reply) o3.reply = reply_(o3.reply, req.reply);
      o3.doneAt = new Date().toISOString(); o3.by = String(req.by || '').slice(0, 30); props_().setProperty(ORD_ + o3.id, JSON.stringify(o3)); return { ok: true, order: ordView_(o3) }; } finally { lk3.releaseLock(); } }
  // 생산일지 설정 받기 (모든 기기)
  if (req.action === 'getCfg') { var meta = props_().getProperty('cfg:meta'); if (!meta) return { ok: true, cfg: null };
    var mm = JSON.parse(meta), parts = []; for (var ci = 0; ci < mm.n; ci++) parts.push(props_().getProperty('cfg:' + ci) || '');
    return { ok: true, cfg: { ts: mm.ts, user: mm.user || '', device: mm.device || '', note: parts.join('') } }; }
  // 최근 이카운트에 들어간 생산 (테스트 제외, 합친 전표는 원래 건 기준) — 다른 기기의 지난번 수량 맞추기
  if (req.action === 'recent') { var ra = props_().getProperties(), out2 = [];
    Object.keys(ra).forEach(function (k) { if (k.indexOf(JOB_) !== 0) return; var q; try { q = JSON.parse(ra[k]); } catch (e) { return; }
      if (q.status !== 'sent' || q.test || q.members || q.kind) return;   // 생산입고만 (판매·권한 확인 제외)
      out2.push({ id: q.id, date: q.date || ((q.rows && q.rows[0] && q.rows[0].IO_DATE) || ''), at: q.doneAt || q.ts, l: (q.rows || []).map(function (r) { return [r.PROD_CD, num_(r.QTY)]; }) }); });
    return { ok: true, jobs: out2.slice(-300) }; }

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
    // v3.3: 판매입력 한 건(한 거래처 전표)을 대기열에 넣음 (같은 clientId는 한 번만)
    if (req.action === 'saveSale') {
      var sid = String(req.clientId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
      if (!sid) return { ok: false, error: 'clientId가 없습니다' };
      var srows = (req.rows || []).map(function (r) { var b = {}; Object.keys(r).forEach(function (k) { if (r[k] !== '' && r[k] != null) b[k] = String(r[k]); }); if (!b.UPLOAD_SER_NO) b.UPLOAD_SER_NO = '1'; return b; });
      if (!srows.length) return { ok: false, error: '보낼 품목이 없습니다' };
      var sj = getJob_(sid);
      if (!sj) { prune_(); sj = { id: sid, kind: 'sale', test: !!req.test, rows: srows, ts: new Date().toISOString(), status: 'queued', who: String(req.who || '').slice(0, 30), date: String(srows[0].IO_DATE || '') }; putJob_(sj); }
      return { ok: true, queued: true, job: view_(sj), agentSeen: agentSeen_(), agentVer: agentVer_() };
    }
    // v3.3: 판매입력(Sale/SaveSale) 권한 확인 — 사무실 PC 전송기가 일부러 빈 품목 한 줄을 보내 이카운트 답으로 권한만 확인 (전표는 만들어지지 않음)
    if (req.action === 'checkSale') {
      prune_(); var ck = { id: 'CK' + Date.now().toString(36), kind: 'saleCheck', test: !!req.test, rows: [], ts: new Date().toISOString(), status: 'queued', who: String(req.who || '').slice(0, 30), date: '' };
      putJob_(ck); return { ok: true, queued: true, job: view_(ck), agentSeen: agentSeen_(), agentVer: agentVer_() };
    }
    // 휴대폰: 보낸 건들의 처리 결과
    if (req.action === 'status') {
      var out = {}; (req.ids || []).slice(0, 50).forEach(function (x) { out[x] = view_(getJob_(String(x))); });
      return { ok: true, jobs: out, agentSeen: agentSeen_(), agentVer: agentVer_() };
    }
    // 관리자 PC: 생산일지 설정 올리기 (속성 하나에 9KB까지라 나눠 저장)
    if (req.action === 'putCfg') {
      var note = String(req.note || ''), ts = String(req.ts || new Date().toISOString()); if (!note) return { ok: false, error: '설정이 비어 있습니다' };
      var old = props_().getProperty('cfg:meta'); if (old) { var om = JSON.parse(old); if (om.ts && om.ts > ts) return { ok: true, skipped: true }; for (var oi = 0; oi < om.n; oi++) props_().deleteProperty('cfg:' + oi); }
      var n = 0; for (var pi = 0; pi < note.length; pi += 8000) { props_().setProperty('cfg:' + n, note.slice(pi, pi + 8000)); n++; }
      props_().setProperty('cfg:meta', JSON.stringify({ ts: ts, n: n, user: String(req.user || '').slice(0, 30), device: String(req.device || '').slice(0, 40) }));
      return { ok: true };
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
      props_().setProperty('agent:seen', new Date().toISOString()); props_().setProperty('agent:ver', String(Number(req.ver) || 2));
      var all = props_().getProperties(), now = Date.now(), list = [], ready = {};
      Object.keys(all).forEach(function (k) {
        if (k.indexOf(JOB_) !== 0) return; var jj; try { jj = JSON.parse(all[k]); } catch (e) { return; }
        if (jj.kind && !(Number(req.ver) >= 3)) return;   // 판매·확인 건은 v3 이상 전송기만 (v2는 모두 생산입고로 보내므로)
        if (jj.status === 'taken' && !jj.mergedInto && now - new Date(jj.takenAt).getTime() > TAKE_MS_) {   // 가져갔는데 결과가 안 온 건(합친 건 포함)은 같은 id로 다시 줌
          jj.takenAt = new Date().toISOString(); putJob_(jj); list.push({ id: jj.id, test: jj.test, kind: jj.kind || '', rows: jj.rows }); return; }
        if (jj.status === 'queued' && jj.kind) { jj.status = 'taken'; jj.takenAt = new Date().toISOString(); putJob_(jj); list.push({ id: jj.id, test: jj.test, kind: jj.kind, rows: jj.rows }); return; }   // 판매·확인 건은 합치지 않음
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
