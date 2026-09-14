import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, MODES } from '../utils/speech';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';

export const ArenaScreen = () => {
  const { profile, updateProfile, user } = useAuth();
  const navigate = useNavigate();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({ title: '', prompt: '' });

  const customModes = profile?.customModes || [];

  const handleStart = (mode) => {
    if (mode.isPremium && !profile?.isPremium) {
      navigate('/paywall');
    } else if (mode.category === 'interactive') {
      navigate(`/interview/${mode.id}`);
    } else {
      navigate(`/record/${mode.id}`);
    }
  };

  const handleCreateCustom = async () => {
    if (!customForm.title || !customForm.prompt) return;
    
    try {
      const token = await profile?.getIdToken?.() || await user?.getIdToken();
      const res = await fetch('/api/custom-modes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customForm)
      });
      
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Fehler beim Erstellen des Szenarios.');
        return;
      }
      
      // Update local context profile
      await updateProfile({ customModes: [...customModes, data.mode] });
      setShowCustomModal(false);
      setCustomForm({ title: '', prompt: '' });
    } catch (e) {
      alert('Netzwerkfehler beim Erstellen.');
    }
  };

  return (
    <motion.div className="flex flex-col min-h-screen bg-slate-50 px-6 py-10 pb-28 overflow-y-auto" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
      <div className="max-w-md mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Wähle deine Übung</div>
            <h1 className="text-3xl font-serif text-slate-900">Die <span className="text-indigo-600 italic">Arena</span></h1>
          </div>
          <button 
            onClick={() => {
              if (!profile?.isPremium && customModes.length >= 1) {
                navigate('/paywall');
                return;
              }
              setShowCustomModal(true);
            }}
            className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Icons.Plus size={16} /> Eigener Modus
          </button>
        </div>

        {/* Custom Modes Section */}
        {customModes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-serif text-slate-800 mb-4">Meine Szenarien</h2>
            <div className="grid grid-cols-2 gap-3">
              {customModes.map(mode => {
                const IconComponent = Icons[mode.icon] || Icons.Zap;
                return (
                  <motion.div 
                    key={mode.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(`/record/${mode.id}`)}
                    className="relative rounded-xl overflow-hidden shadow-sm border border-transparent cursor-pointer group hover:shadow-md transition-all"
                  >
                    <div className={`h-28 w-full bg-gradient-to-br ${mode.color} p-4 flex flex-col justify-between relative`}>
                      <IconComponent className="text-white/80" size={24} />
                      <div className="font-semibold text-sm leading-tight text-white mt-4 pr-2">{mode.title}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Built-in Categories */}
        {CATEGORIES.map(category => {
          const catModes = MODES.filter(m => m.category === category.id);
          if (catModes.length === 0) return null;

          return (
            <div key={category.id} className="mb-8">
              <h2 className="text-lg font-serif text-slate-800 mb-4">{category.title}</h2>
              <div className="grid grid-cols-2 gap-3">
                {catModes.map(mode => {
                  const locked = mode.isPremium && !profile?.isPremium;
                  const IconComponent = Icons[mode.icon] || Icons.MessageSquare;
                  
                  return (
                    <motion.div 
                      key={mode.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleStart(mode)}
                      className={`relative rounded-xl overflow-hidden shadow-sm border ${locked ? 'border-slate-200 opacity-80' : 'border-transparent'} cursor-pointer group hover:shadow-md transition-all`}
                    >
                      <div className={`h-28 w-full bg-gradient-to-br ${mode.color} p-4 flex flex-col justify-between relative`}>
                        <div className="flex justify-between items-start">
                          <IconComponent className="text-white/80" size={24} />
                          {locked && (
                            <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full">
                              <Icons.Lock size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="font-semibold text-sm leading-tight text-white mt-4 pr-2">{mode.title}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showCustomModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif text-slate-900">Eigenes Szenario erstellen</h3>
                <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-slate-600">
                  <Icons.X size={24} />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Titel (z.B. "Gehalt 2026")</label>
                  <input type="text" maxLength={25} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500" value={customForm.title} onChange={e => setCustomForm({...customForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ausgangssituation (Was sagt der Partner?)</label>
                  <textarea rows={3} placeholder="z.B. Dein Chef sagt: Wir haben dieses Jahr kein Budget für Sie." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 resize-none" value={customForm.prompt} onChange={e => setCustomForm({...customForm, prompt: e.target.value})} />
                </div>
              </div>

              <button 
                onClick={handleCreateCustom}
                disabled={!customForm.title || !customForm.prompt}
                className="w-full py-4 rounded-xl font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Szenario speichern
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
