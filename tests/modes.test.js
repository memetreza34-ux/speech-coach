import { describe, it, expect } from 'vitest';
import { MODES } from '../src/shared/modes';
import { getPromptForMode } from '../src/utils/speech';

describe('Modes and Prompts Consistency', () => {
  it('has unique ids', () => {
    const ids = MODES.map(m => m.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('all modes have required properties', () => {
    for (const mode of MODES) {
      expect(mode.id).toBeDefined();
      expect(typeof mode.id).toBe('string');
      expect(mode.category).toBeDefined();
      expect(mode.title).toBeDefined();
      expect(mode.icon).toBeDefined();
      expect(mode.color).toBeDefined();
    }
  });

  it('all modes have a corresponding prompt', () => {
    for (const mode of MODES) {
      const prompt = getPromptForMode(mode.id);
      expect(prompt).toBeDefined();
      expect(prompt).not.toBe('');
      expect(prompt).not.toContain('undefined');
    }
  });

  it('interactive modes have a sensible prompt', () => {
    for (const mode of MODES) {
      if (mode.category === 'interactive') {
        const prompt = getPromptForMode(mode.id);
        // An interactive prompt should ideally tell the AI to act as a counterpart
        expect(prompt.length).toBeGreaterThan(10);
      }
    }
  });

  it('language modes have a valid locale', () => {
    for (const mode of MODES) {
      if (mode.category === 'languages') {
        const localeMap = {
          lang_en: 'en-US',
          lang_fr: 'fr-FR',
          lang_es: 'es-ES',
          lang_it: 'it-IT'
        };
        const locale = localeMap[mode.id];
        expect(locale).toBeDefined();
      }
    }
  });
});
