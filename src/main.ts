import Phaser from 'phaser';
import { enemyLookKey } from './art/enemyLooks';
import { FIELD_THEMES, paintField } from './art/fieldArt';
import { ENDLESS, ENEMIES, ENEMY_HYBRIDS, LEVELS, WORLDS, type LevelDef } from './data/levels';
import { ENEMY_FAMILIES, HEROES, type Element, type Weapon } from './data/roster';
import { allHybrids, getUnit, heroId, recipesWith, PAIMON_INCOME, type FieldKind, type UnitDef } from './data/units';
import { detectLang, LANGS, langCode, setLang, t, unitDesc, unitName } from './i18n';
import { loadSave, parseSave, storeSave } from './save';
import { Battle, CAST_TIME, COLS, ROWS, type FieldHit, type FuseCheck, type Unit } from './sim/battle';

// Поле подстраивается под окно, поэтому размеры считает layoutBoard.
const REFERENCE_CELL = 68;
const DPR = Math.min(window.devicePixelRatio || 1, 2);
let CELL_W = REFERENCE_CELL;
let CELL_H = REFERENCE_CELL;
let UI = 1;
let BOARD_X = 40;
let BOARD_Y = 30;
let WIDTH = 800;
let HEIGHT = 640;

const ELEMENT_COLORS: Record<Element, number> = {
  pyro: 0xe8603c, hydro: 0x3f9be6, anemo: 0x62d6b2, electro: 0xa772e8,
  dendro: 0x8fc73e, cryo: 0x9fdcec, geo: 0xd9a93f,
};
const ELEMENTS: Element[] = ['pyro', 'hydro', 'anemo', 'electro', 'dendro', 'cryo', 'geo'];
const WEAPONS: Weapon[] = ['sword', 'claymore', 'polearm', 'catalyst', 'bow'];
const WORLD_KEYS: Record<string, string> = {
  Mondstadt: 'w_mondstadt', Liyue: 'w_liyue', Inazuma: 'w_inazuma', Sumeru: 'w_sumeru', Fontaine: 'w_fontaine',
  Natlan: 'w_natlan', 'Nod-Krai': 'w_nodkrai', Snezhnaya: 'w_snezhnaya', None: 'w_beyond',
};
const FAMILY_KEYS: Record<string, string> = {
  'Элементальные существа': 'f_elemental', 'Хиличурлы': 'f_hilichurl', 'Бездна': 'f_abyss', 'Фатуи': 'f_fatui', 'Автоматоны': 'f_automaton',
  'Другие фракции людей': 'f_humans', 'Мистические звери': 'f_beasts', 'Особые враги': 'f_bosses', 'Вне архива': 'f_other',
};
const worldName = (index: number) => t(WORLD_KEYS[WORLDS[index].key]);
const dayOf = (level: LevelDef) => LEVELS.filter((other) => other.world === level.world).indexOf(level) + 1;
const PAIMON_COLOR = 0xf3e7c4;

const FRAME_SIZE = 192;
const SPRITE_FRAMES = 8;
const HERO_DISPLAY = 112;
const GOD_DISPLAY = 132;
const MAX_NUMBERS = 30;
const ENEMY_DISPLAY: Record<number, number> = { 1: 74, 2: 84, 4: 96, 9: 112, 16: 132, 30: 160, 60: 230 };

// Список готовых спрайтов создаёт рендер моделей, без него игра показывает фишки.
const spriteIds: string[] = await fetch('/sprites/manifest.json')
  .then((response) => (response.ok ? response.json() : []))
  .catch(() => []);
const hasSprite = (id: string) => spriteIds.includes(id);

// Базовые герои, из которых собран гибрид: главный идёт первым.
function rootsOf(def: UnitDef): string[] {
  if (!def.parents) return def.id.startsWith('paimon') ? [] : [def.id];
  const parents = def.parents.map(getUnit).sort((a, b) => b.damage - a.damage);
  return [...new Set(parents.flatMap(rootsOf))];
}

// Первый кадр спрайта как портрет: size задаёт высоту кадра, x и y сдвигают его к голове.
function portrait(key: string, size: number, x = 0, y = 0) {
  return hasSprite(key) ? `background:url(/sprites/${key}.png) ${x}px ${y}px / ${size * SPRITE_FRAMES}px ${size}px no-repeat` : '';
}

const css = (color: number) => `#${color.toString(16).padStart(6, '0')}`;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const unitColor = (def: UnitDef) => (def.elements.length ? ELEMENT_COLORS[def.elements[0]] : PAIMON_COLOR);

const save = loadSave();
let battle: Battle | null = null;
let selected: string | null = null;
let tool: 'glove' | 'shovel' | null = null;
let dragging: Unit | null = null;
let paused = false;
let speed = 1;
let search = '';
let filter: Element | Weapon | 'favorites' | null = null;
let toastTimer = 0;
let battleEnded = false;
let infoHover: UnitDef | null = null;
let infoShown: string | null = null;
let sceneRef: BattleScene | null = null;

function toast(text: string) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.hidden = true), 2600);
}

function addUnique(list: string[], value: string) {
  if (list.includes(value)) return false;
  list.push(value);
  storeSave(save);
  return true;
}

// Экраны вне боя

function showScreen(html: string) {
  $('battle').hidden = true;
  const screen = $('screen');
  screen.hidden = false;
  screen.innerHTML = html;
  battle = null;
}

function levelAvailable(index: number) {
  return index === 0 || save.completed.includes(LEVELS[index - 1].id);
}

let menuWorld: number | null = null;

function nextLevelIndex() {
  const index = LEVELS.findIndex((level) => !save.completed.includes(level.id));
  return index < 0 ? LEVELS.length - 1 : index;
}

