import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { computeLevel, computeStreak, modeTitle, getDailyChallenge } from '../utils/speech';
import { useNavigate } from 'react-router-dom';
import { Crown, Play, Target, Zap, Activity, ChevronRight, Brain, Flame } from 'lucide-react';

export const DashboardScreen = () => {
  const { profile, user } = useAuth();
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('date', 'desc'), limit(100));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data());
      setHistory(data);
    };
    fetchHistory();
  }, [user]);

  const level = computeLevel(history);
  const streak = computeStreak(history);
  const totalSessions = history.length;
  const sessionsToNextLevel = 3 - (totalSessions % 3);
  const progressPercent = totalSessions === 0 ? 0 : ((totalSessions % 3) / 3) * 100;
  const lastWpm = history.length > 0 ? history[0].wpm : 0;

  const getDisplayTitle = (id) => {
    if (id?.startsWith('custom_')) {
      const customMode = profile?.customModes?.find(m => m.id === id);
      return customMode ? customMode.title : 'Eigenes Szenario';
    }
    return modeTitle(id);
  };

  const dailyChallenge = getDailyChallenge();

  return (
    <motion.div className="flex flex-col min-h-screen bg-slate-50 px-6 py-10 pb-28 overflow-y-auto" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
      <div className="max-w-md mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-1">Willkommen zurück</div>
            <h1 className="text-3xl font-serif text-slate-900">{profile?.name || 'Speaker'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                <Flame size={14} className="fill-orange-500 text-orange-500" /> {streak}
              </div>
            )}
            {!profile?.isPremium && (
              <button onClick={() => navigate('/paywall')} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-indigo-200 transition-colors">
                <Crown size={14} /> Pro
              </button>
            )}
          </div>
        </div>

        {/* Personalized Recommendation */}
        {profile?.onboardingGoal && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">Dein Trainingsplan</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.onboardingGoal === 'sales' && (
                <>
                  <button onClick={() => navigate('/record/elevator_pitch')} className="bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-400 transition-colors shadow-sm">
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Schritt 1</div>
                    <div className="font-serif text-slate-900 leading-tight">Elevator Pitch</div>
                  </button>
                  <button onClick={() => navigate('/interview/sales_objection')} className="bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-400 transition-colors shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[8px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">Pro</div>
                    <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Schritt 2</div>
                    <div className="font-serif text-slate-900 leading-tight">Einwände</div>
                  </button>
                  <button onClick={() => navigate('/record/pitch')} className="bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-400 transition-colors shadow-sm relative overflow-hidden hidden md:block">
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[8px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">Pro</div>
                    <div className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">Schritt 3</div>
                    <div className="font-serif text-slate-900 leading-tight">Start-Up Pitch</div>
                  </button>
                </>
              )}
              {profile.onboardingGoal === 'career' && (
                <>
                  {profile.onboardingFrequency === 'rare' ? (
                    <button onClick={() => navigate('/record/impromptu')} className="bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-400 transition-colors shadow-sm">
                      <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Schritt 1</div>
                      <div className="font-serif text-slate-900 leading-tight">Freies Sprechen</div>
                    </button>
                  ) : (
                    <button onClick={() => navigate('/record/interview')} className="bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-400 transition-colors shadow-sm">
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Schritt 1</div>
                      <div className="font-serif text-slate-900 leading-tight">HR Interview</div>
                    </button>
                  )}
                  <button onClick={() => navigate('/interview/interview_interactive')} className="bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-400 transition-colors shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[8px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">Pro</div>
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Schritt 2</div>
                    <div className="font-serif text-slate-900 leading-tight">Live Interview</div>
                  </button>
                  {profile.onboardingFrequency === 'daily' && (
                    <button onClick={() => navigate('/record/negotiation')} className="bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-400 transition-colors shadow-sm relative overflow-hidden hidden md:block">
                      <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[8px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">Pro</div>
                      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Schritt 3</div>
                      <div className="font-serif text-slate-900 leading-tight">Gehalt</div>
                    </button>
                  )}
                </>
              )}
              {profile.onboardingGoal === 'social' && (
                <>
                  <button onClick={() => navigate('/record/impromptu')} className="bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-400 transition-colors shadow-sm">
                    <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Schritt 1</div>
                    <div className="font-serif text-slate-900 leading-tight">Freies Sprechen</div>
                  </button>
                  <button onClick={() => navigate('/record/conflict')} className="bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-400 transition-colors shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[8px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">Pro</div>
                    <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Schritt 2</div>
                    <div className="font-serif text-slate-900 leading-tight">Schwierige Gespräche</div>
                  </button>
                  <button onClick={() => navigate('/record/toastmasters')} className="bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-400 transition-colors shadow-sm hidden md:block">
                    <div className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-1">Schritt 3</div>
                    <div className="font-serif text-slate-900 leading-tight">Spontan-Rede</div>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tages-Challenge */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white mb-6 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[10px] font-bold text-indigo-200 tracking-widest uppercase mb-1">Tages-Challenge</div>
                <h2 className="text-xl font-serif">{dailyChallenge.title}</h2>
                <p className="text-sm text-indigo-100 mt-1 line-clamp-2">{dailyChallenge.desc}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shrink-0 ml-4">
                <Target size={20} className="text-white" />
              </div>
            </div>
            <button 
              onClick={() => navigate('/record/daily')} 
              className="bg-white text-indigo-600 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors shadow-sm w-max"
            >
              <Play size={16} className="fill-indigo-600" /> Jetzt starten
            </button>
          </div>
          <div className="absolute -bottom-8 -right-8 opacity-10">
            <Target size={120} />
          </div>
        </div>

        {/* Fortschritt / Level */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex justify-between items-end mb-3">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-amber-500" />
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">Dein Level</div>
            </div>
            <div className="text-2xl font-serif text-slate-900">{level}</div>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
            <motion.div 
              className="h-full bg-indigo-500 rounded-full" 
              initial={{ width: 0 }} 
              animate={{ width: `${progressPercent}%` }} 
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="text-xs text-slate-500 text-right">Noch {sessionsToNextLevel} {sessionsToNextLevel === 1 ? 'Session' : 'Sessions'} bis Level {level + 1}</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-amber-500" />
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">Streak</div>
            </div>
            <div className="text-3xl font-serif text-slate-900 mb-1">{streak}</div>
            <div className="text-xs text-slate-500">{streak === 1 ? 'Tag' : 'Tage'} in Folge</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-emerald-500" />
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">Tempo (Zuletzt)</div>
            </div>
            <div className="text-3xl font-serif text-slate-900 mb-1">{lastWpm}</div>
            <div className="text-xs text-slate-500">WPM</div>
          </div>
        </div>

        {!profile?.isPremium && (
          <div className="bg-slate-200 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center mb-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-300 transition-colors" onClick={() => navigate('/paywall')}>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Anzeige</span>
            <div className="text-slate-700 font-medium">Befreie dich von Werbung!</div>
            <div className="text-sm text-slate-500">Hol dir SpeechCoach Pro</div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">Letzte Sessions</div>
            <button onClick={() => navigate('/analytics')} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors">
              Analysen <ChevronRight size={14} />
            </button>
          </div>
          
          {history.length > 0 ? (
            <div className="flex flex-col gap-3">
              {history.slice(0, 3).map((s, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Brain size={16} className="text-indigo-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{s.modeLabel || getDisplayTitle(s.mode)}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{s.wpm} <span className="font-normal text-slate-500 text-xs">WPM</span></div>
                    <div className="text-xs text-slate-500">{s.fillers} FW</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">Noch keine Daten.</p>
              <p className="text-xs text-slate-500 mt-1">Starte in der Arena dein erstes Training!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
