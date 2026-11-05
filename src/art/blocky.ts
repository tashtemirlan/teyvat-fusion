// Блочные модели для рендера спрайтов: тело из коробок с пиксельными текстурами.
import * as THREE from 'three';
import type { Element, Weapon } from '../data/roster';
import type { BlockySpec, Build, HairStyle, Outfit } from './looks';

export interface BlockyRig {
  root: THREE.Group;
  head: THREE.Group;
  headY: number;
  armRight: THREE.Group;
  armLeft: THREE.Group;
  legRight: THREE.Group;
  legLeft: THREE.Group;
  orbit: THREE.Group;
  floating: THREE.Group;
  walks: boolean;
}

const ELEMENT_COLORS: Record<Element, string> = {
  pyro: '#ff6a3c', hydro: '#3fa7f0', anemo: '#5fe0bb', electro: '#b57bff', dendro: '#9bd63f', cryo: '#9fe6f5', geo: '#f0bd45',
};
export const INK = '#2a2140';
export const GOLD = '#e8c26a';
const TEXELS = 2;

const BODY: Record<Build, { legH: number; torsoW: number; torsoH: number; torsoD: number; armW: number; armH: number; legW: number }> = {
  female: { legH: 8, torsoW: 8.5, torsoH: 9, torsoD: 4.6, armW: 2.8, armH: 9, legW: 3.8 },
  male: { legH: 10, torsoW: 11, torsoH: 10, torsoD: 5.6, armW: 3.6, armH: 10, legW: 4.6 },
  child: { legH: 5, torsoW: 7.5, torsoH: 7, torsoD: 4.2, armW: 2.4, armH: 7, legW: 3.2 },
};

const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};
export const shade = (hex: string, amount: number) => (amount < 0 ? mix(hex, '#150f2b', -amount) : mix(hex, '#ffffff', amount));

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

// Детерминированный шум: один герой всегда выглядит одинаково.
const noise = (x: number, y: number) => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function texture(units: [number, number], paint: Painter) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(units[0] * TEXELS));
  canvas.height = Math.max(1, Math.round(units[1] * TEXELS));
  const ctx = canvas.getContext('2d')!;
  paint(ctx, canvas.width, canvas.height);
  const map = new THREE.CanvasTexture(canvas);
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.colorSpace = THREE.SRGBColorSpace;
  map.generateMipmaps = false;
  return map;
}

const px = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

function paintHair(ctx: CanvasRenderingContext2D, w: number, h: number, hair: [string, string], offset = 0, bottom?: (x: number) => number, sheen = false) {
  for (let x = 0; x < w; x++) {
    const strand = noise(x + offset, 3) * 0.18 - 0.09;
    const end = bottom ? bottom(x) : h;
    for (let y = 0; y < end; y++) {
      const t = (y + offset * 0.5) / (h + offset * 0.5);
      const step = Math.floor(t * 6 + BAYER[y % 4][x % 4] / 16) / 6;
      const band = sheen && Math.abs(y - h * 0.22 - Math.sin(x * 0.5)) < 1 ? 0.28 : 0;
      px(ctx, shade(mix(hair[0], hair[1], Math.min(1, step)), strand + band + (noise(x, y + offset) > 0.94 ? 0.12 : 0)), x, y);
    }
  }
}

function paintCloth(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      px(ctx, shade(color, Math.sin(x * 0.9 + noise(x, 1) * 2) * 0.06 - (y / h) * 0.18), x, y);
    }
  }
}

const hasAccessory = (spec: BlockySpec, kind: string) => spec.accessories.some((item) => item.split(':')[0] === kind);

function paintFace(ctx: CanvasRenderingContext2D, w: number, h: number, spec: BlockySpec) {
  ctx.fillStyle = spec.skin;
  ctx.fillRect(0, 0, w, h);
  px(ctx, shade(spec.skin, -0.14), 0, 0, w, 7);
  px(ctx, shade(spec.skin, -0.1), 0, h - 2, w, 2);
  const male = spec.build === 'male';
  const eye = (x: number, color: string, side: 1 | -1) => {
    if (male) {
      for (let i = 0; i < 7; i++) px(ctx, INK, x - 1 + i, 9 + (side === 1 ? (i > 3 ? 1 : 0) : i < 3 ? 1 : 0), 1, 2);
      px(ctx, INK, x, 12, 6, 1);
      px(ctx, '#ffffff', x, 13, 6, 4);
      px(ctx, shade(color, -0.25), x + 1, 13, 4, 2);
      px(ctx, color, x + 1, 15, 4, 2);
      px(ctx, INK, x + 2, 14, 2, 2);
      px(ctx, '#ffffff', x + 1, 13, 1, 1);
    } else if (hasAccessory(spec, 'closedEyes')) {
      px(ctx, INK, x - 1, 14, 1, 1);
      px(ctx, INK, x, 15, 6, 1);
      px(ctx, INK, x + 6, 14, 1, 1);
      for (let i = 0; i < 3; i++) px(ctx, INK, x + 1 + i * 2, 16, 1, 1);
    } else {
      px(ctx, INK, x - 1, 10, 8, 1);
      px(ctx, '#ffffff', x, 11, 6, 8);
      px(ctx, shade(color, -0.3), x, 11, 6, 3);
      px(ctx, color, x, 14, 6, 3);
      px(ctx, shade(color, 0.35), x, 17, 6, 2);
      px(ctx, INK, x + 2, 13, 3, 4);
      px(ctx, '#ffffff', x, 11, 3, 3);
      px(ctx, '#ffffff', x + 4, 16, 1, 1);
      px(ctx, INK, x - 1, 11, 1, 3);
      px(ctx, INK, x + 6, 12, 1, 2);
    }
  };
  const patched = hasAccessory(spec, 'eyepatch');
  eye(2, spec.eyes[0], 1);
  if (!patched) eye(16, spec.eyes[1], -1);
  if (male) {
    px(ctx, shade(spec.skin, -0.25), 12, 16, 1, 3);
    px(ctx, shade(spec.skin, -0.4), 9, 21, 5, 1);
    px(ctx, shade(spec.skin, -0.12), 0, 19, 2, 3);
    px(ctx, shade(spec.skin, -0.12), 22, 19, 2, 3);
  } else {
    px(ctx, '#ff9d9d', 1, 20, 3, 1);
    px(ctx, '#ff9d9d', 20, 20, 3, 1);
    px(ctx, shade(spec.skin, -0.35), 11, 21, 3, 1);
  }
  if (patched) {
    px(ctx, INK, 0, 8, w, 1);
    px(ctx, '#26324f', 15, 10, 8, 10);
    px(ctx, INK, 15, 10, 8, 1);
    px(ctx, INK, 15, 19, 8, 1);
    px(ctx, '#9fe6f5', 18, 13, 2, 4);
    px(ctx, '#9fe6f5', 17, 14, 4, 2);
  }
  if (hasAccessory(spec, 'glasses')) {
    for (const x of [1, 15]) {
      px(ctx, INK, x, 10, 8, 1);
      px(ctx, INK, x, 18, 8, 1);
      px(ctx, INK, x, 10, 1, 9);
      px(ctx, INK, x + 7, 10, 1, 9);
    }
    px(ctx, INK, 9, 13, 6, 1);
  }
}

