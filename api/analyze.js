// Vercel Serverless Function: proxied Gemini call.
// Der Gemini API-Key lebt ausschließlich hier server-seitig (Env-Var GEMINI_API_KEY)
// und wird nie an den Client ausgeliefert.

const MAX_TRANSCRIPT_LENGTH = 4000;

const getPacingStatus = (wpm) => {
  if (wpm < 110) return 'Zu langsam';
  if (wpm > 160) return 'Zu schnell';
  return 'Perfekt';
};

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

  const { transcript, mode, profile, durationMs } = req.body || {};
  if (typeof transcript !== 'string' || !transcript.trim()) {
    res.status(400).json({ error: 'Transkript fehlt oder ist leer.' });
    return;
  }

  const safeTranscript = transcript.slice(0, MAX_TRANSCRIPT_LENGTH);
  const safeProfile = profile && typeof profile === 'object' ? profile : {};
  const safeDurationMs = Number(durationMs) > 0 ? Number(durationMs) : 60000;
  const wordCount = (safeTranscript.trim().match(/\S+/g) || []).length;
  const minutes = Math.max(safeDurationMs / 60000, 1 / 60);
  const measuredWpm = Math.round(wordCount / minutes);

  const prompt = `Du bist ein professioneller Kommunikationstrainer. Analysiere das folgende Transkript eines Nutzers.
Nutzer-Profil: Name: ${safeProfile.name || ''}, Rolle: ${safeProfile.role || ''}, Alter: ${safeProfile.age || ''}, Hobbys: ${safeProfile.hobbies || ''}.
Szenario-Modus: ${mode || 'impromptu'}.
Die Aufnahme dauerte ca. ${Math.round(safeDurationMs / 1000)} Sekunden und enthält ${wordCount} Wörter.
Transkript: "${safeTranscript}"

Gib DEINE ANTWORT EXAKT als JSON-Objekt (ohne Markdown-Formatierung) mit folgenden Schlüsseln zurück:
"fillers" (Anzahl der Füllwörter als Zahl),
"wpm" (Wörter pro Minute als Zahl, berechnet aus Wortanzahl und Aufnahmedauer),
"pacingStatus" (Ein kurzes Wort zum Tempo: "Zu langsam", "Perfekt", oder "Zu schnell"),
"aiTip" (Ein 2-Satz Tipp, spezifisch auf den Inhalt des Transkripts, das Szenario und die Hobbys/Rolle des Nutzers bezogen).`;

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
      res.status(502).json({ error: 'KI-Analyse fehlgeschlagen (Upstream-Fehler).', wpm: measuredWpm, pacingStatus: getPacingStatus(measuredWpm) });
      return;
    }

    const data = await response.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      console.error('Gemini: leere oder blockierte Antwort', data);
      res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert (evtl. Sicherheitsfilter).', wpm: measuredWpm, pacingStatus: getPacingStatus(measuredWpm) });
      return;
    }

    const parsed = JSON.parse(resultText);
    res.status(200).json(parsed);
  } catch (e) {
    console.error('AI Error:', e);
    res.status(500).json({ error: 'Interner Fehler bei der KI-Analyse.', wpm: measuredWpm, pacingStatus: getPacingStatus(measuredWpm) });
  }
}
