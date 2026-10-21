/**
 * 빵을그리다 사내 대화 (통합재고관리 「💬 사내 대화」 저장소) — Google Apps Script 웹 앱
 *
 * 구글 시트 「빵을그리다 사내 대화 (앱 자동)」
 *   「대화」 탭 : 한 줄 = 메시지 하나 (지우면 지움 열이 Y — 줄은 남김)
 *   「안내」 탭 : 이 시트가 무엇인지 설명
 * 요청: POST 본문 JSON {key, action, ...} → JSON (GET은 살아 있는지 확인만)
 *   ping                         연결 확인
 *   pulse                        방마다 마지막으로 바뀐 시각 + 읽음 표 (캐시 — 아주 가벼움)
 *   list   {since}               since 이후 바뀐 메시지 (since 없으면 방마다 최근 60개)
 *   older  {room, before, n}     더 이전 대화 (시트에서 읽음)
 *   send   {room, text, by, dev, cid, kind, cust, cat}   kind: msg | need(거래처 니즈)
 *   del    {id, by}              내가 보낸 메시지 지우기
 *   need   {id, st, by}          거래처 니즈 상태 바꾸기 (새 니즈 / 검토 중 / 반영 / 보류)
 *   read   {room, by, at}        이 방을 어디까지 읽었는지
 *   purge  {mark}                내용에 mark(예: [시험])가 든 줄을 지움 표시 (시험 정리용)
 *   forget {name}                읽음 표에서 이름 빼기 (시험 이름·퇴사자 정리)
 *   upimg  {data, type, name}    사진 한 장 올리기(base64) → 드라이브 「빵을그리다 사내 대화 사진 (앱 자동)」 폴더(비공개) → {id}
 *   img    {id}                  사진 받기(그 폴더 안 파일만) → {data(base64), type} — 작은 사진은 캐시
 *   send 의 im: [{i 원본 id, t 작은 사진 id, w, h}] 최대 6장 — 사진만 보내도 됨. 지우기·purge 하면 사진 파일은 휴지통으로
 * 열쇠: SHA-256('wonryo-chat|' + 통합재고관리 「공유 저장소 열쇠」) 이 KEY_HASH 와 같아야 함 — 열쇠 자체는 여기 없음
 * 배포: 배포 → 배포 관리 → 연필(수정) → 버전 「새 버전」 → 배포 (주소 유지)
 */
var VER = '1.3';
var KEY_HASH = '__KEY_HASH__';
var ROOMS = ['전체', '거래처 니즈', '생산·출고', '사무·기타'];
var STS = ['새 니즈', '검토 중', '반영', '보류'];
var HEAD = ['id', '방', '보낸 시각(한국)', '보낸 사람', '내용', '종류', '거래처', '분류', '상태', '지움', 'at', 'mt', '기기', 'cid', '사진', '사진 링크'];
var C = { id: 0, room: 1, kst: 2, by: 3, text: 4, kind: 5, cust: 6, cat: 7, st: 8, del: 9, at: 10, mt: 11, dev: 12, cid: 13, img: 14, imgLink: 15 };
var IMG_MAX = 6;
var PER = 120;            // 방마다 캐시에 두는 최근 메시지 수
var CACHE_SEC = 21600;    // 6시간 (캐시 최대)

