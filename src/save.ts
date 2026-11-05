import { STARTING_UNITS } from './data/levels';

export interface SaveData {
  version: 1;
  completed: string[];
  unlocked: string[];
  discovered: string[];
  seenEnemies: string[];
  favorites: string[];
  lang?: string;
}

const KEY = 'teyvat-fusion-save';

const fresh = (): SaveData => ({
  version: 1,
  completed: [],
  unlocked: [...STARTING_UNITS],
  discovered: [],
  seenEnemies: [],
  favorites: [],
});

export function parseSave(text: string): SaveData {
  const data = JSON.parse(text) as Partial<SaveData>;
  if (data.version !== 1 || !Array.isArray(data.unlocked)) throw new Error('Неверный файл сохранения');
  return { ...fresh(), ...data };
}

export function loadSave(): SaveData {
  try {
    const text = localStorage.getItem(KEY);
    return text ? parseSave(text) : fresh();
  } catch {
    return fresh();
  }
}

export function storeSave(save: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Если хранилище недоступно, остаётся экспорт в файл.
  }
}