function paintOutfitFront(ctx: CanvasRenderingContext2D, w: number, h: number, outfit: Outfit, spec: BlockySpec) {
  const center = Math.floor(w / 2);
  const { kind, main, second, trim } = outfit;
  paintCloth(ctx, w, h, main);
  const belt = (color = shade(main, -0.45)) => {
    px(ctx, color, 0, h - 7, w, 3);
    px(ctx, trim, center - 2, h - 7, 4, 3);
  };
  if (kind === 'coat') {
    for (let y = 0; y < 9; y++) {
      const open = Math.max(1, 5 - Math.floor(y / 2));
      px(ctx, y < 4 ? spec.skin : second, center - open, y, open * 2, 1);
      px(ctx, trim, center - open - 1, y, 1, 1);
      px(ctx, trim, center + open, y, 1, 1);
    }
    px(ctx, shade(main, 0.15), 2, 3, 3, 1);
    px(ctx, shade(main, 0.15), w - 5, 3, 3, 1);
    belt();
    px(ctx, trim, center, h - 4, 1, 4);
  } else if (kind === 'vest') {
    px(ctx, second, center - 4, 0, 8, 10);
    for (let y = 1; y < 9; y += 3) px(ctx, trim, center, y, 1, 2);
    px(ctx, shade(main, -0.3), center - 5, 0, 1, 10);
    px(ctx, shade(main, -0.3), center + 4, 0, 1, 10);
    px(ctx, trim, 0, 0, w, 1);
    belt('#5a3128');
    px(ctx, '#7a4a2a', w - 6, h - 5, 4, 4);
  } else if (kind === 'corset') {
    px(ctx, spec.skin, center - 3, 0, 6, 3);
    px(ctx, trim, center - 4, 3, 8, 1);
    px(ctx, second, center - 3, 4, 6, h - 8);
    for (let y = 5; y < h - 5; y += 2) {
      px(ctx, trim, center - 2, y, 1, 1);
      px(ctx, trim, center + 1, y, 1, 1);
    }
    px(ctx, trim, 0, h - 6, w, 2);
  } else if (kind === 'robe') {
    px(ctx, second, center - 3, 0, 6, h);
    px(ctx, trim, center - 4, 0, 1, h);
    px(ctx, trim, center + 3, 0, 1, h);
    for (let y = 3; y < h; y += 5) px(ctx, trim, center - 1, y, 2, 2);
    belt(shade(second, -0.3));
  } else if (kind === 'kimono') {
    for (let y = 0; y < 9; y++) {
      px(ctx, second, center - 4 + y, y, 2, 1);
      px(ctx, second, center + 3 - y, y, 2, 1);
    }
    px(ctx, second, 0, h - 8, w, 4);
    px(ctx, trim, 0, h - 8, w, 1);
    px(ctx, trim, center - 2, h - 7, 4, 2);
  } else if (kind === 'armor') {
    px(ctx, second, 1, 2, w - 2, 7);
    px(ctx, trim, 1, 2, w - 2, 1);
    px(ctx, trim, center - 1, 2, 2, 7);
    px(ctx, shade(second, 0.25), 3, 4, 3, 2);
    px(ctx, shade(second, 0.25), w - 6, 4, 3, 2);
    belt();
  } else if (kind === 'open') {
    // Распахнутая куртка на голом торсе.
    px(ctx, spec.skin, center - 4, 0, 8, h - 7);
    px(ctx, shade(spec.skin, -0.14), center, 3, 1, h - 10);
    px(ctx, shade(spec.skin, -0.14), center - 3, 6, 6, 1);
    px(ctx, trim, center - 5, 0, 1, h - 7);
    px(ctx, trim, center + 4, 0, 1, h - 7);
    belt(second);
  } else if (kind === 'gown') {
    px(ctx, spec.skin, center - 3, 0, 6, 2);
    px(ctx, second, center - 3, 2, 6, h - 6);
    px(ctx, trim, center - 4, 2, 1, h - 6);
    px(ctx, trim, center + 3, 2, 1, h - 6);
    px(ctx, trim, center - 3, 2, 6, 1);
    px(ctx, '#2c2a5a', center - 1, 4, 2, 4);
    px(ctx, trim, center - 1, 8, 2, 1);
  } else if (kind === 'tailcoat') {
    px(ctx, second, center - 3, 0, 6, h);
    px(ctx, '#15152a', center - 2, 0, 4, 4);
    px(ctx, '#5f9fff', center - 1, 2, 2, 2);
    for (let y = 6; y < h; y += 3) px(ctx, trim, center, y, 1, 2);
    px(ctx, shade(main, 0.2), center - 5, 0, 2, 9);
    px(ctx, shade(main, 0.2), center + 3, 0, 2, 9);
  } else if (kind === 'tunic') {
    px(ctx, second, center - 3, 0, 6, 4);
    px(ctx, trim, 0, 0, w, 1);
    px(ctx, shade(main, 0.15), 2, 5, 2, 4);
    px(ctx, shade(main, 0.15), w - 4, 5, 2, 4);
    belt('#5a3128');
  } else {
    px(ctx, second, center - 4, 0, 8, 3);
    px(ctx, trim, center - 4, 3, 8, 1);
    px(ctx, trim, center - 1, 3, 2, 2);
    px(ctx, second, 0, h - 6, w, 2);
  }
  spec.elements.forEach((element, index) => {
    const x = center - 1 + Math.round((index - (spec.elements.length - 1) / 2) * 4);
    px(ctx, '#ffffff', x - 1, h - 4, 4, 3);
    px(ctx, ELEMENT_COLORS[element], x, h - 4, 2, 2);
  });
}

const mat = (map: THREE.Texture) => new THREE.MeshLambertMaterial({ map, transparent: true, alphaTest: 0.5 });
export const solid = (color: string, glow = false) => (glow ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color }));

export function box(size: [number, number, number], at: [number, number, number], material: THREE.Material | THREE.Material[], parent: THREE.Object3D, tilt = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...at);
  mesh.rotation.z = tilt;
  parent.add(mesh);
  return mesh;
}

// Чёлка в пикселях текстуры шириной 26: глаза начинаются ниже девятой строки.
const FRINGES: Record<HairStyle, (x: number) => number> = {
  long: (x) => 6 + (x % 4) + (x < 3 || x > 22 ? 14 : 0),
  short: (x) => 3 + x * 0.22 + (x % 3) + (x < 2 ? 8 : 0),
  wavy: (x) => 7 + Math.sin(x * 0.7) * 2 + (x < 3 || x > 23 ? 12 : 0),
  twin: (x) => 6 + (x % 3) + (x < 2 || x > 23 ? 12 : 0),
  ponytail: (x) => 5 + (x % 4) + (x < 2 || x > 23 ? 10 : 0),
  bun: (x) => 6 + Math.abs(x - 13) * 0.2 + (x < 2 || x > 23 ? 8 : 0),
  bob: (x) => 7 + (x % 2) + (x < 3 || x > 22 ? 12 : 0),
  spiky: (x) => 3 + (x % 5) * 1.2 + (x < 2 ? 6 : 0),
  hime: (x) => (x < 3 || x > 22 ? 22 : 9),
  sidebang: (x) => (x < 10 ? 13 - x * 0.3 : 5 + (x % 3)) + (x > 23 ? 10 : 0),
};

