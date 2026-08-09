# PEMILIH MUDA

Platform edukasi dan quiz pemilih pemula berbasis Google Apps Script dan Google Sheets. Repository ini saat ini menyelesaikan **Phase 1 — Foundation & Database**.

## Yang sudah tersedia

- Schema 17 sheet yang executable dan tervalidasi.
- `setupApplication()` idempotent untuk database, headers, settings, secret pepper, dan folder Drive.
- Dukungan pembuatan superadmin awal secara aman melalui Script Properties.
- `seedDemoData()` idempotent: 5 sekolah, 20 soal, 1 season, 5 materi, dan 3 pengumuman.
- Data-access helper dengan operasi batch dan penolakan perubahan schema destruktif.
- Format respons API konsisten dan landing shell responsive awal.
- Dokumentasi arsitektur, alur auth/quiz/point/winner, keamanan, PWA, dan roadmap.

Fitur auth, quiz, leaderboard, admin, dan PWA penuh belum diklaim selesai; semuanya dijadwalkan pada fase berikutnya. Lihat [arsitektur](docs/ARCHITECTURE.md), [setup](SETUP.md), dan [panduan pengembangan](DEVELOPMENT.md).

## Pemeriksaan lokal

```powershell
npm test
```

Tidak ada package runtime atau framework frontend.
