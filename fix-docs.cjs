const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(
  "const consumeQuota = async (uid, isPremium, type) => {",
  "// Quota Reset Documention: Quotas reset at 00:00 UTC.\n  // A simple ISO string date is used to represent 'today'.\n  const consumeQuota = async (uid, isPremium, type) => {"
);

fs.writeFileSync('server.js', code);
