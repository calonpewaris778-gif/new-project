const $=id=>document.getElementById(id),QA=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let mem={};
const get=(k,d)=>{try{const v=localStorage.getItem('sk_'+k);return v?JSON.parse(v):d}catch(e){return k in mem?mem[k]:d}};
const put=(k,v)=>{mem[k]=v;try{localStorage.setItem('sk_'+k,JSON.stringify(v))}catch(e){}};
const sl=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- Router ---------- */
const PG=['beranda','darurat','tanya','siaga','belajar'];
function route(){
  let h=location.hash.replace('#/','')||'beranda';if(!PG.includes(h))h='beranda';
  PG.forEach(p=>$('pg-'+p).hidden=p!==h);
  QA('#nav a').forEach(a=>a.getAttribute('href')==='#/'+h?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
  $('fab').hidden=h==='darurat';
  $('sa').hidden=true;
  scrollTo(0,0);$('pg-'+h).querySelector('h1').focus({preventScroll:true});
}
addEventListener('hashchange',route);
function tabs(id){const bs=QA('#'+id+' [role=tab]');bs.forEach(b=>b.onclick=()=>bs.forEach(x=>{x.setAttribute('aria-selected',x===b);$(x.dataset.t).hidden=x!==b}))}
tabs('tb1');tabs('tb2');
function net(){$('net').hidden=navigator.onLine}
addEventListener('online',()=>{net();loadQ()});addEventListener('offline',net);net();

/* ---------- Lokasi ---------- */
let pos=null;
function getPos(ok,fail){
  if(!navigator.geolocation)return fail();
  navigator.geolocation.getCurrentPosition(p=>{pos={lat:p.coords.latitude,lon:p.coords.longitude,acc:Math.round(p.coords.accuracy)};ok(pos)},fail,{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
}
const hv=(a,b,c,d)=>{const r=x=>x*Math.PI/180,R=6371,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 2*R*Math.asin(Math.sqrt(h))};

/* ---------- Data BMKG ---------- */
const BM='https://data.bmkg.go.id/DataMKG/TEWS/';
const jf=u=>fetch(BM+u,{cache:'no-store'}).then(r=>{if(!r.ok)throw 0;return r.json()});
let qdata=get('q',null);
async function loadQ(){
  if(!navigator.onLine){showQ(qdata,true);return}
  try{
    const [a,b]=await Promise.allSettled([jf('autogempa.json'),jf('gempaterkini.json')]);
    if(a.status!=='fulfilled')throw 0;
    qdata={a:a.value.Infogempa.gempa,l:b.status==='fulfilled'?b.value.Infogempa.gempa.slice(0,5):[],t:Date.now()};
    put('q',qdata);showQ(qdata,false);checkNew(qdata.a);
  }catch(e){showQ(qdata,true)}
}
function distTxt(g){
  if(!pos||!g.Coordinates)return '';
  const c=g.Coordinates.split(',').map(parseFloat);if(c.length<2||c.some(isNaN))return '';
  return `<p><b>${Math.round(hv(pos.lat,pos.lon,c[0],c[1]))} km</b> dari lokasimu</p>`;
}
function showQ(d,old){
  const el=$('qk');
  if(!d){el.innerHTML='<p>Data gempa tidak dapat dimuat. Penyebabnya bisa karena tidak ada sinyal atau akses dibatasi. Buka <a href="https://www.bmkg.go.id" target="_blank" rel="noopener">bmkg.go.id</a> untuk informasi terbaru.</p>';return}
  const g=d.a,p=g.Potensi||'',risky=/tsunami/i.test(p)&&!/tidak/i.test(p);
  const t=new Date(d.t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  el.innerHTML=`<h3>Gempa terbaru</h3><div class="mag">M ${esc(g.Magnitude)}</div><p><b>${esc(g.Wilayah)}</b></p><p>${esc(g.Tanggal)}, ${esc(g.Jam)}. Kedalaman ${esc(g.Kedalaman)}.</p>${g.Dirasakan?`<p>Dirasakan: ${esc(g.Dirasakan)}</p>`:''}<p class="${risky?'warn':''}">${esc(p)}</p>${distTxt(g)}
  ${d.l&&d.l.length?'<h3 style="margin-top:14px">Gempa M5 atau lebih baru-baru ini</h3><ul class="list">'+d.l.map(x=>`<li>M ${esc(x.Magnitude)} · ${esc(x.Wilayah)}<br><span style="font-size:.85rem">${esc(x.Tanggal)}, ${esc(x.Jam)}</span></li>`).join('')+'</ul>':''}
  <p style="margin-top:10px;font-size:.85rem">${old?'Tidak bisa memuat data baru. Ini data tersimpan pukul '+t+'.':'Diperbarui pukul '+t+'.'} Sumber: BMKG.</p>`;
}
function checkNew(g){
  const last=get('lastq',null);put('lastq',g.DateTime);
  if(last&&last!==g.DateTime&&parseFloat(g.Magnitude)>=4.5){
    const m=`Gempa baru M ${g.Magnitude}: ${g.Wilayah}`;
    $('nqt').textContent=m;$('nq').hidden=false;navigator.vibrate&&navigator.vibrate([300,150,300]);
    try{if(Notification.permission==='granted')new Notification('SiagaKita',{body:m})}catch(e){}
  }
}
$('nqx').onclick=()=>$('nq').hidden=true;
$('qr').onclick=()=>{$('qk').innerHTML='<p>Memuat...</p>';loadQ()};
$('qd').onclick=()=>{$('qd').textContent='Mencari lokasi...';getPos(()=>{$('qd').textContent='Hitung jarak dari lokasiku';showQ(qdata,!navigator.onLine)},()=>{$('qd').textContent='Lokasi tidak tersedia. Coba lagi'})};
$('nt').onclick=async()=>{try{const r=await Notification.requestPermission();$('ntm').textContent=r==='granted'?'Notifikasi aktif selama halaman terbuka.':'Izin notifikasi tidak diberikan.'}catch(e){$('ntm').textContent='Browser ini tidak mendukung notifikasi.'}};
loadQ();setInterval(()=>{if(!document.hidden)loadQ()},60000);

/* ---------- Deteksi guncangan ---------- */
let hits=[],cool=0;
function onMotion(e){
  const a=e.accelerationIncludingGravity;if(!a)return;
  const d=Math.abs(Math.hypot(a.x||0,a.y||0,a.z||0)-9.8),n=Date.now();
  if(d>3)hits.push(n);hits=hits.filter(t=>n-t<2500);
  if(hits.length>=40&&n>cool){cool=n+60000;hits=[];$('sa').hidden=false;navigator.vibrate&&navigator.vibrate([500,200,500,200,500])}
}
$('sk').onclick=async()=>{
  const b=$('sk');
  if(b.getAttribute('aria-pressed')==='true'){removeEventListener('devicemotion',onMotion);b.setAttribute('aria-pressed','false');b.textContent='Aktifkan deteksi';$('skm').textContent='';return}
  try{
    if(typeof DeviceMotionEvent!=='undefined'&&DeviceMotionEvent.requestPermission){if(await DeviceMotionEvent.requestPermission()!=='granted'){$('skm').textContent='Izin sensor ditolak.';return}}
    if(!('DeviceMotionEvent' in window))throw 0;
    addEventListener('devicemotion',onMotion);b.setAttribute('aria-pressed','true');b.textContent='Matikan deteksi';$('skm').textContent='Aktif. Biarkan halaman ini tetap terbuka.';
  }catch(e){$('skm').textContent='Perangkat ini tidak mendukung sensor gerak.'}
};
$('sax').onclick=()=>$('sa').hidden=true;$('sao').onclick=()=>$('sa').hidden=true;

/* ---------- Panduan darurat ---------- */
const LOC=[['dalam','Di dalam rumah atau gedung'],['tinggi','Di gedung tinggi'],['luar','Di luar ruangan'],['kendaraan','Di dalam kendaraan'],['pantai','Di pantai atau dekat laut'],['tidur','Sedang tidur atau di kasur']];
const GD={
 dalam:['Merunduk sekarang. Jangan berlari keluar saat tanah masih berguncang.','Berlindung di bawah meja yang kokoh. Lindungi kepala dan leher dengan lengan.','Berpegangan pada kaki meja dan ikut bergeser jika meja bergerak.','Jauhi kaca, jendela, lemari, dan lampu gantung.','Jika tidak ada meja, berlindung di sudut ruangan sambil menutup kepala dan leher.'],
 tinggi:['Merunduk, berlindung, dan berpegangan di tempatmu sekarang.','Jangan berlari ke tangga dan jangan memakai lift saat berguncang.','Jauhi kaca dan benda yang bisa jatuh.','Alarm dan sprinkler bisa menyala. Tetap tenang dan ikuti arahan petugas gedung.'],
 luar:['Menjauh dari bangunan, tiang listrik, papan reklame, dan pohon besar.','Menuju tempat terbuka, lalu merunduk dan lindungi kepala.','Jangan masuk ke dalam gedung.','Waspadai kaca dan reruntuhan yang jatuh dari atas.'],
 kendaraan:['Menepi pelan-pelan ke tempat terbuka, jauh dari jembatan, terowongan, dan kabel listrik.','Nyalakan lampu hazard dan tarik rem tangan.','Tetap di dalam kendaraan sampai guncangan berhenti.','Setelah itu, hindari jembatan dan jalan yang retak.'],
 pantai:['Jika guncangan terasa kuat atau lama, atau air laut tiba-tiba surut, segera menuju tempat tinggi. Jangan menunggu peringatan.','Berjalan kaki ke bukit atau ke lantai atas gedung beton yang kokoh.','Tsunami bisa datang beberapa kali. Gelombang pertama belum tentu yang terbesar.','Jangan kembali ke pantai sebelum ada pernyataan aman dari BMKG atau BPBD.'],
 tidur:['Tetap di tempat tidur, tengkurap, dan lindungi kepala dengan bantal.','Berpegangan pada tempat tidur.','Jika ada lampu gantung atau benda berat di atas kasur, geser ke lantai di sampingnya dan berlindung di bawah meja.','Setelah guncangan berhenti, pakai alas kaki sebelum berjalan karena mungkin ada pecahan kaca.'],
 sesudah:['Periksa dirimu dan orang di sekitarmu. Beri pertolongan pertama bila perlu.','Pakai alas kaki. Waspadai pecahan kaca dan gempa susulan.','Jika tercium bau gas, jangan menyalakan api atau saklar. Buka jendela dan keluar. Matikan listrik dari meteran bila aman.','Keluar lewat jalur aman menuju tempat terbuka. Jangan memakai lift.','Kirim pesan teks, bukan telepon lama, agar jaringan tidak penuh. Pakai alat Kirim kabar.','Ikuti informasi resmi dari BMKG dan BPBD.']
};
const LN=Object.fromEntries(LOC);LN.sesudah='Setelah guncangan berhenti';
let G={k:null,i:0,v:!!get('voice',false)};
$('locs').innerHTML=LOC.map(l=>`<button class="btn ol" data-k="${l[0]}">${l[1]}</button>`).join('');
QA('#locs button').forEach(b=>b.onclick=()=>{G.k=b.dataset.k;G.i=0;step()});
$('sd').onclick=()=>{G.k='sesudah';G.i=0;step()};
function voiceBtn(){$('vb').setAttribute('aria-pressed',G.v);$('vb').textContent='Suara: '+(G.v?'nyala':'mati')}
$('vb').onclick=()=>{G.v=!G.v;put('voice',G.v);voiceBtn();if(!G.v&&window.speechSynthesis)speechSynthesis.cancel();else if(G.k)step()};
voiceBtn();
function step(){
  const s=GD[G.k],n=s.length,last=G.i===n-1,b=$('gbox');b.hidden=false;
  b.innerHTML=`<p class="sm">${LN[G.k]}. Langkah ${G.i+1} dari ${n}</p><p class="gt">${s[G.i]}</p><div class="dots">${s.map((_,i)=>`<i class="${i<=G.i?'on':''}"></i>`).join('')}</div>
  <div class="row"><button class="btn ol" id="gp" ${G.i?'':'disabled'}>Sebelumnya</button><button class="btn yel" id="gn">${last?(G.k==='sesudah'?'Selesai':'Setelah guncangan berhenti'):'Lanjut'}</button></div>`;
  $('gp').onclick=()=>{G.i--;step()};
  $('gn').onclick=()=>{if(!last){G.i++;step()}else if(G.k!=='sesudah'){G.k='sesudah';G.i=0;step()}else{b.hidden=true;G.k=null}};
  if(G.v&&window.speechSynthesis){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(s[G.i]);u.lang='id-ID';speechSynthesis.speak(u)}
  b.scrollIntoView({block:'nearest',behavior:'smooth'});
}

/* ---------- Alat darurat ---------- */
const ov=$('ov');let stream=null,sosOn=false,ac,osc,sirenT;
async function torch(on){
  try{
    if(on){stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});await stream.getVideoTracks()[0].applyConstraints({advanced:[{torch:true}]})}
    else if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
  }catch(e){}
}
function closeOv(){sosOn=false;ov.className='';ov.style.background='#fff';torch(false)}
ov.onclick=closeOv;ov.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')closeOv()};
$('tl').onclick=()=>{ov.style.background='#fff';ov.className='on';torch(true)};
$('so').onclick=async()=>{
  sosOn=true;ov.className='on';
  while(sosOn){
    for(const [i,c] of [...'...---...'].entries()){if(!sosOn)break;ov.style.background='#fff';await sl(c==='.'?250:750);ov.style.background='#000';await sl(250);if(i===2||i===5)await sl(500)}
    await sl(1500);
  }
};
function siren(on){
  const b=$('sr');b.setAttribute('aria-pressed',on);b.textContent=on?'Hentikan sirine':'Nyalakan sirine';
  if(on){
    try{
      ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.resume)ac.resume();
      osc=ac.createOscillator();const g=ac.createGain();osc.type='square';g.gain.value=.7;osc.connect(g);g.connect(ac.destination);osc.start();
      let f=800,up=true;sirenT=setInterval(()=>{f+=up?40:-40;if(f>1800)up=false;if(f<800)up=true;osc.frequency.value=f},50);
    }catch(e){b.textContent='Suara tidak didukung'}
  }else{clearInterval(sirenT);try{osc&&osc.stop()}catch(e){}}
}
$('sr').onclick=()=>siren($('sr').getAttribute('aria-pressed')!=='true');
function kabar(status){
  const w=new Date().toLocaleString('id-ID'),build=p=>{
    const loc=p?`Lokasiku: https://maps.google.com/?q=${p.lat},${p.lon} (akurasi sekitar ${p.acc} m)`:'Lokasi GPS belum tersedia.';
    const m=`${status}. ${w}. ${loc}`,e=encodeURIComponent(m);
    $('kb').innerHTML=`<p style="color:var(--ink)">${esc(m)}</p><div class="row"><a class="btn yel" target="_blank" rel="noopener" href="https://wa.me/?text=${e}">WhatsApp</a><a class="btn ol" href="sms:?&body=${e}">SMS</a><button class="btn ol" id="bs">Bagikan</button><button class="btn ol" id="bc">Salin</button></div>`;
    $('bs').onclick=()=>{navigator.share?navigator.share({text:m}).catch(()=>{}):($('bs').textContent='Tidak didukung')};
    $('bc').onclick=()=>{navigator.clipboard?navigator.clipboard.writeText(m).then(()=>$('bc').textContent='Tersalin'):($('bc').textContent='Salin manual')};
  };
  $('kb').innerHTML='<p>Mencari lokasi GPS...</p>';getPos(build,()=>build(null));
}
QA('[data-s]').forEach(b=>b.onclick=()=>kabar(b.dataset.s));

/* ---------- Tanya Siaga (logika pencocok ada di kb.js) ---------- */
const SUG=['Bagaimana kalau gempa di sekolah?','Aku terjebak reruntuhan','Setelah gempa, apa yang harus dilakukan?','Tercium bau gas','Isi tas siaga apa saja?','Kenapa gempa bisa terjadi?'];
$('sug').innerHTML=SUG.map(s=>`<button class="btn ol" data-q="${esc(s)}">${esc(s)}</button>`).join('');
let lastQ='';
const chip=t=>`<button class="btn ol" data-tp="${t.id}">${esc(t.title)}</button>`;
const allChips=()=>'<div class="chips">'+SK.topics.map(chip).join('')+'</div>';
function say(h){const c=$('chat');c.insertAdjacentHTML('beforeend',`<div class="msg bot">${h}</div>`);c.scrollTop=c.scrollHeight}
function topicHtml(t,alts){
  return `<p class="tp">Topik: ${esc(t.title)}</p>${t.a}`+(alts&&alts.length?`<p class="alt">Bukan ini? Mungkin maksudmu:</p><div class="chips">${alts.map(chip).join('')}</div>`:'')+`<div class="chips"><button class="btn ol" data-fb="1">Sesuai</button><button class="btn ol" data-fb="0">Tidak sesuai</button></div>`;
}
function ask(q){
  q=q.trim();if(!q)return;lastQ=q;
  $('chat').insertAdjacentHTML('beforeend',`<div class="msg me">${esc(q)}</div>`);
  const r=SK.answer(q);
  if(r.best)say(topicHtml(r.best,r.alts));
  else say('Aku belum menemukan topik yang cocok. Pilih topik di bawah, atau tulis ulang dengan kata kunci seperti "mobil", "sekolah", atau "tsunami". Jika sedang dalam bahaya, hubungi 112.'+allChips());
}
$('askf').onsubmit=e=>{e.preventDefault();ask($('askq').value);$('askq').value=''};
$('sug').onclick=e=>{const b=e.target.closest('button');if(b)ask(b.dataset.q)};
$('allt').onclick=()=>say('Pilih topik yang ingin kamu baca:'+allChips());
$('chat').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.tp){const t=SK.byId(b.dataset.tp);$('chat').insertAdjacentHTML('beforeend',`<div class="msg me">${esc(t.title)}</div>`);say(topicHtml(t,[]))}
  else if(b.dataset.fb==='1'){b.parentNode.innerHTML='<span>Terima kasih atas masukanmu.</span>'}
  else if(b.dataset.fb==='0'){const m=get('miss',[]);m.push(lastQ);put('miss',m.slice(-50));b.parentNode.innerHTML='<span>Maaf kurang tepat.</span>';say('Pilih topik yang kamu maksud:'+allChips())}
};