const BACK_LENGTH: Record<HairStyle, number> = { hime: 22, sidebang: 8, long: 20, wavy: 15, twin: 8, ponytail: 7, bun: 7, bob: 10, short: 6, spiky: 6 };

function buildHairExtras(spec: BlockySpec, head: THREE.Group, hairMap: (units: [number, number], offset: number, bottom?: (x: number) => number, colors?: [string, string]) => THREE.Material) {
  // Пряди берут цвет второго родителя, чтобы смешение было заметно и в маленькой клетке.
  const lockOverride = spec.accessories.find((item) => item.startsWith('locks:'))?.split(':')[1];
  const lockBase = lockOverride ?? spec.hair[1];
  const lockColors: [string, string] = [lockBase, shade(lockBase, 0.15)];
  const style = spec.hairStyle;
  if (style === 'hime') {
    const lock = hairMap([2.4, 15], 6, undefined, lockColors);
    for (const dir of [-1, 1]) {
      box([2.4, 15, 3], [dir * 7.4, 1, 2.6], lock, head);
      // Белые крестики на прядях.
      box([3.4, 0.9, 3.4], [dir * 7.4, 3, 2.6], solid('#ffffff'), head, 0.7);
      box([3.4, 0.9, 3.4], [dir * 7.4, 3, 2.6], solid('#ffffff'), head, -0.7);
    }
  } else if (style === 'sidebang') {
    const lock = hairMap([2.4, 11], 6, undefined, lockColors);
    box([2.4, 11, 3], [-7.2, 4, 3], lock, head);
    box([2.4, 8, 3], [7.2, 6, 2], lock, head);
    box([3.4, 2.4, 3.4], [-7.4, -1.6, 3], solid(shade(spec.hair[0], -0.04)), head);
    box([3.4, 2.4, 3.4], [7.4, 1.4, 2], solid(shade(spec.hair[0], -0.04)), head);
  } else if (style === 'long' || style === 'wavy' || style === 'bob') {
    const lock = hairMap([2, 13], 6, undefined, lockColors);
    box([2, 13, 3], [-7.2, 2, 2], lock, head);
    box([2, 13, 3], [7.2, 2, 2], lock, head);
  } else if (style === 'short') {
    box([2, 15, 3], [-7.2, 1, 2.5], hairMap([2, 15], 6, undefined, lockColors), head);
  } else if (style === 'twin') {
    const tail = hairMap([4, 18], 6, undefined, lockColors);
    for (const dir of [-1, 1]) {
      box([4, 18, 4], [dir * 9.5, 0, -1], tail, head);
      box([3, 3, 3], [dir * 8, 10, -1], solid(GOLD), head);
    }
  } else if (style === 'ponytail') {
    box([5, 18, 4], [0, 1, -8.5], hairMap([5, 18], 6, undefined, lockColors), head);
    box([3, 3, 3], [0, 10, -7.5], solid(GOLD), head);
    box([2, 11, 3], [-7.2, 5, 2], hairMap([2, 11], 7), head);
  } else if (style === 'bun') {
    for (const dir of [-1, 1]) {
      box([6, 6, 6], [dir * 6.5, 13, -1], hairMap([6, 6], 6, undefined, lockColors), head);
      box([2, 1.6, 6.4], [dir * 6.5, 11, -1], solid(GOLD), head);
    }
  } else {
    const spike = solid(shade(spec.hair[0], 0.08));
    for (const [x, z, h] of [[-5, 3, 5], [0, 4, 6], [5, 3, 5], [-4, -3, 4], [4, -3, 4]]) box([3.6, h, 3.6], [x, 12 + h / 2, z], spike, head, x * 0.05);
    box([2, 11, 3], [-7.2, 4, 2], hairMap([2, 11], 7, undefined, lockColors), head);
  }
}

