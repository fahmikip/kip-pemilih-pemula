const fs=require('node:fs');
const assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('pwa/manifest.webmanifest','utf8'));
assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.theme_color,'#123b66');assert.ok(manifest.icons.some(icon=>icon.purpose.includes('maskable')));
for(const icon of manifest.icons){const path='pwa/'+icon.src;assert.ok(fs.existsSync(path),'icon tidak ditemukan: '+path);const buffer=fs.readFileSync(path);assert.equal(buffer.toString('hex',0,8),'89504e470d0a1a0a','icon harus PNG');const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20);assert.equal(icon.sizes,width+'x'+height,'ukuran manifest harus sama dengan PNG');assert.ok(width>=512&&height>=512,'icon minimal 512px');}
const worker=fs.readFileSync('pwa/service-worker.js','utf8');assert.match(worker,/request\.method!==['"]GET['"]/,'non-GET harus network-only');assert.match(worker,/url\.origin!==self\.location\.origin/,'cross-origin Apps Script harus network-only');assert.match(worker,/caches\.match\(OFFLINE\)/,'navigasi harus memiliki offline fallback');assert.doesNotMatch(worker,/QuizSessions|submitQuiz|PointTransactions/,'data quiz/point tidak boleh dicache');
const html=fs.readFileSync('pwa/index.html','utf8');assert.match(html,/rel="manifest"/);assert.match(html,/id="install-app"/);assert.match(html,/id="open-app"/);
assert.doesNotMatch(html,/id="install-app"[^>]*hidden/,'tombol install harus terlihat saat dibuka dari browser');
const app=fs.readFileSync('pwa/app.js','utf8');assert.match(app,/beforeinstallprompt/);assert.match(app,/display-mode: standalone/);assert.match(app,/Tambahkan ke Layar Utama/);assert.match(app,/hostname==='script\.google\.com'/,'launcher hanya menerima host Apps Script resmi');
const gas=fs.readFileSync('src/index.html','utf8'),auth=fs.readFileSync('src/auth-client.html','utf8');assert.match(gas,/data-install-app/);assert.match(auth,/beforeinstallprompt/);assert.match(auth,/data-install-app/);
console.log('PWA install/offline policy checks passed');