/* ---------- Siaga ---------- */
let S=get('siaga',{n:3,ex:[],done:[]});
const EX=[['balita','Ada balita','Susu, popok, dan pakaian cadangan untuk balita'],['lansia','Ada lansia','Kacamata cadangan dan alat bantu jalan'],['obat','Obat rutin','Obat rutin untuk minimal 7 hari beserta resepnya'],['hewan','Hewan peliharaan','Makanan dan tali atau kandang bawa untuk hewan']];
const RM=['Lemari dan rak tinggi sudah dikaitkan ke dinding','Barang berat disimpan di rak paling bawah','Aku tahu meja kokoh untuk berlindung di tiap ruangan','Jalur keluar rumah tidak terhalang barang','Aku tahu cara mematikan listrik dan gas','Tas siaga ada di dekat pintu keluar','Nomor darurat tersimpan di ponselku'];
let H=get('rumah',[]);
function tas(){
  const n=S.n;$('nv').textContent=n;
  $('ex').innerHTML=EX.map(e=>`<button class="btn ol" aria-pressed="${S.ex.includes(e[0])}" data-x="${e[0]}">${e[1]}</button>`).join('');
  const it=[['air',`Air minum ${n*9} liter (3 liter per orang per hari, untuk 3 hari)`],['mkn','Makanan tahan lama untuk 3 hari'],['snt','Senter dan baterai cadangan'],['plt','Peluit'],['pb','Power bank terisi penuh'],['p3k','Perlengkapan P3K dan masker'],['dok','Salinan KTP dan KK dalam plastik kedap air'],['uang','Uang tunai secukupnya'],['pak','Pakaian, jas hujan, dan alas kaki tertutup'],...EX.filter(e=>S.ex.includes(e[0])).map(e=>[e[0],e[2]])];
  $('tas').innerHTML=it.map(i=>`<li><label><input type="checkbox" data-k="${i[0]}" ${S.done.includes(i[0])?'checked':''}><span>${esc(i[1])}</span></label></li>`).join('');
  const upd=()=>{S.done=QA('#tas input:checked').map(i=>i.dataset.k);put('siaga',S);const p=Math.round(S.done.filter(k=>it.some(i=>i[0]===k)).length/it.length*100);$('tb').style.width=p+'%';$('tt').textContent=p+'% tas siaga sudah siap.'};
  QA('#tas input').forEach(i=>i.onchange=upd);upd();
  QA('#ex button').forEach(b=>b.onclick=()=>{const k=b.dataset.x;S.ex=S.ex.includes(k)?S.ex.filter(x=>x!==k):[...S.ex,k];put('siaga',S);tas()});
}
$('nm').onclick=()=>{S.n=Math.max(1,S.n-1);put('siaga',S);tas()};$('np').onclick=()=>{S.n=Math.min(12,S.n+1);put('siaga',S);tas()};
tas();
$('rm').innerHTML=RM.map((r,i)=>`<li><label><input type="checkbox" data-i="${i}" ${H.includes(i)?'checked':''}><span>${r}</span></label></li>`).join('');
function hu(){H=QA('#rm input:checked').map(i=>+i.dataset.i);put('rumah',H);const n=H.length;$('hb').style.width=Math.round(n/RM.length*100)+'%';
  $('ht').textContent=`${n} dari ${RM.length} sudah beres. `+(n===RM.length?'Rumahmu sudah siap.':n>=4?'Sedikit lagi. Selesaikan yang belum dicentang.':'Mulai dari yang paling mudah, misalnya menyimpan nomor darurat.')}