function buildAccessoriesHead(spec: BlockySpec, head: THREE.Group) {
  const hasHat = spec.accessories.some((item) => /^(witchHat|widehat|beret|hood|topHat)/.test(item));
  for (const item of spec.accessories) {
    const [kind, value] = item.split(':');
    const color = value ?? GOLD;
    const main = solid(color);
    const dim = solid(shade(color, -0.25));
    const bright = solid(shade(color, 0.3));
    if (kind === 'ribbon') {
      const bow = new THREE.Group();
      if (hasHat) {
        bow.position.set(-9, -1, 5);
        bow.scale.setScalar(0.6);
      }
      head.add(bow);
      for (const dir of [-1, 1]) {
        box([7, 7, 2], [dir * 6, 16.5, 0], main, bow, dir * -0.45);
        box([4, 3, 2.4], [dir * 7, 18, 0], bright, bow, dir * -0.45);
        box([3, 4, 2], [dir * 2.5, 14, 0], main, bow);
      }
      box([3, 3, 3], [0, 14, 0], solid('#ffcf5a'), bow);
    } else if (kind === 'bow') {
      for (const dir of [-1, 1]) box([3, 2.6, 1.6], [-7 + dir * 2.2, 11.5, 5], main, head, dir * -0.3);
      box([1.6, 1.6, 2], [-7, 11.5, 5], bright, head);
    } else if (kind === 'goggles') {
      box([13.6, 1.6, 13.6], [0, 11, 0], solid('#5a3128'), head);
      for (const x of [-3.2, 3.2]) {
        box([4.4, 3.4, 1.6], [x, 11, 7], solid('#b98a4a'), head);
        box([3, 2, 1], [x, 11, 7.6], solid('#7fd3ea', true), head);
      }
    } else if (kind === 'braid') {
      box([3, 8, 2.4], [2, 1, -8], solid(spec.hair[0]), head);
      box([2, 2, 2], [2, -4, -8], solid(GOLD), head);
    } else if (kind === 'witchHat') {
      box([22, 1.6, 22], [0, 13.6, 0], main, head);
      box([22.4, 0.5, 22.4], [0, 12.9, 0], solid(GOLD), head);
      box([13, 2, 13], [0, 15, 0], solid(GOLD), head);
      box([12, 4, 12], [0, 18, 0], dim, head);
      box([8, 4, 8], [1, 22, 0], main, head);
      box([4, 4, 4], [3, 25.5, 0], dim, head);
    } else if (kind === 'widehat') {
      box([20, 1.4, 20], [0, 13.4, 0], main, head);
      box([13, 2, 13], [0, 15, 0], solid(GOLD), head);
      box([12, 4, 12], [0, 18, 0], main, head);
      box([4, 2.4, 2], [5, 15.6, 6], bright, head);
    } else if (kind === 'beret') {
      box([15, 2.4, 15], [1, 14, 0], main, head);
      box([11, 2, 11], [2, 16, 0], dim, head);
      box([3, 3, 3], [6, 13.6, 6.4], bright, head);
    } else if (kind === 'hood') {
      box([14.6, 14.6, 14.6], [0, 7, -0.6], [dim, dim, main, main, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), dim], head);
    } else if (kind === 'veil') {
      box([15, 1.6, 15], [0, 13.6, 0], main, head);
      box([15, 20, 1], [0, 3, -7.4], solid(color), head);
    } else if (kind === 'tiara' || kind === 'crown') {
      box([12, 1.4, 1], [0, 12.2, 6.8], main, head);
      for (const x of [-4, 0, 4]) box([1.6, x === 0 ? 3.4 : 2.4, 1], [x, 13.8, 6.8], bright, head);
    } else if (kind === 'halo') {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        box([2, 1, 2], [Math.cos(a) * 8, 17, Math.sin(a) * 8], solid(color, true), head);
      }
    } else if (kind === 'horns') {
      for (const dir of [-1, 1]) {
        box([2.4, 4.6, 2.4], [dir * 4.8, 15, 1], main, head, dir * -0.35);
        box([1.6, 3, 1.6], [dir * 6, 18, 1], bright, head, dir * -0.55);
      }
    } else if (kind === 'ears' || kind === 'foxears' || kind === 'wolfears') {
      const size: [number, number, number] = kind === 'foxears' ? [3.6, 7, 2] : kind === 'wolfears' ? [3.6, 5.6, 2] : [3.2, 4, 2];
      for (const dir of [-1, 1]) {
        box(size, [dir * 4.8, 13 + size[1] / 2 - 0.5, 0], main, head);
        box([1.8, size[1] - 2, 2.2], [dir * 4.8, 13 + size[1] / 2 - 1, 0.1], solid('#ffc0c8'), head);
      }
    } else if (kind === 'antlers') {
      for (const dir of [-1, 1]) {
        box([1.6, 8, 1.6], [dir * 5, 16.4, 0], main, head, dir * -0.3);
        box([3.6, 1.4, 1.4], [dir * 7.4, 17, 0], main, head);
        box([1.4, 3, 1.4], [dir * 8.6, 19.4, 0], main, head);
      }
    } else if (kind === 'headband') {
      box([13.6, 1.8, 13.6], [0, 10.6, 0], main, head);
      box([3, 2.4, 1], [0, 10.6, 7], solid(GOLD), head);
    } else if (kind === 'hairclip') {
      box([3, 3, 1.4], [6, 10.6, 6.6], main, head);
      box([1.4, 1.4, 1.8], [6, 10.6, 6.8], bright, head);
    } else if (kind === 'flower') {
      box([3.8, 3.8, 3.8], [6.6, 12, 5], main, head);
      box([2, 2, 4.2], [6.6, 12, 5], solid('#fff1b8'), head);
      box([2.4, 1, 3], [8.8, 10.6, 5], solid('#4f8f55'), head);
    } else if (kind === 'feather') {
      box([1.6, 7, 1], [7, 15, 3], main, head, -0.4);
      box([1, 4, 1.2], [8, 17.4, 3], bright, head, -0.4);
    } else if (kind === 'shako') {
      box([12, 6, 12], [1, 16, 0], main, head);
      box([13, 1.4, 13], [1, 13.2, 0], solid(GOLD), head);
      box([8, 1.2, 2], [1, 13, 7], dim, head);
      box([2.4, 3, 1], [1, 16, 6.3], solid(GOLD), head);
    } else if (kind === 'anubis') {
      box([13.4, 3, 13.4], [0, 12.6, 0], main, head);
      for (const dir of [-1, 1]) {
        box([3.6, 8, 2.4], [dir * 5, 18, 0], main, head, dir * -0.12);
        box([1.8, 4, 2.6], [dir * 5, 18, 0.1], bright, head, dir * -0.12);
      }
      box([2, 2, 1], [0, 11, 7], solid(GOLD), head);
    } else if (kind === 'chefHat') {
      box([12, 2, 12], [0, 13, 0], main, head);
      box([15, 7, 15], [0, 17, 0], main, head);
    } else if (kind === 'nurseCap') {
      box([13, 3.4, 13], [0, 13.4, 0], main, head);
      box([13.2, 0.9, 13.2], [0, 12.6, 0], solid('#e0405a'), head);
      box([3, 0.9, 0.6], [0, 13.8, 6.8], solid('#e0405a'), head);
      box([0.9, 3, 0.6], [0, 13.8, 6.8], solid('#e0405a'), head);
      for (const dir of [-1, 1]) box([2.6, 8, 1.8], [dir * 4.6, 18, 0], solid('#a8d0f0'), head, dir * -0.18);
    } else if (kind === 'operaCrown') {
      box([14, 2, 14], [0, 13, 0], main, head);
      for (const x of [-5, -2.5, 0, 2.5, 5]) box([1.6, 5, 1.6], [x, 16, 6], bright, head);
      for (const dir of [-1, 1]) box([3.6, 3.6, 3.6], [dir * 7.4, 12, 3], solid('#f090a8'), head);
    } else if (kind === 'goldBuns') {
      for (const dir of [-1, 1]) box([2.4, 2.4, 2.4], [dir * 8.4, 15, 0], main, head);
    } else if (kind === 'talisman') {
      box([5, 8, 0.6], [0, 11, 6.9], main, head);
      for (const y of [13.4, 11.6, 9.8]) box([3, 0.7, 0.3], [0, y, 7.2], solid('#7a2f2a'), head);
    } else if (kind === 'faceMask') {
      box([12.4, 5, 0.6], [0, 2.4, 6.2], main, head);
    } else if (kind === 'headWings') {
      for (const dir of [-1, 1]) {
        box([1.4, 7.6, 2.6], [dir * 7.4, 13, 0], main, head, dir * -0.75);
        box([1.4, 5.4, 2.2], [dir * 9, 10, 0], main, head, dir * -1.15);
        box([1.2, 3.6, 2], [dir * 5.6, 15, 0], bright, head, dir * -0.45);
      }
    } else if (kind === 'ahoge') {
      // Завиток-полумесяц над головой.
      box([1.2, 3.6, 1.2], [-3.4, 14.4, 2], main, head, 0.2);
      box([3.2, 1.2, 1.2], [-2.2, 16.4, 2], main, head);
      box([1.2, 2.2, 1.2], [-0.4, 15.4, 2], main, head);
    } else if (kind === 'topHat') {
      const hat = new THREE.Group();
      hat.position.set(3, 13, 0);
      hat.rotation.z = -0.22;
      head.add(hat);
      box([11, 1.2, 11], [0, 0.6, 0], main, hat);
      box([7.4, 5, 7.4], [0, 3.6, 0], main, hat);
      box([7.8, 1.2, 7.8], [0, 1.8, 0], solid('#5f9fff'), hat);
      for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3], [0, 3.4], [0, -3.4]]) box([1.2, 2.6, 1.2], [x, 7, z], solid(GOLD), hat);
      box([7.6, 0.8, 7.6], [0, 6.2, 0], solid(GOLD), hat);
      box([1, 4.4, 2], [-4.4, 5, 3], solid('#f2f5fb'), hat, 0.4);
    } else if (kind === 'elfEars') {
      for (const dir of [-1, 1]) {
        box([3.6, 1.6, 1.4], [dir * 7.8, 6.4, 1], solid(spec.skin), head, dir * 0.3);
        box([2, 1, 1], [dir * 10, 7.2, 1], solid(spec.skin), head, dir * 0.3);
      }
    } else if (kind === 'iceCrown') {
      box([11, 1.4, 11], [0, 13.2, 0], main, head);
      for (const [x, z, h] of [[0, 5, 7], [-3.6, 4.4, 5], [3.6, 4.4, 5], [-5.2, 0.8, 4], [5.2, 0.8, 4], [0, -5, 5], [-3.6, -4, 4], [3.6, -4, 4]]) {
        box([1.8, h, 1.4], [x, 13.6 + h / 2, z], bright, head);
      }
      box([1.8, 1.8, 1.8], [0, 15.4, 5.8], solid('#ffffff', true), head);
    } else if (kind === 'skullMask') {
      // Череп зверя сдвинут на макушку, рожки торчат вверх.
      box([10, 6, 8], [0, 15, 2], main, head);
      for (const x of [-2.4, 2.4]) box([2, 1.6, 0.6], [x, 15, 6.2], solid(INK), head);
      for (const dir of [-1, 1]) box([1.8, 6, 1.8], [dir * 4, 20, 0], solid(INK), head, dir * -0.3);
    } else if (kind === 'mask' || kind === 'hairMask') {
      box([5, 5, 1.6], [7, 11, 4], main, head, -0.3);
      box([1.4, 1, 1.8], [6.4, 12, 4.3], solid(INK), head);
      box([1.4, 1, 1.8], [8.2, 11.4, 4.3], solid(INK), head);
    }
  }
}

