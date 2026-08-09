# Arsitektur PEMILIH MUDA

## A. System Architecture

```text
Browser/PWA shell
  → HTML Service router
  → public/student/admin API façade
  → auth + validation + authorization services
  → domain services (quiz, point, leaderboard, winner, content)
  → repositories/data access layer
  → Google Sheets (system of record)
  ↘ CacheService (read cache)
  ↘ PropertiesService (IDs, pepper, configuration rahasia)
  ↘ LockService (setup, attempt, answer, point, winner critical sections)
  ↘ Google Drive (file assets/export)
  ↘ Cloud Logging (error operasional tanpa data sensitif)
```

`PointTransactions` adalah ledger sumber kebenaran poin. `Users.TotalPointCache` hanya cache turunan. Semua operasi yang mengubah attempt, jawaban, poin, dan pemenang harus berada dalam script lock serta idempotent berdasarkan source/nonce.

## B. Folder/File Structure

```text
appsscript.json                 manifest Apps Script
src/
  Code.gs                       public façade
  Config.gs                     constant dan default setting
  Schema.gs                     schema dan prefiks ID
  Utility.gs                    response, ID, waktu, lock
  DatabaseService.gs            database dan repository batch
  SecurityService.gs            pepper dan password hashing
  SetupService.gs               setup idempotent
  SeedService.gs                data demo terpisah
  Router.gs                     HTML Service entry point
  index.html / styles.html      shell Phase 1
docs/ARCHITECTURE.md            keputusan arsitektur A–J
tests/schema.test.js            validasi schema lokal
```

Module domain pada fase berikutnya mengikuti nama di requirement: `AuthService`, `UserService`, `SchoolService`, `SeasonService`, `QuestionService`, `QuizService`, `PointService`, `LeaderboardService`, `WinnerService`, `RewardService`, `FraudService`, `MaterialService`, `AnnouncementService`, `ReportService`, dan `ValidationService`. File tidak dibuat kosong agar tidak menjadi placeholder palsu.

## C. Google Sheets Database Schema

Schema executable berada di `src/Schema.gs` dan terdiri dari 17 sheet: Users, Schools, Seasons, Questions, QuizSessions, QuizAnswers, PointTransactions, Achievements, UserAchievements, Materials, Announcements, Winners, Rewards, Sessions, FraudLogs, ActivityLogs, dan Settings.

Prinsip relasi:

- ID opaque dengan prefiks (`USR_`, `SCH_`, `SEA_`, dan seterusnya); bukan nomor baris.
- Referensi antarsheet disimpan sebagai ID dan divalidasi service layer.
- Pilihan soal yang disajikan disimpan di `QuizAnswers.PresentedOptions`; jawaban benar hanya dibaca backend dari Questions.
- Transaksi poin bersifat append-only; koreksi dibuat sebagai transaksi kompensasi, bukan mengubah histori.
- Indeks lookup dibangun di memory dari satu `getValues()` dan boleh dicache singkat. Penulisan memakai `setValues()` secara batch.
- Perubahan schema pada sheet berisi data ditolak oleh setup; migrasi versi wajib eksplisit agar data tidak terhapus.

## D. Authentication Flow

```text
Register → validasi/normalisasi → cek NIS+email duplikat → hash password+salt+pepper
         → Users(PENDING/ACTIVE) → ActivityLogs
Login → rate limit → lookup identitas → verifikasi hash konstan
      → Sessions(token acak, expiry, device) → token dikirim ke klien
Request → token → session ACTIVE & belum kedaluwarsa → role check → service
Logout/reset/suspend → session dicabut → activity log
```

Pepper hanya di Script Properties. Password admin awal diberikan sementara lewat Script Properties dan dihapus segera setelah akun dibuat.

## E. Quiz Flow

```text
Start → validasi user/season/attempt → lock → pilih QuestionID acak → simpan QuizSession
Next → server susun opsi acak + opaque option ID → klien menerima soal tanpa kunci
Answer → token+session+nonce → lock → validasi satu kali → server cocokkan opsi
       → simpan QuizAnswer → respons benar/salah sesuai setting
Finish → pastikan semua jawaban/timeout → hitung server → QuizSession COMPLETED
       → PointService membuat transaksi idempotent
```

