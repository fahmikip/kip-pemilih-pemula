# Final Testing & Release Checklist

## Otomatis

Jalankan `npm.cmd test`. Quality gate mencakup sintaks, schema, validasi, quiz security, point, leaderboard, winner, authorization, content, fraud, PWA, reporting, accessibility baseline, locking, batch write, dan pencegahan stack-trace leak.

## Smoke test deployment

1. Jalankan `setupApplication()` dan `seedDemoData()` dua kali; pastikan tidak ada data ganda.
2. Uji registrasi, duplicate NIS/email, login salah/benar, logout, dan session restore.
3. Validasi peserta, jalankan quiz, refresh/resume, selesaikan quiz, dan pastikan ledger point hanya terbentuk sekali.
4. Kirim ulang jawaban/session yang sama dan pastikan replay ditolak tanpa tambahan point.
5. Periksa leaderboard, kandidat/pemenang, reward, fraud review, dan seluruh laporan.
6. Uji keyboard-only, zoom 200%, screen reader dasar, forced colors, dan reduced motion.
7. Uji lebar 360, 390, 412, 430, 768, 1024, dan 1440 piksel.
8. Putuskan koneksi saat quiz; jawaban tidak boleh dianggap terkirim atau mendapat point.
9. Buat deployment versi baru, hard refresh/Incognito, lalu ulangi login peserta dan admin.

## Kriteria rilis

- Seluruh test lulus dan Apps Script bebas error sintaks.
- Tidak ada PII publik atau stack trace pada respons API.
- Mutasi point, quiz, dan pemenang terlindungi lock serta replay/idempotency guard.
- Data layer memakai batch `setValues`, bukan `setValue` per sel.
- Focus, kontras, target sentuh, responsive layout, dan offline messaging dapat digunakan.
- URL `/exec` memakai deployment terbaru; Spreadsheet dan Drive tetap privat.