QA('#rm input').forEach(i=>i.onchange=hu);hu();

/* ---------- Belajar: latihan ---------- */
const DR=['Merunduk','Berlindung','Berpegangan'];let dt=0,dn=0,dT=null;
function drillStart(){
  const d=$('drill');d.className='';
  const best=get('best',null);
  d.innerHTML=`<p>${best?'Waktu terbaikmu: '+best+' detik.':'Belum ada waktu tercatat.'}</p><button class="btn dk" id="ds">Mulai latihan</button>`;
  $('ds').onclick=()=>{d.innerHTML='<p><b>Bersiap...</b> Tunggu tanda gempa.</p>';dT=setTimeout(drillGo,2000+Math.random()*3000)};
}
function drillGo(){
  const d=$('drill');dn=0;dt=Date.now();d.className='go';navigator.vibrate&&navigator.vibrate(300);
  const draw=()=>{d.innerHTML=`<h2 style="color:#fff">GEMPA!</h2><p style="color:#fff">Ketuk langkah ${dn+1}:</p><div class="row">${DR.map((x,i)=>`<button class="btn ${i===dn?'yel':'ol'}" data-i="${i}">${x}</button>`).join('')}</div>`;
    QA('#drill [data-i]').forEach(b=>b.onclick=()=>{if(+b.dataset.i!==dn){navigator.vibrate&&navigator.vibrate(120);return}dn++;if(dn<3)draw();else{
      const s=((Date.now()-dt)/1000).toFixed(1),best=get('best',null);if(!best||+s<+best)put('best',s);d.className='';
      d.innerHTML=`<h2>Waktumu ${s} detik</h2><p>${+s<6?'Bagus. Ulangi sampai gerakannya otomatis.':'Ulangi dan coba lebih cepat. Targetnya di bawah 6 detik.'}</p><button class="btn dk" id="dr">Latihan lagi</button>`;$('dr').onclick=drillStart}})};
  draw();
}
drillStart();

