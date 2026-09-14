import { describe, it, expect } from 'vitest';
import { getDynamicsLabel } from './useRecorder';

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
