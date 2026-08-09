const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const context={readTable_:()=>[
  {UserID:'U1',SeasonID:'S1',Point:100,Status:'VALID'},
  {UserID:'U1',SeasonID:'S1',Point:50,Status:'INVALID'},
  {UserID:'U1',SeasonID:'S2',Point:-20,Status:'VALID'},
  {UserID:'U2',SeasonID:'S1',Point:999,Status:'VALID'}
]};
vm.createContext(context);vm.runInContext(fs.readFileSync('src/PointService.gs','utf8')+'\nthis.calculate=calculateUserPoint_;',context);
assert.equal(context.calculate('U1','S1'),100,'hanya transaksi valid dalam season yang dijumlahkan');
assert.equal(context.calculate('U1',''),80,'saldo lintas season termasuk penalti valid');
assert.equal(context.calculate('U2','S1'),999);
const source=fs.readFileSync('src/PointService.gs','utf8');
assert.match(source,/findPointTransaction_\(userId,sourceType,sourceId\)/,'transaksi harus memiliki idempotency check');
assert.match(source,/item\.Status==='VALID'/,'agregasi wajib memfilter transaksi VALID');
console.log('Point ledger checks passed');
