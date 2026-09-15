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

  // Quota Reset Documention: Quotas reset at 00:00 UTC.
  // A simple ISO string date is used to represent 'today'.
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

  const safeRefundQuota = async (uid, type) => {
    try {
      await refundQuota(uid, type);
    } catch (e) {
      console.error(`Error refunding quota for user ${uid}, type ${type}:`, e);
    }
  };

  app.use(express.json({ limit: '2mb' })); // Reduced from 10mb for better security
  
  // Release Health Endpoint
  app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api/', apiLimiter);
  app.use('/api/', requireAuth);

  app.get('/api/usage', async (req, res) => {
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      const isPremium = userDoc.exists && userDoc.data().isPremium === true;
      const customModesCount = userDoc.exists ? (userDoc.data().customModes || []).length : 0;
      
      const limits = {
        analyze: isPremium ? getPositiveIntEnv('PRO_DAILY_ANALYZE', 25) : getPositiveIntEnv('FREE_DAILY_ANALYZE', 5),
        interviewTurn: isPremium ? getPositiveIntEnv('PRO_DAILY_INTERVIEW_TURNS', 50) : 0,
        progress: isPremium ? getPositiveIntEnv('PRO_DAILY_PROGRESS', 5) : getPositiveIntEnv('FREE_DAILY_PROGRESS', 1),
        persona: isPremium ? getPositiveIntEnv('PRO_DAILY_PERSONA', 10) : getPositiveIntEnv('FREE_DAILY_PERSONA', 2),
        customModes: isPremium ? getPositiveIntEnv('PRO_CUSTOM_MODES', 20) : getPositiveIntEnv('FREE_CUSTOM_MODES', 1)
      };

      const today = new Date().toISOString().split('T')[0];
      const usageDoc = await db.collection('users').doc(req.user.uid).collection('usage').doc(today).get();
      const usage = usageDoc.exists ? usageDoc.data() : {};

      return res.status(200).json({
        plan: isPremium ? 'PRO' : 'FREE',
        usage: {
          analyze: usage.analyze || 0,
          interviewTurn: usage.interviewTurn || 0,
          progress: usage.progress || 0,
          persona: usage.persona || 0,
          customModes: customModesCount
        },
        limits
      });
    } catch (e) {
      console.error('Usage endpoint error:', e);
      return res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  });

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
        
        const maxModes = isPremium ? getPositiveIntEnv('PRO_CUSTOM_MODES', 20) : getPositiveIntEnv('FREE_CUSTOM_MODES', 1);
        
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
    if (!apiKey) return res.status(500).json({ error: 'Server ist nicht konfiguriert (GEMINI_API_KEY fehlt).' });

    const { transcript, mode, profile, metrics, customPrompt, frames } = req.body || {};
    
    // Server-side Premium Check
    if (!(await verifyPremiumMode(req, res, mode))) {
      return res.status(403).json({ error: 'Dieser Modus erfordert ein Premium-Abonnement.' });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const isPremium = userDoc.exists && userDoc.data().isPremium === true;

    // VALIDATION BEFORE QUOTA
    if (typeof transcript !== 'string' || !transcript.trim() || transcript.length > 10000) {
      return res.status(400).json({ error: 'Transkript fehlt, ist leer oder zu lang.' });
    }
    if (frames && (!Array.isArray(frames) || frames.length > 5)) {
      return res.status(400).json({ error: 'Zu viele Frames (max 5).' });
    }
    if (frames) {
      if (!isPremium) return res.status(403).json({ error: 'Kamera-Feedback erfordert ein Premium-Abonnement.' });
      let totalSize = 0;
      for (const frame of frames) {
        if (typeof frame !== 'string' || !frame.startsWith('data:image/jpeg;base64,')) return res.status(400).json({ error: 'Ungültiges Frame-Format.' });
        totalSize += frame.length;
        if (frame.length > 500000) return res.status(400).json({ error: 'Ein Frame ist zu groß.' });
      }
      if (totalSize > 2000000) return res.status(400).json({ error: 'Frames überschreiten das Gesamt-Limit von 2MB.' });
    }

    const safeProfile = profile && typeof profile === 'object' ? profile : {};
    const profileName = typeof safeProfile.name === 'string' ? safeProfile.name.slice(0, 100) : 'Nutzer';
    const profileRole = typeof safeProfile.role === 'string' ? safeProfile.role.slice(0, 100) : '';
    const profileAge = typeof safeProfile.age === 'string' ? safeProfile.age.slice(0, 10) : '';
    const profileHobbies = typeof safeProfile.hobbies === 'string' ? safeProfile.hobbies.slice(0, 300) : '';

    const safeTranscript = transcript.slice(0, 10000);
    const m = typeof metrics === 'object' && metrics ? metrics : {};
    
    if (m.wpm !== undefined && (typeof m.wpm !== 'number' || m.wpm < 0 || m.wpm > 500)) return res.status(400).json({ error: 'Ungültiger wpm-Wert.' });
    if (m.pauseCount !== undefined && (typeof m.pauseCount !== 'number' || m.pauseCount < 0 || m.pauseCount > 5000)) return res.status(400).json({ error: 'Ungültiger pauseCount-Wert.' });
    if (m.longestPauseMs !== undefined && (typeof m.longestPauseMs !== 'number' || m.longestPauseMs < 0 || (m.durationMs && m.longestPauseMs > m.durationMs))) return res.status(400).json({ error: 'Ungültiger longestPauseMs-Wert.' });
    if (m.speakingRatio !== undefined && (typeof m.speakingRatio !== 'number' || m.speakingRatio < 0 || m.speakingRatio > 100)) return res.status(400).json({ error: 'Ungültiger speakingRatio-Wert.' });
    if (m.dynamics !== undefined && (typeof m.dynamics !== 'number' || m.dynamics < 0 || m.dynamics > 500)) return res.status(400).json({ error: 'Ungültiger dynamics-Wert.' });
    if (m.durationMs !== undefined && (typeof m.durationMs !== 'number' || m.durationMs < 0 || m.durationMs > 3600000)) return res.status(400).json({ error: 'Ungültiger durationMs-Wert.' });

    // CONSUME QUOTA AFTER ALL VALIDATIONS
    if (!(await consumeQuota(req.user.uid, isPremium, 'analyze'))) {
      return res.status(429).json({ error: 'Tägliches Limit für Aufnahmen erreicht.' });
    }

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
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen (Upstream-Fehler).' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert (evtl. Sicherheitsfilter).' });
      }

      let parsed;
      try {
        parsed = JSON.parse(resultText);
      } catch (e) {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'Ungültiges JSON-Format' });
      }
      
      // Strict Output Validation
      if (typeof parsed.fillers !== 'number' || parsed.fillers < 0) {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'fillers missing or invalid' });
      }
      if (parsed.confidenceScore !== null && (typeof parsed.confidenceScore !== 'number' || parsed.confidenceScore < 0 || parsed.confidenceScore > 100)) {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'confidenceScore invalid' });
      }
      if (!parsed.aiTip || typeof parsed.aiTip !== 'object') {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'aiTip missing or invalid' });
      }
      if (typeof parsed.aiTip.summary !== 'string') {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'summary missing' });
      }
      if (typeof parsed.aiTip.strengths !== 'string') {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'strengths missing' });
      }
      if (typeof parsed.aiTip.improvements !== 'string') {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'improvements missing' });
      }
      if (typeof parsed.aiTip.actionTip !== 'string') {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'actionTip missing' });
      }
      if (parsed.aiTip.bodyLanguage !== null && parsed.aiTip.bodyLanguage !== undefined && typeof parsed.aiTip.bodyLanguage !== 'string') {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'bodyLanguage invalid' });
      }

      return res.status(200).json(parsed);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        await safeRefundQuota(req.user.uid, 'analyze');
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }
      console.error('AI Error:', e);
      await safeRefundQuota(req.user.uid, 'analyze');
      return res.status(500).json({ error: 'Interner Fehler bei der KI-Analyse.' });
    }
  });

  // API Route for Interactive Interview Mode
  app.post('/api/interview', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server ist nicht konfiguriert.' });

    const { mode, messages, profile, customPrompt, frames } = req.body || {};
    
    // Server-side Premium Check
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().isPremium !== true) {
      return res.status(403).json({ error: 'Live-Interviews erfordern ein Premium-Abonnement.' });
    }

    // VALIDATION BEFORE QUOTA
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) return res.status(400).json({ error: 'Messages ungültig oder zu lang.' });
    
    for (const msg of messages) {
      if (msg.role !== 'user' && msg.role !== 'model') return res.status(400).json({ error: 'Ungültige role.' });
      if (typeof msg.text !== 'string' || msg.text.length > 2000) return res.status(400).json({ error: 'Ungültiger text.' });
    }

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

    // CONSUME QUOTA AFTER ALL VALIDATIONS
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

