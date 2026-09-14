import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogOut, Save, Crown, ShieldAlert, Zap, Target, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { computeLevel, computeStreak } from '../utils/speech';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Löschen" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200">Abbrechen</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export const ProfileScreen = () => {
  const { profile, updateProfile, logout, deleteAccount, deleteTrainingData, user } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    role: profile?.role || '',
    age: profile?.age || '',
    hobbies: profile?.hobbies || ''
  });
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [aiPersona, setAiPersona] = useState(null);
  const [loadingPersona, setLoadingPersona] = useState(false);
  const [personaError, setPersonaError] = useState('');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('date', 'desc'));
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(formData);
      addToast('Erfolgreich gespeichert!', 'success');
    } catch (e) {
      addToast('Fehler beim Speichern.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const generatePersona = async () => {
    setLoadingPersona(true);
    setPersonaError('');
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/analyze-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ profile: formData })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Fehler beim Abrufen der Analyse.');
      }
      const data = await res.json();
      setAiPersona(data);
    } catch (e) {
      setPersonaError(e.message || 'Die Persona-Analyse konnte nicht erstellt werden.');
      console.error(e);
    } finally {
      setLoadingPersona(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      if (confirmModal.type === 'account') {
        await deleteAccount();
      } else if (confirmModal.type === 'data') {
        await deleteTrainingData();
        setHistory([]);
        addToast('Trainingsdaten erfolgreich gelöscht.', 'success');
        setConfirmModal({ isOpen: false, type: null });
      }
    } catch (e) {
      addToast("Fehler beim Löschen. Bitte versuche es erneut.", 'error');
      setConfirmModal({ isOpen: false, type: null });
    } finally {
      setIsDeleting(false);
    }
  };

  const canGeneratePersona = formData.role.length > 2 || formData.hobbies.length > 2;

  return (
    <motion.div className="flex flex-col min-h-screen bg-slate-50 px-6 py-10 pb-28 overflow-y-auto" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.type === 'account' ? 'Account endgültig löschen?' : 'Trainingsdaten löschen?'}
        message={confirmModal.type === 'account' ? 'Dein Account und alle damit verbundenen Daten werden unwiderruflich gelöscht.' : 'Alle deine Trainingssessions und Analysen werden gelöscht. Dein Profil bleibt erhalten.'}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, type: null })}
        confirmText={isDeleting ? "Löscht..." : "Endgültig löschen"}
      />
      <div className="max-w-md mx-auto w-full">
        <h1 className="text-3xl font-serif text-slate-900 mb-8">Profil</h1>
        
        {profile?.isPremium && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Crown size={24} className="text-yellow-300" />
              <h3 className="font-bold text-lg">Pro Mitgliedschaft aktiv</h3>
            </div>
            <p className="text-indigo-100 text-sm">Du hast Zugriff auf alle Szenarien und lernst werbefrei.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-indigo-500" />
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">Level</div>
            </div>
            <div className="text-4xl font-serif text-slate-900 mb-1">{level}</div>
            <div className="text-xs text-slate-500">Noch {sessionsToNextLevel} bis Level {level + 1}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-amber-500" />
              <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">Streak</div>
            </div>
            <div className="text-4xl font-serif text-slate-900 mb-1">{streak}</div>
            <div className="text-xs text-slate-500">{streak === 1 ? 'Tag' : 'Tage'} in Folge</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Persönliche Daten</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">Diese Daten helfen der KI, die Coaching-Szenarien und das Feedback an dich anzupassen.</p>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Name</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Rolle / Beruf</label>
            <input type="text" placeholder="z.B. Student, Manager" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Alter</label>
            <input type="number" placeholder="z.B. 28" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Interessen</label>
            <textarea placeholder="Wofür interessierst du dich?" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 resize-none h-24 transition-colors" value={formData.hobbies} onChange={e => setFormData({...formData, hobbies: e.target.value})} />
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-medium transition-colors mt-4">
            <Save size={18} /> {saving ? 'Speichert...' : 'Änderungen speichern'}
          </button>
        </div>

        {/* AI Persona Generator */}
        <div className="mb-8">
          {!aiPersona && !loadingPersona ? (
            <button 
              onClick={generatePersona}
              disabled={!canGeneratePersona}
              className={`w-full py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${!canGeneratePersona ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-sm'}`}
            >
              <div className="flex items-center gap-2 font-bold">
                <Sparkles size={18} /> Deine Kommunikations-Persona
              </div>
              {!canGeneratePersona ? (
                <div className="text-xs opacity-70">Bitte gib oben zuerst Beruf oder Interessen an</div>
              ) : (
                <div className="text-xs opacity-70">Lass die KI deinen idealen Archetyp analysieren</div>
              )}
            </button>
          ) : loadingPersona ? (
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-amber-600" size={24} />
              <div className="text-sm font-medium text-amber-800">Analysiere dein Profil...</div>
            </div>
          ) : aiPersona ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-600" />
                  <div className="text-xs font-bold text-amber-600 tracking-widest uppercase">Dein Archetyp</div>
                </div>
                <button onClick={() => setAiPersona(null)} className="text-xs text-amber-600 underline">Schließen</button>
              </div>
              
              <h3 className="text-xl font-serif text-amber-900 mb-3">{aiPersona.archetype}</h3>
              <p className="text-sm text-amber-900 leading-relaxed font-medium mb-6">{aiPersona.description}</p>
              
              <div className="space-y-4">
                <div className="bg-white/60 rounded-xl p-4 border border-amber-100">
                  <div className="text-[10px] font-bold text-amber-700 tracking-widest uppercase mb-1">Deine Superkraft</div>
                  <p className="text-sm text-amber-900">{aiPersona.superpower}</p>
                </div>
                <div className="bg-white/60 rounded-xl p-4 border border-amber-100">
                  <div className="text-[10px] font-bold text-rose-600 tracking-widest uppercase mb-1">Deine größte Falle</div>
                  <p className="text-sm text-amber-900">{aiPersona.trap}</p>
                </div>
              </div>
            </div>
          ) : null}
          {personaError && <div className="text-sm text-rose-500 mt-2 text-center">{personaError}</div>}
        </div>

        <div className="bg-slate-200/50 rounded-2xl p-6 mb-8 text-slate-600">
          <div className="flex items-center gap-3 mb-4 text-slate-700">
            <ShieldAlert size={20} />
            <h3 className="font-bold text-sm uppercase tracking-wider">Datenschutz & Account</h3>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => setConfirmModal({ isOpen: true, type: 'data' })}
              className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 text-slate-700"
            >
              <div className="flex items-center gap-2">
                <Trash2 size={16} /> Trainingsdaten löschen
              </div>
            </button>
            <button 
              onClick={() => setConfirmModal({ isOpen: true, type: 'account' })}
              className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 text-red-600"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} /> Account endgültig löschen
              </div>
            </button>
          </div>
        </div>

        <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl font-medium transition-colors hover:bg-slate-50">
          <LogOut size={18} /> Abmelden
        </button>
      </div>
    </motion.div>
  );
};
