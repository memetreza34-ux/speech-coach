// Szenario-Texte liegen hier statt im Client, damit auch der Server sie kennt:
// /api/analyze nimmt den Text selbst aus dieser Liste und vertraut nicht dem Browser.

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
  lang_es: "Camarero: „¡Hola! ¿Qué van a tomar para cenar?“",
  
  conflict_resolution: "Du führst ein schwieriges Gespräch. Die KI ist ein Kollege, der extrem wütend ist, weil du angeblich seine Idee geklaut hast. Beruhige ihn und löse den Konflikt.",
  storytelling: "Erzähle in 60 Sekunden eine fesselnde Geschichte aus deiner Jugend, die dein Leben geprägt hat. Nutze die Struktur der Heldenreise.",
  feedback_review: "Dein Chef fragt: 'Wie schätzen Sie Ihre eigene Leistung im letzten Jahr ein?'",
  smalltalk: "Du stehst auf einem Networking-Event am Buffet. Eine unbekannte Person stellt sich neben dich. Brich das Eis in 60 Sekunden.",
  habit_pitch: "Erkläre deinem zukünftigen Ich, warum du ab heute jeden Tag 30 Minuten lesen wirst.",
  townhall: "Du stehst vor der Belegschaft. Jemand ruft: 'Die Boni der Vorstände steigen, aber wir bekommen keine Gehaltserhöhung!' Antworte souverän.",
  lang_it: "Cameriere: 'Buonasera! Avete già scelto il vino e la pasta?'",

};

export const getPromptForMode = (id) => {
  if (id === 'daily') return getDailyChallenge().prompt;
  return PROMPTS[id] || "Sprich frei über ein Thema deiner Wahl.";
};
