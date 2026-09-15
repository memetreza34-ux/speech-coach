const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// 1. In /api/analyze-progress
code = code.replace(/if \(\!response\.ok\) \{\n\s*return res\.status\(502\)\.json\(\{ error: 'KI-Analyse fehlgeschlagen\.' \}\);\n\s*\}/g, `if (!response.ok) {
        await refundQuota(req.user.uid, req.route.path === '/api/analyze-persona' ? 'persona' : 'progress');
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen.' });
      }`);

code = code.replace(/if \(\!resultText\) \{\n\s*await refundQuota\(req\.user\.uid, 'interviewTurn'\); \/\/ note: may need context\n\s*return res\.status\(502\)\.json\(\{ error: 'Die KI hat keine verwertbare Antwort geliefert\.' \}\);\n\s*\}/g, `if (!resultText) {
        let type = 'analyze';
        if (req.route.path === '/api/interview') type = 'interviewTurn';
        if (req.route.path === '/api/analyze-progress') type = 'progress';
        if (req.route.path === '/api/analyze-persona') type = 'persona';
        await refundQuota(req.user.uid, type);
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }`);

code = code.replace(/if \(typeof parsed\.insight !== 'string' \|\| \!Array\.isArray\(parsed\.strengths\) \|\| \!Array\.isArray\(parsed\.improvements\)\) \{\n\s*return res\.status\(502\)\.json\(\{ error: 'INVALID_AI_RESPONSE', details: 'Schema mismatch' \}\);\n\s*\}/g, `if (typeof parsed.insight !== 'string' || !Array.isArray(parsed.strengths) || !Array.isArray(parsed.improvements)) {
         await refundQuota(req.user.uid, 'progress');
         return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'Schema mismatch' });
      }`);

code = code.replace(/if \(typeof parsed\.archetype !== 'string' \|\| typeof parsed\.description !== 'string' \|\| typeof parsed\.superpower !== 'string' \|\| typeof parsed\.trap !== 'string'\) \{\n\s*return res\.status\(502\)\.json\(\{ error: 'INVALID_AI_RESPONSE', details: 'Schema mismatch' \}\);\n\s*\}/g, `if (typeof parsed.archetype !== 'string' || typeof parsed.description !== 'string' || typeof parsed.superpower !== 'string' || typeof parsed.trap !== 'string') {
        await refundQuota(req.user.uid, 'persona');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'Schema mismatch' });
      }`);

code = code.replace(/console\.error\('AI Error \(Progress\):', e\);\n\s*return res\.status\(500\)\.json\(\{ error: 'Interner Fehler bei der Langzeitanalyse\.' \}\);/g, `console.error('AI Error (Progress):', e);
      await refundQuota(req.user.uid, 'progress');
      return res.status(500).json({ error: 'Interner Fehler bei der Langzeitanalyse.' });`);

code = code.replace(/console\.error\('AI Error \(Persona\):', e\);\n\s*return res\.status\(500\)\.json\(\{ error: 'Interner Fehler bei der Persona-Analyse\.' \}\);/g, `console.error('AI Error (Persona):', e);
      await refundQuota(req.user.uid, 'persona');
      return res.status(500).json({ error: 'Interner Fehler bei der Persona-Analyse.' });`);

code = code.replace(/if \(e\.name === 'AbortError'\) \{\n\s*await refundQuota\(req\.user\.uid, 'analyze'\); \/\/ Will be replaced contextually later for other endpoints\n\s*return res\.status\(504\)\.json\(\{ error: 'Zeitüberschreitung bei der KI-Analyse\.' \}\);\n\s*\}/g, `if (e.name === 'AbortError') {
        let type = 'analyze';
        if (req.route.path === '/api/interview') type = 'interviewTurn';
        if (req.route.path === '/api/analyze-progress') type = 'progress';
        if (req.route.path === '/api/analyze-persona') type = 'persona';
        await refundQuota(req.user.uid, type);
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }`);
      
// For interview:
code = code.replace(/if \(typeof parsed\.interviewerSpeech !== 'string' \|\| \!parsed\.interviewerSpeech\.trim\(\)\) \{\n\s*return res\.status\(502\)\.json\(\{ error: 'INVALID_AI_RESPONSE', details: 'interviewerSpeech missing' \}\);\n\s*\}/g, `if (typeof parsed.interviewerSpeech !== 'string' || !parsed.interviewerSpeech.trim()) {
        await refundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'interviewerSpeech missing' });
      }`);
code = code.replace(/if \(typeof parsed\.feedback !== 'string'\) \{\n\s*return res\.status\(502\)\.json\(\{ error: 'INVALID_AI_RESPONSE', details: 'feedback missing' \}\);\n\s*\}/g, `if (typeof parsed.feedback !== 'string') {
        await refundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'feedback missing' });
      }`);
code = code.replace(/if \(typeof parsed\.isFinished !== 'boolean'\) \{\n\s*return res\.status\(502\)\.json\(\{ error: 'INVALID_AI_RESPONSE', details: 'isFinished missing' \}\);\n\s*\}/g, `if (typeof parsed.isFinished !== 'boolean') {
        await refundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'isFinished missing' });
      }`);
      
// Fix the interview 502 refund
code = code.replace(/await refundQuota\(req\.user\.uid, 'analyze'\);\n\s*const errBody = await response\.text\(\)\.catch\(\(\) => ''\);\n\s*console\.error\('Gemini API Fehler \(Interview\):'/g, `await refundQuota(req.user.uid, 'interviewTurn');
        const errBody = await response.text().catch(() => '');
        console.error('Gemini API Fehler (Interview):'`);

fs.writeFileSync('server.js', code);
