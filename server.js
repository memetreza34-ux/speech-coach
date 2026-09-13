import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route ported from api/analyze.js
  app.post('/api/analyze', async (req, res) => {
    const MAX_TRANSCRIPT_LENGTH = 4000;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Server ist nicht konfiguriert (GEMINI_API_KEY fehlt).' });
    }

    const { transcript, mode, profile, metrics, customPrompt, frames } = req.body || {};
    if (typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({ error: 'Transkript fehlt oder ist leer.' });
    }

    const safeTranscript = transcript.slice(0, MAX_TRANSCRIPT_LENGTH);
    const safeProfile = profile && typeof profile === 'object' ? profile : {};
    const m = metrics && typeof metrics === 'object' ? metrics : {};
    const contextPrompt = customPrompt ? `Das Szenario ist: "${customPrompt}"` : `Szenario-Modus: ${mode || 'impromptu'}.`;

    const promptText = `Du bist ein professioneller Kommunikationstrainer. Analysiere den folgenden Sprech-Versuch eines Nutzers.
Nutzer-Profil: Name: ${safeProfile.name || ''}, Rolle: ${safeProfile.role || ''}, Alter: ${safeProfile.age || ''}, Hobbys: ${safeProfile.hobbies || ''}.
${contextPrompt}

Gemessene Werte aus der Audioaufnahme (diese sind bereits ermittelt, du musst sie nicht berechnen):
- Sprechtempo: ${m.wpm ?? '?'} Wörter/Minute (${m.pacingStatus ?? '?'})
- Sprechpausen über 0,6s: ${m.pauseCount ?? '?'} (längste: ${m.longestPauseMs ? (m.longestPauseMs / 1000).toFixed(1) + 's' : '?'})
- Redeanteil: ${m.speakingRatio ?? '?'}% der Aufnahmezeit
- Stimmdynamik: ${m.dynamics ?? '?'} (unter 35 = monoton, über 75 = sehr bewegt)

Transkript: "${safeTranscript}"

${frames && frames.length > 0 ? "Du erhältst zusätzlich Einzelbilder aus der Webcam des Nutzers während des Sprechens. Beurteile anhand dieser Bilder Körpersprache, Gestik und Blickkontakt (Wirkt die Person offen? Schaut sie in die Kamera?)." : "Keine Videobilder verfügbar."}

Gib DEINE ANTWORT EXAKT als JSON-Objekt (ohne Markdown-Formatierung) mit folgenden Schlüsseln zurück:
"fillers": (Anzahl der Füllwörter im Transkript als Zahl, z.B. "also", "halt", "quasi", "irgendwie"),
"confidenceScore": (Ein Wert von 0 bis 100 als Zahl, der bewertet, wie souverän, klar und flüssig der Sprecher wirkt. Berücksichtige dabei Tempo, Pausen, Füllwörter, schwache Formulierungen wie "vielleicht" oder "eigentlich" und Ausdrucksweise),
"aiTip": {
  "summary": "Kurze inhaltliche Zusammenfassung (1-2 Sätze)",
  "strengths": "Was lief gut? (Inhaltlich oder anhand der Messwerte, 1-2 Sätze)",
  "improvements": "Detailliertes Verbesserungspotenzial (Inhalt, Struktur, schwache Wörter oder anhand der Messwerte, 2-3 Sätze)",
  "actionTip": "Konkreter Tipp für das nächste Mal (1 Satz, sprich den Nutzer direkt an)",
  "bodyLanguage": ${frames && frames.length > 0 ? '"Kurzes Feedback zur Körpersprache anhand der Bilder (1-2 Sätze)"' : 'null'}
}
Achte auf ein motivierendes, aber sehr ehrliches Feedback.`;

    const parts = [{ text: promptText }];
    if (frames && Array.isArray(frames)) {
      frames.forEach(imgBase64 => {
        // Strip data prefix if present
        const data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: { mimeType: "image/jpeg", data }
        });
      });
    }

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('Gemini API Fehler:', response.status, errBody);
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen (Upstream-Fehler).' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        console.error('Gemini: leere oder blockierte Antwort', data);
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert (evtl. Sicherheitsfilter).' });
      }

      const parsed = JSON.parse(resultText);
      return res.status(200).json(parsed);
    } catch (e) {
      console.error('AI Error:', e);
      return res.status(500).json({ error: 'Interner Fehler bei der KI-Analyse.' });
    }
  });

  // API Route for Interactive Interview Mode
  app.post('/api/interview', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server ist nicht konfiguriert.' });

    const { messages, profile, customPrompt, frames } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'Messages fehlt.' });

    const safeProfile = profile && typeof profile === 'object' ? profile : {};
    const contextPrompt = customPrompt ? `Interview-Szenario: "${customPrompt}"` : `Bewerbungsgespräch.`;

    const systemInstruction = `Du bist ein professioneller, empathischer aber anspruchsvoller Interviewer für folgendes Szenario:
${contextPrompt}
Nutzer-Profil: Name: ${safeProfile.name || 'Bewerber'}, Rolle: ${safeProfile.role || ''}, Alter: ${safeProfile.age || ''}, Hobbys: ${safeProfile.hobbies || ''}.

Deine Aufgabe: Führe das Gespräch.
Bei jeder Nachricht des Nutzers analysierst du kurz intern seine Antwort (Struktur, Klarheit, Überzeugungskraft) und generierst dann DEINE NÄCHSTE ANTWORT.

WICHTIG: Gib DEINE ANTWORT EXAKT als JSON-Objekt (ohne Markdown) mit folgenden Schlüsseln zurück:
"interviewerSpeech": "Das, was du als nächstes zum Nutzer sagst (nächste Frage oder Reaktion).",
"feedback": "Ein kurzer (1 Satz) geheimer Tipp an den Nutzer, wie seine letzte Antwort war und was er besser machen kann (wird dem Nutzer als Coach-Tipp angezeigt).",
"isFinished": boolean (Setze dies auf true, wenn das Interview nach dieser Antwort vorbei ist, sonst false).`;

    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Optionally append images to the latest user message if available
    if (frames && Array.isArray(frames) && frames.length > 0 && contents.length > 0) {
       const lastMsg = contents[contents.length - 1];
       if (lastMsg.role === 'user') {
         frames.forEach(imgBase64 => {
           const data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
           lastMsg.parts.push({ inlineData: { mimeType: "image/jpeg", data } });
         });
       }
    }

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('Gemini API Fehler (Interview):', response.status, errBody);
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen.' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }

      const parsed = JSON.parse(resultText);
      return res.status(200).json(parsed);
    } catch (e) {
      console.error('AI Error (Interview):', e);
      return res.status(500).json({ error: 'Interner Fehler beim Interview.' });
    }
  });

  // API Route for Long-Term Progress Analysis
  app.post('/api/analyze-progress', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server ist nicht konfiguriert.' });

    const { history, profile } = req.body || {};
    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: 'Keine Historie vorhanden.' });
    }

    const safeProfile = profile && typeof profile === 'object' ? profile : {};
    
    // Prepare history summary
    const historySummary = history.slice(0, 20).map((session, i) => {
      const date = new Date(session.timestamp).toLocaleDateString('de-DE');
      return `Session ${i + 1} (${date}): Modus: ${session.mode}, Dauer: ${session.metrics.durationMs}ms, WPM: ${session.metrics.wpm}, Füllwörter: ${session.fillers}, Confidence Score: ${session.confidenceScore}`;
    }).join('\n');

    const promptText = `Du bist ein hochqualifizierter KI-Kommunikationstrainer. Der Nutzer hat mich gebeten, seinen Langzeit-Fortschritt zu analysieren.
Nutzer-Profil: Name: ${safeProfile.name || 'Nutzer'}, Rolle: ${safeProfile.role || ''}.

Hier sind die letzten Trainings-Aufzeichnungen des Nutzers:
${historySummary}

Bitte schreibe eine detaillierte, motivierende, aber sehr konkrete KI-Langzeitanalyse.
Erkenne Muster (z.B. "Du wirst immer schneller, wenn...", "Deine Füllwörter haben im Vergleich zu den ersten Sessions abgenommen").

Gib DEINE ANTWORT EXAKT als JSON-Objekt (ohne Markdown) mit folgenden Schlüsseln zurück:
"insight": "Eine motivierende Zusammenfassung des Fortschritts und der Entwicklung über Zeit (ca. 2-3 Sätze).",
"strengths": ["Stärke 1", "Stärke 2"] (1-2 konkrete Stärken basierend auf den Daten),
"improvements": ["Verbesserung 1", "Verbesserung 2"] (1-2 klare Schwächen oder Muster, an denen der Nutzer noch arbeiten muss).`;

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!response.ok) {
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen.' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }

      const parsed = JSON.parse(resultText);
      return res.status(200).json(parsed);
    } catch (e) {
      console.error('AI Error (Progress):', e);
      return res.status(500).json({ error: 'Interner Fehler bei der Langzeitanalyse.' });
    }
  });

  // API Route for Persona Analysis
  app.post('/api/analyze-persona', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server ist nicht konfiguriert.' });

    const { profile } = req.body || {};
    const safeProfile = profile && typeof profile === 'object' ? profile : {};
    
    if (!safeProfile.role && !safeProfile.hobbies) {
      return res.status(400).json({ error: 'Bitte fülle zuerst dein Profil aus.' });
    }

    const promptText = `Du bist ein hochqualifizierter KI-Kommunikationstrainer. Analysiere das Profil des Nutzers und erstelle eine "Kommunikations-Identität" (Persona).
Profil: Name: ${safeProfile.name || 'Nutzer'}, Alter: ${safeProfile.age || 'unbekannt'}, Rolle/Beruf: ${safeProfile.role || 'unbekannt'}, Interessen: ${safeProfile.hobbies || 'unbekannt'}.

Welcher Kommunikationstyp (Archetyp) passt zu dieser Person aufgrund ihres Berufs und ihrer Interessen? Welche rhetorischen Stärken sollte sie ausspielen und welche versteckten Fallen gibt es für sie?

Gib DEINE ANTWORT EXAKT als JSON-Objekt (ohne Markdown) mit folgenden Schlüsseln zurück:
"archetype": "Ein cooler, passender Name für diesen Kommunikationstyp (z.B. 'Der pragmatische Visionär' oder 'Die empathische Analytikerin')",
"description": "Eine motivierende Beschreibung, wie dieser Typ idealerweise kommuniziert und warum das anhand des Profils so ist (2-3 Sätze).",
"superpower": "Die rhetorische Superkraft dieses Typs (1 Satz).",
"trap": "Die größte Kommunikationsfalle für diesen Typ (1 Satz)."`;

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!response.ok) {
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen.' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }

      const parsed = JSON.parse(resultText);
      return res.status(200).json(parsed);
    } catch (e) {
      console.error('AI Error (Persona):', e);
      return res.status(500).json({ error: 'Interner Fehler bei der Persona-Analyse.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
