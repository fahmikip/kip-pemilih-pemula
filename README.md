# PEMILIH MUDA

Platform edukasi dan quiz pemilih pemula berbasis Google Apps Script dan Google Sheets. Repository ini saat ini menyelesaikan **Phase 13 — Reporting**.

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
- Leaderboard peserta Top 3/10/50, ranking pribadi, competition rank untuk point sama, dan projection publik tanpa PII.
- Leaderboard sekolah dengan total point, peserta, peserta aktif, quiz selesai, average score, serta tab UI khusus.
- Kandidat pemenang deterministik dengan tie-break point, correct answer, quiz completed, dan average score.
- Status `NEED_REVIEW`, validate/disqualify dengan alasan wajib, single-winner guard, audit log, dan champion publik tanpa PII.
- Login role-aware yang mengarahkan admin/superadmin ke console terpisah dan peserta ke aplikasi mobile.
- Admin dashboard responsive untuk statistik, peserta, sekolah, season, bank soal, finalisasi pemenang, dan reward.
- Validasi/suspend peserta, create school/season/question, aktivasi season, duplikasi/status soal, serta status reward dari UI.
- CRUD dan lifecycle draft/publish/archive untuk materi edukasi serta pengumuman dengan audience dan expiry.
- Viewer materi peserta, materi publik landing page, tautan video aman, dan FAQ privasi/netralitas program.
- Fraud score dan review lifecycle untuk replay, nonce/option manipulation, excessive request, durasi tidak realistis, identitas duplikat, dan shared device.
- Scanner fraud admin, confirm/dismiss, rekalkulasi score, serta rate limiting pada start dan submit quiz.
- Installable static PWA companion dengan manifest, ikon maskable, install prompt, standalone mode, offline shell, dan offline fallback.
- Service worker mem-cache hanya aset statis; Apps Script, session, jawaban quiz, dan point selalu network-only.
- Console admin menyediakan preview dan ekspor CSV untuk peserta, sekolah, quiz, leaderboard, season, pemenang, reward, fraud, dan transaksi point.
- Laporan mendukung filter season, tampilan Print/PDF, batas ukuran, escaping CSV, dan perlindungan formula injection.

Final testing/optimization belum diklaim selesai dan dijadwalkan pada fase berikutnya. Lihat [arsitektur](docs/ARCHITECTURE.md), [setup](SETUP.md), [panduan PWA](PWA.md), dan [panduan pengembangan](DEVELOPMENT.md).

## Pemeriksaan lokal

```powershell
npm test
```

Tidak ada package runtime atau framework frontend.
