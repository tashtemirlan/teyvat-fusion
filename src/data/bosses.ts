// Боссы Genshin: у каждого своё здоровье, скорость и спецатаки.
export type BossSkillKind = 'freeze' | 'gust' | 'quake' | 'strike' | 'shield' | 'heal' | 'devour' | 'summon' | 'enrage' | 'burn';

export interface BossSkill {
  kind: BossSkillKind;
  // Раз в сколько секунд срабатывает. У ярости это порог здоровья, после которого босс звереет.
  every: number;
  power?: number;
  rows?: number;
  count?: number;
  summon?: string[];
}

export interface BossDef {
  hp: number;
  speed: number;
  dps: number;
  skills: BossSkill[];
}

export const BOSSES: Record<string, BossDef> = {
  Stormterror: { hp: 14000, speed: 0.14, dps: 90, skills: [{ kind: 'gust', every: 9, rows: 1, power: 2 }, { kind: 'strike', every: 13, count: 3, power: 60 }] },
  'Lupus Boreas, Dominator of Wolves': { hp: 12000, speed: 0.16, dps: 110, skills: [{ kind: 'summon', every: 12, summon: ['Rockfond Rifthound Whelp', 'Thundercraven Rifthound Whelp'] }, { kind: 'freeze', every: 15, rows: 0, power: 2 }] },
  Childe: { hp: 16000, speed: 0.16, dps: 130, skills: [{ kind: 'burn', every: 7, rows: 0, power: 45 }, { kind: 'enrage', every: 0.5 }] },
  Azhdaha: { hp: 22000, speed: 0.1, dps: 160, skills: [{ kind: 'quake', every: 8, rows: 1, power: 55 }, { kind: 'shield', every: 20, power: 4 }] },
  'La Signora': { hp: 18000, speed: 0.13, dps: 120, skills: [{ kind: 'freeze', every: 10, rows: 1, power: 3 }, { kind: 'enrage', every: 0.5 }] },
  'Magatsu Mitake Narukami no Mikoto': { hp: 20000, speed: 0.12, dps: 140, skills: [{ kind: 'strike', every: 7, count: 5, power: 70 }] },
  'Shouki no Kami, the Prodigal': { hp: 17000, speed: 0.15, dps: 120, skills: [{ kind: 'shield', every: 12, power: 4 }, { kind: 'strike', every: 9, count: 3, power: 60 }] },
  "Guardian of Apep's Oasis": { hp: 26000, speed: 0.09, dps: 150, skills: [{ kind: 'heal', every: 12, power: 0.15 }, { kind: 'summon', every: 16, summon: ['Dendro Slime', 'Floating Dendro Fungus'] }] },
  'All-Devouring Narwhal': { hp: 24000, speed: 0.11, dps: 170, skills: [{ kind: 'devour', every: 15 }] },
  'The Knave': { hp: 21000, speed: 0.15, dps: 160, skills: [{ kind: 'burn', every: 8, rows: 1, power: 50 }, { kind: 'enrage', every: 0.5 }] },
  'Lord of Eroded Primal Fire': { hp: 25000, speed: 0.1, dps: 180, skills: [{ kind: 'burn', every: 6, rows: 1, power: 60 }, { kind: 'quake', every: 14, rows: 2, power: 40 }] },
  'The Game Before the Gate': { hp: 19000, speed: 0.12, dps: 130, skills: [{ kind: 'summon', every: 10, summon: ['Hilichurl', 'Pyro Slime', 'Hilichurl Shooter'] }, { kind: 'shield', every: 18, power: 3 }] },
  'The Doctor': { hp: 23000, speed: 0.13, dps: 150, skills: [{ kind: 'summon', every: 12, summon: ['Fatui Skirmisher - Pyroslinger Bracer', 'Fatui Skirmisher - Cryogunner Legionnaire'] }, { kind: 'heal', every: 15, power: 0.1 }] },
  'Il Dottore': { hp: 27000, speed: 0.12, dps: 170, skills: [{ kind: 'strike', every: 8, count: 4, power: 80 }, { kind: 'enrage', every: 0.4 }] },
};
