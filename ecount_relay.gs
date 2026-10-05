/**
 * 빵을그리다(주) 통합재고관리 — 생산일지 중계 (Google Apps Script)  v3
 *
 * v3: 같은 날짜의 생산을 정해진 시각(holdUntil)까지 모아 두었다가 한 전표로 합쳐 전송기에 넘깁니다.
 *     (같은 품목은 수량을 더함 · 「지금 보내기」 release · 들어가기 전 취소 cancel)
 * v3.1: 생산일지 설정 전달(putCfg/getCfg) — 관리자 PC가 올린 품목·작업자·설정을 다른 기기가 중계에서 받음
 *       최근 보낸 생산(recent) — 모든 기기의 「지난번 수량·생산 횟수」를 맞춤
 * v5.3: 대화 메시지 지우기 — 보낸 사람만 자기 메시지를 지움(chatDel 거래처 · chatAdmin del 관리), 양쪽 화면에서 같이 사라짐
 * v5.2: 빠른 알림 — pulse(관리 앱이 10초마다 「바뀐 것 있나」만 묻는 가벼운 요청, pl:o 주문·pl:c 대화 시각) · 관리 앱이 3분 안에 확인 중이면 거래처 메시지 메일은 생략(보내기가 빨라짐)
 * v5.1: 거래처 대화(chat:<토큰16자> — 거래처 주문서 ↔ 앱 발주 알림창, 거래처 글은 알림 메일도) · chatGet/chatSend(거래처) · chatList/chatAdmin/chatRead(관리)
 * v5.0: 품절(cfg2:shop so — 주문서에서 못 담음)·최소 주문 금액(min, 공급가액)·정기 주문(repeat — 매주/2주마다 같은 주문을 발주 확인 뒤 자동으로 다음 회차)·거래처별 사용 현황(usage, seen:)
 * v5.0: 휴무일(cfg2:holidays — 배송일로 못 고름) · 거래처 주문 수정/취소(발주 확인 전까지, editOf·orderCancel) · 월별 주문 내역(orderHistory, 드라이브 보관분 포함)
 * v5.0: 저장 공간 정리(처리 끝난 지 10일 지난 주문 → 드라이브 「빵을그리다 중계 자료/주문 보관」 월별 파일), 매일 백업(14일치), 사용량 표시
 *       새 발주 알림 메일(MailApp, ALERT_EMAIL), 판매 기록·판매 설정을 모든 PC가 함께(드라이브 판매기록 파일 · cfg2:sale)
 *       ※ 처음 한 번: 편집기에서 setupAll 을 골라 ▷실행 → 「허용」(드라이브·메일·외부 연결 권한)
 * v4.2: 주문서 빠른 열기 — 앱이 거래처별 주문서를 그 링크 열쇠로 암호화해 보내면 중계가 GitHub 사이트 of/<이름>.txt 로 올림(ghPutFiles)
 *       스크립트 속성 GH_TOKEN(GitHub 열쇠, 이 저장소 Contents 쓰기만) 필요 · formSnaps: 여러 링크의 주문서 내용을 한 번에
 *       ※ 처음 한 번: 편집기에서 checkGithub 를 골라 ▷실행 → 「허용」(외부 연결 권한) — 실행 로그에 결과가 나옴
 * v4.1: 거래처 안내에 사진 여러 장(imgs — 드라이브 ntc_<안내>_<n>.jpg)과 자세히 보기 링크(url)
 * v4.0: 단가표 제품에 분류(sub)·규격 치수(dim)·단가 기준일(dt) — 생지 단가표
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

// v5.0: 처음 한 번 — 드라이브·메일·외부 연결 권한을 한꺼번에 받고 상태를 기록
function setupAll() { var r = []; try { DriveApp.getRootFolder(); dataDir_(); r.push('드라이브 정상'); } catch (e) { r.push('드라이브 실패: ' + e.message); }
  try { r.push('메일 정상 (오늘 남은 발송 ' + MailApp.getRemainingDailyQuota() + '통) · 알림 받는 주소: ' + alertTo_()); } catch (e) { r.push('메일 실패: ' + e.message); }
  try { checkGithub(); r.push('GitHub 확인은 위 줄 참고'); } catch (e) { r.push('GitHub 실패: ' + e.message); }
  Logger.log(r.join('\n')); return r.join(' / '); }
function dataDir_() { var id = props_().getProperty('dat:folder'); if (id) { try { var d = DriveApp.getFolderById(id); if (!d.isTrashed()) return d; } catch (e) {} }
  var f = DriveApp.createFolder('빵을그리다 중계 자료'); props_().setProperty('dat:folder', f.getId()); return f; }
function subDir_(name) { var it = dataDir_().getFoldersByName(name); return it.hasNext() ? it.next() : dataDir_().createFolder(name); }
function fileJson_(dir, name, def) { var it = dir.getFilesByName(name); if (!it.hasNext()) return { file: null, data: def }; var f = it.next(); try { return { file: f, data: JSON.parse(f.getBlob().getDataAsString('UTF-8')) }; } catch (e) { return { file: f, data: def }; } }
function fileSave_(dir, name, f, data) { var js = JSON.stringify(data); if (f) f.setContent(js); else dir.createFile(name, js, 'application/json'); }
function alertTo_() { return props_().getProperty('ALERT_EMAIL') || (function () { try { return Session.getEffectiveUser().getEmail(); } catch (e) { return ''; } })(); }
function propsUse_() { var all = props_().getProperties(), n = 0; Object.keys(all).forEach(function (k) { n += k.length + String(all[k]).length; }); return n; }
// 처리 끝난 지 10일 지난 주문(새 발주 제외)과 40일 지난 모든 주문은 드라이브 월별 파일로 옮김 · 하루 한 번 백업
function maint_(force) { var last = Number(props_().getProperty('mt:last') || 0); if (!force && Date.now() - last < 6 * 3600e3) return null; props_().setProperty('mt:last', String(Date.now()));
  var lk = LockService.getScriptLock(); if (!lk.tryLock(5000)) return null; var moved = 0;
  try { var all = props_().getProperties(), dir = subDir_('주문 보관'), byM = {};
    Object.keys(all).forEach(function (k) { if (k.indexOf(ORD_) !== 0 || k === 'ord:notices') return; var o; try { o = JSON.parse(all[k]); } catch (e) { return; } if (!o || !o.id || !o.tok) return;
      var age = Date.now() - new Date(o.doneAt || o.at).getTime(), old = Date.now() - new Date(o.at).getTime();
      if ((o.status !== 'new' && age > 10 * 86400e3) || old > 40 * 86400e3) { var m = String(o.at).slice(0, 7); (byM[m] = byM[m] || []).push([k, o]); } });
    Object.keys(byM).forEach(function (m) { var nm = 'orders_' + m + '.json', fj = fileJson_(dir, nm, []), ids = {}; fj.data.forEach(function (o) { ids[o.id] = 1; });
      byM[m].forEach(function (x) { if (!ids[x[1].id]) fj.data.push(x[1]); }); fileSave_(dir, nm, fj.file, fj.data); byM[m].forEach(function (x) { props_().deleteProperty(x[0]); moved++; }); });
    var day = ymdK_(); if (props_().getProperty('bk:last') !== day) { var bd = subDir_('백업'), snap = {}; all = props_().getProperties(); Object.keys(all).forEach(function (k) { if (k !== 'API_KEY' && k !== 'GH_TOKEN') snap[k] = all[k]; });
      bd.createFile('relay_backup_' + day + '.json', JSON.stringify({ at: new Date().toISOString(), props: snap }), 'application/json'); props_().setProperty('bk:last', day);
      var fs = bd.getFiles(), list = []; while (fs.hasNext()) { var f = fs.next(); if (/^relay_backup_/.test(f.getName())) list.push(f); } list.sort(function (a, b) { return a.getName() < b.getName() ? 1 : -1; }); list.slice(14).forEach(function (f) { f.setTrashed(true); }); }
  } finally { lk.releaseLock(); } return { moved: moved }; }
function alertNew_(o, kind) { if (props_().getProperty('ALERT_OFF') === '1') return; var to = alertTo_(); if (!to) return;
  try { var n = o.lines.reduce(function (t, l) { return t + l[2]; }, 0);
    MailApp.sendEmail({ to: to, subject: '[빵을그리다] ' + (kind === '정기' ? '정기 발주 자동 접수' : kind ? '발주 ' + kind : '새 발주') + ' — ' + o.name + ' · 배송 ' + o.ship + ' · ' + o.lines.length + '품목 ' + n + '개', name: '빵을그리다 주문서',
      body: o.name + ' 새 발주\n배송일: ' + o.ship + (o.who ? '\n주문자: ' + o.who : '') + '\n\n' + o.lines.map(function (l) { return '· ' + l[1] + '  ' + l[2] + (l[3] === 's' ? ' (샘플)' : l[3] === 'c' ? ' (추가)' : ''); }).join('\n') + (o.memo ? '\n\n요청사항: ' + o.memo : '') + '\n\n통합 재고관리 → 판매 입력 → 발주 접수에서 확인하세요.' }); } catch (e) {} }
// 드라이브 권한 받기 — 편집기에서 이 함수를 골라 ▷실행 하고 「허용」을 누르면 사진·단가표 가져오기가 됩니다
// GitHub 열쇠 확인 — 편집기에서 ▷실행 (처음엔 외부 연결 권한 허용)
function checkGithub() { var t = props_().getProperty('GH_TOKEN'); if (!t) { Logger.log('GH_TOKEN 이 없습니다 — 프로젝트 설정 › 스크립트 속성에 넣어 주세요'); return; }
  var r = UrlFetchApp.fetch(GH_API_, { headers: { Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json' }, muteHttpExceptions: true }); var j = {}; try { j = JSON.parse(r.getContentText()); } catch (e) {}
  Logger.log(r.getResponseCode() === 200 ? ('GitHub 연결 정상 — 저장소 ' + j.full_name + (j.permissions && j.permissions.push ? ' · 쓰기 가능' : ' · ⚠ 쓰기 권한 없음')) : ('GitHub 연결 실패 ' + r.getResponseCode() + ': ' + (j.message || ''))); }
var GH_API_ = 'https://api.github.com/repos/lee1812-oss/wonryo';
function gh_(tok, m, p, b) { var o = { method: m, headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json' }, muteHttpExceptions: true }; if (b) { o.contentType = 'application/json'; o.payload = JSON.stringify(b); }
  var r = UrlFetchApp.fetch(GH_API_ + p, o), c = r.getResponseCode(), j = {}; try { j = JSON.parse(r.getContentText()); } catch (e) {} if (c >= 300) throw new Error('GitHub ' + c + ': ' + (j.message || '')); return j; }
function formOut_(f1, im1, catP, ntc, sh) { var imgs = {}; (f1.items || []).forEach(function (it) { if (im1[it[0]]) imgs[it[0]] = im1[it[0]]; });
  return { name: f1.name, items: f1.items, days: f1.days, cut: f1.cut, lead: f1.lead, price: !!f1.price, last: f1.last || [], note: f1.note || '', imgs: imgs, cat: f1.cat === false ? null : catP, notices: ntc, off: holidays_().filter(function (h) { return h.d >= ymdK_(); }), so: (sh && sh.so) || [], min: (sh && sh.min) || 0 }; }
// v5.0: 품절·최소 주문 금액 — so: 품목 코드 또는 cat:단가표id (단가표 제품의 이카운트 코드가 품절이면 cat:id 도 같이)
function shop_() { try { var v = JSON.parse(props_().getProperty('cfg2:shop') || '{}'); return { so: v.so || [], min: Number(v.min) || 0, at: v.at || '' }; } catch (e) { return { so: [], min: 0 }; } }
function pulse_(k) { try { props_().setProperty('pl:' + k, String(Date.now())); } catch (e) {} }
function chatKey_(t) { return 'chat:' + String(t).slice(0, 16); }
function chatGet_(t) { try { var v = JSON.parse(props_().getProperty(chatKey_(t)) || 'null'); if (v && v.m) return v; } catch (e) {} return { m: [], ra: '', rc: '' }; }
function chatPut_(t, c) { c.m = c.m.slice(-40); var js = JSON.stringify(c); while (js.length > 8500 && c.m.length > 1) { c.m.shift(); js = JSON.stringify(c); } props_().setProperty(chatKey_(t), js); }
function chatAdd_(t, w, text) { var tx = String(text || '').replace(/\s+$/, '').slice(0, 400); if (!tx.trim()) return null; var lk = LockService.getScriptLock(); lk.waitLock(10000);
  try { var c = chatGet_(t), now = new Date().toISOString(); if (w === 'c') { var rc = c.m.filter(function (x) { return x.w === 'c' && Date.now() - new Date(x.at).getTime() < 600e3; }).length; if (rc >= 15) return { err: '잠시 뒤에 다시 보내 주세요' }; }
    c.m.push({ w: w, t: tx, at: now }); if (w === 'a') c.ra = now; else c.rc = now; chatPut_(t, c); return c; } finally { lk.releaseLock(); } }
function chatDel_(t, w, at) { var lk = LockService.getScriptLock(); lk.waitLock(10000);
  try { var c = chatGet_(t), n = c.m.length; c.m = c.m.filter(function (x) { return !(x.w === w && x.at === at); }); if (c.m.length === n) return null; chatPut_(t, c); pulse_('c'); return c; } finally { lk.releaseLock(); } }
function chatList_() { var all = props_().getProperties(), F = {}, out = [];
  Object.keys(all).forEach(function (k) { if (k.indexOf(ORDF_) === 0) { try { var f = JSON.parse(all[k]); F[k.slice(ORDF_.length).slice(0, 16)] = { t: k.slice(ORDF_.length), name: f.name, cust: f.cust }; } catch (e) {} } });
  Object.keys(all).forEach(function (k) { if (k.indexOf('chat:') !== 0) return; var c; try { c = JSON.parse(all[k]); } catch (e) { return; } var f = F[k.slice(5)]; if (!f || !c.m || !c.m.length) return; var L = c.m[c.m.length - 1];
    out.push({ t: f.t, name: f.name, last: L.t.slice(0, 60), lw: L.w, at: L.at, un: c.m.filter(function (x) { return x.w === 'c' && x.at > (c.ra || ''); }).length }); });
  return out.sort(function (a, b) { return a.at < b.at ? 1 : -1; }); }
function shopPub_(cat) { var sh = shop_(), so = sh.so.slice(), set = {}; so.forEach(function (k) { set[k] = 1; }); ((cat && cat.items) || []).forEach(function (it) { if (it.code && set[it.code] && !set['cat:' + it.id]) so.push('cat:' + it.id); }); return { so: so, min: sh.min }; }
function repDue_(o) { return o.repeat && o.repeat.on && !o.repeat.nx && o.status !== 'reject' && (o.status !== 'new' || (o.reply && o.reply.st) || o.ship <= ymdK_()); }
function addDays_(ymd, n) { var p = ymd.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
// 정기 주문: 지난 회차가 발주 확인(또는 배송일 지남)되면 다음 회차(같은 품목)를 새 발주로 — 휴무·마감이면 하루씩 미루고, 그래도 안 되면 다음 주기로
function repeatGen_() { var all = props_().getProperties(), made = 0;
  Object.keys(all).forEach(function (k) { if (k.indexOf(ORD_) !== 0 || k === 'ord:notices') return; var o; try { o = JSON.parse(all[k]); } catch (e) { return; } if (!o || !o.id || !o.tok || !repDue_(o)) return;
    var fv = props_().getProperty(ORDF_ + o.tok); if (!fv) return; var f = JSON.parse(fv); if (f.on === false) return; var ev = o.repeat.ev === 14 ? 14 : 7, ship = '';
    for (var w = 1; w <= 4 && !ship; w++) for (var d = 0; d < 4 && !ship; d++) { var c = addDays_(o.ship, ev * w + d); if (shipOk_(f, c)) ship = c; }
    if (!ship) return; var nid = o.tok.slice(0, 6) + '_r' + Date.now().toString(36) + made;
    var n = { id: nid, tok: o.tok, cust: o.cust, name: o.name, at: new Date().toISOString(), ship: ship, memo: o.memo || '', who: o.who || '', lines: o.lines, status: 'new', note: '정기 주문 자동', repeat: { ev: ev, on: true, ch: o.repeat.ch || o.id } };
    props_().setProperty(ORD_ + nid, JSON.stringify(n)); o.repeat.nx = nid; props_().setProperty(k, JSON.stringify(o)); made++; alertNew_(n, '정기'); });
  return made; }
function authorizeDrive() { DriveApp.getRootFolder(); imgDir_(); return 'ok'; }

function doPost(e) {
  var out;
  try { out = handle_(JSON.parse((e && e.postData && e.postData.contents) || '{}')); }
  catch (err) { out = { ok: false, error: String((err && err.message) || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'wonryo-ecount-relay', version: 5.3 }))
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
function holidays_() { try { return JSON.parse(props_().getProperty('cfg2:holidays') || '[]'); } catch (e) { return []; } }
function shipOk_(f, ship) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ship || '')) return false;
  if (holidays_().some(function (h) { return h.d === ship; })) return false;   // v5.0: 휴무일
  var p = ship.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  if ((f.days || []).indexOf(d.getUTCDay()) < 0) return false;
  var dl = Date.UTC(+p[0], +p[1] - 1, +p[2] - (Number(f.lead) || 0), Number(f.cut == null ? 15 : f.cut), 0) - 9 * 3600000;   // 한국 시각 → UTC
  return Date.now() < dl && d.getTime() - Date.now() < 45 * 86400000;
}
function ordList_(filter) { var all = props_().getProperties(), out = [], cut = Date.now() - ORD_KEEP_DAYS_ * 86400000;
  Object.keys(all).forEach(function (k) { if (k.indexOf(ORD_) !== 0 || k === 'ord:notices') return; var o; try { o = JSON.parse(all[k]); } catch (e) { props_().deleteProperty(k); return; }
    if (!o || !o.id || !o.tok) return;   // 주문이 아닌 값(안내 등)은 건드리지 않음
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
function noticesLive_(im) { var t = ymdK_(); return noticesGet_().filter(function (n) { return n.on !== false && (!n.from || n.from <= t) && (!n.to || n.to >= t); }).map(function (n) { return { id: n.id, title: n.title, body: n.body || '', cat: n.cat || '', img: n.cat ? (im['cat_' + n.cat] || '') : '', from: n.from || '', pin: !!n.pin, imgs: n.imgs || [], url: n.url || '' }; }); }
function catPublic_(cat, im) { if (!cat || cat.on === false) return null; return { title: cat.title, items: (cat.items || []).filter(function (it) { return !it.hide; }).map(function (it) { return { id: it.id, grp: it.grp, name: it.name, spec: it.spec || '', pe: it.pe == null ? null : it.pe, pb: it.pb == null ? null : it.pb, bq: it.bq || null, unit: it.unit || 'Box', sub: it.sub || '', dim: it.dim || '', dt: it.dt || '', img: im['cat_' + it.id] || '' }; }) }; }
function ordView_(o) { return { id: o.id, at: o.at, ship: o.ship, memo: o.memo || '', lines: o.lines, status: o.status, slip: o.slip || '', doneAt: o.doneAt || '', note: o.note || '', reply: o.reply || null, editedAt: o.editedAt || '', repeat: o.repeat || null }; }
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
    var im1 = imgMap_(), cg1 = catGet_(), sk = 'seen:' + t1.slice(0, 12), td1 = ymdK_(); try { if (props_().getProperty(sk) !== td1) props_().setProperty(sk, td1); } catch (e) {}   // 사용 현황: 마지막으로 연 날
    var ch1 = chatGet_(t1);
    return { ok: true, form: formOut_(f1, im1, catPublic_(cg1, im1), noticesLive_(im1), shopPub_(cg1)), orders: mine, chat: { m: ch1.m.slice(-30), ra: ch1.ra || '' }, now: new Date().toISOString() }; }
  // v3.4: 거래처 주문 넣기 — 품목은 그 주문서에 있는 것만, 수량 1~9999, 배송일·마감 확인, 같은 cid는 한 번만, 하루 30건까지
  if (req.action === 'orderSubmit') { var t2 = tok_(req.t); var fv2 = t2 && props_().getProperty(ORDF_ + t2); if (!fv2) return { ok: false, error: '주문 링크가 맞지 않습니다' };
    var f2 = JSON.parse(fv2); if (f2.on === false) return { ok: false, error: '이 주문 링크는 사용이 멈춰 있습니다' };
    var cid = String(req.cid || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 30); if (!cid) return { ok: false, error: '주문 번호가 없습니다' };
    var lk2 = LockService.getScriptLock(); lk2.waitLock(15000);
    try {
      var oid = t2.slice(0, 6) + '_' + cid, ex = props_().getProperty(ORD_ + oid), ed = null;
      if (req.editOf) { var ev = props_().getProperty(ORD_ + String(req.editOf).replace(/[^A-Za-z0-9_-]/g, '')); ed = ev && JSON.parse(ev); if (!ed || ed.tok !== t2) return { ok: false, error: '고칠 주문을 찾지 못했습니다' };
        if (ed.status !== 'new' || (ed.reply && ed.reply.st)) return { ok: false, error: '이미 확인된 주문이라 고칠 수 없습니다 — 빵을그리다에 전화로 알려 주세요' }; oid = ed.id; ex = null; }
      if (ex) return { ok: true, order: ordView_(JSON.parse(ex)), dup: true };
      if (!shipOk_(f2, String(req.ship || ''))) return { ok: false, error: '고른 배송일은 주문 마감이 지났거나 배송하지 않는 날입니다 — 다른 날을 골라 주세요' };
      var codes = {}; (f2.items || []).forEach(function (it) { codes[it[0]] = it[1]; });
      var cat2 = f2.cat === false ? null : catGet_(), cmap = {}; ((cat2 && cat2.on !== false && cat2.items) || []).forEach(function (it) { if (!it.hide) cmap[it.id] = it; });
      var lines = []; (req.lines || []).slice(0, 80).forEach(function (l) { var c = String(l && l[0] || ''), q = Math.floor(Number(l && l[1])), kd = String(l && l[2] || '') === 's' ? 's' : ''; if (!(q >= 1 && q <= 9999)) return;
        if (c.indexOf('cat:') === 0) { var ci = cmap[c.slice(4)]; if (!ci) return; lines.push([ci.code || c, ci.name + (ci.spec ? ' (' + ci.spec + ')' : ''), q, kd || 'c']); }   // 단가표 제품: 이카운트 코드가 있으면 그 코드, 없으면 cat:id
        else if (codes[c] != null) lines.push([c, codes[c], q, kd]); });
      if (!lines.length) return { ok: false, error: '주문할 품목의 수량을 넣어 주세요' };
      var sh2 = shopPub_(cat2), so2 = {}, pr2 = {}, sum2 = 0, unk2 = false; sh2.so.forEach(function (k) { so2[k] = 1; }); (f2.items || []).forEach(function (it) { pr2[it[0]] = it[2]; });
      var bad2 = (req.lines || []).filter(function (l) { var c = String(l && l[0] || ''); return so2[c] || (c.indexOf('cat:') === 0 && cmap[c.slice(4)] && so2[cmap[c.slice(4)].code]); });
      if (bad2.length) return { ok: false, error: '품절된 품목이 있습니다 — ' + lines.filter(function (l) { return so2[l[0]]; }).map(function (l) { return l[1]; }).concat(bad2.filter(function (l) { return String(l[0]).indexOf('cat:') === 0; }).map(function (l) { var ci = cmap[String(l[0]).slice(4)]; return ci ? ci.name : ''; })).filter(Boolean).slice(0, 3).join(', ') + ' 을(를) 빼고 다시 주문해 주세요' };
      if (sh2.min > 0) { (req.lines || []).forEach(function (l) { var c = String(l && l[0] || ''), q = Math.floor(Number(l && l[1])) || 0; if (String(l && l[2] || '') === 's' || !q) return;
          var p = c.indexOf('cat:') === 0 ? (cmap[c.slice(4)] ? (cmap[c.slice(4)].pb != null ? cmap[c.slice(4)].pb : cmap[c.slice(4)].pe) : null) : pr2[c]; if (p == null) unk2 = true; else sum2 += p * q; });
        if (!unk2 && sum2 < sh2.min) return { ok: false, error: '최소 주문 금액은 공급가액 ' + sh2.min.toLocaleString() + '원입니다 — 지금 ' + Math.round(sum2).toLocaleString() + '원' }; }
      var today = ymdK_(), nToday = ordList_(function (o) { return o.tok === t2 && ymdK_(new Date(o.at)) === today; }).length; if (!ed && nToday >= 30) return { ok: false, error: '오늘 주문이 너무 많습니다 — 빵을그리다에 문의해 주세요' };
      var o2 = { id: oid, tok: t2, cust: f2.cust, name: f2.name, at: new Date().toISOString(), ship: String(req.ship), memo: String(req.memo || '').slice(0, 300), who: String(req.who || '').slice(0, 30), lines: lines, status: 'new' };
      var rv = Number(req.repeat) === 14 ? 14 : Number(req.repeat) === 7 ? 7 : 0; if (rv) o2.repeat = { ev: rv, on: true, ch: oid };
      if (ed) { o2.at = ed.at; o2.editedAt = new Date().toISOString(); if (ed.repeat) { o2.repeat = ed.repeat; if (req.repeat != null) { if (rv) o2.repeat.ev = rv; else o2.repeat.on = false; } } if (ed.note) o2.note = ed.note; }
      props_().setProperty(ORD_ + oid, JSON.stringify(o2));
    } finally { lk2.releaseLock(); }
    pulse_('o'); alertNew_(o2, ed ? '수정' : ''); return { ok: true, order: ordView_(o2) }; }
  // v5.0: 거래처가 자기 주문 취소(발주 확인 전까지) · 월별 주문 내역(드라이브 보관분 포함)
  if (req.action === 'orderCancel') { var t6 = tok_(req.t), lk7 = LockService.getScriptLock(); lk7.waitLock(10000); var oc;
    try { var cv = props_().getProperty(ORD_ + String(req.id || '').replace(/[^A-Za-z0-9_-]/g, '')); oc = cv && JSON.parse(cv); if (!t6 || !oc || oc.tok !== t6) return { ok: false, error: '주문을 찾지 못했습니다' };
      if (oc.status !== 'new' || (oc.reply && oc.reply.st)) return { ok: false, error: '이미 확인된 주문이라 취소할 수 없습니다 — 빵을그리다에 전화로 알려 주세요' };
      oc.status = 'cancel'; oc.doneAt = new Date().toISOString(); oc.note = '거래처가 취소'; props_().setProperty(ORD_ + oc.id, JSON.stringify(oc)); } finally { lk7.releaseLock(); }
    pulse_('o'); alertNew_(oc, '취소'); return { ok: true, order: ordView_(oc) }; }
  if (req.action === 'chatGet' || req.action === 'chatSend') { var tc = tok_(req.t), fvc = tc && props_().getProperty(ORDF_ + tc); if (!fvc) return { ok: false, error: '주문 링크가 맞지 않습니다' }; var fc = JSON.parse(fvc);
    if (req.action === 'chatGet') { var cg = chatGet_(tc); return { ok: true, m: cg.m.slice(-30), ra: cg.ra || '' }; }
    if (req.del) { var cd = chatDel_(tc, 'c', String(req.del)); if (!cd) return { ok: false, error: '이미 지워졌거나 찾을 수 없습니다' }; return { ok: true, m: cd.m.slice(-30), ra: cd.ra || '' }; }
    if (fc.on === false) return { ok: false, error: '이 주문 링크는 사용이 멈춰 있습니다' }; var cs = chatAdd_(tc, 'c', req.text); if (!cs) return { ok: false, error: '내용을 써 주세요' }; if (cs.err) return { ok: false, error: cs.err };
    pulse_('c'); var admAt = Number(props_().getProperty('adm:last') || 0);
    if (props_().getProperty('ALERT_OFF') !== '1' && Date.now() - admAt > 180000) { var toC = alertTo_();   /* 관리 앱이 켜져 있으면 PC 알림으로 충분 — 메일은 앱이 꺼져 있을 때만 */ if (toC) { try { MailApp.sendEmail({ to: toC, subject: '[빵을그리다] 거래처 메시지 — ' + fc.name + ': ' + String(req.text).slice(0, 40), name: '빵을그리다 주문서', body: fc.name + ' 메시지\n\n' + String(req.text).slice(0, 400) + '\n\n통합 재고관리 → 발주 알림창(또는 판매 입력 → 발주 접수)에서 답할 수 있습니다.' }); } catch (e) {} } }
    return { ok: true, m: cs.m.slice(-30), ra: cs.ra || '' }; }
  if (req.action === 'repeatStop') { var t8 = tok_(req.t), lk8 = LockService.getScriptLock(); lk8.waitLock(10000); var n8 = 0;
    try { var rv8 = props_().getProperty(ORD_ + String(req.id || '').replace(/[^A-Za-z0-9_-]/g, '')), r8 = rv8 && JSON.parse(rv8); if (!t8 || !r8 || r8.tok !== t8 || !r8.repeat) return { ok: false, error: '정기 주문을 찾지 못했습니다' };
      var ch8 = r8.repeat.ch || r8.id; ordList_(function (o) { return o.tok === t8 && o.repeat && o.repeat.on && (o.repeat.ch || o.id) === ch8; }).forEach(function (o) { o.repeat.on = false; props_().setProperty(ORD_ + o.id, JSON.stringify(o)); n8++; }); } finally { lk8.releaseLock(); }
    return { ok: true, n: n8 }; }
  if (req.action === 'orderHistory') { var t7 = tok_(req.t), fv7 = t7 && props_().getProperty(ORDF_ + t7); if (!fv7) return { ok: false, error: '주문 링크가 맞지 않습니다' };
    var mo = /^\d{4}-\d{2}$/.test(req.month || '') ? req.month : ymdK_().slice(0, 7), seen7 = {}, out7 = [];
    ordList_(function (o) { return o.tok === t7 && String(o.at).slice(0, 7) === mo; }).forEach(function (o) { seen7[o.id] = 1; out7.push(ordView_(o)); });
    try { fileJson_(subDir_('주문 보관'), 'orders_' + mo + '.json', []).data.forEach(function (o) { if (o.tok === t7 && !seen7[o.id]) out7.push(ordView_(o)); }); } catch (e) {}
    out7.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }); return { ok: true, month: mo, orders: out7.slice(0, 200) }; }
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

  if (req.action === 'ping') return { ok: true, version: 5.3, agentSeen: agentSeen_(), agentVer: agentVer_() };
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
  if (req.action === 'putNotices') { var ns = (req.notices || []).slice(0, 30).map(function (n) { return { id: String(n.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20), title: String(n.title || '').slice(0, 60), body: String(n.body || '').slice(0, 500), cat: String(n.cat || '').slice(0, 20), from: /^\d{4}-\d{2}-\d{2}$/.test(n.from || '') ? n.from : '', to: /^\d{4}-\d{2}-\d{2}$/.test(n.to || '') ? n.to : '', on: n.on !== false, pin: !!n.pin, at: String(n.at || new Date().toISOString()).slice(0, 30), imgs: (n.imgs || []).slice(0, 6).map(String).filter(function (x) { return /^[A-Za-z0-9_-]{10,80}$/.test(x); }), url: /^https:\/\/[^\s"'<>]+$/.test(n.url || '') ? String(n.url).slice(0, 300) : '' }; }).filter(function (n) { return n.id && n.title; });
    var jsn = JSON.stringify(ns); if (jsn.length > 8800) return { ok: false, error: '안내가 너무 깁니다 — 오래된 안내를 지워 주세요' }; props_().setProperty('ord:notices', jsn); return { ok: true, n: ns.length }; }
  if (req.action === 'putCatalog') { var c8 = req.cat || {}; var items8 = (c8.items || []).slice(0, 300).map(function (it) { return { id: String(it.id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20), grp: String(it.grp || '완제품').slice(0, 10), name: String(it.name || '').slice(0, 60), spec: String(it.spec || '').slice(0, 40), pe: it.pe == null || it.pe === '' ? null : num_(it.pe), pb: it.pb == null || it.pb === '' ? null : num_(it.pb), bq: it.bq ? num_(it.bq) : null, unit: String(it.unit || 'Box').slice(0, 8), code: String(it.code || '').slice(0, 30), hide: !!it.hide, sub: String(it.sub || '').slice(0, 12), dim: String(it.dim || '').slice(0, 40), dt: /^\d{4}-\d{2}-\d{2}$/.test(it.dt || '') ? it.dt : '' }; }).filter(function (it) { return it.id && it.name; });
    catPut_({ items: items8, title: c8.title, on: c8.on }); return { ok: true, n: items8.length }; }
  if (req.action === 'putOrderImg') { var lk10 = LockService.getScriptLock(); lk10.waitLock(20000);
    try { var ov10 = props_().getProperty(ORD_ + String(req.id || '')); if (!ov10) return { ok: false, error: '없는 주문입니다' }; var o10 = JSON.parse(ov10); o10.reply = o10.reply || {};
      if (o10.reply.img) { try { DriveApp.getFileById(o10.reply.img).setTrashed(true); } catch (e) {} delete o10.reply.img; }
      if (!req.del) { var m10 = String(req.data || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+\/=]+)$/); if (!m10) return { ok: false, error: '사진 자료가 올바르지 않습니다' }; if (m10[2].length > 2800000) return { ok: false, error: '사진이 너무 큽니다' };
        var f10 = imgDir_().createFile(Utilities.newBlob(Utilities.base64Decode(m10[2]), 'image/' + m10[1], 'stm_' + o10.id.replace(/[^A-Za-z0-9_-]/g, '_') + '.' + (m10[1] === 'jpeg' ? 'jpg' : m10[1])));
        f10.setDescription('거래명세표 · ' + String(o10.name || '').slice(0, 60)); try { f10.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { f10.setTrashed(true); return { ok: false, error: '드라이브가 링크 공유를 막았습니다: ' + e.message }; }
        o10.reply.img = f10.getId(); }
      o10.reply.at = new Date().toISOString(); props_().setProperty(ORD_ + o10.id, JSON.stringify(o10)); return { ok: true, img: o10.reply.img || '' }; } finally { lk10.releaseLock(); } }
  if (req.action === 'getHolidays') return { ok: true, holidays: holidays_() };
  if (req.action === 'pulse') { var pp = props_(), now5 = Date.now(); if (now5 - Number(pp.getProperty('adm:last') || 0) > 60000) pp.setProperty('adm:last', String(now5));
    return { ok: true, o: pp.getProperty('pl:o') || '', c: pp.getProperty('pl:c') || '' }; }
  if (req.action === 'chatList') return { ok: true, chats: chatList_() };
  if (req.action === 'chatAdmin') { var ta = tok_(req.t); if (!ta || !props_().getProperty(ORDF_ + ta)) return { ok: false, error: '없는 링크입니다' }; var ca;
    if (req.del) { ca = chatDel_(ta, 'a', String(req.del)); if (!ca) return { ok: false, error: '이미 지워졌거나 찾을 수 없습니다' }; }
    else if (req.text) { ca = chatAdd_(ta, 'a', req.text); if (!ca) return { ok: false, error: '내용을 써 주세요' }; } else { ca = chatGet_(ta); if (req.read) { ca.ra = new Date().toISOString(); chatPut_(ta, ca); } }
    return { ok: true, m: ca.m, rc: ca.rc || '' }; }
  if (req.action === 'getShop') return { ok: true, shop: shop_() };
  if (req.action === 'putShop') { var sp = req.shop || {}, keepS = { so: (sp.so || []).map(function (x) { return String(x).slice(0, 34); }).filter(Boolean).slice(0, 200), min: Math.max(0, Math.min(10000000, Math.floor(Number(sp.min) || 0))), at: new Date().toISOString() };
    var jsS = JSON.stringify(keepS); if (jsS.length > 8800) return { ok: false, error: '품절 품목이 너무 많습니다' }; props_().setProperty('cfg2:shop', jsS); return { ok: true, shop: keepS }; }
  if (req.action === 'usage') { var au = props_().getProperties(), U = {}, c30 = Date.now() - 30 * 86400e3, outU = [];
    Object.keys(au).forEach(function (k) { if (k.indexOf(ORD_) !== 0 || k === 'ord:notices') return; var o; try { o = JSON.parse(au[k]); } catch (e) { return; } if (!o || !o.tok) return;
      var u = U[o.tok] = U[o.tok] || { n30: 0, q30: 0, last: '', rep: 0 }; if (o.status === 'cancel' || o.status === 'reject') return; if (String(o.at) > u.last) u.last = o.at;
      if (new Date(o.at).getTime() >= c30) { u.n30++; o.lines.forEach(function (l) { if (l[3] !== 's') u.q30 += Number(l[2]) || 0; }); } if (o.repeat && o.repeat.on && !o.repeat.nx) u.rep++; });
    Object.keys(au).forEach(function (k) { if (k.indexOf(ORDF_) !== 0) return; var t = k.slice(ORDF_.length), f; try { f = JSON.parse(au[k]); } catch (e) { return; } var u = U[t] || { n30: 0, q30: 0, last: '', rep: 0 };
      outU.push({ t: t, cust: f.cust, name: f.name, on: f.on !== false, made: f.at || '', seen: au['seen:' + t.slice(0, 12)] || '', last: u.last, n30: u.n30, q30: u.q30, rep: u.rep }); });
    return { ok: true, usage: outU }; }
  if (req.action === 'putHolidays') { var hs = (req.holidays || []).filter(function (h) { return h && /^\d{4}-\d{2}-\d{2}$/.test(h.d || ''); }).map(function (h) { return { d: h.d, n: String(h.n || '').slice(0, 20) }; }).slice(0, 120);
    hs.sort(function (a, b) { return a.d < b.d ? -1 : 1; }); var cut8 = ymdK_(new Date(Date.now() - 7 * 86400e3)); hs = hs.filter(function (h) { return h.d >= cut8; }); props_().setProperty('cfg2:holidays', JSON.stringify(hs)); return { ok: true, holidays: hs }; }
  // v5.0: 알림 메일 설정 · 지금 정리 · 판매 기록/설정 함께 쓰기
  if (req.action === 'setAlert') { if (req.email != null) { var em = String(req.email).trim(); if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return { ok: false, error: '메일 주소가 올바르지 않습니다' }; if (em) props_().setProperty('ALERT_EMAIL', em.slice(0, 80)); else props_().deleteProperty('ALERT_EMAIL'); }
    if (req.off != null) { if (req.off) props_().setProperty('ALERT_OFF', '1'); else props_().deleteProperty('ALERT_OFF'); } return { ok: true, to: alertTo_(), off: props_().getProperty('ALERT_OFF') === '1' }; }
  if (req.action === 'maintNow') { var r5 = maint_(true); return { ok: true, moved: r5 ? r5.moved : 0, use: propsUse_(), limit: 500000 }; }
  if (req.action === 'saleCfgGet') { return { ok: true, cfg: JSON.parse(props_().getProperty('cfg2:sale') || 'null') }; }
  if (req.action === 'saleCfgPut') { var c5 = req.cfg || {}, keep5 = { at: new Date().toISOString() }; ['mode', 'wh', 'emp', 'odField', 'kakaoKey'].forEach(function (k) { if (c5[k] != null) keep5[k] = String(c5[k]).slice(0, 80); }); props_().setProperty('cfg2:sale', JSON.stringify(keep5)); return { ok: true, cfg: keep5 }; }
  if (req.action === 'saleLogSync') { var lk5 = LockService.getScriptLock(); lk5.waitLock(20000);
    try { var sd = dataDir_(), fj5 = fileJson_(sd, '판매기록.json', { entries: {} }), E = fj5.data.entries || {}, ch = false, cut5 = new Date(Date.now() - 400 * 86400e3).toISOString();
      (req.put || []).slice(0, 500).forEach(function (en) { if (!en || !en.id) return; var id = String(en.id).slice(0, 40), cur = E[id]; if (!cur || String(en.upd || '') > String(cur.upd || '')) { E[id] = en; ch = true; } });
      Object.keys(E).forEach(function (id) { if (String(E[id].upd || E[id].ts || '') < cut5) { delete E[id]; ch = true; } });
      if (ch) { fj5.data.entries = E; fj5.data.at = new Date().toISOString(); fileSave_(sd, '판매기록.json', fj5.file, fj5.data); }
      var since = String(req.since || ''), out5 = []; Object.keys(E).forEach(function (id) { if (!since || String(E[id].upd || '') > since) out5.push(E[id]); });
      return { ok: true, entries: out5, now: new Date().toISOString() }; } finally { lk5.releaseLock(); } }
  // v4.2: 주문서 빠른 열기 — 여러 링크의 주문서 내용(주문 기록 빼고)을 한 번에, 그리고 암호화된 파일을 GitHub에 한 번에 올림
  if (req.action === 'formSnaps') { var im9 = imgMap_(), cg9 = catGet_(), cp9 = catPublic_(cg9, im9), nt9 = noticesLive_(im9), sh9 = shopPub_(cg9), out9 = {};
    (req.ts || []).slice(0, 300).forEach(function (t) { var tk = tok_(t), v = tk && props_().getProperty(ORDF_ + tk); if (!v) { out9[t] = null; return; } var f = JSON.parse(v); out9[t] = f.on === false ? null : formOut_(f, im9, cp9, nt9, sh9); });
    return { ok: true, forms: out9, now: new Date().toISOString() }; }
  if (req.action === 'ghPutFiles') { var gt = props_().getProperty('GH_TOKEN'); if (!gt) return { ok: false, error: 'GH_TOKEN 없음 — Apps Script 프로젝트 설정 › 스크립트 속성에 GitHub 열쇠를 넣어 주세요' };
    var fl = (req.files || []).slice(0, 300).filter(function (f) { return f && /^of\/[0-9a-f]{32}\.txt$/.test(f.path) && typeof f.data === 'string' && f.data.length < 400000; });   // of/ 아래 암호 파일만
    if (!fl.length) return { ok: true, n: 0 };
    for (var tr = 0; tr < 3; tr++) { try { var hd = gh_(gt, 'get', '/git/ref/heads/main').object.sha, bt = gh_(gt, 'get', '/git/commits/' + hd).tree.sha;
        var tre = gh_(gt, 'post', '/git/trees', { base_tree: bt, tree: fl.map(function (f) { return { path: f.path, mode: '100644', type: 'blob', content: f.data }; }) });
        var nc = gh_(gt, 'post', '/git/commits', { message: String(req.msg || '주문서 빠른 열기 자료').slice(0, 100), tree: tre.sha, parents: [hd] });
        gh_(gt, 'patch', '/git/refs/heads/main', { sha: nc.sha }); return { ok: true, n: fl.length, commit: nc.sha }; }
      catch (e) { if (tr === 2 || !/ 422| 409/.test(e.message)) return { ok: false, error: e.message }; Utilities.sleep(800); } } }
  // v3.8: 판매를 저장할 때 그 거래처 주문 링크의 단가를 가장 최근 날짜 단가로 바꿈 (prices: {코드: [단가, 날짜]})
  if (req.action === 'updFormPrices') { var cu9 = String(req.cust || ''), pr9 = req.prices || {}, n9 = 0, all9 = props_().getProperties();
    Object.keys(all9).forEach(function (k) { if (k.indexOf(ORDF_) !== 0) return; var f = JSON.parse(all9[k]); if (f.cust !== cu9) return; var ch = false;
      (f.items || []).forEach(function (it) { var v = pr9[it[0]]; if (!v || !(num_(v[0]) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(v[1] || '') || (it[4] && it[4] > v[1])) return; it[2] = num_(v[0]); it[4] = v[1]; ch = true; });
      if (ch) { props_().setProperty(k, JSON.stringify(f)); n9++; } }); return { ok: true, forms: n9 }; }
  if (req.action === 'setOrderFormOn') { var t5 = tok_(req.t), v5 = t5 && props_().getProperty(ORDF_ + t5); if (!v5) return { ok: false, error: '없는 링크입니다' }; var f5 = JSON.parse(v5); f5.on = !!req.on; props_().setProperty(ORDF_ + t5, JSON.stringify(f5)); return { ok: true }; }
  if (req.action === 'delOrderForm') { var t4 = tok_(req.t); if (t4) { props_().deleteProperty(ORDF_ + t4); props_().deleteProperty('seen:' + t4.slice(0, 12)); props_().deleteProperty(chatKey_(t4)); } return { ok: true }; }
  if (req.action === 'listOrderForms') { var af = props_().getProperties(), lf = [];
    Object.keys(af).forEach(function (k) { if (k.indexOf(ORDF_) !== 0) return; try { var f = JSON.parse(af[k]); lf.push({ t: k.slice(ORDF_.length), cust: f.cust, name: f.name, on: f.on !== false, at: f.at, n: (f.items || []).length, codes: (f.items || []).map(function (it) { return it[0]; }), days: f.days, cut: f.cut, lead: f.lead, price: !!f.price }); } catch (e) {} });
    return { ok: true, forms: lf }; }
  if (req.action === 'orders') { var since = Date.now() - Math.min(45, Math.max(1, Number(req.days) || 14)) * 86400000; var mt = null, rg = 0; try { rg = repeatGen_(); } catch (e) {} try { mt = maint_(false); } catch (e) {}
    return { ok: true, use: propsUse_(), limit: 500000, moved: mt ? mt.moved : 0, alert: { to: alertTo_(), off: props_().getProperty('ALERT_OFF') === '1' }, shop: shop_(), repMade: rg, chats: chatList_(), orders: ordList_(function (o) { return o.status === 'new' || new Date(o.at).getTime() >= since; }).slice(0, 200).map(function (o) { var v = ordView_(o); v.cust = o.cust; v.name = o.name; v.tok = o.tok; v.who = o.who || ''; return v; }) }; }
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