function doGet() { return out_({ ok: true, v: VER, app: '빵을그리다 사내 대화' }); }
function doPost(e) {
  var r;
  try { r = handle_(JSON.parse((e && e.postData && e.postData.contents) || '{}')); }
  catch (err) { r = { ok: false, error: String((err && err.message) || err) }; }
  return out_(r);
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function hex_(b) { return b.map(function (x) { return ('0' + (x & 255).toString(16)).slice(-2); }).join(''); }
function keyOk_(k) {
  if (!k || KEY_HASH.indexOf('__') === 0) return false;
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'wonryo-chat|' + k, Utilities.Charset.UTF_8)) === KEY_HASH;
}
function props_() { return PropertiesService.getScriptProperties(); }
function cache_() { return CacheService.getScriptCache(); }
function kst_(d) { return Utilities.formatDate(d || new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'); }
function clip_(s, n) { s = String(s == null ? '' : s).replace(/\r\n/g, '\n'); return s.length > n ? s.slice(0, n) : s; }

/* ── 시트 ── */
function sheet_() {
  var id = props_().getProperty('SHEET_ID');
  if (!id) throw new Error('setup 을 먼저 실행해 주세요');
  return SpreadsheetApp.openById(id).getSheetByName('대화');
}
function setup() {
  var id = props_().getProperty('SHEET_ID'), ss;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) { ss = SpreadsheetApp.create('빵을그리다 사내 대화 (앱 자동)'); props_().setProperty('SHEET_ID', ss.getId()); }
  var sh = ss.getSheetByName('대화') || ss.insertSheet('대화');
  if (sh.getLastRow() < 1) sh.appendRow(HEAD);
  sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold').setBackground('#E3F3EF');
  sh.setFrozenRows(1);
  // 글자 형식으로 고정 (시각·id 가 날짜·숫자로 바뀌지 않게)
  ['A:A', 'C:C', 'K:K', 'L:L', 'N:N'].forEach(function (a) { sh.getRange(a).setNumberFormat('@'); });
  sh.setColumnWidth(5, 420);
  var g = ss.getSheetByName('안내') || ss.insertSheet('안내');
  g.clear();
  g.getRange(1, 1, 6, 1).setValues([['빵을그리다 사내 대화 — 통합재고관리 「💬 사내 대화」가 자동으로 쓰는 시트입니다.'], ['「대화」 탭 한 줄이 메시지 하나입니다. 지운 메시지는 「지움」 열이 Y 로 바뀌고 줄은 남습니다.'], ['손으로 고치지 마세요. 내용을 바꾸면 앱 화면과 달라질 수 있습니다.'], ['방: ' + ROOMS.join(' · ')], ['거래처 니즈 상태: ' + STS.join(' → ')], ['만든 날: ' + kst_()]]);
  var s1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1'); if (s1 && ss.getSheets().length > 2) ss.deleteSheet(s1);
  cache_().removeAll(['tc:pulse'].concat(ROOMS.map(function (r) { return 'tc:r:' + r; })));
  Logger.log('시트: ' + ss.getUrl());
  return ss.getUrl();
}
function rowToMsg_(v) {
  return { id: String(v[C.id]), r: String(v[C.room]), at: String(v[C.at]), by: String(v[C.by]), t: String(v[C.text]),
    k: (String(v[C.kind]) === '니즈' || String(v[C.kind]) === 'need') ? 'need' : 'msg', c: String(v[C.cust] || ''), g: String(v[C.cat] || ''), st: String(v[C.st] || ''),
    d: String(v[C.del]) === 'Y' ? 1 : 0, mt: String(v[C.mt] || v[C.at]), dv: String(v[C.dev] || ''), cid: String(v[C.cid] || ''), im: parseIm_(v[C.img]) };
}
function parseIm_(s) { if (!s) return []; try { var a = JSON.parse(String(s)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
/* ── 사진: 드라이브 전용 폴더(비공개). 받기는 이 폴더 안 파일만 ── */
function imgFolder_() {
  var id = props_().getProperty('IMG_FOLDER'), f = null;
  if (id) { try { f = DriveApp.getFolderById(id); if (f.isTrashed()) f = null; } catch (e) { f = null; } }
  if (!f) { f = DriveApp.createFolder('빵을그리다 사내 대화 사진 (앱 자동)'); props_().setProperty('IMG_FOLDER', f.getId()); }
  return f;
}
function inFolder_(file) { var fid = props_().getProperty('IMG_FOLDER'); if (!fid) return false; var ps = file.getParents(); while (ps.hasNext()) { if (ps.next().getId() === fid) return true; } return false; }
function trashIm_(im) { (im || []).forEach(function (x) { [x.i, x.t].forEach(function (id) { if (!id) return; try { var f = DriveApp.getFileById(id); if (inFolder_(f)) f.setTrashed(true); cache_().remove('img:' + id); } catch (e) {} }); }); }
function ensureHead_(sh) { if (sh.getLastColumn() < HEAD.length) { sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold').setBackground('#E3F3EF'); sh.getRange('O:O').setNumberFormat('@'); } }
/* 사진 기능 처음 한 번: 편집기에서 실행 → 드라이브 권한 허용 */
function setupImg() { var f = imgFolder_(); ensureHead_(sheet_()); Logger.log('사진 폴더: ' + f.getUrl()); return f.getUrl(); }
/* 시트 끝에서부터 n 줄 읽기 */
function tail_(sh, n) {
  var last = sh.getLastRow(); if (last < 2) return [];
  var from = Math.max(2, last - n + 1);
  return sh.getRange(from, 1, last - from + 1, HEAD.length).getValues().map(function (v, i) { var m = rowToMsg_(v); m._row = from + i; return m; });
}

/* ── 캐시: 방마다 최근 PER 개 ── */
function roomCache_(room) {
  var c = cache_().get('tc:r:' + room); if (c) { try { return JSON.parse(c); } catch (e) {} }
  return null;
}
function rebuild_() {
  var sh = sheet_(), all = tail_(sh, 3000), by = {};
  ROOMS.forEach(function (r) { by[r] = []; });
  all.forEach(function (m) { if (by[m.r]) { delete m._row; by[m.r].push(m); } });
  var put = {};
  ROOMS.forEach(function (r) { by[r] = by[r].slice(-PER); put['tc:r:' + r] = JSON.stringify(by[r]); });
  cache_().putAll(put, CACHE_SEC);
  return by;
}
function rooms_() {
  var out = {}, miss = false;
  ROOMS.forEach(function (r) { var c = roomCache_(r); if (!c) miss = true; out[r] = c || []; });
  return miss ? rebuild_() : out;
}
function saveRoom_(room, list) { cache_().put('tc:r:' + room, JSON.stringify(list.slice(-PER)), CACHE_SEC); }
function reads_() { try { return JSON.parse(props_().getProperty('reads') || '{}'); } catch (e) { return {}; } }
function pulse_(R) {
  var p = { rooms: {}, last: '' };
  ROOMS.forEach(function (r) { var L = R[r] || [], t = ''; L.forEach(function (m) { if (m.mt > t) t = m.mt; }); p.rooms[r] = t; if (t > p.last) p.last = t; });
  p.reads = reads_();
  cache_().put('tc:pulse', JSON.stringify(p), CACHE_SEC);
  return p;
}

function handle_(q) {
  if (!keyOk_(q.key)) return { ok: false, error: '열쇠가 맞지 않습니다 — 통합재고관리에 다시 로그인해 주세요' };
  var a = q.action || '', now = new Date().toISOString();
  if (a === 'ping') return { ok: true, v: VER, now: now, rooms: ROOMS, sts: STS };
  if (a === 'pulse') {
    var pc = cache_().get('tc:pulse'), p = null;
    if (pc) { try { p = JSON.parse(pc); } catch (e) {} }
    if (!p) p = pulse_(rooms_());
    return { ok: true, v: VER, now: now, last: p.last, rooms: p.rooms, reads: p.reads };
  }
  if (a === 'list') {
    var R = rooms_(), since = String(q.since || ''), out = [], more = {};
    ROOMS.forEach(function (r) {
      var L = R[r] || [];
      if (!since) { out = out.concat(L.slice(-(Math.min(200, Number(q.per) || 60)))); return; }
      var hit = L.filter(function (m) { return m.mt > since; });
      if (L.length >= PER && hit.length === L.length) more[r] = 1;   // 캐시보다 오래된 변경이 있을 수 있음 → 앱이 older 로 채움
      out = out.concat(hit);
    });
    var pp = cache_().get('tc:pulse'), rd = null; if (pp) { try { rd = JSON.parse(pp).reads; } catch (e) {} }
    return { ok: true, v: VER, now: now, msgs: out, more: more, reads: rd || reads_() };
  }
  if (a === 'older') {
    var room = String(q.room || ''), before = String(q.before || '9999'), n = Math.min(200, Number(q.n) || 60);
    if (ROOMS.indexOf(room) < 0) return { ok: false, error: '없는 방입니다' };
    var sh0 = sheet_(), L0 = tail_(sh0, 5000).filter(function (m) { return m.r === room && m.at < before; });
    L0 = L0.slice(-n).map(function (m) { delete m._row; return m; });
    return { ok: true, msgs: L0, end: L0.length < n };
  }
  if (a === 'send') {
    var rm = String(q.room || ''), text = clip_(q.text, 2000).trim(), by = clip_(q.by, 30).trim();
    if (ROOMS.indexOf(rm) < 0) return { ok: false, error: '없는 방입니다' };
    var im = (Array.isArray(q.im) ? q.im : []).slice(0, IMG_MAX).map(function (x) { return { i: String((x && x.i) || '').slice(0, 80), t: String((x && x.t) || '').slice(0, 80), w: Number(x && x.w) || 0, h: Number(x && x.h) || 0 }; }).filter(function (x) { return /^[\w-]{20,}$/.test(x.i); });
    if (!text && !im.length) return { ok: false, error: '내용이 비어 있습니다' };
    if (!by) return { ok: false, error: '이름이 없습니다' };
    var kind = q.kind === 'need' ? 'need' : 'msg';
    var lock = LockService.getScriptLock(); lock.waitLock(15000);
    try {
      var R1 = rooms_(), L1 = R1[rm] || [], cid = clip_(q.cid, 40);
      if (cid) { var dup = L1.filter(function (m) { return m.cid === cid; })[0]; if (dup) return { ok: true, msg: dup, dup: 1 }; }
      var d = new Date(), at = d.toISOString();
      var m = { id: 'm' + d.getTime().toString(36) + Math.random().toString(36).slice(2, 6), r: rm, at: at, by: by, t: text, k: kind,
        c: kind === 'need' ? clip_(q.cust, 60).trim() : '', g: kind === 'need' ? clip_(q.cat, 20).trim() : '', st: kind === 'need' ? STS[0] : '',
        d: 0, mt: at, dv: clip_(q.dev, 40), cid: cid, im: im };
      var shS = sheet_(); if (im.length) ensureHead_(shS);
      shS.appendRow([m.id, m.r, kst_(d), m.by, m.t, kind === 'need' ? '니즈' : '글', m.c, m.g, m.st, '', m.at, m.mt, m.dv, m.cid, im.length ? JSON.stringify(im) : '', im.map(function (x) { return 'https://drive.google.com/file/d/' + x.i + '/view'; }).join('\n')]);
      L1.push(m); saveRoom_(rm, L1); R1[rm] = L1; pulse_(R1);
      return { ok: true, msg: m };
    } finally { lock.releaseLock(); }
  }
  if (a === 'del' || a === 'need') {
    var id = String(q.id || ''), who = clip_(q.by, 30).trim();
    if (!id) return { ok: false, error: 'id 가 없습니다' };
    var lock2 = LockService.getScriptLock(); lock2.waitLock(15000);
    try {
      var sh2 = sheet_(), T = tail_(sh2, 5000), hit2 = null;
      for (var i = T.length - 1; i >= 0; i--) if (T[i].id === id) { hit2 = T[i]; break; }
      if (!hit2) return { ok: false, error: '메시지를 찾지 못했습니다' };
      var mt = new Date().toISOString();
      if (a === 'del') {
        if (hit2.by !== who) return { ok: false, error: '내가 보낸 메시지만 지울 수 있습니다' };
        sh2.getRange(hit2._row, C.del + 1).setValue('Y'); hit2.d = 1; trashIm_(hit2.im);
      } else {
        var st = String(q.st || ''); if (STS.indexOf(st) < 0) return { ok: false, error: '상태 값이 올바르지 않습니다' };
        sh2.getRange(hit2._row, C.st + 1).setValue(st); hit2.st = st;
      }
      sh2.getRange(hit2._row, C.mt + 1).setValue(mt); hit2.mt = mt; delete hit2._row;
      var R2 = rooms_(), L2 = R2[hit2.r] || [], j = -1;
      for (var k = 0; k < L2.length; k++) if (L2[k].id === id) { j = k; break; }
      if (j >= 0) L2[j] = hit2; else L2.push(hit2);
      L2.sort(function (x, y) { return x.at < y.at ? -1 : x.at > y.at ? 1 : 0; });
      saveRoom_(hit2.r, L2); R2[hit2.r] = L2; pulse_(R2);
      return { ok: true, msg: hit2 };
    } finally { lock2.releaseLock(); }
  }
  if (a === 'read') {
    var rr = String(q.room || ''), nm = clip_(q.by, 30).trim(), at2 = String(q.at || '');
    if (ROOMS.indexOf(rr) < 0 || !nm || !at2) return { ok: false, error: '읽음 정보가 부족합니다' };
    var lock3 = LockService.getScriptLock(); lock3.waitLock(10000);
    try {
      var rd2 = reads_(); rd2[rr] = rd2[rr] || {};
      if ((rd2[rr][nm] || '') >= at2) return { ok: true, same: 1 };
      rd2[rr][nm] = at2;
      // 오래된 이름(60일 넘게 안 읽음) 정리 — 저장 공간 보호
      var cut = new Date(Date.now() - 60 * 864e5).toISOString();
      Object.keys(rd2).forEach(function (r) { Object.keys(rd2[r]).forEach(function (n) { if (rd2[r][n] < cut) delete rd2[r][n]; }); });
      props_().setProperty('reads', JSON.stringify(rd2));
      var pc3 = cache_().get('tc:pulse'); if (pc3) { try { var p3 = JSON.parse(pc3); p3.reads = rd2; cache_().put('tc:pulse', JSON.stringify(p3), CACHE_SEC); } catch (e) {} }
      return { ok: true };
    } finally { lock3.releaseLock(); }
  }
  if (a === 'purge') {
    var mark = String(q.mark || ''); if (mark.length < 3) return { ok: false, error: 'mark 가 너무 짧습니다' };
    var lock4 = LockService.getScriptLock(); lock4.waitLock(15000);
    try {
      var sh4 = sheet_(), T4 = tail_(sh4, 5000), n4 = 0, mt4 = new Date().toISOString();
      T4.forEach(function (m) { if (m.t.indexOf(mark) >= 0 && !m.d) { sh4.getRange(m._row, C.del + 1).setValue('Y'); sh4.getRange(m._row, C.mt + 1).setValue(mt4); trashIm_(m.im); n4++; } });
      cache_().removeAll(['tc:pulse'].concat(ROOMS.map(function (r) { return 'tc:r:' + r; })));
      return { ok: true, n: n4 };
    } finally { lock4.releaseLock(); }
  }
  if (a === 'upimg') {
    var data = String(q.data || ''), type = /^image\/(jpeg|png|webp)$/.test(String(q.type || '')) ? String(q.type) : 'image/jpeg';
    if (!data) return { ok: false, error: '사진 자료가 없습니다' };
    if (data.length > 9000000) return { ok: false, error: '사진이 너무 큽니다 (6MB 이하)' };
    var bytes = Utilities.base64Decode(data), ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    var nm = clip_(q.name, 60).replace(/[^\w가-힣.\-]/g, '_') || ('chat_' + Date.now());
    var file = imgFolder_().createFile(Utilities.newBlob(bytes, type, nm + '.' + ext));
    return { ok: true, id: file.getId(), size: bytes.length };
  }
  if (a === 'img') {
    var fid2 = String(q.id || ''); if (!/^[\w-]{20,}$/.test(fid2)) return { ok: false, error: '사진 id 가 올바르지 않습니다' };
    var cc = cache_().get('img:' + fid2); if (cc) { var p0 = cc.indexOf('|'); return { ok: true, type: cc.slice(0, p0), data: cc.slice(p0 + 1), c: 1 }; }
    var file2; try { file2 = DriveApp.getFileById(fid2); } catch (e) { return { ok: false, error: '사진을 찾지 못했습니다' }; }
    if (file2.isTrashed() || !inFolder_(file2)) return { ok: false, error: '볼 수 없는 사진입니다' };
    var bl = file2.getBlob(), b64 = Utilities.base64Encode(bl.getBytes()), ty = bl.getContentType() || 'image/jpeg';
    if (b64.length < 95000) { try { cache_().put('img:' + fid2, ty + '|' + b64, CACHE_SEC); } catch (e) {} }
    return { ok: true, type: ty, data: b64 };
  }
  if (a === 'forget') {
    var nmf = clip_(q.name, 30).trim(); if (!nmf) return { ok: false, error: '이름이 없습니다' };
    var lock5 = LockService.getScriptLock(); lock5.waitLock(10000);
    try {
      var rd5 = reads_(), n5 = 0;
      Object.keys(rd5).forEach(function (r) { if (rd5[r] && rd5[r][nmf]) { delete rd5[r][nmf]; n5++; } });
      props_().setProperty('reads', JSON.stringify(rd5)); cache_().remove('tc:pulse');
      return { ok: true, n: n5 };
    } finally { lock5.releaseLock(); }
  }
  return { ok: false, error: '알 수 없는 요청: ' + a };
}
