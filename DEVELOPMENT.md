# Development Guide

## Konvensi

- Public callable function menggunakan nama tanpa suffix; helper internal berakhiran `_`.
- Konstanta uppercase, record field mengikuti header schema.
- Domain ID dibuat oleh `generateId_(entity)`; kode tidak bergantung pada nomor baris.
- Waktu disimpan sebagai ISO-8601 zona Asia/Jakarta untuk audit yang konsisten.
- Fungsi API selalu mengembalikan `apiSuccess_` atau error aman dari `apiError_`.
- Tidak melakukan `getRange()/setValue()` per item dalam loop data besar. Baca sekali, olah di memory, tulis batch.

## Aturan perubahan schema

1. Naikkan `APP.SCHEMA_VERSION`.
2. Tambahkan migrasi eksplisit dan backup sebelum mengubah sheet berisi data.
3. Perbarui `DATABASE_SCHEMA`, dokumentasi, dan test.
4. Jangan memakai `sheet.clear()` pada data produksi. Guard Phase 1 hanya mengizinkannya saat sheet belum berisi record.

## Definition of done per fase

- Acceptance criteria fase mempunyai test sukses dan failure path.
- Authorization dan validasi server diperiksa.
- Tidak ada PII atau secret pada respons/log publik.
- Operasi finansial/poin/winner idempotent dan concurrency-safe.
- Dokumentasi setup/migrasi diperbarui.
- UI diuji pada 360, 390, 412, 430 px dan keyboard navigation.

## Test strategy

- Lokal: static schema/syntax dan pure-function unit tests dengan Node.
- Apps Script development deployment: integration test terhadap spreadsheet khusus test.
- Manual: authorization matrix, expiry/replay, offline quiz behavior, responsive, install prompt.
- Sebelum produksi: load/concurrency test terkontrol dan pemeriksaan quota Apps Script.

## Kontrak autentikasi Phase 2

- Endpoint publik: `registerStudent(payload)`, `login(payload)`, `logout(token)`, `getCurrentUser(token)`, dan `listPublicSchools()`.
- Endpoint admin awal: `validateStudent(adminToken, userId)` dan `adminResetPassword(adminToken, userId, newPassword)`.
- Token disimpan di `sessionStorage` oleh shell awal. Phase 3 wajib menambahkan bootstrap session dan route dashboard tanpa memindahkan token ke URL/cookie yang tidak terlindungi.
- Registrasi menghasilkan status `PENDING`; administrator harus memvalidasi sebelum peserta dapat login.

## Kontrak aplikasi peserta Phase 3

- `getStudentDashboard(token)` hanya menerima sesi `STUDENT` aktif dan mengembalikan proyeksi dashboard, materi terbit, pengumuman aktif, Top 3, serta Top 50 tanpa PII.
- `getStudentProfile(token)` mengembalikan data pribadi hanya kepada pemilik sesi.
- Ranking dihitung dari transaksi `PointTransactions` berstatus `VALID`; `TotalPointCache` tidak menjadi sumber kebenaran.
- Tombol quiz sengaja belum menjalankan attempt sampai Quiz Engine Phase 5 selesai.

## Kontrak season dan bank soal Phase 4

- Seluruh endpoint pengelolaan memerlukan sesi `ADMIN` atau `SUPERADMIN`.
- Season `ACTIVE` tidak dapat diedit langsung; nonaktifkan dahulu agar konfigurasi attempt tidak berubah di tengah quiz.
- `activateSeason()` memakai script lock, memastikan hanya satu season aktif, dan menolak bank soal yang tidak mencukupi.
- Season `SCHEDULED` dalam rentang tanggal server dapat dikenali otomatis bila tidak ada override aktif.
- Penghapusan soal dilakukan secara aman melalui status `INACTIVE`; histori quiz tidak kehilangan referensi.
- Import Spreadsheet membutuhkan header schema Bank Soal, dibatasi 1.000 baris, divalidasi per baris, dicek duplikat, lalu ditulis batch.

## Kontrak Quiz Engine Phase 5

- `startQuiz(token, clientInfo)` membuat atau melanjutkan tepat satu sesi `STARTED` untuk season aktif.
- Daftar QuestionID dipilih server dan dibekukan dalam `QuizSessions`; perubahan bank soal tidak mengubah komposisi sesi berjalan.
- Browser hanya menerima `answerId`, nonce satu kali, opaque option ID, dan teks opsi. Mapping opsi ke A/B/C/D tetap tersimpan di backend.
- `submitQuizAnswer()` berada dalam script lock, memverifikasi pemilik sesi, status, timeout, nonce, option ID, dan menolak replay.
- Score dan quiz point dihitung server saat seluruh jawaban selesai. Quiz point belum menjadi saldo hingga Point Engine Phase 6 membuat transaksi ledger.

## Kontrak Point Engine Phase 6

