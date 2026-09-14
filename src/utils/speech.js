import { auth } from '../lib/firebase';

export const getPacingStatus = (wpm) => {
  if (wpm < 110) return "Zu langsam";
  if (wpm > 160) return "Zu schnell";
  return "Perfekt";
};

export const countWords = (transcript) => (transcript.trim().match(/\S+/g) || []).length;
export const countFillers = (transcript) => (transcript.match(/\b(ähm|äh|also|sozusagen|quasi|halt|genau|irgendwie|eigentlich)\b/gi) || []).length;

export const CATEGORIES = [
  { id: 'interactive', title: 'Live Gespräche (Neu)' },
  { id: 'presentations', title: 'Präsentationen & Sales' },
  { id: 'career', title: 'Karriere & Arbeit' },
  { id: 'social', title: 'Alltag & Social' },
  { id: 'goals', title: 'Ziele & Motivation' },
  { id: 'politics', title: 'Politik & Debatte' },
  { id: 'languages', title: 'Fremdsprachen' }
];

export const MODES = [
  // Live
  { id: 'interview_interactive', category: 'interactive', title: 'Bewerbungsgespräch', desc: 'Die KI stellt dir Live-Fragen.', isPremium: true, color: 'from-amber-500 to-orange-600', icon: 'UserCircle2' },
  { id: 'sales_objection', category: 'interactive', title: 'Sales & Einwände', desc: 'Die KI feuert kritische Kundenfragen ab.', isPremium: true, color: 'from-rose-500 to-red-600', icon: 'ShieldAlert' },
  
  // Präsentationen & Sales
  { id: 'elevator_pitch', category: 'presentations', title: 'Elevator Pitch', desc: 'Überzeuge in 60 Sekunden.', isPremium: false, color: 'from-emerald-500 to-teal-600', icon: 'Rocket' },
  { id: 'presentation', category: 'presentations', title: 'Vorstandspräsentation', desc: 'Überzeuge das C-Level.', isPremium: true, color: 'from-blue-600 to-sky-700', icon: 'PieChart' },
  { id: 'pitch', category: 'presentations', title: 'Start-Up Pitch', desc: 'Präsentiere deine Idee vor Investoren.', isPremium: true, color: 'from-violet-500 to-purple-600', icon: 'Lightbulb' },
  { id: 'toastmasters', category: 'presentations', title: 'Spontan-Rede', desc: 'Stegreifrede ohne Vorbereitung.', isPremium: false, color: 'from-cyan-500 to-blue-600', icon: 'Mic2' },

  // Karriere
  { id: 'interview', category: 'career', title: 'HR Interview', desc: 'Die harte Bewerbungssimulation.', isPremium: false, color: 'from-blue-500 to-indigo-600', icon: 'Briefcase' },
  { id: 'negotiation', category: 'career', title: 'Gehaltsverhandlung', desc: 'Hol dir die 15 Prozent.', isPremium: true, color: 'from-indigo-600 to-violet-700', icon: 'TrendingUp' },
  { id: 'resignation', category: 'career', title: 'Kündigung einreichen', desc: 'Professionell und bestimmt gehen.', isPremium: true, color: 'from-slate-600 to-slate-800', icon: 'LogOut' },
  { id: 'conflict', category: 'career', title: 'Team Konflikt', desc: 'Löse einen Streit unter Kollegen.', isPremium: true, color: 'from-orange-500 to-red-600', icon: 'Users' },
  
  // Alltag & Social
  { id: 'impromptu', category: 'social', title: 'Freies Sprechen', desc: '60 Sekunden, ein Zufallsthema.', isPremium: false, color: 'from-amber-400 to-orange-500', icon: 'MessageCircle' },
  { id: 'dating', category: 'social', title: 'Erstes Date', desc: 'Sympathisch bleiben unter Druck.', isPremium: false, color: 'from-pink-500 to-rose-500', icon: 'Heart' },
  { id: 'wedding', category: 'social', title: 'Hochzeitsrede', desc: 'Emotional, aber nicht peinlich.', isPremium: true, color: 'from-rose-400 to-pink-600', icon: 'GlassWater' },
  { id: 'complaint', category: 'social', title: 'Reklamation', desc: 'Bleib höflich, aber bestimmt.', isPremium: false, color: 'from-stone-500 to-stone-700', icon: 'Frown' },
  { id: 'apology', category: 'social', title: 'Die Entschuldigung', desc: 'Gib einen Fehler bei Freunden zu.', isPremium: true, color: 'from-indigo-400 to-cyan-500', icon: 'UserMinus' },

  // Ziele & Motivation
  { id: 'peptalk', category: 'goals', title: 'Pep-Talk', desc: 'Motiviere dich selbst vorm Spiegel.', isPremium: false, color: 'from-yellow-400 to-orange-500', icon: 'Flame' },
  { id: 'vision', category: 'goals', title: 'Vision Pitch', desc: 'Erkläre dein größtes Lebensziel.', isPremium: true, color: 'from-emerald-400 to-teal-600', icon: 'Target' },
  { id: 'excuses', category: 'goals', title: 'Ausreden zerstören', desc: 'Warum hast du heute keinen Sport gemacht?', isPremium: true, color: 'from-red-500 to-rose-700', icon: 'Swords' },

  // Politik & Debatte
  { id: 'politics_debate', category: 'politics', title: 'Die TV-Debatte', desc: 'Verteidige deine Position sachlich.', isPremium: false, color: 'from-slate-700 to-slate-900', icon: 'Mic2' },
  { id: 'crisis', category: 'politics', title: 'Krisen-PR', desc: 'Ein Shitstorm zieht auf. Reagiere souverän.', isPremium: true, color: 'from-red-500 to-rose-700', icon: 'AlertTriangle' },
  { id: 'panel', category: 'politics', title: 'Podiumsdiskussion', desc: 'Setze dich gegen Unterbrecher durch.', isPremium: true, color: 'from-violet-600 to-indigo-800', icon: 'Users' },

  // Sprachen
  { id: 'lang_en', category: 'languages', title: 'English Business', desc: 'Smalltalk with US clients.', isPremium: false, color: 'from-emerald-500 to-teal-600', icon: 'Globe' },
  { id: 'lang_fr', category: 'languages', title: 'Parisian Café', desc: 'Commandez un croissant.', isPremium: true, color: 'from-teal-500 to-cyan-600', icon: 'Coffee' },
  { id: 'lang_es', category: 'languages', title: 'Tapas en Madrid', desc: 'Pide la cena con amigos.', isPremium: true, color: 'from-cyan-500 to-blue-500', icon: 'Utensils' }
];

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