function buildHead(spec: BlockySpec) {
  const head = new THREE.Group();
  const skinSide = solid(shade(spec.skin, -0.05));
  const faceMap = texture([12, 12], (ctx, w, h) => paintFace(ctx, w, h, spec));
  box([12, 12, 12], [0, 6, 0], [skinSide, skinSide, skinSide, skinSide, mat(faceMap), skinSide], head);

  const hairMap = (units: [number, number], offset: number, bottom?: (x: number) => number, colors = spec.hair) =>
    mat(texture(units, (ctx, w, h) => paintHair(ctx, w, h, colors, offset, bottom)));
  const front = mat(texture([13, 13], (ctx, w, h) => paintHair(ctx, w, h, spec.hair, 0, FRINGES[spec.hairStyle], true)));
  const side = hairMap([13, 13], 1, (x) => (x > 18 ? 15 : spec.hairStyle === 'long' || spec.hairStyle === 'wavy' ? 26 : 18));
  const top = hairMap([13, 13], 2);
  box([13, 13, 13], [0, 6.2, 0], [side, side, top, top, front, hairMap([13, 13], 3)], head);

  const length = BACK_LENGTH[spec.hairStyle];
  const zigzag = (x: number) => length * TEXELS - (x % 6 < 3 ? 2 : 0) - (spec.hairStyle === 'wavy' ? Math.abs(Math.sin(x * 0.5)) * 4 : 0);
  const plate = hairMap([13, length], 4, zigzag);
  const plateSide = hairMap([3, length], 5);
  box([13, length, 3], [0, 6.5 - length / 2, -6], [plateSide, plateSide, plateSide, plateSide, plate, plate], head);

  buildHairExtras(spec, head, hairMap);
  buildAccessoriesHead(spec, head);

  if (spec.tier >= 3) {
    const hasHat = spec.accessories.some((item) => /^(witchHat|widehat)/.test(item));
    const gold = solid('#ffe27a', true);
    const width = hasHat ? 13.4 : 9;
    const y = hasHat ? 20 : spec.accessories.some((item) => item.startsWith('ribbon')) ? 21 : 13.8;
    box([width, 1.6, width], [0, y, 0], gold, head);
    const edge = width / 2 - 0.8;
    for (const [x, z] of [[-edge, -edge], [edge, -edge], [-edge, edge], [edge, edge], [0, edge], [0, -edge]]) box([1.6, 2.6, 1.6], [x, y + 2, z], gold, head);
    box([1.8, 1.8, 1], [0, y + 0.4, edge + 1], solid(ELEMENT_COLORS[spec.elements[0] ?? 'geo'], true), head);
  }
  return head;
}

