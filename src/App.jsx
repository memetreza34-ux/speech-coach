import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Briefcase, Play, Square, ChevronLeft, Activity, Gauge, MessageSquare, Home, Target, User, ArrowRight, CheckCircle2, Heart, Globe, DollarSign, Loader2, FlaskConical } from 'lucide-react'

// --- Utility: Pacing ---
const getPacingStatus = (wpm) => {
  if (wpm < 110) return "Zu langsam";
  if (wpm > 160) return "Zu schnell";
  return "Perfekt";
};

const countWords = (transcript) => (transcript.trim().match(/\S+/g) || []).length;

const dummyAnalysis = (transcript, wpm, aiTip) => ({
  fillers: (transcript.match(/ähm|also|sozusagen|quasi|halt|genau/gi) || []).length,
  wpm,
  pacingStatus: getPacingStatus(wpm),
  aiTip,
  isDummy: true
});

// --- Utility: AI Analysis ---
// Der Gemini-Call läuft server-seitig über /api/analyze (Vercel Function) —
// der Key bleibt dort in einer Env-Var und geht nie durch den Client.
const analyzeTranscript = async (transcript, mode, profile, durationMs) => {
  const minutes = Math.max(durationMs / 60000, 1 / 60);
  const wordCount = countWords(transcript);
  const measuredWpm = Math.round(wordCount / minutes);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, mode, profile, durationMs })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      console.error("Analyse-Server Fehler:", response.status, errBody);
      const tip = response.status === 404
        ? "Kein Analyse-Server erreichbar (lokale Vorschau ohne 'vercel dev'?). Das ist eine Dummy-Analyse."
        : (errBody?.error || "Die KI-Analyse ist fehlgeschlagen. Das ist eine Dummy-Analyse.");
      return dummyAnalysis(transcript, measuredWpm, tip);
    }

    return await response.json();
  } catch (e) {
    console.error("AI Error:", e);
    return dummyAnalysis(transcript, measuredWpm, "Der Analyse-Server ist nicht erreichbar. Das ist eine Dummy-Analyse.");
  }
};

