import type { BossSkill } from '../data/bosses';
import { ENEMIES, endlessWave, enemyId, type EnemyDef, type LevelDef } from '../data/levels';
import type { Element } from '../data/roster';
import { findRecipe, getUnit, MORA_MULTIPLIER, STARTING_MORA, type FieldKind, type UnitDef } from '../data/units';

export const ROWS = 9;
export const COLS = 9;
export const WAVE_DELAY = 4;
export const LAST_ENEMY_LIMIT = 15;
export const GLOVE_COOLDOWN = 2;
export const SELL_RATE = 0.6;
const SKY_MORA = 25 * MORA_MULTIPLIER;
const SKY_INTERVAL = 10;
const SPAWN_GAP = 1.3;

export interface Unit {
  key: number;
  def: UnitDef;
  row: number;
  col: number;
  hp: number;
  invested: number;
  attackTimer: number;
  incomeTimer: number;
  nextElement: number;
  fieldTimer: number;
  nextField: number;
  castTimer: number;
  stunUntil: number;
}

export interface Enemy {
  key: number;
  def: EnemyDef;
  row: number;
  x: number;
  hp: number;
  maxHp: number;
  aura: Element | null;
  slowUntil: number;
  stunUntil: number;
  vulnUntil: number;
  attacking: boolean;
  shieldUntil: number;
  skillTimers: number[];
  enraged: boolean;
}

export interface FieldHit {
  row: number;
  x: number;
  damage: number;
  lunar: boolean;
}

export const CAST_TIME = 0.4;
const FIRST_FIELD_DELAY = 2;

const LUNAR_BONUS: Partial<Record<Element, (enemy: Enemy, time: number) => void>> = {
  electro: (enemy, time) => { enemy.vulnUntil = time + 4; },
  dendro: (enemy, time) => { enemy.slowUntil = time + 3; },
  cryo: (enemy, time) => { enemy.stunUntil = time + 0.6; },
  pyro: (enemy, time) => { enemy.vulnUntil = time + 2; },
  anemo: (enemy) => { enemy.x = Math.min(COLS, enemy.x + 0.3); },
};

export type BattleEvent =
  | { type: 'shot'; row: number; from: number; to: number; element: Element | null }
  | { type: 'reaction'; row: number; x: number; name: string }
  | { type: 'field'; kind: FieldKind; tier: number; name: string; elements: Element[]; hits: FieldHit[] }
  | { type: 'discover'; id: string }
  | { type: 'seen'; id: string };

interface Reaction {
  name: string;
  mult: number;
  splash?: number;
  stun?: number;
  vuln?: number;
  chain?: number;
  heal?: number;
}

const REACTIONS: Record<string, Reaction> = {
  'cryo+pyro': { name: 'melt', mult: 2 },
  'hydro+pyro': { name: 'vaporize', mult: 2 },
  'electro+pyro': { name: 'overload', mult: 1.3, splash: 1.2 },
  'cryo+electro': { name: 'superconduct', mult: 1.1, vuln: 6 },
  'electro+hydro': { name: 'electrocharged', mult: 1.2, chain: 2 },
  'cryo+hydro': { name: 'frozen', mult: 1, stun: 2 },
  'dendro+pyro': { name: 'burning', mult: 1.5, splash: 0.6 },
  'dendro+hydro': { name: 'bloom', mult: 1.3, splash: 0.9 },
  'dendro+electro': { name: 'quicken', mult: 1.4 },
};

function reactionFor(aura: Element, element: Element): Reaction | null {
  if (element === 'anemo') return { name: 'swirl', mult: 1.1, splash: 1.3 };
  if (element === 'geo') return { name: 'crystallize', mult: 1.1, heal: 15 };
  return REACTIONS[[aura, element].sort().join('+')] ?? null;
}

export type Status = 'playing' | 'won' | 'lost';
export type FuseCheck = { kind: 'empty' } | { kind: 'fuse'; result: string } | { kind: 'blocked' };

