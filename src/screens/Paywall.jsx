import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useGoBack } from '../useGoBack';

export const PaywallScreen = () => {
  const { profile, user } = useAuth();
  const { addToast } = useToast();
  const goBack = useGoBack('/dashboard');
  const [loading, setLoading] = React.useState(false);

  const handleSubscribe = async () => {
    // In a real app, this would redirect to Stripe Checkout.
    // For this prototype, we call our secure upgrade endpoint.
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Force reload to get updated profile from Firestore
        window.location.href = '/arena';
      } else {
        const data = await res.json().catch(() => ({}));
        // Hinweis für Entwickler nur in der Konsole — Nutzer sollen keine Server-Variablen sehen.
        console.warn('Upgrade fehlgeschlagen:', data.error, '(Demo-Upgrade braucht ALLOW_DEMO_PREMIUM=true)');
        addToast('Das Upgrade ist gerade nicht möglich. Bitte versuche es später erneut.', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Upgrade fehlgeschlagen. Netzwerkfehler.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col px-6 py-12">
      <button onClick={goBack} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors">
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
              "Live-Gespräche: Die KI fragt nach (Bewerbung, Sales, Konflikt)",
              "Alle Pro-Szenarien (Gehalt, Pitch, Vorstand, Krisen-PR …)",
              "Fremdsprachen: Französisch, Spanisch, Italienisch",
              "Kamera-Feedback zu Körpersprache und Blickkontakt",
              "Mehr KI-Analysen pro Tag und mehr eigene Szenarien"
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
          disabled={loading || profile?.isPremium}
          className={`w-full py-4 rounded-xl font-medium transition-colors shadow-lg ${loading || profile?.isPremium ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/25'} text-white`}
        >
          {loading ? "Wird verarbeitet..." : profile?.isPremium ? "Bereits abonniert" : "Jetzt freischalten"}
        </motion.button>
        
        <p className="text-xs text-slate-500 text-center mt-6">
          Dies ist eine Demo-Version. Für den Prototyp wird Premium sofort freigeschaltet (keine echte Zahlung via Stripe nötig).
        </p>
      </div>
    </div>
  );
};