function buildTorso(spec: BlockySpec, root: THREE.Group) {
  const body = BODY[spec.build];
  const [w, h, d] = [body.torsoW, body.torsoH, body.torsoD];
  const y = body.legH + h / 2;
  const [left, right] = spec.outfits;
  const front = mat(texture([w, h], (ctx, tw, th) => {
    const half = Math.floor(tw / 2);
    for (const [outfit, x, width] of [[left, 0, half], [right, half, tw - half]] as const) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, 0, width, th);
      ctx.clip();
      paintOutfitFront(ctx, tw, th, outfit, spec);
      ctx.restore();
    }
  }));
  const sideOf = (color: string) => mat(texture([d, h], (ctx, tw, th) => {
    paintCloth(ctx, tw, th, color);
    px(ctx, shade(color, -0.35), 0, th - 7, tw, 3);
  }));
  const [sideA, sideB] = [sideOf(right.main), sideOf(left.main)];
  const back = mat(texture([w, h], (ctx, tw, th) => {
    paintCloth(ctx, tw, th, left.main);
    px(ctx, shade(left.main, -0.3), Math.floor(tw / 2), 0, 1, th);
  }));
  box([w, h, d], [0, y, 0], [sideA, sideB, solid(left.main), solid(left.main), front, back], root);

  const hemY = body.legH - 0.5;
  const trousers = spec.build === 'male' || left.kind === 'armor' && spec.build !== 'female';
  const longSkirt = spec.accessories.find((item) => item.startsWith('longSkirt:'))?.split(':')[1];
  if (longSkirt) {
    const length = body.legH + 1;
    const cloth = mat(texture([w + 3, length], (ctx, tw, th) => {
      paintCloth(ctx, tw, th, longSkirt);
      for (let x = 0; x < tw; x += 4) px(ctx, shade(longSkirt, -0.18), x, 0, 1, th);
      px(ctx, right.trim, 0, th - 2, tw, 1);
    }));
    box([w + 3, length, d + 3], [0, body.legH + 1 - length / 2, 0], cloth, root);
  } else if (hasAccessory(spec, 'openGown') || hasAccessory(spec, 'shorts')) {
    // Эти наряды показывают ноги, обычная юбка здесь не нужна.
  } else if (trousers) {
    const tail = (color: string, trim: string) => mat(texture([w / 2 - 0.9, 6], (ctx, tw, th) => {
      paintCloth(ctx, tw, th, color);
      px(ctx, trim, 0, th - 1, tw, 1);
      px(ctx, trim, tw - 1, 0, 1, th);
    }));
    box([w / 2 - 0.9, 6, 0.8], [-w / 4 - 0.2, hemY - 0.5, d / 2 + 0.4], tail(left.main, left.trim), root);
    box([w / 2 - 0.9, 6, 0.8], [w / 4 + 0.2, hemY - 0.5, d / 2 + 0.4], tail(right.main, right.trim), root);
    box([w, 7, 0.8], [0, hemY - 1, -d / 2 - 0.4], tail(left.main, left.trim), root);
  } else {
    const skirtW = w + 2.5;
    const skirt = mat(texture([skirtW, 4], (ctx, tw, th) => {
      const half = Math.floor(tw / 2);
      for (let x = 0; x < tw; x++) for (let row = 0; row < th; row++) px(ctx, shade(x < half ? left.main : right.main, x % 3 === 0 ? -0.28 : -0.05), x, row);
      px(ctx, right.trim, 0, th - 2, tw, 1);
      px(ctx, left.second, 0, th - 1, tw, 1);
    }));
    box([skirtW, 4, d + 2.4], [0, hemY, 0], skirt, root);
  }

  const shoulderY = body.legH + h;
  for (const item of spec.accessories) {
    const [kind, value] = item.split(':');
    const color = value ?? GOLD;
    if (kind === 'collar') {
      const fur = mat(texture([w + 3, 3], (ctx, tw, th) => {
        for (let x = 0; x < tw; x++) for (let row = 0; row < th - (x % 3 === 0 ? 0 : 1); row++) px(ctx, shade(color, noise(x, row) > 0.6 ? -0.12 : 0), x, row);
      }));
      // Воротник лежит ниже подбородка, иначе спереди он похож на бороду.
      box([w + 3, 2.4, d + 1.6], [0, shoulderY - 2.4, 0], fur, root);
    } else if (kind === 'scarf') {
      box([w + 1, 2.4, d + 1.4], [0, shoulderY - 1.4, 0], solid(color), root);
      box([2.6, 7, 1], [2.4, shoulderY - 6, d / 2 + 0.9], solid(shade(color, -0.12)), root);
    } else if (kind === 'cape') {
      const cloak = mat(texture([w + 2, h + body.legH - 2], (ctx, tw, th) => {
        paintCloth(ctx, tw, th, color);
        px(ctx, left.trim, 0, th - 2, tw, 1);
      }));
      box([w + 2, h + body.legH - 2, 1], [0, shoulderY - (h + body.legH - 2) / 2, -d / 2 - 1], cloak, root);
      box([w + 1.4, 1.2, d + 1.2], [0, shoulderY - 0.6, 0], solid(left.trim), root);
    } else if (kind === 'wings') {
      for (const dir of [-1, 1]) {
        box([9, 3, 1], [dir * 8, shoulderY, -d / 2 - 1], solid(color), root, dir * 0.35);
        box([7, 3, 1], [dir * 7, shoulderY - 3, -d / 2 - 1], solid(shade(color, 0.15)), root, dir * 0.35);
        box([5, 3, 1], [dir * 6, shoulderY - 6, -d / 2 - 1], solid(color), root, dir * 0.35);
      }
    } else if (kind === 'tail') {
      box([2.6, 2.6, 7], [0, body.legH + 2, -d / 2 - 3.5], solid(color), root);
      box([3.4, 3.4, 3.4], [0, body.legH + 3.6, -d / 2 - 7.4], solid(shade(color, 0.2)), root);
    } else if (kind === 'openGown') {
      // Пышная юбка открыта спереди: панели свисают по бокам почти до щиколоток, изнанка цвета отделки.
      const panelH = body.legH + 3;
      const lining = solid(left.second);
      const panel = mat(texture([w / 2 - 0.6, panelH], (ctx, tw, th) => {
        paintCloth(ctx, tw, th, color);
        for (let x = 0; x < tw; x += 3) px(ctx, shade(color, -0.16), x, 0, 1, th);
        px(ctx, left.second, 0, th - 2, tw, 2);
      }));
      for (const dir of [-1, 1]) {
        box([w / 2 - 0.6, panelH, 1.2], [dir * (w / 4 + 2.6), body.legH + 1 - panelH / 2 + 2, d / 2 + 1.1], panel, root);
        box([1.4, panelH, d + 3], [dir * (w / 2 + 2.3), body.legH + 1 - panelH / 2 + 2, 0], lining, root);
      }
      box([w + 4, panelH + 2, 1.2], [0, body.legH + 2 - panelH / 2, -d / 2 - 1.2], panel, root);
      box([w + 1, 1.4, d + 1.2], [0, body.legH + 1.4, 0], solid(left.second), root);
      // Короткая нижняя юбка видна в разрезе.
      box([w - 1, 2.6, d + 0.4], [0, body.legH + 0.2, 0], solid(shade(color, 0.1)), root);
    } else if (kind === 'gownTips') {
      for (const dir of [-1, 1]) box([4, 3, 1.4], [dir * (w / 4 + 2), 1.4, d / 2 + 1.2], solid(color), root);
      box([w + 4, 2.4, 1.4], [0, 0.8, -d / 2 - 1.2], solid(color), root);
    } else if (kind === 'snowflakes') {
      for (const [x, yy] of [[-w / 4 - 1.8, 6], [w / 4 + 1.8, 4]]) {
        box([2, 0.7, 0.4], [x, yy, d / 2 + 1.9], solid(color, true), root);
        box([0.7, 2, 0.4], [x, yy, d / 2 + 1.9], solid(color, true), root);
      }
    } else if (kind === 'tailcoatBack') {
      // Длинные фалды фрака: тёмная спина и белая вставка сбоку.
      const tail = mat(texture([w, h + body.legH + 3], (ctx, tw, th) => {
        paintCloth(ctx, tw, th, color);
        px(ctx, GOLD, 0, th - 2, tw, 1);
      }));
      box([w, h + body.legH + 3, 0.8], [0, shoulderY - (h + body.legH + 3) / 2, -d / 2 - 0.5], tail, root);
      box([3.4, body.legH + 2, 0.8], [w / 2 - 1, body.legH / 2 + 1, -d / 2 - 1], solid('#eef0f6'), root);
      box([1.4, body.legH, d], [w / 2 + 0.4, body.legH / 2 + 2, -0.4], solid(shade(color, 0.12)), root);
    } else if (kind === 'sash') {
      // Широкая лента с большим камнем и бантом на талии.
      box([w + 0.5, 1.8, d + 0.4], [0, body.legH + 2.2, 0], solid(color), root);
      box([3, 3, 1], [0.6, body.legH + 2.2, d / 2 + 0.5], solid('#3fa7f0', true), root);
      box([1.4, 1.4, 1.2], [0.6, body.legH + 2.2, d / 2 + 0.6], solid('#ffffff'), root);
      box([3, 2.2, 0.8], [-2.6, body.legH + 2.6, d / 2 + 0.4], solid(shade(color, 0.2)), root, 0.3);
      box([3, 2.2, 0.8], [3.8, body.legH + 2.6, d / 2 + 0.4], solid(shade(color, 0.2)), root, -0.3);
      box([1.2, 4, 0.6], [-1.4, body.legH - 0.4, d / 2 + 0.4], solid(GOLD), root);
    } else if (kind === 'shorts') {
      box([w + 0.2, 3, d + 0.2], [0, body.legH - 0.2, 0], solid(color), root);
    } else if (kind === 'backpack') {
      box([w - 1, h - 2, 3], [0, y, -d / 2 - 1.6], solid(color), root);
      box([w - 3, 2, 3.4], [0, y - 1, -d / 2 - 1.6], solid(shade(color, 0.3)), root);
    }
  }
}