export class Battle {
  units: Unit[] = [];
  enemies: Enemy[] = [];
  events: BattleEvent[] = [];
  mora = STARTING_MORA;
  time = 0;
  status: Status = 'playing';
  guards: boolean[] = Array(ROWS).fill(true);
  waveNumber = 0;
  gloveCooldown = 0;
  cooldowns = new Map<string, number>();
  private spawnQueue: string[] = [];
  private spawnTimer = 0;
  private nextWaveTimer = WAVE_DELAY;
  private lastEnemyTimer = 0;
  private skyTimer = SKY_INTERVAL;
  private nextKey = 1;
  private seen = new Set<string>();

  constructor(readonly level: LevelDef, private readonly random: () => number = Math.random) {}

  get isEndless() {
    return this.level.id === 'endless';
  }

  get totalWaves() {
    return this.isEndless ? Infinity : this.level.waves.length;
  }

  get lastEnemyTimeLeft(): number | null {
    return this.spawnQueue.length === 0 && this.enemies.length === 1 && this.hasMoreWaves()
      ? Math.max(0, LAST_ENEMY_LIMIT - this.lastEnemyTimer)
      : null;
  }

  unitAt(row: number, col: number): Unit | undefined {
    return this.units.find((unit) => unit.row === row && unit.col === col);
  }

  check(id: string, row: number, col: number, source?: Unit): FuseCheck {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return { kind: 'blocked' };
    const target = this.unitAt(row, col);
    if (!target) return { kind: 'empty' };
    if (target === source) return { kind: 'blocked' };
    const result = findRecipe(id, target.def.id);
    return result ? { kind: 'fuse', result } : { kind: 'blocked' };
  }

  canAfford(id: string) {
    const def = getUnit(id);
    return this.mora >= def.cost && (this.cooldowns.get(id) ?? 0) <= 0;
  }

  place(id: string, row: number, col: number): boolean {
    const check = this.check(id, row, col);
    if (check.kind === 'blocked' || !this.canAfford(id)) return false;
    const def = getUnit(id);
    this.mora -= def.cost;
    this.cooldowns.set(id, def.cooldown);
    if (check.kind === 'fuse') {
      const target = this.unitAt(row, col)!;
      this.transform(target, check.result, target.invested + def.cost);
    } else {
      this.units.push(this.makeUnit(def, row, col, def.cost));
    }
    return true;
  }

  // Перчатка: перестановка или скрещивание уже стоящих юнитов.
  glove(source: Unit, row: number, col: number): boolean {
    if (this.gloveCooldown > 0) return false;
    const check = this.check(source.def.id, row, col, source);
    if (check.kind === 'blocked') return false;
    if (check.kind === 'fuse') {
      const target = this.unitAt(row, col)!;
      this.transform(target, check.result, target.invested + source.invested);
      this.units = this.units.filter((unit) => unit !== source);
    } else {
      source.row = row;
      source.col = col;
    }
    this.gloveCooldown = GLOVE_COOLDOWN;
    return true;
  }

  sellValue(unit: Unit) {
    return Math.floor(unit.invested * SELL_RATE);
  }

  sell(unit: Unit) {
    this.mora += this.sellValue(unit);
    this.units = this.units.filter((other) => other !== unit);
  }

  step(dt: number) {
    if (this.status !== 'playing') return;
    this.time += dt;
    this.gloveCooldown = Math.max(0, this.gloveCooldown - dt);
    for (const [id, left] of this.cooldowns) this.cooldowns.set(id, Math.max(0, left - dt));
    if (!this.level.night) {
      this.skyTimer -= dt;
      if (this.skyTimer <= 0) {
        this.skyTimer += SKY_INTERVAL;
        this.mora += SKY_MORA;
      }
    }
    this.updateWaves(dt);
    this.updateUnits(dt);
    this.updateEnemies(dt);
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
    this.units = this.units.filter((unit) => unit.hp > 0);
    if (!this.hasMoreWaves() && this.spawnQueue.length === 0 && this.enemies.length === 0 && this.status === 'playing') {
      this.status = 'won';
    }
  }

