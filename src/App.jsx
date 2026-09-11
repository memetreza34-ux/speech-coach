import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, ChevronLeft, ArrowRight, Home, Target, User, Check, FlaskConical, Loader2 } from 'lucide-react'
import { useRecorder, getDynamicsLabel } from './useRecorder'

// --- Utility: Pacing ---
const getPacingStatus = (wpm) => {
  if (wpm < 110) return "Zu langsam";
  if (wpm > 160) return "Zu schnell";
  return "Perfekt";
};

const countWords = (transcript) => (transcript.trim().match(/\S+/g) || []).length;
const countFillers = (transcript) => (transcript.match(/\b(ähm|äh|also|sozusagen|quasi|halt|genau|irgendwie|eigentlich)\b/gi) || []).length;

// --- Utility: AI Analysis ---
// Messwerte (Tempo, Pausen, Dynamik) kommen deterministisch aus der Audioanalyse.
// Vom Modell kommt nur das, was es besser kann: Füllwort-Erkennung im Kontext und der Coaching-Tipp.
// Der Gemini-Call läuft server-seitig über /api/analyze (Vercel Function) —
// der Key bleibt dort in einer Env-Var und geht nie durch den Client.
const analyzeTranscript = async (recording, mode, profile) => {
  const { transcript, durationMs, pauseCount, longestPauseMs, speakingRatio, dynamics } = recording;
  const minutes = Math.max(durationMs / 60000, 1 / 60);
  const measured = {
    wpm: Math.round(countWords(transcript) / minutes),
    pauseCount,
    longestPauseMs,
    speakingRatio,
    dynamics
  };
  measured.pacingStatus = getPacingStatus(measured.wpm);

  const fallback = (aiTip) => ({ ...measured, fillers: countFillers(transcript), aiTip, isDummy: true });

  if (!transcript.trim()) {
    return fallback("Es wurde kein Text erkannt. Sprich etwas lauter oder prüfe dein Mikrofon — die Messwerte oben stammen aus der Audioaufnahme.");
  }

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, mode, profile, metrics: measured })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      console.error("Analyse-Server Fehler:", response.status, errBody);
      const tip = response.status === 404
        ? "Kein Analyse-Server erreichbar (lokale Vorschau ohne 'vercel dev'?). Die Messwerte oben sind echt, nur der KI-Tipp fehlt."
        : (errBody?.error || "Die KI-Analyse ist fehlgeschlagen. Die Messwerte oben sind echt, nur der KI-Tipp fehlt.");
      return fallback(tip);
    }

    const { fillers, aiTip } = await response.json();
    return { ...measured, fillers: typeof fillers === 'number' ? fillers : countFillers(transcript), aiTip };
  } catch (e) {
    console.error("AI Error:", e);
    return fallback("Der Analyse-Server ist nicht erreichbar. Die Messwerte oben sind echt, nur der KI-Tipp fehlt.");
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

const MODES = [
  { id: 'impromptu', title: 'Freies Sprechen', desc: '60 Sekunden, ein Zufallsthema.' },
  { id: 'interview', title: 'HR Interview', desc: 'Die harte Bewerbungssimulation.' },
  { id: 'dating', title: 'Erstes Date', desc: 'Sympathisch bleiben unter Druck.' },
  { id: 'language', title: 'Paris', desc: 'Bestell ein Croissant auf Französisch.' },
  { id: 'negotiation', title: 'Gehaltsverhandlung', desc: 'Hol dir die 15 Prozent.' }
];

const modeTitle = (id) => MODES.find(m => m.id === id)?.title || id;

// --- Animations ---
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } }
};
const staggerContainer = { animate: { transition: { staggerChildren: 0.05 } } };
const staggerItem = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

// ==========================================
// 1. ONBOARDING
// ==========================================
const OnboardingFlow = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ name: '', role: '', age: '', hobbies: '' });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else onComplete(profile);
  };

  return (
    <motion.div className="screen" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ justifyContent: 'center' }}>
      <div className="progress">
        {[1, 2, 3, 4].map(i => <div key={i} className={`progress-seg ${step >= i ? 'active' : ''}`} />)}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>Schritt 01</div>
            <h2 className="screen-title">Wie heißt<br /><span className="accent">du?</span></h2>
            <input type="text" className="field" placeholder="Vorname" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>Schritt 02</div>
            <h2 className="screen-title">Was machst<br /><span className="accent">du?</span></h2>
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {['Schüler / Student', 'Angestellter', 'Führungskraft', 'Selbstständig'].map(role => (
                <div key={role} className={`option ${profile.role === role ? 'selected' : ''}`} onClick={() => setProfile({ ...profile, role })}>{role}</div>
              ))}
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>Schritt 03</div>
            <h2 className="screen-title">Wie alt<br /><span className="accent">bist du?</span></h2>
            <input type="number" className="field" placeholder="Alter" value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} />
          </motion.div>
        )}
        {step === 4 && (
          <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>Schritt 04</div>
            <h2 className="screen-title">Was machst du<br /><span className="accent">in der Freizeit?</span></h2>
            <textarea className="field" placeholder="z.B. Kochen, Fußball, Klettern" rows="3" value={profile.hobbies} onChange={e => setProfile({ ...profile, hobbies: e.target.value })} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
              Dein Coach nutzt das für Beispiele, die zu dir passen.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.98 }} className="btn btn-accent" style={{ marginTop: '2rem' }} onClick={handleNext} disabled={step === 1 && !profile.name}>
        {step < 4 ? 'Weiter' : 'Los geht’s'} <ArrowRight size={18} strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  );
};

