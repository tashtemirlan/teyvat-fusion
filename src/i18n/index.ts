// Перевод интерфейса: словари хранят строку на ключ с переводами через «|» в порядке LANGS.
import type { UnitDef } from '../data/units';
import { BATTLE } from './dictBattle';
import { GAME } from './dictGame';
import { MENU } from './dictMenu';
import { LANGS, type Lang } from './langs';

export { LANGS, type Lang };

export const DICTIONARY: Record<string, string[]> = Object.fromEntries(
  Object.entries({ ...MENU, ...BATTLE, ...GAME }).map(([key, value]) => [key, value.split('|')]),
);

let current = 0;

export function detectLang(saved?: string) {
  const wanted = [saved, ...navigator.languages, navigator.language].filter(Boolean) as string[];
  for (const code of wanted) {
    const exact = LANGS.findIndex((lang) => lang.code.toLowerCase() === code.toLowerCase());
    if (exact >= 0) return LANGS[exact].code;
    if (/^zh-(tw|hk|hant)/i.test(code)) return 'zh-TW';
    const base = LANGS.findIndex((lang) => lang.code === code.split('-')[0].toLowerCase());
    if (base >= 0) return LANGS[base].code;
    if (/^(no|nn)/i.test(code)) return 'nb';
    if (/^tl/i.test(code)) return 'fil';
  }
  return 'en';
}

export function setLang(code: string) {
  current = Math.max(0, LANGS.findIndex((lang) => lang.code === code));
  document.documentElement.lang = LANGS[current].code;
  document.documentElement.dir = LANGS[current].rtl ? 'rtl' : 'ltr';
}

export const langCode = () => LANGS[current].code;
const isRussian = () => LANGS[current].code === 'ru';

// Ключ без перевода показывается как есть: так видно, чего не хватает.
export function t(key: string, ...args: Array<string | number>) {
  const row = DICTIONARY[key];
  const text = row ? row[current] || row[0] : key;
  return args.reduce<string>((out, value, index) => out.replaceAll(`{${index}}`, String(value)), text);
}

export const unitName = (def: UnitDef) => (isRussian() ? def.name : def.nameEn ?? def.name);

const ROLE: Record<string, string> = { bow: 'role_bow', catalyst: 'role_catalyst', sword: 'role_sword', claymore: 'role_claymore', polearm: 'role_polearm' };
const FIELD: Record<string, string> = { moon: 'fMoon', waterfall: 'fWater', blizzard: 'fSnow' };

// На русском остаются авторские описания, на других языках описание собирается из свойств юнита.
export function unitDesc(def: UnitDef) {
  if (isRussian()) return def.desc;
  const parts: string[] = [];
  if (def.field) {
    parts.push(t('fieldDesc', def.field.kinds.map((kind) => t(FIELD[kind])).join(', ')));
    if (def.field.kinds.includes('moon')) parts.push(t('lunarX2'));
  } else if (def.weapon) {
    parts.push(t(ROLE[def.weapon]));
  }
  if (!def.weapon && def.income) parts.push(t('paimonDesc', def.income));
  else if (def.income) parts.push(t('alsoMora'));
  if (def.ascension) parts.push(t('ascDesc', def.ascension));
  if (def.rank === 'duo') parts.push(t('duoDesc'));
  if (def.rank === 'god') parts.push(t('godDesc'));
  return parts.join('. ');
}