function showMenu() {
  const next = nextLevelIndex();
  const world = menuWorld ?? LEVELS[next].world;
  const tabs = WORLDS.map((item, index) => {
    const levels = LEVELS.filter((level) => level.world === index);
    const done = levels.filter((level) => save.completed.includes(level.id)).length;
    return `<button class="${index === world ? 'active' : ''}" data-world="${index}">${worldName(index)}<small>${t('xOfY', done, levels.length)}</small></button>`;
  }).join('');
  const tiles = LEVELS.map((level, index) => ({ level, index })).filter(({ level }) => level.world === world).map(({ level, index }, position) => {
    const available = levelAvailable(index);
    const done = save.completed.includes(level.id);
    const reward = level.reward && available ? portrait(level.reward, 56) : '';
    return `<button class="level ${done ? 'done' : ''} ${index === next ? 'next' : ''}" data-level="${index}" ${available ? '' : 'disabled'}>
      <div class="face" style="${reward}"></div>
      <div><strong>${t('dayN', position + 1)}</strong>
      <small>${level.night ? t('night') : t('daytime')}, ${t('wavesN', level.waves.length)}</small>
      <small>${done ? t('cleared') : level.reward && available ? t('rewardX', unitName(getUnit(level.reward))) : available ? '' : t('locked')}</small></div>
    </button>`;
  }).join('');
  showScreen(`
    <div class="menu">
      <section class="menu-hero">
        <h1>Teyvat<br>Fusion</h1>
        <p>${t('subtitle')}</p>
        <button class="big primary" id="continue-btn">${t('continue')}<small>${worldName(LEVELS[next].world)}, ${t('dayN', dayOf(LEVELS[next]))}</small></button>
        <button class="big" id="endless-btn">${t('endless')}</button>
        <button class="big" id="almanac-btn">${t('almanac')}</button>
        <div class="menu-small">
          <button id="export-btn">${t('exportSave')}</button>
          <button id="import-btn">${t('importSave')}</button>
        </div>
        <label class="lang">${t('language')}
          <select id="lang-select">${LANGS.map((lang) => `<option value="${lang.code}" ${lang.code === langCode() ? 'selected' : ''}>${lang.name}</option>`).join('')}</select>
        </label>
        <input id="import-file" type="file" accept="application/json" hidden />
        <div class="showcase">
          ${['columbina', 'anastasya', 'furina'].map((id) => `<div class="face" style="background-image:url(/sprites/${id}.png);background-size:${SPRITE_FRAMES * 100}% 100%"></div>`).join('')}
        </div>
      </section>
      <section class="menu-worlds">
        <div class="world-tabs">${tabs}</div>
        <h2 class="world-title">${worldName(world)}</h2>
        <div class="levels">${tiles}</div>
      </section>
    </div>
  `);
  $('continue-btn').onclick = () => startBattle(LEVELS[next]);
  $<HTMLSelectElement>('lang-select').onchange = (event) => {
    save.lang = (event.target as HTMLSelectElement).value;
    storeSave(save);
    applyLang();
    showMenu();
  };
  document.querySelectorAll<HTMLButtonElement>('[data-world]').forEach((button) => {
    button.onclick = () => {
      menuWorld = Number(button.dataset.world);
      showMenu();
    };
  });
  document.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((button) => {
    button.onclick = () => startBattle(LEVELS[Number(button.dataset.level)]);
  });
  $('almanac-btn').onclick = () => showAlmanac('legends');
  $('endless-btn').onclick = () => startBattle(ENDLESS);
  $('export-btn').onclick = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' }));
    link.download = 'teyvat-fusion-save.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };
  $('import-btn').onclick = () => $('import-file').click();
  $<HTMLInputElement>('import-file').onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      Object.assign(save, parseSave(await file.text()));
      storeSave(save);
      showMenu();
    } catch {
      toast(t('saveError'));
    }
  };
}

function unitStats(def: UnitDef) {
  const parts = [t('cost', def.cost), t('hp', def.hp)];
  if (def.damage) parts.push(t('dmg', def.damage), t('range', def.range));
  if (def.income) parts.push(t('income', def.income));
  if (def.splash) parts.push(t('area'));
  if (def.chain) parts.push(t('chain', def.chain));
  if (def.field) parts.push(t('fieldStat', def.field.damage, def.field.interval.toFixed(1)));
  return parts.join(', ');
}

type AlmanacTab = 'legends' | 'hybrids' | 'ascensions' | 'paimon' | 'heroes' | 'enemies';

const isPaimonMix = (def: UnitDef) => def.id.startsWith('paimon_') && !/^paimon_\dx$/.test(def.id);
const hasGoddess = (def: UnitDef) => def.field !== undefined;

function unitTile(def: UnitDef) {
  const recipe = def.parents ? `${unitName(getUnit(def.parents[0]))} + ${unitName(getUnit(def.parents[1]))}` : '';
  const other = (def.extraRecipes ?? []).map(([a, b]) => `<small>${t('orX', `${unitName(getUnit(a))} + ${unitName(getUnit(b))}`)}</small>`).join('');
  const key = hasSprite(def.id) ? def.id : rootsOf(def)[0] ?? 'paimon';
  return `<div class="tile" data-search="${unitName(def).toLowerCase()} ${def.name.toLowerCase()} ${recipe.toLowerCase()}" style="border-color:${css(unitColor(def))}">
    <div class="face" style="${portrait(key, 84)}"></div><strong>${unitName(def)}</strong>
    ${recipe ? `<small>${recipe}</small>` : ''}${other}<small>${unitDesc(def)}</small><small>${unitStats(def)}</small></div>`;
}

const tierSections = (list: UnitDef[]) => {
  const byTier = new Map<number, UnitDef[]>();
  for (const def of list) byTier.set(def.tier, [...(byTier.get(def.tier) ?? []), def]);
  return [...byTier.keys()].sort((a, b) => a - b)
    .map((tier) => `<h2>${t('tierN', tier)}</h2><div class="grid">${byTier.get(tier)!.map(unitTile).join('')}</div>`).join('');
};

function showAlmanac(tab: AlmanacTab, inBattle = false) {
  const hybrids = allHybrids();
  const heroes = HEROES.map((hero) => getUnit(heroId(hero.name)));
  const legends = hybrids.filter((def) => hasGoddess(def) && !def.ascension && !isPaimonMix(def));
  const plain = hybrids.filter((def) => !hasGoddess(def) && !def.ascension && !isPaimonMix(def) && !/^paimon_\dx$/.test(def.id));
  const ascensions = hybrids.filter((def) => def.ascension);
  const paimon = [getUnit('paimon'), ...hybrids.filter((def) => def.id.startsWith('paimon_'))];
  const families: Array<[string, string[]]> = [...Object.entries(ENEMY_FAMILIES).map(([family, names]): [string, string[]] => [t(FAMILY_KEYS[family]), names]), [t('enemyHybrids'), ENEMY_HYBRIDS.map((id) => ENEMIES[id].name)]];
  const enemyTotal = families.reduce((sum, [, names]) => sum + names.length, 0);
  let body = '';
  if (tab === 'legends') {
    const gods = legends.filter((def) => def.rank === 'god');
    const duos = legends.filter((def) => def.rank === 'duo');
    const rest = legends.filter((def) => !def.rank);
    body = `<h2>${t('godTier')}</h2><div class="grid">${gods.map(unitTile).join('')}</div>
      <h2>${t('duos')}</h2><div class="grid">${duos.map(unitTile).join('')}</div>
      <h2>${t('goddesses')}</h2><div class="grid">${['columbina', 'furina', 'anastasya'].map((id) => unitTile(getUnit(id))).join('')}</div>
      <h2>${t('goddessHybrids')}</h2><div class="grid">${rest.map(unitTile).join('')}</div>`;
  } else if (tab === 'hybrids') {
    body = tierSections(plain);
  } else if (tab === 'ascensions') {
    body = tierSections(ascensions);
  } else if (tab === 'paimon') {
    body = `<div class="grid">${paimon.map(unitTile).join('')}</div>`;
  } else if (tab === 'heroes') {
    body = `<div class="grid">${heroes.map((def) => unitTile(def)).join('')}</div>`;
  } else {
    body = families.map(([family, names]) => `
      <h2>${family}</h2>
      <div class="grid">${names.map((name) => `<div class="tile" data-search="${name.toLowerCase()}"><div class="face" style="${portrait(enemyLookKey(name.split(' × ')[0]), 84)}"></div><strong>${name}</strong></div>`).join('')}</div>
    `).join('');
  }
  const tabs: Array<[AlmanacTab, string]> = [
    ['legends', `${t('tabLegends')} ${legends.length + 3}`], ['hybrids', `${t('tabHybrids')} ${plain.length}`], ['ascensions', `${t('tabAscensions')} ${ascensions.length}`],
    ['paimon', `${t('tabPaimon')} ${paimon.length}`], ['heroes', `${t('tabHeroes')} ${heroes.length}`], ['enemies', `${t('tabEnemies')} ${enemyTotal}`],
  ];
  const html = `
    <div class="almanac">
    <h1>${t('almanac')}</h1>
    <div class="almanac-bar">
      <button id="back">${inBattle ? t('backBattle') : t('back')}</button>
      ${tabs.map(([id, label]) => `<button data-tab="${id}" class="${tab === id ? 'active' : ''}">${label}</button>`).join('')}
      <input id="almanac-search" type="search" placeholder="${t('almanacSearch')}" />
    </div>
    ${body}
    </div>
  `;
  // В бою альманах открывается поверх поля, а бой стоит на паузе.
  const root = inBattle ? $('almanac-modal') : $('screen');
  if (inBattle) {
    root.innerHTML = html;
    root.hidden = false;
  } else {
    showScreen(html);
  }
  root.querySelector<HTMLButtonElement>('#back')!.onclick = inBattle ? closeBattleAlmanac : showMenu;
  root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
    button.onclick = () => showAlmanac(button.dataset.tab as AlmanacTab, inBattle);
  });
  const searchBox = root.querySelector<HTMLInputElement>('#almanac-search')!;
  searchBox.value = almanacQuery;
  searchBox.oninput = () => {
    almanacQuery = searchBox.value;
    filterAlmanac(root);
  };
  filterAlmanac(root);
  if (inBattle) searchBox.focus();
}

