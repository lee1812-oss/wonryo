/* 생산실 음성 개선 요청 v001 · 2026-11-09 07:49 (생산실 전용, 일지 저장 로직 변경 없음) */
(function () {
  if (!window.FIELD_APP || window.__fieldRequest) return;
  window.__fieldRequest = true;
  const VER = 'v001', BUILT = '2026-11-09 07:49';
  const API = 'https://script.google.com/macros/s/AKfycbxoQ4OCTBGw06Z6ttoSHiEnLt__WQ5NL-As1t66U9vQVH-tGOl_kDMYfUuod9ouU1QFOQ/exec';
  const DB = 'drawbread-field-request-v1';
  let box = null, draft = null, rec = null, opening = 0, busy = false, audio = null, dbp = null, storageOK = true;
  const key = () => window.WLOCK && WLOCK.shareKey && WLOCK.shareKey() || '';
  const E = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const css = document.createElement('style');
  css.textContent = '#fld .fld-top{flex-wrap:wrap!important}#fld .rqbar{flex:0 0 100%;display:flex;align-items:center;gap:12px;padding:8px 0 0;box-sizing:border-box}#fld .rqbar small{flex:1;color:#fff;font-size:17px;line-height:1.4;font-weight:700;word-break:keep-all}#fld .rqbar button{min-height:64px;font-size:22px;font-weight:900;padding:10px 24px;background:#fff;color:#593619;border:2px solid #bba385;border-radius:12px;cursor:pointer}#frq{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;color:#202020;font-family:inherit;font-size:20px}#frq .rqcard{background:#fff;border-radius:16px;max-width:800px;width:100%;max-height:calc(100dvh - 24px);overflow:auto;padding:24px;box-sizing:border-box;box-shadow:0 8px 32px #0004}#frq h1{font-size:30px;margin:0 0 10px;color:#593619}#frq p{line-height:1.55;word-break:keep-all;margin:12px 0}#frq .rqmeta{font-size:17px;font-weight:700}#frq .rqnotice{padding:12px;background:#f2f2f2;border:1px solid #ccc;border-radius:10px;font-size:18px}#frq .rqstate{font-size:26px;font-weight:900;margin:18px 0;color:#202020}#frq .rqstate.live{color:#b41919}#frq .rqwarn{color:#9a3f00;font-weight:800}#frq .rqtext{white-space:pre-wrap;word-break:keep-all;overflow-wrap:anywhere;border:2px solid #c3b59f;border-radius:12px;min-height:90px;padding:16px;font-size:25px;line-height:1.5;margin:12px 0}#frq textarea{box-sizing:border-box;width:100%;min-height:140px;font:inherit;font-size:25px;padding:14px;border:2px solid #8b7658;border-radius:10px}#frq .rqbuttons{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px}#frq button{min-height:72px;flex:1 1 180px;padding:12px 16px;border:2px solid #a89881;background:#fff;color:#272727;border-radius:12px;font-size:23px;font-weight:900;cursor:pointer}#frq button.primary{background:#75491f;color:#fff;border-color:#75491f}#frq button.stop{background:#b41919;color:#fff;border-color:#b41919}#frq button:disabled{opacity:.6;cursor:wait}#frq .rqdone{color:#176034;font-weight:900}#frq .rqsmall{font-size:17px;font-weight:700}@media(max-width:600px){#fld .rqbar{flex-wrap:wrap;gap:6px}#fld .rqbar small{flex:0 0 100%;font-size:17px}#fld .rqbar button{width:100%;font-size:20px;min-height:60px}#frq .rqcard{padding:16px}#frq h1{font-size:27px}#frq .rqtext,#frq textarea{font-size:22px}#frq button{flex:1 1 135px;font-size:21px}}';
  document.head.appendChild(css);
  const oldHead = fldHead;
  fldHead = function () {
    const h = oldHead.apply(this, arguments), end = h.lastIndexOf('</div>');
    if (end < 0) return h;
    return h.slice(0,end) + '<div class="rqbar"><small>생산실 음성 요청 ' + VER + ' · 업데이트 ' + BUILT + '</small><button type="button" data-rq-open="1">말로 개선 요청</button></div>' + h.slice(end);
  };
  function database() {
    if (dbp) return dbp;
    dbp = new Promise((resolve,reject) => {
      if (!window.indexedDB) return reject(new Error('storage'));
      const r = indexedDB.open(DB,1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('draft')) r.result.createObjectStore('draft'); };
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    return dbp;
  }
  async function persist(value) {
    try { const db = await database(); await new Promise((resolve,reject) => { const tx=db.transaction('draft','readwrite'); const os=tx.objectStore('draft'); value ? os.put(value,'current') : os.delete('current'); tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error); }); storageOK=true;return true; }
    catch(e){storageOK=false;return false;}
  }
  async function restore() { try {const db=await database();return await new Promise((resolve,reject)=>{const r=db.transaction('draft').objectStore('draft').get('current');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}catch(e){storageOK=false;return null;} }
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=crypto.getRandomValues(new Uint8Array(1))[0]&15;return(c==='x'?r:(r&3)|8).toString(16);});
  function current() {return {id:uuid(),by:typeof fldWk==='function'?fldWk():'',date:typeof fldD==='function'?fldD():'',step:typeof FLD!=='undefined'?FLD.step:'',text:'',dur:0,pending:false,at:Date.now()};}
  function content(inner) {if(!box)return;box.innerHTML='<div class="rqcard" role="document"><h1>생산실 개선 요청</h1><div class="rqmeta">'+E(draft&&draft.by)+' · 일지 '+E(draft&&draft.date)+'</div>'+inner+'<p class="rqsmall">생산실 음성 요청 '+VER+' · 업데이트 '+BUILT+'</p></div>';}
  function buttons(items) {return '<div class="rqbuttons">'+items.map(x=>'<button type="button" data-rq="'+x[0]+'" class="'+(x[2]||'')+'"'+(busy?' disabled':'')+'>'+x[1]+'</button>').join('')+'</div>';}
  function intro(message) {content('<p class="rqnotice">버튼을 누를 때만 녹음합니다. 최대 60초입니다.<br>녹음과 글은 회사 슬랙 「생산실-요청사항」 참여자가 볼 수 있습니다. 개인정보·급여·비밀번호는 말하지 마세요.</p>'+(message?'<p class="rqwarn">'+E(message)+'</p>':'')+'<p>1. 녹음 시작을 누르세요.<br>2. 불편한 점과 바라는 모습을 말씀하세요.<br>3. 멈춘 뒤 내용을 확인하고 보내세요.</p>'+buttons([['start','녹음 시작','primary'],['type','글로 요청'],['close','일지로 돌아가기']]));}
  function review(message) {if(!draft)return;content('<div class="rqstate">보내기 전에 확인하세요</div>'+(message?'<p class="rqwarn">'+E(message)+'</p>':'')+'<div class="rqtext">'+E(draft.text||'글자로 바꾸지 못했습니다. 녹음을 들어 보고 보낼 수 있습니다.')+'</div>'+(draft.blob?'<p>녹음 '+draft.dur+'초 · 원본 녹음도 함께 보냅니다.</p>':'')+(!storageOK?'<p class="rqwarn">이 기기에 임시 보관할 수 없습니다. 화면을 닫거나 새로고침하면 요청을 잃을 수 있습니다.</p>':'')+buttons([...(draft.blob?[['play','녹음 듣기']]:[]),['type','글 고치기'],['send',draft.pending?'다시 보내기':'슬랙으로 보내기','primary'],['redo','다시 녹음'],['close','나중에 보내기']]));}
  async function open() {
    if(box)return;
    draft=draft||await restore()||current();
    if(!draft.by){try{toast('먼저 위쪽에서 작업자를 골라 주세요');}catch(e){}return;}
    box=document.createElement('div');box.id='frq';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','생산실 개선 요청');document.body.appendChild(box);
    box.addEventListener('click',async ev=>{const b=ev.target.closest('[data-rq]');if(!b||busy)return;const a=b.dataset.rq;
      if(a==='start')return start();if(a==='stop')return stop(false);if(a==='cancelrec'){await stop(true);return intro();}
      if(a==='close'){if(rec){await stop(true);}return close();}
      if(a==='play'&&draft.blob){if(audio){audio.pause();URL.revokeObjectURL(audio.src);}audio=new Audio(URL.createObjectURL(draft.blob));audio.play().catch(()=>review('녹음을 재생하지 못했습니다. 스피커를 확인해 주세요.'));return;}
      if(a==='type'){if(draft.pending)return review('이미 접수된 글과 달라지지 않도록 대기 중에는 글을 고칠 수 없습니다. 먼저 다시 보내 주세요.');content('<label for="rqinput">요청 내용</label><textarea id="rqinput" maxlength="1800">'+E(draft.text)+'</textarea>'+buttons([['typed','내용 확인','primary'],['back','돌아가기']]));return;}
      if(a==='typed'){draft.text=(box.querySelector('textarea').value||'').trim();await persist(draft);return review();}
      if(a==='back')return review();if(a==='send')return send();
      if(a==='redo'){if(draft.pending)return review('전송 대기 중인 요청이 있습니다. 다시 보내기를 먼저 눌러 주세요.');draft=current();await persist(null);return start();}
      if(a==='discard'){draft=null;await persist(null);return close();}
    });
    (draft.blob||draft.text||draft.pending)?review(draft.pending?'전송되지 않은 요청을 보관하고 있습니다.':''):intro();
  }
  function close() {opening++;if(audio){audio.pause();URL.revokeObjectURL(audio.src);audio=null;}if(box)box.remove();box=null;}
  function live() {if(!rec||!box)return;const sec=Math.min(60,Math.floor((Date.now()-rec.t0)/1000));const s=box.querySelector('[data-rq-live]');if(s)s.textContent='녹음 중 · '+sec+'초 / 60초';const t=box.querySelector('[data-rq-text]');if(t)t.textContent=(rec.final+' '+rec.interim).trim()||'말씀하시면 글이 여기에 나타납니다.';if(sec>=60)stop(false);}
  async function start() {
    if(rec||busy)return;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return intro('이 브라우저에서는 녹음할 수 없습니다. Chrome에서 열어 주세요.');
    const ticket=++opening;content('<div class="rqstate">마이크 허용을 확인하는 중입니다</div>'+buttons([['close','취소하고 일지로']]));
    let stream,ctx;
    try {
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      if(!box||ticket!==opening){stream.getTracks().forEach(t=>t.stop());return;}
      ctx=new(window.AudioContext||window.webkitAudioContext)();await ctx.resume();
      const src=ctx.createMediaStreamSource(stream),pr=ctx.createScriptProcessor(4096,1,1),gain=ctx.createGain();gain.gain.value=0;
      rec={stream,ctx,src,pr,gain,buf:[],rate:ctx.sampleRate,t0:Date.now(),final:'',interim:'',done:false,sr:null,speechError:''};
      const r=rec;pr.onaudioprocess=e=>{if(rec===r&&!r.done)r.buf.push(new Float32Array(e.inputBuffer.getChannelData(0)));};src.connect(pr);pr.connect(gain);gain.connect(ctx.destination);
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(SR){const sr=new SR();r.sr=sr;sr.lang='ko-KR';sr.continuous=true;sr.interimResults=true;
        sr.onresult=ev=>{if(rec!==r)return;let f='',i='';for(let j=0;j<ev.results.length;j++){if(ev.results[j].isFinal)f+=ev.results[j][0].transcript+' ';else i+=ev.results[j][0].transcript+' ';}r.final=f.trim();r.interim=i.trim();live();};
        sr.onerror=ev=>{r.speechError=ev.error||'unavailable';};try{sr.start();}catch(e){r.speechError='unavailable';}
      }else r.speechError='unsupported';
      content('<div class="rqstate live" data-rq-live>녹음 중 · 0초 / 60초</div><div class="rqtext" data-rq-text>말씀하시면 글이 여기에 나타납니다.</div><p>어느 화면이 불편한지, 어떻게 바꾸면 좋은지 말씀해 주세요.</p>'+buttons([['stop','녹음 멈추기','stop'],['cancelrec','녹음 취소']]));
      r.timer=setInterval(live,250);live();
    }catch(e){if(stream)stream.getTracks().forEach(t=>t.stop());if(ctx)ctx.close().catch(()=>{});rec=null;intro('마이크를 찾지 못했거나 사용이 허용되지 않았습니다. 마이크를 꽂고 주소 옆의 마이크 허용을 확인해 주세요.');}
  }
  async function stop(cancel) {
    if(!rec||rec.done)return;
    const r=rec;r.done=true;clearInterval(r.timer);
    try{r.sr&&(cancel?r.sr.abort():r.sr.stop());}catch(e){}
    r.stream.getTracks().forEach(t=>t.stop());try{r.src.disconnect();r.pr.disconnect();r.gain.disconnect();await r.ctx.close();}catch(e){}
    if(cancel){rec=null;return;}
    content('<div class="rqstate">글자 변환을 마무리하는 중입니다</div>');
    await new Promise(resolve=>setTimeout(resolve,1300));if(rec!==r)return;
    draft.text=(r.final+' '+r.interim).trim().slice(0,1800);draft.dur=Math.min(60,Math.max(1,Math.round((Date.now()-r.t0-1300)/1000)));draft.blob=wav(r.buf,r.rate);draft.pending=false;rec=null;
    await persist(draft);review(!draft.text?'글자 변환이 안 됐습니다. 인터넷을 확인하거나 녹음을 듣고 글을 고쳐 주세요. 녹음만 접수할 수도 있습니다.':r.speechError?'음성 인식이 중간에 멈췄을 수 있습니다. 내용을 확인해 주세요.':'');
  }
  function wav(parts,rate){let len=0;parts.forEach(p=>len+=p.length);const all=new Float32Array(len);let off=0;parts.forEach(p=>{all.set(p,off);off+=p.length;});const R=16000,ratio=rate/R,n=Math.floor(len/ratio),ab=new ArrayBuffer(44+n*2),dv=new DataView(ab);const str=(p,s)=>{for(let k=0;k<s.length;k++)dv.setUint8(p+k,s.charCodeAt(k));};str(0,'RIFF');dv.setUint32(4,36+n*2,true);str(8,'WAVE');str(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,R,true);dv.setUint32(28,R*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);str(36,'data');dv.setUint32(40,n*2,true);for(let i=0;i<n;i++){let s=0,c=0;for(let j=Math.floor(i*ratio);j<Math.min(len,Math.floor((i+1)*ratio));j++){s+=all[j];c++;}const v=Math.max(-1,Math.min(1,c?s/c:0));dv.setInt16(44+i*2,v<0?v*32768:v*32767,true);}return new Blob([ab],{type:'audio/wav'});}
  const b64=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(blob);});
  async function call(q){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),75000);try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign(q,{key:key()})),signal:controller.signal});return await r.json();}finally{clearTimeout(timer);}}
  async function send(quiet) {
    if(busy||!draft||(!draft.text&&!draft.blob))return quiet?null:review('요청 내용을 먼저 녹음하거나 글로 넣어 주세요.');
    if(!key())return quiet?null:review('로그인이 필요합니다. 일지는 그대로 두고 사무실에 로그인 확인을 요청해 주세요.');
    if(!navigator.onLine){draft.pending=true;await persist(draft);return quiet?null:review('인터넷이 끊겨 이 기기에 보관했습니다. 연결되면 다시 보냅니다.');}
    busy=true;draft.pending=true;await persist(draft);if(box)content('<div class="rqstate">슬랙으로 보내는 중입니다</div><p>일지 입력 내용은 그대로 있습니다. 창을 새로고침하지 마세요.</p>');
    try {
      const q={op:'request_post',id:draft.id,by:draft.by,date:draft.date,step:draft.step,text:draft.text,dur:draft.dur};if(draft.blob){q.b64=await b64(draft.blob);q.mime='audio/wav';}
      const r=await call(q);
      if(!r.ok)throw new Error(r.err==='auth'?'연결 확인이 필요합니다. 사무실에 알려 주세요.':r.err==='busy'?'요청이 많아 잠시 보관했습니다.':'전송하지 못했습니다. 요청은 이 기기에 보관했습니다.');
      if(r.status!=='sent'||r.audio==='pending')throw new Error(r.status==='sent'?'글은 접수됐지만 녹음 첨부는 전송 대기입니다. 다시 보내도 같은 글로 이어집니다.':'슬랙 접수가 대기 중입니다. 다시 보내도 요청은 중복되지 않습니다.');
      const id=draft.id;await persist(null);draft=null;busy=false;
      if(box)content('<div class="rqstate rqdone">슬랙에 접수됐습니다</div><p>조조가 확인한 뒤 요청 글의 댓글로 처리 결과를 알려 드립니다.<br>접수는 기능 반영 완료를 뜻하지 않습니다.</p><p class="rqsmall">요청번호 '+E(id)+'</p>'+buttons([['close','일지로 돌아가기','primary']]));
    }catch(e){busy=false;if(box)review(e.name==='AbortError'?'연결이 늦어 요청을 보관했습니다. 다시 보내도 중복되지 않습니다.':e.message);}
  }
  document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('#fld [data-rq-open]');if(!b)return;ev.preventDefault();ev.stopPropagation();open();},true);
  document.addEventListener('keydown',ev=>{if(!box)return;if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();if(!busy&&!rec)close();}if(ev.key==='Tab'){const bs=[...box.querySelectorAll('button:not(:disabled),textarea')];if(!bs.length)return;const first=bs[0],last=bs[bs.length-1];if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}}},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&rec)stop(false);});
  window.addEventListener('pagehide',()=>{if(rec){try{rec.sr&&rec.sr.abort();}catch(e){}rec.stream.getTracks().forEach(t=>t.stop());}});
  async function retry(){if(box||rec||busy)return;draft=draft||await restore();if(draft&&draft.pending&&key()&&navigator.onLine)send(true);}
  window.addEventListener('online',retry);setInterval(retry,60000);
  try{if(FLD.open)fieldRender();}catch(e){}
})();
