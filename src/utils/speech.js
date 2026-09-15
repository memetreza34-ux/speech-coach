import { auth } from '../lib/firebase';

export const getPacingStatus = (wpm) => {
  if (wpm < 110) return "Zu langsam";
  if (wpm > 160) return "Zu schnell";
  return "Im Zielbereich";
};

export const countWords = (transcript) => (transcript.trim().match(/\S+/g) || []).length;
export const countFillers = (transcript) => {
  const words = transcript.match(/[\p{L}\p{N}]+/gu) || [];
  const fillers = new Set(['ähm', 'äh', 'also', 'sozusagen', 'quasi', 'halt', 'genau', 'irgendwie', 'eigentlich']);
  return words.filter(w => fillers.has(w.toLowerCase())).length;
};

export const CATEGORIES = [
  { id: 'interactive', title: 'Live Gespräche (Neu)' },
  { id: 'presentations', title: 'Präsentationen & Sales' },
  { id: 'career', title: 'Karriere & Arbeit' },
  { id: 'social', title: 'Alltag & Social' },
  { id: 'goals', title: 'Ziele & Motivation' },
  { id: 'politics', title: 'Politik & Debatte' },
  { id: 'languages', title: 'Fremdsprachen' }
];

import { MODES } from '../shared/modes.js';
export { MODES };

export const DAILY_CHALLENGES = [
  { id: 'daily', title: 'Ohne "Ähm"', desc: 'Erkläre ein komplexes Thema in unter 60 Sekunden ohne Füllwörter.', prompt: 'Erkläre einem 10-Jährigen, wie das Internet funktioniert. Rede 60 Sekunden lang ohne "ähm" oder "also".' },
  { id: 'daily', title: 'Der Unterbrecher', desc: 'Souverän im Meeting dazwischengrätschen.', prompt: 'Ein Kollege redet seit 10 Minuten ohne Punkt und Komma im Meeting. Unterbrich ihn höflich, aber bestimmt.' },
  { id: 'daily', title: 'Schlechte News', desc: 'Überbringe eine schwierige Nachricht.', prompt: 'Du musst einem guten Freund absagen, der sich riesig auf euren gemeinsamen Urlaub gefreut hat.' },
  { id: 'daily', title: 'Spontan-Pitch', desc: 'Verkaufe etwas Verrücktes.', prompt: 'Versuche, mir in 60 Sekunden einen kaputten Regenschirm als das Must-Have des Sommers zu verkaufen.' },
  { id: 'daily', title: 'Die Gehaltserhöhung', desc: 'Warum verdienst du mehr?', prompt: 'Dein Chef hat gerade 5 Minuten lang erklärt, warum die Firma sparen muss. Überzeuge ihn in 60 Sekunden, warum du trotzdem 10% mehr Gehalt brauchst.' }
];

export const getDailyChallenge = () => {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
};

export const modeTitle = (id) => {
  if (id === 'daily') return getDailyChallenge().title;
  return MODES.find(m => m.id === id)?.title || id;
};

export const PROMPTS = {
  elevator_pitch: "Ein CEO steht mit dir im Aufzug. Pitche ihm dich oder deine Idee in exakt 60 Sekunden.",
  toastmasters: "Zieh ein fiktives Thema aus dem Hut und halte eine mitreißende 2-Minuten-Rede.",
  sales_objection: "Du führst ein interaktives Verkaufsgespräch. Der Kunde zweifelt am Preis, am Nutzen und am Aufwand der Einführung. Reagiere dynamisch auf die Argumente, bleibe nutzenorientiert und versuche den Abschluss.",
  impromptu: "Rede 60 Sekunden über: „Warum das Internet Fluch und Segen zugleich ist.“",
  interview: "HR-Manager: „Erzählen Sie mir von einem großen Fehler in Ihrer Karriere.“",
  interview_interactive: "Du führst ein realistisches Bewerbungsgespräch. Stelle dich kurz als HR-Manager vor, stelle nacheinander Fragen zu Motivation, Erfahrung, Stärken, Schwächen, Konflikten und konkreten STAR-Situationen. Stelle immer nur EINE Frage gleichzeitig und reagiere authentisch auf die Antworten.",
  dating: "Dein Date: „Ich liebe Abenteuer. Was war das Verrückteste, das du je gemacht hast?“",
  negotiation: "Chef: „Das Budget ist eng. Warum sollten wir Ihnen 15 % mehr zahlen?“",
  pitch: "Investor: „Es gibt Dutzende ähnliche Apps. Warum wird genau Ihre erfolgreich?“",
  resignation: "Chef: „Sie wollen kündigen? Warum? Wir dachten, Sie sind glücklich hier.“",
  conflict: "Kollege: „Du hast meine Idee im Meeting als deine eigene verkauft. Was soll das?“",
  presentation: "Vorstand: „Die Zahlen sind im Sinkflug. Wie wollen Sie das im nächsten Quartal drehen?“",
  wedding: "Alle Gäste schauen dich an. Halte eine kurze, rührende Rede auf das Brautpaar.",
  complaint: "Kellner: „Das Essen ist kalt? Das kann gar nicht sein, es kommt direkt aus der Küche.“",
  apology: "Freund: „Du hast mich gestern vor allen Leuten bloßgestellt. Das war nicht cool.“",
  peptalk: "Du bist nervös vor einem großen Auftritt. Rede dir selbst 60 Sekunden lang Mut ein.",
  vision: "Ein Fremder fragt: „Was ist dein größtes Ziel für die nächsten 5 Jahre und warum?“",
  excuses: "Dein innerer Schweinehund sagt: „Es regnet, lass uns auf der Couch bleiben.“ Antworte ihm.",
  politics_debate: "Moderator: „Ihre Gegner behaupten, Ihre Pläne seien unbezahlbar. Was antworten Sie?“",
  crisis: "Journalist: „Ein fehlerhaftes Update hat Daten gelöscht. Wie erklären Sie das Ihren Kunden?“",
  panel: "Diskussionspartner fällt dir ins Wort: „Das ist doch völliger Unsinn, was Sie da sagen!“",
  lang_en: "Client: „We love the proposal, but the timeline seems very aggressive. Can we discuss this?“",
  lang_fr: "Serveur: „Bonjour! Que désirez-vous manger aujourd'hui?“",
  lang_es: "Camarero: „¡Hola! ¿Qué van a tomar para cenar?“"
};

