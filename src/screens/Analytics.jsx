import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { modeTitle, getSessionDate } from '../utils/speech';
import { HighlightedTranscript } from '../components/HighlightedTranscript';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { Brain, Activity, Hash, ChevronDown, ChevronUp, FileText, Loader2, Sparkles, TrendingUp, AlertTriangle, Target } from 'lucide-react';

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
    </div>
  );
};

const SessionCard = ({ session, profile }) => {
  const [expanded, setExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  
  const getDisplayTitle = (id) => {
    if (id?.startsWith('custom_')) {
      const customMode = profile?.customModes?.find(m => m.id === id);
      return customMode ? customMode.title : 'Eigenes Szenario';
    }
    return modeTitle(id);
  };

  const date = getSessionDate(session).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-3">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div className="font-semibold text-slate-900">{session.modeLabel || getDisplayTitle(session.mode)}</div>
          <div className="text-xs text-slate-500 mt-1">{date}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right flex items-center gap-4">
            <div>
              <div className="font-bold text-emerald-600">{session.confidenceScore === null || session.confidenceScore === undefined ? '–' : session.confidenceScore} <span className="text-xs font-normal text-slate-400">Score</span></div>
            </div>
            <div>
              <div className="font-bold text-indigo-600">{session.wpm ?? '–'} <span className="text-xs font-normal text-slate-400">WPM</span></div>
              <div className="text-xs text-slate-500">{session.fillers ?? '–'} Füllwörter</div>
            </div>
          </div>
          {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Pausen</div>
                <div className="font-semibold text-slate-700">{session.pauseCount ?? '–'}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Status</div>
                <div className="font-semibold text-slate-700">{session.pacingStatus ?? '–'}</div>
              </div>
            </div>

            {/* Toggle Feedback / Transcript */}
            {session.transcript && (
              <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                <button 
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${!showTranscript ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setShowTranscript(false)}
                >
                  KI Coach
                </button>
                <button 
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${showTranscript ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setShowTranscript(true)}
                >
                  Transkript
                </button>
              </div>
            )}

            {!showTranscript ? (
              <div className="bg-indigo-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={16} className="text-indigo-500" />
                  <div className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">KI Feedback</div>
                </div>
                {renderAiTip(session.aiTip)}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-slate-400" />
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gesprochener Text</div>
                </div>
                <HighlightedTranscript transcript={session.transcript} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AnalyticsScreen = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data());
      setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const generateProgressInsight = async () => {
    setLoadingInsight(true);
    setInsightError('');
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/analyze-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ history, profile })
      });
      if (!res.ok) throw new Error('Fehler beim Abrufen der Analyse.');
      const data = await res.json();
      setAiInsight(data);
    } catch (e) {
      setInsightError('Die Langzeitanalyse konnte gerade nicht erstellt werden.');
      console.error(e);
    } finally {
      setLoadingInsight(false);
    }
  };

  // Aggregate Data
  const chartData = [...history].reverse().map((s, i) => {
    return {
      name: `S${i + 1}`,
      wpm: s.wpm,
      fillers: s.fillers,
      confidence: typeof s.confidenceScore === 'number' ? s.confidenceScore : null
    };
  });

  const sessionsWithWpm = history.filter(s => typeof s.wpm === 'number');
  const avgWpm = sessionsWithWpm.length ? Math.round(sessionsWithWpm.reduce((acc, curr) => acc + curr.wpm, 0) / sessionsWithWpm.length) : 0;
  
  let totalWords = 0;
  let totalFillersSum = 0;
  history.forEach(s => {
      if (s.transcript) {
          totalWords += s.transcript.trim().split(/\s+/).filter(w => w.length > 0).length;
          totalFillersSum += (typeof s.fillers === 'number' ? s.fillers : 0);
      }
  });
  const fillersPer100Words = totalWords > 0 ? (totalFillersSum / totalWords * 100).toFixed(1) : "0.0";

  return (
    <motion.div className="flex flex-col min-h-screen bg-slate-50 px-6 py-10 pb-28 overflow-y-auto" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center gap-2 mb-2 text-indigo-600">
          <Brain size={20} />
          <div className="text-xs font-bold tracking-widest uppercase">Performance</div>
        </div>
        <h1 className="text-3xl font-serif text-slate-900 mb-8">Mein <span className="text-indigo-600 italic">Gehirn</span></h1>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Daten werden geladen...</div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden text-center mt-4">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
              <Activity size={240} className="text-indigo-900" />
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain size={32} />
              </div>
              
              <h2 className="text-2xl font-serif text-slate-900 mb-3">Dein Dashboard ist noch leer</h2>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed text-sm">
                Sobald du dein erstes Training in der Arena absolvierst, analysiert die KI deine Stimme und füllt diesen Ort mit wertvollen Insights und deinem Archiv.
              </p>

              <div className="grid grid-cols-1 gap-3 mb-8 text-left">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Activity size={20} /></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Sprechtempo & Klarheit</div>
                    <div className="text-xs text-slate-500">Finde deinen perfekten Rhythmus.</div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="bg-rose-100 p-2 rounded-xl text-rose-500"><Hash size={20} /></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Füllwörter Tracker</div>
                    <div className="text-xs text-slate-500">Erkenne und reduziere deine "Ähms".</div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Sparkles size={20} /></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">KI-Coaching & Archiv</div>
                    <div className="text-xs text-slate-500">Personalisiertes Langzeit-Feedback.</div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => navigate('/arena')}
                className="w-full bg-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <Target size={20} />
                Erstes Training starten
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} className="text-emerald-500" />
                  <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">Ø Tempo</div>
                </div>
                <div className="text-3xl font-serif text-slate-900 mb-1">{avgWpm}</div>
                <div className="text-xs text-slate-500">Wörter pro Min.</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Hash size={16} className="text-rose-500" />
                  <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">Füllwörter</div>
                </div>
                <div className="text-3xl font-serif text-slate-900 mb-1">{fillersPer100Words}</div>
                <div className="text-xs text-slate-500">pro 100 Wörter</div>
              </div>
            </div>

            {/* AI Progress Insight (NEW) */}
            <div className="mb-6">
              {!aiInsight && !loadingInsight ? (
                <button 
                  onClick={generateProgressInsight}
                  disabled={history.length < 2}
                  className={`w-full py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${history.length < 2 ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm'}`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles size={18} /> KI-Langzeitanalyse generieren
                  </div>
                  {history.length < 2 ? (
                    <div className="text-xs opacity-70">Benötigt mindestens 2 Trainings</div>
                  ) : (
                    <div className="text-xs opacity-70">Lass die KI deine Entwicklung auswerten</div>
                  )}
                </button>
              ) : loadingInsight ? (
                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-indigo-600" size={24} />
                  <div className="text-sm font-medium text-indigo-800">Analysiere deinen Fortschritt...</div>
                </div>
              ) : aiInsight ? (
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={20} className="text-indigo-600" />
                    <div className="text-xs font-bold text-indigo-600 tracking-widest uppercase">Coach Insight</div>
                  </div>
                  <p className="text-slate-800 leading-relaxed mb-6 font-medium">{aiInsight.insight}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-emerald-600">
                        <TrendingUp size={16} />
                        <div className="text-[10px] font-bold tracking-widest uppercase">Was besser wird</div>
                      </div>
                      <ul className="space-y-2">
                        {aiInsight.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-2 border-t border-indigo-100">
                      <div className="flex items-center gap-2 mb-2 text-rose-500 mt-2">
                        <AlertTriangle size={16} />
                        <div className="text-[10px] font-bold tracking-widest uppercase">Dein nächstes Ziel</div>
                      </div>
                      <ul className="space-y-2">
                        {aiInsight.improvements.map((s, i) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-rose-400 font-bold">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
              {insightError && <div className="text-sm text-rose-500 mt-2 text-center">{insightError}</div>}
            </div>

            {/* Charts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-4">
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-6">Souveränität & Klarheit (0-100)</div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748b', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorConf)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-4">
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-6">Tempo-Entwicklung (WPM)</div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748b', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="wpm" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-8">
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-6">Füllwörter ("ähm", "also")</div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748b', fontSize: '12px' }}
                    />
                    <Bar dataKey="fillers" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* History List */}
            <div>
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">Historie & Archiv</div>
              {history.map((session, idx) => (
                <SessionCard key={idx} session={session} profile={profile} />
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