Quiz selalu online untuk submit. Jika jaringan putus, UI mempertahankan tampilan jawaban yang belum terkirim, tetapi tidak pernah memberi poin lokal.

## F. Point Flow

Event tervalidasi → buat kunci unik `(SourceType, SourceID, UserID)` → lock → cek transaksi sebelumnya → append transaksi VALID → hitung ulang/agregasi cache peserta → invalidasi cache leaderboard → audit log. Nilai dari frontend tidak pernah menjadi input poin.

## G. Winner Selection Flow

Season selesai → agregasi transaksi VALID → urutkan total poin → correct answer → quiz completed → average score. Jika semua sama, kandidat berstatus `NEED_REVIEW`. Admin berwenang memilih `VALIDATE` atau `DISQUALIFY`; diskualifikasi wajib alasan. Finalisasi terkunci dan menghasilkan Winners serta status Reward yang dapat diaudit.

## H. PWA Architecture

Google Apps Script HTML Service tidak dapat melayani path statis dan header service worker dengan kontrol penuh; URL web app juga menggunakan redirect/iframe yang membuat service worker native pada origin Apps Script tidak andal. Karena itu arsitektur produksi yang direkomendasikan adalah:

```text
PWA static host (Firebase Hosting/Cloudflare Pages/domain HTTPS)
  manifest.webmanifest + service-worker.js + icons + offline.html
  → Apps Script Web App JSON/RPC backend
```

Alternatif satu-deployment HTML Service tetap dapat memberi pengalaman mobile dan Add to Home Screen terbatas, tetapi tidak boleh diklaim sebagai PWA offline penuh. Phase 12 akan memakai static host; cache hanya app shell, materi publik yang pernah dibuka, dan data nonsensitif. Endpoint quiz memakai network-only.

## I. Security Strategy

- Validasi allowlist, normalisasi, batas panjang, dan escaping output pada boundary.
- Password SHA-256 iteratif dengan salt unik dan pepper rahasia sebagai kompromi keterbatasan GAS; untuk skala/risiko lebih tinggi, pindahkan autentikasi ke Identity Platform/Firebase Auth karena GAS tidak menyediakan Argon2/bcrypt native.
- Session token acak, expiry, revocation, rate limiting per identitas/device, dan pemeriksaan role pada setiap façade admin.
- `LockService` plus nonce/idempotency untuk race dan replay; CacheService tidak pernah menjadi sumber kebenaran.
- Tidak mencatat password, token, jawaban benar, atau PII penuh ke log. Leaderboard memakai projection aman dan opsi masking nama.
- Fraud score hanya sinyal review. Device fingerprint tidak menyebabkan diskualifikasi otomatis.
- Spreadsheet dan folder Drive bersifat privat; deployment berjalan sebagai pemilik dan tidak membagikan database.

## J. Development Roadmap

1. Foundation/database — schema, setup, repository, konfigurasi, seed, dokumentasi (selesai).
2. Authentication/user — registrasi, login, session, reset admin, role guard, rate limit (selesai).
3. Student UI — landing, dashboard, profil, navigation dan states (selesai).
4. Season/question — CRUD admin, import, activation rules.
5. Quiz engine — randomized server-side sessions dan answer validation.
6. Point engine — ledger, bonus, achievement hooks, reconciliation.
7. Leaderboard — peserta/sekolah, safe projection, ranking pribadi.
8. Winner engine — deterministic tie-break dan review/finalization.
9. Admin dashboard — participant/content/reward/fraud operations.
10. Education content — material, announcement, read status.
11. Anti-fraud/security hardening — rules, throttling, audit review.
12. PWA — static hosting, manifest, service worker, offline policy, install UX.
13. Reporting — CSV dan print-friendly report.
14. Testing/optimization — unit, integration, concurrency, accessibility, responsive, performance, security review.

Setiap fase wajib melewati review, test, dokumentasi, dan pengecekan kompatibilitas schema sebelum fase berikutnya.
