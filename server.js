import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { MODES as PREMIUM_MODES_CONFIG } from './src/shared/modes.js';

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

export function createApp() {
  const app = express();

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests
    message: { error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const PREMIUM_MODES = PREMIUM_MODES_CONFIG.filter(m => m.isPremium).map(m => m.id);

  const verifyPremiumMode = async (req, res, mode) => {
    if (mode && PREMIUM_MODES.includes(mode)) {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      if (!userDoc.exists || userDoc.data().isPremium !== true) {
        return false;
      }
    }
    return true;
  };

  const getPositiveIntEnv = (name, fallback, options = { allowZero: false }) => {
    const val = process.env[name];
    if (val === undefined || val === '') return fallback;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return fallback;
    if (parsed < 0) return fallback;
    if (parsed === 0 && !options.allowZero) return fallback;
    return parsed;
  };

  const consumeQuota = async (uid, isPremium, type) => {
    const today = new Date().toISOString().split('T')[0];
    const docRef = db.collection('users').doc(uid).collection('usage').doc(today);
    
    const limits = {
      analyze: isPremium ? getPositiveIntEnv('PRO_DAILY_ANALYSES', 50) : getPositiveIntEnv('FREE_DAILY_ANALYSES', 5),
      interviewTurn: isPremium ? getPositiveIntEnv('PRO_DAILY_INTERVIEW_TURNS', 100) : getPositiveIntEnv('FREE_DAILY_INTERVIEW_TURNS', 0, { allowZero: true }),
      progress: isPremium ? getPositiveIntEnv('PRO_DAILY_PROGRESS', 10) : getPositiveIntEnv('FREE_DAILY_PROGRESS', 2),
      persona: isPremium ? getPositiveIntEnv('PRO_DAILY_PERSONA', 10) : getPositiveIntEnv('FREE_DAILY_PERSONA', 2),
    };
    
    if (!(type in limits)) {
      throw new Error(`Unknown quota type: ${type}`);
    }
    
    const maxLimit = limits[type];

    return await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);
      const usage = docSnap.exists ? docSnap.data()[type] || 0 : 0;
      
      if (usage >= maxLimit) {
        return false;
      }
      
      transaction.set(docRef, { [type]: usage + 1 }, { merge: true });
      return true;
    });
  };

  const refundQuota = async (uid, type) => {
    const today = new Date().toISOString().split('T')[0];
    const docRef = db.collection('users').doc(uid).collection('usage').doc(today);
    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (docSnap.exists) {
        const usage = docSnap.data()[type] || 0;
        if (usage > 0) {
          transaction.set(docRef, { [type]: usage - 1 }, { merge: true });
        }
      }
    });
  };

  app.use(express.json({ limit: '2mb' })); // Reduced from 10mb for better security
  
  // Release Health Endpoint
  app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api/', apiLimiter);
  app.use('/api/', requireAuth);

  // Helper to delete collections in batches
  async function deleteCollectionInBatches(collectionRef, batchSize = 400) {
    let snapshot = await collectionRef.limit(batchSize).get();
    while (snapshot.size > 0) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      snapshot = await collectionRef.limit(batchSize).get();
    }
  }

  // API Route for Account Deletion
  app.delete('/api/account', async (req, res) => {
    try {
      const uid = req.user.uid;

      // Delete all sessions in batches
      const sessionsRef = db.collection('users').doc(uid).collection('sessions');
      await deleteCollectionInBatches(sessionsRef);

      // Delete usage subcollection
      const usageRef = db.collection('users').doc(uid).collection('usage');
      await deleteCollectionInBatches(usageRef);

      // Delete user document
      await db.collection('users').doc(uid).delete();

      // Delete Firebase Auth user
      try {
        await getAuth().deleteUser(uid);
      } catch (e) {
        if (e.code !== 'auth/user-not-found') {
          throw e;
        }
      }

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
      await deleteCollectionInBatches(sessionsRef);
      
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
      const newMode = {
        id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title: title.trim(),
        prompt: prompt.trim(),
        category: 'custom',
        isPremium: false,
        color: 'from-fuchsia-500 to-pink-600',
        icon: 'Zap'
      };
      
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists) {
          throw new Error('Benutzer nicht gefunden.');
        }
        
        const data = userDoc.data();
        const customModes = data.customModes || [];
        const isPremium = data.isPremium === true;
        
        const maxModes = isPremium ? parseInt(process.env.PRO_CUSTOM_MODES || 20) : parseInt(process.env.FREE_CUSTOM_MODES || 1);
        
        if (customModes.length >= maxModes) {
          throw new Error(`Limit für eigene Szenarien (${maxModes}) erreicht.`);
        }
        
        transaction.update(userDocRef, {
          customModes: [...customModes, newMode]
        });
      });

      return res.status(200).json({ success: true, mode: newMode });
    } catch (e) {
      console.error('Custom Mode Error:', e);
      return res.status(e.message.includes('Limit') ? 403 : (e.message.includes('gefunden') ? 404 : 500)).json({ error: e.message || 'Interner Fehler.' });
    }
  });

  // API Route for deleting Custom Modes
  app.delete('/api/custom-modes/:id', async (req, res) => {
    try {
      const modeId = req.params.id;
      const uid = req.user.uid;
      
      if (!modeId || typeof modeId !== 'string') {
        return res.status(400).json({ error: 'Ungültige ID.' });
      }

      const userDocRef = db.collection('users').doc(uid);
      
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists) {
          throw new Error('Benutzer nicht gefunden.');
        }
        
        const data = userDoc.data();
        const customModes = data.customModes || [];
        const newModes = customModes.filter(m => m.id !== modeId);
        
        if (newModes.length === customModes.length) {
          throw new Error('Szenario nicht gefunden.');
        }
        
        transaction.update(userDocRef, {
          customModes: newModes
        });
      });

      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('Custom Mode Delete Error:', e);
      return res.status(e.message.includes('gefunden') ? 404 : 500).json({ error: e.message || 'Interner Fehler.' });
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

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const isPremium = userDoc.exists && userDoc.data().isPremium === true;

    if (typeof transcript !== 'string' || !transcript.trim() || transcript.length > 10000) {
      return res.status(400).json({ error: 'Transkript fehlt, ist leer oder zu lang.' });
    }
    
    if (customPrompt !== undefined && typeof customPrompt !== 'string') {
      return res.status(400).json({ error: 'Ungültiges Format für customPrompt.' });
    }

    if (frames && (!Array.isArray(frames) || frames.length > 5)) {
      return res.status(400).json({ error: 'Zu viele Frames (max 5).' });
    }
    if (frames && frames.length > 0 && !isPremium) {
      return res.status(403).json({ error: 'Die Kamera-Analyse erfordert ein Premium-Abonnement.' });
    }
    if (frames) {
      let totalSize = 0;
      for (const frame of frames) {
        if (typeof frame !== 'string' || !frame.startsWith('data:image/jpeg;base64,')) {
           return res.status(400).json({ error: 'Ungültiges Frame-Format.' });
        }
        totalSize += frame.length;
        if (frame.length > 500000) { // Limit individual frame base64 length to ~500KB
           return res.status(400).json({ error: 'Frame zu groß.' });
        }
      }
      if (totalSize > 2000000) {
        return res.status(400).json({ error: 'Gesamtgröße der Frames überschreitet das Limit.' });
      }
    }

    if (!(await consumeQuota(req.user.uid, isPremium, 'analyze'))) {
      return res.status(429).json({ error: 'Tägliches Limit für KI-Analysen erreicht.' });
    }

    const safeTranscript = transcript;
    const safeProfile = profile && typeof profile === 'object' ? profile : {};
    // Ensure profile fields are strings and trimmed
    const profileName = typeof safeProfile.name === 'string' ? safeProfile.name.slice(0, 100) : '';
    const profileRole = typeof safeProfile.role === 'string' ? safeProfile.role.slice(0, 100) : '';
    const profileAge = typeof safeProfile.age === 'string' ? safeProfile.age.slice(0, 10) : '';
    const profileHobbies = typeof safeProfile.hobbies === 'string' ? safeProfile.hobbies.slice(0, 300) : '';

    const m = metrics && typeof metrics === 'object' ? metrics : {};
    
    if (m.wpm !== undefined && (typeof m.wpm !== 'number' || m.wpm < 0 || m.wpm > 400)) return res.status(400).json({ error: 'Ungültiger WPM-Wert.' });
    if (m.pauseCount !== undefined && (typeof m.pauseCount !== 'number' || m.pauseCount < 0)) return res.status(400).json({ error: 'Ungültiger pauseCount-Wert.' });
    if (m.longestPauseMs !== undefined && (typeof m.longestPauseMs !== 'number' || m.longestPauseMs < 0 || (m.durationMs && m.longestPauseMs > m.durationMs))) return res.status(400).json({ error: 'Ungültiger longestPauseMs-Wert.' });
    if (m.speakingRatio !== undefined && (typeof m.speakingRatio !== 'number' || m.speakingRatio < 0 || m.speakingRatio > 100)) return res.status(400).json({ error: 'Ungültiger speakingRatio-Wert.' });
    if (m.dynamics !== undefined && (typeof m.dynamics !== 'number' || m.dynamics < 0 || m.dynamics > 500)) return res.status(400).json({ error: 'Ungültiger dynamics-Wert.' });
    if (m.durationMs !== undefined && (typeof m.durationMs !== 'number' || m.durationMs < 0 || m.durationMs > 3600000)) return res.status(400).json({ error: 'Ungültiger durationMs-Wert.' });

    const wpm = m.wpm ?? '?';
    const pauseCount = m.pauseCount ?? '?';
    const longestPauseMs = m.longestPauseMs ?? '?';
    const speakingRatio = m.speakingRatio ?? '?';
    const dynamics = m.dynamics ?? '?';
    const pacingStatus = typeof m.pacingStatus === 'string' ? m.pacingStatus.slice(0, 20) : '?';
    
    const contextPrompt = typeof customPrompt === 'string' ? `Das Szenario ist: "${customPrompt.slice(0, 1500)}"` : `Szenario-Modus: ${mode || 'impromptu'}.`;

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
          generationConfig: { 
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                fillers: { type: 'INTEGER', description: 'Anzahl der erkannten Füllwörter' },
                confidenceScore: { type: 'INTEGER', description: 'Bewertung von 0 bis 100, oder null', nullable: true },
                aiTip: {
                  type: 'OBJECT',
                  properties: {
                    summary: { type: 'STRING' },
                    strengths: { type: 'STRING' },
                    improvements: { type: 'STRING' },
                    actionTip: { type: 'STRING' },
                    bodyLanguage: { type: 'STRING', nullable: true }
                  },
                  required: ['summary', 'strengths', 'improvements', 'actionTip']
                }
              },
              required: ['fillers', 'aiTip']
            }
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        await refundQuota(req.user.uid, 'analyze');
        const errBody = await response.text().catch(() => '');
        console.error('Gemini API Fehler:', response.status, errBody);
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen (Upstream-Fehler).' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        await refundQuota(req.user.uid, 'analyze');
        console.error('Gemini: leere oder blockierte Antwort', data);
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert (evtl. Sicherheitsfilter).' });
      }

      const parsed = JSON.parse(resultText);
      
      // Strict Output Validation
      if (typeof parsed.fillers !== 'number' || parsed.fillers < 0) {
        await refundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'fillers missing or invalid' });
      }
      if (parsed.confidenceScore !== null && (typeof parsed.confidenceScore !== 'number' || parsed.confidenceScore < 0 || parsed.confidenceScore > 100)) {
        await refundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'confidenceScore invalid' });
      }
      if (!parsed.aiTip || typeof parsed.aiTip !== 'object') {
        await refundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'aiTip missing or invalid' });
      }
      if (typeof parsed.aiTip.summary !== 'string') await refundQuota(req.user.uid, 'analyze'); return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'summary missing' });
      if (typeof parsed.aiTip.strengths !== 'string') return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'strengths missing' });
      if (typeof parsed.aiTip.improvements !== 'string') return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'improvements missing' });
      if (typeof parsed.aiTip.actionTip !== 'string') return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'actionTip missing' });
      if (parsed.aiTip.bodyLanguage !== null && parsed.aiTip.bodyLanguage !== undefined && typeof parsed.aiTip.bodyLanguage !== 'string') {
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'bodyLanguage invalid' });
      }

      return res.status(200).json(parsed);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        let type = 'analyze';
        if (req.route.path === '/api/interview') type = 'interviewTurn';
        if (req.route.path === '/api/analyze-progress') type = 'progress';
        if (req.route.path === '/api/analyze-persona') type = 'persona';
        await refundQuota(req.user.uid, type);
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }
      console.error('AI Error:', e);
      await refundQuota(req.user.uid, 'analyze');
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
    if (frames && (!Array.isArray(frames) || frames.length > 5)) {
      return res.status(400).json({ error: 'Zu viele Frames (max 5).' });
    }
    if (frames) {
      let totalSize = 0;
      for (const frame of frames) {
        if (typeof frame !== 'string' || !frame.startsWith('data:image/jpeg;base64,')) {
           return res.status(400).json({ error: 'Ungültiges Frame-Format.' });
        }
        totalSize += frame.length;
        if (frame.length > 500000) return res.status(400).json({ error: 'Ein Frame ist zu groß.' });
      }
      if (totalSize > 2000000) return res.status(400).json({ error: 'Frames überschreiten das Gesamt-Limit von 2MB.' });
    }

    if (!(await consumeQuota(req.user.uid, true, 'interviewTurn'))) {
      return res.status(429).json({ error: 'Tägliches Limit für Interview-Züge erreicht.' });
    }

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
         let totalSize = 0;
         for (const imgBase64 of frames) {
           if (typeof imgBase64 !== 'string' || !imgBase64.startsWith('data:image/jpeg;base64,')) {
             return res.status(400).json({ error: 'Ungültiges Frame-Format.' });
           }
           totalSize += imgBase64.length;
           if (imgBase64.length > 500000) {
             return res.status(400).json({ error: 'Frame zu groß.' });
           }
           const data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
           lastMsg.parts.push({ inlineData: { mimeType: "image/jpeg", data } });
         }
         if (totalSize > 2000000) {
           return res.status(400).json({ error: 'Gesamtgröße der Frames überschreitet das Limit.' });
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
          generationConfig: { 
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                interviewerSpeech: { type: 'STRING' },
                feedback: { type: 'STRING' },
                isFinished: { type: 'BOOLEAN' }
              },
              required: ['interviewerSpeech', 'feedback', 'isFinished']
            }
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        await refundQuota(req.user.uid, 'interviewTurn');
        const errBody = await response.text().catch(() => '');
        console.error('Gemini API Fehler (Interview):', response.status, errBody);
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen.' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        let type = 'analyze';
        if (req.route.path === '/api/interview') type = 'interviewTurn';
        if (req.route.path === '/api/analyze-progress') type = 'progress';
        if (req.route.path === '/api/analyze-persona') type = 'persona';
        await refundQuota(req.user.uid, type);
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }

      const parsed = JSON.parse(resultText);

      // Validate output
      if (typeof parsed.interviewerSpeech !== 'string' || !parsed.interviewerSpeech.trim()) {
        await refundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'interviewerSpeech missing' });
      }
      if (typeof parsed.feedback !== 'string') {
        await refundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'feedback missing' });
      }
      if (typeof parsed.isFinished !== 'boolean') {
        await refundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'isFinished missing' });
      }

      return res.status(200).json(parsed);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        let type = 'analyze';
        if (req.route.path === '/api/interview') type = 'interviewTurn';
        if (req.route.path === '/api/analyze-progress') type = 'progress';
        if (req.route.path === '/api/analyze-persona') type = 'persona';
        await refundQuota(req.user.uid, type);
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }
      console.error('AI Error (Interview):', e);
      await refundQuota(req.user.uid, 'interviewTurn');
      return res.status(500).json({ error: 'Interner Fehler beim Interview.' });
    }
  });

  // API Route for Long-Term Progress Analysis
  app.post('/api/analyze-progress', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server ist nicht konfiguriert.' });

    const { history, profile } = req.body || {};
    if (!Array.isArray(history) || history.length === 0 || history.length > 200) {
      return res.status(400).json({ error: 'Keine Historie vorhanden oder zu lang.' });
    }

    const sanitizedHistory = history.slice(0, 50).map(s => ({
      mode: typeof s.mode === 'string' ? s.mode.slice(0, 50) : 'unbekannt',
      durationMs: typeof s.durationMs === 'number' ? Math.min(Math.max(s.durationMs, 0), 3600000) : 0,
      wpm: typeof s.wpm === 'number' ? Math.min(Math.max(s.wpm, 0), 500) : 0,
      fillers: typeof s.fillers === 'number' ? Math.min(Math.max(s.fillers, 0), 1000) : 0,
      confidenceScore: typeof s.confidenceScore === 'number' ? Math.min(Math.max(s.confidenceScore, 0), 100) : null,
      date: typeof s.date === 'string' ? s.date.slice(0, 30) : (typeof s.timestamp === 'number' ? new Date(s.timestamp).toISOString() : new Date().toISOString())
    }));

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const isPremium = userDoc.exists && userDoc.data().isPremium === true;
    if (!(await consumeQuota(req.user.uid, isPremium, 'progress'))) {
      return res.status(429).json({ error: 'Tägliches Limit für Fortschrittsanalysen erreicht.' });
    }

    const safeProfile = profile && typeof profile === 'object' ? profile : {};
    
    // Prepare history summary
    const historySummary = sanitizedHistory.map((session, i) => {
      const date = new Date(session.date).toLocaleDateString('de-DE');
      return `Session ${i + 1} (${date}): Modus: ${session.mode}, Dauer: ${session.durationMs}ms, WPM: ${session.wpm}, Füllwörter: ${session.fillers}, Confidence Score: ${session.confidenceScore ?? '?'}`;
    }).join('\n');

    const promptText = `Du bist ein hochqualifizierter KI-Kommunikationstrainer. Der Nutzer hat mich gebeten, seinen Langzeit-Fortschritt zu analysieren.
Nutzer-Profil: Name: ${String(safeProfile.name || 'Nutzer').slice(0, 50)}, Rolle: ${String(safeProfile.role || '').slice(0, 50)}.

Hier sind die letzten Trainings-Aufzeichnungen des Nutzers:
${historySummary}

Bitte schreibe eine detaillierte, motivierende, aber sehr konkrete KI-Langzeitanalyse.
Erkenne Muster (z.B. "Du wirst immer schneller, wenn...", "Deine Füllwörter haben im Vergleich zu den ersten Sessions abgenommen").`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { 
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                insight: { type: 'STRING' },
                strengths: { type: 'ARRAY', items: { type: 'STRING' } },
                improvements: { type: 'ARRAY', items: { type: 'STRING' } }
              },
              required: ['insight', 'strengths', 'improvements']
            }
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        await refundQuota(req.user.uid, req.route.path === '/api/analyze-persona' ? 'persona' : 'progress');
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen.' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        let type = 'analyze';
        if (req.route.path === '/api/interview') type = 'interviewTurn';
        if (req.route.path === '/api/analyze-progress') type = 'progress';
        if (req.route.path === '/api/analyze-persona') type = 'persona';
        await refundQuota(req.user.uid, type);
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }

      const parsed = JSON.parse(resultText);
      if (typeof parsed.insight !== 'string' || !Array.isArray(parsed.strengths) || !Array.isArray(parsed.improvements)) {
         await refundQuota(req.user.uid, 'progress');
         return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'Schema mismatch' });
      }

      return res.status(200).json(parsed);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        let type = 'analyze';
        if (req.route.path === '/api/interview') type = 'interviewTurn';
        if (req.route.path === '/api/analyze-progress') type = 'progress';
        if (req.route.path === '/api/analyze-persona') type = 'persona';
        await refundQuota(req.user.uid, type);
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }
      console.error('AI Error (Progress):', e);
      await refundQuota(req.user.uid, 'progress');
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

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const isPremium = userDoc.exists && userDoc.data().isPremium === true;
    if (!(await consumeQuota(req.user.uid, isPremium, 'persona'))) {
      return res.status(429).json({ error: 'Tägliches Limit für Persona-Analysen erreicht.' });
    }

    const name = String(safeProfile.name || 'Nutzer').slice(0, 50);
    const age = String(safeProfile.age || 'unbekannt').slice(0, 10);
    const role = String(safeProfile.role || 'unbekannt').slice(0, 100);
    const hobbies = String(safeProfile.hobbies || 'unbekannt').slice(0, 200);

    const promptText = `Du bist ein hochqualifizierter KI-Kommunikationstrainer. Analysiere das Profil des Nutzers und erstelle eine "Kommunikations-Identität" (Persona).
Profil: Name: ${name}, Alter: ${age}, Rolle/Beruf: ${role}, Interessen: ${hobbies}.

Welcher Kommunikationstyp (Archetyp) passt zu dieser Person aufgrund ihres Berufs und ihrer Interessen? Welche rhetorischen Stärken sollte sie ausspielen und welche versteckten Fallen gibt es für sie?`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { 
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                archetype: { type: 'STRING' },
                description: { type: 'STRING' },
                superpower: { type: 'STRING' },
                trap: { type: 'STRING' }
              },
              required: ['archetype', 'description', 'superpower', 'trap']
            }
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        await refundQuota(req.user.uid, req.route.path === '/api/analyze-persona' ? 'persona' : 'progress');
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen.' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        let type = 'analyze';
        if (req.route.path === '/api/interview') type = 'interviewTurn';
        if (req.route.path === '/api/analyze-progress') type = 'progress';
        if (req.route.path === '/api/analyze-persona') type = 'persona';
        await refundQuota(req.user.uid, type);
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }

      const parsed = JSON.parse(resultText);
      if (typeof parsed.archetype !== 'string' || typeof parsed.description !== 'string' || typeof parsed.superpower !== 'string' || typeof parsed.trap !== 'string') {
        await refundQuota(req.user.uid, 'persona');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'Schema mismatch' });
      }

      return res.status(200).json(parsed);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        let type = 'analyze';
        if (req.route.path === '/api/interview') type = 'interviewTurn';
        if (req.route.path === '/api/analyze-progress') type = 'progress';
        if (req.route.path === '/api/analyze-persona') type = 'persona';
        await refundQuota(req.user.uid, type);
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }
      console.error('AI Error (Persona):', e);
      await refundQuota(req.user.uid, 'persona');
      return res.status(500).json({ error: 'Interner Fehler bei der Persona-Analyse.' });
    }
  });

  return app;
}

export async function startServer() {
  const app = createApp();
  const PORT = process.env.PORT || 3000;

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

// Start server if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
