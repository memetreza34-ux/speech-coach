import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Briefcase, Play, Square, ChevronLeft, Activity, Gauge, MessageSquare, Zap, Home, Target, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import './App.css'

// --- Utility ---
const countFillerWords = (text) => {
  if (!text) return 0;
  const fillers = ['ähm', 'also', 'sozusagen', 'quasi', 'halt', 'genau', 'wie gesagt'];
  let count = 0;
  const words = text.toLowerCase().split(/\s+/);
  words.forEach(word => {
    const cleanWord = word.replace(/[.,!?]/g, '');
    if (fillers.includes(cleanWord)) count++;
  });
  return count;
};

// --- Animations ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const staggerContainer = { animate: { transition: { staggerChildren: 0.1 } } };
const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

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
            <input 
              type="text" 
              className="input-field" 
              placeholder="Dein Vorname" 
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="glass-panel">
            <h2 style={{ marginBottom: '1rem' }}>Was ist deine aktuelle Rolle?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Wir passen die Szenarien auf deinen Alltag an.</p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {['Schüler / Student', 'Angestellter', 'Führungskraft', 'Selbstständig'].map(role => (
                <div 
                  key={role} 
                  className={`option-card ${profile.role === role ? 'selected' : ''}`}
                  onClick={() => setProfile({...profile, role})}
                >
                  {role}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="glass-panel">
            <h2 style={{ marginBottom: '1rem' }}>Wie alt bist du?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Damit wir die Tonalität des KI-Coaches anpassen können.</p>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Dein Alter" 
              value={profile.age}
              onChange={e => setProfile({...profile, age: e.target.value})}
            />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="glass-panel">
            <h2 style={{ marginBottom: '1rem' }}>Was sind deine Hobbys?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Perfekt für Smalltalk-Training und Eisbrecher.</p>
            <textarea 
              className="input-field" 
              placeholder="z.B. Kochen, Fußball, Programmieren..." 
              rows="3"
              value={profile.hobbies}
              onChange={e => setProfile({...profile, hobbies: e.target.value})}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }} 
        className="btn-primary" 
        style={{ marginTop: '2rem' }} 
        onClick={handleNext}
        disabled={step === 1 && !profile.name}
      >
        {step < 4 ? 'Weiter' : 'Profil anlegen'} <ArrowRight size={20} />
      </motion.button>
    </motion.div>
  );
};

// ==========================================
// 2. DASHBOARD SCREEN
// ==========================================
const DashboardScreen = ({ profile }) => (
  <motion.div className="app-container app-content" variants={pageVariants} initial="initial" animate="animate" exit="exit">
    <div style={{ marginBottom: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Hallo, <span className="gradient-text">{profile.name || 'Speaker'}</span>! 👋</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Willkommen zurück in deinem Dojo.</p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
      <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--accent-purple)', fontSize: '2rem', marginBottom: '0.2rem' }}>Lvl 4</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Charisma</p>
      </div>
      <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--accent-blue)', fontSize: '2rem', marginBottom: '0.2rem' }}>3</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Day Streak</p>
      </div>
    </div>

    <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={20} color="var(--accent-purple)" /> Tagesaufgabe
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
        Absolviere 1x das "Smalltalk im Aufzug" Szenario mit weniger als 2 Füllwörtern.
      </p>
      <button className="btn-secondary" style={{ padding: '0.8rem' }}>Jetzt starten</button>
    </div>
  </motion.div>
);

// ==========================================
// 3. PROFILE SCREEN
// ==========================================
const ProfileScreen = ({ profile }) => (
  <motion.div className="app-container app-content" variants={pageVariants} initial="initial" animate="animate" exit="exit">
    <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Dein <span className="gradient-text">Profil</span></h2>
    
    <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={30} color="var(--accent-purple)" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>{profile.name}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{profile.role || 'Unbekannte Rolle'}</p>
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>Alter:</strong> {profile.age || '-'}</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}><strong>Hobbys:</strong> {profile.hobbies || '-'}</p>
      </div>
    </div>

    <div className="glass-panel">
      <h3 style={{ marginBottom: '1rem' }}>KI-Einstellungen</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Strenge des Coaches</span>
        <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>Mittel</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Unterbrechungen (Cut-ins)</span>
        <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>Aktiviert</span>
      </div>
    </div>
  </motion.div>
);


