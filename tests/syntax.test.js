const fs = require('node:fs');
const path = require('node:path');
for (const file of fs.readdirSync('src').filter(name => name.endsWith('.gs'))) {
  const source = fs.readFileSync(path.join('src', file), 'utf8');
  try { new Function(source); }
  catch (error) { throw new Error(file + ': ' + error.message); }
}
console.log('Apps Script syntax checks passed');
