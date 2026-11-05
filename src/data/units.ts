import { ASCENSION_TITLES_EN, DUO_NAMES_EN, HYBRID_NAMES_EN, TRIAD_WORDS_EN } from './namesEn';
import { GOD_TRIADS, REGION_RECIPES, RU_NAMES } from './recipes';
import { HEROES, type Element, type HeroEntry, type Weapon } from './roster';

export type FieldKind = 'moon' | 'waterfall' | 'blizzard';

// Атака по всем врагам на поле: каждый удар использует следующий вид из списка.
export interface FieldAbility {
  kinds: FieldKind[];
  damage: number;
  interval: number;
}

export interface UnitDef {
  id: string;
  name: string;
  // Имя для всех языков, кроме русского.
  nameEn?: string;
  elements: Element[];
  weapon: Weapon | null;
  cost: number;
  cooldown: number;
  hp: number;
  damage: number;
  interval: number;
  range: number;
  splash: number;
  pierce: boolean;
  chain: number;
  income: number;
  tier: number;
  region: string;
  parents?: [string, string];
  desc: string;
  hint?: string;
  field?: FieldAbility;
  ascension?: number;
  rank?: 'duo' | 'god';
  extraRecipes?: Array<[string, string]>;
}

const ARCHETYPES: Record<Weapon, Pick<UnitDef, 'cost' | 'cooldown' | 'hp' | 'damage' | 'interval' | 'range' | 'splash' | 'pierce'> & { label: string }> = {
  bow: { label: 'Стрелок: бьёт через всю линию', cost: 100, cooldown: 5, hp: 100, damage: 20, interval: 1.4, range: 9, splash: 0, pierce: false },
  catalyst: { label: 'Маг: урон по области на средней дистанции', cost: 125, cooldown: 7, hp: 90, damage: 18, interval: 1.8, range: 6, splash: 0.8, pierce: false },
  sword: { label: 'Боец: быстрые удары вблизи', cost: 100, cooldown: 5, hp: 180, damage: 30, interval: 0.9, range: 1.3, splash: 0, pierce: false },
  claymore: { label: 'Тяжёлый боец: мощный удар по области', cost: 150, cooldown: 9, hp: 260, damage: 65, interval: 2.2, range: 1.4, splash: 0.7, pierce: false },
  polearm: { label: 'Копейщик: пробивает врагов на 2 клетки', cost: 125, cooldown: 7, hp: 150, damage: 26, interval: 1.1, range: 2.3, splash: 0, pierce: true },
};

export const heroId = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '_');

function makeHero(h: HeroEntry): UnitDef {
  const { label, ...arch } = ARCHETYPES[h.weapon];
  return {
    ...arch,
    id: heroId(h.name),
    name: RU_NAMES[h.name] ?? h.name,
    elements: [h.element],
    weapon: h.weapon,
    chain: 0,
    income: 0,
    tier: 1,
    region: h.region,
    desc: label,
  };
}

export const MORA_MULTIPLIER = 3;
export const PAIMON_INCOME = 25 * MORA_MULTIPLIER;

function makePaimon(level: number): UnitDef {
  return {
    id: level === 1 ? 'paimon' : `paimon_${level}x`,
    name: level === 1 ? 'Паймон' : `Паймон ${level}x`,
    elements: [],
    weapon: null,
    cost: 50,
    cooldown: 5,
    hp: 80,
    damage: 0,
    interval: 8,
    range: 0,
    splash: 0,
    pierce: false,
    chain: 0,
    income: PAIMON_INCOME * level,
    tier: level,
    region: 'Тейват',
    parents: level === 1 ? undefined : [level === 2 ? 'paimon' : `paimon_${level - 1}x`, 'paimon'],
    desc: `Приносит ${PAIMON_INCOME * level} моры каждые 8 секунд`,
    hint: level === 1 ? undefined : 'Паймон копит мору, когда её становится больше',
  };
}

export const UNITS = new Map<string, UnitDef>();
for (const hero of HEROES) UNITS.set(heroId(hero.name), makeHero(hero));
for (let level = 1; level <= 5; level++) {
  const paimon = makePaimon(level);
  UNITS.set(paimon.id, paimon);
}

