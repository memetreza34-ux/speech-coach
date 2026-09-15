const fs = require('fs');
let code = fs.readFileSync('tests/concurrency.test.js', 'utf8');
code = code.replace(
  "vi.stubGlobal('fetch', vi.fn());",
  `vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{
        content: { parts: [{ text: JSON.stringify({ fillers: 1, confidenceScore: 80, aiTip: { summary: "x", strengths: "x", improvements: "x", actionTip: "x", bodyLanguage: null } }) }] }
      }]
    })
  }));`
);
fs.writeFileSync('tests/concurrency.test.js', code);