// ==========================================
// 4. TRAINING SCREENS (Arena, Recorder, Feedback)
// ==========================================
const ArenaSelector = ({ onStart }) => (
  <motion.div className="app-container app-content" variants={pageVariants} initial="initial" animate="animate" exit="exit">
    <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Die <span className="gradient-text">Arena</span></h2>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Wähle dein heutiges Trainings-Szenario.</p>

    <motion.div variants={staggerContainer} initial="initial" animate="animate" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <motion.button variants={staggerItem} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-secondary" style={{ textAlign: 'left', padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }} onClick={() => onStart('impromptu')}>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.8rem', borderRadius: '12px' }}><Mic size={24} color="var(--accent-blue)" /></div>
        <div>
          <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem', color: 'var(--text-primary)', fontWeight: '600' }}>Freies Sprechen</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>1 Minute zu einem Zufallsthema.</div>
        </div>
      </motion.button>
      
      <motion.button variants={staggerItem} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-secondary" style={{ textAlign: 'left', padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }} onClick={() => onStart('interview')}>
        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.8rem', borderRadius: '12px' }}><Briefcase size={24} color="var(--accent-purple)" /></div>
        <div>
          <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem', color: 'var(--text-primary)', fontWeight: '600' }}>HR Interview</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Die knallharte Bewerbungssimulation.</div>
        </div>
      </motion.button>
    </motion.div>
  </motion.div>
);

const RecorderScreen = ({ mode, onFinish, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timeMs, setTimeMs] = useState(0);
  const recognitionRef = useRef(null);
  
  const promptText = mode === 'impromptu' 
    ? "Rede 1 Minute über: 'Warum das Internet die beste und schlechteste Erfindung ist.'"
    : "HR-Manager: 'Erzählen Sie mir von einer Situation, in der Sie unter Druck arbeiten mussten.'";

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'de-DE';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript);
      };
      recognitionRef.current = recognition;
    } else {
      setTranscript("Dein Browser unterstützt leider keine Spracherkennung. (Nutze Chrome)");
    }
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); }
  }, []);

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
    if (isRecording) {
      interval = setInterval(() => setTimeMs(t => t + 1000), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <motion.div className="app-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: 'var(--bg-color)' }} variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <button style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }} onClick={onCancel}>
        <ChevronLeft size={20} /> Abbrechen
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-blue)', marginBottom: '0.8rem', fontWeight: '700' }}>
          {mode === 'impromptu' ? 'Impromptu Arena' : 'Interview Arena'}
        </div>
        <h2 style={{ fontSize: '1.3rem', lineHeight: '1.5', fontWeight: '500', padding: '0 1rem' }}>{promptText}</h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div 
          style={{ width: '150px', height: '150px', borderRadius: '50%', background: isRecording ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)', border: `2px solid ${isRecording ? 'var(--accent-purple)' : 'var(--glass-border)'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}
          animate={ isRecording ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 50px rgba(139, 92, 246, 0.4)', '0 0 0px rgba(139, 92, 246, 0)'] } : { scale: 1, boxShadow: 'none' } }
          transition={{ repeat: isRecording ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
        >
          <Mic size={50} color={isRecording ? "var(--accent-purple)" : "var(--text-secondary)"} />
        </motion.div>
        
        <div style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', fontWeight: '300', marginBottom: '1.5rem', letterSpacing: '2px' }}>{formatTime(timeMs)}</div>
        
        <p style={{ color: 'var(--text-secondary)', minHeight: '80px', textAlign: 'center', fontSize: '1rem', fontStyle: 'italic', padding: '0 2rem' }}>
          {transcript || (isRecording ? "Höre zu..." : "Drücke den Button um zu starten")}
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

const FeedbackScreen = ({ transcript, timeMs, onDone }) => {
  const fillers = countFillerWords(transcript);
  const seconds = Math.max(1, Math.floor(timeMs / 1000));
  const wpm = Math.round((transcript.split(/\s+/).filter(w => w.length > 0).length / seconds) * 60) || 0;
  let pacingStatus = "Perfekt";
  if (wpm < 100) pacingStatus = "Zu langsam";
  if (wpm > 160) pacingStatus = "Zu schnell";

  return (
    <motion.div className="app-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: 'var(--bg-color)', overflowY: 'auto' }} variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <h2 style={{ fontSize: '2.2rem', marginBottom: '2rem', textAlign: 'center', marginTop: '2rem' }}>Dein <span className="gradient-text">Feedback</span></h2>

      <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }} variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={staggerItem} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Activity size={24} color={fillers > 5 ? '#ef4444' : 'var(--accent-purple)'} style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Füllwörter</div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: '700', color: fillers > 5 ? '#ef4444' : 'var(--text-primary)' }}>{fillers}</div>
        </motion.div>
        
        <motion.div variants={staggerItem} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Gauge size={24} color="var(--accent-blue)" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tempo</div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--text-primary)' }}>{wpm}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pacingStatus}</div>
        </motion.div>
      </motion.div>

      <motion.div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.3)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
          <MessageSquare size={18} color="var(--accent-purple)" />
          <h3 style={{ color: 'var(--accent-purple)', fontSize: '1.1rem' }}>KI-Tipp</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {fillers > 3 ? "Tipp: Nutze bewusste Pausen statt Füllwörter." : "Super flüssig! Charismatischer Auftritt."}
        </p>
      </motion.div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-secondary" onClick={onDone} style={{ marginTop: 'auto', padding: '1.2rem' }}>
        <CheckCircle2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> Abschließen
      </motion.button>
    </motion.div>
  );
};

