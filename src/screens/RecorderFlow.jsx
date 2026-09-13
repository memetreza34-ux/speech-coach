import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, ChevronLeft, Mic, Loader2, Check } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecorder, getDynamicsLabel } from '../useRecorder';
import { analyzeTranscript, getPromptForMode, getLocaleForMode, modeTitle, MODES } from '../utils/speech';
import { HighlightedTranscript } from '../components/HighlightedTranscript';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, collection, setDoc } from 'firebase/firestore';

const BAR_COUNT = 21;
const barScale = (i) => 1 - (Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2)) * 0.7;

const MetricCard = ({ label, value, hint, alert }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
    <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">{label}</div>
    <div className={`text-4xl font-serif mb-1 ${alert ? 'text-red-500' : 'text-slate-900'}`}>{value}</div>
    {hint && <div className="text-xs text-slate-500">{hint}</div>}
  </div>
);

const renderAiTip = (aiTip) => {
  if (!aiTip) return null;
  if (typeof aiTip === 'string') {
    return <p className="text-sm text-indigo-900 leading-relaxed">{aiTip}</p>;
  }
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase mb-1">Zusammenfassung</div>
        <p className="text-sm text-indigo-900 leading-relaxed">{aiTip.summary}</p>
      </div>
      <div>
        <div className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase mb-1">Stärken</div>
        <p className="text-sm text-indigo-900 leading-relaxed">{aiTip.strengths}</p>
      </div>
      <div>
        <div className="text-[10px] font-bold text-rose-600 tracking-widest uppercase mb-1">Verbesserungspotenzial</div>
        <p className="text-sm text-indigo-900 leading-relaxed">{aiTip.improvements}</p>
      </div>
      <div className="bg-white/60 rounded-xl p-4 border border-indigo-100 mt-2">
        <div className="text-[10px] font-bold text-indigo-800 tracking-widest uppercase mb-1">Tipp fürs nächste Mal</div>
        <p className="text-sm text-indigo-900 font-medium leading-relaxed">{aiTip.actionTip}</p>
      </div>
      {aiTip.bodyLanguage && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mt-2">
          <div className="text-[10px] font-bold text-amber-800 tracking-widest uppercase mb-1">Körpersprache & Blickkontakt (Pro)</div>
          <p className="text-sm text-amber-900 font-medium leading-relaxed">{aiTip.bodyLanguage}</p>
        </div>
      )}
    </div>
  );
};