  private makeUnit(def: UnitDef, row: number, col: number, invested: number): Unit {
    return { key: this.nextKey++, def, row, col, hp: def.hp, invested, attackTimer: 0, incomeTimer: 8, nextElement: 0, fieldTimer: FIRST_FIELD_DELAY, nextField: 0, castTimer: 0, stunUntil: 0 };
  }

  private transform(unit: Unit, id: string, invested: number) {
    unit.def = getUnit(id);
    unit.hp = unit.def.hp;
    unit.invested = invested;
    unit.attackTimer = 0;
    unit.incomeTimer = 8;
    unit.fieldTimer = FIRST_FIELD_DELAY;
    unit.nextField = 0;
    this.events.push({ type: 'discover', id });
  }

  private hasMoreWaves() {
    return this.isEndless || this.waveNumber < this.level.waves.length;
  }

  private startWave() {
    const wave = this.isEndless ? endlessWave(this.waveNumber, this.random) : this.level.waves[this.waveNumber];
    this.waveNumber++;
    for (const [id, count] of wave) for (let i = 0; i < count; i++) this.spawnQueue.push(id);
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }
    this.spawnTimer = 0;
    this.nextWaveTimer = WAVE_DELAY;
    this.lastEnemyTimer = 0;
  }

  private updateWaves(dt: number) {
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = SPAWN_GAP;
        this.spawn(this.spawnQueue.shift()!);
      }
      return;
    }
    if (!this.hasMoreWaves()) return;
    if (this.enemies.length === 0) {
      this.nextWaveTimer -= dt;
      if (this.nextWaveTimer <= 0) this.startWave();
    } else if (this.enemies.length === 1) {
      this.lastEnemyTimer += dt;
      if (this.lastEnemyTimer >= LAST_ENEMY_LIMIT) this.startWave();
    } else {
      this.lastEnemyTimer = 0;
    }
  }

  private addEnemy(def: EnemyDef, row: number, x: number) {
    const enemy: Enemy = {
      key: this.nextKey++, def, row, x, hp: def.hp, maxHp: def.hp, aura: null, slowUntil: 0, stunUntil: 0, vulnUntil: 0,
      attacking: false, shieldUntil: 0, skillTimers: (def.skills ?? []).map((skill) => skill.every * 0.6), enraged: false,
    };
    this.enemies.push(enemy);
    return enemy;
  }

  private spawn(id: string) {
    const def = ENEMIES[id];
    this.addEnemy(def, Math.floor(this.random() * ROWS), COLS + 0.4);
    if (!this.seen.has(id)) {
      this.seen.add(id);
      this.events.push({ type: 'seen', id });
    }
  }

  private updateUnits(dt: number) {
    for (const unit of this.units) {
      const { def } = unit;
      if (def.income > 0) {
        unit.incomeTimer -= dt;
        if (unit.incomeTimer <= 0) {
          unit.incomeTimer += 8;
          this.mora += def.income;
        }
      }
      unit.castTimer = Math.max(0, unit.castTimer - dt);
      if (unit.stunUntil > this.time) continue;
      if (def.field) {
        unit.fieldTimer -= dt;
        if (unit.fieldTimer <= 0 && this.castField(unit)) unit.fieldTimer = def.field.interval;
      }
      if (def.damage <= 0) continue;
      unit.attackTimer -= dt;
      if (unit.attackTimer > 0) continue;
      const origin = unit.col + 0.5;
      const targets = this.enemies
        .filter((enemy) => enemy.row === unit.row && enemy.hp > 0 && enemy.x <= COLS && enemy.x >= origin - 0.5 && enemy.x - origin <= def.range)
        .sort((a, b) => a.x - b.x);
      if (targets.length === 0) continue;
      unit.attackTimer = def.interval;
      const element = def.elements.length ? def.elements[unit.nextElement++ % def.elements.length] : null;
      this.events.push({ type: 'shot', row: unit.row, from: origin, to: targets[0].x, element });
      const struck = def.pierce ? targets : [targets[0]];
      for (const enemy of struck) this.hit(enemy, def.damage, element, unit);
      if (def.splash > 0) this.splash(targets[0], def.damage * 0.6, def.splash, targets[0]);
      this.chain(targets[0], def.damage * 0.5, def.chain);
    }
  }

  // Удар по всем врагам на поле. Лунный удар по врагу с любой аурой всегда наносит x2.
  private castField(unit: Unit): boolean {
    const field = unit.def.field!;
    const targets = this.enemies.filter((enemy) => enemy.hp > 0 && enemy.x <= COLS);
    if (targets.length === 0) return false;
    const kind = field.kinds[unit.nextField % field.kinds.length];
    const elements = unit.def.elements;
    const element = elements[unit.nextField % elements.length];
    unit.nextField++;
    unit.castTimer = CAST_TIME;
    const hits: FieldHit[] = [];
    for (const enemy of targets) {
      const before = enemy.hp;
      let lunar = false;
      if (kind === 'moon') {
        lunar = enemy.aura !== null;
        this.damage(enemy, lunar ? field.damage * 2 : field.damage);
        if (lunar) LUNAR_BONUS[element]?.(enemy, this.time);
        if (lunar && element === 'geo') unit.hp = Math.min(unit.def.hp, unit.hp + 20);
        if (element !== 'geo' && element !== 'anemo') enemy.aura = element;
      } else if (kind === 'waterfall') {
        this.hit(enemy, field.damage, 'hydro', unit);
      } else {
        this.hit(enemy, field.damage, 'cryo', unit);
        enemy.slowUntil = this.time + 3;
        if (unit.def.tier >= 3) enemy.stunUntil = Math.max(enemy.stunUntil, this.time + 0.8);
      }
      hits.push({ row: enemy.row, x: enemy.x, damage: Math.round(before - enemy.hp), lunar });
    }
    this.events.push({ type: 'field', kind, tier: unit.def.tier, name: unit.def.id, elements, hits });
    return true;
  }

  private splash(center: Enemy, damage: number, radius: number, exclude?: Enemy) {
    for (const enemy of this.enemies) {
      if (enemy === exclude || enemy.hp <= 0) continue;
      if (Math.hypot(enemy.row - center.row, enemy.x - center.x) <= radius) this.damage(enemy, damage);
    }
  }

  private chain(from: Enemy, damage: number, jumps: number) {
    let current = from;
    const struck = new Set([from]);
    for (let i = 0; i < jumps; i++) {
      const next = this.enemies
        .filter((enemy) => !struck.has(enemy) && enemy.hp > 0 && enemy.x <= COLS)
        .sort((a, b) => Math.hypot(a.row - current.row, a.x - current.x) - Math.hypot(b.row - current.row, b.x - current.x))[0];
      if (!next || Math.hypot(next.row - current.row, next.x - current.x) > 2.5) return;
      this.damage(next, damage);
      struck.add(next);
      current = next;
    }
  }

  private damage(enemy: Enemy, amount: number) {
    if (enemy.shieldUntil > this.time) return;
    enemy.hp -= enemy.vulnUntil > this.time ? amount * 1.4 : amount;
  }

  private hit(enemy: Enemy, damage: number, element: Element | null, unit: Unit) {
    let total = damage;
    if (element === 'cryo') enemy.slowUntil = this.time + 2;
    if (element && enemy.aura && enemy.aura !== element) {
      const reaction = reactionFor(enemy.aura, element);
      if (reaction) {
        total *= reaction.mult;
        enemy.aura = null;
        this.events.push({ type: 'reaction', row: enemy.row, x: enemy.x, name: reaction.name });
        if (reaction.stun) enemy.stunUntil = this.time + reaction.stun;
        if (reaction.vuln) enemy.vulnUntil = this.time + reaction.vuln;
        if (reaction.heal) unit.hp = Math.min(unit.def.hp, unit.hp + reaction.heal);
        if (reaction.splash) this.splash(enemy, damage * 0.7, reaction.splash, enemy);
        if (reaction.chain) this.chain(enemy, damage * 0.6, reaction.chain);
      }
    } else if (element && element !== 'anemo' && element !== 'geo') {
      enemy.aura = element;
    }
    this.damage(enemy, total);
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || enemy.stunUntil > this.time) continue;
      if (enemy.def.skills) this.updateBoss(enemy, dt);
      const rage = enemy.enraged ? 2 : 1;
      const attacked = this.enemyTarget(enemy);
      enemy.attacking = attacked !== undefined;
      if (attacked) {
        attacked.hp -= enemy.def.dps * rage * dt;
        if (enemy.def.range === 0 || enemy.x - (attacked.col + 0.5) <= 0.6) continue;
      }
      const slow = enemy.slowUntil > this.time ? 0.6 : 1;
      enemy.x -= enemy.def.speed * slow * (enemy.enraged ? 1.6 : 1) * dt;
      if (enemy.x < 0) this.breach(enemy);
    }
  }

  // Спецатаки боссов. Название атаки уходит в событие как ключ перевода.
  private updateBoss(enemy: Enemy, dt: number) {
    enemy.def.skills!.forEach((skill, index) => {
      if (skill.kind === 'enrage') {
        if (!enemy.enraged && enemy.hp < enemy.maxHp * skill.every) {
          enemy.enraged = true;
          this.bossEvent(enemy, skill);
        }
        return;
      }
      enemy.skillTimers[index] -= dt;
      if (enemy.skillTimers[index] > 0 || enemy.x > COLS) return;
      enemy.skillTimers[index] = skill.every;
      this.useSkill(enemy, skill);
    });
  }

  private bossEvent(enemy: Enemy, skill: BossSkill) {
    this.events.push({ type: 'reaction', row: enemy.row, x: enemy.x, name: `skill_${skill.kind}` });
  }

  private useSkill(enemy: Enemy, skill: BossSkill) {
    const near = (rows = 0) => this.units.filter((unit) => Math.abs(unit.row - enemy.row) <= rows);
    const power = skill.power ?? 0;
    switch (skill.kind) {
      case 'freeze':
      case 'gust':
        for (const unit of near(skill.rows)) unit.stunUntil = this.time + power;
        break;
      case 'quake':
      case 'burn':
        for (const unit of near(skill.rows)) unit.hp -= power;
        break;
      case 'strike': {
        const pool = [...this.units];
        for (let i = 0; i < (skill.count ?? 1) && pool.length; i++) {
          const target = pool.splice(Math.floor(this.random() * pool.length), 1)[0];
          target.hp -= power;
        }
        break;
      }
      case 'shield':
        enemy.shieldUntil = this.time + power;
        break;
      case 'heal':
        for (const other of this.enemies) other.hp = Math.min(other.maxHp, other.hp + other.maxHp * power);
        break;
      case 'devour': {
        const victim = this.units.filter((unit) => unit.row === enemy.row && unit.col + 0.5 <= enemy.x).sort((a, b) => b.col - a.col)[0];
        if (!victim) return;
        victim.hp = 0;
        break;
      }
      case 'summon':
        for (const name of skill.summon ?? []) {
          const def = ENEMIES[enemyId(name)];
          if (def) this.addEnemy(def, Math.max(0, Math.min(ROWS - 1, enemy.row + Math.floor(this.random() * 3) - 1)), Math.min(COLS + 0.4, enemy.x + 0.6));
        }
        break;
    }
    this.bossEvent(enemy, skill);
  }

  private enemyTarget(enemy: Enemy): Unit | undefined {
    const reach = enemy.def.range > 0 ? enemy.def.range : 0.1;
    return this.units
      .filter((unit) => unit.row === enemy.row && unit.hp > 0 && enemy.x - (unit.col + 0.5) >= -0.5 && enemy.x - (unit.col + 0.5) <= reach + 0.4)
      .sort((a, b) => b.col - a.col)[0];
  }

  private breach(enemy: Enemy) {
    if (!this.guards[enemy.row]) {
      this.status = 'lost';
      return;
    }
    this.guards[enemy.row] = false;
    this.events.push({ type: 'reaction', row: enemy.row, x: 0.5, name: 'guardLine' });
    for (const other of this.enemies) if (other.row === enemy.row) other.hp = 0;
  }
}
