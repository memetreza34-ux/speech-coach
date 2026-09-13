import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, ChevronLeft, Volume2, User } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRecorder } from '../useRecorder';
import { getPromptForMode, modeTitle, MODES } from '../utils/speech';
import { auth, db } from '../lib/firebase';
import { doc, collection, setDoc } from 'firebase/firestore';

export default function InterviewFlow() {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Premium Guard
  useEffect(() => {
    const modeConfig = MODES.find(m => m.id === modeId);
    if (modeConfig?.isPremium && !profile?.isPremium) {
      navigate('/paywall', { replace: true });
    }
  }, [modeId, profile, navigate]);

  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  const [useVideo, setUseVideo] = useState(false);
  const videoRef = useRef(null);
  const [frames, setFrames] = useState([]);
  const frameIntervalRef = useRef(null);

  const { isRecording, transcript, start, stop, stream } = useRecorder('de-DE', useVideo);

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (isRecording && useVideo && stream) {
      frameIntervalRef.current = setInterval(() => {
        if (videoRef.current && frames.length < 5) {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.6);
          setFrames(prev => prev.length < 5 ? [...prev, base64] : prev);
        }
      }, 8000);
    } else {
      clearInterval(frameIntervalRef.current);
    }
    return () => clearInterval(frameIntervalRef.current);
  }, [isRecording, useVideo, stream, frames.length]);

  const sendTurn = async (chatHistory) => {
    setIsProcessing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          messages: chatHistory,
          profile,
          customPrompt: `${modeTitle(modeId)} - ${getPromptForMode(modeId)}`,
          frames: frames.length > 0 ? frames : undefined
        })
      });
      if (response.ok) {
        const data = await response.json();
        
        // Add AI response to messages
        setMessages(prev => [...prev, { role: 'model', text: data.interviewerSpeech }]);
        if (data.feedback) setFeedback(data.feedback);
        
        // Read out loud
        speakText(data.interviewerSpeech);
        
        if (data.isFinished) {
          // Save session
          if (auth.currentUser) {
            const sessionRef = doc(collection(db, 'users', auth.currentUser.uid, 'sessions'));
            await setDoc(sessionRef, {
              mode: modeId,
              modeLabel: modeTitle(modeId),
              date: new Date().toISOString(),
              fillers: 0, // No specific fillers counted for interview yet
              wpm: 130, // Mock wpm for interview
              confidenceScore: 85, // Mock score for now
              transcript: chatHistory.map(m => `${m.role === 'user' ? 'Du' : 'Interviewer'}: ${m.text}`).join('\n')
            }).catch(console.error);
          }
          setTimeout(() => navigate('/dashboard'), 5000);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
      setFrames([]); // reset frames for next turn
    }
  };

  const startInterview = async () => {
    setIsProcessing(true);
    const initialContext = `Wir starten jetzt. Stelle dich als Interviewer vor und stelle die allererste Frage.`;
    await sendTurn([{ role: 'user', text: initialContext }]);
  };

  // Initial greeting
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startInterview();
    }
  }, []);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      const recording = await stop();
      // User finished speaking, add user message and send to API
      const userText = recording.transcript || "(Unverständliche Antwort)";
      const newHistory = [...messages, { role: 'user', text: userText }];
      setMessages(newHistory);
      await sendTurn(newHistory);
    } else {
      setFrames([]);
      await start();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-2xl px-6 pt-12 pb-24 flex flex-col h-screen">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 text-sm font-medium">
            <ChevronLeft size={18} /> Zurück
          </button>
          <div className="text-xs font-bold text-indigo-600 tracking-widest uppercase">Live-Interview</div>
          <button 
            onClick={() => {
              if (!profile?.isPremium) {
                navigate('/paywall');
                return;
              }
              setUseVideo(v => !v);
            }}
            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border-2 transition-colors ${useVideo ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400 hover:border-amber-300'}`}
          >
            Kamera {useVideo ? 'AN' : 'AUS'} {!profile?.isPremium && '(Pro)'}
          </button>
        </div>

        {useVideo && (
          <div className="w-full h-32 md:h-48 bg-slate-200 rounded-xl overflow-hidden relative mb-6 shadow-inner border border-slate-300 shrink-0">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!stream && <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Kamera wird gestartet...</div>}
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-6 mb-6 px-2">
          <AnimatePresence>
            {messages.filter(m => m.role === 'model' || m.text !== 'Wir starten jetzt. Stelle dich als Interviewer vor und stelle die allererste Frage.').map((msg, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i}
                className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                    {msg.role === 'user' ? <User size={12} /> : <Volume2 size={12} />}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {msg.role === 'user' ? 'Du' : 'Interviewer'}
                  </span>
                </div>
                <div className={`px-5 py-3 rounded-2xl text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start flex items-center gap-2 text-slate-400 text-sm py-4">
                <Loader2 className="animate-spin" size={16} /> Interviewer denkt nach...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feedback Snippet */}
        <AnimatePresence>
          {feedback && !isRecording && !isProcessing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
              <div className="text-[10px] font-bold text-amber-800 tracking-widest uppercase mb-1">Coach-Tipp zur letzten Antwort</div>
              <p className="text-sm text-amber-900 font-medium leading-relaxed">{feedback}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Controls */}
        <div className="shrink-0 flex flex-col items-center">
          <button
            onClick={handleToggleRecording}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : isRecording ? 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'}`}
          >
            {isRecording ? <Square size={28} /> : <Mic size={32} />}
          </button>
          <div className="mt-4 text-xs font-medium text-slate-500 uppercase tracking-widest">
            {isProcessing ? 'Bitte warten' : isRecording ? 'Tippe zum Beenden' : 'Antwort aufnehmen'}
          </div>
          {isRecording && (
            <div className="mt-4 w-full max-w-sm px-6 text-center text-sm text-slate-400 italic truncate">
              "{transcript || 'Höre zu...'}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