const TrainingFlow = () => {
  const [subScreen, setSubScreen] = useState('selector'); // selector, recorder, feedback
  const [mode, setMode] = useState('impromptu');
  const [session, setSession] = useState({ transcript: '', timeMs: 0 });

  return (
    <AnimatePresence mode="wait">
      {subScreen === 'selector' && (
        <ArenaSelector key="selector" onStart={(m) => { setMode(m); setSubScreen('recorder'); }} />
      )}
      {subScreen === 'recorder' && (
        <RecorderScreen key="recorder" mode={mode} onCancel={() => setSubScreen('selector')} onFinish={(t, ms) => { setSession({transcript: t, timeMs: ms}); setSubScreen('feedback'); }} />
      )}
      {subScreen === 'feedback' && (
        <FeedbackScreen key="feedback" transcript={session.transcript} timeMs={session.timeMs} onDone={() => setSubScreen('selector')} />
      )}
    </AnimatePresence>
  );
}

// ==========================================
// 5. MAIN APP (Router & Bottom Nav)
// ==========================================
const MainApp = ({ profile }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <DashboardScreen key="dashboard" profile={profile} />}
        {activeTab === 'training' && <TrainingFlow key="training" />}
        {activeTab === 'profile' && <ProfileScreen key="profile" profile={profile} />}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Home size={24} />
          <span>Home</span>
        </button>
        <button className={`nav-item ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>
          <Target size={24} />
          <span>Arena</span>
        </button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={24} />
          <span>Profil</span>
        </button>
      </div>

    </div>
  );
};

// ==========================================
// ROOT COMPONENT
// ==========================================
function App() {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const finishOnboarding = (profileData) => {
    setUserProfile(profileData);
    setHasOnboarded(true);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg-color)' }}>
      <AnimatePresence mode="wait">
        {!hasOnboarded ? (
          <OnboardingFlow key="onboarding" onComplete={finishOnboarding} />
        ) : (
          <MainApp key="main" profile={userProfile} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
