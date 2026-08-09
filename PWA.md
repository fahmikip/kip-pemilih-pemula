# PWA Deployment

## Mengapa static host terpisah

Google Apps Script HTML Service merender aplikasi melalui origin/iframe Google dan tidak memberi kontrol yang diperlukan atas scope serta response header service worker. Karena itu folder `pwa/` adalah installable companion pada origin HTTPS statis, sementara Apps Script tetap menjadi backend/aplikasi transaksi.

PWA companion tidak meng-cache request lintas origin, POST, session, atau quiz. Tombol **Buka Aplikasi** membuka deployment Apps Script yang sudah dikonfigurasi. Offline hanya mencakup shell dan materi ringkas nonsensitif.

## Deployment

1. Deploy isi folder `pwa/` ke Firebase Hosting, Cloudflare Pages, GitHub Pages, atau static host HTTPS lain.
2. Pastikan root hosting mengarah ke folder tersebut dan `manifest.webmanifest` dikirim dengan MIME type manifest/JSON.
3. Buka PWA, masukkan URL Apps Script `/exec`, lalu simpan. URL hanya tersimpan di localStorage perangkat.
4. Gunakan tombol **Install App** yang tampil saat dibuka dari browser. Prompt native dipakai jika tersedia; jika tidak, pengguna mendapat petunjuk menu browser atau **Tambahkan ke Layar Utama** pada iOS.
5. Untuk rilis baru, ubah versi konstanta `CACHE` pada `service-worker.js` agar cache lama dibersihkan saat activate.

## Kebijakan offline

- Cache-first: CSS, JavaScript shell, manifest, ikon.
- Network-first: navigasi static host, fallback ke `offline.html`.
- Network-only: seluruh request non-GET dan seluruh cross-origin request, termasuk Apps Script/quiz.
- Tidak ada point atau jawaban quiz yang disimpan/dianggap valid secara offline.