export const getUnit = (id: string): UnitDef => {
  const unit = UNITS.get(id);
  if (!unit) throw new Error(`Неизвестный юнит: ${id}`);
  return unit;
};

// Три богини не бьют обычной атакой: весь их урон идёт по всему полю.
const GODDESSES: Array<[string, FieldAbility, string]> = [
  ['columbina', { kinds: ['moon'], damage: 120, interval: 12 }, 'Редко призывает луну: удар по всем врагам на поле. Лунная реакция всегда даёт x2'],
  ['furina', { kinds: ['waterfall'], damage: 80, interval: 9 }, 'Обрушивает водопад на всех врагов на поле и накладывает гидро'],
  ['anastasya', { kinds: ['blizzard'], damage: 70, interval: 10 }, 'Насылает метель на всех врагов на поле: урон, крио и замедление'],
];
for (const [id, field, desc] of GODDESSES) {
  UNITS.set(id, { ...getUnit(id), field, desc, damage: 0, range: 0, splash: 0, pierce: false, cost: 350, cooldown: 20, hp: 220 });
}

const FIELD_NAMES: Record<FieldKind, string> = { moon: 'Луна', waterfall: 'Водопад', blizzard: 'Метель' };

// Возвышение: герой + такой же герой, до 4x. Каждая ступень заметно сильнее и выглядит круче.
const ASCENSIONS: Array<{ title: string; damage: number; hp: number; interval: number }> = [
  { title: 'Пробуждение', damage: 1.7, hp: 1.35, interval: 0.9 },
  { title: 'Вознесение', damage: 2.6, hp: 1.7, interval: 0.8 },
  { title: 'Апогей', damage: 3.8, hp: 2.2, interval: 0.7 },
];

for (const hero of HEROES) {
  const base = getUnit(heroId(hero.name));
  ASCENSIONS.forEach((step, index) => {
    const level = index + 2;
    UNITS.set(`${base.id}_asc${level}`, {
      ...base,
      id: `${base.id}_asc${level}`,
      name: `${base.name}: ${step.title}`,
      cost: base.cost * level,
      hp: Math.round(base.hp * step.hp),
      damage: Math.round(base.damage * step.damage),
      interval: base.interval * step.interval,
      splash: level >= 3 ? Math.max(base.splash, 0.6) : base.splash,
      pierce: level === 4 && base.damage > 0 ? true : base.pierce,
      chain: level === 4 && base.damage > 0 ? 2 : 0,
      field: base.field && { ...base.field, damage: Math.round(base.field.damage * step.damage), interval: base.field.interval * step.interval },
      tier: level,
      ascension: level,
      region: 'Возвышение',
      parents: [level === 2 ? base.id : `${base.id}_asc${level - 1}`, base.id],
      desc: `${base.desc}. Возвышение ${level}x из 4x`,
      hint: 'Такой же герой усиливает сам себя',
    });
  });
}

interface HybridSpec {
  id: string;
  name: string;
  parents: [string, string];
  desc: string;
  hint: string;
  rank?: UnitDef['rank'];
  tier?: number;
  splash?: number;
  chain?: number;
  pierce?: boolean;
}

// Атака богинь передаётся всем потомкам: чем выше гибрид, тем сильнее удар и тем он чаще.
function combineField(a: UnitDef, b: UnitDef, god: boolean): FieldAbility | undefined {
  if (!a.field && !b.field) return undefined;
  const kinds = [...new Set([...(a.field?.kinds ?? []), ...(b.field?.kinds ?? [])])];
  const damage = a.field && b.field
    ? (a.field.damage + b.field.damage) * 1.1
    : (a.field ?? b.field)!.damage * 1.45 + (a.field ? b.damage : a.damage) * 2;
  const interval = Math.min(a.field?.interval ?? 99, b.field?.interval ?? 99) * 0.8;
  return { kinds, damage: Math.round(god ? damage * 1.5 : damage), interval: Math.max(god ? 2.5 : 3, interval) };
}