// --- Utility: Progress ---
const computeStreak = (history) => {
  const daySet = new Set(history.map(h => new Date(h.date).toDateString()));
  const cursor = new Date();
  let streak = 0;
  while (daySet.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const computeLevel = (history) => Math.min(99, Math.floor(history.length / 3) + 1);

// --- Animations ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};
const staggerContainer = { animate: { transition: { staggerChildren: 0.1 } } };
const staggerItem = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ==========================================
// 1. ONBOARDING FLOW
// ==========================================
const OnboardingFlow = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ name: '', role: '', age: '', hobbies: '' });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else onComplete(profile);
  };

  return (
    <motion.div className="app-container" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ justifyContent: 'center' }}>
      <div className="onboarding-progress">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`progress-dot ${step >= i ? 'active' : ''}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="glass-panel">
            <h2 style={{ marginBottom: '1rem' }}>Wie dürfen wir dich nennen?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Damit dein Coach dich persönlich ansprechen kann.</p>
            <input type="text" className="input-field" placeholder="Dein Vorname" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="glass-panel">
            <h2 style={{ marginBottom: '1rem' }}>Was ist deine aktuelle Rolle?</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {['Schüler / Student', 'Angestellter', 'Führungskraft', 'Selbstständig'].map(role => (
                <div key={role} className={`option-card ${profile.role === role ? 'selected' : ''}`} onClick={() => setProfile({...profile, role})}>{role}</div>
              ))}
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="glass-panel">
            <h2 style={{ marginBottom: '1rem' }}>Wie alt bist du?</h2>
            <input type="number" className="input-field" placeholder="Dein Alter" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} />
          </motion.div>
        )}
        {step === 4 && (
          <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="glass-panel">
            <h2 style={{ marginBottom: '1rem' }}>Was sind deine Hobbys?</h2>
            <textarea className="input-field" placeholder="z.B. Kochen, Fußball..." rows="3" value={profile.hobbies} onChange={e => setProfile({...profile, hobbies: e.target.value})} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary" style={{ marginTop: '2rem' }} onClick={handleNext} disabled={step === 1 && !profile.name}>
        {step < 4 ? 'Weiter' : 'Profil anlegen'} <ArrowRight size={20} />
      </motion.button>
    </motion.div>
  );
};

// ==========================================
// 2. DASHBOARD SCREEN
// ==========================================
const DashboardScreen = ({ profile, sessionHistory }) => (
  <motion.div className="app-container app-content" variants={pageVariants} initial="initial" animate="animate" exit="exit">
    <div style={{ marginBottom: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Hallo, <span className="gradient-text">{profile.name || 'Speaker'}</span>! 👋</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Willkommen zurück in deinem Dojo.</p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
      <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--accent-purple)', fontSize: '2rem', marginBottom: '0.2rem' }}>Lvl {computeLevel(sessionHistory)}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Charisma</p>
      </div>
      <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--accent-blue)', fontSize: '2rem', marginBottom: '0.2rem' }}>{computeStreak(sessionHistory)}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Day Streak</p>
      </div>
    </div>

    {sessionHistory.length > 0 && (
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem' }}>Letzte Sessions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...sessionHistory].reverse().slice(0, 5).map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ textTransform: 'capitalize' }}>{s.mode}</span>
              <span>{s.wpm} WPM &middot; {s.fillers} Füllwörter</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </motion.div>
);

// ==========================================
// 3. PROFILE SCREEN
// ==========================================
const ProfileScreen = ({ profile }) => (
  <motion.div className="app-container app-content" variants={pageVariants} initial="initial" animate="animate" exit="exit">
    <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Dein <span className="gradient-text">Profil</span></h2>

    <div className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={30} color="var(--accent-purple)" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>{profile.name}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{profile.role || 'Unbekannte Rolle'}</p>
        </div>
      </div>
    </div>
  </motion.div>
);


// ==========================================
// 4. TRAINING SCREENS
// ==========================================
const ArenaSelector = ({ onStart }) => {
  const modes = [
    { id: 'impromptu', title: 'Freies Sprechen', desc: '1 Minute zu einem Zufallsthema.', icon: <Mic size={24} color="var(--accent-blue)" />, bg: 'rgba(59, 130, 246, 0.1)' },
    { id: 'interview', title: 'HR Interview', desc: 'Die harte Bewerbungssimulation.', icon: <Briefcase size={24} color="var(--accent-purple)" />, bg: 'rgba(139, 92, 246, 0.1)' },
    { id: 'dating', title: 'Dating Simulator', desc: 'Das erste Date – mach Eindruck!', icon: <Heart size={24} color="#ef4444" />, bg: 'rgba(239, 68, 68, 0.1)' },
    { id: 'language', title: 'Fremdsprache (Paris)', desc: 'Bestelle ein Croissant auf Französisch.', icon: <Globe size={24} color="#10b981" />, bg: 'rgba(16, 185, 129, 0.1)' },
    { id: 'negotiation', title: 'Gehaltsverhandlung', desc: 'Hol dir die 15% mehr!', icon: <DollarSign size={24} color="#f59e0b" />, bg: 'rgba(245, 158, 11, 0.1)' },
  ];

  return (
    <motion.div className="app-container app-content" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Die <span className="gradient-text">Arena</span></h2>
      <motion.div variants={staggerContainer} initial="initial" animate="animate" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {modes.map(m => (
          <motion.button key={m.id} variants={staggerItem} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-secondary" style={{ textAlign: 'left', padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }} onClick={() => onStart(m.id)}>
            <div style={{ background: m.bg, padding: '0.8rem', borderRadius: '12px' }}>{m.icon}</div>
            <div>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem', color: 'var(--text-primary)', fontWeight: '600' }}>{m.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.desc}</div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

const RecorderScreen = ({ mode, onFinish, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timeMs, setTimeMs] = useState(0);
  const recognitionRef = useRef(null);
  
  const prompts = {
    impromptu: "Rede 1 Minute über: 'Warum das Internet Fluch und Segen zugleich ist.'",
    interview: "HR-Manager: 'Erzählen Sie mir von einem großen Fehler in Ihrer Karriere.'",
    dating: "Dein Date: 'Hey! Ich liebe Abenteuer. Was war das Verrückteste, das du je gemacht hast?'",
    language: "Kellner: 'Bonjour! Que désirez-vous?' (Antworte auf Französisch)",
    negotiation: "Chef: 'Das Budget ist eng. Warum sollten wir Ihnen 15% mehr zahlen?'"
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = mode === 'language' ? 'fr-FR' : 'de-DE';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) currentTranscript += event.results[i][0].transcript + ' ';
        setTranscript(currentTranscript);
      };
      recognitionRef.current = recognition;
    } else {
      setTranscript("Browser wird nicht unterstützt.");
    }
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); }
  }, [mode]);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      onFinish(transcript, timeMs);
    } else {
      if (recognitionRef.current) recognitionRef.current.start();
      setIsRecording(true);
      setTranscript('');
      setTimeMs(0);
    }
  };

  useEffect(() => {
    let interval;
    if (isRecording) interval = setInterval(() => setTimeMs(t => t + 1000), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <motion.div className="app-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: 'var(--bg-color)' }} variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <button style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }} onClick={onCancel}>
        <ChevronLeft size={20} /> Abbrechen
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-blue)', marginBottom: '0.8rem', fontWeight: '700' }}>Arena Modus</div>
        <h2 style={{ fontSize: '1.3rem', lineHeight: '1.5', fontWeight: '500', padding: '0 1rem' }}>{prompts[mode]}</h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div 
          style={{ width: '150px', height: '150px', borderRadius: '50%', background: isRecording ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)', border: `2px solid ${isRecording ? 'var(--accent-purple)' : 'var(--glass-border)'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}
          animate={ isRecording ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 50px rgba(139, 92, 246, 0.4)', '0 0 0px rgba(139, 92, 246, 0)'] } : { scale: 1, boxShadow: 'none' } }
          transition={{ repeat: isRecording ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
        >
          <Mic size={50} color={isRecording ? "var(--accent-purple)" : "var(--text-secondary)"} />
        </motion.div>
        
        <p style={{ color: 'var(--text-secondary)', minHeight: '80px', textAlign: 'center', fontSize: '1rem', fontStyle: 'italic', padding: '0 2rem' }}>
          {transcript || (isRecording ? "Höre zu..." : "Drücke Start")}
        </p>
      </div>

      <div style={{ marginTop: 'auto', marginBottom: '1rem' }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="btn-primary" style={{ background: isRecording ? '#ef4444' : '', boxShadow: isRecording ? '0 4px 20px rgba(239, 68, 68, 0.4)' : '', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} onClick={toggleRecording}>
          {isRecording ? <><Square size={20} fill="currentColor" /> Beenden</> : <><Play size={20} fill="currentColor" /> Starten</>}
        </motion.button>
      </div>
    </motion.div>
  );
};

const FeedbackScreen = ({ analysis, onDone }) => {
  return (
    <motion.div className="app-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: 'var(--bg-color)', overflowY: 'auto' }} variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <h2 style={{ fontSize: '2.2rem', marginBottom: analysis.isDummy ? '0.75rem' : '2rem', textAlign: 'center', marginTop: '2rem' }}>KI <span className="gradient-text">Feedback</span></h2>

      {analysis.isDummy && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '1.5rem', color: '#f59e0b', fontSize: '0.8rem', fontWeight: '600' }}>
          <FlaskConical size={16} /> Demo-Modus &mdash; keine echte KI-Analyse
        </div>
      )}

      <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }} variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={staggerItem} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Activity size={24} color={analysis.fillers > 5 ? '#ef4444' : 'var(--accent-purple)'} style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Füllwörter</div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: '700', color: analysis.fillers > 5 ? '#ef4444' : 'var(--text-primary)' }}>{analysis.fillers}</div>
        </motion.div>
        
        <motion.div variants={staggerItem} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Gauge size={24} color="var(--accent-blue)" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tempo</div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--text-primary)' }}>{analysis.wpm}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{analysis.pacingStatus}</div>
        </motion.div>
      </motion.div>

      <motion.div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.3)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
          <MessageSquare size={18} color="var(--accent-purple)" />
          <h3 style={{ color: 'var(--accent-purple)', fontSize: '1.1rem' }}>Persönlicher KI-Coach</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {analysis.aiTip}
        </p>
      </motion.div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-secondary" onClick={onDone} style={{ marginTop: 'auto', padding: '1.2rem' }}>
        <CheckCircle2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> Abschließen
      </motion.button>
    </motion.div>
  );
};