function buildArm(outfit: Outfit, spec: BlockySpec, pivot: [number, number, number], root: THREE.Group, isRight: boolean) {
  const body = BODY[spec.build];
  const group = new THREE.Group();
  group.position.set(...pivot);
  root.add(group);
  const mismatched = hasAccessory(spec, 'mismatchedGloves');
  const glove = mismatched ? (isRight ? '#15152a' : '#f2f2f6') : shade(outfit.second, -0.35);
  const paint: Painter = (ctx, w, h) => {
    paintCloth(ctx, w, h, outfit.main);
    px(ctx, outfit.trim, 0, Math.floor(h * 0.55), w, 2);
    px(ctx, glove, 0, Math.floor(h * 0.55) + 2, w, h);
    px(ctx, shade(glove, 0.2), 1, h - 3, 1, 2);
  };
  const side = mat(texture([body.armW, body.armH], paint));
  box([body.armW, body.armH, body.armW], [0, -body.armH / 2, 0], [side, side, solid(outfit.main), solid(glove), side, side], group);
  if (outfit.kind === 'armor' || outfit.kind === 'coat') box([body.armW + 0.8, 2, body.armW + 0.8], [0, -0.4, 0], solid(outfit.trim), group);
  const sleeve = spec.accessories.find((item) => item.startsWith('wideSleeves:'))?.split(':')[1];
  if (sleeve) {
    box([body.armW + 2, body.armH * 0.6, body.armW + 2], [0, -body.armH * 0.32, 0], solid(sleeve), group);
    box([body.armW + 2.4, 1, body.armW + 2.4], [0, -body.armH * 0.6, 0], solid(outfit.second), group);
  }
  if (mismatched) box([body.armW + 1, 1.6, body.armW + 1], [0, -body.armH * 0.56, 0], solid(GOLD), group);
  return group;
}

function buildLeg(outfit: Outfit, spec: BlockySpec, pivot: [number, number, number], root: THREE.Group) {
  const body = BODY[spec.build];
  const group = new THREE.Group();
  group.position.set(...pivot);
  root.add(group);
  const paint: Painter = (ctx, w, h) => {
    paintCloth(ctx, w, h, outfit.thigh);
    const top = Math.floor(h * (hasAccessory(spec, 'lowBoots') ? 0.68 : 0.35));
    px(ctx, outfit.trim, 0, top, w, 2);
    for (let y = top + 2; y < h; y++) px(ctx, shade(outfit.boot, -(y - top) * 0.012), 0, y, w, 1);
    px(ctx, outfit.trim, Math.floor(w / 2) - 1, top + 5, 2, 2);
    px(ctx, shade(outfit.boot, 0.25), 1, top + 3, 1, Math.max(1, h - top - 5));
  };
  const side = mat(texture([body.legW, body.legH], paint));
  box([body.legW, body.legH, body.legW], [0, -body.legH / 2, 0], [side, side, solid(outfit.thigh), solid(outfit.boot), side, side], group);
  box([body.legW + 0.4, 1.6, body.legW + 1.6], [0, -body.legH + 0.8, 0.5], solid(shade(outfit.boot, -0.15)), group);
  const anklet = spec.accessories.find((item) => item.startsWith('anklet:'))?.split(':')[1];
  if (anklet) box([body.legW + 0.8, 0.9, body.legW + 0.8], [0, -body.legH + 2.2, 0], solid(anklet, true), group);
  if (hasAccessory(spec, 'frillSocks')) box([body.legW + 0.8, 1.6, body.legW + 0.8], [0, -body.legH * 0.68, 0], solid('#f6f8fc'), group);
  if (hasAccessory(spec, 'thighStrap') && pivot[0] > 0) box([body.legW + 0.5, 0.7, body.legW + 0.5], [0, -1.6, 0], solid('#3a2118'), group);
  return group;
}

function buildWeapon(weapon: Weapon, element: Element, parent: THREE.Object3D) {
  const glow = solid(ELEMENT_COLORS[element], true);
  const wood = solid('#a5683c');
  const steel = solid('#d8e4f0');
  const dark = solid('#3a2f50');
  const gold = solid(GOLD);
  if (weapon === 'bow') {
    const arc: Array<[number, number]> = [[-11, 0], [-8, 2.5], [-5, 4], [-2, 5], [2, 5], [5, 4], [8, 2.5], [11, 0]];
    for (const [y, z] of arc) box([1.6, 3.4, 1.6], [0, y, z], wood, parent);
    box([2, 3, 2], [0, 0, 5], glow, parent);
    box([2, 1.4, 2], [0, 11.6, 0], gold, parent);
    box([2, 1.4, 2], [0, -11.6, 0], gold, parent);
    box([0.5, 22, 0.5], [0, 0, 0], solid('#fff4d6', true), parent);
    box([0.8, 0.8, 12], [0, 0, 7], solid('#fff4d6', true), parent);
    box([1.6, 1.6, 2.4], [0, 0, 14], glow, parent);
  } else if (weapon === 'sword') {
    box([1.6, 16, 3], [0, 11, 0], steel, parent);
    box([1.8, 6, 1], [0, 13, 0], glow, parent);
    box([1.2, 3, 1.6], [0, 20, 0], steel, parent);
    box([2.2, 1.8, 7], [0, 2.6, 0], gold, parent);
    box([2.2, 2.4, 2], [0, 2.6, 0], glow, parent);
    box([1.6, 3, 1.6], [0, 0.4, 0], dark, parent);
  } else if (weapon === 'catalyst') {
    // Книга парит сбоку от руки и не закрывает лицо.
    box([6, 7.4, 2], [4.6, 0, 3], dark, parent);
    box([5, 6.4, 2.4], [4.6, 0, 3], glow, parent);
    box([6.3, 0.8, 2.4], [4.6, 0, 3], gold, parent);
    box([0.8, 7.4, 2.4], [1.8, 0, 3], gold, parent);
    box([1.6, 1.6, 1.6], [4.6, 5.4, 3], solid('#ffffff', true), parent);
  } else if (weapon === 'claymore') {
    box([2, 22, 5], [0, 14, 0], steel, parent);
    box([2.2, 10, 1.6], [0, 15, 0], glow, parent);
    box([2.4, 2, 10], [0, 3, 0], gold, parent);
    box([1.8, 3, 1.8], [0, 1, 0], dark, parent);
  } else {
    box([1.4, 30, 1.4], [0, 10, 0], wood, parent);
    box([1.8, 7, 3], [0, 28, 0], glow, parent);
    box([2, 1.6, 4], [0, 24, 0], gold, parent);
  }
}

