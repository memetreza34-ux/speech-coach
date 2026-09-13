import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const PaywallScreen = () => {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    // In a real app, this would redirect to Stripe Checkout.
    // For this prototype, we just unlock it.
    await updateProfile({ isPremium: true });
    navigate('/arena');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col px-6 py-12">
      <button onClick={() => navigate(-1)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors">
        <X size={24} />
      </button>

      <div className="max-w-md mx-auto w-full mt-12">
        <div className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-3 text-center">Pro Mitgliedschaft</div>
        <h1 className="text-4xl font-serif text-center mb-8">
          Werde zum <br /><span className="text-indigo-400 italic">Meisterredner</span>
        </h1>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
          <ul className="space-y-4">
            {[
              "Alle Karriere-Szenarien (Gehalt, Pitch, etc.)",
              "Souveränitätstraining (Politik & Krise)",
              "Fremdsprachen-Simulationen (EN, FR, ES)",
              "Unbegrenzte KI-Analysen",
              "100% Werbefrei"
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-slate-200">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center mb-8">
          <div className="text-5xl font-serif mb-2">9,99 €<span className="text-xl text-slate-400 font-sans">/Monat</span></div>
          <p className="text-sm text-slate-400">Jederzeit kündbar. Keine versteckten Kosten.</p>
        </div>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleSubscribe}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-4 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25"
        >
          {profile?.isPremium ? "Bereits abonniert" : "Jetzt freischalten"}
        </motion.button>
        
        <p className="text-xs text-slate-500 text-center mt-6">
          Dies ist eine Demo-Version. Für den Prototyp wird Premium sofort freigeschaltet (keine echte Zahlung via Stripe nötig).
        </p>
      </div>
    </div>
  );
};
