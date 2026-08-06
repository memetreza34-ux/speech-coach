export const DIFFICULTIES = [
  {
    id: 'supportive',
    title: 'Unterstützend',
    description: 'Freundliche Rückfragen und viel Orientierung.',
  },
  {
    id: 'realistic',
    title: 'Realistisch',
    description: 'Direkte Rückfragen wie in einer echten Situation.',
  },
  {
    id: 'challenging',
    title: 'Herausfordernd',
    description: 'Kritische Einwände, Zeitdruck und Gegenpositionen.',
  },
]

export const ROUND_OPTIONS = [3, 5]

export const COACH_MODES = [
  {
    id: 'free-speaking',
    title: 'Freies Sprechen',
    description: 'Gedanken spontan ordnen und präzise ausdrücken.',
    persona: 'Rhetorik-Coach',
    topics: [
      'Leben ohne Smartphone',
      'Stadt oder Land?',
      'Eine unterschätzte Fähigkeit',
      'Was bedeutet Erfolg?',
      'Eine Erfindung für die Zukunft',
      'Warum Pausen wichtig sind',
    ],
    openings: [
      'Starte mit deiner wichtigsten Aussage. Danach begründest du sie mit einem konkreten Beispiel.',
      'Du hast keine Vorbereitungszeit: Beginne direkt und führe deinen Gedanken nachvollziehbar aus.',
    ],
    followUps: [
      'Was ist dein stärkstes konkretes Beispiel dafür?',
      'Welche Gegenposition könnte jemand vertreten?',
      'Fasse deinen wichtigsten Gedanken jetzt in einem einzigen Satz zusammen.',
      'Welche praktische Konsequenz folgt aus deiner Aussage?',
    ],
  },
  {
    id: 'argumentation',
    title: 'Argumentation und Debatte',
    description: 'Positionen begründen, Einwände behandeln und überzeugen.',
    persona: 'kritischer Debattengegner',
    topics: [
      'Kostenloser öffentlicher Nahverkehr',
      'Vier-Tage-Woche',
      'Handyverbot an Schulen',
      'KI im Unterricht',
      'Wahlrecht ab 16',
      'Soziale Medien für Minderjährige begrenzen',
    ],
    openings: [
      'Beziehe eine klare Position und nenne dein stärkstes Argument.',
      'Ich vertrete die Gegenseite. Überzeuge mich mit einer klaren Begründung.',
    ],
    followUps: [
      'Das klingt plausibel, aber welche Nachteile hätte deine Lösung?',
      'Welche Belege oder nachvollziehbaren Beispiele stützen deine Aussage?',
      'Warum ist das Gegenargument aus deiner Sicht weniger überzeugend?',
      'Wo würdest du einen fairen Kompromiss ziehen?',
    ],
  },
  {
    id: 'explaining',
    title: 'Verständlich erklären',
    description: 'Komplexe Inhalte für verschiedene Zielgruppen vereinfachen.',
    persona: 'neugieriger Anfänger',
    topics: [
      'Wie funktioniert ein RCD?',
      'Was ist künstliche Intelligenz?',
      'Warum brauchen wir Schlaf?',
      'Inflation einfach erklärt',
      'Wie entsteht elektrischer Strom?',
      'Warum ist Datenschutz wichtig?',
    ],
    openings: [
      'Erkläre mir das so, als hätte ich keinerlei Vorwissen. Nutze ein einfaches Beispiel.',
      'Beginne mit dem Grundprinzip und vermeide unnötige Fachbegriffe.',
    ],
    followUps: [
      'Das war noch etwas abstrakt. Kannst du ein Alltagsbeispiel nennen?',
      'Welcher Teil wird von Anfängern am häufigsten falsch verstanden?',
      'Erkläre denselben Punkt jetzt in höchstens zwei Sätzen.',
      'Welche Analogie würde das Prinzip besonders verständlich machen?',
    ],
  },
  {
    id: 'interview',
    title: 'Bewerbungsgespräch',
    description: 'Konkrete, glaubwürdige und strukturierte Antworten trainieren.',
    persona: 'HR-Manager',
    topics: [
      'Erzählen Sie etwas über sich',
      'Warum möchten Sie bei uns arbeiten?',
      'Eine Situation unter Zeitdruck',
      'Ein eigener Fehler und die Lernwirkung',
      'Stärken und Schwächen',
      'Ein Konflikt im Team',
    ],
    openings: [
      'Guten Tag. Beantworten Sie die Frage bitte konkret und mit einem nachvollziehbaren Beispiel.',
      'Ich achte besonders darauf, was Sie selbst getan und erreicht haben. Bitte beginnen Sie.',
    ],
    followUps: [
      'Was genau war dabei Ihr persönlicher Anteil?',
      'Welches messbare oder sichtbare Ergebnis entstand daraus?',
      'Was würden Sie heute in derselben Situation anders machen?',
      'Warum ist dieses Beispiel für die angestrebte Stelle relevant?',
    ],
  },
  {
    id: 'difficult-conversations',
    title: 'Schwierige Gespräche',
    description: 'Grenzen setzen, Kritik äußern und Konflikte ruhig lösen.',
    persona: 'direktes Gegenüber',
    topics: [
      'Ein Kollege hält Absprachen nicht ein',
      'Kritik ruhig annehmen',
      'Eine zusätzliche Aufgabe ablehnen',
      'Einen eigenen Fehler melden',
      'Ein unzufriedener Kunde',
      'Eine persönliche Grenze setzen',
    ],
    openings: [
      'Ich reagiere realistisch auf deine Aussage. Sprich das Problem direkt, aber respektvoll an.',
      'Formuliere zuerst deine Beobachtung, dann die Auswirkung und schließlich deine konkrete Bitte.',
    ],
    followUps: [
      'Ich sehe das anders. Warum soll ausgerechnet ich etwas ändern?',
      'Das klingt für mich wie ein Vorwurf. Was genau möchtest du erreichen?',
      'Welche konkrete Lösung schlägst du jetzt vor?',
      'Was passiert, wenn wir keine gemeinsame Lösung finden?',
    ],
  },
  {
    id: 'presentation',
    title: 'Präsentieren und Pitchen',
    description: 'Starke Einstiege, klare Kernaussagen und sichere Rückfragen.',
    persona: 'kritisches Publikum',
    topics: [
      'Ein Verbesserungsvorschlag am Arbeitsplatz',
      'Ein eigenes Projekt vorstellen',
      'Sicherheit am Arbeitsplatz',
      'Eine App-Idee pitchen',
      'Ein technisches Thema präsentieren',
      'Ein Produkt in 60 Sekunden vorstellen',
    ],
    openings: [
      'Beginne mit einem Einstieg, der sofort zeigt, warum das Thema für dein Publikum relevant ist.',
      'Präsentiere Problem, Lösung und Nutzen in einer klaren Reihenfolge.',
    ],
    followUps: [
      'Was ist die eine Botschaft, die das Publikum behalten soll?',
      'Welchen konkreten Nutzen hat dein Vorschlag?',
      'Was wäre der stärkste Einwand gegen deine Präsentation?',
      'Beende deine Präsentation mit einem klaren nächsten Schritt.',
    ],
  },
]

export const getRandomItem = (items, excluded = '') => {
  const available = items.filter((item) => item !== excluded)
  const source = available.length ? available : items
  return source[Math.floor(Math.random() * source.length)]
}

export const createOpeningMessage = ({ mode, topic, difficulty }) => {
  const introduction = getRandomItem(mode.openings)
  const pressure = difficulty.id === 'challenging'
    ? ' Ich werde kritisch nachfragen und unklare Aussagen nicht durchgehen lassen.'
    : difficulty.id === 'supportive'
      ? ' Ich helfe dir dabei, deine Antwort Schritt für Schritt zu verbessern.'
      : ' Ich reagiere so, wie es in einer realistischen Situation zu erwarten wäre.'

  return `${mode.persona}: Thema „${topic}“. ${introduction}${pressure}`
}
