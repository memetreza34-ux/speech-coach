import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = () => {
  const { loginWithGoogle } = useAuth();

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
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 shadow-sm text-slate-700 py-4 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Mit Google anmelden
          </motion.button>
        </div>

        <p className="mt-8 text-xs text-slate-400 text-center max-w-xs">
          Mit der Anmeldung akzeptierst du unsere AGB und die Datenschutzerklärung.
        </p>
      </div>
    </div>
  );
};
