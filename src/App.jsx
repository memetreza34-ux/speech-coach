import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Briefcase, Play, Square, ChevronLeft, Activity, Gauge, MessageSquare, Zap } from 'lucide-react'
import './App.css'

// --- Simple Utility to count filler words ---
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

// --- Framer Motion Variants ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// --- Home Screen Component ---
const HomeScreen = ({ onStart }) => {
  return (
    <motion.div 
      className="app-container" 
      style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 0.6, ease: "backOut" }}
      >
        <Zap size={48} color="var(--accent-purple)" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '2.8rem', marginBottom: '0.5rem', fontWeight: '800' }}>
          Speech<span className="gradient-text">Coach</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>
          Meistere jede Rhetorik-Situation.
        </p>
      </motion.div>

      <motion.div 
        className="glass-panel" 
        style={{ width: '100%', marginBottom: '1.5rem', textAlign: 'left', padding: '2rem' }}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.h3 variants={staggerItem} style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Wähle deine Arena:</motion.h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.button 
            variants={staggerItem}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary" 
            style={{ textAlign: 'left', padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}
            onClick={() => onStart('impromptu')}
          >
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <Mic size={24} color="var(--accent-blue)" />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem', color: 'var(--text-primary)', fontWeight: '600' }}>Freies Sprechen (Impromptu)</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '400' }}>1 Minute zu einem zufälligen Thema reden.</div>
            </div>
          </motion.button>
          
          <motion.button 
            variants={staggerItem}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary" 
            style={{ textAlign: 'left', padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}
            onClick={() => onStart('interview')}
          >
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <Briefcase size={24} color="var(--accent-purple)" />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem', color: 'var(--text-primary)', fontWeight: '600' }}>HR-Manager Interview</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '400' }}>Knallharte Bewerbungssimulation.</div>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Recorder Screen Component ---
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
      console.warn("Speech Recognition API not supported in this browser.");
      setTranscript("Dein Browser unterstützt leider keine Spracherkennung. (Nutze Chrome)");
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
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
      interval = setInterval(() => {
        setTimeMs((prevTime) => prevTime + 1000);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="app-container" 
      style={{ position: 'relative' }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <button 
        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
        onClick={onCancel}
      >
        <ChevronLeft size={20} /> Zurück
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-blue)', marginBottom: '0.8rem', fontWeight: '700' }}>
          {mode === 'impromptu' ? 'Impromptu Arena' : 'Interview Arena'}
        </div>
        <h2 style={{ fontSize: '1.4rem', lineHeight: '1.5', fontWeight: '500' }}>{promptText}</h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Pulsating Visualizer */}
        <motion.div 
          style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: isRecording ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
            border: `2px solid ${isRecording ? 'var(--accent-purple)' : 'var(--glass-border)'}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '2.5rem'
          }}
          animate={
            isRecording 
              ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 50px rgba(139, 92, 246, 0.4)', '0 0 0px rgba(139, 92, 246, 0)'] } 
              : { scale: 1, boxShadow: 'none' }
          }
          transition={{ repeat: isRecording ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
        >
          <Mic size={50} color={isRecording ? "var(--accent-purple)" : "var(--text-secondary)"} />
        </motion.div>
        
        <div style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', fontWeight: '300', marginBottom: '1.5rem', letterSpacing: '2px' }}>
          {formatTime(timeMs)}
        </div>
        
        <p style={{ color: 'var(--text-secondary)', minHeight: '80px', textAlign: 'center', fontSize: '1rem', fontStyle: 'italic', padding: '0 2rem' }}>
          {transcript || (isRecording ? "Höre zu..." : "Drücke den Button um zu starten")}
        </p>
      </div>

      <div style={{ marginTop: 'auto', marginBottom: '1rem' }}>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary" 
          style={{ 
            background: isRecording ? '#ef4444' : '', 
            boxShadow: isRecording ? '0 4px 20px rgba(239, 68, 68, 0.4)' : '',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onClick={toggleRecording}
        >
          {isRecording ? <><Square size={20} fill="currentColor" /> Aufnahme beenden</> : <><Play size={20} fill="currentColor" /> Starten</>}
        </motion.button>
      </div>
    </motion.div>
  );
};

// --- Feedback Screen Component ---
const FeedbackScreen = ({ transcript, timeMs, onHome }) => {
  const fillers = countFillerWords(transcript);
  const seconds = Math.max(1, Math.floor(timeMs / 1000));
  const wpm = Math.round((transcript.split(/\s+/).filter(w => w.length > 0).length / seconds) * 60) || 0;
  
  let pacingStatus = "Perfekt";
  if (wpm < 100) pacingStatus = "Etwas zu langsam";
  if (wpm > 160) pacingStatus = "Zu schnell (Gehetzt)";

  return (
    <motion.div 
      className="app-container" 
      style={{ overflowY: 'auto', paddingBottom: '2rem' }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <h2 style={{ fontSize: '2.2rem', marginBottom: '2rem', textAlign: 'center' }}>
        Dein <span className="gradient-text">Feedback</span>
      </h2>

      <motion.div 
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Activity size={24} color={fillers > 5 ? '#ef4444' : 'var(--accent-purple)'} style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Füllwörter</div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: '700', color: fillers > 5 ? '#ef4444' : 'var(--text-primary)' }}>
            {fillers}
          </div>
        </motion.div>
        
        <motion.div variants={staggerItem} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Gauge size={24} color="var(--accent-blue)" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tempo</div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--text-primary)' }}>
            {wpm}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{pacingStatus}</div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="glass-panel" 
        style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
          <MessageSquare size={18} color="var(--accent-purple)" />
          <h3 style={{ color: 'var(--accent-purple)', fontSize: '1.1rem' }}>KI-Tipp</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {fillers > 3 
            ? "Du hast einige Füllwörter benutzt. Versuche anstelle eines 'Ähms' lieber eine bewusste 1-sekündige Pause zu machen. Das wirkt extrem souverän!" 
            : "Super! Du sprichst sehr flüssig und nutzt kaum Füllwörter. Ein charismatischer Auftritt."}
        </p>
      </motion.div>

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-secondary" 
        onClick={onHome} 
        style={{ marginTop: 'auto', padding: '1.2rem' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Zurück zur Arena
      </motion.button>
    </motion.div>
  );
};

// --- Main App ---
function App() {
  const [screen, setScreen] = useState('home'); // 'home', 'recorder', 'feedback'
  const [mode, setMode] = useState('impromptu');
  const [sessionData, setSessionData] = useState({ transcript: '', timeMs: 0 });

  const handleStart = (selectedMode) => {
    setMode(selectedMode);
    setScreen('recorder');
  };

  const handleFinish = (transcript, timeMs) => {
    setSessionData({ transcript, timeMs });
    setScreen('feedback');
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {screen === 'home' && <HomeScreen key="home" onStart={handleStart} />}
        {screen === 'recorder' && (
          <RecorderScreen 
            key="recorder"
            mode={mode} 
            onFinish={handleFinish} 
            onCancel={() => setScreen('home')} 
          />
        )}
        {screen === 'feedback' && (
          <FeedbackScreen 
            key="feedback"
            transcript={sessionData.transcript} 
            timeMs={sessionData.timeMs}
            onHome={() => setScreen('home')} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