export const computeStreak = (history) => {
  const daySet = new Set(history.map(h => new Date(h.date).toDateString()));
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

export const computeLevel = (history) => Math.min(99, Math.floor(history.length / 3) + 1);

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

  const fallback = (aiTip) => ({ ...measured, fillers: countFillers(transcript), confidenceScore: null, aiTip, isDummy: true });

  if (!transcript.trim()) {
    return fallback("Es wurde kein Text erkannt. Sprich etwas lauter oder prüfe dein Mikrofon.");
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
      const tip = response.status === 404
        ? "Kein Analyse-Server erreichbar. Die Messwerte oben sind echt, nur der KI-Tipp fehlt."
        : (errBody?.error || "Die KI-Analyse ist fehlgeschlagen. Die Messwerte oben sind echt, nur der KI-Tipp fehlt.");
      return fallback(tip);
    }

    const { fillers, confidenceScore, aiTip } = await response.json();
    return { ...measured, fillers: typeof fillers === 'number' ? fillers : countFillers(transcript), confidenceScore: confidenceScore || 0, aiTip };
  } catch (e) {
    console.error("AI Error:", e);
    return fallback("Der Analyse-Server ist nicht erreichbar. Die Messwerte oben sind echt, nur der KI-Tipp fehlt.");
  }
};
