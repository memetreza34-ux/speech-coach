import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!getApps().length) {
  initializeApp({
    projectId: 'laughing-technique-w53bd'
  });
}

const db = getFirestore('ai-studio-speechcoach-a3524e75-2452-4cc3-b2c8-a766590f3df4');

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests
    message: { error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const PREMIUM_MODES = [
    'interview_interactive', 'sales_objection', 'presentation', 'pitch', 
    'negotiation', 'resignation', 'conflict', 'wedding', 'apology', 
    'vision', 'excuses', 'crisis', 'panel', 'lang_fr', 'lang_es'
  ];

  const verifyPremiumMode = async (req, res, mode) => {
    if (mode && PREMIUM_MODES.includes(mode)) {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      if (!userDoc.exists || userDoc.data().isPremium !== true) {
        return false;
      }
    }
    return true;
  };

  app.use(express.json({ limit: '2mb' })); // Reduced from 10mb for better security
  app.use('/api/', apiLimiter);
  app.use('/api/', requireAuth);

  // API Route for Account Deletion
  app.delete('/api/account', async (req, res) => {
    try {
      const uid = req.user.uid;

      // Delete all sessions in a batch
      const sessionsRef = db.collection('users').doc(uid).collection('sessions');
      const sessionsSnapshot = await sessionsRef.get();
      
      const batch = db.batch();
      sessionsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Delete user document
      await db.collection('users').doc(uid).delete();

      // Delete Firebase Auth user
      await getAuth().deleteUser(uid);

      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('Account Delete Error:', e);
      return res.status(500).json({ error: 'Fehler beim Löschen des Accounts.' });
    }
  });

  // API Route for Training Data Deletion
  app.delete('/api/account/data', async (req, res) => {
    try {
      const uid = req.user.uid;
      const sessionsRef = db.collection('users').doc(uid).collection('sessions');
      const sessionsSnapshot = await sessionsRef.get();
      
      const batch = db.batch();
      sessionsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('Data Delete Error:', e);
      return res.status(500).json({ error: 'Fehler beim Löschen der Daten.' });
    }
  });

  // API Route for creating Custom Modes
  app.post('/api/custom-modes', async (req, res) => {
    try {
      const { title, prompt } = req.body || {};
      const uid = req.user.uid;
      
      if (typeof title !== 'string' || !title.trim() || title.trim().length > 25) {
        return res.status(400).json({ error: 'Titel ungültig (max. 25 Zeichen).' });
      }
      if (typeof prompt !== 'string' || !prompt.trim() || prompt.trim().length > 1500) {
        return res.status(400).json({ error: 'Szenario ungültig (max. 1500 Zeichen).' });
      }

      const userDocRef = db.collection('users').doc(uid);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
      }
      
      const data = userDoc.data();
      const customModes = data.customModes || [];
      const isPremium = data.isPremium === true;
      
      if (!isPremium && customModes.length >= 1) {
        return res.status(403).json({ error: 'Free-Nutzer können maximal 1 eigenes Szenario erstellen.' });
      }
      
      const newMode = {
        id: `custom_${Date.now()}`,
        title: title.trim(),
        prompt: prompt.trim(),
        category: 'custom',
        isPremium: false,
        color: 'from-fuchsia-500 to-pink-600',
        icon: 'Zap'
      };
      
      await userDocRef.update({
        customModes: [...customModes, newMode]
      });
      
      return res.status(200).json({ success: true, mode: newMode });
    } catch (e) {
      console.error('Custom Mode Create Error:', e);
      return res.status(500).json({ error: 'Fehler beim Erstellen des Szenarios.' });
    }
  });

  // API Route for Upgrade (Simulated Stripe Webhook / Entitlement)
  app.post('/api/upgrade', async (req, res) => {
    if (process.env.ALLOW_DEMO_PREMIUM !== 'true') {
      return res.status(403).json({ error: 'Demo-Premium ist deaktiviert.' });
    }
    try {
      const uid = req.user.uid;
      await db.collection('users').doc(uid).update({
        isPremium: true
      });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('Upgrade Error:', e);
      return res.status(500).json({ error: 'Upgrade failed.' });
    }
  });

  app.post('/api/analyze', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Server ist nicht konfiguriert (GEMINI_API_KEY fehlt).' });
    }

    const { transcript, mode, profile, metrics, customPrompt, frames } = req.body || {};
    
    // Server-side Premium Check
    if (!(await verifyPremiumMode(req, res, mode))) {
      return res.status(403).json({ error: 'Dieser Modus erfordert ein Premium-Abonnement.' });
    }

    if (typeof transcript !== 'string' || !transcript.trim() || transcript.length > 10000) {
      return res.status(400).json({ error: 'Transkript fehlt, ist leer oder zu lang.' });
    }
    
    if (frames && (!Array.isArray(frames) || frames.length > 5)) {
      return res.status(400).json({ error: 'Zu viele Frames (max 5).' });
    }
    if (frames) {
      for (const frame of frames) {
        if (typeof frame !== 'string' || !frame.startsWith('data:image/jpeg;base64,')) {
           return res.status(400).json({ error: 'Ungültiges Frame-Format.' });
        }
      }
    }

    const safeTranscript = transcript;
    const safeProfile = profile && typeof profile === 'object' ? profile : {};
    // Ensure profile fields are strings and trimmed
    const profileName = typeof safeProfile.name === 'string' ? safeProfile.name.slice(0, 100) : '';
    const profileRole = typeof safeProfile.role === 'string' ? safeProfile.role.slice(0, 100) : '';
    const profileAge = typeof safeProfile.age === 'string' ? safeProfile.age.slice(0, 10) : '';
    const profileHobbies = typeof safeProfile.hobbies === 'string' ? safeProfile.hobbies.slice(0, 300) : '';

    const m = metrics && typeof metrics === 'object' ? metrics : {};
    // Validate metrics fields
    const wpm = typeof m.wpm === 'number' ? m.wpm : '?';
    const pauseCount = typeof m.pauseCount === 'number' ? m.pauseCount : '?';
    const longestPauseMs = typeof m.longestPauseMs === 'number' ? m.longestPauseMs : '?';
    const speakingRatio = typeof m.speakingRatio === 'number' ? m.speakingRatio : '?';
    const dynamics = typeof m.dynamics === 'number' ? m.dynamics : '?';
    const pacingStatus = typeof m.pacingStatus === 'string' ? m.pacingStatus : '?';
    
    const contextPrompt = customPrompt ? `Das Szenario ist: "${customPrompt.slice(0, 1500)}"` : `Szenario-Modus: ${mode || 'impromptu'}.`;

    const promptText = `Du bist ein professioneller Kommunikationstrainer. Analysiere den folgenden Sprech-Versuch eines Nutzers.
Nutzer-Profil: Name: ${profileName}, Rolle: ${profileRole}, Alter: ${profileAge}, Hobbys: ${profileHobbies}.
${contextPrompt}

Gemessene Werte aus der Audioaufnahme (diese sind bereits ermittelt, du musst sie nicht berechnen):
- Sprechtempo: ${wpm} Wörter/Minute (${pacingStatus})
- Sprechpausen über 0,6s: ${pauseCount} (längste: ${longestPauseMs !== '?' ? (longestPauseMs / 1000).toFixed(1) + 's' : '?'})
- Redeanteil: ${speakingRatio}% der Aufnahmezeit
- Lautstärkedynamik: ${dynamics} (unter 35 = monoton, über 75 = sehr bewegt)

Transkript: "${safeTranscript}"

${frames && frames.length > 0 ? "Du erhältst zusätzlich Einzelbilder aus der Webcam des Nutzers während des Sprechens. Beurteile anhand dieser Bilder Körpersprache, Gestik und Blickkontakt (Wirkt die Person offen? Schaut sie in die Kamera?)." : "Keine Videobilder verfügbar."}

Gib DEINE ANTWORT EXAKT als JSON-Objekt (ohne Markdown-Formatierung) mit folgenden Schlüsseln zurück:
"fillers": (Anzahl der Füllwörter im Transkript als Zahl, z.B. "also", "halt", "quasi", "irgendwie", min 0),
"confidenceScore": (Ein Wert von 0 bis 100 als Zahl, der bewertet, wie souverän, klar und flüssig der Sprecher wirkt. Berücksichtige dabei Tempo, Pausen, Füllwörter, schwache Formulierungen wie "vielleicht" oder "eigentlich" und Ausdrucksweise. Oder null wenn nicht bewertbar.),
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
        const data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: { mimeType: "image/jpeg", data }
        });
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000); // 18 seconds timeout

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

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
      
      // Output validation
      if (typeof parsed.fillers !== 'number' || parsed.fillers < 0) parsed.fillers = 0;
      if (typeof parsed.confidenceScore !== 'number' || parsed.confidenceScore < 0 || parsed.confidenceScore > 100) parsed.confidenceScore = null;
      if (!parsed.aiTip || typeof parsed.aiTip !== 'object') {
        throw new Error("Invalid AI Tip format");
      }
      parsed.aiTip.summary = String(parsed.aiTip.summary || '');
      parsed.aiTip.strengths = String(parsed.aiTip.strengths || '');
      parsed.aiTip.improvements = String(parsed.aiTip.improvements || '');
      parsed.aiTip.actionTip = String(parsed.aiTip.actionTip || '');
      if (parsed.aiTip.bodyLanguage) parsed.aiTip.bodyLanguage = String(parsed.aiTip.bodyLanguage);

      return res.status(200).json(parsed);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }
      console.error('AI Error:', e);
      return res.status(500).json({ error: 'Interner Fehler bei der KI-Analyse.' });
    }
  });

  // API Route for Interactive Interview Mode
  app.post('/api/interview', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server ist nicht konfiguriert.' });

    const { mode, messages, profile, customPrompt, frames } = req.body || {};
    
    // Server-side Premium Check (Always required for Live Interviews)
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().isPremium !== true) {
      return res.status(403).json({ error: 'Live-Interviews erfordern ein Premium-Abonnement.' });
    }

    if (!Array.isArray(messages) || messages.length > 50) return res.status(400).json({ error: 'Messages ungültig oder zu lang.' });

    const safeProfile = profile && typeof profile === 'object' ? profile : {};
    const profileName = typeof safeProfile.name === 'string' ? safeProfile.name.slice(0, 100) : 'Bewerber';
    const profileRole = typeof safeProfile.role === 'string' ? safeProfile.role.slice(0, 100) : '';
    const profileAge = typeof safeProfile.age === 'string' ? safeProfile.age.slice(0, 10) : '';
    const profileHobbies = typeof safeProfile.hobbies === 'string' ? safeProfile.hobbies.slice(0, 300) : '';

    const contextPrompt = customPrompt && typeof customPrompt === 'string' ? `Interview-Szenario: "${customPrompt.slice(0, 1500)}"` : `Bewerbungsgespräch.`;

    const systemInstruction = `Du bist ein professioneller, empathischer aber anspruchsvoller Interviewer für folgendes Szenario:
