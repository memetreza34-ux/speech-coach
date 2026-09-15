const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Replace general error refunds
code = code.replace(/console\.error\('AI Error:', e\);\n\s*return res\.status\(500\)/g, `console.error('AI Error:', e);
      await refundQuota(req.user.uid, 'analyze');
      return res.status(500)`);

// INTERVIEW
code = code.replace(/console\.error\('AI Error \(Interview\):', e\);\n\s*return res\.status\(500\)/g, `console.error('AI Error (Interview):', e);
      await refundQuota(req.user.uid, 'interviewTurn');
      return res.status(500)`);
code = code.replace(/if \(!response\.ok\) \{\n\s*const errBody = await response\.text\(\)\.catch\(\(\) => ''\);\n\s*console\.error\('Gemini API Fehler \(Interview\):', response\.status, errBody\);\n\s*return res\.status\(502\)/g, `if (!response.ok) {
        await refundQuota(req.user.uid, 'interviewTurn');
        const errBody = await response.text().catch(() => '');
        console.error('Gemini API Fehler (Interview):', response.status, errBody);
        return res.status(502)`);
code = code.replace(/if \(\!resultText\) \{\n\s*return res\.status\(502\)\.json\(\{ error: 'Die KI hat keine verwertbare Antwort geliefert\.' \}\);\n\s*\}/g, `if (!resultText) {
        await refundQuota(req.user.uid, 'interviewTurn'); // note: may need context
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }`);

// We need to be careful with resultText replacement across files. I'll just write a script that finds the routes and modifies them correctly.

fs.writeFileSync('server.js', code);
