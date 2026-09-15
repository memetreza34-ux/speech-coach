export const MODES = [
  // Live
  { id: 'interview_interactive', category: 'interactive', title: 'Bewerbungsgespräch', desc: 'Die KI stellt dir Live-Fragen.', isPremium: true, color: 'from-amber-500 to-orange-600', icon: 'UserCircle2' },
  { id: 'sales_objection', category: 'interactive', title: 'Sales & Einwände', desc: 'Die KI feuert kritische Kundenfragen ab.', isPremium: true, color: 'from-rose-500 to-red-600', icon: 'ShieldAlert' },
  { id: 'conflict_resolution', category: 'interactive', title: 'Konflikt & Kritik', desc: 'Die KI spielt einen verärgerten Kollegen.', isPremium: true, color: 'from-red-600 to-rose-800', icon: 'Flame' },
  
  // Präsentationen & Sales
  { id: 'elevator_pitch', category: 'presentations', title: 'Elevator Pitch', desc: 'Überzeuge in 60 Sekunden.', isPremium: false, color: 'from-emerald-500 to-teal-600', icon: 'Rocket' },
  { id: 'presentation', category: 'presentations', title: 'Vorstandspräsentation', desc: 'Überzeuge das C-Level.', isPremium: true, color: 'from-blue-600 to-sky-700', icon: 'PieChart' },
  { id: 'pitch', category: 'presentations', title: 'Start-Up Pitch', desc: 'Präsentiere deine Idee vor Investoren.', isPremium: true, color: 'from-violet-500 to-purple-600', icon: 'Lightbulb' },
  { id: 'toastmasters', category: 'presentations', title: 'Spontan-Rede', desc: 'Stegreifrede ohne Vorbereitung.', isPremium: false, color: 'from-cyan-500 to-blue-600', icon: 'Mic2' },
  { id: 'storytelling', category: 'presentations', title: 'Storytelling', desc: 'Erzähle eine fesselnde Geschichte.', isPremium: false, color: 'from-amber-400 to-yellow-600', icon: 'BookOpen' },

  // Karriere
  { id: 'interview', category: 'career', title: 'HR Interview', desc: 'Die harte Bewerbungssimulation.', isPremium: false, color: 'from-blue-500 to-indigo-600', icon: 'Briefcase' },
  { id: 'negotiation', category: 'career', title: 'Gehaltsverhandlung', desc: 'Hol dir die 15 Prozent.', isPremium: true, color: 'from-indigo-600 to-violet-700', icon: 'TrendingUp' },
  { id: 'resignation', category: 'career', title: 'Kündigung einreichen', desc: 'Professionell und bestimmt gehen.', isPremium: true, color: 'from-slate-600 to-slate-800', icon: 'LogOut' },
  { id: 'conflict', category: 'career', title: 'Team Konflikt', desc: 'Löse einen Streit unter Kollegen.', isPremium: true, color: 'from-orange-500 to-red-600', icon: 'Users' },
  { id: 'feedback_review', category: 'career', title: 'Jahresgespräch', desc: 'Hole dir aktiv Feedback vom Chef.', isPremium: false, color: 'from-cyan-600 to-blue-500', icon: 'Star' },
  
  // Alltag & Social
  { id: 'impromptu', category: 'social', title: 'Freies Sprechen', desc: '60 Sekunden, ein Zufallsthema.', isPremium: false, color: 'from-amber-400 to-orange-500', icon: 'MessageCircle' },
  { id: 'dating', category: 'social', title: 'Erstes Date', desc: 'Sympathisch bleiben unter Druck.', isPremium: false, color: 'from-pink-500 to-rose-500', icon: 'Heart' },
  { id: 'wedding', category: 'social', title: 'Hochzeitsrede', desc: 'Emotional, aber nicht peinlich.', isPremium: true, color: 'from-rose-400 to-pink-600', icon: 'GlassWater' },
  { id: 'complaint', category: 'social', title: 'Reklamation', desc: 'Bleib höflich, aber bestimmt.', isPremium: false, color: 'from-stone-500 to-stone-700', icon: 'Frown' },
  { id: 'apology', category: 'social', title: 'Die Entschuldigung', desc: 'Gib einen Fehler bei Freunden zu.', isPremium: true, color: 'from-indigo-400 to-cyan-500', icon: 'UserMinus' },
  { id: 'smalltalk', category: 'social', title: 'Smalltalk Event', desc: 'Eis brechen bei Fremden.', isPremium: false, color: 'from-lime-500 to-green-600', icon: 'Coffee' },

  // Ziele & Motivation
  { id: 'peptalk', category: 'goals', title: 'Pep-Talk', desc: 'Motiviere dich selbst vorm Spiegel.', isPremium: false, color: 'from-yellow-400 to-orange-500', icon: 'Flame' },
  { id: 'vision', category: 'goals', title: 'Vision Pitch', desc: 'Erkläre dein größtes Lebensziel.', isPremium: true, color: 'from-emerald-400 to-teal-600', icon: 'Target' },
  { id: 'excuses', category: 'goals', title: 'Ausreden zerstören', desc: 'Warum hast du heute keinen Sport gemacht?', isPremium: true, color: 'from-red-500 to-rose-700', icon: 'Swords' },
  { id: 'habit_pitch', category: 'goals', title: 'Gewohnheiten', desc: 'Überzeuge dich, etwas zu ändern.', isPremium: false, color: 'from-fuchsia-500 to-purple-600', icon: 'TrendingUp' },

  // Politik & Debatte
  { id: 'politics_debate', category: 'politics', title: 'Die TV-Debatte', desc: 'Verteidige deine Position sachlich.', isPremium: false, color: 'from-slate-700 to-slate-900', icon: 'Mic2' },
  { id: 'crisis', category: 'politics', title: 'Krisen-PR', desc: 'Ein Shitstorm zieht auf. Reagiere souverän.', isPremium: true, color: 'from-red-500 to-rose-700', icon: 'AlertTriangle' },
  { id: 'panel', category: 'politics', title: 'Podiumsdiskussion', desc: 'Setze dich gegen Unterbrecher durch.', isPremium: true, color: 'from-violet-600 to-indigo-800', icon: 'Users' },
  { id: 'townhall', category: 'politics', title: 'Mitarbeiter-Townhall', desc: 'Stelle dich kritischen Fragen der Belegschaft.', isPremium: true, color: 'from-indigo-800 to-slate-900', icon: 'MessageSquare' },

  // Sprachen
  { id: 'lang_en', category: 'languages', title: 'English Business', desc: 'Smalltalk with US clients.', isPremium: false, color: 'from-emerald-500 to-teal-600', icon: 'Globe' },
  { id: 'lang_fr', category: 'languages', title: 'Parisian Café', desc: 'Commandez un croissant.', isPremium: true, color: 'from-teal-500 to-cyan-600', icon: 'Coffee' },
  { id: 'lang_es', category: 'languages', title: 'Tapas en Madrid', desc: 'Pide la cena con amigos.', isPremium: true, color: 'from-cyan-500 to-blue-500', icon: 'Utensils' },
  { id: 'lang_it', category: 'languages', title: 'Italian Dinner', desc: 'Ordina vino e pasta.', isPremium: true, color: 'from-green-600 to-red-600', icon: 'Wine' }
];