const LoadingScreen = () => (
  <motion.div className="app-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ marginBottom: '1rem' }}>
      <Loader2 size={50} color="var(--accent-purple)" />
    </motion.div>
    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>KI analysiert deine Performance...</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Das dauert nur wenige Sekunden.</p>
  </motion.div>
);

const TrainingFlow = ({ profile, onSessionComplete }) => {
  const [subScreen, setSubScreen] = useState('selector'); // selector, recorder, loading, feedback
  const [mode, setMode] = useState('impromptu');
  const [analysisData, setAnalysisData] = useState(null);

  const handleFinishRecording = async (transcript, timeMs) => {
    setSubScreen('loading');
    const result = await analyzeTranscript(transcript, mode, profile, timeMs);
    setAnalysisData(result);
    onSessionComplete({ mode, date: new Date().toISOString(), fillers: result.fillers, wpm: result.wpm, pacingStatus: result.pacingStatus });
    setSubScreen('feedback');
  };

  return (
    <AnimatePresence mode="wait">
      {subScreen === 'selector' && <ArenaSelector key="selector" onStart={(m) => { setMode(m); setSubScreen('recorder'); }} />}
      {subScreen === 'recorder' && <RecorderScreen key="recorder" mode={mode} onCancel={() => setSubScreen('selector')} onFinish={handleFinishRecording} />}
      {subScreen === 'loading' && <LoadingScreen key="loading" />}
      {subScreen === 'feedback' && <FeedbackScreen key="feedback" analysis={analysisData} onDone={() => setSubScreen('selector')} />}
    </AnimatePresence>
  );
}

