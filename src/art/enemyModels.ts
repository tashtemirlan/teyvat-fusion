// Блочные модели врагов: у каждого семейства свои узнаваемые черты из Genshin.
import * as THREE from 'three';
import { box, GOLD, INK, shade, solid, type BlockyRig } from './blocky';
import type { EnemyLook } from './enemyLooks';

type Vec = [number, number, number];

interface Kit {
  root: THREE.Group;
  head: THREE.Group;
  armRight: THREE.Group;
  armLeft: THREE.Group;
  legRight: THREE.Group;
  legLeft: THREE.Group;
  c: (hex: string, glow?: boolean) => THREE.Material;
  b: (size: Vec, at: Vec, color: string | THREE.Material, parent?: THREE.Object3D, tilt?: number) => THREE.Mesh;
  look: EnemyLook;
  glow: THREE.Material;
}

function makeKit(look: EnemyLook): Kit {
  const cache = new Map<string, THREE.Material>();
  const c = (hex: string, glow = false) => {
    const id = `${hex}${glow}`;
    if (!cache.has(id)) cache.set(id, solid(hex, glow));
    return cache.get(id)!;
  };
  const root = new THREE.Group();
  const kit: Kit = {
    root,
    head: new THREE.Group(),
    armRight: new THREE.Group(),
    armLeft: new THREE.Group(),
    legRight: new THREE.Group(),
    legLeft: new THREE.Group(),
    c,
    b: (size, at, color, parent = root, tilt = 0) => box(size, at, typeof color === 'string' ? c(color) : color, parent, tilt),
    look,
    glow: c(look.color, true),
  };
  root.add(kit.head, kit.armRight, kit.armLeft, kit.legRight, kit.legLeft);
  return kit;
}

const rig = (kit: Kit, headY: number): BlockyRig => ({
  root: kit.root, head: kit.head, headY, armRight: kit.armRight, armLeft: kit.armLeft, legRight: kit.legRight, legLeft: kit.legLeft,
  orbit: new THREE.Group(), floating: new THREE.Group(), walks: true,
});

// Двуногое тело: ноги, туловище, руки и точка головы.
function biped(kit: Kit, o: { legW: number; legH: number; torso: Vec; arm: Vec; skin: string; cloth: string; legs: string; boots?: string }) {
  const { b } = kit;
  const [tw, th, td] = o.torso;
  const hip = o.legH;
  for (const [group, dir] of [[kit.legRight, 1], [kit.legLeft, -1]] as const) {
    group.position.set(dir * (tw / 2 - o.legW / 2), hip, 0);
    b([o.legW, o.legH, o.legW], [0, -o.legH / 2, 0], o.legs, group);
    if (o.boots) b([o.legW + 0.4, o.legH * 0.35, o.legW + 1], [0, -o.legH * 0.82, 0.3], o.boots, group);
  }
  b([tw, th, td], [0, hip + th / 2, 0], o.cloth);
  const shoulder = hip + th;
  for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
    group.position.set(dir * (tw / 2 + o.arm[0] / 2), shoulder, 0);
    b(o.arm, [0, -o.arm[1] / 2, 0], o.cloth, group);
    b([o.arm[0] + 0.1, o.arm[1] * 0.25, o.arm[2] + 0.1], [0, -o.arm[1] * 0.88, 0], o.skin, group);
  }
  kit.head.position.set(0, shoulder, 0);
  return shoulder;
}

const eyes = (kit: Kit, y: number, z: number, gap: number, size = 1.6, color = '#fff1a8') => {
  for (const dir of [-1, 1]) kit.b([size, size, 0.6], [dir * gap, y, z], kit.c(color, true), kit.head);
};

// Оружие в правой руке, длина вниз от кисти.
function weapon(kit: Kit, kind: string, armH: number) {
  const { b, c, glow } = kit;
  const hand = kit.armRight;
  const y = -armH;
  if (kind === 'club') {
    b([1.6, 9, 1.6], [0, y - 2, 2.5], '#8a5a30', hand, 0.2);
    b([3, 3.4, 3], [0.8, y + 2.6, 2.5], '#6a4224', hand);
  } else if (kind === 'axe') {
    b([1.6, 16, 1.6], [0, y + 1, 3], '#6a4224', hand);
    b([1.4, 7, 7], [0, y + 7, 6], c(shade(kit.look.color, -0.1)), hand);
    b([1.6, 6, 1], [0, y + 7, 9.4], glow, hand);
  } else if (kind === 'sword') {
    b([1.4, 15, 2.4], [0, y - 4, 3], '#d8e4f0', hand);
    b([1.6, 6, 1], [0, y - 5, 3], glow, hand);
    b([1.8, 1.4, 5], [0, y + 3, 3], GOLD, hand);
  } else if (kind === 'staff') {
    b([1.2, 20, 1.2], [0, y + 3, 3], '#5a3a2a', hand);
    b([3.4, 3.4, 3.4], [0, y + 14, 3], glow, hand);
  } else if (kind === 'bow') {
    b([1.4, 12, 1.4], [0, y, 4], '#8a5a30', hand);
    b([6, 1.4, 1.4], [0, y, 4], '#6a4224', hand);
    b([1.6, 1.6, 2.4], [0, y, 7], glow, hand);
  } else if (kind === 'bomb') {
    b([4.4, 4.4, 4.4], [0, y - 1, 3], glow, hand);
    b([1.4, 2, 1.4], [0, y + 2, 3], INK, hand);
  } else if (kind === 'shield') {
    const s = kit.armLeft;
    b([1.4, 12, 9], [-1.4, y + 3, 2], c(shade(kit.look.color, -0.15)), s);
    b([1.6, 3, 3], [-2, y + 3, 2], glow, s);
  } else if (kind === 'gun') {
    b([2, 2.6, 8], [0, y + 1, 4], '#3a3a44', hand);
    b([1.4, 1.4, 2], [0, y + 1.4, 8.6], glow, hand);
  }
}

