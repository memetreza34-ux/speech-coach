import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, MODES } from '../utils/speech';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';

export const ArenaScreen = () => {
  const { profile, setLocalProfile, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
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
        addToast(data.error || 'Fehler beim Erstellen des Szenarios.', 'error');
        return;
      }
      
      // Update local context profile
      setLocalProfile({ customModes: [...customModes, data.mode] });
      addToast('Eigenes Szenario erfolgreich erstellt!', 'success');
      setShowCustomModal(false);
      setCustomForm({ title: '', prompt: '' });
    } catch (e) {
      addToast('Netzwerkfehler beim Erstellen.', 'error');
    }
  };

  
  const requestDeleteCustom = (e, id) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const executeDeleteCustom = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/custom-modes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Fehler beim Löschen.', 'error');
        return;
      }
      setLocalProfile({ customModes: customModes.filter(m => m.id !== id) });
      addToast('Szenario gelöscht.', 'success');
    } catch (err) {
      addToast('Netzwerkfehler beim Löschen.', 'error');
    } finally {
      setDeletingId(null);
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
                      <div className="flex justify-between items-start">
                        <IconComponent className="text-white/80" size={24} />
                        <button 
                          onClick={(e) => requestDeleteCustom(e, mode.id)}
                          aria-label="Szenario löschen"
                          disabled={deletingId === mode.id}
                          className="p-1 rounded-md hover:bg-white/20 transition-colors text-white/70 hover:text-white disabled:opacity-50"
                        >
                          {deletingId === mode.id ? <Icons.Loader2 size={16} className="animate-spin" /> : <Icons.Trash2 size={16} />}
                        </button>
                      </div>
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
        {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h3 className="text-xl font-serif text-slate-900 mb-2">Szenario löschen?</h3>
            <p className="text-slate-600 text-sm mb-6">Möchtest du dieses eigene Szenario wirklich endgültig löschen? Dieser Schritt kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">Abbrechen</button>
              <button onClick={executeDeleteCustom} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">Endgültig löschen</button>
            </div>
          </motion.div>
        </div>
      )}
      
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