${contextPrompt}
Nutzer-Profil: Name: ${profileName}, Rolle: ${profileRole}, Alter: ${profileAge}, Hobbys: ${profileHobbies}.

Deine Aufgabe: Führe das Gespräch.
Bei jeder Nachricht des Nutzers analysierst du kurz intern seine Antwort (Struktur, Klarheit, Überzeugungskraft) und generierst dann DEINE NÄCHSTE ANTWORT.

WICHTIG: Gib DEINE ANTWORT EXAKT als JSON-Objekt (ohne Markdown) mit folgenden Schlüsseln zurück:
"interviewerSpeech": "Das, was du als nächstes zum Nutzer sagst (nächste Frage oder Reaktion).",
"feedback": "Ein kurzer (1 Satz) geheimer Tipp an den Nutzer, wie seine letzte Antwort war und was er besser machen kann (wird dem Nutzer als Coach-Tipp angezeigt).",
"isFinished": boolean (Setze dies auf true, wenn das Interview nach dieser Antwort vorbei ist, sonst false).`;

    const contents = [];
    for (const msg of messages) {
      if (typeof msg.role !== 'string' || !['user', 'model'].includes(msg.role)) {
        return res.status(400).json({ error: 'Ungültige Message Role.' });
      }
      if (typeof msg.text !== 'string' || msg.text.length > 2000) {
        return res.status(400).json({ error: 'Ungültiger Message Text.' });
      }
      contents.push({
        role: msg.role,
        parts: [{ text: msg.text }]
      });
    }

    if (frames && (!Array.isArray(frames) || frames.length > 5)) {
      return res.status(400).json({ error: 'Zu viele Frames (max 5).' });
    }

    // Optionally append images to the latest user message if available
    if (frames && Array.isArray(frames) && frames.length > 0 && contents.length > 0) {
       const lastMsg = contents[contents.length - 1];
       if (lastMsg.role === 'user') {
         for (const imgBase64 of frames) {
           if (typeof imgBase64 !== 'string' || !imgBase64.startsWith('data:image/jpeg;base64,')) {
             return res.status(400).json({ error: 'Ungültiges Frame-Format.' });
           }
           const data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
           lastMsg.parts.push({ inlineData: { mimeType: "image/jpeg", data } });
         }
       }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

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

      // Validate output
      if (typeof parsed.interviewerSpeech !== 'string') parsed.interviewerSpeech = '';
      if (typeof parsed.feedback !== 'string') parsed.feedback = '';
      if (typeof parsed.isFinished !== 'boolean') parsed.isFinished = false;

      return res.status(200).json(parsed);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }
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
      const date = new Date(session.date || session.timestamp || Date.now()).toLocaleDateString('de-DE');
      return `Session ${i + 1} (${date}): Modus: ${session.mode || 'unbekannt'}, Dauer: ${session.durationMs || '?'}ms, WPM: ${session.wpm || '?'}, Füllwörter: ${session.fillers || '?'}, Confidence Score: ${session.confidenceScore || '?'}`;
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
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get(/(.*)/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
