import { BOSSES, type BossSkill } from './bosses';
import { ENEMY_FAMILIES, HEROES } from './roster';

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  dps: number;
  range: number;
  power: number;
  color: number;
  skills?: BossSkill[];
}

export type Wave = Array<[string, number]>;

export interface LevelDef {
  id: string;
  name: string;
  world: number;
  night: boolean;
  waves: Wave[];
  reward: string | null;
}

export interface WorldDef {
  key: string;
  name: string;
  match: RegExp;
}

// Первый совпавший мир получает врага, а всё несовпавшее уходит в последний мир.
export const WORLDS: WorldDef[] = [
  { key: 'Mondstadt', name: 'Мондштадт', match: /churl|Slime|Abyss Mage|Fatui Skirmisher|Cicin|Whopperflower|Regisvine|Stormterror|Lupus/ },
  { key: 'Liyue', name: 'Ли Юэ', match: /Treasure Hoarders|Ruin (Guard|Hunter|Grader)|Geovishap|Eye of the Storm|Oceanid|Childe|Azhdaha|Xuanwen|Suanni|Anemo Hypostasis|Geo Hypostasis|Electro Hypostasis|Cryo Hypostasis/ },
  { key: 'Inazuma', name: 'Инадзума', match: /Nobushi|Kairagi|Mirror Maiden|Specter|Rifthound|Bathysmal|Shadowy Husk|Maguu|Perpetual|Thunder Manifestation|Golden Wolflord|Signora|Magatsu|Serpent|Ruin (Cruiser|Destroyer|Defender|Scout)|Lector|Pyro Hypostasis|Hydro Hypostasis/ },
  { key: 'Sumeru', name: 'Сумеру', match: /Eremite|Fungus|shroom|Primal Construct|Ruin Drake|Aeonblight|Consecrated|Setekh|Algorithm|Shouki|Apep|Herald|Baptist|Dendro Hypostasis/ },
  { key: 'Fontaine', name: 'Фонтейн', match: /Mek|Breacher|Seahorse|Sea Hare|Octopus|Jellyfish|Crab|Ray|Blubberbeast|Emperor|Tulpa|Phantasm|Narwhal|Operative|Icewind|Field Generator|Knave|Golem|Hydro Mimic/ },
  { key: 'Natlan', name: 'Натлан', match: /Warrior|Flowing Blade|Forged Sand|Swiftstep|saur|Wayob|Avatar of Lava|Lava Dragon|Weasel|Secret Source Automaton|Tenebrous|Spiritspeaker|Lord of Eroded|Game Before/ },
  { key: 'Nod-Krai', name: 'Нод-Край', match: /Oprichniki|Landcruiser|Landrover|Radiant|Frostnight|Knuckle|Wilderness|Fisher|Lord of the Hidden|Watcher|Domain Keeper|Precursor|Doctor|Dottore/ },
  { key: 'Snezhnaya', name: 'Снежная', match: /Volkodlak|Leomastiff|Long-Eared|Channel Contact|Fanged Zealot|Voywolf|Glaci|Guardian Blade|Winged (Halberd|Soarer)|Juvenile|Leshy|Immortal|Chimeric/ },
  { key: 'None', name: 'Вне регионов', match: /./ },
];

const COLORS: Array<[RegExp, number]> = [
  [/Pyro|Blazing|Fiery|Burning|Lava|Flames?/, 0xe2683a], [/Hydro|Tide|Water|Sea|Flow/, 0x4b9ad6],
  [/Anemo|Wind|Gale|Storm|Wing/, 0x62d6b2], [/Electro|Thunder|Crackling|Lightning/, 0xa772e8],
  [/Dendro|Foliar|Vines|Leaves|Overgrown/, 0x8fc73e], [/Cryo|Ice|Frost|Glaci|Snow/, 0x9fdcec],
  [/Geo|Rock|Stone/, 0xd9a93f], [/Ruin|Mek|Automaton|Construct|Landcruiser/, 0x8f8878], [/Abyss|Shadowy|Serpent/, 0x8a3fd1],
];