export const RecorderFlow = () => {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  
  // Premium Guard
  useEffect(() => {
    const modeConfig = MODES.find(m => m.id === modeId);
    if (modeConfig?.isPremium && !profile?.isPremium) {
      navigate('/paywall', { replace: true });
    }
  }, [modeId, profile, navigate]);

  const [subScreen, setSubScreen] = useState('recorder');
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('coach'); // 'coach' | 'transcript'
  
  const [useVideo, setUseVideo] = useState(false);
  const videoRef = React.useRef(null);
  const [frames, setFrames] = useState([]);
  const frameIntervalRef = React.useRef(null);
  
  const isCustom = modeId.startsWith('custom_');
  const customModeData = isCustom ? profile?.customModes?.find(m => m.id === modeId) : null;
  
  const displayTitle = customModeData ? customModeData.title : modeTitle(modeId);
  const displayPrompt = customModeData ? customModeData.prompt : getPromptForMode(modeId);
  
  const locale = getLocaleForMode(modeId);
  const { isRecording, transcript, level, error, start, stop, stream } = useRecorder(locale, useVideo);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setElapsedMs(t => t + 100), 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (isRecording && useVideo && stream) {
      frameIntervalRef.current = setInterval(() => {
        if (videoRef.current && frames.length < 5) { // max 5 frames to save payload
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.6);
          setFrames(prev => prev.length < 5 ? [...prev, base64] : prev);
        }
      }, 8000); // 1 frame every 8 seconds
    } else {
      clearInterval(frameIntervalRef.current);
    }
    return () => clearInterval(frameIntervalRef.current);
  }, [isRecording, useVideo, stream, frames.length]);

  const toggleRecording = async () => {
    if (isRecording) {
      const recording = await stop();
      setSubScreen('loading');
      
      const result = await analyzeTranscript({ ...recording, frames }, modeId, profile);
      const fullResult = { ...result, audioUrl: recording.audioUrl, transcript: recording.transcript };
      setAnalysisData(fullResult);
      
      // Save to Firebase
      if (user) {
        const sessionRef = doc(collection(db, 'users', user.uid, 'sessions'));
        await setDoc(sessionRef, {
          mode: modeId,
          modeLabel: displayTitle,
          date: new Date().toISOString(),
          fillers: result.fillers,
          wpm: result.wpm,
          pacingStatus: result.pacingStatus,
          pauseCount: result.pauseCount,
          dynamics: result.dynamics,
          speakingRatio: result.speakingRatio,
          confidenceScore: result.confidenceScore || 0,
          aiTip: result.aiTip,
          transcript: recording.transcript // Now saving transcript!
        });
      }
      
      setSubScreen('feedback');
    } else {
      setElapsedMs(0);
      await start();
    }
  };

  const finishFeedback = () => {
    if (analysisData?.audioUrl) URL.revokeObjectURL(analysisData.audioUrl);
    navigate('/arena');
  };

  const seconds = Math.floor(elapsedMs / 1000);
  const timeLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <AnimatePresence mode="wait">
      {subScreen === 'recorder' && (
        <motion.div key="rec" className="fixed inset-0 z-50 bg-white flex flex-col px-6 py-10" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <div className="max-w-md mx-auto w-full flex flex-col h-full">
            <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-10 transition-colors w-max" onClick={() => navigate(-1)}>
              <ChevronLeft size={18} strokeWidth={2.5} /> Abbrechen
            </button>
            <div className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-3">{displayTitle}</div>
            <p className="text-xl font-serif text-slate-900 leading-relaxed mb-4">{displayPrompt}</p>

            <div className="flex justify-end mb-4">
              <button 
                onClick={() => {
                  if (profile?.isPremium) {
                    setUseVideo(v => !v);
                  } else {
                    navigate('/paywall');
                  }
                }}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border-2 transition-colors ${useVideo ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
              >
                Kamera {useVideo ? 'AN' : 'AUS'} {profile?.isPremium ? '' : '(Pro)'}
              </button>
            </div>

            {useVideo && (
              <div className="w-full aspect-video bg-slate-200 rounded-xl overflow-hidden relative mb-6 shadow-inner border border-slate-300">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {!stream && <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Kamera wird gestartet...</div>}
              </div>
            )}

            <div className="flex-1 flex flex-col justify-center items-center">
              <div className={`text-6xl font-serif tracking-tight mb-12 transition-colors ${isRecording ? 'text-indigo-600' : 'text-slate-300'}`}>{timeLabel}</div>
              <div className="flex items-end justify-center gap-1.5 h-24 mb-10">
                {Array.from({ length: BAR_COUNT }, (_, i) => {
                  const scaled = level * barScale(i);
                  return (
                    <div key={i} className={`w-1.5 rounded-full transition-all duration-100 ease-linear ${isRecording && scaled > 0.05 ? 'bg-indigo-500' : 'bg-slate-100'}`} style={{ height: `${8 + (isRecording ? scaled * 88 : 0)}px` }} />
                  );
                })}
              </div>
              <p className={`text-center text-sm leading-relaxed px-4 min-h-[5rem] ${error ? 'text-red-500' : 'text-slate-500'}`}>
                {error || transcript || (isRecording ? 'Aufnahme läuft …' : 'Drücke Start, wenn du bereit bist.')}
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.98 }} className={`mt-auto w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-medium transition-colors ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`} onClick={toggleRecording}>
              {isRecording ? <><Square size={18} fill="currentColor" /> Beenden</> : <><Mic size={18} strokeWidth={2.5} /> Starten</>}
            </motion.button>
          </div>
        </motion.div>
      )}

      {subScreen === 'loading' && (
        <motion.div key="load" className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="mb-6">
            <Loader2 size={40} className="text-indigo-600" strokeWidth={2} />
          </motion.div>
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Auswertung läuft</div>
        </motion.div>
      )}

      {subScreen === 'feedback' && analysisData && (
        <motion.div key="feed" className="fixed inset-0 z-50 bg-slate-50 flex flex-col px-6 py-10 overflow-y-auto" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <div className="max-w-md mx-auto w-full flex flex-col min-h-full">
            <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Auswertung</div>
            <h2 className="text-3xl font-serif text-slate-900 mb-6">Deine <span className="text-indigo-600 italic">Werte</span></h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <MetricCard label="Score" value={analysisData.confidenceScore || 0} hint="Souveränität (0-100)" alert={analysisData.confidenceScore < 50} />
              <MetricCard label="Tempo" value={analysisData.wpm} hint={`WPM · ${analysisData.pacingStatus}`} />
              <MetricCard label="Füllwörter" value={analysisData.fillers} alert={analysisData.fillers > 5} />
              <MetricCard label="Pausen" value={analysisData.pauseCount ?? 0} hint={analysisData.longestPauseMs ? `längste ${(analysisData.longestPauseMs / 1000).toFixed(1)}s` : null} />
            </div>
            
            {analysisData.audioUrl && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
                <audio controls src={analysisData.audioUrl} className="w-full h-10" />
              </div>
            )}

            <div className="flex bg-slate-200/50 p-1 rounded-xl mb-4">
              <button 
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'coach' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('coach')}
              >
                KI Coach
              </button>
              <button 
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'transcript' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('transcript')}
              >
                Transkript
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
              {activeTab === 'coach' ? (
                <>
                  <div className="text-xs font-bold text-indigo-800 tracking-wider uppercase mb-4">Feedback</div>
                  {renderAiTip(analysisData.aiTip)}
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">Gesprochener Text</div>
                  <HighlightedTranscript transcript={analysisData.transcript} />
                </>
              )}
            </div>

            <motion.button whileTap={{ scale: 0.98 }} className="mt-auto w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors" onClick={finishFeedback}>
              <Check size={18} strokeWidth={2.5} /> Abschließen
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
