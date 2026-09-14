import { describe, it, expect } from 'vitest';
import { getDynamicsLabel } from './useRecorder';
import { countWords, countFillers, getPacingStatus, computeLevel } from './utils/speech';

describe('getDynamicsLabel', () => {
  it('identifies monoton dynamics', () => {
    expect(getDynamicsLabel(30)).toBe('Monoton');
  });

  it('identifies sehr bewegt dynamics', () => {
    expect(getDynamicsLabel(80)).toBe('Sehr bewegt');
  });

  it('identifies ausgewogen dynamics', () => {
    expect(getDynamicsLabel(50)).toBe('Ausgewogen');
  });
});

describe('Speech Utils', () => {
  it('counts words correctly', () => {
    expect(countWords("Das ist ein Test.")).toBe(4);
    expect(countWords("   Leerzeichen   werden   ignoriert  ")).toBe(3);
    expect(countWords("")).toBe(0);
  });

  it('counts fillers correctly', () => {
    expect(countFillers("Ähm, das ist also sozusagen ein Test, genau.")).toBe(4);
    expect(countFillers("Ich spreche ganz flüssig ohne Füllwörter.")).toBe(0);
    expect(countFillers("ähm Ähm Ähm")).toBe(3);
  });

  it('evaluates pacing correctly', () => {
    expect(getPacingStatus(130)).toBe('Sehr gut');
    expect(getPacingStatus(90)).toBe('Zu langsam');
    expect(getPacingStatus(170)).toBe('Zu schnell');
    expect(getPacingStatus(0)).toBe('Zu langsam');
  });

  it('computes level correctly', () => {
    expect(computeLevel(0)).toBe(1);
    expect(computeLevel(9)).toBe(1);
    expect(computeLevel(10)).toBe(2);
    expect(computeLevel(25)).toBe(3);
  });
});
