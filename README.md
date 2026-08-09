# PEMILIH MUDA

Platform edukasi dan quiz pemilih pemula berbasis Google Apps Script dan Google Sheets. Repository ini saat ini menyelesaikan **Phase 6 — Point Engine**.

## Yang sudah tersedia

- Schema 17 sheet yang executable dan tervalidasi.
- `setupApplication()` idempotent untuk database, headers, settings, secret pepper, dan folder Drive.
- Dukungan pembuatan superadmin awal secara aman melalui Script Properties.
- `seedDemoData()` idempotent: 5 sekolah, 20 soal, 1 season, 5 materi, dan 3 pengumuman.
- Data-access helper dengan operasi batch dan penolakan perubahan schema destruktif.
- Format respons API konsisten dan landing shell responsive awal.
- Dokumentasi arsitektur, alur auth/quiz/point/winner, keamanan, PWA, dan roadmap.
- Registrasi peserta dengan master sekolah, validasi server, dan pencegahan duplikasi NIS/email.
- Login Email/NISN, session token 12 jam, logout, session expiry, dan rate limiting.
- Role guard admin, validasi peserta, reset password admin, pencabutan sesi, dan activity log.
- Landing page serta dialog login/registrasi mobile-first yang terhubung ke Apps Script.
- Dashboard peserta terautentikasi dengan point, ranking, season, progress, materi, pengumuman, dan Top 3.
- Layar Belajar, Top 50 leaderboard, profil pribadi, bottom navigation, skeleton loading, session restore, dan logout.
- API admin CRUD season, aktivasi tunggal, nonaktifkan season, serta deteksi season terjadwal berdasarkan tanggal server.
- API admin Bank Soal untuk CRUD, filter, pagination, duplikasi, aktif/nonaktif, dan import Spreadsheet batch.
- Quiz session server-side dengan random question, random answer, resume, timer, dan batas attempt.
- Opaque option ID, nonce satu kali, replay protection, validasi jawaban dan score sepenuhnya di server.
- UI quiz mobile satu soal per layar, feedback sesuai setting season, serta halaman hasil.
- Ledger point append-only untuk quiz, bonus, admin adjustment, dan penalty dengan idempotency key.
- Bonus selesai/perfect score, rekonsiliasi cache, histori point peserta, dan audit penyesuaian admin.

Leaderboard sekolah, winner engine, dashboard admin lengkap, dan PWA penuh belum diklaim selesai; semuanya dijadwalkan pada fase berikutnya. Lihat [arsitektur](docs/ARCHITECTURE.md), [setup](SETUP.md), dan [panduan pengembangan](DEVELOPMENT.md).

## Pemeriksaan lokal

```powershell
npm test
```

Tidak ada package runtime atau framework frontend.
