// Враги сгруппированы по облику: одна модель на родственных врагов, цвет по стихии.
export type EnemyShape =
  | 'hilichurl' | 'mitachurl' | 'lawachurl' | 'samachurl' | 'slime' | 'mage' | 'herald' | 'fatui' | 'agent'
  | 'hoarder' | 'nobushi' | 'kairagi' | 'eremite' | 'warrior' | 'knight' | 'ruinGuard' | 'ruinHunter' | 'mek'
  | 'vishap' | 'saurian' | 'rifthound' | 'volkodlak' | 'beast' | 'flyer' | 'crab' | 'specter' | 'spirit'
  | 'cube' | 'plant' | 'fungus' | 'dragon' | 'whale' | 'wolfking' | 'giant' | 'soldier' | 'boss';

export interface EnemyLook {
  shape: EnemyShape;
  variant: string;
  color: string;
  dark: string;
  key: string;
  // Босс-человек строится как герой: по внешности из looks.ts.
  hero?: string;
}

const SHAPES: Array<[EnemyShape, RegExp]> = [
  ['slime', /Slime/],
  ['lawachurl', /Lawachurl/],
  ['mitachurl', /Mitachurl/],
  ['samachurl', /Samachurl/],
  ['hilichurl', /churl|Hilichurl/],
  ['cube', /Hypostasis/],
  ['plant', /Whopperflower|Regisvine|Mimiflora|Papilla|Leshy|Tree Segment/],
  ['fungus', /Fungus|shroom/],
  ['mage', /Abyss Mage/],
  ['herald', /Herald|Lector|Baptist|Wilderness|Fisher/],
  ['agent', /Pyro Agent|Cicin Mage|Mirror Maiden|Operative|Channel Contact|Glaciomancer|Spiritspeaker/],
  ['fatui', /Fatui|Oprichniki/],
  ['hoarder', /Treasure Hoarders/],
  ['nobushi', /Nobushi/],
  ['kairagi', /Kairagi|Maguu/],
  ['eremite', /Eremite|Forged Sand|Flowing Blade|Swiftstep/],
  ['warrior', /Warrior/],
  ['knight', /Shadowy Husk|Black Serpent|Knight|Guardian Blade|Glacial Warden|Watcher|Domain Keeper/],
  ['ruinHunter', /Ruin (Hunter|Drake|Serpent)|Aeonblight/],
  ['ruinGuard', /Ruin |Golem|Perpetual|Immortal/],
  ['mek', /Mek|Construct|Automaton|Algorithm|Matrix|Generator|Icewind|Landcruiser|Landrover|Knuckle/],
  ['vishap', /Vishap/],
  ['saurian', /saur/],
  ['rifthound', /Rifthound/],
  ['volkodlak', /Volkodlak|Leomastiff|Long-Eared|Fanged|Voywolf/],
  ['flyer', /Cicin|Vulture|Moonfly|Jellyfish|Seahorse|Ray|Sea Hare|Wenut|Serpent/],
  ['crab', /Crab|Octopus|Scorpion|Lunapod|Blubberbeast|Emperor/],
  ['specter', /Specter/],
  ['spirit', /Phantasm|Tulpa|Manifestation|Scion|Eye of|Oceanid|Herra|Wayob|Avatar|Breacher/],
  ['beast', /Wolf|Beast|Crocodile|Antelope|Bladehorn|Moongecko|Weasel|Chimeric|Mimic|Suanni|Xuanwen/],
];

