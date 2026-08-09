const fs=require('node:fs');
const assert=require('node:assert/strict');
const files=['AdminService.gs','SchoolService.gs','RewardService.gs'];
for(const file of files){const source=fs.readFileSync('src/'+file,'utf8');assert.match(source,/requireSession_\([^\n]+\['ADMIN','SUPERADMIN'\]/,file+' wajib memiliki admin role guard');}
const auth=fs.readFileSync('src/auth-client.html','utf8');
assert.match(auth,/user\.role==='ADMIN'\|\|user\.role==='SUPERADMIN'/,'login harus membedakan role admin');
assert.match(auth,/window\.PM\.startAdmin\(token\)/,'admin harus diarahkan ke admin shell');
const admin=fs.readFileSync('src/admin-client.html','utf8');
assert.match(admin,/getAdminDashboard/);assert.match(admin,/setParticipantStatus/);assert.match(admin,/createSchool/);assert.match(admin,/createSeason/);assert.match(admin,/createQuestion/);assert.match(admin,/finalizeWinner/);assert.match(admin,/updateRewardStatus/);
console.log('Admin authorization and routing checks passed');