- `PointTransactions` berstatus `VALID` adalah sumber kebenaran; `Users.TotalPointCache` hanya cache lintas season.
- Transaksi quiz unik berdasarkan `(UserID, SourceType, SourceID)` sehingga retry finalisasi tidak menggandakan point.
- Finalisasi quiz membuat transaksi QUIZ, bonus selesai, dan bonus perfect score di dalam quiz lock sebelum sesi ditutup.
- Koreksi admin tidak mengubah transaksi lama: penambahan memakai `ADMIN`, pengurangan memakai `PENALTY`, dan alasan wajib dicatat.
- `reconcilePointCaches()` menghitung ulang seluruh cache melalui satu pembacaan ledger dan satu batch write Users.

## Kontrak Leaderboard Phase 7

- Ranking hanya mengagregasi `PointTransactions` berstatus `VALID` untuk satu season.
- Point yang sama menggunakan competition ranking (`1, 1, 3`); urutan tampilan stabil memakai nama publik.
- Projection publik hanya berisi rank, nama termasking, sekolah, dan point—tanpa UserID, SchoolID, atau PII.
- Ranking sekolah mengagregasi total point, peserta terdaftar, peserta aktif, quiz selesai, dan average score.
- Top 3 publik dicache maksimal lima menit dan diinvalidasi saat transaksi point quiz dibuat.

## Kontrak Winner Engine Phase 8

- Kandidat wajib peserta aktif dengan minimal satu quiz `COMPLETED` pada season.
- Urutan kandidat: total point valid, correct answer, quiz completed, lalu average score; tidak ada pemilihan acak.
- Jika seluruh metrik kandidat teratas sama, status menjadi `NEED_REVIEW` dan kandidat tie sama-sama berperingkat #1.
- Fraud score hanya ditampilkan sebagai `NORMAL`, `REVIEW`, atau `HIGH RISK`; tidak mendiskualifikasi otomatis.
- Diskualifikasi membutuhkan alasan dan tersimpan sebagai keputusan audit. Hanya kandidat teratas atau kandidat tie yang dapat divalidasi.
- Satu season hanya dapat mempunyai satu record `VALIDATED`; pemenang publik tidak memuat PII.

## Kontrak Admin Dashboard Phase 9

- Login memakai endpoint yang sama tetapi client melakukan routing berdasarkan role terverifikasi dari server; token admin tidak pernah bergantung pada hidden field.
- Semua API admin memanggil `requireSession_` dengan allowlist `ADMIN/SUPERADMIN`; PII peserta hanya dikembalikan oleh endpoint tersebut.
- Dashboard menyediakan statistik, aktivitas terbaru, participant validation/suspension, master sekolah, season, bank soal, finalisasi winner, dan status reward.
- Suspend/block mencabut seluruh sesi pengguna. Reset akun administrator tetap hanya dapat dilakukan superadmin.
- Sidebar permanen pada desktop, drawer pada tablet/mobile, dan tabel sensitif menggunakan horizontal scroll pada layar sempit.

## Kontrak Education Content Phase 10

- Materi dan pengumuman memiliki lifecycle `DRAFT`, `PUBLISHED`, `ARCHIVED`; hanya `PUBLISHED` yang dapat dibaca publik/peserta.
- Konten disimpan sebagai plain multiline text dan selalu dirender dengan `textContent`/escaping, sehingga HTML admin tidak dieksekusi di browser peserta.
- Thumbnail dan video eksternal wajib HTTPS. Link video memakai `noopener noreferrer`.
- Pengumuman peserta hanya menerima audience `ALL`/`STUDENT` yang belum kedaluwarsa; audience `ADMIN` tidak bocor ke dashboard peserta.
- Materi publik dicache singkat dan cache diinvalidasi setiap create/update/status change.

## Kontrak Anti-Fraud Phase 11

- Fraud rules baseline: duplicate identity, shared device, unrealistic duration, excessive requests, answer replay, invalid nonce/option, dan parameter manipulation.
- Fraud log dideduplikasi berdasarkan user, rule, dan context/session agar retry yang sama tidak menambah score berulang kali.
- Threshold: `0–20 NORMAL`, `21–50 REVIEW`, `51+ HIGH RISK`.
- Shared device hanya menghasilkan sinyal review; tidak pernah memblokir atau mendiskualifikasi secara otomatis.
- Admin dapat `CONFIRMED` atau `DISMISSED`; log dismissed dikeluarkan saat FraudScore dihitung ulang.
- Cache-based throttling membatasi start quiz dan submit answer; Sheets/FraudLogs tetap menjadi audit trail untuk pelanggaran batas.

## Batasan platform

Google Sheets tidak menyediakan unique constraint atau transaction database. Service layer harus memakai locks, duplicate checks, dan idempotency keys. Apps Script memiliki quota/waktu eksekusi; agregasi leaderboard besar perlu cache dan trigger terjadwal. Untuk PWA penuh, gunakan static host terpisah sebagaimana dijelaskan di dokumen arsitektur.