export const getPromptForMode = (id) => {
  if (id === 'daily') return getDailyChallenge().prompt;
  return PROMPTS[id] || "Sprich frei über ein Thema deiner Wahl.";
};

export const getLocaleForMode = (id) => {
  if (id === 'lang_en') return 'en-US';
  if (id === 'lang_fr') return 'fr-FR';
  if (id === 'lang_es') return 'es-ES';
  return 'de-DE';
};

export const getSessionDate = (session) => {
  if (session.createdAt) {
    return session.createdAt.toDate ? session.createdAt.toDate() : new Date(session.createdAt);
  }
  if (session.timestamp) {
    return session.timestamp.toDate ? session.timestamp.toDate() : new Date(session.timestamp);
  }
  return new Date(session.date);
};

export const computeStreak = (history) => {
  if (!Array.isArray(history)) return 0;
  const daySet = new Set(history.map(h => getSessionDate(h).toDateString()));
  let streak = 0;
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  let cursor = new Date();
  if (!daySet.has(today.toDateString())) {
    if (daySet.has(yesterday.toDateString())) {
      cursor = yesterday;
    } else {
      return 0;
    }
  }

  while (daySet.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const computeLevel = (history) => {
  if (!Array.isArray(history)) return 1;
  return Math.min(99, Math.floor(history.length / 3) + 1);
};

export const analyzeTranscript = async (recording, mode, profile) => {
  const { transcript, durationMs, pauseCount, longestPauseMs, speakingRatio, dynamics, frames } = recording;
  const minutes = Math.max(durationMs / 60000, 1 / 60);
  
  const isCustom = mode.startsWith('custom_');
  const customModeData = isCustom ? profile?.customModes?.find(m => m.id === mode) : null;
  const promptContext = isCustom ? customModeData?.prompt : getPromptForMode(mode);

  const measured = {
    wpm: Math.round(countWords(transcript) / minutes),
    pauseCount,
    longestPauseMs,
    speakingRatio,
    dynamics
  };
  measured.pacingStatus = getPacingStatus(measured.wpm);

  const fallback = (errorMessage, status = 'server_error') => ({ 
    ...measured, 
    fillers: countFillers(transcript), 
    confidenceScore: null, 
    aiTip: null, 
    systemMessage: errorMessage,
    isDummy: true, 
    isQuotaError: status === 'quota_exceeded',
    aiStatus: status
  });

  if (!transcript.trim()) {
    return fallback("Es wurde kein Text erkannt. Sprich etwas lauter oder prüfe dein Mikrofon.", "not_available");
  }

  try {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ transcript, mode, profile, metrics: measured, customPrompt: promptContext, frames })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      console.error("Analyse-Server Fehler:", response.status, errBody);
      if (response.status === 429) return fallback("Dein tägliches KI-Limit ist erreicht.", "quota_exceeded");
      if (response.status === 504) return fallback("Zeitüberschreitung bei der KI-Analyse.", "timeout");
      if (response.status === 502) return fallback("Ungültige Antwort von der KI erhalten.", "invalid_response");
      
      const tip = errBody?.error || "Die KI-Analyse ist fehlgeschlagen. Die Messwerte oben sind echt, nur der KI-Tipp fehlt.";
      return fallback(tip, "server_error");
    }

    const { fillers, confidenceScore, aiTip } = await response.json();
    return { 
      ...measured, 
      fillers: typeof fillers === 'number' ? fillers : countFillers(transcript), 
      confidenceScore: typeof confidenceScore === 'number' ? confidenceScore : null, 
      aiTip,
      aiStatus: 'success'
    };
  } catch (e) {
    console.error("AI Error:", e);
    return fallback("Der Analyse-Server ist nicht erreichbar. Die Messwerte oben sind echt, nur der KI-Tipp fehlt.", "server_error");
  }
};
