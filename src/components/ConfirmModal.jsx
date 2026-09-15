import React from 'react';
import { motion } from 'framer-motion';

export default function ConfirmModal({ title, description, confirmLabel = 'Bestätigen', cancelLabel = 'Abbrechen', danger = false, onConfirm, onCancel }) {
  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <motion.div 
        initial={{opacity: 0, scale: 0.95}} 
        animate={{opacity: 1, scale: 1}} 
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6"
      >
        <h3 id="confirm-modal-title" className="text-xl font-serif text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm mb-6">{description}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
