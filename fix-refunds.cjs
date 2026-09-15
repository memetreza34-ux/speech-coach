const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

function addRefunds(type, pattern, newCode) {
    code = code.replace(pattern, newCode);
}

// 1. Analyze refunds
code = code.replace(/if \(\!response\.ok\) \{\n\s*const errBody = await response\.text/g, `if (!response.ok) {
        await refundQuota(req.user.uid, 'analyze');
        const errBody = await response.text`);
code = code.replace(/if \(\!resultText\) \{\n\s*console\.error\('Gemini: leere/g, `if (!resultText) {
        await refundQuota(req.user.uid, 'analyze');
        console.error('Gemini: leere`);
code = code.replace(/return res\.status\(502\)\.json\(\{ error: 'INVALID_AI_RESPONSE', details: 'fillers missing or invalid' \}\);/g, `await refundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'fillers missing or invalid' });`);
code = code.replace(/return res\.status\(502\)\.json\(\{ error: 'INVALID_AI_RESPONSE', details: 'confidenceScore invalid' \}\);/g, `await refundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'confidenceScore invalid' });`);
code = code.replace(/return res\.status\(502\)\.json\(\{ error: 'INVALID_AI_RESPONSE', details: 'aiTip missing or invalid' \}\);/g, `await refundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'aiTip missing or invalid' });`);
code = code.replace(/return res\.status\(502\)\.json\(\{ error: 'INVALID_AI_RESPONSE', details: 'summary missing' \}\);/g, `await refundQuota(req.user.uid, 'analyze'); return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'summary missing' });`);

code = code.replace(/if \(e\.name === 'AbortError'\) \{\n\s*return res\.status\(504\)\.json\(\{ error: 'Zeitüberschreitung bei der KI-Analyse\.' \}\);\n\s*\}/g, 
`if (e.name === 'AbortError') {
        await refundQuota(req.user.uid, 'analyze'); // Will be replaced contextually later for other endpoints
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }`);

// Let's do it cleaner by using AST or just precise regexes
fs.writeFileSync('server.js', code);
