import { describe, it, expect } from 'vitest';
import { 
  countWords, 
  countFillers, 
  getPacingStatus, 
  computeStreak, 
  computeLevel 
} from './utils/speech';
import { getDynamicsLabel } from './useRecorder';

describe('Speech Utils', () => {
  describe('countWords', () => {
    it('counts words correctly', () => {
      expect(countWords('Hallo Welt')).toBe(2);
      expect(countWords('  Hallo   Welt  ')).toBe(2);
      expect(countWords('')).toBe(0);
      expect(countWords('Ein ganz langer Satz mit vielen Wörtern.')).toBe(7);
      expect(countWords('   ')).toBe(0);
      expect(countWords('Ein-Wort')).toBe(1);
    });
  });

  describe('countFillers', () => {
    it('counts fillers correctly', () => {
      expect(countFillers('Ich bin also quasi bereit.')).toBe(2);
      expect(countFillers('Ähm, halt, genau.')).toBe(3);
      expect(countFillers('Keine Füllwörter hier.')).toBe(0);
      expect(countFillers('')).toBe(0);
      expect(countFillers('also ALSO also')).toBe(3);
      expect(countFillers('    ähm    ')).toBe(1);
      expect(countFillers('ähm-halt')).toBe(2);
    });
  });

  describe('getPacingStatus', () => {
    it('returns correct status', () => {
      expect(getPacingStatus(100)).toBe('Zu langsam');
      expect(getPacingStatus(130)).toBe('Im Zielbereich');
      expect(getPacingStatus(170)).toBe('Zu schnell');
      expect(getPacingStatus(0)).toBe('Zu langsam');
      expect(getPacingStatus(109)).toBe('Zu langsam');
      expect(getPacingStatus(110)).toBe('Im Zielbereich');
      expect(getPacingStatus(160)).toBe('Im Zielbereich');
      expect(getPacingStatus(161)).toBe('Zu schnell');
      expect(getPacingStatus(-10)).toBe('Zu langsam');
      expect(getPacingStatus(null)).toBe('Zu langsam');
    });
  });

  describe('getDynamicsLabel', () => {
    it('identifies dynamics', () => {
      expect(getDynamicsLabel(30)).toBe('Monoton');
      expect(getDynamicsLabel(80)).toBe('Sehr bewegt');
      expect(getDynamicsLabel(50)).toBe('Ausgewogen');
      expect(getDynamicsLabel(0)).toBe('Monoton');
      expect(getDynamicsLabel(100)).toBe('Sehr bewegt');
      expect(getDynamicsLabel(null)).toBe('Monoton');
    });
  });

  describe('computeStreak', () => {
    it('computes streak correctly with yesterday and today', () => {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      
      const history = [
        { date: today },
        { createdAt: yesterday },
        { timestamp: { toDate: () => new Date(twoDaysAgo) } }
      ];
      expect(computeStreak(history)).toBe(3);
    });

    it('handles gap in streak', () => {
      const today = new Date().toISOString();
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      
      const history = [
        { date: today },
        { date: threeDaysAgo }
      ];
      expect(computeStreak(history)).toBe(1);
    });

    it('returns 0 for empty history', () => {
      expect(computeStreak([])).toBe(0);
      expect(computeStreak(null)).toBe(0);
      expect(computeStreak(undefined)).toBe(0);
    });
  });

  describe('computeLevel', () => {
    it('calculates level properly', () => {
      expect(computeLevel([])).toBe(1);
      expect(computeLevel(new Array(3).fill({}))).toBe(2);
      expect(computeLevel(new Array(30).fill({}))).toBe(11);
      expect(computeLevel(new Array(400).fill({}))).toBe(99);
      expect(computeLevel(null)).toBe(1);
      expect(computeLevel(undefined)).toBe(1);
    });
  });
});
