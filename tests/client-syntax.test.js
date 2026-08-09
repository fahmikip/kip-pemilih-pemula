const fs = require('node:fs');
for (const file of ['auth-client.html','student-client.html']) {
  const html = fs.readFileSync('src/' + file, 'utf8');
  const match = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
  if (!match) throw new Error(file + ': wrapper script tidak valid');
  try { new Function(match[1]); }
  catch (error) { throw new Error(file + ': ' + error.message); }
}
console.log('Client syntax checks passed');