Profil des Bewerbers: Name: ${profileName}, Rolle: ${profileRole}, Alter: ${profileAge}, Hobbys: ${profileHobbies}.

Deine Aufgabe:
- Reagiere auf die Antwort des Bewerbers.
- Stelle danach EINE gute, realistische Anschlussfrage oder eine neue fachliche/persönliche Frage, die zur Rolle passt.
- Gib KEIN direktes Feedback im "interviewerSpeech" Feld - das ist das was du SACHLICH im Gespräch sagst.
- Gib zusätzlich ein kurzes konstruktives "feedback" (1-2 Sätze) für den Nutzer (unsichtbar für das Gespräch, als Tipp).
- Beende das Interview selbstständig nach etwa 5-6 Fragen ("isFinished": true), und verabschiede dich freundlich.

Gib immer strikt dieses JSON Format zurück:
{
  "interviewerSpeech": "Dein gesprochener Text als Interviewer",
  "feedback": "Dein geheimer Coach-Tipp zum letzten Zug des Nutzers",
  "isFinished": boolean
}`;

    const formattedMessages = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    if (frames && frames.length > 0) {
      const lastMessage = formattedMessages[formattedMessages.length - 1];
      if (lastMessage.role === 'user') {
        frames.forEach(imgBase64 => {
          lastMessage.parts.push({
            inlineData: { mimeType: "image/jpeg", data: imgBase64.replace(/^data:image\/\w+;base64,/, "") }
          });
        });
        lastMessage.parts.push({ text: "\nHinweis: Oben siehst du Bilder des Nutzers. Beziehe Körpersprache (z.B. Blickkontakt, Haltung) kurz in dein 'feedback' Feld ein." });
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: formattedMessages,
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
        await safeRefundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen (Upstream-Fehler).' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        await safeRefundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }

      let parsed;
      try {
        parsed = JSON.parse(resultText);
      } catch (e) {
        await safeRefundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'Ungültiges JSON-Format' });
      }

      // Validate output
      if (typeof parsed.interviewerSpeech !== 'string' || !parsed.interviewerSpeech.trim()) {
        await safeRefundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'interviewerSpeech missing' });
      }
      if (typeof parsed.feedback !== 'string') {
        await safeRefundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'feedback missing' });
      }
      if (typeof parsed.isFinished !== 'boolean') {
        await safeRefundQuota(req.user.uid, 'interviewTurn');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'isFinished missing' });
      }

      return res.status(200).json(parsed);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        await safeRefundQuota(req.user.uid, 'interviewTurn');
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }
      console.error('AI Error (Interview):', e);
      await safeRefundQuota(req.user.uid, 'interviewTurn');
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
    const timeout = setTimeout(() => controller.abort(), 20000);

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
                insight: { type: 'STRING', description: 'Ein kurzer motivierender Hauptgedanke oder Erkenntnis (1-2 Sätze)' },
                strengths: {
                  type: 'ARRAY',
                  items: { type: 'STRING' }
                },
                improvements: {
                  type: 'ARRAY',
                  items: { type: 'STRING' }
                }
              },
              required: ['insight', 'strengths', 'improvements']
            }
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        await safeRefundQuota(req.user.uid, 'progress');
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen (Upstream-Fehler).' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        await safeRefundQuota(req.user.uid, 'progress');
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }

      let parsed;
      try {
        parsed = JSON.parse(resultText);
      } catch (e) {
        await safeRefundQuota(req.user.uid, 'progress');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'Ungültiges JSON-Format' });
      }
      
      // Strict Array Check
      const isStringArray = (arr) => Array.isArray(arr) && arr.length <= 3 && arr.every(s => typeof s === 'string' && s.trim() !== '' && s.length < 500);

      if (typeof parsed.insight !== 'string' || !parsed.insight.trim() || parsed.insight.length > 2000) {
         await safeRefundQuota(req.user.uid, 'progress');
         return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'invalid insight' });
      }
      if (!isStringArray(parsed.strengths)) {
         await safeRefundQuota(req.user.uid, 'progress');
         return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'invalid strengths' });
      }
      if (!isStringArray(parsed.improvements)) {
         await safeRefundQuota(req.user.uid, 'progress');
         return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'invalid improvements' });
      }

      return res.status(200).json(parsed);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        await safeRefundQuota(req.user.uid, 'progress');
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }
      console.error('AI Error (Progress):', e);
      await safeRefundQuota(req.user.uid, 'progress');
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

    const promptText = `Analysiere das Profil dieses Nutzers und erstelle ein humorvolles, aber zutreffendes "Speaker-Archetyp" Profil.