// Гибрид объединяет способности родителей и усиливается с каждой ступенью.
function combine(spec: HybridSpec): UnitDef {
  const a = getUnit(spec.parents[0]);
  const b = getUnit(spec.parents[1]);
  const tier = spec.tier ?? Math.max(a.tier, b.tier) + 1;
  const field = combineField(a, b, spec.rank === 'god');
  const power = 1 + 0.12 * tier;
  const front = a.damage >= b.damage ? a : b;
  return {
    id: spec.id,
    name: spec.name,
    elements: [...new Set([...a.elements, ...b.elements])],
    weapon: front.weapon,
    cost: a.cost + b.cost,
    cooldown: Math.max(a.cooldown, b.cooldown),
    hp: Math.round(Math.max(a.hp, b.hp) * power),
    damage: Math.round((a.damage + b.damage) * 0.75 * power),
    interval: Math.max(0.5, Math.min(a.interval || 9, b.interval || 9)),
    range: Math.max(a.range, b.range),
    splash: Math.max(spec.splash ?? 0, a.splash, b.splash),
    pierce: spec.pierce ?? (a.pierce || b.pierce),
    chain: Math.max(spec.chain ?? 0, a.chain, b.chain),
    income: Math.max(a.income, b.income),
    tier,
    region: 'Гибрид',
    parents: spec.parents,
    desc: field ? `${field.kinds.map((kind) => FIELD_NAMES[kind]).join(', ')} по всему полю. ${spec.desc}` : spec.desc,
    hint: spec.hint,
    field,
    rank: spec.rank,
  };
}

const HYBRIDS: HybridSpec[] = [
  // Ступень 2
  { id: 'melting_arrow', name: 'Тающая стрела', parents: ['amber', 'kaeya'], desc: 'Чередует огонь и лёд, вызывая таяние', hint: 'Пламя встречает лёд', },
  { id: 'steam_song', name: 'Песнь пара', parents: ['amber', 'barbara'], desc: 'Лечащая песня и удвоенный урон паром', hint: 'Огонь, вода и немного музыки' },
  { id: 'overload_arrow', name: 'Стрела перегрузки', parents: ['amber', 'lisa'], desc: 'Каждая реакция взрывается по области', hint: 'Огонь и молния не уживаются рядом', splash: 1 },
  { id: 'frost_current', name: 'Морозный ток', parents: ['kaeya', 'lisa'], desc: 'Сверхпроводник снижает защиту врагов', hint: 'Лёд отлично проводит неприятности' },
  { id: 'living_current', name: 'Живой ток', parents: ['lisa', 'barbara'], desc: 'Разряд перескакивает между врагами', hint: 'Вода разносит молнию дальше', chain: 2 },
  { id: 'crystal_choir', name: 'Хрустальный хор', parents: ['noelle', 'barbara'], desc: 'Тяжёлый защитник с кристаллизацией', hint: 'Камень и вода берегут союзников' },
  { id: 'bold_flame', name: 'Безрассудное пламя', parents: ['bennett', 'amber'], desc: 'Боец и стрелок в одной клетке', hint: 'Неудача больше не повод останавливаться', splash: 0.6 },
  { id: 'night_raven', name: 'Ночной ворон', parents: ['fischl', 'lisa'], desc: 'Молнии Оза бьют сразу нескольких врагов', hint: 'Принцесса и библиотекарь говорят на одном языке', chain: 3 },
  { id: 'cold_wind', name: 'Леденящий ветер', parents: ['sucrose', 'kaeya'], desc: 'Рассеивание разносит холод по линии', hint: 'Ветер подхватывает любую стихию', splash: 1 },
  { id: 'wolf_storm', name: 'Волчья гроза', parents: ['razor', 'fischl'], desc: 'Тяжёлые удары и цепные молнии', hint: 'Волку не нужна принцесса, но она ему рада', chain: 2 },
  { id: 'cat_tail_cocktail', name: 'Коктейль «Кошкин хвост»', parents: ['diona', 'barbara'], desc: 'Заморозка останавливает врагов', hint: 'Лёд и вода в одном бокале' },
  { id: 'jumpy_dumpty', name: 'Прыгучая бомба', parents: ['klee', 'bennett'], desc: 'Огромный огненный взрыв по области', hint: 'Рыцарь Искорка нашла напарника', splash: 1.4 },
  // Ступень 3
  { id: 'storm_melt', name: 'Грозовая капель', parents: ['melting_arrow', 'lisa'], desc: 'Лёд, огонь и молния сменяют друг друга', hint: 'Таянию не хватает только грозы', chain: 2 },
  { id: 'boiling_rain', name: 'Кипящий дождь', parents: ['steam_song', 'fischl'], desc: 'Пар и разряды накрывают всю линию', hint: 'Песне пара нужен тёмный аккомпанемент', chain: 3 },
  { id: 'absolute_zero', name: 'Абсолютный ноль', parents: ['frost_current', 'diona'], desc: 'Длинная заморозка и тяжёлый урон по ослабленным', hint: 'Морозному току можно добавить ещё холода' },
  { id: 'crystal_bastion', name: 'Хрустальный бастион', parents: ['crystal_choir', 'noelle_asc2'], desc: 'Почти непробиваемая стена', hint: 'Два защитника становятся крепостью' },
  { id: 'sky_barrage', name: 'Небесный обстрел', parents: ['amber_asc2', 'jumpy_dumpty'], desc: 'Взрывы накрывают соседние линии', hint: 'Кролик и бомба созданы друг для друга', splash: 1.8 },
  // Ступень 4
  { id: 'thunder_cauldron', name: 'Грозовой котёл', parents: ['boiling_rain', 'storm_melt'], desc: 'Все реакции подряд в одной клетке', hint: 'Два шторма могут стать одним', chain: 4, splash: 1 },
  { id: 'frozen_heaven', name: 'Застывшие небеса', parents: ['absolute_zero', 'cold_wind'], desc: 'Вихрь льда замедляет всю область', hint: 'Абсолютному нулю нужен ветер', splash: 1.6 },
  // Ступень 5
  { id: 'teyvat_tempest', name: 'Шторм Тейвата', parents: ['thunder_cauldron', 'frozen_heaven'], desc: 'Вершина первого мира: шторм из всех стихий', hint: 'Котёл и небеса: последнее скрещивание Мондштадта', chain: 6, splash: 2 },
];

