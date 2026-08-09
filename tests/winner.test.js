const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('src/WinnerService.gs','utf8'),context={};
vm.createContext(context);vm.runInContext(source+'\nthis.compare=compareWinnerCandidates_;this.same=sameWinnerMetrics_;this.risk=fraudRisk_;',context);
const candidates=[
  {point:100,correct:8,quizCompleted:1,averageScore:80},
  {point:100,correct:9,quizCompleted:1,averageScore:70},
  {point:110,correct:5,quizCompleted:1,averageScore:50},
  {point:100,correct:9,quizCompleted:2,averageScore:70}
].sort(context.compare);
assert.deepEqual(candidates.map(item=>[item.point,item.correct,item.quizCompleted]),[[110,5,1],[100,9,2],[100,9,1],[100,8,1]],'urutan tie-break harus point, correct, quiz completed, average score');
assert.equal(context.same({point:10,correct:2,quizCompleted:1,averageScore:80},{point:10,correct:2,quizCompleted:1,averageScore:80}),true);
assert.equal(context.same({point:10,correct:2,quizCompleted:1,averageScore:80},{point:10,correct:2,quizCompleted:1,averageScore:81}),false);
assert.equal(context.risk(20),'NORMAL');assert.equal(context.risk(21),'REVIEW');assert.equal(context.risk(51),'HIGH RISK');
assert.match(source,/SelectionStatus==='VALIDATED'/,'single winner guard wajib tersedia');
assert.match(source,/reason\.length<5/,'diskualifikasi wajib memiliki alasan');
console.log('Winner selection checks passed');
