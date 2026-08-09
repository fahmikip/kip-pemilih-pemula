const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/Schema.gs','utf8') + '\nthis.schema=DATABASE_SCHEMA;this.prefix=ID_PREFIX;', context);
assert.equal(Object.keys(context.schema).length, 17, 'semua sheet wajib tersedia');
for (const [name, headers] of Object.entries(context.schema)) {
  assert.ok(headers.length > 1, name + ' harus memiliki schema');
  assert.equal(new Set(headers).size, headers.length, name + ' memiliki header duplikat');
}
for (const required of ['Users','Schools','Seasons','Questions','QuizSessions','QuizAnswers','PointTransactions','Sessions','FraudLogs','ActivityLogs','Settings']) assert.ok(context.schema[required]);
assert.ok(context.schema.Users.includes('PasswordHash'));
assert.ok(!context.schema.PointTransactions.includes('PasswordHash'));
console.log('Schema checks passed:', Object.keys(context.schema).length, 'sheets');