for (const spec of HYBRIDS) UNITS.set(spec.id, combine(spec));

// Описание и способности гибридов регионов следуют из стихий родителей.
function describeMix(a: UnitDef, b: UnitDef) {
  const elements = new Set([...a.elements, ...b.elements]);
  if (elements.has('electro') && elements.has('hydro')) return { desc: 'Заряд перескакивает между врагами', chain: 2 };
  if (elements.has('electro') && elements.has('pyro')) return { desc: 'Реакции взрываются по области', splash: 1 };
  if (elements.has('anemo')) return { desc: 'Ветер разносит урон по области', splash: 1 };
  if (elements.has('cryo') && elements.has('hydro')) return { desc: 'Заморозка останавливает врагов' };
  if (elements.has('cryo') && elements.has('pyro')) return { desc: 'Таяние удваивает урон' };
  if (elements.has('hydro') && elements.has('pyro')) return { desc: 'Пар удваивает урон' };
  if (elements.has('dendro')) return { desc: 'Природные реакции бьют по соседним врагам', splash: 0.8 };
  if (elements.has('geo')) return { desc: 'Кристаллы лечат гибрида при реакциях' };
  return { desc: 'Объединяет силу обоих родителей' };
}

for (const [id, name, first, second, hint] of REGION_RECIPES) {
  const mix = describeMix(getUnit(first), getUnit(second));
  UNITS.set(id, combine({ id, name, parents: [first, second], hint, ...mix }));
}

// Год-тир: сначала два гибрида богинь дают дуэт, затем гибрид третьей богини завершает союз.
const DUO_NAMES: Record<string, string> = { 'moon+waterfall': 'Лунный водопад', 'blizzard+moon': 'Лунная метель', 'blizzard+waterfall': 'Ледяной потоп' };
const extraGodRecipes: Array<[string, string, string]> = [];

