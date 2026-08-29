export const TEAM_ROUND_OPTIONS = [4, 6]

export const TEAM_SCENARIOS = [
  {
    id: 'team-meeting',
    title: 'Kritisches Team-Meeting',
    description: 'Vertrete einen Vorschlag vor Teamleitung und kritischen Kollegen.',
    topics: [
      'Neue Arbeitsabläufe einführen',
      'Schichtübergabe verbessern',
      'Interne Kommunikation vereinfachen',
      'Mehr Zeit für Qualitätskontrollen',
      'Eine neue Software im Team einführen',
      'Weiterbildungsbudget erhöhen',
    ],
    participants: [
      { id: 'lead', name: 'Frau Wagner', role: 'Teamleitung', stance: 'entscheidungsorientiert', tone: 'ruhig und direkt' },
      { id: 'skeptic', name: 'Herr Becker', role: 'kritischer Kollege', stance: 'skeptisch gegenüber zusätzlichem Aufwand', tone: 'sachlich kritisch' },
      { id: 'pragmatist', name: 'Frau Yilmaz', role: 'erfahrene Kollegin', stance: 'offen, verlangt aber konkrete Umsetzung', tone: 'pragmatisch' },
    ],
    opening: 'Du stellst dem Team deinen Vorschlag vor. Beginne mit Problem, Lösung und dem wichtigsten Nutzen in höchstens drei klaren Punkten.',
  },
  {
    id: 'oral-exam',
    title: 'Mündliche Prüfung',
    description: 'Beantworte Fachfragen vor zwei Prüfern mit unterschiedlichem Fokus.',
    topics: [
      'Sicheres Arbeiten an elektrischen Anlagen',
      'RCD und Schutzmaßnahmen erklären',
      'Stern-Dreieck-Anlauf erklären',
      'Fehlersuche in einer Steuerung',
      'Erstinbetriebnahme einer Anlage',
      'Netzformen und Schutzleiter erklären',
    ],
    participants: [
      { id: 'examiner-tech', name: 'Herr König', role: 'Fachprüfer', stance: 'achtet auf technische Genauigkeit', tone: 'präzise und nüchtern' },
      { id: 'examiner-practice', name: 'Frau Richter', role: 'Praxisprüferin', stance: 'fragt nach sicherem praktischem Vorgehen', tone: 'konkret und prüfungsnah' },
      { id: 'chair', name: 'Herr Neumann', role: 'Prüfungsvorsitz', stance: 'achtet auf verständliche und strukturierte Antworten', tone: 'neutral' },
    ],
    opening: 'Die Prüfung beginnt. Erkläre das Thema zunächst so, als würdest du einem neuen Auszubildenden das Grundprinzip und das sichere Vorgehen vermitteln.',
  },
  {
    id: 'project-pitch',
    title: 'Projekt-Pitch vor Entscheiderkreis',
    description: 'Überzeuge Technik, Finanzen und Nutzerperspektive gleichzeitig.',
    topics: [
      'Eine neue App-Idee',
      'Automatisierung eines Arbeitsprozesses',
      'Ein internes KI-Werkzeug',
      'Digitale Dokumentation statt Papier',
      'Ein neues Sicherheitskonzept',
      'Ein Verbesserungsprojekt im Betrieb',
    ],
    participants: [
      { id: 'finance', name: 'Frau Sommer', role: 'Finanzverantwortliche', stance: 'achtet auf Kosten und messbaren Nutzen', tone: 'zahlenorientiert' },
      { id: 'tech', name: 'Herr Brandt', role: 'Technikverantwortlicher', stance: 'prüft Machbarkeit und Risiken', tone: 'analytisch' },
      { id: 'user', name: 'Frau Hoffmann', role: 'Nutzervertretung', stance: 'achtet auf Einfachheit und echten Alltagseffekt', tone: 'direkt und praxisnah' },
    ],
    opening: 'Du hast den Entscheiderkreis vor dir. Stelle zuerst Problem, Lösung und konkreten Nutzen vor. Vermeide allgemeine Versprechen.',
  },
  {
    id: 'conflict-round',
    title: 'Konfliktrunde im Team',
    description: 'Bleibe klar, ruhig und lösungsorientiert zwischen mehreren Interessen.',
    topics: [
      'Aufgaben werden unfair verteilt',
      'Absprachen werden wiederholt nicht eingehalten',
      'Schichtwechsel führt zu Informationsverlust',
      'Ein Fehler wurde gegenseitig zugeschoben',
      'Unterschiedliche Vorstellungen zur Arbeitsqualität',
      'Kurzfristige Mehrarbeit sorgt für Streit',
    ],
    participants: [
      { id: 'colleague-a', name: 'Herr Lorenz', role: 'betroffener Kollege', stance: 'fühlt sich unfair behandelt', tone: 'angespannt, aber respektvoll' },
      { id: 'colleague-b', name: 'Frau Demir', role: 'zweite Kollegin', stance: 'sieht die Verantwortung anders verteilt', tone: 'bestimmt' },
      { id: 'mediator', name: 'Frau Peters', role: 'Teamleitung und Moderation', stance: 'will eine konkrete Vereinbarung erreichen', tone: 'ruhig und lösungsorientiert' },
    ],
    opening: 'Die Stimmung ist angespannt. Beschreibe zuerst neutral, was du beobachtet hast, welche Auswirkung es hat und welche konkrete Lösung du vorschlägst.',
  },
  {
    id: 'customer-review',
    title: 'Kundentermin mit Gegenwind',
    description: 'Erkläre Probleme und Lösungen gegenüber Kunde, Technik und Einkauf.',
    topics: [
      'Eine Lieferung verspätet sich',
      'Ein technischer Fehler muss erklärt werden',
      'Der Projektumfang muss angepasst werden',
      'Eine teurere Lösung ist technisch sinnvoller',
      'Ein Wartungsfenster muss kurzfristig verschoben werden',
      'Eine Reklamation sachlich bearbeiten',
    ],
    participants: [
      { id: 'customer', name: 'Herr Stein', role: 'Kunde', stance: 'erwartet eine klare Lösung und Verbindlichkeit', tone: 'ungeduldig, aber professionell' },
      { id: 'engineer', name: 'Frau Keller', role: 'technische Ansprechpartnerin', stance: 'achtet auf fachlich realistische Aussagen', tone: 'präzise' },
      { id: 'procurement', name: 'Herr Scholz', role: 'Einkauf', stance: 'achtet auf Kosten, Termine und Zusagen', tone: 'geschäftlich' },
    ],
    opening: 'Der Kunde erwartet eine belastbare Antwort. Erkläre kurz den aktuellen Stand, übernimm Verantwortung für den nächsten Schritt und nenne eine konkrete Lösung.',
  },
  {
    id: 'leadership-round',
    title: 'Entscheidung unter Zeitdruck',
    description: 'Führe eine kurze Entscheidungsrunde mit mehreren widersprüchlichen Empfehlungen.',
    topics: [
      'Störung kurz vor Betriebsbeginn',
      'Zwei dringende Aufgaben konkurrieren um Ressourcen',
      'Ein Projekt droht den Termin zu verpassen',
      'Qualität und Geschwindigkeit stehen im Konflikt',
      'Ein Sicherheitsrisiko wird kurzfristig entdeckt',
      'Eine wichtige Person fällt unerwartet aus',
    ],
    participants: [
      { id: 'operations', name: 'Frau Krüger', role: 'Betriebskoordination', stance: 'priorisiert schnelle Handlungsfähigkeit', tone: 'knapp und druckvoll' },
      { id: 'safety', name: 'Herr Vogel', role: 'Sicherheitsverantwortlicher', stance: 'priorisiert Risiko- und Regelkonformität', tone: 'konsequent' },
      { id: 'delivery', name: 'Frau Lehmann', role: 'Projektverantwortliche', stance: 'achtet auf Termine und Auswirkungen auf Kunden', tone: 'zielorientiert' },
    ],
    opening: 'Du musst eine Entscheidung vorbereiten. Formuliere zuerst dein Ziel, die wichtigste Priorität und welche Information du für die Entscheidung noch brauchst.',
  },
]

export const getRandomTeamItem = (items, excluded = '') => {
  const available = items.filter((item) => item !== excluded)
  const source = available.length ? available : items
  return source[Math.floor(Math.random() * source.length)]
}

export const createTeamOpeningMessages = ({ scenario, topic, difficulty }) => {
  const moderator = scenario.participants[0]
  const pressure = difficulty.id === 'challenging'
    ? 'Die Gruppe wird Widersprüche direkt aufgreifen und belastbare Begründungen verlangen.'
    : difficulty.id === 'supportive'
      ? 'Die Gruppe fragt konstruktiv nach und gibt dir Raum, deine Gedanken zu ordnen.'
      : 'Die Gruppe reagiert realistisch und vertritt unterschiedliche Interessen.'

  return [
    {
      id: 'team-intro',
      role: 'team',
      speakerId: 'system-room',
      speakerName: 'Simulation',
      speakerRole: 'Kontext',
      text: `Thema „${topic}“. ${pressure}`,
    },
    {
      id: 'team-opening',
      role: 'team',
      speakerId: moderator.id,
      speakerName: moderator.name,
      speakerRole: moderator.role,
      text: scenario.opening,
    },
  ]
}
