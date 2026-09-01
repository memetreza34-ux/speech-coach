import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Briefcase, Play, Square, ChevronLeft, Activity, Gauge, MessageSquare, Zap, Home, Target, User, ArrowRight, CheckCircle2, Heart, Globe, DollarSign, Key, Loader2 } from 'lucide-react'
import './App.css'

// --- Utility: AI Analysis ---
const analyzeTranscript = async (transcript, mode, profile, apiKey) => {
  if (!apiKey) {
    // Fallback Fake-AI if no key provided
    return new Promise(resolve => setTimeout(() => {
      resolve({
        fillers: (transcript.match(/ähm|also|sozusagen|quasi|halt|genau/gi) || []).length,
        wpm: 120,
        pacingStatus: "Gut",
        aiTip: "Du hast noch keinen API-Key hinterlegt. Das ist eine Dummy-Analyse. Füge deinen Gemini API-Key im Profil hinzu, um echte Magie zu erleben!"
      });
    }, 1500));
  }

  const prompt = `Du bist ein professioneller Kommunikationstrainer. Analysiere das folgende Transkript eines Nutzers. 
Nutzer-Profil: Name: ${profile.name}, Rolle: ${profile.role}, Alter: ${profile.age}, Hobbys: ${profile.hobbies}.
Szenario-Modus: ${mode}.
Transkript: "${transcript}"

Gib DEINE ANTWORT EXAKT als JSON-Objekt (ohne Markdown-Formatierung) mit folgenden Schlüsseln zurück:
"fillers" (Anzahl der Füllwörter als Zahl),
"wpm" (Geschätzte Wörter pro Minute als Zahl, nimm an die Aufnahme dauerte 60 Sekunden),
"pacingStatus" (Ein kurzes Wort zum Tempo: "Zu langsam", "Perfekt", oder "Zu schnell"),
"aiTip" (Ein 2-Satz Tipp, spezifisch auf den Inhalt des Transkripts, das Szenario und die Hobbys/Rolle des Nutzers bezogen).`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return JSON.parse(resultText);
  } catch (e) {
    console.error("AI Error:", e);
    return { fillers: 0, wpm: 0, pacingStatus: "Fehler", aiTip: "Fehler bei der KI-Analyse. Bitte überprüfe deinen API-Key." };
  }
};

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
  </motion.div>
);

// ==========================================
// 3. PROFILE SCREEN
// ==========================================
const ProfileScreen = ({ profile, apiKey, setApiKey }) => (
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
    </div>

    <div className="glass-panel" style={{ border: apiKey ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)' }}>
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Key size={18} color={apiKey ? "var(--accent-blue)" : "#ef4444"} /> Gemini API Key
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Ohne API-Key nutzt die App eine Dummy-Analyse. Füge deinen Key ein, um die echte KI zu aktivieren (wird nur lokal gespeichert).
      </p>
      <input 
        type="password" 
        className="input-field" 
        placeholder="AIzaSy..." 
        value={apiKey}
        onChange={e => setApiKey(e.target.value)}
        style={{ marginBottom: 0 }}
      />
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
      <h2 style={{ fontSize: '2.2rem', marginBottom: '2rem', textAlign: 'center', marginTop: '2rem' }}>KI <span className="gradient-text">Feedback</span></h2>

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

const TrainingFlow = ({ profile, apiKey }) => {
  const [subScreen, setSubScreen] = useState('selector'); // selector, recorder, loading, feedback
  const [mode, setMode] = useState('impromptu');
  const [analysisData, setAnalysisData] = useState(null);

  const handleFinishRecording = async (transcript, timeMs) => {
    setSubScreen('loading');
    const result = await analyzeTranscript(transcript, mode, profile, apiKey);
    setAnalysisData(result);
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
const MainApp = ({ profile, apiKey, setApiKey }) => {
  const [activeTab, setActiveTab] = useState('training');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <DashboardScreen key="dashboard" profile={profile} />}
        {activeTab === 'training' && <TrainingFlow key="training" profile={profile} apiKey={apiKey} />}
        {activeTab === 'profile' && <ProfileScreen key="profile" profile={profile} apiKey={apiKey} setApiKey={setApiKey} />}
      </AnimatePresence>

      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><Home size={24} /><span>Home</span></button>
        <button className={`nav-item ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}><Target size={24} /><span>Arena</span></button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><User size={24} /><span>Profil</span></button>
      </div>
    </div>
  );
};

function App() {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  // Persist API Key in localStorage
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  useEffect(() => { localStorage.setItem('gemini_api_key', apiKey); }, [apiKey]);

  const finishOnboarding = (profileData) => {
    setUserProfile(profileData);
    setHasOnboarded(true);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg-color)' }}>
      <AnimatePresence mode="wait">
        {!hasOnboarded ? <OnboardingFlow key="onboarding" onComplete={finishOnboarding} /> : <MainApp key="main" profile={userProfile} apiKey={apiKey} setApiKey={setApiKey} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