for (const [id, name, word, moon, water, snow] of GOD_TRIADS) {
  const duo = (first: string, second: string, suffix: string) => {
    const duoKinds = [...getUnit(first).field!.kinds, ...getUnit(second).field!.kinds].sort().join('+');
    const duoId = `${id}_${suffix}`;
    UNITS.set(duoId, combine({
      id: duoId, name: `${DUO_NAMES[duoKinds]} ${word}`, parents: [first, second], rank: 'duo', tier: 5,
      desc: 'Союз двух богинь', hint: 'Не хватает третьей богини',
    }));
    return duoId;
  };
  const moonWater = duo(moon, water, 'mw');
  const moonSnow = duo(moon, snow, 'ms');
  const waterSnow = duo(water, snow, 'ws');
  const god = combine({
    id, name, parents: [moonWater, snow], rank: 'god', tier: 7,
    desc: 'Ультимативный гибрид: луна, водопад и метель по очереди', hint: 'Все три богини вместе',
  });
  UNITS.set(id, {
    ...god,
    hp: Math.round(god.hp * 1.5),
    extraRecipes: [[moonSnow, water], [waterSnow, moon]],
  });
  extraGodRecipes.push([moonSnow, water, id], [waterSnow, moon, id]);
}

const key = (a: string, b: string) => [a, b].sort().join('+');
const RECIPES = new Map<string, string>();

for (const unit of UNITS.values()) {
  if (unit.parents) RECIPES.set(key(unit.parents[0], unit.parents[1]), unit.id);
}

for (const [first, second, result] of extraGodRecipes) RECIPES.set(key(first, second), result);

// Обычная Паймон скрещивается с любым базовым героем, а такой гибрид дальше не скрещивается.
for (const hero of HEROES) {
  const parent = getUnit(heroId(hero.name));
  const unit = combine({
    id: `paimon_${parent.id}`,
    name: `${parent.name} и Паймон`,
    parents: ['paimon', parent.id],
    desc: `${parent.desc}. Заодно приносит мору, как обычная Паймон`,
    hint: 'Паймон любит хорошую компанию',
  });
  UNITS.set(unit.id, { ...unit, damage: parent.damage, interval: parent.interval, income: PAIMON_INCOME });
  RECIPES.set(key('paimon', parent.id), unit.id);
}

// Английские имена: герои с вики, остальное собирается из частей.
const HERO_EN = new Map(HEROES.map((hero) => [heroId(hero.name), hero.name === 'Anastasya' ? 'Tsaritsa' : hero.name]));
function englishName(def: UnitDef): string {
  const hero = HERO_EN.get(def.id);
  if (hero) return hero;
  if (def.id === 'paimon') return 'Paimon';
  const paimonLevel = def.id.match(/^paimon_(\d)x$/);
  if (paimonLevel) return `Paimon ${paimonLevel[1]}x`;
  if (def.ascension) return `${HERO_EN.get(def.id.replace(/_asc\d$/, ''))}: ${ASCENSION_TITLES_EN[def.ascension - 2]}`;
  if (def.id.startsWith('paimon_')) return `${HERO_EN.get(def.id.slice(7))} & Paimon`;
  const duo = def.id.match(/^(god_[a-z]+)_(mw|ms|ws)$/);
  if (duo) return `${DUO_NAMES_EN[duo[2]]}: ${TRIAD_WORDS_EN[duo[1]]}`;
  return HYBRID_NAMES_EN[def.id] ?? def.name;
}
for (const unit of UNITS.values()) unit.nameEn = englishName(unit);

export const findRecipe = (a: string, b: string): string | null => RECIPES.get(key(a, b)) ?? null;

// Все рецепты, где юнит участвует: с кем скрестить и что получится.
export function recipesWith(id: string): Array<{ partner: string; result: string }> {
  const list: Array<{ partner: string; result: string }> = [];
  for (const [pair, result] of RECIPES) {
    const [a, b] = pair.split('+');
    if (a === id) list.push({ partner: b, result });
    else if (b === id) list.push({ partner: a, result });
  }
  return list.sort((x, y) => getUnit(y.result).tier - getUnit(x.result).tier);
}

export const allHybrids = (): UnitDef[] => [...UNITS.values()].filter((unit) => unit.parents);

export const STARTING_MORA = (ARCHETYPES.bow.cost + 3 * getUnit('paimon').cost) * MORA_MULTIPLIER;
