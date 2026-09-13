import React from 'react';

export const HighlightedTranscript = ({ transcript }) => {
  if (!transcript) return null;
  // Use a combined regex with capturing groups to keep the delimiters
  const fillersPattern = "ähm|äh|also|sozusagen|quasi|halt|genau|irgendwie|eigentlich";
  const weakPattern = "vielleicht|eventuell|glaube|würde|könnte|man|irgendwas|irgendwer";
  
  const regex = new RegExp(`\\b(${fillersPattern}|${weakPattern})\\b`, 'gi');
  const parts = transcript.split(regex);
  
  return (
    <p className="text-sm text-slate-700 leading-relaxed font-serif">
      {parts.map((part, i) => {
        if (!part) return null; // handle empty strings
        
        if (part.match(new RegExp(`^(${fillersPattern})$`, 'i'))) {
          return <span key={i} className="bg-rose-100 text-rose-700 font-bold px-1 mx-0.5 rounded-md" title="Füllwort">{part}</span>;
        }
        if (part.match(new RegExp(`^(${weakPattern})$`, 'i'))) {
          return <span key={i} className="bg-amber-100 text-amber-700 font-bold px-1 mx-0.5 rounded-md" title="Schwache Formulierung">{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
};