// Сила врага определяется его местом в мире Genshin: мелочь, бойцы, элита, тяжёлые, легенды.
function powerOf(name: string): number {
  if (BOSS_NAMES.includes(name)) return 60;
  if (/Stormterror|Lupus|Childe|Azhdaha|Signora|Magatsu|Shouki|Apep|Narwhal|Knave|Lord of|Game Before|Doctor|Dottore|Regisvine|Hypostasis|Oceanid|Emperor|Aeonblight|Setekh|Perpetual|Maguu|Golden Wolflord|Thunder Manifestation|Suanni|Tulpa|Tyrant|Mountain King|Herra|Landrover|Algorithm|Matrix|Eye of the Storm|Jadeplume|Primo Geovishap|Elder Leshy|Immortal/.test(name)) return 30;
  if (/Lawachurl|Ruin |Drake|Bathysmal|Black Serpent|Golem|Knight|Primal Construct|Specialist|Landcruiser|Avatar|Chimeric|Glacial Warden|Guardian|Breacher Primus|Wayob|Consecrated/.test(name)) return 16;
  if (/Mitachurl|Abyss Mage|Herald|Lector|Baptist|Kairagi|Mirror|Operative|Husk|Warrior|Gvardiya|Cannoneer|Shock Trooper|Volkodlak|Rifthound$|Cicin Mage|Specter|Fatui Pyro|Wolf/.test(name)) return 9;
  if (/Whelp|Chick|Hatchling|Slime|Seahorse|Mimic|Sea Hare|Jellyfish|^Hilichurl$|Cicin$|Segment/.test(name)) return /Large/.test(name) ? 2 : 1;
  if (/Shield|Samachurl|Eremite|Nobushi|Skirmisher|Trooper|Potioneer|Guard|Seeker|Scout|Courier|Fungus|shroom/.test(name)) return 4;
  return 2;
}

// Боссы из списка особых врагов Genshin идут по линии как обычные враги, но очень крепкие.
const BOSS_NAMES = ENEMY_FAMILIES['Особые враги'];

const STATS: Record<number, [number, number, number]> = {
  1: [90, 0.34, 12], 2: [130, 0.3, 16], 4: [330, 0.27, 20], 9: [800, 0.23, 34], 16: [1500, 0.2, 48], 30: [3000, 0.18, 70], 60: [12000, 0.12, 140],
};

const RANGED = /Shooter|Grenadier|Mage|Samachurl|Cicin|Crossbow|Marksman|Potioneer|gunner|Gunner|Cannoneer|Javelineer|Lobber|Sharpshooter|Bombardier|Glaciomancer|Hypostasis|Specter|Fungus|shroom|Whopperflower/;

