import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function ConfirmModal({ title, description, confirmLabel = 'Bestätigen', cancelLabel = 'Abbrechen', danger = false, onConfirm, onCancel }) {
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Auto-focus safe action on mount
    if (danger && cancelRef.current) {
      cancelRef.current.focus();
    } else if (!danger && confirmRef.current) {
      confirmRef.current.focus();
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [danger, onCancel]);

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <motion.div 
        initial={{opacity: 0, scale: 0.95}} 
        animate={{opacity: 1, scale: 1}} 
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6"
      >
        <h3 id="confirm-modal-title" className="text-xl font-serif text-slate-900 mb-2">{title}</h3>
        <p id="confirm-modal-desc" className="text-slate-600 text-sm mb-6">{description}</p>
        <div className="flex gap-3">
          <button 
            ref={cancelRef}
            onClick={onCancel} 
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            {cancelLabel}
          </button>
          <button 
            ref={confirmRef}
            onClick={onConfirm} 
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors text-white focus:ring-2 focus:outline-none ${danger ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' : 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-400'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
