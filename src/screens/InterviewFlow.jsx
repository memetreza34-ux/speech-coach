import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, ChevronLeft, Volume2, User, RefreshCcw } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useRecorder } from '../useRecorder';
import { getPromptForMode, modeTitle, MODES } from '../utils/speech';
import { auth, db } from '../lib/firebase';
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore';

export default function InterviewFlow() {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { addToast } = useToast();
  
  // Premium Guard
  useEffect(() => {
    const modeConfig = MODES.find(m => m.id === modeId);
    if (modeConfig?.isPremium && !profile?.isPremium) {
      navigate('/paywall', { replace: true });
    }
  }, [modeId, profile, navigate]);

  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [failedTurnContext, setFailedTurnContext] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [sessionMetrics, setSessionMetrics] = useState({
    totalDurationMs: 0,
    totalPauseCount: 0,
    maxPauseMs: 0,
    weightedSpeakingRatioSum: 0,
    weightedDynamicsSum: 0,
    turnCount: 0,
    totalWords: 0
  });
  
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

  const sendTurn = async (chatHistory, currentMetrics = sessionMetrics) => {
    setIsProcessing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          mode: modeId,
          messages: chatHistory,
          profile,
          customPrompt: `${modeTitle(modeId)} - ${getPromptForMode(modeId)}`,
          frames: frames?.length ? frames : undefined
        })
      });
            if (response.ok) {
        setFailedTurnContext(null);
        const data = await response.json();
        
        // Add AI response to messages
        setMessages(prev => [...prev, { role: 'model', text: data.interviewerSpeech }]);
        if (data.feedback) setFeedback(data.feedback);
        
        // Read out loud
        speakText(data.interviewerSpeech);
        
        if (data.isFinished) {
          // Final Evaluation via /api/analyze
          const completeHistory = [...chatHistory, { role: 'model', text: data.interviewerSpeech }];
          const finalTranscript = completeHistory.filter(m => m.text !== 'Wir starten jetzt. Stelle dich als Interviewer vor und stelle die allererste Frage.').map(m => `${m.role === 'user' ? 'Du' : 'Interviewer'}: ${m.text}`).join('\n\n');
          
          const finalWpm = currentMetrics.totalDurationMs > 0 ? Math.round((currentMetrics.totalWords / (currentMetrics.totalDurationMs / 1000 / 60))) : 0;
          
          const finalSpeakingRatio = currentMetrics.totalDurationMs > 0 
            ? Math.round(currentMetrics.weightedSpeakingRatioSum / currentMetrics.totalDurationMs)
            : 0;
          
          const finalDynamics = currentMetrics.totalDurationMs > 0
            ? Math.round(currentMetrics.weightedDynamicsSum / currentMetrics.totalDurationMs)
            : 0;

          const finalMetrics = {
             wpm: finalWpm || 0,
             pauseCount: currentMetrics.totalPauseCount || 0,
             longestPauseMs: currentMetrics.maxPauseMs || 0,
             speakingRatio: finalSpeakingRatio || 0,
             dynamics: finalDynamics || 0,
             durationMs: currentMetrics.totalDurationMs || 0
          };

          let aiFeedback = null;
          let aiStatus = 'not_available';
          try {
             const analyzeRes = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                  mode: modeId,
                  transcript: finalTranscript || "Keine Antwort gegeben.",
                  metrics: finalMetrics,
                  profile,
                  customPrompt: "Bewerte das Live-Interview abschließend und gib einen Gesamt-Score."
                })
             });
             if (analyzeRes.ok) {
                 aiFeedback = await analyzeRes.json();
                 aiStatus = 'success';
             } else {
                 let errBody = null;
                 try { errBody = await analyzeRes.json(); } catch(e) {}
                 
                 if (analyzeRes.status === 429) aiStatus = 'quota_exceeded';
                 else if (analyzeRes.status === 504) aiStatus = 'timeout';
                 else if (analyzeRes.status === 502) {
                     aiStatus = errBody?.error?.includes('Upstream') ? 'upstream_error' : 'invalid_response';
                 }
                 else aiStatus = 'server_error';
             }
          } catch(e) {
             console.error("Evaluation error", e);
             aiStatus = 'server_error';
          }
          
          // Save session
          if (auth.currentUser) {
            const sessionRef = doc(collection(db, 'users', auth.currentUser.uid, 'sessions'));
            await setDoc(sessionRef, {
              mode: modeId,
              modeLabel: modeTitle(modeId),
              date: new Date().toISOString(),
              createdAt: serverTimestamp(),
              sessionType: 'interview',
              fillers: aiFeedback?.fillers ?? null,
              confidenceScore: aiFeedback?.confidenceScore ?? null,
              aiTip: aiFeedback?.aiTip ?? null,
              aiStatus: aiStatus,
              wpm: finalMetrics.wpm,
              dynamics: finalMetrics.dynamics,
              speakingRatio: finalMetrics.speakingRatio,
              pauseCount: finalMetrics.pauseCount,
              longestPauseMs: finalMetrics.longestPauseMs,
              durationMs: finalMetrics.durationMs,
              transcript: finalTranscript
            }).catch(console.error);
          }
          setTimeout(() => navigate('/dashboard'), 5000);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        let errMsg = 'Ein Fehler ist aufgetreten.';
        if (response.status === 429) errMsg = 'Dein tägliches Live-Interview-Limit ist erreicht.';
        else if (response.status === 403) errMsg = 'Live-Interviews erfordern ein Premium-Abonnement.';
        else if (response.status === 504) errMsg = 'Die KI antwortet gerade nicht. Versuche es erneut.';
        else if (response.status === 500 || response.status === 502) errMsg = errData.error || 'Verbindung fehlgeschlagen.';
        
        addToast(errMsg, 'error');
        setFailedTurnContext(chatHistory);
      }
    } catch (e) {
      console.error(e);
      addToast('Verbindung fehlgeschlagen. Versuche es erneut.', 'error');
      setFailedTurnContext(chatHistory);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      const userText = recording.transcript || "(Keine hörbare Antwort)";
      const words = userText.trim().split(/\s+/).filter(w => w.length > 0).length;
      
      const updatedMetrics = {
        totalDurationMs: sessionMetrics.totalDurationMs + recording.durationMs,
        totalPauseCount: sessionMetrics.totalPauseCount + recording.pauseCount,
        maxPauseMs: Math.max(sessionMetrics.maxPauseMs, recording.longestPauseMs),
        weightedSpeakingRatioSum: sessionMetrics.weightedSpeakingRatioSum + (recording.speakingRatio * recording.durationMs),
        weightedDynamicsSum: sessionMetrics.weightedDynamicsSum + (recording.dynamics * recording.durationMs),
        turnCount: sessionMetrics.turnCount + 1,
        totalWords: sessionMetrics.totalWords + words
      };
      setSessionMetrics(updatedMetrics);

      const newHistory = [...messages, { role: 'user', text: userText }];
      setMessages(newHistory);
      await sendTurn(newHistory, updatedMetrics);
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
          {feedback && !isRecording && !isProcessing && !failedTurnContext && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
              <div className="text-[10px] font-bold text-amber-800 tracking-widest uppercase mb-1">Coach-Tipp zur letzten Antwort</div>
              <p className="text-sm text-amber-900 font-medium leading-relaxed">{feedback}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Controls */}
        <div className="shrink-0 flex flex-col items-center">
          {failedTurnContext ? (
            <button
              onClick={() => sendTurn(failedTurnContext)}
              disabled={isProcessing}
              className={`w-auto px-6 h-14 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg font-bold ${isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-700 hover:scale-105'}`}
            >
              <RefreshCcw size={20} />
              Erneut versuchen
            </button>
          ) : (
            <button
              onClick={handleToggleRecording}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : isRecording ? 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'}`}
            >
              {isRecording ? <Square size={28} /> : <Mic size={32} />}
            </button>
          )}
          <div className="mt-4 text-xs font-medium text-slate-500 uppercase tracking-widest">
            {isProcessing ? 'Bitte warten' : failedTurnContext ? 'Übertragung fehlgeschlagen' : isRecording ? 'Tippe zum Beenden' : 'Antwort aufnehmen'}
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
