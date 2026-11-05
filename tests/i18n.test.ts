import { describe, expect, it } from 'vitest';
import { UNITS } from '../src/data/units';
import { LANGS } from '../src/i18n/langs';
import { MENU } from '../src/i18n/dictMenu';
import { BATTLE } from '../src/i18n/dictBattle';
import { GAME } from '../src/i18n/dictGame';

const ALL: Record<string, string> = { ...MENU, ...BATTLE, ...GAME };
const placeholders = (text: string) => [...text.matchAll(/\{\d\}/g)].map((match) => match[0]).sort().join();

describe('локализация', () => {
  it('в каждой строке словаря перевод на каждый язык', () => {
    const bad = Object.entries(ALL).filter(([, row]) => row.split('|').length !== LANGS.length || row.split('|').some((part) => !part.trim()));
    expect(bad.map(([key, row]) => `${key}: ${row.split('|').length}`)).toEqual([]);
  });

  it('подстановки {0}, {1} одинаковы во всех языках', () => {
    const bad = Object.entries(ALL).filter(([, row]) => {
      const parts = row.split('|');
      return parts.some((part) => placeholders(part) !== placeholders(parts[0]));
    });
    expect(bad.map(([key]) => key)).toEqual([]);
  });

  it('коды языков не повторяются и их больше 50', () => {
    expect(new Set(LANGS.map((lang) => lang.code)).size).toBe(LANGS.length);
    expect(LANGS.length).toBeGreaterThanOrEqual(50);
  });

  it('у каждого юнита есть английское имя', () => {
    const bad = [...UNITS.values()].filter((unit) => !unit.nameEn || /[А-Яа-яЁё]/.test(unit.nameEn)).map((unit) => unit.id);
    expect(bad).toEqual([]);
  });
});