let almanacQuery = '';
let pausedByAlmanac = false;

function filterAlmanac(root: HTMLElement) {
  const query = almanacQuery.trim().toLowerCase();
  {
    root.querySelectorAll<HTMLElement>('.tile[data-search]').forEach((tile) => {
      tile.style.display = tile.dataset.search!.includes(query) ? '' : 'none';
    });
    // Пустые разделы прячутся вместе с заголовком.
    root.querySelectorAll<HTMLElement>('.grid').forEach((grid) => {
      const empty = ![...grid.children].some((tile) => (tile as HTMLElement).style.display !== 'none');
      grid.style.display = empty ? 'none' : '';
      const title = grid.previousElementSibling as HTMLElement | null;
      if (title?.tagName === 'H2') title.style.display = empty ? 'none' : '';
    });
  }
}

function openBattleAlmanac(query = '') {
  if (!battle || battle.status !== 'playing') return;
  if (!paused) {
    pausedByAlmanac = true;
    togglePause();
  }
  almanacQuery = query;
  showAlmanac(query ? 'hybrids' : 'legends', true);
}

function closeBattleAlmanac() {
  $('almanac-modal').hidden = true;
  if (pausedByAlmanac && paused) togglePause();
  pausedByAlmanac = false;
}

// Бой

function startBattle(level: LevelDef) {
  $('screen').hidden = true;
  $('battle').hidden = false;
  $('overlay').hidden = true;
  battle = new Battle(level);
  // Пока экран боя скрыт, у него нулевые размеры, поэтому поле считается только сейчас.
  sceneRef?.layoutBoard();
  battleEnded = false;
  selected = null;
  tool = null;
  dragging = null;
  paused = false;
  speed = 1;
  search = '';
  $<HTMLInputElement>('search').value = '';
  buildFilters();
  buildCards();
  syncButtons();
}

function endBattle(won: boolean) {
  const level = battle!.level;
  const overlay = $('overlay');
  let reward = '';
  if (won && !save.completed.includes(level.id)) {
    if (level.reward) {
      addUnique(save.unlocked, level.reward);
      reward = `<p>${t('newHero', `<strong>${unitName(getUnit(level.reward))}</strong>`)}</p>`;
    }
    addUnique(save.completed, level.id);
  }
  const survived = battle!.isEndless ? `<p>${t('wavesCleared', battle!.waveNumber - 1)}</p>` : '';
  overlay.innerHTML = `<div class="result">
    <h2>${won ? t('victory') : t('defeat')}</h2>${reward}${survived}
    <div class="row">
      <button id="again">${won ? t('playAgain') : t('retry')}</button>
      <button id="to-menu">${t('mainMenu')}</button>
    </div></div>`;
  overlay.hidden = false;
  $('again').onclick = () => startBattle(level);
  $('to-menu').onclick = showMenu;
}

function setSelected(id: string | null) {
  selected = id;
  tool = null;
  dragging = null;
  syncButtons();
}

function setTool(next: 'glove' | 'shovel') {
  tool = tool === next ? null : next;
  selected = null;
  dragging = null;
  syncButtons();
}

function togglePause() {
  paused = !paused;
  syncButtons();
}

function setSpeed(value: number) {
  speed = value;
  syncButtons();
}

function syncButtons() {
  $('glove').classList.toggle('active', tool === 'glove');
  $('shovel').classList.toggle('active', tool === 'shovel');
  $('pause').classList.toggle('active', paused);
  document.querySelectorAll<HTMLButtonElement>('.speed').forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.speed) === speed);
  });
  document.querySelectorAll<HTMLElement>('.card').forEach((card) => {
    card.classList.toggle('active', card.dataset.unit === selected);
  });
}

function buildFilters() {
  const options: Array<[typeof filter, string]> = [
    ['favorites', '★'],
    ...ELEMENTS.map((key): [Element, string] => [key, t(key)]),
    ...WEAPONS.map((key): [Weapon, string] => [key, t(key)]),
  ];
  const box = $('filters');
  box.innerHTML = '';
  for (const [value, label] of options) {
    const button = document.createElement('button');
    button.textContent = label;
    button.classList.toggle('active', filter === value);
    button.onclick = () => {
      filter = filter === value ? null : value;
      buildFilters();
      buildCards();
    };
    box.append(button);
  }
}

// В бесконечном режиме открыты все герои и все рецепты.
function availableIds() {
  return battle?.isEndless ? ['paimon', ...HEROES.map((hero) => heroId(hero.name))] : save.unlocked;
}

const isKnownRecipe = (id: string) => battle?.isEndless || save.discovered.includes(id);

function visibleUnits(): UnitDef[] {
  return availableIds().map(getUnit).filter((def) => {
    if (search && !`${unitName(def)} ${def.name}`.toLowerCase().includes(search)) return false;
    if (filter === 'favorites') return save.favorites.includes(def.id);
    if (filter) return def.elements.includes(filter as Element) || def.weapon === filter;
    return true;
  });
}

function favoritesOrdered() {
  const open = availableIds();
  return save.favorites.filter((id) => open.includes(id));
}

function buildCards() {
  const box = $('cards');
  box.innerHTML = '';
  for (const def of visibleUnits()) {
    const card = document.createElement('button');
    card.className = 'card';
    card.dataset.unit = def.id;
    const favorite = save.favorites.includes(def.id);
    const hotkey = favoritesOrdered().indexOf(def.id) + 1;
    const icon = hasSprite(def.id) ? `${portrait(def.id, 74, -8, -2)};background-color:${css(unitColor(def))}55` : `background:${css(unitColor(def))}`;
    card.innerHTML = `<span class="dot" style="${icon}"></span>
      <span class="name">${unitName(def)}</span>
      ${hotkey > 0 && hotkey <= 9 ? `<kbd>${hotkey}</kbd>` : ''}
      <span class="cost">${def.cost}</span>
      <span class="star ${favorite ? 'on' : ''}" title="${t('favorite')}">★</span>`;
    card.title = `${unitDesc(def)}. ${unitStats(def)}`;
    card.onmouseenter = () => (infoHover = def);
    card.onmouseleave = () => (infoHover = null);
    card.onclick = (event) => {
      if ((event.target as HTMLElement).classList.contains('star')) {
        save.favorites = favorite ? save.favorites.filter((id) => id !== def.id) : [...save.favorites, def.id];
        storeSave(save);
        buildCards();
        return;
      }
      setSelected(selected === def.id ? null : def.id);
    };
    box.append(card);
  }
  syncButtons();
}

