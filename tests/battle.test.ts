import { describe, expect, it } from 'vitest';
import { BOSS_IDS, endlessWave, ENDLESS, ENEMIES, ENEMY_HYBRIDS, enemyId, LEVELS, WORLD_POOLS, WORLDS, type LevelDef } from '../src/data/levels';
import { ENEMY_FAMILIES, HEROES } from '../src/data/roster';
import { GOD_TRIADS } from '../src/data/recipes';
import { enemyLookKey, lookOf, LOOKS } from '../src/art/looks';
import { allHybrids, findRecipe, getUnit, heroId, STARTING_MORA, UNITS } from '../src/data/units';
import { Battle, LAST_ENEMY_LIMIT, ROWS } from '../src/sim/battle';

const ALL_ROWS = Array.from({ length: ROWS }, (_, row) => row);
const level = (waves: LevelDef['waves'], night = true): LevelDef => ({ id: 't', name: 't', world: 0, night, reward: null, waves });
const HILICHURL = enemyId('Hilichurl');
const SLIME = enemyId('Pyro Slime');
const LAWACHURL = enemyId('Stonehide Lawachurl');
const seeded = () => {
  let s = 7;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

describe('данные', () => {
  it('содержат всех героев и всех врагов', () => {
    expect(HEROES).toHaveLength(123);
    expect(Object.values(ENEMY_FAMILIES).flat().length).toBeGreaterThan(340);
  });

  it('у каждого гибрида есть существующие родители и рецепт', () => {
    for (const unit of UNITS.values()) {
      if (!unit.parents) continue;
      expect(findRecipe(unit.parents[0], unit.parents[1])).toBe(unit.id);
    }
  });

  it('старт равен стрелку и трём Паймон', () => {
    expect(STARTING_MORA).toBe((getUnit('amber').cost + 3 * getUnit('paimon').cost) * 3);
  });
});

describe('миры', () => {
  it('уровней в регионе столько же, сколько героев', () => {
    for (const [index, world] of WORLDS.entries()) {
      const heroes = HEROES.filter((hero) => hero.region === world.key).length;
      expect(LEVELS.filter((lvl) => lvl.world === index)).toHaveLength(heroes);
    }
    expect(LEVELS).toHaveLength(HEROES.length);
  });

  it('каждый герой открывается и есть в рецепте', () => {
    const rewards = new Set(LEVELS.map((lvl) => lvl.reward));
    const parents = new Set(allHybrids().filter((def) => !def.id.startsWith('paimon_')).flatMap((def) => def.parents!));
    for (const hero of HEROES) {
      const id = heroId(hero.name);
      if (id !== 'amber') expect(rewards.has(id), hero.name).toBe(true);
      expect(parents.has(id), hero.name).toBe(true);
    }
  });

  it('каждый враг вписан в мир, а у миров со второго есть гибриды', () => {
    const inPools = new Set(WORLD_POOLS.flat());
    for (const id of Object.keys(ENEMIES)) expect(inPools.has(id), id).toBe(true);
    expect(ENEMY_HYBRIDS.length).toBeGreaterThan(20);
    expect(WORLD_POOLS[0].some((id) => id.includes('__'))).toBe(false);
  });
});

describe('внешность', () => {
  it('есть у каждого героя и боевого гибрида', () => {
    for (const hero of HEROES) expect(LOOKS.has(heroId(hero.name)), hero.name).toBe(true);
    for (const def of allHybrids()) {
      if (!def.id.startsWith('paimon_')) expect(lookOf(def.id), def.id).not.toBeNull();
    }
  });

  it('гибрид берёт части обоих родителей и не копит шляпы', () => {
    const look = lookOf('storm_melt')!;
    expect(look.tier).toBe(3);
    expect(look.elements).toEqual(['pyro', 'cryo', 'electro']);
    expect(look.accessories.filter((item) => /^(witchHat|widehat|beret|hood|tiara|veil)/.test(item)).length).toBeLessThanOrEqual(1);
    expect(new Set(look.weapons).size).toBeGreaterThan(1);
  });

  it('у каждого врага есть облик', () => {
    for (const def of Object.values(ENEMIES)) for (const name of def.name.split(' × ')) expect(enemyLookKey(name)).toMatch(/^enemy_/);
  });
});

describe('возвышения и богини', () => {
  it('герой возвышается до 4x, и у каждой ступени своя внешность', () => {
    expect(findRecipe('amber', 'amber')).toBe('amber_asc2');
    expect(findRecipe('amber_asc2', 'amber')).toBe('amber_asc3');
    expect(findRecipe('amber_asc3', 'amber')).toBe('amber_asc4');
    expect(findRecipe('amber_asc4', 'amber')).toBeNull();
    expect(getUnit('amber_asc4').damage).toBeGreaterThan(getUnit('amber_asc3').damage);
    const looks = ['amber_asc2', 'amber_asc3', 'amber_asc4'].map((id) => JSON.stringify(lookOf(id)));
    expect(new Set(looks).size).toBe(3);
    expect(lookOf('amber_asc4')!.accessories.some((item) => item.startsWith('ascWings'))).toBe(true);
  });

  const onField = (battle: Battle, count: number) => {
    for (let i = 0; i < count; i++) {
      battle.enemies.push({
        key: 1000 + i, def: ENEMIES[LAWACHURL], row: i % ROWS, x: 3 + i, hp: 1e6, maxHp: 1e6, aura: null,
        slowUntil: 0, stunUntil: 0, vulnUntil: 0, attacking: false, shieldUntil: 0, skillTimers: [], enraged: false,
      });
    }
  };

  it('луна бьёт всех на поле, а по врагу с аурой всегда наносит x2', () => {
    const battle = new Battle(level([[[LAWACHURL, 1]], [[LAWACHURL, 1]]]), seeded());
    battle.mora = 9999;
    battle.place('columbina', 0, 0);
    onField(battle, 3);
    const moon = getUnit('columbina').field!;
    for (let i = 0; i < 25; i++) battle.step(0.1);
    expect(battle.enemies.slice(0, 3).every((enemy) => enemy.hp === 1e6 - moon.damage)).toBe(true);
    for (let i = 0; i < moon.interval * 10; i++) battle.step(0.1);
    expect(battle.enemies.slice(0, 3).every((enemy) => enemy.hp === 1e6 - moon.damage * 3)).toBe(true);
  });

  it('водопад и метель бьют всех, метель замедляет', () => {
    for (const id of ['furina', 'anastasya']) {
      const battle = new Battle(level([[[LAWACHURL, 1]], [[LAWACHURL, 1]]]), seeded());
      battle.mora = 9999;
      battle.place(id, 0, 0);
      onField(battle, 3);
      for (let i = 0; i < 25; i++) battle.step(0.1);
      expect(battle.enemies.slice(0, 3).every((enemy) => enemy.hp < 1e6)).toBe(true);
      if (id === 'anastasya') expect(battle.enemies[0].slowUntil).toBeGreaterThan(battle.time);
    }
  });

  it('гибрид богини бьёт сильнее и чаще самой богини', () => {
    const base = getUnit('columbina').field!;
    const hybrid = getUnit('moon_rite').field!;
    expect(hybrid.damage).toBeGreaterThan(base.damage);
    expect(hybrid.interval).toBeLessThan(base.interval);
    expect(hybrid.kinds).toEqual(['moon']);
  });

  it('год-тир собирается из трёх гибридов богинь в любом порядке и сильнее всех', () => {
    for (const [id, , , moon, water, snow] of GOD_TRIADS) {
      expect(findRecipe(findRecipe(moon, water)!, snow)).toBe(id);
      expect(findRecipe(findRecipe(moon, snow)!, water)).toBe(id);
      expect(findRecipe(findRecipe(water, snow)!, moon)).toBe(id);
      const god = getUnit(id);
      expect(god.rank).toBe('god');
      expect(god.field!.kinds.sort()).toEqual(['blizzard', 'moon', 'waterfall']);
      expect(god.field!.damage).toBeGreaterThan(getUnit(moon).field!.damage);
      expect(lookOf(id)!.accessories.some((item) => item.startsWith('godWings'))).toBe(true);
    }
    expect(GOD_TRIADS.length).toBeGreaterThanOrEqual(2);
  });
});

describe('бесконечный режим', () => {
  it('начинается с мелочи, растёт и приводит боссов', () => {
    const random = seeded();
    const power = (index: number) => endlessWave(index, random).reduce((sum, [id, n]) => sum + ENEMIES[id].power * n, 0);
    const first = endlessWave(0, random);
    expect(first.every(([id]) => ENEMIES[id].power <= 2)).toBe(true);
    expect(power(20)).toBeGreaterThan(power(5) * 3);
    expect(endlessWave(4, random).some(([id]) => BOSS_IDS.includes(id))).toBe(true);
    expect(endlessWave(3, random).some(([id]) => BOSS_IDS.includes(id))).toBe(false);
    expect(BOSS_IDS.length).toBeGreaterThan(10);
    // Здоровье не растёт: босс и мелочь всегда такие, как в таблице.
    const battle = new Battle(ENDLESS, seeded());
    for (let i = 0; i < 4000; i++) battle.step(0.05);
    for (const enemy of battle.enemies) expect(enemy.maxHp).toBe(enemy.def.hp);
  });

  it('у боссов разное здоровье и свои спецатаки', () => {
    const bosses = BOSS_IDS.map((id) => ENEMIES[id]);
    expect(new Set(bosses.map((def) => def.hp)).size).toBeGreaterThan(10);
    expect(bosses.every((def) => (def.skills ?? []).length > 0)).toBe(true);
    const battle = new Battle(level([[[LAWACHURL, 1]]]), seeded());
    battle.mora = 99999;
    battle.place('amber', 0, 2);
    const narwhal = ENEMIES[enemyId('All-Devouring Narwhal')];
    (battle as unknown as { addEnemy: (d: typeof narwhal, r: number, x: number) => void }).addEnemy(narwhal, 0, 6);
    for (let i = 0; i < 200 && battle.units.length; i++) battle.step(0.05);
    expect(battle.units).toHaveLength(0);
  });
});

describe('высокие ступени', () => {
  it('гибридов 4–7 ступени много, и каждый выглядит круче', () => {
    const plain = allHybrids().filter((def) => !def.ascension && !def.rank && !def.field && !def.id.startsWith('paimon_'));
    const count = (tier: number) => plain.filter((def) => def.tier === tier).length;
    expect(count(4)).toBeGreaterThanOrEqual(20);
    expect(count(5)).toBeGreaterThanOrEqual(12);
    expect(count(6)).toBeGreaterThanOrEqual(5);
    expect(count(7)).toBeGreaterThanOrEqual(2);
    expect(lookOf('heart_of_teyvat')!.accessories.some((item) => item.startsWith('godWings'))).toBe(true);
    expect(getUnit('heart_of_teyvat').damage).toBeGreaterThan(getUnit('teyvat_unity').damage);
  });
});

describe('скрещивание и продажа', () => {
  it('блокирует неподходящую пару без списания моры', () => {
    const battle = new Battle(level([]));
    battle.place('amber', 0, 0);
    const before = battle.mora;
    expect(battle.place('paimon_2x', 0, 0)).toBe(false);
    expect(battle.mora).toBe(before);
  });

  it('гибрид получает полное здоровье и продаётся за 60% вклада', () => {
    const battle = new Battle(level([]));
    battle.mora = 1000;
    battle.place('amber', 0, 0);
    battle.unitAt(0, 0)!.hp = 1;
    battle.place('kaeya', 0, 0);
    const unit = battle.unitAt(0, 0)!;
    expect(unit.def.id).toBe('melting_arrow');
    expect(unit.hp).toBe(unit.def.hp);
    expect(battle.sellValue(unit)).toBe(Math.floor((100 + 100) * 0.6));
  });

  it('линия Паймон идёт только по одной и заканчивается на 5x', () => {
    expect(findRecipe('paimon', 'paimon')).toBe('paimon_2x');
    expect(findRecipe('paimon_2x', 'paimon')).toBe('paimon_3x');
    expect(findRecipe('paimon_4x', 'paimon')).toBe('paimon_5x');
    expect(findRecipe('paimon_5x', 'paimon')).toBeNull();
    expect(findRecipe('paimon_2x', 'paimon_2x')).toBeNull();
    expect(findRecipe('paimon_2x', 'amber')).toBeNull();
  });

  it('гибрид с Паймон даёт доход обычной Паймон и не скрещивается дальше', () => {
    const id = findRecipe('paimon', 'amber')!;
    expect(getUnit(id).income).toBe(getUnit('paimon').income);
    expect(findRecipe(id, 'paimon')).toBeNull();
  });

  it('перчатка переставляет и уходит на перезарядку', () => {
    const battle = new Battle(level([]));
    battle.place('amber', 0, 0);
    const unit = battle.unitAt(0, 0)!;
    expect(battle.glove(unit, 2, 3)).toBe(true);
    expect(battle.unitAt(2, 3)).toBe(unit);
    expect(battle.glove(unit, 1, 1)).toBe(false);
  });
});

describe('волны', () => {
  it('запускает следующую волну, если последний враг живёт дольше лимита', () => {
    const battle = new Battle(level([[[LAWACHURL, 1]], [[HILICHURL, 1]]]), seeded());
    for (let i = 0; i < 100; i++) battle.step(0.1);
    expect(battle.waveNumber).toBe(1);
    expect(battle.enemies).toHaveLength(1);
    for (let i = 0; i < LAST_ENEMY_LIMIT * 10 + 5; i++) battle.step(0.1);
    expect(battle.waveNumber).toBe(2);
  });

  it('не торопит, пока живы двое', () => {
    const battle = new Battle(level([[[LAWACHURL, 2]], [[HILICHURL, 1]]]), seeded());
    for (let i = 0; i < 300; i++) battle.step(0.1);
    expect(battle.enemies).toHaveLength(2);
    expect(battle.waveNumber).toBe(1);
  });

  it('ночью ресурс не падает, днём падает', () => {
    const night = new Battle(level([], true));
    const day = new Battle(level([[[LAWACHURL, 2]]], false));
    for (let i = 0; i < 110; i++) {
      night.step(0.1);
      day.step(0.1);
    }
    expect(night.mora).toBe(STARTING_MORA);
    expect(day.mora).toBeGreaterThan(STARTING_MORA);
  });

  it('первый прорыв тратит защиту, второй означает поражение', () => {
    const battle = new Battle(level([[[SLIME, 1]], [[SLIME, 1]], [[SLIME, 1]]]), () => 0);
    for (let i = 0; i < 20000 && battle.status === 'playing'; i++) battle.step(0.1);
    expect(battle.guards[0]).toBe(false);
    expect(battle.status).toBe('lost');
  });
});

// Бот играет как средний игрок: закрывает линии с врагами, строит экономику, затем усиливает защиту.
function playAdaptiveBot(def: LevelDef, hasKaeya: boolean) {
  const battle = new Battle(def, seeded());
  for (let i = 0; i < 120000 && battle.status === 'playing'; i++) {
    const shooters = (row: number) => battle.units.filter((unit) => unit.row === row && unit.def.damage > 0);
    const threat = (row: number) => battle.enemies.filter((enemy) => enemy.row === row).reduce((sum, enemy) => sum + enemy.hp, 0);
    const rows = ALL_ROWS.slice().sort((a, b) => threat(b) - threat(a));
    const urgent = rows.find((row) => threat(row) > 0 && shooters(row).length === 0);
    const freeCol = (row: number) => [3, 2, 4, 1, 5, 6].find((col) => !battle.unitAt(row, col));
    const paimons = battle.units.filter((unit) => unit.def.id === 'paimon');
    const plain = battle.units.find((unit) => unit.def.id === 'amber');
    const melting = battle.units.find((unit) => unit.def.id === 'melting_arrow');
    if (urgent !== undefined) {
      if (battle.canAfford('amber')) battle.place('amber', urgent, freeCol(urgent) ?? 1);
    } else if (paimons.length < 5 && battle.canAfford('paimon')) {
      const row = ALL_ROWS.find((r) => !battle.unitAt(r, 0));
      if (row !== undefined) battle.place('paimon', row, 0);
    } else if (paimons.length < 5) {
      // Сначала экономика: остальное подождёт, пока линии не под угрозой.
    } else if (hasKaeya && plain && battle.canAfford('kaeya')) {
      battle.place('kaeya', plain.row, plain.col);
    } else if (hasKaeya && melting && battle.canAfford('lisa')) {
      battle.place('lisa', melting.row, melting.col);
    } else if (battle.mora >= 200 && battle.canAfford('amber')) {
      const row = rows[0];
      const col = freeCol(row);
      if (col !== undefined) battle.place('amber', row, col);
    }
    battle.step(0.05);
  }
  return `${battle.status} на волне ${battle.waveNumber}/${def.waves.length}`;
}

describe('баланс', () => {
  // Проверяем начало, середину и конец каждого мира, а не все уровни.
  const sample = LEVELS.filter((lvl, index) => {
    const inWorld = LEVELS.filter((other) => other.world === lvl.world);
    const position = inWorld.indexOf(lvl);
    return index > 0 && (position === 0 || position === inWorld.length - 1 || position === Math.floor(inWorld.length / 2));
  });
  it.each(sample.map((lvl) => [lvl.id, lvl] as const))('уровень %s проходится ботом', (_, lvl) => {
    expect(playAdaptiveBot(lvl, true)).toMatch(/^won/);
  });

  it('простая стратегия проходит первый уровень', () => {
    expect(playAdaptiveBot(LEVELS[0], false)).toMatch(/^won/);
  });

  it('без защиты первый уровень проигрывается', () => {
    const battle = new Battle(LEVELS[0], seeded());
    for (let i = 0; i < 40000 && battle.status === 'playing'; i++) battle.step(0.05);
    expect(battle.status).toBe('lost');
  });

  it('бесконечный режим наращивает волны и не заканчивается победой', () => {
    const battle = new Battle(ENDLESS, seeded());
    battle.mora = 100000;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < 9; col++) {
        battle.cooldowns.clear();
        battle.place('amber', row, col);
      }
    }
    for (let i = 0; i < 20000 && battle.status === 'playing'; i++) battle.step(0.05);
    expect(battle.waveNumber).toBeGreaterThan(3);
    expect(battle.status).not.toBe('won');
  });

  it('все враги уровней описаны', () => {
    for (const lvl of LEVELS) for (const wave of lvl.waves) for (const [id] of wave) expect(ENEMIES[id]).toBeDefined();
  });
});