/* ---------- Belajar: mitos atau fakta ---------- */
const MF=[['Berdiri di ambang pintu adalah tempat paling aman saat gempa.',false,'Mitos. Ambang pintu tidak lebih kuat dari bagian bangunan lain. Berlindung di bawah meja kokoh lebih aman.'],['Jangan memakai lift saat gempa.',true,'Fakta. Lift bisa berhenti karena listrik padam dan membuatmu terjebak.'],['Gempa susulan tidak berbahaya karena lebih kecil.',false,'Mitos. Gempa susulan bisa merobohkan bangunan yang sudah rusak.'],['Gempa kuat di pantai berarti harus segera ke tempat tinggi.',true,'Fakta. Jangan menunggu peringatan resmi, karena tsunami bisa tiba dalam hitungan menit.'],['Hewan dapat memprediksi gempa dengan pasti.',false,'Mitos. Belum ada bukti ilmiah yang bisa diandalkan, dan gempa belum bisa diprediksi.']];
$('b-b').innerHTML=MF.map((m,i)=>`<div class="card" id="mf${i}"><p style="color:var(--ink);font-size:1.05rem;font-weight:600">${m[0]}</p><div class="row"><button class="btn ol" data-m="${i}" data-v="1">Fakta</button><button class="btn ol" data-m="${i}" data-v="0">Mitos</button></div><p id="mr${i}" style="margin-top:8px"></p></div>`).join('');
QA('#b-b [data-m]').forEach(b=>b.onclick=()=>{const i=+b.dataset.m,m=MF[i],ok=(b.dataset.v==='1')===m[1];$('mf'+i).className='card '+(ok?'ok':'no');$('mr'+i).textContent=(ok?'Benar. ':'Kurang tepat. ')+m[2]});

