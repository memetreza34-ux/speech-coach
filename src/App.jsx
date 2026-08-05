import { useState, useEffect, useRef } from 'react'
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

// --- Home Screen Component ---
const HomeScreen = ({ onStart }) => {
  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
        Speech<span className="gradient-text">Coach</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
        Meistere jede Rhetorik-Situation.
      </p>

      <div className="glass-panel" style={{ width: '100%', marginBottom: '1.5rem', textAlign: 'left' }}>
        <h3 style={{ marginBottom: '1rem' }}>Wähle deinen Modus:</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            className="btn-secondary" 
            style={{ textAlign: 'left', padding: '1rem' }}
            onClick={() => onStart('impromptu')}
          >
            <div style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>🎙️ Freies Sprechen (Impromptu)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '400' }}>1 Minute zu einem zufälligen Thema reden.</div>
          </button>
          
          <button 
            className="btn-secondary" 
            style={{ textAlign: 'left', padding: '1rem' }}
            onClick={() => onStart('interview')}
          >
            <div style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: 'var(--accent-purple)' }}>👔 HR-Manager Interview</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '400' }}>Simuliertes Bewerbungsgespräch.</div>
          </button>
        </div>
      </div>
    </div>
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
    // Check for browser support
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
      // Fallback for browsers without support
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

  // Timer logic
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
    <div className="app-container" style={{ position: 'relative' }}>
      <button 
        style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
        onClick={onCancel}
      >
        ← Zurück
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-blue)', marginBottom: '0.5rem', fontWeight: '600' }}>
          {mode === 'impromptu' ? 'Impromptu Mode' : 'Interview Mode'}
        </div>
        <h2 style={{ fontSize: '1.4rem', lineHeight: '1.4' }}>{promptText}</h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className={`visualizer ${isRecording ? 'recording' : ''}`} style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: isRecording ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
          border: `2px solid ${isRecording ? 'var(--accent-purple)' : 'var(--glass-border)'}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: isRecording ? '0 0 40px rgba(139, 92, 246, 0.4)' : 'none',
          transition: 'all 0.3s ease',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '2.5rem', opacity: isRecording ? 1 : 0.5 }}>
            {isRecording ? '🎙️' : 'Ready'}
          </div>
        </div>
        
        <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: '300', marginBottom: '1rem' }}>
          {formatTime(timeMs)}
        </div>
        
        <p style={{ color: 'var(--text-secondary)', minHeight: '60px', textAlign: 'center', fontSize: '0.9rem', fontStyle: 'italic', padding: '0 1rem' }}>
          {transcript || (isRecording ? "Höre zu..." : "Drücke den Button um zu starten")}
        </p>
      </div>

      <div style={{ marginTop: 'auto', marginBottom: '1rem' }}>
        <button 
          className="btn-primary" 
          style={{ background: isRecording ? '#ef4444' : '', boxShadow: isRecording ? '0 4px 20px rgba(239, 68, 68, 0.4)' : '' }}
          onClick={toggleRecording}
        >
          {isRecording ? '⏹ Aufnahme beenden' : '⏺ Starten'}
        </button>
      </div>
    </div>
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
    <div className="app-container" style={{ overflowY: 'auto' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        Dein <span className="gradient-text">Feedback</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Füllwörter</div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', color: fillers > 5 ? '#ef4444' : 'var(--accent-purple)' }}>
            {fillers}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Erkannt</div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sprechtempo</div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-blue)' }}>
            {wpm}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>WPM ({pacingStatus})</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--accent-purple)' }}>Transkript:</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
          {transcript ? `"${transcript}"` : "Keine Sprache erkannt."}
        </p>
      </div>
      
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>KI-Tipp</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {fillers > 3 
            ? "Du hast einige Füllwörter benutzt. Versuche anstelle eines 'Ähms' lieber eine bewusste 1-sekündige Pause zu machen. Das wirkt charismatischer!" 
            : "Super! Du sprichst sehr flüssig und nutzt kaum Füllwörter. Arbeite als Nächstes an mehr Emotion in deiner Stimme."}
        </p>
      </div>

      <button className="btn-secondary" onClick={onHome} style={{ marginTop: 'auto' }}>
        Zurück zum Start
      </button>
    </div>
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
    <>
      {screen === 'home' && <HomeScreen onStart={handleStart} />}
      {screen === 'recorder' && (
        <RecorderScreen 
          mode={mode} 
          onFinish={handleFinish} 
          onCancel={() => setScreen('home')} 
        />
      )}
      {screen === 'feedback' && (
        <FeedbackScreen 
          transcript={sessionData.transcript} 
          timeMs={sessionData.timeMs}
          onHome={() => setScreen('home')} 
        />
      )}
    </>
  );
}

export default App;