export const enemyId = (name: string) => `e_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

function makeEnemy(name: string): EnemyDef {
  const power = powerOf(name);
  const [hp, speed, dps] = STATS[power];
  const boss = BOSSES[name];
  return {
    id: enemyId(name), name, power, skills: boss?.skills,
    hp: boss?.hp ?? hp, speed: boss?.speed ?? speed, dps: boss?.dps ?? dps,
    range: RANGED.test(name) ? 3 : 0,
    color: COLORS.find(([match]) => match.test(name))?.[1] ?? 0x9a7b5b,
  };
}

export const ENEMIES: Record<string, EnemyDef> = {};
export const WORLD_POOLS: string[][] = WORLDS.map(() => []);

for (const name of Object.values(ENEMY_FAMILIES).flat()) {
  const def = makeEnemy(name);
  ENEMIES[def.id] = def;
  WORLD_POOLS[WORLDS.findIndex((world) => world.match.test(name))].push(def.id);
}

// Гибриды врагов появляются со второго мира и зеркалят скрещивание игрока.
export const ENEMY_HYBRIDS: string[] = [];
const HYBRIDS_PER_WORLD = 6;

WORLD_POOLS.forEach((pool, world) => {
  if (world === 0) return;
  const parents = pool.filter((id) => ENEMIES[id].power >= 2 && ENEMIES[id].power <= 16);
  for (let i = 0; i < HYBRIDS_PER_WORLD && i * 2 + 1 < parents.length; i++) {
    const a = ENEMIES[parents[(i * 7) % parents.length]];
    const b = ENEMIES[parents[(i * 7 + 3) % parents.length]];
    if (a === b) continue;
    const id = `${a.id}__${b.id}`;
    ENEMIES[id] = {
      id,
      name: `${a.name} × ${b.name}`,
      hp: Math.round((a.hp + b.hp) * 0.8),
      speed: (a.speed + b.speed) / 2,
      dps: Math.max(a.dps, b.dps),
      range: Math.max(a.range, b.range),
      power: Math.max(2, Math.round((a.power + b.power) * 0.8)),
      color: a.color,
    };
    pool.push(id);
    ENEMY_HYBRIDS.push(id);
  }
});

export const STARTING_UNITS = ['paimon', 'amber'];
const START_HERO = 'Amber';

const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const toHeroId = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '_');

// Порядок открытия в Мондштадте идёт от простых героев к сложным рецептам.
const FIRST_REWARDS = ['Kaeya', 'Lisa', 'Barbara', 'Noelle', 'Bennett', 'Fischl', 'Sucrose', 'Razor', 'Diona', 'Klee'];

function worldRewards(world: WorldDef): string[] {
  const names = HEROES.filter((hero) => hero.region === world.key && hero.name !== START_HERO).map((hero) => hero.name);
  const first = FIRST_REWARDS.filter((name) => names.includes(name));
  return [...first, ...names.filter((name) => !first.includes(name))];
}

function buildWave(pool: string[], budget: number, cap: number, random: () => number): Wave {
  const counts = new Map<string, number>();
  let left = budget;
  while (left > 0) {
    let options = pool.filter((id) => ENEMIES[id].power <= Math.min(left, cap));
    if (options.length === 0) break;
    // Самые сильные доступные враги встречаются чаще, чтобы волны не были кашей из мелочи.
    if (random() < 0.5) {
      const top = Math.max(...options.map((id) => ENEMIES[id].power));
      options = options.filter((id) => ENEMIES[id].power === top);
    }
    const pick = options[Math.floor(random() * options.length)];
    counts.set(pick, (counts.get(pick) ?? 0) + 1);
    left -= ENEMIES[pick].power;
  }
  return [...counts];
}

const WAVE_CAPS = [2, 2, 2, 4, 9, 16, 30];

function buildLevels(): LevelDef[] {
  const levels: LevelDef[] = [];
  let index = 0;
  WORLDS.forEach((world, worldIndex) => {
    const rewards = worldRewards(world);
    const count = HEROES.filter((hero) => hero.region === world.key).length;
    for (let i = 0; i < count; i++) {
      const random = seeded(1000 + index * 37);
      const progress = count > 1 ? i / (count - 1) : 1;
      const waveCount = 4 + Math.round(progress * 2) + Math.min(worldIndex, 2);
      // Новый мир начинается легче конца прошлого: сложность растёт и внутри мира, и между мирами.
      // Ночью моры меньше, поэтому и врагов немного меньше.
      const strength = (1 + worldIndex * 0.3 + progress * 1.2) * (i % 4 === 3 ? 0.85 : 1);
      const cap = worldIndex === 0 && i < 3 ? 2 : Math.min(30, 2 + Math.floor(strength * 3));
      const waves: Wave[] = [];
      for (let wave = 0; wave < waveCount; wave++) {
        const budget = Math.round(2 + (wave + 1) * 1.25 * strength);
        // Сильные враги приходят только в поздних волнах: игроку нужно время собрать гибридов.
        const waveCap = Math.min(cap, WAVE_CAPS[Math.min(wave, WAVE_CAPS.length - 1)]);
        waves.push(buildWave(WORLD_POOLS[worldIndex], budget, waveCap, random));
      }
      const reward = rewards[i] ? toHeroId(rewards[i]) : null;
      levels.push({ id: `${world.key}_${i + 1}`, name: `${world.name}, день ${i + 1}`, world: worldIndex, night: i % 4 === 3, waves, reward });
      index++;
    }
  });
  return levels;
}

export const LEVELS = buildLevels();

export const ENDLESS: LevelDef = { id: 'endless', name: 'Бесконечный режим', world: -1, night: false, reward: null, waves: [] };

export const BOSS_IDS = BOSS_NAMES.map(enemyId);
const BOSS_EVERY = 5;

// Бесконечный режим: здоровье врагов не растёт, растёт только их число и разнообразие. Каждая пятая волна с боссом.
export function endlessWave(index: number, random: () => number): Wave {
  const budget = Math.round(3 + index * 1.8 + index * index * 0.22);
  const cap = Math.min(30, 1 + Math.floor(index * 1.1));
  const pool = Object.keys(ENEMIES).filter((id) => ENEMIES[id].power <= 30);
  const wave = buildWave(pool, budget, cap, random);
  if (index % BOSS_EVERY === BOSS_EVERY - 1) {
    const bosses = 1 + Math.floor(index / (BOSS_EVERY * 3));
    for (let i = 0; i < bosses; i++) wave.push([BOSS_IDS[Math.floor(random() * BOSS_IDS.length)], 1]);
  }
  return wave;
}
