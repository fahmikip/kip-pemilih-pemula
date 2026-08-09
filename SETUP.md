# Setup

## Prasyarat

- Akun Google dengan akses Apps Script, Sheets, dan Drive.
- Node.js untuk test lokal.
- Opsional: `@google/clasp` untuk push source.

## Membuat project Apps Script

1. Buat standalone Apps Script project.
2. Salin file `src/*` dan `appsscript.json`, atau pasang clasp lalu hubungkan `.clasp.json` milik Anda. Jangan commit `.clasp.json` jika berisi project ID privat.
3. Atur Script Properties hanya jika ingin membuat admin pertama:
   - `DEFAULT_ADMIN_EMAIL`: email superadmin.
   - `DEFAULT_ADMIN_PASSWORD`: password sementara minimal 10 karakter.
4. Jalankan `setupApplication()` dari editor dan setujui scope Sheets/Drive.
5. Buka execution result. URL database tersedia pada `data.spreadsheetUrl`.
6. Pastikan `DEFAULT_ADMIN_PASSWORD` sudah otomatis dihapus. Ganti password melalui alur aman setelah Phase 2 tersedia.
7. Opsional, jalankan `seedDemoData()` hanya untuk lingkungan demo/development.
8. Deploy sebagai Web app, execute as pemilik. Untuk fase publik, evaluasi kebijakan akses organisasi sebelum memilih siapa yang dapat membuka aplikasi.

Di editor Apps Script, nama file HTML harus tetap datar: `index`, `styles`, dan `auth-client`. Folder `src/` hanya organisasi lokal repository dan tidak boleh ditulis sebagai bagian nama pada `createTemplateFromFile()` atau `include_()`.

Menjalankan `setupApplication()` kembali aman: sheet/setting tidak diduplikasi. Jika header sheet yang sudah berisi data berbeda, setup berhenti dan meminta migrasi manual.

## Script Properties yang dibuat otomatis

- `DATABASE_SPREADSHEET_ID`
- `APP_DRIVE_FOLDER_ID`
- `PASSWORD_PEPPER`

Jangan memindahkan nilainya ke source code atau HTML.

## Production checklist Phase 1

- Database dan folder Drive tidak dibagikan publik.
- Timezone project `Asia/Jakarta`.
- Akun deployer memakai MFA.
- Data demo tidak digunakan sebagai materi produksi tanpa review substansi.
- Kebijakan privasi dan retensi disahkan sebelum registrasi peserta dibuka.