export function buildBlocky(spec: BlockySpec): BlockyRig {
  const body = BODY[spec.build];
  const root = new THREE.Group();
  buildTorso(spec, root);
  const headY = body.legH + body.torsoH;
  const head = new THREE.Group();
  head.position.set(0, headY, 0);
  head.add(buildHead(spec));
  root.add(head);

  const shoulderX = body.torsoW / 2 + body.armW / 2;
  const armRight = buildArm(spec.outfits[1], spec, [shoulderX, headY, 0], root, true);
  const armLeft = buildArm(spec.outfits[0], spec, [-shoulderX, headY, 0], root, false);
  const legX = body.torsoW / 2 - body.legW / 2 - 0.1;
  const legRight = buildLeg(spec.outfits[1], spec, [legX, body.legH, 0], root);
  const legLeft = buildLeg(spec.outfits[0], spec, [-legX, body.legH, 0], root);

  if (spec.weapons[0]) {
    const held = new THREE.Group();
    held.position.set(0, -body.armH + 1, 1.5);
    held.scale.setScalar(spec.weaponScale ?? 1);
    armRight.add(held);
    buildWeapon(spec.weapons[0], spec.elements[0], held);
  }
  const floating = new THREE.Group();
  floating.position.set(-13, 12, 0);
  root.add(floating);
  spec.weapons.slice(1, 4).forEach((weapon, index) => {
    const slot = new THREE.Group();
    slot.position.set(-index * 3, index * 3, -index * 3);
    slot.scale.setScalar(0.72);
    floating.add(slot);
    buildWeapon(weapon, spec.elements[(index + 1) % spec.elements.length], slot);
  });

  const backZ = -body.torsoD / 2 - 2;
  const topY = headY + 13;
  for (const item of spec.accessories) {
    const [kind, value] = item.split(':');
    const color = value ?? GOLD;
    if (kind === 'ascPlates') {
      for (const dir of [-1, 1]) {
        box([body.armW + 2.4, 3, body.armW + 2.4], [dir * shoulderX, headY + 0.6, 0], solid(shade(color, -0.2)), root);
        box([body.armW + 2.8, 1, body.armW + 2.8], [dir * shoulderX, headY - 0.8, 0], solid(color, true), root);
        box([1.4, 4, 1.4], [dir * (shoulderX + 1.2), headY + 3.4, 0], solid(color, true), root, dir * -0.5);
      }
    } else if (kind === 'ascWings' || kind === 'godWings') {
      const big = kind === 'godWings';
      const feathers = big ? 6 : 4;
      for (const dir of [-1, 1]) {
        for (let i = 0; i < feathers; i++) {
          const length = (big ? 15 : 11) - i * 1.2;
          const height = headY + 8 - i * (big ? 4 : 3.2);
          box([length, 2.4, 1], [dir * (6 + length / 2 - i * 0.3), height, backZ], solid(i % 2 ? shade(color, 0.35) : color, true), root, dir * (0.5 - i * 0.14));
        }
      }
    } else if (kind === 'moonOrb') {
      // Полумесяц за головой.
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * (0.15 + (i / 10) * 1.3);
        box([2.2, 2.2, 1], [Math.cos(a) * 11, topY - 4 + Math.sin(a) * 11, backZ - 2], solid(i % 2 ? color : '#ffffff', true), root);
      }
    } else if (kind === 'waterHalo') {
      for (let i = 0; i < 8; i++) {
        const dir = i % 2 ? 1 : -1;
        box([1.6, 5 - (i % 3), 1.6], [dir * (12 + (i % 4)), headY + 8 - i * 3.2, backZ], solid(i % 3 ? color : '#c8ecff', true), root);
      }
    } else if (kind === 'iceShards') {
      for (const [x, y, h] of [[-14, 8, 8], [14, 8, 8], [-17, 16, 6], [17, 16, 6], [-13, 26, 7], [13, 26, 7]]) {
        box([2.2, h, 2.2], [x, y, backZ], solid(color, true), root, x * 0.015);
      }
    } else if (kind === 'weaponRing') {
      const ring = new THREE.Group();
      ring.position.set(0, topY - 12, 0);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        box([1.4, 7, 1.4], [Math.cos(a) * 16, Math.sin(i * 2) * 2, Math.sin(a) * 16], solid(color, true), ring, 0.4);
      }
      root.add(ring);
    }
  }

  const orbit = new THREE.Group();
  root.add(orbit);
  if (spec.tier >= 2 && spec.elements.length) {
    const count = Math.min(spec.tier, 6) * 4;
    for (let i = 0; i < count; i++) {
      const color = ELEMENT_COLORS[spec.elements[i % spec.elements.length]];
      const angle = (i / count) * Math.PI * 2;
      const size = i % 2 ? 1.2 : 1.8;
      box([size, size, size], [Math.cos(angle) * 17, 3 + (i % 3) * 9, Math.sin(angle) * 17], solid(color, true), orbit);
    }
  }
  return { root, head, headY, armRight, armLeft, legRight, legLeft, orbit, floating, walks: false };
}

export const SPRITE_FRAMES = 8;

// Кадры 0–3: покой или шаг, 4–7: удар.
export function poseFrame(rig: BlockyRig, frame: number) {
  const idlePhase = (frame % 4) * (Math.PI / 2);
  const swing = Math.sin(idlePhase);
  rig.head.position.y = rig.headY + (rig.walks ? 0 : swing * 0.25);
  rig.head.rotation.set(rig.walks ? 0 : swing * 0.03, 0, 0);
  if (rig.walks) {
    rig.legRight.rotation.x = swing * 0.5;
    rig.legLeft.rotation.x = -swing * 0.5;
    rig.armRight.rotation.x = -swing * 0.4;
    rig.armLeft.rotation.x = swing * 0.4;
    rig.root.position.y = Math.abs(swing) * 0.5;
  } else {
    rig.legRight.rotation.x = 0;
    rig.legLeft.rotation.x = 0;
    rig.armLeft.rotation.set(swing * 0.1, 0, -0.1);
    rig.armRight.rotation.set(-0.25 + swing * 0.06, 0, 0.08);
  }
  if (frame >= 4) {
    const step = frame - 4;
    rig.armRight.rotation.x = [-1.9, -2.3, -0.6, 0.45][step];
    rig.head.rotation.y = rig.walks ? 0 : 0.1;
    rig.legRight.rotation.x = -0.25;
    rig.legLeft.rotation.x = 0.25;
    if (rig.walks) rig.armLeft.rotation.x = [-1.1, -1.4, -0.4, 0.3][step];
  }
  rig.orbit.rotation.y = (frame % 4) * (Math.PI / 8);
  rig.floating.position.y = 12 + swing * 1.2;
}
