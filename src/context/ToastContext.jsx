/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none px-4 w-full max-w-md"
      >
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg shadow-black/5 pointer-events-auto text-sm font-medium w-full
                ${toast.type === 'error' ? 'bg-red-50 text-red-900 border border-red-200' : ''}
                ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : ''}
                ${toast.type === 'info' ? 'bg-slate-800 text-white shadow-slate-900/20' : ''}
              `}
            >
              {toast.type === 'error' && <AlertCircle size={18} className="text-red-500 shrink-0" />}
              {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-500 shrink-0" />}
              {toast.type === 'info' && <Info size={18} className="text-slate-400 shrink-0" />}
              <span className="flex-1">{toast.message}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 rounded-md transition-opacity p-1"
                aria-label="Meldung schließen"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
