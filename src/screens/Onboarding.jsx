import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, TrendingUp, Users, Loader2 } from 'lucide-react';

export const OnboardingScreen = () => {
  const { updateProfile, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [frequency, setFrequency] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = async () => {
    setIsFinishing(true);
    await updateProfile({
      onboardingGoal: goal,
      onboardingFrequency: frequency,
      isOnboarded: true
    });
    
    // Simulate a brief "AI analyzing" state to add premium feel
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const nextStep = () => {
    if (step === 1 && goal) setStep(2);
    else if (step === 2 && frequency) handleFinish();
  };

  const GOALS = [
    { id: 'sales', title: 'Sales & Pitches', desc: 'Kunden und Investoren überzeugen', icon: TrendingUp },
    { id: 'career', title: 'Karriere & Leadership', desc: 'Meetings leiten und Interviews meistern', icon: Target },
    { id: 'social', title: 'Alltag & Selbstbewusstsein', desc: 'Frei und ohne Ängste sprechen', icon: Users }
  ];

  const FREQUENCIES = [
    { id: 'rare', title: 'Selten', desc: 'Ich vermeide es, wenn möglich' },
    { id: 'weekly', title: 'Wöchentlich', desc: 'Gelegentliche Meetings und Präsentationen' },
    { id: 'daily', title: 'Täglich', desc: 'Ein großer Teil meines Jobs' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-6">
      <div className="max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 1 && !isFinishing && (
            <motion.div key="step1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
              <div>
                <div className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-2">Willkommen, {profile?.name?.split(' ')[0] || 'Speaker'}!</div>
                <h1 className="text-3xl font-serif text-slate-900 leading-tight">Was ist dein <span className="text-indigo-600 italic">Hauptziel</span> mit SpeechCoach?</h1>
              </div>
              
              <div className="space-y-3">
                {GOALS.map(g => (
                  <button 
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${goal === g.id ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                  >
                    <div className={`p-3 rounded-xl ${goal === g.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <g.icon size={20} />
                    </div>
                    <div>
                      <div className={`font-bold ${goal === g.id ? 'text-indigo-900' : 'text-slate-900'}`}>{g.title}</div>
                      <div className={`text-xs mt-0.5 ${goal === g.id ? 'text-indigo-700' : 'text-slate-500'}`}>{g.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <button 
                onClick={nextStep}
                disabled={!goal}
                className={`w-full py-4 rounded-xl font-bold transition-all ${goal ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Weiter
              </button>
            </motion.div>
          )}

          {step === 2 && !isFinishing && (
            <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
              <div>
                <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Dein Ausgangspunkt</div>
                <h1 className="text-3xl font-serif text-slate-900 leading-tight">Wie oft sprichst du aktuell <span className="text-indigo-600 italic">vor anderen</span>?</h1>
              </div>
              
              <div className="space-y-3">
                {FREQUENCIES.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => setFrequency(f.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${frequency === f.id ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                  >
                    <div className={`font-bold ${frequency === f.id ? 'text-indigo-900' : 'text-slate-900'}`}>{f.title}</div>
                    <div className={`text-xs mt-0.5 ${frequency === f.id ? 'text-indigo-700' : 'text-slate-500'}`}>{f.desc}</div>
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="py-4 px-6 rounded-xl font-bold bg-white text-slate-500 border border-slate-200 hover:bg-slate-50">Zurück</button>
                <button 
                  onClick={nextStep}
                  disabled={!frequency}
                  className={`flex-1 py-4 rounded-xl font-bold transition-all ${frequency ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  Profil erstellen
                </button>
              </div>
            </motion.div>
          )}

          {isFinishing && (
             <motion.div key="finishing" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center text-center space-y-6">
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                 className="relative"
               >
                 <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-30"></div>
                 <Loader2 size={48} className="text-indigo-600 relative z-10" />
               </motion.div>
               <div>
                 <h2 className="text-xl font-serif text-slate-900 mb-2">Bereite Coach vor...</h2>
                 <p className="text-sm text-slate-500">Dein personalisierter Trainingsplan wird erstellt.</p>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
