// Vercel Serverless Function: proxied Gemini call.
// Der Gemini API-Key lebt ausschließlich hier server-seitig (Env-Var GEMINI_API_KEY)
// und wird nie an den Client ausgeliefert.

const MAX_TRANSCRIPT_LENGTH = 4000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server ist nicht konfiguriert (GEMINI_API_KEY fehlt).' });
    return;
  }

  const { transcript, mode, profile, metrics } = req.body || {};
  if (typeof transcript !== 'string' || !transcript.trim()) {
    res.status(400).json({ error: 'Transkript fehlt oder ist leer.' });
    return;
  }

  const safeTranscript = transcript.slice(0, MAX_TRANSCRIPT_LENGTH);
  const safeProfile = profile && typeof profile === 'object' ? profile : {};
  const m = metrics && typeof metrics === 'object' ? metrics : {};

  const prompt = `Du bist ein professioneller Kommunikationstrainer. Analysiere den folgenden Sprech-Versuch eines Nutzers.
Nutzer-Profil: Name: ${safeProfile.name || ''}, Rolle: ${safeProfile.role || ''}, Alter: ${safeProfile.age || ''}, Hobbys: ${safeProfile.hobbies || ''}.
Szenario-Modus: ${mode || 'impromptu'}.

Gemessene Werte aus der Audioaufnahme (diese sind bereits ermittelt, du musst sie nicht berechnen):
- Sprechtempo: ${m.wpm ?? '?'} Wörter/Minute (${m.pacingStatus ?? '?'})
- Sprechpausen über 0,6s: ${m.pauseCount ?? '?'} (längste: ${m.longestPauseMs ? (m.longestPauseMs / 1000).toFixed(1) + 's' : '?'})
- Redeanteil: ${m.speakingRatio ?? '?'}% der Aufnahmezeit
- Stimmdynamik: ${m.dynamics ?? '?'} (unter 35 = monoton, über 75 = sehr bewegt)

Transkript: "${safeTranscript}"

Gib DEINE ANTWORT EXAKT als JSON-Objekt (ohne Markdown-Formatierung) mit folgenden Schlüsseln zurück:
"fillers" (Anzahl der Füllwörter im Transkript als Zahl, z.B. "also", "halt", "quasi", "irgendwie"),
"aiTip" (Ein konkreter Coaching-Tipp in 2-3 Sätzen. Beziehe dich auf den INHALT des Gesagten UND auf die auffälligste der gemessenen Zahlen. Sprich den Nutzer direkt mit "du" an. Nenne eine konkrete Sache, die er beim nächsten Versuch anders machen soll — keine allgemeinen Floskeln).`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('Gemini API Fehler:', response.status, errBody);
      res.status(502).json({ error: 'KI-Analyse fehlgeschlagen (Upstream-Fehler).' });
      return;
    }

    const data = await response.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      console.error('Gemini: leere oder blockierte Antwort', data);
      res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert (evtl. Sicherheitsfilter).' });
      return;
    }

    const parsed = JSON.parse(resultText);
    res.status(200).json(parsed);
  } catch (e) {
    console.error('AI Error:', e);
    res.status(500).json({ error: 'Interner Fehler bei der KI-Analyse.' });
  }
}
