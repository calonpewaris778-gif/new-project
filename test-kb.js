// Jalankan: node test-kb.js
const SK=require('./kb.js');
const cases=[
['Bagaimana kalau gempa saat di rumah?','rumah'],['bagaimana kalau di mobil?','kendaraan'],['Aku terjebak reruntuhan','terjebak'],
['Ada gempa susulan, apa yang dilakukan?','susulan'],['Tercium bau gas','gas'],['Isi tas siaga apa saja?','tas'],['Ada bayi di rumah','anak'],
['Bagaimana kalau gempa di sekolah?','sekolah'],['Setelah gempa, apa yang harus dilakukan?','sesudah'],['apa yang harus dilakukan saat gempa','saat'],
['Kenapa gempa bisa terjadi?','penyebab'],['apa itu magnitudo','magnitudo'],['boleh pakai lift?','lift'],['aku takut gempa','cemas'],
['anak saya takut','anak'],['gempa di mall','keramaian'],['saya ada di lantai 12','tinggi'],['ada gempa di pantai','tsunami'],
['gempa saat tidur malam','tidur'],['nomor darurat apa','nomor'],['bagaimana cara pakai sirine','fitur'],['Mau tanya soal kucing saya','hewan'],
['tanah sedang berguncang','sekarang'],['gempa sedang terjadi sekarang','sekarang'],['ada luka berdarah','p3k'],['rumahku retak setelah gempa','bangunan'],
['bagaimana cara menyiapkan tas','tas'],['halo','sapaan'],['longsor','longsor'],['Bagaimana kalau gempa saat kuliah','sekolah'],
['kapan gempa besar akan terjadi','prediksi'],['apakah aman masuk rumah lagi','bangunan'],['bagaimana kalau gempa di gunung','longsor'],
['hp saya mati sinyal hilang','komunikasi'],['cara mengamankan lemari di rumah','rumahsiap'],['apakah ada gempa susulan setelah gempa besar','susulan'],
['saya tinggal di apartemen lantai 5','tinggi'],['bagaimana kalau di bus','kendaraan'],['ibu hamil harus bagaimana','lansia'],['kasur saya di bawah lampu gantung','tidur']
];
let bad=0;
for(const [q,e] of cases){const r=SK.answer(q);const g=r.best?r.best.id:'(tidak ada)';
  if(g!==e){bad++;console.log('SALAH:',q,'=>',g,'(harusnya',e+')')}}
console.log(cases.length-bad+'/'+cases.length+' benar');
const none=['xyz','apa kabar dunia','resep nasi goreng'];
none.forEach(q=>console.log('tanpa topik:',q,'=>',SK.answer(q).best?SK.answer(q).best.id:'(tidak ada)'));
process.exit(bad?1:0);
