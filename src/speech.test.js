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
    });
  });

  describe('countFillers', () => {
    it('counts fillers correctly', () => {
      expect(countFillers('Ich bin also quasi bereit.')).toBe(2); // also, quasi
      expect(countFillers('Ähm, halt, genau.')).toBe(3);
      expect(countFillers('Keine Füllwörter hier.')).toBe(0);
      expect(countFillers('')).toBe(0);
      expect(countFillers('also ALSO also')).toBe(3);
    });
  });

  describe('getPacingStatus', () => {
    it('returns correct status', () => {
      expect(getPacingStatus(100)).toBe('Zu langsam');
      expect(getPacingStatus(130)).toBe('Perfekt');
      expect(getPacingStatus(170)).toBe('Zu schnell');
    });
  });

  describe('getDynamicsLabel', () => {
    it('identifies dynamics', () => {
      expect(getDynamicsLabel(30)).toBe('Monoton');
      expect(getDynamicsLabel(80)).toBe('Sehr bewegt');
      expect(getDynamicsLabel(50)).toBe('Ausgewogen');
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
        { timestamp: twoDaysAgo }
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
    });
  });

  describe('computeLevel', () => {
    it('calculates level properly', () => {
      expect(computeLevel([])).toBe(1);
      expect(computeLevel([1, 2, 3])).toBe(2);
      expect(computeLevel(new Array(30).fill(1))).toBe(11);
    });
  });
});
