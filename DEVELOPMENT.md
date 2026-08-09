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

## Batasan platform

Google Sheets tidak menyediakan unique constraint atau transaction database. Service layer harus memakai locks, duplicate checks, dan idempotency keys. Apps Script memiliki quota/waktu eksekusi; agregasi leaderboard besar perlu cache dan trigger terjadwal. Untuk PWA penuh, gunakan static host terpisah sebagaimana dijelaskan di dokumen arsitektur.