Name: ${String(safeProfile.name || '').slice(0, 50)}
Alter: ${String(safeProfile.age || '').slice(0, 20)}
Rolle: ${String(safeProfile.role || '').slice(0, 100)}
Hobbys: ${String(safeProfile.hobbies || '').slice(0, 500)}

Gib als JSON zurück:
archetype (Kurzer, cooler Name für diesen Rednertyp, z.B. "Der analytische Visionär")
description (1-2 Sätze Beschreibung, wie dieser Typ üblicherweise spricht)
superpower (Was ist vermutlich die größte Stärke dieses Typs?)
trap (In welche Kommunikations-Falle tappt dieser Typ am häufigsten?)`;

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
        await safeRefundQuota(req.user.uid, 'persona');
        return res.status(502).json({ error: 'KI-Analyse fehlgeschlagen (Upstream-Fehler).' });
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        await safeRefundQuota(req.user.uid, 'persona');
        return res.status(502).json({ error: 'Die KI hat keine verwertbare Antwort geliefert.' });
      }

      let parsed;
      try {
        parsed = JSON.parse(resultText);
      } catch (e) {
        await safeRefundQuota(req.user.uid, 'persona');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'Ungültiges JSON-Format' });
      }

      const isValidString = (s) => typeof s === 'string' && s.trim() !== '' && s.length < 500;
      
      if (!isValidString(parsed.archetype) || !isValidString(parsed.description) || !isValidString(parsed.superpower) || !isValidString(parsed.trap)) {
        await safeRefundQuota(req.user.uid, 'persona');
        return res.status(502).json({ error: 'INVALID_AI_RESPONSE', details: 'Schema mismatch or fields too long/empty' });
      }

      return res.status(200).json(parsed);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        await safeRefundQuota(req.user.uid, 'persona');
        return res.status(504).json({ error: 'Zeitüberschreitung bei der KI-Analyse.' });
      }
      console.error('AI Error (Persona):', e);
      await safeRefundQuota(req.user.uid, 'persona');
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
