const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('src/Utility.gs','utf8')+'\n'+fs.readFileSync('src/MaterialService.gs','utf8')+'\n'+fs.readFileSync('src/AnnouncementService.gs','utf8'),context);
assert.equal(context.sanitizeMultiline_('Baris 1\r\nBaris 2\u0000',100),'Baris 1\nBaris 2');
const material=context.validateMaterial_({title:'Hak Pilih Pemula',category:'Pemilu',content:'Materi edukasi netral untuk pemilih pemula.',thumbnail:'https://example.id/image.jpg',videoUrl:'https://example.id/video',status:'PUBLISHED'});assert.equal(material.valid,true,material.errors.join(' '));
assert.equal(context.validateMaterial_({title:'X',category:'',content:'pendek',thumbnail:'http://unsafe.test/a',status:'PUBLIC'}).valid,false);
const announcement=context.validateAnnouncement_({title:'Quiz Dibuka',content:'Quiz Agustus telah resmi dibuka.',audience:'STUDENT',status:'PUBLISHED',expiresAt:'2026-08-31'});assert.equal(announcement.valid,true,announcement.errors.join(' '));
assert.equal(context.validateAnnouncement_({title:'X',content:'x',audience:'PUBLIC',status:'X',expiresAt:'2026-02-31'}).valid,false);
for(const file of ['MaterialService.gs','AnnouncementService.gs']){const source=fs.readFileSync('src/'+file,'utf8');assert.match(source,/requireSession_\([^\n]+\['ADMIN','SUPERADMIN'\]/,file+' admin endpoints wajib dilindungi');}
assert.match(fs.readFileSync('src/MaterialService.gs','utf8'),/item=>item\.Status==='PUBLISHED'/,'materi publik wajib hanya PUBLISHED');
console.log('Education content checks passed');
