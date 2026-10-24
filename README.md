# SiagaKita

Panduan gempa gratis: mode darurat, alat SOS, data BMKG, tanya jawab, dan daftar siaga.
Situs statis (HTML, CSS, JavaScript) tanpa build dan tanpa dependensi.

## Struktur
- `index.html` kerangka halaman dan lima halaman (Beranda, Darurat, Tanya, Siaga, Belajar)
- `style.css` tampilan responsif (menu bawah di ponsel)
- `script.js` logika antarmuka, data BMKG, alat darurat, latihan, kuis
- `kb.js` basis pengetahuan dan pencocok pertanyaan Tanya Siaga
- `sw.js`, `manifest.json`, `icon.svg` agar bisa dipasang dan dibuka tanpa internet
- `test-kb.js` uji pencocok pertanyaan: `node test-kb.js`

## Jalankan lokal
`python -m http.server 8000` lalu buka http://localhost:8000

## Publikasi (pilih satu)
**GitHub Pages:** unggah semua file ke repositori, lalu Settings > Pages > Deploy from a branch > main > / (root).
**Netlify:** buka https://app.netlify.com/drop lalu seret folder ini.
**Vercel:** impor repositori GitHub, Framework Preset "Other", kosongkan build command dan output directory.

## Batasan
Bukan sistem peringatan dini resmi. Data BMKG baru tersedia setelah gempa terjadi.
Utamakan informasi resmi BMKG dan BPBD.