function updateHud() {
  if (!battle) return;
  $('mora').textContent = String(battle.mora);
  $('wave').textContent = battle.isEndless ? String(battle.waveNumber) : t('xOfY', Math.min(battle.waveNumber, battle.totalWaves), battle.totalWaves);
  $('wave-bar').style.width = battle.isEndless ? '100%' : `${(battle.waveNumber / battle.totalWaves) * 100}%`;
  const last = battle.lastEnemyTimeLeft;
  $('last').textContent = last !== null ? t('nextWave', Math.ceil(last)) : '';
  $('glove').innerHTML = battle.gloveCooldown > 0 ? `${t('glove')} ${battle.gloveCooldown.toFixed(1)}` : `${t('glove')} <kbd>G</kbd>`;
  document.querySelectorAll<HTMLElement>('.card').forEach((card) => {
    const id = card.dataset.unit!;
    const left = battle!.cooldowns.get(id) ?? 0;
    card.classList.toggle('unavailable', !battle!.canAfford(id));
    card.style.setProperty('--cd', String(left / getUnit(id).cooldown));
    const cost = card.querySelector('.cost')!;
    const text = left > 0 ? left.toFixed(1) : String(getUnit(id).cost);
    if (cost.textContent !== text) cost.textContent = text;
  });
}

// Карточка героя: описание и что из него можно собрать дальше.
function renderInfo(def: UnitDef | null) {
  if (!def || def.id === infoShown) return;
  infoShown = def.id;
  const info = $('info');
  const key = hasSprite(def.id) ? def.id : rootsOf(def)[0] ?? 'paimon';
  const known = (id: string) => isKnownRecipe(id) || !battle;
  const open = new Set(availableIds());
  const recipes = recipesWith(def.id).map(({ partner, result }) => {
    const partnerDef = getUnit(partner);
    const resultDef = getUnit(result);
    const ready = open.has(partner);
    return `<button class="recipe ${ready ? '' : 'far'}" data-partner="${partner}" title="${ready ? t('pickToPlace') : t('builtOnField')}">
      <span class="mini" style="${portrait(hasSprite(partner) ? partner : rootsOf(partnerDef)[0] ?? 'paimon', 34)}"></span>
      <span>+ ${unitName(partnerDef)}</span>
      <b>→ ${known(result) ? unitName(resultDef) : '???'}</b><i>${resultDef.tier}</i>
    </button>`;
  }).join('');
  info.innerHTML = `<div class="face" style="${portrait(key, 92)}"></div><strong>${unitName(def)}</strong><small>${unitDesc(def)}</small><small>${unitStats(def)}</small>
    <div class="recipes-title">${recipes ? t('fuseNext') : t('lineEnd')}</div>
    <div class="recipes">${recipes}</div>
    <button class="find" id="info-almanac">${t('findAlmanac')}</button>`;
  info.querySelectorAll<HTMLButtonElement>('[data-partner]').forEach((button) => {
    button.onclick = () => {
      if (open.has(button.dataset.partner!)) setSelected(button.dataset.partner!);
    };
  });
  $('info-almanac').onclick = () => openBattleAlmanac(unitName(def).toLowerCase());
}

function describeCheck(check: FuseCheck, targetName?: string): string {
  if (check.kind === 'blocked') return targetName ? t('cantFuseWith', targetName) : t('cantPlace');
  if (check.kind === 'empty') return '';
  return isKnownRecipe(check.result) ? t('result', unitName(getUnit(check.result))) : t('somethingNew');
}

// Сцена рисует состояние боя.
interface FieldEffect {
  kind: FieldKind;
  tier: number;
  colors: number[];
  hits: FieldHit[];
  time: number;
  duration: number;
}

const FIELD_DURATION: Record<FieldKind, number> = { moon: 1.7, waterfall: 1.5, blizzard: 1.9 };

class BattleScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Graphics;
  private labels = new Map<number, Phaser.GameObjects.Text>();
  private sprites = new Map<number, { defId: string; items: Array<{ image: Phaser.GameObjects.Image; dx: number; dy: number; attack: boolean }> }>();
  private shots: Array<{ row: number; from: number; to: number; color: number; life: number }> = [];
  private floats: Array<{ text: Phaser.GameObjects.Text; life: number }> = [];
  private hoverLabel!: Phaser.GameObjects.Text;
  private hover: { row: number; col: number } | null = null;
  private client: { x: number; y: number } | null = null;
  private hudTimer = 0;
  private fx!: Phaser.GameObjects.Graphics;
  private effects: FieldEffect[] = [];
  private requested = new Set<string>();
  private background?: Phaser.GameObjects.Image;

  constructor() {
    super('battle');
  }

  preload() {
    const loading = $('loading');
    this.load.on('progress', (value: number) => (loading.textContent = t('loading', Math.round(value * 100))));
    this.load.on('complete', () => (loading.hidden = true));
    // Гибриды и возвышения подгружаются при первом появлении: их сотни, а видеопамять не бесконечна.
    const heroes = new Set(HEROES.map((hero) => heroId(hero.name)));
    for (const id of spriteIds) {
      if (heroes.has(id) || id === 'paimon' || id.startsWith('enemy_')) this.loadSprite(id);
    }
  }

  private loadSprite(id: string) {
    this.load.spritesheet(id, `/sprites/${id}.png`, { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE });
  }

  // Спрайт готов к показу, иначе ставится в очередь загрузки.
  private spriteReady(id: string) {
    if (this.textures.exists(id)) return true;
    if (hasSprite(id) && !this.requested.has(id)) {
      this.requested.add(id);
      this.loadSprite(id);
      this.load.start();
    }
    return false;
  }

  // Поле занимает весь центр окна: клетки растягиваются под свободное место.
  layoutBoard() {
    const board = $('board');
    const width = board.clientWidth;
    const height = board.clientHeight;
    if (!width || !height) return;
    CELL_W = width / (COLS + 0.65 + 0.9);
    CELL_H = height / (ROWS + 0.55 + 0.2);
    UI = Math.min(CELL_W, CELL_H) / REFERENCE_CELL;
    BOARD_X = CELL_W * 0.65;
    BOARD_Y = CELL_H * 0.55;
    WIDTH = width;
    HEIGHT = height;
    this.scale.setGameSize(Math.round(width * DPR), Math.round(height * DPR));
    this.scale.setZoom(1 / DPR);
    const camera = this.cameras.main;
    camera.setSize(Math.round(width * DPR), Math.round(height * DPR));
    camera.setOrigin(0, 0);
    camera.setZoom(DPR);
    camera.setScroll(0, -BOARD_Y);
    this.scale.refresh();
    for (const key of [...this.sprites.keys()]) this.dropSprites(key);
    for (const label of this.labels.values()) label.destroy();
    this.labels.clear();
    this.paintBackground();
  }

  private paintBackground() {
    if (!battle) return;
    const theme = FIELD_THEMES[battle.level.world >= 0 ? battle.level.world : FIELD_THEMES.length - 1];
    const canvas = document.createElement('canvas');
    paintField(canvas, theme, {
      width: WIDTH, height: HEIGHT, boardX: BOARD_X, boardY: BOARD_Y, cellW: CELL_W, cellH: CELL_H, rows: ROWS, cols: COLS,
    }, battle.level.night, DPR);
    this.background?.destroy();
    if (this.textures.exists('field')) this.textures.remove('field');
    this.textures.addCanvas('field', canvas);
    this.background = this.add.image(0, -BOARD_Y, 'field').setOrigin(0, 0).setScale(1 / DPR).setDepth(-10);
  }

  create() {
    sceneRef = this;
    this.layer = this.add.graphics();
    this.fx = this.add.graphics().setDepth(30);
    this.hoverLabel = this.add.text(0, 0, '', { fontSize: '28px', fontStyle: 'bold', color: '#ffffff', resolution: DPR }).setOrigin(0.5).setDepth(10);
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.onMove(pointer));
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onDown(pointer));
    this.input.on('pointerup', () => this.onUp());
    this.input.on('pointerout', () => {
      this.hover = null;
      this.client = null;
    });
    this.input.mouse?.disableContextMenu();
    this.layoutBoard();
  }

  private cellAt(pointer: Phaser.Input.Pointer) {
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const col = Math.floor((point.x - BOARD_X) / CELL_W);
    const row = Math.floor(point.y / CELL_H);
    return row >= 0 && row < ROWS && col >= 0 && col < COLS ? { row, col } : null;
  }

  private onMove(pointer: Phaser.Input.Pointer) {
    this.hover = this.cellAt(pointer);
    const event = pointer.event as MouseEvent | undefined;
    this.client = event && 'clientX' in event ? { x: event.clientX, y: event.clientY } : null;
  }

  private onDown(pointer: Phaser.Input.Pointer) {
    if (!battle || battle.status !== 'playing') return;
    if (pointer.rightButtonDown()) {
      setSelected(null);
      tool = null;
      syncButtons();
      return;
    }
    const cell = this.cellAt(pointer);
    if (!cell) return;
    const unit = battle.unitAt(cell.row, cell.col);
    if (tool === 'glove') {
      if (unit && battle.gloveCooldown <= 0) dragging = unit;
    } else if (tool === 'shovel') {
      if (unit) {
        battle.sell(unit);
        tool = null;
        syncButtons();
      }
    } else if (selected) {
      if (battle.place(selected, cell.row, cell.col)) setSelected(null);
    } else if (unit) {
      renderInfo(unit.def);
    }
  }

  private onUp() {
    if (!battle || !dragging) return;
    if (this.hover && battle.glove(dragging, this.hover.row, this.hover.col)) {
      tool = null;
      syncButtons();
    }
    dragging = null;
  }

  update(_: number, deltaMs: number) {
    if (!battle) {
      this.clearAll();
      return;
    }
    const dt = Math.min(deltaMs / 1000, 0.1);
    if (!paused) battle.step(dt * speed);
    this.drainEvents();
    this.draw(paused ? 0 : dt * speed);
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      updateHud();
      this.updateHint();
    }
    if (battle.status !== 'playing' && !battleEnded) {
      battleEnded = true;
      endBattle(battle.status === 'won');
    }
  }

  private clearAll() {
    $('enemy-tip').hidden = true;
    this.layer.clear();
    this.hoverLabel.setText('');
    for (const label of this.labels.values()) label.destroy();
    this.labels.clear();
    for (const key of [...this.sprites.keys()]) this.dropSprites(key);
    for (const item of this.floats) item.text.destroy();
    this.floats = [];
    this.shots = [];
    this.effects = [];
    this.fx.clear();
  }

  private drainEvents() {
    for (const event of battle!.events) {
      if (event.type === 'shot') {
        this.shots.push({ row: event.row, from: event.from, to: event.to, color: event.element ? ELEMENT_COLORS[event.element] : 0xffffff, life: 0.14 });
      } else if (event.type === 'reaction') {
        const text = this.add.text(BOARD_X + event.x * CELL_W, event.row * CELL_H + 18 * UI, t(event.name), {
          fontSize: `${Math.round(15 * UI)}px`, fontStyle: 'bold', color: '#ffe9a8', stroke: '#000000', strokeThickness: 3, resolution: DPR,
        }).setOrigin(0.5).setDepth(9);
        this.floats.push({ text, life: 0.8 });
      } else if (event.type === 'field') {
        this.effects.push({
          kind: event.kind, tier: event.tier, hits: event.hits, time: 0, duration: FIELD_DURATION[event.kind],
          colors: event.elements.map((element) => ELEMENT_COLORS[element]),
        });
        this.floatFieldNumbers(event.hits);
        if (event.tier >= 5) {
          const title = this.add.text(WIDTH / 2, ROWS * CELL_H * 0.42, unitName(getUnit(event.name)), {
            resolution: DPR,
            fontSize: `${Math.round((event.tier >= 7 ? 46 : 30) * UI)}px`, fontStyle: 'bold', color: event.tier >= 7 ? '#ffe27a' : '#ffffff', stroke: '#1a1030', strokeThickness: 6,
          }).setOrigin(0.5).setDepth(40);
          this.floats.push({ text: title, life: 1.3 });
          this.cameras.main.shake(event.tier >= 7 ? 500 : 250, event.tier >= 7 ? 0.012 : 0.005);
        }
      } else if (event.type === 'discover' && !battle!.isEndless) {
        if (addUnique(save.discovered, event.id)) toast(t('newHybrid', unitName(getUnit(event.id))));
      }
    }
    battle!.events = [];
  }

  private floatFieldNumbers(hits: FieldHit[]) {
    for (const hit of hits.slice(0, MAX_NUMBERS)) {
      const text = this.add.text(BOARD_X + hit.x * CELL_W, hit.row * CELL_H + 8 * UI, hit.lunar ? `x2 ${hit.damage}` : String(hit.damage), {
        resolution: DPR,
        fontSize: `${Math.round((hit.lunar ? 19 : 15) * UI)}px`, fontStyle: 'bold', color: hit.lunar ? '#d8a8ff' : '#ffffff', stroke: '#14102a', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(35);
      this.floats.push({ text, life: 1 });
    }
  }

  // Атаки богинь накрывают всё поле.
  private drawEffects(dt: number) {
    const g = this.fx;
    g.clear();
    for (const effect of this.effects) {
      effect.time += dt;
      const progress = Math.min(1, effect.time / effect.duration);
      if (effect.kind === 'moon') this.drawMoon(g, effect, progress);
      else if (effect.kind === 'waterfall') this.drawWaterfall(g, effect, progress);
      else this.drawBlizzard(g, effect, progress);
      if (effect.tier >= 7 && progress < 0.2) g.fillStyle(0xffe27a, 0.5 * (1 - progress * 5)).fillRect(0, -BOARD_Y, WIDTH, HEIGHT);
    }
    this.effects = this.effects.filter((effect) => effect.time < effect.duration);
  }

  private drawMoon(g: Phaser.GameObjects.Graphics, effect: FieldEffect, progress: number) {
    const fade = Math.sin(Math.PI * progress);
    g.fillStyle(0x0a0a2a, 0.5 * fade).fillRect(0, -BOARD_Y, WIDTH, HEIGHT);
    for (let i = 0; i < 36; i++) {
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(effect.time * 6 + i));
      g.fillStyle(0xffffff, fade * twinkle).fillCircle(((i * 97) % 100) / 100 * WIDTH, ((i * 53) % 100) / 100 * ROWS * CELL_H, (1 + (i % 3)) * UI);
    }
    const radius = (44 + Math.min(effect.tier, 7) * 6) * UI;
    const x = WIDTH / 2;
    const y = -radius - BOARD_Y + Math.min(1, progress / 0.3) * (radius + BOARD_Y + 110 * UI);
    for (let i = 6; i > 0; i--) g.fillStyle(0xcfc8ff, 0.07 * fade).fillCircle(x, y, radius + i * 12);
    effect.colors.forEach((color, index) => {
      g.lineStyle(4, color, 0.9 * fade).strokeCircle(x, y, radius + 10 + index * 8 + Math.sin(effect.time * 5) * 3);
    });
    g.fillStyle(0xf6f2ff, Math.min(1, fade * 2)).fillCircle(x, y, radius);
    g.fillStyle(0xd6cdf2, Math.min(1, fade * 2));
    g.fillCircle(x - radius * 0.35, y - radius * 0.2, radius * 0.2).fillCircle(x + radius * 0.3, y + radius * 0.3, radius * 0.26).fillCircle(x + radius * 0.2, y - radius * 0.45, radius * 0.12);
    if (progress < 0.25 || progress > 0.85) return;
    const beam = Math.sin(Math.PI * (progress - 0.25) / 0.6);
    for (const hit of effect.hits) {
      const tx = BOARD_X + hit.x * CELL_W;
      const ty = (hit.row + 0.5) * CELL_H;
      g.lineStyle(hit.lunar ? 7 : 4, hit.lunar ? 0xc070ff : 0xe0d8ff, 0.8 * beam).lineBetween(x, y, tx, ty);
      g.lineStyle(1.5, 0xffffff, beam).lineBetween(x, y, tx, ty);
      g.fillStyle(hit.lunar ? 0xd8a8ff : 0xffffff, 0.75 * beam).fillCircle(tx, ty, (10 + 24 * (progress - 0.25)) * UI);
      g.lineStyle(3, 0xffffff, beam).strokeCircle(tx, ty, (16 + 46 * (progress - 0.25)) * UI);
    }
  }

  private drawWaterfall(g: Phaser.GameObjects.Graphics, effect: FieldEffect, progress: number) {
    const fade = Math.sin(Math.PI * progress);
    const height = HEIGHT;
    g.fillStyle(0x0a2a5a, 0.35 * fade).fillRect(0, -BOARD_Y, WIDTH, HEIGHT);
    const streams = 24 + effect.tier * 4;
    for (let i = 0; i < streams; i++) {
      const x = ((i + 0.5) / streams) * WIDTH;
      const fall = Math.min(1, Math.max(0, progress * 2.4 - (i % 5) * 0.08));
      const width = (WIDTH / streams) * (0.55 + (i % 3) * 0.2);
      g.fillStyle(i % 2 ? 0x3f9be6 : 0x6fc0f5, 0.65 * fade).fillRect(x - width / 2, -BOARD_Y, width, height * fall);
      g.fillStyle(0xe8f6ff, 0.8 * fade).fillRect(x - 1, -BOARD_Y + ((effect.time * 900 + i * 37) % height) * fall, 2, 30);
      if (fall >= 1) g.fillStyle(0xffffff, 0.7 * fade).fillCircle(x, height - BOARD_Y - 4, 7 + Math.abs(Math.sin(effect.time * 12 + i)) * 7);
    }
    if (progress < 0.3) return;
    const burst = (progress - 0.3) / 0.7;
    for (const hit of effect.hits) {
      const tx = BOARD_X + hit.x * CELL_W;
      const ty = (hit.row + 0.5) * CELL_H;
      g.lineStyle(4, 0xffffff, 1 - burst).strokeEllipse(tx, ty + 10 * UI, (30 + burst * 70) * UI, (12 + burst * 24) * UI);
      for (let i = 0; i < 6; i++) {
        const angle = -Math.PI * (i + 0.5) / 6;
        g.fillStyle(0xbfe6ff, 1 - burst).fillCircle(tx + Math.cos(angle) * burst * 44 * UI, ty + Math.sin(angle) * burst * 44 * UI, 4 * UI);
      }
    }
  }

  private drawBlizzard(g: Phaser.GameObjects.Graphics, effect: FieldEffect, progress: number) {
    const fade = Math.sin(Math.PI * progress);
    const height = HEIGHT;
    g.fillStyle(0xcfe8ff, 0.3 * fade).fillRect(0, -BOARD_Y, WIDTH, HEIGHT);
    const flakes = 130 + effect.tier * 30;
    for (let i = 0; i < flakes; i++) {
      const x = ((i * 73.3) % WIDTH + effect.time * (380 + (i % 5) * 60)) % WIDTH;
      const y = ((i * 41.7) % height + effect.time * (260 + (i % 4) * 50)) % height - BOARD_Y;
      g.fillStyle(0xffffff, 0.9 * fade).fillCircle(x, y, (1.2 + (i % 3)) * UI);
      if (i % 6 === 0) g.lineStyle(1.5, 0xe6f6ff, 0.6 * fade).lineBetween(x, y, x - 26, y - 17);
    }
    const grow = Math.min(1, progress * 3);
    for (const hit of effect.hits) {
      const tx = BOARD_X + hit.x * CELL_W;
      const ty = (hit.row + 0.5) * CELL_H + 22 * UI;
      for (let i = -2; i <= 2; i++) {
        const spike = (34 - Math.abs(i) * 8) * grow * UI;
        g.fillStyle(i % 2 ? 0x9fdcec : 0xdff6ff, fade).fillTriangle(tx + (i * 9 - 6) * UI, ty, tx + (i * 9 + 6) * UI, ty, tx + i * 11 * UI, ty - spike);
      }
    }
  }

  private updateHint() {
    const hint = $('hint');
    if (tool === 'glove') hint.textContent = t('hintGlove');
    else if (tool === 'shovel') hint.textContent = t('hintSell');
    else if (selected) hint.textContent = t('hintSelected', unitName(getUnit(selected)));
    else if (paused) hint.textContent = t('hintPaused');
    else hint.textContent = '';
    const unit = this.hover && battle!.unitAt(this.hover.row, this.hover.col);
    if (tool === 'shovel' && unit) hint.textContent = t('hintSellUnit', unitName(unit.def), battle!.sellValue(unit));
    renderInfo(infoHover ?? (unit ? unit.def : null) ?? (selected ? getUnit(selected) : null));
  }

  private draw(dt: number) {
    const g = this.layer;
    g.clear();
    this.hoverLabel.setText('');
    for (let row = 0; row < ROWS; row++) this.drawGuard(g, row);
    this.drawHover(g);
    for (const shot of this.shots) {
      g.lineStyle(4 * UI, shot.color, Math.min(1, shot.life * 8));
      const y = (shot.row + 0.5) * CELL_H;
      g.lineBetween(BOARD_X + shot.from * CELL_W, y, BOARD_X + shot.to * CELL_W, y);
      shot.life -= dt;
    }
    this.shots = this.shots.filter((shot) => shot.life > 0);
    for (const item of this.floats) {
      item.life -= dt;
      item.text.y -= 24 * dt;
      item.text.setAlpha(Math.min(1, item.life * 2));
      if (item.life <= 0) item.text.destroy();
    }
    this.floats = this.floats.filter((item) => item.life > 0);

    const alive = new Set<number>();
    for (const unit of battle!.units) {
      alive.add(unit.key);
      const pointer = this.input.activePointer;
      const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const x = unit === dragging ? point.x : BOARD_X + (unit.col + 0.5) * CELL_W;
      const y = unit === dragging ? point.y : (unit.row + 0.5) * CELL_H;
      this.drawUnit(g, unit, x, y);
    }
    for (const enemy of battle!.enemies) {
      alive.add(enemy.key);
      const x = BOARD_X + enemy.x * CELL_W;
      const y = (enemy.row + 0.5) * CELL_H;
      this.drawEnemy(g, enemy, x, y);
    }
    this.updateEnemyTip();
    for (const [key, label] of this.labels) {
      if (!alive.has(key)) {
        label.destroy();
        this.labels.delete(key);
      }
    }
    for (const key of [...this.sprites.keys()]) {
      if (!alive.has(key)) this.dropSprites(key);
    }
    this.drawEffects(dt);
  }

  // Защита линии: светящийся щит на стене, пока она не использована.
  private drawGuard(g: Phaser.GameObjects.Graphics, row: number) {
    const x = BOARD_X / 2;
    const y = (row + 0.5) * CELL_H;
    const size = 13 * UI;
    const ready = battle!.guards[row];
    if (ready) g.fillStyle(0x62d6b2, 0.25 + Math.sin(battle!.time * 3 + row) * 0.1).fillCircle(x, y, size * 1.7);
    g.fillStyle(ready ? 0x62d6b2 : 0x3a3f4a);
    g.fillRect(x - size, y - size, size * 2, size * 1.1);
    g.fillTriangle(x - size, y + size * 0.1, x + size, y + size * 0.1, x, y + size * 1.2);
    g.fillStyle(ready ? 0xe8fff6 : 0x55596a).fillRect(x - size * 0.2, y - size * 0.7, size * 0.4, size * 1.3);
  }

  private dropSprites(key: number) {
    for (const item of this.sprites.get(key)?.items ?? []) item.image.destroy();
    this.sprites.delete(key);
  }

  private addImage(id: string, height: number, alpha: number, depth: number) {
    return this.add.image(0, 0, id, 0).setScale((height * UI) / FRAME_SIZE).setAlpha(alpha).setDepth(depth);
  }

  // У гибрида свой спрайт, собранный из частей родителей. Паймон летает рядом с тем, кто приносит мору.
  private buildUnitSprites(unit: Unit) {
    const { def } = unit;
    const depth = 2 + unit.row;
    const items: Array<{ image: Phaser.GameObjects.Image; dx: number; dy: number; attack: boolean }> = [];
    const key = this.spriteReady(def.id) ? def.id : rootsOf(def).find((id) => this.spriteReady(id));
    if (key && key !== 'paimon') items.push({ image: this.addImage(key, def.rank === 'god' ? GOD_DISPLAY : HERO_DISPLAY, 1, depth), dx: 0, dy: 0, attack: true });
    if (def.income > 0 && hasSprite('paimon')) {
      const fights = def.damage > 0;
      const count = fights ? 1 : def.income / PAIMON_INCOME;
      for (let i = 0; i < count; i++) {
        const size = fights ? 58 : count > 1 ? 76 : 96;
        const dx = fights ? 26 : count > 1 ? -22 + i * (44 / (count - 1)) : 0;
        const dy = fights ? -26 : count > 1 ? (i % 2 ? -14 : 8) : 0;
        items.push({ image: this.addImage('paimon', size, 1, depth + (fights ? 0.5 : i * 0.01)), dx: dx * UI, dy: dy * UI, attack: false });
      }
    }
    return items;
  }

  private drawUnit(g: Phaser.GameObjects.Graphics, unit: Unit, x: number, y: number) {
    const { def } = unit;
    const colors = def.elements.length ? def.elements.map((element) => ELEMENT_COLORS[element]) : [PAIMON_COLOR];
    const radius = (26 + Math.min(def.tier, 5) * 2) * UI;
    let record = this.sprites.get(unit.key);
    // Метка меняется, когда догружается собственный спрайт гибрида.
    const mark = `${def.id}:${this.spriteReady(def.id)}`;
    if (!record || record.defId !== mark) {
      this.dropSprites(unit.key);
      record = { defId: mark, items: this.buildUnitSprites(unit) };
      this.sprites.set(unit.key, record);
    }
    if (record.items.length === 0) {
      colors.forEach((color, index) => {
        const start = (index / colors.length) * Math.PI * 2 - Math.PI / 2;
        const end = ((index + 1) / colors.length) * Math.PI * 2 - Math.PI / 2;
        g.fillStyle(color).slice(x, y, radius, start, end, false).fillPath();
      });
      this.label(unit.key, x, y, unitName(def).length > 11 ? `${unitName(def).slice(0, 10)}…` : unitName(def));
    }
    const sinceShot = def.interval - unit.attackTimer;
    const idle = Math.floor(battle!.time * 4 + unit.key) % 4;
    for (const item of record.items) {
      const shooting = item.attack && def.damage > 0 && unit.attackTimer > 0 && sinceShot < 0.32;
      const casting = item.attack && unit.castTimer > 0;
      const castFrame = 4 + Math.min(3, Math.floor(((CAST_TIME - unit.castTimer) / CAST_TIME) * 4));
      item.image.setFrame(casting ? castFrame : shooting ? 4 + Math.min(3, Math.floor(sinceShot / 0.08)) : idle);
      item.image.setPosition(x + item.dx, y + item.dy - 14 * UI);
    }
    if (unit.castTimer > 0) {
      const ring = 1 - unit.castTimer / CAST_TIME;
      g.lineStyle(4 * UI, colors[0], 1 - ring).strokeCircle(x, y - 8 * UI, (20 + ring * 36) * UI);
    }
    this.drawBar(g, x, y + 31 * UI, unit.hp / def.hp, 0x5fc27e);
  }

  // Подсказка над ближайшим к курсору врагом: имя, здоровье, а у боссов ещё и их приёмы.
  private updateEnemyTip() {
    const tip = $('enemy-tip');
    const pointer = this.input.activePointer;
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    let best: Battle['enemies'][number] | null = null;
    let bestDistance = Infinity;
    if (this.client && !dragging) {
      for (const enemy of battle!.enemies) {
        const size = (ENEMY_DISPLAY[enemy.def.power] ?? 110) * UI;
        const dx = point.x - (BOARD_X + enemy.x * CELL_W);
        const dy = point.y - ((enemy.row + 0.5) * CELL_H - size * 0.15);
        const distance = Math.hypot(dx, dy);
        if (distance < Math.max(size * 0.42, CELL_W * 0.35) && distance < bestDistance) {
          best = enemy;
          bestDistance = distance;
        }
      }
    }
    if (!best || !this.client) {
      tip.hidden = true;
      return;
    }
    const skills = best.def.skills ?? [];
    const shielded = best.shieldUntil > battle!.time;
    const html = `<strong>${best.def.name}</strong>
      ${skills.length ? `<em>${t('boss')}</em>` : ''}
      <div class="tip-bar"><i style="width:${Math.max(0, (best.hp / best.maxHp) * 100)}%"></i></div>
      <small>${t('hp', `${Math.ceil(best.hp)} / ${best.maxHp}`)}${shielded ? ' 🛡' : ''}${best.enraged ? ' 🔥' : ''}</small>
      ${skills.length ? `<small>${t('abilities')}: ${skills.map((skill) => t(`skill_${skill.kind}`)).join(', ')}</small>` : ''}`;
    if (tip.dataset.html !== html) {
      tip.innerHTML = html;
      tip.dataset.html = html;
    }
    tip.hidden = false;
    const flip = this.client.x > window.innerWidth - 260;
    tip.style.left = `${flip ? this.client.x - tip.offsetWidth - 14 : this.client.x + 14}px`;
    tip.style.top = `${Math.max(8, this.client.y - tip.offsetHeight - 10)}px`;
  }

  // Враг-гибрид показывает обоих родителей: второй держится за спиной и чуть меньше.
  private drawEnemy(g: Phaser.GameObjects.Graphics, enemy: Battle['enemies'][number], x: number, y: number) {
    const names = enemy.def.name.split(' × ');
    const size = ENEMY_DISPLAY[enemy.def.power] ?? ENEMY_DISPLAY[Object.keys(ENEMY_DISPLAY).map(Number).find((power) => power >= enemy.def.power) ?? 30];
    let record = this.sprites.get(enemy.key);
    if (!record) {
      const items = names.map((name, index) => {
        const image = this.addImage(enemyLookKey(name), index ? size * 0.75 : size, 1, 2 + enemy.row - index * 0.1);
        return { image, dx: index * 16 * UI, dy: index * -8 * UI, attack: false };
      });
      record = { defId: enemy.def.id, items };
      this.sprites.set(enemy.key, record);
    }
    const walk = Math.floor(battle!.time * 6 + enemy.key) % 4;
    const swing = 4 + (Math.floor(battle!.time * 8 + enemy.key) % 4);
    for (const item of record.items) {
      item.image.setFrame(enemy.attacking ? swing : walk);
      item.image.setPosition(x + item.dx, y + item.dy - size * 0.12 * UI);
    }
    if (enemy.aura) g.fillStyle(ELEMENT_COLORS[enemy.aura]).fillCircle(x, y - size * 0.34 * UI, 5 * UI);
    if (enemy.stunUntil > battle!.time) g.lineStyle(3, 0x9fdcec, 0.9).strokeCircle(x, y, size * 0.32 * UI);
    this.drawBar(g, x, y + 26 * UI, enemy.hp / enemy.maxHp, 0xe2574c);
  }

  private drawHover(g: Phaser.GameObjects.Graphics) {
    if (!this.hover) return;
    const { row, col } = this.hover;
    const x = BOARD_X + col * CELL_W;
    const y = row * CELL_H;
    let check: FuseCheck | null = null;
    if (selected) check = battle!.check(selected, row, col);
    else if (dragging) check = battle!.check(dragging.def.id, row, col, dragging);
    if (!check) {
      if (tool || battle!.unitAt(row, col)) g.lineStyle(2, 0xffffff, 0.5).strokeRect(x, y, CELL_W, CELL_H);
      return;
    }
    const color = check.kind === 'blocked' ? 0xe2574c : 0x5fc27e;
    g.fillStyle(color, 0.3).fillRect(x, y, CELL_W, CELL_H);
    g.lineStyle(3, color).strokeRect(x, y, CELL_W, CELL_H);
    const centerX = x + CELL_W / 2;
    const centerY = y + CELL_H / 2;
    if (check.kind === 'blocked') {
      this.hoverLabel.setPosition(centerX, centerY).setText('✕');
    } else if (check.kind === 'fuse') {
      this.hoverLabel.setPosition(centerX, centerY).setText(isKnownRecipe(check.result) ? '✓' : '?');
    }
    const target = battle!.unitAt(row, col);
    if (check.kind !== 'empty') $('hint').textContent = describeCheck(check, target ? unitName(target.def) : undefined);
  }

  private drawBar(g: Phaser.GameObjects.Graphics, x: number, y: number, ratio: number, color: number) {
    const width = 48 * UI;
    g.fillStyle(0x000000, 0.6).fillRect(x - width / 2, y, width, 5 * UI);
    g.fillStyle(color).fillRect(x - width / 2, y, width * Math.max(0, Math.min(1, ratio)), 5 * UI);
  }

  private label(key: number, x: number, y: number, text: string) {
    let label = this.labels.get(key);
    if (!label) {
      label = this.add.text(x, y, text, { fontSize: `${Math.round(11 * UI)}px`, fontStyle: 'bold', color: '#111111', align: 'center', resolution: DPR }).setOrigin(0.5).setDepth(5);
      this.labels.set(key, label);
    }
    if (label.text !== text) label.setText(text);
    label.setPosition(x, y);
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'board',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#14162e',
  scale: { mode: Phaser.Scale.NONE },
  scene: BattleScene,
  // В фоновой вкладке бой не должен догонять время рывком.
  fps: { smoothStep: true },
});