/* ---------- Belajar: kuis ---------- */
const QZ=[['Saat gempa di dalam bangunan, apa yang dilakukan?',['Berlari keluar secepatnya','Merunduk, berlindung, berpegangan','Berdiri di ambang pintu'],1,'Berlari saat berguncang berisiko tertimpa benda jatuh.'],['Berapa air minum per orang per hari untuk tas siaga?',['1 liter','3 liter','10 liter'],1,'Hitung 3 liter per orang per hari untuk 3 hari.'],['Di luar ruangan saat gempa, kamu sebaiknya...',['Menjauh dari bangunan, tiang, dan pohon','Berteduh di dekat gedung','Masuk ke dalam gedung'],0,'Bahaya terbesar di luar ruangan adalah benda yang jatuh dari atas.'],['Gempa kuat dan lama terasa di pantai. Apa yang dilakukan?',['Menunggu peringatan resmi','Segera menuju tempat tinggi','Memotret dulu'],1,'Tsunami bisa tiba sangat cepat, jadi waktu sangat berharga.'],['Setelah gempa, cara terbaik memberi kabar adalah...',['Telepon lama','Pesan teks singkat','Menunggu sampai malam'],1,'Pesan teks lebih ringan bagi jaringan yang sedang penuh.']];
let qi=0,qs=0;
function qz(){
  const b=$('qzb');
  if(qi>=QZ.length){b.innerHTML=`<h2>Skormu ${qs} dari ${QZ.length}</h2><p>${qs===QZ.length?'Sempurna. Bagikan ilmunya ke keluarga dan teman.':'Coba ulangi dan perhatikan penjelasannya.'}</p><div class="row"><button class="btn dk" id="qa">Ulangi kuis</button></div>`;$('qa').onclick=()=>{qi=0;qs=0;qz()};return}
  const q=QZ[qi];
  b.innerHTML=`<p class="sm" style="color:var(--muted)!important">Pertanyaan ${qi+1} dari ${QZ.length}</p><h3 style="margin:6px 0 12px">${q[0]}</h3><div class="grid">${q[1].map((o,i)=>`<button class="btn ol" data-o="${i}">${o}</button>`).join('')}</div><p id="qf" style="margin-top:12px" aria-live="polite"></p><div class="row" id="qn"></div>`;
  QA('#qzb [data-o]').forEach(x=>x.onclick=()=>{
    const ok=+x.dataset.o===q[2];if(ok)qs++;
    QA('#qzb [data-o]').forEach(y=>{y.disabled=true;if(+y.dataset.o===q[2])y.classList.add('ok');else if(y===x)y.classList.add('no')});
    $('qf').textContent=(ok?'Benar. ':'Kurang tepat. ')+q[3];
    $('qn').innerHTML=`<button class="btn dk" id="qx">${qi===QZ.length-1?'Lihat skor':'Pertanyaan berikutnya'}</button>`;$('qx').onclick=()=>{qi++;qz()};
  });
}
qz();

/* ---------- Umpan balik ---------- */
let FB=get('fb',[]);
function fbs(){const n=FB.length;$('fbr').textContent=n?`${n} penilaian tercatat di perangkat ini.`:''}
QA('#fb button').forEach(b=>b.onclick=()=>{FB.push(b.dataset.f);put('fb',FB);fbs()});fbs();

route();

if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
