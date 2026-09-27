export const mapApiErrorToAiStatus = (status, code) => {
  if (status === 429 || code === 'QUOTA_EXCEEDED') return 'quota_exceeded';
  if (status === 504 || code === 'AI_TIMEOUT') return 'timeout';
  if (code === 'INVALID_AI_RESPONSE') return 'invalid_response';
  if (code === 'UPSTREAM_ERROR') return 'upstream_error';
  if (status === 403 || code === 'PREMIUM_REQUIRED') return 'premium_required';
  return 'server_error';
};

import { auth } from '../lib/firebase';

export const getPacingStatus = (wpm) => {
  if (wpm < 110) return "Zu langsam";
  if (wpm > 160) return "Zu schnell";
  return "Im Zielbereich";
};

export const countWords = (transcript) => (transcript.trim().match(/\S+/g) || []).length;
export const countFillers = (transcript) => {
  const words = transcript.match(/[\p{L}\p{N}]+/gu) || [];
  const fillers = new Set(['ähm', 'äh', 'also', 'sozusagen', 'quasi', 'halt', 'genau', 'irgendwie', 'eigentlich']);
  return words.filter(w => fillers.has(w.toLowerCase())).length;
};

export const CATEGORIES = [
  { id: 'interactive', title: 'Live Gespräche (Neu)' },
  { id: 'presentations', title: 'Präsentationen & Sales' },
  { id: 'career', title: 'Karriere & Arbeit' },
  { id: 'social', title: 'Alltag & Social' },
  { id: 'goals', title: 'Ziele & Motivation' },
  { id: 'politics', title: 'Politik & Debatte' },
  { id: 'languages', title: 'Fremdsprachen' }
];

import { MODES } from '../shared/modes.js';
import { DAILY_CHALLENGES, getDailyChallenge, PROMPTS, getPromptForMode } from '../shared/prompts.js';
export { MODES, DAILY_CHALLENGES, getDailyChallenge, PROMPTS, getPromptForMode };

export const modeTitle = (id) => {
  if (id === 'daily') return getDailyChallenge().title;
  return MODES.find(m => m.id === id)?.title || id;
};

export const getLocaleForMode = (id) => {
  if (id === 'lang_en') return 'en-US';
  if (id === 'lang_fr') return 'fr-FR';
  if (id === 'lang_es') return 'es-ES';
  if (id === 'lang_it') return 'it-IT';
  return 'de-DE';
};

export const getSessionDate = (session) => {
  if (session.createdAt) {
    return session.createdAt.toDate ? session.createdAt.toDate() : new Date(session.createdAt);
  }
  if (session.timestamp) {
    return session.timestamp.toDate ? session.timestamp.toDate() : new Date(session.timestamp);
  }
  return new Date(session.date);
};

export const computeStreak = (history) => {
  if (!Array.isArray(history)) return 0;
  const daySet = new Set(history.map(h => getSessionDate(h).toDateString()));
  let streak = 0;
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  let cursor = new Date();
  if (!daySet.has(today.toDateString())) {
    if (daySet.has(yesterday.toDateString())) {
      cursor = yesterday;
    } else {
      return 0;
    }
  }

  while (daySet.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const computeLevel = (history) => {
  if (!Array.isArray(history)) return 1;
  return Math.min(99, Math.floor(history.length / 3) + 1);
};

export const analyzeTranscript = async (recording, mode, profile) => {
  const { transcript, durationMs, pauseCount, longestPauseMs, speakingRatio, dynamics, frames } = recording;
  const minutes = Math.max(durationMs / 60000, 1 / 60);
  
  const isCustom = mode.startsWith('custom_');
  const customModeData = isCustom ? profile?.customModes?.find(m => m.id === mode) : null;
  const promptContext = isCustom ? customModeData?.prompt : getPromptForMode(mode);

  const measured = {
    wpm: Math.round(countWords(transcript) / minutes),
    pauseCount,
    longestPauseMs,
    speakingRatio,
    dynamics
  };
  measured.pacingStatus = getPacingStatus(measured.wpm);

  const fallback = (errorMessage, status = 'server_error') => ({ 
    ...measured, 
    fillers: countFillers(transcript), 
    confidenceScore: null, 
    aiTip: null, 
    systemMessage: errorMessage,
    isDummy: true, 
    isQuotaError: status === 'quota_exceeded',
    aiStatus: status
  });

  if (!transcript.trim()) {
    return fallback("Es wurde kein Text erkannt. Sprich etwas lauter oder prüfe dein Mikrofon.", "not_available");
  }

  try {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ transcript, mode, profile, metrics: measured, customPrompt: promptContext, frames: frames?.length ? frames : undefined })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      console.error("Analyse-Server Fehler:", response.status, errBody);
      const aiStatus = mapApiErrorToAiStatus(response.status, errBody?.code);
      const tip = errBody?.error || "Die KI-Analyse ist fehlgeschlagen. Die Messwerte oben sind echt, nur der KI-Tipp fehlt.";
      return fallback(tip, aiStatus);
    }

    const { fillers, confidenceScore, aiTip } = await response.json();
    return { 
      ...measured, 
      fillers: typeof fillers === 'number' ? fillers : countFillers(transcript), 
      confidenceScore: typeof confidenceScore === 'number' ? confidenceScore : null, 
      aiTip,
      aiStatus: 'success'
    };
  } catch (e) {
    console.error("AI Error:", e);
    return fallback("Der Analyse-Server ist nicht erreichbar. Die Messwerte oben sind echt, nur der KI-Tipp fehlt.", "server_error");
  }
};