$('exit').onclick = showMenu;
$('glove').onclick = () => setTool('glove');
$('shovel').onclick = () => setTool('shovel');
$('pause').onclick = togglePause;
$('battle-almanac').onclick = () => openBattleAlmanac();
document.querySelectorAll<HTMLButtonElement>('.speed').forEach((button) => {
  button.onclick = () => setSpeed(Number(button.dataset.speed));
});
$<HTMLInputElement>('search').oninput = (event) => {
  search = (event.target as HTMLInputElement).value.trim().toLowerCase();
  buildCards();
};

window.addEventListener('keydown', (event) => {
  if (!battle || battle.status !== 'playing') return;
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT') {
    if (event.code === 'Escape') target.blur();
    return;
  }
  if (event.code === 'KeyA' || (event.code === 'Escape' && !$('almanac-modal').hidden)) {
    if ($('almanac-modal').hidden) openBattleAlmanac();
    else closeBattleAlmanac();
    return;
  }
  if (!$('almanac-modal').hidden) return;
  if (event.code === 'KeyG') setTool('glove');
  else if (event.code === 'KeyS') setTool('shovel');
  else if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
  } else if (event.code === 'Escape') setSelected(null);
  else if (/^Digit[1-9]$/.test(event.code)) {
    const id = favoritesOrdered()[Number(event.code.slice(5)) - 1];
    if (id) setSelected(id);
  }
});

if (import.meta.env.DEV) {
  Object.assign(window, { teyvatDebug: { save, game, battle: () => battle } });
}

window.addEventListener('resize', () => {
  if (battle) sceneRef?.layoutBoard();
});

// Тексты из index.html переводятся здесь, остальное собирается при каждом показе экрана.
function applyLang() {
  setLang(detectLang(save.lang));
  $('exit').textContent = t('menu');
  $('shovel').innerHTML = `${t('sell')} <kbd>S</kbd>`;
  $('pause').innerHTML = `${t('pause')} <kbd>Space</kbd>`;
  $('battle-almanac').innerHTML = `${t('almanac')} <kbd>A</kbd>`;
  $('mora-label').textContent = t('moraLabel');
  $('wave-label').textContent = t('waveLabel');
  $<HTMLInputElement>('search').placeholder = t('heroSearch');
  $('loading').textContent = t('loading', 0);
  infoShown = null;
}

applyLang();
showMenu();
