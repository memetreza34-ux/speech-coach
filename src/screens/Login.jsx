import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginScreen = () => {
  const { loginWithGoogle } = useAuth();
  const { addToast } = useToast();

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') {
        // user aborted, ignore
        return;
      }
      addToast('Anmeldung fehlgeschlagen. Bitte versuche es erneut.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3" />
      
      <div className="max-w-md mx-auto w-full z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-200">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-serif text-slate-900 mb-4 text-center">Speech <span className="text-indigo-600 italic">Coach</span></h1>
        <p className="text-slate-600 text-center mb-12 text-lg">
          Meistere Vorstellungsgespräche, Pitches und Dates mit KI-gestütztem Feedback.
        </p>

        <div className="w-full space-y-4">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 shadow-sm text-slate-700 py-4 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.72 17.58V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.72 17.58C14.74 18.24 13.48 18.64 12 18.64C9.14 18.64 6.71 16.71 5.84 14.11H2.16V16.96C3.98 20.57 7.7 23 12 23Z" fill="#34A853"/>
              <path d="M5.84 14.11C5.62 13.45 5.49 12.74 5.49 12C5.49 11.26 5.62 10.55 5.84 9.89V7.04H2.16C1.41 8.53 1 10.21 1 12C1 13.79 1.41 15.47 2.16 16.96L5.84 14.11Z" fill="#FBBC05"/>
              <path d="M12 5.36C13.62 5.36 15.07 5.92 16.21 7.01L19.35 3.87C17.45 2.11 14.97 1 12 1C7.7 1 3.98 3.43 2.16 7.04L5.84 9.89C6.71 7.29 9.14 5.36 12 5.36Z" fill="#EA4335"/>
            </svg>
            Mit Google anmelden
          </motion.button>
        </div>

        <p className="mt-8 text-xs text-slate-400 text-center max-w-xs">
          Mit der Anmeldung akzeptierst du unsere <a href="/terms" className="underline hover:text-slate-600">Nutzungsbedingungen</a> und <a href="/privacy" className="underline hover:text-slate-600">Datenschutzerklärung</a>.
        </p>
      </div>
    </div>
  );
};
