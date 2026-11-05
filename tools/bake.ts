// Рендерит блочных героев, гибридов и врагов в спрайт-листы public/sprites.
import * as THREE from 'three';
import { buildBlocky, poseFrame, SPRITE_FRAMES, type BlockyRig } from '../src/art/blocky';
import { buildEnemy } from '../src/art/enemyModels';
import { enemyLook, type EnemyLook } from '../src/art/enemyLooks';
import { BOSS_LOOKS, lookOf, LOOKS } from '../src/art/looks';
import { ENEMIES } from '../src/data/levels';
import { UNITS } from '../src/data/units';

const FRAME = 192;
const RENDER = FRAME * 3;
const HERO_VIEW = { half: 25, center: 21, turn: 0.32 };
const ENEMY_VIEW = { half: 30, center: 20, turn: -0.6 };
// Боссы крупнее: им нужен кадр шире.
const BOSS_VIEW = { half: 40, center: 24, turn: -0.6 };

const log = (text: string) => {
  document.getElementById('log')!.textContent += `${text}\n`;
};

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(RENDER, RENDER);
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

function makeScene() {
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(20, 40, 40);
  scene.add(sun);
  return scene;
}

function dispose(root: THREE.Object3D) {
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.geometry.dispose();
    for (const material of [node.material].flat()) {
      material.map?.dispose();
      material.dispose();
    }
  });
}

async function bake(id: string, rig: BlockyRig, view: typeof HERO_VIEW) {
  const scene = makeScene();
  rig.root.rotation.y = view.turn;
  scene.add(rig.root);
  const camera = new THREE.OrthographicCamera(-view.half, view.half, view.half, -view.half, -200, 200);
  camera.position.set(0, view.center + 6, 60);
  camera.lookAt(0, view.center, 0);

  const sheet = document.createElement('canvas');
  sheet.width = FRAME * SPRITE_FRAMES;
  sheet.height = FRAME;
  const context = sheet.getContext('2d')!;
  context.imageSmoothingQuality = 'high';
  for (let frame = 0; frame < SPRITE_FRAMES; frame++) {
    poseFrame(rig, frame);
    rig.root.updateMatrixWorld(true);
    renderer.render(scene, camera);
    context.drawImage(renderer.domElement, FRAME * frame, 0, FRAME, FRAME);
  }
  const blob = await new Promise<Blob>((resolve) => sheet.toBlob((b) => resolve(b!), 'image/png'));
  const response = await fetch(`/bake/save?id=${encodeURIComponent(id)}`, { method: 'POST', body: blob });
  if (!response.ok) throw new Error(await response.text());
  dispose(rig.root);
}

const results: Record<string, string> = {};
const run = async (id: string, build: () => BlockyRig, view: typeof HERO_VIEW) => {
  try {
    await bake(id, build(), view);
    results[id] = 'ok';
  } catch (error) {
    results[id] = String(error).slice(0, 200);
    log(`${id}: ${results[id]}`);
  }
};

for (const id of UNITS.keys()) {
  const spec = lookOf(id);
  if (spec) await run(id, () => buildBlocky(spec), HERO_VIEW);
}

const enemyLooks = new Map<string, EnemyLook>();
for (const def of Object.values(ENEMIES)) {
  for (const name of def.name.split(' × ')) {
    const look = enemyLook(name);
    enemyLooks.set(look.key, look);
  }
}
for (const look of enemyLooks.values()) {
  const hero = look.hero ? BOSS_LOOKS[look.hero] ?? LOOKS.get(look.hero) : undefined;
  if (hero) {
    // Босс-человек: герой в боевой ауре, развёрнутый к героям.
    await run(look.key, () => {
      const rig = buildBlocky({ ...hero, tier: Math.max(hero.tier, 4), accessories: [...hero.accessories, `ascWings:${look.color}`] });
      rig.walks = true;
      return rig;
    }, { ...ENEMY_VIEW, turn: -0.9 });
  } else {
    await run(look.key, () => buildEnemy(look), ['dragon', 'whale', 'wolfking'].includes(look.shape) ? BOSS_VIEW : ENEMY_VIEW);
  }
}

await fetch('/bake/report', { method: 'POST', body: JSON.stringify(results) });
const failed = Object.values(results).filter((value) => value !== 'ok').length;
log(`Готово: ${Object.keys(results).length}, ошибок ${failed}`);
document.title = 'Рендер завершён';