// Боссы из Genshin: свои модели, а люди-боссы собраны как герои.
const BOSSES: Array<[RegExp, Omit<EnemyLook, 'key'>]> = [
  [/Stormterror/, { shape: 'dragon', variant: 'dvalin', color: '#5fc8e8', dark: '#2a6a9a' }],
  [/Azhdaha/, { shape: 'dragon', variant: 'azhdaha', color: '#d9a93f', dark: '#6a4a22' }],
  [/Apep/, { shape: 'dragon', variant: 'apep', color: '#8fc73e', dark: '#2f5a2a' }],
  [/Lord of Eroded Primal Fire/, { shape: 'dragon', variant: 'primal', color: '#ff6a3c', dark: '#3a1a14' }],
  [/Narwhal/, { shape: 'whale', variant: 'narwhal', color: '#3f6fd8', dark: '#1a2a5a' }],
  [/Lupus Boreas/, { shape: 'wolfking', variant: 'boreas', color: '#9fdcec', dark: '#3f6a9a' }],
  [/Golden Wolflord/, { shape: 'wolfking', variant: 'wolflord', color: '#e8c26a', dark: '#4a2a5a' }],
  [/Childe/, { shape: 'boss', variant: 'childe', color: '#3fa7f0', dark: '#1a2a4a', hero: 'tartaglia' }],
  [/Knave/, { shape: 'boss', variant: 'knave', color: '#c0201f', dark: '#1a1a22', hero: 'arlecchino' }],
  [/La Signora/, { shape: 'boss', variant: 'signora', color: '#9fdcec', dark: '#2a2a3a', hero: 'signora' }],
  [/Doctor|Dottore/, { shape: 'boss', variant: 'dottore', color: '#8fc73e', dark: '#1a2a22', hero: 'dottore' }],
  [/Magatsu Mitake/, { shape: 'boss', variant: 'magatsu', color: '#a772e8', dark: '#2a1a3a', hero: 'raiden_shogun' }],
  [/Shouki no Kami/, { shape: 'boss', variant: 'shouki', color: '#5f7ad8', dark: '#1a1a3a', hero: 'wanderer' }],
  [/Game Before the Gate/, { shape: 'giant', variant: 'gate', color: '#ffb347', dark: '#3a2a1a' }],
];

const TINTS: Array<[RegExp, string, string]> = [
  [/Pyro|Blazing|Fiery|Burning|Lava|Flames?|Fire/, '#e2683a', '#8f3320'],
  [/Hydro|Tide|Water|Sea|Flow|Wave|Koholasa/, '#3f9be6', '#225a96'],
  [/Anemo|Wind|Gale|Storm|Skywatch|Yumkasa/, '#62d6b2', '#2f8a72'],
  [/Electro|Thunder|Crackling|Lightning|Bolteater/, '#a772e8', '#5f3a96'],
  [/Dendro|Foliar|Vines|Leaves|Overgrown|Fungus|Whopper|Mimiflora/, '#8fc73e', '#4f7a22'],
  [/Cryo|Ice|Frost|Glaci|Snow|Rimebiter|Iktomisa/, '#9fdcec', '#4f8aa5'],
  [/Geo|Rock|Stone|Earth|Tepetlisa/, '#d9a93f', '#8a6a22'],
  [/Ruin|Mek|Automaton|Construct|Landcruiser|Golem/, '#8f8878', '#524e44'],
  [/Abyss|Shadowy|Serpent|Rifthound|Tenebrous/, '#8a3fd1', '#4a2078'],
  [/Fatui|Oprichniki|Operative/, '#c9c9d6', '#3a3a50'],
  [/Treasure|Hilichurl/, '#b08a5a', '#6a4f30'],
];

// Вариант задаёт оружие и детали внутри семейства.
function variantOf(shape: EnemyShape, name: string) {
  const rules: Array<[RegExp, string]> = [
    [/Shield|Shieldwall/, 'shield'], [/Shooter|Crossbow|Marksman|gunner|Sharpshooter|Javelineer/, 'shooter'],
    [/Grenadier|Potioneer|Bombardier|Lobber|Cannoneer/, 'bomb'], [/Berserker|Axe|Fighter|Pugilist|Crusher|Basher|Breaker/, 'brawler'],
    [/Large|Primo|Bathysmal|Mountain King|Tyrant/, 'large'], [/Cicin Mage|Mirror|Glaciomancer/, 'witch'],
  ];
  return rules.find(([match]) => match.test(name))?.[1] ?? (shape === 'hilichurl' ? 'club' : 'base');
}

export function enemyLook(name: string): EnemyLook {
  const boss = BOSSES.find(([match]) => match.test(name))?.[1];
  if (boss) return { ...boss, key: `enemy_boss_${boss.variant}` };
  const shape = SHAPES.find(([, match]) => match.test(name))?.[0] ?? 'soldier';
  const [, color, dark] = TINTS.find(([match]) => match.test(name)) ?? [null, '#9a7b5b', '#5a4630'];
  const variant = variantOf(shape, name);
  return { shape, variant, color, dark, key: `enemy_${shape.toLowerCase()}_${variant}_${color.slice(1)}` };
}

export const enemyLookKey = (name: string) => enemyLook(name).key;