// ==========================================
// 5. MAIN APP & ROOT
// ==========================================
const MainApp = ({ profile, sessionHistory, onSessionComplete }) => {
  const [activeTab, setActiveTab] = useState('training');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <DashboardScreen key="dashboard" profile={profile} sessionHistory={sessionHistory} />}
        {activeTab === 'training' && <TrainingFlow key="training" profile={profile} onSessionComplete={onSessionComplete} />}
        {activeTab === 'profile' && <ProfileScreen key="profile" profile={profile} />}
      </AnimatePresence>

      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><Home size={24} /><span>Home</span></button>
        <button className={`nav-item ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}><Target size={24} /><span>Arena</span></button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><User size={24} /><span>Profil</span></button>
      </div>
    </div>
  );
};

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

function App() {
  // Persist Profil in localStorage, damit ein Reload nicht zurück ins Onboarding schickt
  const [userProfile, setUserProfile] = useState(() => readJSON('speech_coach_profile', null));
  useEffect(() => {
    if (userProfile) localStorage.setItem('speech_coach_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Persist Trainingshistorie für echte Dashboard-Werte (Level/Streak)
  const [sessionHistory, setSessionHistory] = useState(() => readJSON('speech_coach_history', []));
  useEffect(() => {
    localStorage.setItem('speech_coach_history', JSON.stringify(sessionHistory));
  }, [sessionHistory]);
  const addSession = (session) => setSessionHistory(prev => [...prev, session]);

  // Aufräumen: der Gemini-Key lief früher unsicher über den Client (localStorage + URL-Param).
  // Die Analyse läuft jetzt server-seitig über /api/analyze — ein evtl. noch vorhandener alter Key wird entfernt.
  useEffect(() => { localStorage.removeItem('gemini_api_key'); }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg-color)' }}>
      <AnimatePresence mode="wait">
        {!userProfile
          ? <OnboardingFlow key="onboarding" onComplete={setUserProfile} />
          : <MainApp key="main" profile={userProfile} sessionHistory={sessionHistory} onSessionComplete={addSession} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