// ==========================================
// 2. DASHBOARD
// ==========================================
const DashboardScreen = ({ profile, sessionHistory }) => {
  const level = computeLevel(sessionHistory);
  const streak = computeStreak(sessionHistory);
  const recent = [...sessionHistory].reverse().slice(0, 6);

  return (
    <motion.div className="screen screen-scroll" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="eyebrow" style={{ marginBottom: '0.6rem' }}>Willkommen zurück</div>
      <h1 className="screen-title">{profile.name || 'Speaker'}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="stat">
          <div className="eyebrow">Level</div>
          <div className="stat-value accent">{level}</div>
        </div>
        <div className="stat">
          <div className="eyebrow">Streak</div>
          <div className="stat-value">{streak}</div>
          <div className="stat-hint">{streak === 1 ? 'Tag' : 'Tage'} in Folge</div>
        </div>
      </div>

      <div className="stat" style={{ marginBottom: '1.5rem' }}>
        <div className="eyebrow">Sessions gesamt</div>
        <div className="stat-value">{sessionHistory.length}</div>
        <div className="stat-hint">Noch {3 - (sessionHistory.length % 3)} bis Level {level + 1}</div>
      </div>

      {recent.length > 0 ? (
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>Protokoll</div>
          {recent.map((s, i) => (
            <div key={i} className="log-row">
              <span className="log-mode">{modeTitle(s.mode)}</span>
              <span className="log-values">{s.wpm} WPM · {s.fillers} FW · {s.pauseCount ?? 0} P</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Noch keine Daten</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            Starte deine erste Session in der Arena. Ab dann siehst du hier, wie sich deine Werte entwickeln.
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ==========================================
// 3. PROFILE
// ==========================================
const ProfileScreen = ({ profile, sessionHistory }) => (
  <motion.div className="screen screen-scroll" variants={pageVariants} initial="initial" animate="animate" exit="exit">
    <h1 className="screen-title">Profil</h1>

    <div className="card" style={{ marginBottom: '0.75rem' }}>
      <div className="eyebrow" style={{ marginBottom: '0.4rem' }}>Name</div>
      <div className="display" style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>{profile.name}</div>

      <div className="eyebrow" style={{ marginBottom: '0.4rem' }}>Rolle</div>
      <div style={{ fontSize: '0.95rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>{profile.role || '—'}</div>

      <div className="eyebrow" style={{ marginBottom: '0.4rem' }}>Interessen</div>
      <div style={{ fontSize: '0.95rem', color: 'var(--text-dim)' }}>{profile.hobbies || '—'}</div>
    </div>

    <div className="card">
      <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>Aufnahmen</div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
        Deine Audioaufnahmen bleiben im Browser und werden nirgendwo hochgeladen. Für den Coaching-Tipp wird nur der
        Text an die Analyse geschickt — {sessionHistory.length} Session{sessionHistory.length === 1 ? '' : 's'} bisher.
      </p>
    </div>
  </motion.div>
);

// ==========================================
// 4. TRAINING
// ==========================================
const ArenaSelector = ({ onStart }) => (
  <motion.div className="screen screen-scroll" variants={pageVariants} initial="initial" animate="animate" exit="exit">
    <div className="eyebrow" style={{ marginBottom: '0.6rem' }}>Wähle deine Übung</div>
    <h1 className="screen-title">Die <span className="accent">Arena</span></h1>

    <motion.div variants={staggerContainer} initial="initial" animate="animate" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {MODES.map((m, i) => (
        <motion.button key={m.id} variants={staggerItem} whileTap={{ scale: 0.99 }} className="mode-row" onClick={() => onStart(m.id)}>
          <span className="mode-index">{String(i + 1).padStart(2, '0')}</span>
          <span style={{ flex: 1 }}>
            <span className="mode-title" style={{ display: 'block' }}>{m.title}</span>
            <span className="mode-desc">{m.desc}</span>
          </span>
        </motion.button>
      ))}
    </motion.div>
  </motion.div>
);

const BAR_COUNT = 21;
const barScale = (i) => 1 - (Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2)) * 0.7;

const RecorderScreen = ({ mode, onFinish, onCancel }) => {
  const { isRecording, transcript, level, error, start, stop } = useRecorder(mode === 'language' ? 'fr-FR' : 'de-DE');
  const [elapsedMs, setElapsedMs] = useState(0);

  const prompts = {
    impromptu: "Rede 60 Sekunden über: „Warum das Internet Fluch und Segen zugleich ist.“",
    interview: "HR-Manager: „Erzählen Sie mir von einem großen Fehler in Ihrer Karriere.“",
    dating: "Dein Date: „Ich liebe Abenteuer. Was war das Verrückteste, das du je gemacht hast?“",
    language: "Kellner: „Bonjour! Que désirez-vous?“ — antworte auf Französisch.",
    negotiation: "Chef: „Das Budget ist eng. Warum sollten wir Ihnen 15 % mehr zahlen?“"
  };

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setElapsedMs(t => t + 100), 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = async () => {
    if (isRecording) {
      onFinish(await stop());
    } else {
      setElapsedMs(0);
      await start();
    }
  };

  const seconds = Math.floor(elapsedMs / 1000);
  const timeLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <motion.div className="overlay" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <button className="btn-text" style={{ marginBottom: '2rem' }} onClick={onCancel}>
        <ChevronLeft size={16} strokeWidth={2.5} /> Abbrechen
      </button>

      <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>{modeTitle(mode)}</div>
      <p style={{ fontSize: '1.15rem', lineHeight: 1.45, fontWeight: 500, marginBottom: '1rem' }}>{prompts[mode]}</p>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="timer" style={{ color: isRecording ? 'var(--accent)' : 'var(--text-faint)' }}>{timeLabel}</div>

        <div className="meter">
          {Array.from({ length: BAR_COUNT }, (_, i) => {
            const scaled = level * barScale(i);
            return (
              <div
                key={i}
                className={`meter-bar ${isRecording && scaled > 0.05 ? 'lit' : ''}`}
                style={{ height: `${6 + (isRecording ? scaled * 84 : 0)}px` }}
              />
            );
          })}
        </div>

        <p className={`transcript ${error ? 'transcript-error' : ''}`}>
          {error || transcript || (isRecording ? 'Aufnahme läuft …' : 'Drücke Start, wenn du bereit bist.')}
        </p>
      </div>

      <motion.button whileTap={{ scale: 0.98 }} className={`btn ${isRecording ? 'btn-stop' : 'btn-accent'}`} onClick={toggleRecording}>
        {isRecording
          ? <><Square size={17} fill="currentColor" /> Beenden</>
          : <><Play size={17} fill="currentColor" /> Starten</>}
      </motion.button>
    </motion.div>
  );
};

const MetricCard = ({ label, value, hint, alert, delta }) => (
  <motion.div variants={staggerItem} className="stat">
    <div className="eyebrow">{label}</div>
    <div className={`stat-value ${alert ? 'stat-value-bad' : ''}`}>{value}</div>
    {hint && <div className="stat-hint">{hint}</div>}
    {delta && <div className={`delta ${delta.good ? 'delta-good' : 'delta-bad'}`}>{delta.text}</div>}
  </motion.div>
);

const FeedbackScreen = ({ analysis, previous, onDone }) => {
  // Veränderung zur letzten Session im selben Modus — macht Fortschritt sichtbar.
  const delta = (key, lowerIsBetter = false) => {
    if (!previous || typeof previous[key] !== 'number' || typeof analysis[key] !== 'number') return null;
    const diff = analysis[key] - previous[key];
    if (diff === 0) return { text: 'unverändert', good: true };
    const improved = lowerIsBetter ? diff < 0 : diff > 0;
    return { text: `${diff > 0 ? '+' : ''}${diff} vs. zuletzt`, good: improved };
  };

  return (
    <motion.div className="overlay" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="eyebrow" style={{ marginBottom: '0.6rem' }}>Auswertung</div>
      <h2 className="screen-title">Deine <span className="accent">Werte</span></h2>

      {analysis.isDummy && (
        <div style={{ marginBottom: '1.25rem' }}>
          <span className="demo-badge"><FlaskConical size={13} /> Ohne KI-Tipp</span>
        </div>
      )}

      <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }} variants={staggerContainer} initial="initial" animate="animate">
        <MetricCard label="Tempo" value={analysis.wpm} hint={`WPM · ${analysis.pacingStatus}`} delta={delta('wpm')} />
        <MetricCard label="Füllwörter" value={analysis.fillers} alert={analysis.fillers > 5} delta={delta('fillers', true)} />
        <MetricCard
          label="Pausen"
          value={analysis.pauseCount ?? 0}
          hint={analysis.longestPauseMs ? `längste ${(analysis.longestPauseMs / 1000).toFixed(1)}s` : null}
          delta={delta('pauseCount', true)}
        />
        <MetricCard
          label="Dynamik"
          value={analysis.dynamics ?? 0}
          hint={getDynamicsLabel(analysis.dynamics ?? 0)}
          delta={delta('dynamics')}
        />
      </motion.div>

      {analysis.audioUrl && (
        <div className="card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
          <div className="eyebrow" style={{ marginBottom: '0.6rem' }}>Hör dir selbst zu</div>
          <audio controls src={analysis.audioUrl} />
        </div>
      )}

      <div className="card card-accent" style={{ marginBottom: '1.5rem' }}>
        <div className="eyebrow accent" style={{ marginBottom: '0.6rem' }}>Coach</div>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text)' }}>{analysis.aiTip}</p>
      </div>

      <motion.button whileTap={{ scale: 0.98 }} className="btn" style={{ marginTop: 'auto' }} onClick={onDone}>
        <Check size={17} strokeWidth={3} /> Abschließen
      </motion.button>
    </motion.div>
  );
};

const LoadingScreen = () => (
  <motion.div className="overlay" style={{ alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }} style={{ marginBottom: '1.5rem' }}>
      <Loader2 size={38} color="var(--accent)" strokeWidth={2.5} />
    </motion.div>
    <div className="eyebrow">Auswertung läuft</div>
  </motion.div>
);

const TrainingFlow = ({ profile, sessionHistory, onSessionComplete }) => {
  const [subScreen, setSubScreen] = useState('selector'); // selector, recorder, loading, feedback
  const [mode, setMode] = useState('impromptu');
  const [analysisData, setAnalysisData] = useState(null);
  const [previousSession, setPreviousSession] = useState(null);

  const handleFinishRecording = async (recording) => {
    setSubScreen('loading');
    setPreviousSession([...sessionHistory].reverse().find(s => s.mode === mode) || null);

    const result = await analyzeTranscript(recording, mode, profile);
    setAnalysisData({ ...result, audioUrl: recording.audioUrl });
    onSessionComplete({
      mode,
      date: new Date().toISOString(),
      fillers: result.fillers,
      wpm: result.wpm,
      pacingStatus: result.pacingStatus,
      pauseCount: result.pauseCount,
      dynamics: result.dynamics,
      speakingRatio: result.speakingRatio
    });
    setSubScreen('feedback');
  };

  const finishFeedback = () => {
    if (analysisData?.audioUrl) URL.revokeObjectURL(analysisData.audioUrl);
    setAnalysisData(null);
    setSubScreen('selector');
  };

  return (
    <AnimatePresence mode="wait">
      {subScreen === 'selector' && <ArenaSelector key="selector" onStart={(m) => { setMode(m); setSubScreen('recorder'); }} />}
      {subScreen === 'recorder' && <RecorderScreen key="recorder" mode={mode} onCancel={() => setSubScreen('selector')} onFinish={handleFinishRecording} />}
      {subScreen === 'loading' && <LoadingScreen key="loading" />}
      {subScreen === 'feedback' && <FeedbackScreen key="feedback" analysis={analysisData} previous={previousSession} onDone={finishFeedback} />}
    </AnimatePresence>
  );
}

// ==========================================
// 5. MAIN APP & ROOT
// ==========================================
const MainApp = ({ profile, sessionHistory, onSessionComplete }) => {
  const [activeTab, setActiveTab] = useState('training');

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'training', label: 'Arena', icon: Target },
    { id: 'profile', label: 'Profil', icon: User }
  ];

  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <DashboardScreen key="dashboard" profile={profile} sessionHistory={sessionHistory} />}
        {activeTab === 'training' && <TrainingFlow key="training" profile={profile} sessionHistory={sessionHistory} onSessionComplete={onSessionComplete} />}
        {activeTab === 'profile' && <ProfileScreen key="profile" profile={profile} sessionHistory={sessionHistory} />}
      </AnimatePresence>

      <div className="nav">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={20} strokeWidth={2.2} />
            <span>{label}</span>
          </button>
        ))}
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
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {!userProfile
          ? <OnboardingFlow key="onboarding" onComplete={setUserProfile} />
          : <MainApp key="main" profile={userProfile} sessionHistory={sessionHistory} onSessionComplete={addSession} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