// Маска хиличурла: белая кость с красным узором.
function hiliMask(kit: Kit, y: number, z: number, w: number, h: number, horns = false) {
  const { b } = kit;
  b([w, h, 1.2], [0, y, z], '#efe6cf', kit.head);
  b([w * 0.8, 0.8, 1.4], [0, y + h * 0.2, z + 0.1], '#c0303a', kit.head);
  b([0.8, h * 0.6, 1.4], [0, y - h * 0.1, z + 0.1], '#c0303a', kit.head);
  eyes(kit, y + h * 0.05, z + 0.7, w * 0.24, 1.4, '#1a1010');
  if (horns) for (const dir of [-1, 1]) b([1.8, 5, 1.8], [dir * w * 0.45, y + h * 0.7, z - 1], '#efe6cf', kit.head, dir * -0.4);
}

const BUILDERS: Record<string, (kit: Kit) => number> = {
  hilichurl: (kit) => {
    const { b, look } = kit;
    const top = biped(kit, { legW: 3.4, legH: 5, torso: [9, 7, 6], arm: [2.8, 7, 2.8], skin: '#5a3a28', cloth: '#5a3a28', legs: '#4a3020' });
    b([9.6, 3, 6.6], [0, 6, 0], '#9a7448');
    b([10, 1, 6.8], [0, 7.2, 0], '#c9a060');
    b([9, 8, 8], [0, 4, 0], '#5a3a28', kit.head);
    b([9.8, 3.4, 8.8], [0, 8.6, -0.6], '#e8dcb8', kit.head);
    b([3, 3, 3], [-2, 10.6, 0], '#e8dcb8', kit.head, 0.3);
    hiliMask(kit, 4.4, 4.2, 7.4, 6);
    const kind = look.variant === 'shooter' ? 'bow' : look.variant === 'bomb' ? 'bomb' : look.variant === 'shield' ? 'shield' : 'club';
    weapon(kit, kind, 7);
    if (kind === 'shield') weapon(kit, 'club', 7);
    if (look.variant === 'brawler') b([3.4, 3.4, 3.4], [0.8, -2, 2.5], kit.glow, kit.armRight);
    return top;
  },
  mitachurl: (kit) => {
    const { b } = kit;
    const top = biped(kit, { legW: 4.6, legH: 7, torso: [15, 12, 9], arm: [4.4, 12, 4.4], skin: '#5a3a28', cloth: '#5a3a28', legs: '#4a3020' });
    b([17, 4, 11], [0, top - 1.4, 0], '#d9c8a0');
    b([15.6, 4, 9.6], [0, 9, 0], '#8a6a40');
    b([10, 9, 9], [0, 4.5, 1], '#5a3a28', kit.head);
    hiliMask(kit, 5, 5.8, 8.6, 7, true);
    weapon(kit, kit.look.variant === 'shield' ? 'shield' : 'axe', 12);
    if (kit.look.variant === 'shield') weapon(kit, 'club', 12);
    return top;
  },
  lawachurl: (kit) => {
    const { b, c, look } = kit;
    const top = biped(kit, { legW: 6, legH: 9, torso: [19, 15, 12], arm: [6.4, 16, 6.4], skin: '#5a3a28', cloth: '#5a3a28', legs: '#4a3020' });
    for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
      b([8, 9, 8], [dir * 0.4, -11, 0], c(look.color), group);
      b([7, 3, 7], [dir * 0.6, -1, 0], c(shade(look.color, -0.2)), group);
    }
    b([21, 5, 14], [0, top - 1, 0], c(shade(look.color, -0.25)));
    b([10, 8, 9], [0, 4, 2], '#5a3a28', kit.head);
    hiliMask(kit, 4.6, 6.8, 8, 6, true);
    return top;
  },
  samachurl: (kit) => {
    const { b, glow } = kit;
    const top = biped(kit, { legW: 2.8, legH: 6, torso: [7, 8, 5], arm: [2.4, 8, 2.4], skin: '#5a3a28', cloth: '#6a4a30', legs: '#4a3020' });
    b([8.6, 5, 6], [0, 7, 0], '#a88a5a');
    b([8, 8, 8], [0, 4, 0], '#5a3a28', kit.head);
    hiliMask(kit, 4, 4.2, 7, 6);
    for (let i = 0; i < 5; i++) b([1.4, 6, 1.2], [-4 + i * 2, 11, -1], i % 2 ? '#e8dcb8' : glow, kit.head, (i - 2) * 0.2);
    weapon(kit, 'staff', 8);
    return top;
  },
  slime: (kit) => {
    const { b, c, look } = kit;
    const s = look.variant === 'large' ? 1.35 : 1;
    const body = new THREE.MeshLambertMaterial({ color: look.color, transparent: true, opacity: 0.9 });
    b([18 * s, 13 * s, 16 * s], [0, 6.5 * s, 0], body);
    b([12 * s, 5 * s, 11 * s], [0, 15 * s, 0], body);
    b([5 * s, 2 * s, 1], [4 * s, 13 * s, 8 * s], c('#ffffff'));
    kit.head.position.set(0, 0, 0);
    eyes(kit, 9 * s, 8.3 * s, 3.6 * s, 2.8 * s, '#1a1010');
    const crown = look.color;
    if (/e2683a/.test(crown)) for (let i = 0; i < 3; i++) b([2.4, 4 + i, 2.4], [-3 + i * 3, 19 * s + i, 0], c('#ffb347', true));
    else if (/a772e8/.test(crown)) for (const dir of [-1, 1]) b([1.8, 5, 1.8], [dir * 4 * s, 19 * s, 0], c('#e8d0ff', true), kit.root, dir * -0.3);
    else if (/9fdcec/.test(crown)) for (let i = 0; i < 4; i++) b([2, 5, 2], [-4.5 + i * 3, 19 * s, (i % 2) * 2], c('#e6f8ff'));
    else if (/8fc73e/.test(crown)) b([6, 1.4, 3], [2, 18.6 * s, 0], c('#4f8f55'), kit.root, -0.3);
    else if (/d9a93f/.test(crown)) b([14 * s, 4, 12 * s], [0, 17.4 * s, 0], c('#8a6a22'));
    else if (/62d6b2/.test(crown)) for (const dir of [-1, 1]) b([6, 2, 1.4], [dir * 9 * s, 12 * s, 0], c('#e8fff6'), kit.root, dir * 0.4);
    else b([3, 4, 3], [0, 18.6 * s, 0], c('#c8ecff'));
    return 0;
  },
  mage: (kit) => {
    const { b, c, look } = kit;
    b([12, 15, 9], [0, 9.5, 0], '#2a2140');
    b([14, 4, 11], [0, 3, 0], '#3a2a5a');
    b([12.4, 1.2, 9.4], [0, 13, 0], c(look.color));
    kit.armRight.position.set(7.4, 16, 0);
    kit.armLeft.position.set(-7.4, 16, 0);
    for (const group of [kit.armRight, kit.armLeft]) b([3, 9, 3], [0, -4.5, 0], '#2a2140', group);
    weapon(kit, 'staff', 9);
    kit.head.position.set(0, 17, 0);
    b([10, 9, 10], [0, 4.5, 0], '#1a1428', kit.head);
    eyes(kit, 4.6, 5.3, 2.2, 1.8, '#fff1a8');
    b([11, 3, 11], [0, 9.4, 0], c(look.dark), kit.head);
    b([7, 4, 7], [0, 12.6, 0], c(look.color), kit.head);
    for (const dir of [-1, 1]) b([1.8, 6, 1.8], [dir * 4.6, 13, 0], c(look.dark), kit.head, dir * -0.5);
    // Стихийный щит мага.
    const shield = new THREE.MeshBasicMaterial({ color: look.color, transparent: true, opacity: 0.18, depthWrite: false });
    b([24, 30, 22], [0, 13, 0], shield);
    return 17;
  },
  herald: (kit) => {
    const { b, c, look } = kit;
    const top = biped(kit, { legW: 4, legH: 11, torso: [11, 12, 6], arm: [3.4, 12, 3.4], skin: '#1a1428', cloth: '#2a2238', legs: '#1a1428', boots: '#3a2a5a' });
    b([11.4, 1, 6.4], [0, top - 4, 0], c(look.color, true));
    b([13, 22, 1], [0, top - 10, -3.6], '#3a2a5a');
    b([10, 10, 10], [0, 5, 0], '#2a2238', kit.head);
    b([8, 1.6, 1], [0, 5, 5.2], c(look.color, true), kit.head);
    for (const dir of [-1, 1]) b([2, 8, 2], [dir * 4.4, 12, 0], '#1a1428', kit.head, dir * -0.35);
    weapon(kit, 'sword', 12);
    return top;
  },
  fatui: (kit) => {
    const { b, c, look } = kit;
    const top = biped(kit, { legW: 4, legH: 9, torso: [10, 11, 6], arm: [3.2, 11, 3.2], skin: '#2a2a33', cloth: '#d6d6de', legs: '#2a2a33', boots: '#1a1a22' });
    b([10.6, 2, 6.6], [0, 13, 0], '#3a3a44');
    b([2.4, 2, 1], [0, 13, 3.4], c(look.color, true));
    b([12, 3, 7], [0, top - 1, 0], '#f3f6fb');
    b([9, 9, 9], [0, 4.5, 0], '#f1dcc4', kit.head);
    b([9.4, 3.4, 1], [0, 5, 4.8], '#1a1a22', kit.head);
    eyes(kit, 5, 5.4, 2.2, 1.4, look.color);
    b([10.6, 4, 10.6], [0, 10, 0], '#8a8a96', kit.head);
    b([11.6, 1.6, 11.6], [0, 8.4, 0], '#f3f6fb', kit.head);
    const kind = look.variant === 'shooter' ? 'gun' : look.variant === 'brawler' ? 'axe' : 'sword';
    weapon(kit, kind, 11);
    return top;
  },
  agent: (kit) => {
    const { b, c, look } = kit;
    const witch = look.variant === 'witch';
    const top = biped(kit, { legW: 3.4, legH: 9, torso: [9, 10, 5], arm: [3, 10, 3], skin: '#f1dcc4', cloth: witch ? '#3a2a5a' : '#2a2a33', legs: '#1a1a22', boots: '#1a1a22' });
    if (witch) b([13, 9, 9], [0, 6, 0], '#3a2a5a');
    b([9, 9, 9], [0, 4.5, 0], '#f1dcc4', kit.head);
    b([10, 10, 10], [0, 5.4, -0.6], witch ? '#d6d6de' : '#1a1a22', kit.head);
    b([9.4, 3, 1], [0, 4.4, 4.8], '#2a2a33', kit.head);
    eyes(kit, 4.4, 5.4, 2, 1.4, look.color);
    if (witch) {
      b([1.2, 14, 1.2], [0, -6, 3], '#5a3a2a', kit.armRight);
      b([4, 4, 4], [0, -14, 3], c(look.color, true), kit.armRight);
    } else {
      weapon(kit, 'sword', 10);
      b([1.4, 8, 1.4], [0, -12, 2], c(look.color, true), kit.armLeft);
    }
    return top;
  },
  hoarder: (kit) => {
    const { b, look } = kit;
    const top = biped(kit, { legW: 3.8, legH: 9, torso: [10, 10, 6], arm: [3.2, 10, 3.2], skin: '#d9a57e', cloth: '#6a5a40', legs: '#3a3a2a', boots: '#2a2018' });
    b([10.4, 9, 6.4], [0, 13.5, 0], '#8a7a5a');
    b([9, 9, 9], [0, 4.5, 0], '#d9a57e', kit.head);
    b([9.4, 4, 1], [0, 2.6, 4.8], '#3a4a5a', kit.head);
    b([9.8, 2, 9.8], [0, 8, 0], '#a03a2a', kit.head);
    eyes(kit, 5.6, 4.8, 2, 1.4, '#1a1010');
    weapon(kit, look.variant === 'bomb' ? 'bomb' : look.variant === 'shooter' ? 'bow' : 'sword', 10);
    return top;
  },
  nobushi: (kit) => {
    const { b } = kit;
    const top = biped(kit, { legW: 4, legH: 9, torso: [10, 11, 6], arm: [3.4, 11, 3.4], skin: '#d9a57e', cloth: '#3a3a5a', legs: '#2a2a3a', boots: '#1a1a22' });
    b([12, 5, 7], [0, 9, 0], '#5a4a3a');
    b([9, 9, 9], [0, 4.5, 0], '#d9a57e', kit.head);
    eyes(kit, 5, 4.8, 2, 1.4, '#1a1010');
    b([18, 1.4, 18], [0, 10.6, 0], '#c9a060', kit.head);
    b([10, 3, 10], [0, 12.4, 0], '#b08a50', kit.head);
    weapon(kit, 'sword', 11);
    return top;
  },
  kairagi: (kit) => {
    const { b, c, look } = kit;
    const top = biped(kit, { legW: 4.4, legH: 10, torso: [12, 12, 7], arm: [3.8, 12, 3.8], skin: '#2a2a33', cloth: '#3a2a2a', legs: '#2a1a1a', boots: '#1a1a22' });
    b([14, 3, 8], [0, top - 1, 0], c(shade(look.color, -0.3)));
    b([10, 10, 10], [0, 5, 0], '#2a1a1a', kit.head);
    b([9, 7, 1.2], [0, 4.6, 5.2], '#c0303a', kit.head);
    eyes(kit, 5.4, 5.9, 2.2, 1.6, look.color);
    for (const dir of [-1, 1]) b([2, 6, 2], [dir * 4, 12, 1], '#efe6cf', kit.head, dir * -0.4);
    weapon(kit, 'sword', 12);
    return top;
  },
  eremite: (kit) => {
    const { b, look } = kit;
    const top = biped(kit, { legW: 3.8, legH: 9, torso: [10, 10, 6], arm: [3.2, 10, 3.2], skin: '#c08a5e', cloth: '#c9b080', legs: '#6a5a3a', boots: '#4a3a2a' });
    b([11, 3, 7], [0, top - 1, 0], '#a03a2a');
    b([9, 9, 9], [0, 4.5, 0], '#c08a5e', kit.head);
    eyes(kit, 5, 4.8, 2, 1.4, '#1a1010');
    b([10.4, 4, 10.4], [0, 9, 0], '#e8dcb8', kit.head);
    b([9.4, 3, 1], [0, 2.4, 4.8], '#e8dcb8', kit.head);
    weapon(kit, look.variant === 'shooter' ? 'bow' : 'axe', 10);
    return top;
  },
  warrior: (kit) => {
    const { b, look } = kit;
    const top = biped(kit, { legW: 3.8, legH: 9, torso: [10, 10, 6], arm: [3.2, 10, 3.2], skin: '#b07850', cloth: look.color, legs: '#3a2a22', boots: '#2a1a12' });
    b([10.4, 2, 6.4], [0, 11, 0], GOLD);
    b([9, 9, 9], [0, 4.5, 0], '#b07850', kit.head);
    eyes(kit, 5, 4.8, 2, 1.4, '#1a1010');
    for (let i = 0; i < 5; i++) b([1.4, 7, 1], [-4 + i * 2, 12, -2], i % 2 ? '#e8c26a' : look.color, kit.head, (i - 2) * 0.25);
    weapon(kit, look.variant === 'shooter' ? 'gun' : 'axe', 10);
    return top;
  },
  knight: (kit) => {
    const { b, c, look } = kit;
    const top = biped(kit, { legW: 5, legH: 11, torso: [13, 13, 8], arm: [4.4, 13, 4.4], skin: '#1a1428', cloth: '#2a2a3a', legs: '#1a1a26', boots: '#3a3a4a' });
    b([16, 4, 10], [0, top - 1, 0], '#3a3a4a');
    b([11, 11, 11], [0, 5.5, 0], '#2a2a3a', kit.head);
    b([9, 1.6, 1], [0, 5.4, 5.7], c(look.color, true), kit.head);
    b([2, 9, 2], [0, 13, 1], '#3a3a4a', kit.head);
    weapon(kit, look.variant === 'shield' ? 'shield' : 'sword', 13);
    if (look.variant === 'shield') weapon(kit, 'sword', 13);
    return top;
  },
  ruinGuard: (kit) => {
    const { b, c } = kit;
    for (const [group, dir] of [[kit.legRight, 1], [kit.legLeft, -1]] as const) {
      group.position.set(dir * 6, 10, 0);
      b([6, 10, 6], [0, -5, 0], '#6a6458', group);
      b([7, 2, 8], [0, -9.4, 1], '#4a4640', group);
    }
    b([20, 16, 13], [0, 18, 0], '#8f8878');
    b([20.4, 2, 13.4], [0, 13, 0], '#5a564c');
    b([12, 8, 1], [0, 19, 6.8], '#5a564c');
    b([3, 3, 1.4], [0, 19, 7.2], c('#ff9d3c', true));
    for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
      group.position.set(dir * 12.5, 24, 0);
      b([5, 16, 5], [0, -8, 0], '#8f8878', group);
      b([6.4, 6, 6.4], [0, -17, 0], '#5a564c', group);
    }
    kit.head.position.set(0, 26, 0);
    b([12, 7, 10], [0, 3.5, 0], '#7a7466', kit.head);
    b([4.4, 4.4, 1.4], [0, 3.6, 5.2], c('#ff9d3c', true), kit.head);
    b([14, 1.6, 4], [0, 7.4, 0], '#5a564c', kit.head);
    return 26;
  },
  ruinHunter: (kit) => {
    const { b, c } = kit;
    b([14, 10, 12], [0, 20, 0], '#8f8878');
    b([6, 4, 1], [0, 20, 6.2], c('#ff9d3c', true));
    for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
      group.position.set(dir * 7, 23, 0);
      b([16, 2, 8], [dir * 8, 0, 0], '#6a6458', group, dir * 0.2);
      b([4, 1, 9], [dir * 15, 0.8, 0], c('#ffb347', true), group);
    }
    for (const [group, dir] of [[kit.legRight, 1], [kit.legLeft, -1]] as const) {
      group.position.set(dir * 4, 15, 0);
      b([3, 8, 3], [0, -4, 0], '#5a564c', group);
    }
    kit.head.position.set(0, 25, 0);
    b([8, 5, 8], [0, 2.5, 2], '#7a7466', kit.head);
    b([3, 3, 1], [0, 2.4, 6.2], c('#ff9d3c', true), kit.head);
    return 25;
  },
  mek: (kit) => {
    const { b, c, look } = kit;
    for (const [group, dir] of [[kit.legRight, 1], [kit.legLeft, -1]] as const) {
      group.position.set(dir * 4, 6, 0);
      b([4, 6, 4], [0, -3, 0], '#5a4a3a', group);
    }
    b([15, 12, 12], [0, 12, 0], '#c9a060');
    b([15.4, 2, 12.4], [0, 14, 0], '#8a6a3a');
    b([5, 5, 1], [0, 12, 6.2], c('#5fd0d0', true));
    for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
      group.position.set(dir * 9, 16, 0);
      b([3.4, 9, 3.4], [0, -4.5, 0], '#8a6a3a', group);
      b([4.4, 3, 4.4], [0, -9, 0], c(look.color), group);
    }
    kit.head.position.set(0, 18, 0);
    b([10, 6, 9], [0, 3, 0], '#d9b070', kit.head);
    b([7, 2.4, 1], [0, 3.4, 4.6], c('#5fd0d0', true), kit.head);
    b([1, 5, 1], [3, 8, 0], '#8a6a3a', kit.head);
    b([2, 2, 2], [3, 10.6, 0], c('#ff6a3c', true), kit.head);
    return 18;
  },
  vishap: (kit) => {
    const { b, c, look } = kit;
    const s = look.variant === 'large' ? 1.3 : 1;
    b([20 * s, 11 * s, 12 * s], [-1, 10 * s, 0], c(look.dark));
    for (let i = 0; i < 4; i++) b([5 * s, 3 * s, 13 * s], [-8 * s + i * 5 * s, 16 * s, 0], c(look.color));
    quadLegs(kit, s, look.dark);
    kit.head.position.set(10 * s, 12 * s, 0);
    b([10 * s, 8 * s, 9 * s], [3 * s, 2 * s, 0], c(look.dark), kit.head);
    b([6 * s, 4 * s, 8 * s], [6 * s, 6 * s, 0], c(look.color), kit.head);
    for (const dir of [-1, 1]) b([1.8, 1.8, 0.6], [6 * s, 3 * s, dir * 4.8 * s], c('#fff1a8', true), kit.head);
    b([12 * s, 3 * s, 3 * s], [-15 * s, 9 * s, 0], c(look.dark), kit.root, 0.2);
    return 12 * s;
  },
  saurian: (kit) => {
    const { b, c, look } = kit;
    b([18, 12, 11], [-1, 12, 0], c(look.color));
    b([18.4, 3, 11.4], [-1, 17, 0], c(look.dark));
    quadLegs(kit, 1, look.dark);
    kit.head.position.set(9, 15, 0);
    b([10, 9, 9], [3, 3, 0], c(look.color), kit.head);
    b([5, 3, 7], [8, 1, 0], c(shade(look.color, 0.25)), kit.head);
    b([2, 6, 2], [1, 10, 0], c(look.dark), kit.head, -0.3);
    for (const dir of [-1, 1]) b([1.8, 1.8, 0.6], [6, 5, dir * 4.8], c('#fff1a8', true), kit.head);
    b([10, 3, 3], [-14, 13, 0], c(look.dark), kit.root, 0.25);
    return 15;
  },
  rifthound: (kit) => {
    const { b, c, look } = kit;
    b([18, 8, 8], [-1, 10, 0], '#2a2238');
    for (let i = 0; i < 4; i++) b([2.4, 5 + (i % 2) * 2, 2.4], [-7 + i * 4, 16, 0], c(look.color, true), kit.root, -0.3);
    quadLegs(kit, 0.9, '#1a1428');
    kit.head.position.set(9, 12, 0);
    b([9, 7, 7], [3, 2, 0], '#2a2238', kit.head);
    b([4, 4, 5], [8, 0.5, 0], '#1a1428', kit.head);
    for (const dir of [-1, 1]) {
      b([1.8, 1.8, 0.6], [6, 3, dir * 3.8], c(look.color, true), kit.head);
      b([2, 4, 1.4], [1, 7, dir * 2.4], '#2a2238', kit.head);
    }
    b([10, 2, 2], [-14, 12, 0], '#2a2238', kit.root, 0.3);
    return 12;
  },
  volkodlak: (kit) => {
    const { b, look } = kit;
    const top = biped(kit, { legW: 3.8, legH: 9, torso: [10, 11, 6], arm: [3.2, 11, 3.2], skin: '#c08a50', cloth: '#5a4a6a', legs: '#3a2a3a', boots: '#2a1a22' });
    b([12, 3, 7], [0, top - 1, 0], '#f3f6fb');
    b([9, 8, 9], [0, 4, 0], '#d9a050', kit.head);
    b([4, 3, 4], [0, 2.4, 5.6], '#f2e8d8', kit.head);
    for (const dir of [-1, 1]) b([2.6, 5, 1.6], [dir * 3, 10, 0], '#d9a050', kit.head);
    eyes(kit, 5, 4.8, 2, 1.4, look.color);
    b([10, 3, 3], [0, 9, -5], '#d9a050', kit.root, 0.2);
    weapon(kit, 'sword', 11);
    return top;
  },
  beast: (kit) => {
    const { b, c, look } = kit;
    b([18, 10, 9], [-1, 10, 0], c(look.color));
    b([18.4, 2.4, 9.4], [-1, 14, 0], c(look.dark));
    quadLegs(kit, 1, look.dark);
    kit.head.position.set(9, 12, 0);
    b([9, 8, 8], [3, 3, 0], c(look.color), kit.head);
    b([4, 4, 6], [8, 1, 0], c(shade(look.color, 0.3)), kit.head);
    for (const dir of [-1, 1]) {
      b([2.2, 4, 1.6], [1, 8.4, dir * 3], c(look.dark), kit.head);
      b([1.8, 1.8, 0.6], [6, 4, dir * 4.3], c('#fff1a8', true), kit.head);
    }
    b([9, 2.4, 2.4], [-13, 13, 0], c(look.dark), kit.root, 0.3);
    return 12;
  },
  flyer: (kit) => {
    const { b, c, look } = kit;
    b([9, 8, 8], [0, 18, 0], c(look.color, true));
    kit.armRight.position.set(4.5, 20, 0);
    kit.armLeft.position.set(-4.5, 20, 0);
    for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
      b([10, 2, 6], [dir * 5, 0, 0], c(shade(look.color, 0.3)), group, dir * 0.2);
      b([6, 1.6, 5], [dir * 9, -2, 0], c(look.dark), group, dir * 0.4);
    }
    kit.head.position.set(0, 22, 0);
    eyes(kit, 0, 4.3, 2, 1.8, '#ffffff');
    b([3, 4, 3], [0, -2, -4.6], c(look.dark), kit.head);
    return 22;
  },
  crab: (kit) => {
    const { b, c, look } = kit;
    b([18, 8, 12], [0, 7, 0], c(look.color));
    b([18.4, 2, 12.4], [0, 11, 0], c(shade(look.color, 0.3)));
    for (const [leg, x] of [[kit.legRight, 6], [kit.legLeft, -6]] as const) {
      leg.position.set(x, 4, 0);
      b([3, 4, 13], [0, -2, 0], c(look.dark), leg);
    }
    for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
      group.position.set(dir * 11, 8, 4);
      b([6, 5, 6], [dir * 2, 0, 2], c(shade(look.color, 0.2)), group);
      b([3, 2, 4], [dir * 3, 3, 4], c(look.dark), group);
    }
    kit.head.position.set(0, 12, 0);
    for (const dir of [-1, 1]) b([1.4, 5, 1.4], [dir * 3, 2, 4], c(look.dark), kit.head);
    eyes(kit, 5, 4, 3, 2.2, '#ffffff');
    return 12;
  },
  specter: (kit) => {
    const { b, c, look } = kit;
    b([12, 11, 11], [0, 16, 0], c(look.color, true));
    b([8, 4, 8], [0, 10, 0], c(shade(look.color, 0.2), true));
    for (const dir of [-1, 1]) b([3, 5, 2], [dir * 4.4, 23, 0], c(look.dark), kit.root, dir * -0.3);
    b([3, 3, 8], [0, 13, -7], c(look.dark));
    kit.head.position.set(0, 16, 0);
    eyes(kit, 1, 5.8, 2.4, 2.2, '#ffffff');
    return 16;
  },
  spirit: (kit) => {
    const { b, c, look } = kit;
    const body = new THREE.MeshLambertMaterial({ color: look.color, transparent: true, opacity: 0.85 });
    b([12, 14, 10], [0, 15, 0], body);
    b([8, 7, 7], [0, 5, 0], body);
    for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
      group.position.set(dir * 8, 20, 0);
      b([3, 9, 3], [0, -4, 0], c(shade(look.color, 0.3)), group);
    }
    kit.head.position.set(0, 22, 0);
    b([8, 6, 8], [0, 3, 0], c(shade(look.color, 0.3)), kit.head);
    eyes(kit, 3, 4.3, 2.2, 2, '#ffffff');
    for (const dir of [-1, 1]) b([1.4, 5, 1.4], [dir * 3, 8, 0], c(look.color, true), kit.head);
    return 22;
  },
  cube: (kit) => {
    const { b, c, look } = kit;
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      b([7, 7, 7], [x * 4.6, 18 + y * 4.6, z * 4.6], c(x + y + z > 0 ? look.color : look.dark));
    }
    b([5, 5, 5], [0, 18, 0], c('#ffffff', true));
    kit.head.position.set(0, 18, 0);
    eyes(kit, 0, 8.4, 0, 3, '#ffffff');
    return 18;
  },
  plant: (kit) => {
    const { b, c, look } = kit;
    const big = look.variant === 'large' || /Regis/.test(look.key);
    const s = big ? 1.6 : 1;
    b([5 * s, 12 * s, 5 * s], [0, 6 * s, 0], '#3f6a2a');
    for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
      group.position.set(dir * 3 * s, 8 * s, 0);
      b([8 * s, 2, 3], [dir * 4 * s, 0, 0], '#4f8f55', group, dir * -0.3);
    }
    kit.head.position.set(0, 14 * s, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b([6 * s, 2, 5 * s], [Math.cos(a) * 6 * s, 3 * s, Math.sin(a) * 6 * s], c(look.color), kit.head, Math.cos(a) * 0.4);
    }
    b([8 * s, 6 * s, 8 * s], [0, 4 * s, 0], c(shade(look.color, -0.3)), kit.head);
    b([4 * s, 4 * s, 4 * s], [0, 4 * s, 3 * s], c('#ffe9a8', true), kit.head);
    return 14 * s;
  },
  fungus: (kit) => {
    const { b, c, look } = kit;
    b([6, 7, 6], [0, 11, 0], '#f2e8d8');
    kit.head.position.set(0, 14, 0);
    b([16, 5, 16], [0, 3, 0], c(look.color), kit.head);
    b([11, 3, 11], [0, 7, 0], c(shade(look.color, 0.25)), kit.head);
    for (const [x, z] of [[-4, 3], [4, -2], [2, 5]]) b([2, 1, 2], [x, 8.6, z], c('#ffffff'), kit.head);
    eyes(kit, -4, 3.2, 1.6, 1.6, '#1a1010');
    for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
      group.position.set(dir * 4, 12, 0);
      b([4, 2, 3], [dir * 2, 0, 0], c(look.color), group);
    }
    return 14;
  },
  dragon: (kit) => {
    const { b, c, look } = kit;
    const v = look.variant;
    b([28, 15, 14], [-2, 17, 0], c(look.dark));
    b([28.4, 3, 14.4], [-2, 23, 0], c(look.color));
    quadLegs(kit, 1.4, look.dark);
    const wings = v === 'dvalin' || v === 'primal';
    for (const dir of [-1, 1]) {
      if (wings) {
        b([18, 2, 16], [-4, 30, dir * 14], c(look.color, v === 'dvalin'), kit.root, 0.25);
        b([12, 2, 10], [-10, 34, dir * 20], c(shade(look.color, 0.3)), kit.root, 0.4);
      } else {
        for (let i = 0; i < 4; i++) b([3, 6, 3], [-12 + i * 6, 27, dir * 4], c(look.color), kit.root, -0.2);
      }
    }
    kit.head.position.set(14, 22, 0);
    b([14, 11, 12], [5, 4, 0], c(look.dark), kit.head);
    b([8, 5, 10], [13, 1, 0], c(look.color), kit.head);
    for (const dir of [-1, 1]) {
      b([2.4, 2.4, 0.6], [8, 6, dir * 6.2], c('#fff1a8', true), kit.head);
      b([2.6, 10, 2.6], [1, 13, dir * 4], c(v === 'azhdaha' ? GOLD : shade(look.color, 0.3)), kit.head, -0.5);
    }
    b([16, 4, 4], [-22, 18, 0], c(look.dark), kit.root, 0.3);
    b([6, 3, 6], [-30, 22, 0], c(look.color, true));
    if (v === 'primal') for (let i = 0; i < 5; i++) b([2, 4, 2], [-12 + i * 6, 25.5, 0], c('#ffb347', true));
    return 22;
  },
  whale: (kit) => {
    const { b, c, look } = kit;
    b([32, 14, 14], [0, 20, 0], c(look.color));
    b([32.4, 4, 14.4], [0, 14, 0], c(shade(look.color, 0.4)));
    for (let i = 0; i < 8; i++) b([1.4, 1.4, 1.4], [-12 + i * 3.4, 26, (i % 2) * 4 - 2], c('#c8e8ff', true));
    kit.head.position.set(16, 20, 0);
    b([3, 3, 18], [6, 2, 0], c('#e8f2ff', true), kit.head, 0);
    kit.head.rotation.y = Math.PI / 2;
    eyes(kit, 2, 5, 4, 2.4, '#ffffff');
    for (const [group, dir] of [[kit.armRight, 1], [kit.armLeft, -1]] as const) {
      group.position.set(4, 14, dir * 7);
      b([8, 2, 6], [0, 0, dir * 3], c(look.dark), group, 0.3);
    }
    b([10, 4, 14], [-20, 22, 0], c(look.dark), kit.root, 0.2);
    return 20;
  },
  wolfking: (kit) => {
    const { b, c, look } = kit;
    const body = new THREE.MeshLambertMaterial({ color: look.color, transparent: true, opacity: 0.92 });
    b([26, 14, 12], [-2, 16, 0], body);
    b([18, 6, 13], [2, 24, 0], c(look.dark));
    quadLegs(kit, 1.4, look.dark);
    kit.head.position.set(13, 20, 0);
    b([12, 11, 11], [4, 4, 0], body, kit.head);
    b([6, 5, 8], [11, 1, 0], c(shade(look.color, 0.3)), kit.head);
    for (const dir of [-1, 1]) {
      b([3, 7, 2], [1, 12, dir * 4], c(look.dark), kit.head);
      b([2.4, 2.4, 0.6], [8, 6, dir * 5.8], c('#ffffff', true), kit.head);
    }
    for (let i = 0; i < 6; i++) b([2, 2, 2], [-14 + i * 5, 32 + (i % 2) * 2, 0], c(look.color, true));
    b([14, 5, 5], [-20, 20, 0], body, kit.root, 0.4);
    return 20;
  },
  giant: (kit) => {
    const { b, c, look } = kit;
    const top = biped(kit, { legW: 6, legH: 12, torso: [18, 18, 10], arm: [6, 15, 6], skin: '#e8d9c0', cloth: '#3a3a4a', legs: '#2a2a3a', boots: '#1a1a22' });
    b([18.4, 3, 10.4], [0, 14, 0], c(look.dark));
    b([5, 5, 1], [0, 22, 5.4], c(look.color, true));
    b([11, 10, 10], [0, 5, 0], '#e8d9c0', kit.head);
    b([11.6, 4, 10.6], [0, 9.4, 0], c(look.dark), kit.head);
    eyes(kit, 5.4, 5.3, 2.6, 2, '#c0303a');
    b([3, 3, 3], [0, 13, 0], c(look.color, true), kit.head);
    weapon(kit, 'axe', 15);
    return top;
  },
  soldier: (kit) => {
    const { b, c, look } = kit;
    const top = biped(kit, { legW: 4, legH: 9, torso: [10, 10, 5.5], arm: [3.2, 10, 3.2], skin: '#ffe3cf', cloth: look.color, legs: '#2a2a33', boots: '#1a1a22' });
    b([10.4, 2, 5.9], [0, 10, 0], c(look.dark));
    b([10, 10, 10], [0, 5, 0], '#ffe3cf', kit.head);
    b([10.8, 4, 10.8], [0, 9, 0], c(look.dark), kit.head);
    eyes(kit, 5, 5.3, 2.2, 1.6, '#2a1a10');
    weapon(kit, look.variant === 'shooter' ? 'bow' : 'sword', 10);
    return top;
  },
};

function quadLegs(kit: Kit, s: number, color: string) {
  const legs: Array<[THREE.Group, Vec]> = [
    [kit.legRight, [6 * s, 7 * s, 4 * s]], [kit.legLeft, [6 * s, 7 * s, -4 * s]],
    [kit.armRight, [-7 * s, 7 * s, 4 * s]], [kit.armLeft, [-7 * s, 7 * s, -4 * s]],
  ];
  for (const [group, at] of legs) {
    group.position.set(...at);
    kit.b([4 * s, 7 * s, 4 * s], [0, -3.5 * s, 0], color, group);
    kit.b([5 * s, 1.6 * s, 5 * s], [0.8 * s, -6.6 * s, 0], shade(color, -0.2), group);
  }
}

export function buildEnemy(look: EnemyLook): BlockyRig {
  const kit = makeKit(look);
  const build = BUILDERS[look.shape] ?? BUILDERS.soldier;
  const headY = build(kit);
  return rig(kit, headY);
}
