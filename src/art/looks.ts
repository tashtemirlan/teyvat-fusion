// Внешность героев и врагов как данные: игра читает отсюда имена спрайтов, рендер строит по ним модели.
import { enemyLookKey } from './enemyLooks';
import { GOD_TRIADS } from '../data/recipes';
import { HEROES, type Element, type Weapon } from '../data/roster';
import { getUnit, heroId } from '../data/units';

export type Build = 'female' | 'male' | 'child';
export type HairStyle = 'long' | 'short' | 'wavy' | 'twin' | 'ponytail' | 'bun' | 'bob' | 'spiky' | 'hime' | 'sidebang';
export type OutfitKind = 'vest' | 'coat' | 'corset' | 'robe' | 'kimono' | 'armor' | 'tunic' | 'dress' | 'gown' | 'tailcoat' | 'open';

export interface Outfit {
  kind: OutfitKind;
  main: string;
  second: string;
  trim: string;
  thigh: string;
  boot: string;
}

export interface BlockySpec {
  build: Build;
  hairStyle: HairStyle;
  hair: [string, string];
  skin: string;
  eyes: [string, string];
  outfits: [Outfit, Outfit];
  // Детали записаны как «вид:цвет», например horns:#7a2f2f.
  accessories: string[];
  weapons: Weapon[];
  elements: Element[];
  tier: number;
  weaponScale?: number;
}

const FAIR = '#ffe3cf';
const WARM = '#f6d2b5';
const TAN = '#d9a57e';
const GOLD = '#e8c26a';
const SILVER = '#d6dde6';

type Row = [string, 'f' | 'm' | 'c', HairStyle, [string, string], string, string, OutfitKind, [string, string], string, [string, string], string[]];

// Имя, телосложение, причёска, волосы, кожа, глаза, тип наряда, цвета наряда, отделка, чулки и сапоги, детали.
const ROWS: Row[] = [
  ['Aino', 'c', 'long', ['#e8b6e8', '#d89ae0'], FAIR, '#8a98b8', 'tunic', ['#c8e05a', '#2a2a33'], '#e8607a', [FAIR, '#e8d040'], ['ahoge:#e8b6e8', 'hairclip:#e8607a', 'cape:#f2f2f6', 'wideSleeves:#f2f2f6', 'shorts:#f6f6f6', 'lowBoots', 'frillSocks']],
  ['Albedo', 'm', 'short', ['#e0d2a8', '#c9b888'], FAIR, '#4fb8a8', 'coat', ['#2a2f6a', '#f0ece0'], '#c09a50', ['#2a2a44', '#1a1a2c'], ['cape:#f0ece0', 'hairclip:#e8c26a', 'collar:#c09a50']],
  ['Alhaitham', 'm', 'sidebang', ['#a8aeb0', '#8c9496'], WARM, '#b8a060', 'coat', ['#1c2424', '#1c2424'], '#3fa8a0', ['#1c2424', '#141a1a'], ['cape:#1f7f80', 'scarf:#1f7f80', 'hairclip:#3fbf9f']],
  ['Aloy', 'f', 'wavy', ['#d9743a', '#e08a4a'], WARM, '#b8a040', 'tunic', ['#b8935e', '#6a4a38'], '#c0403a', ['#4a2f2a', '#b8935e'], ['braid', 'scarf:#3fb0c8', 'feather:#f2ece0']],
  ['Alyosha', 'm', 'short', ['#e4f2dc', '#c8e4c8'], FAIR, '#d9a83a', 'coat', ['#1f4f6a', '#c0303a'], '#efe6cf', ['#1f3f5a', '#7a5a3a'], ['collar:#f3f6fb', 'cape:#e4dcc0', 'scarf:#c0303a']],
  ['Amber', 'f', 'long', ['#3f2a24', '#5a3a2a'], FAIR, '#d9a03a', 'corset', ['#c0303a', '#1f1f28'], '#c0303a', ['#f4f4f8', '#f4f4f8'], ['ribbon:#d8343a', 'goggles', 'shorts:#1f1f28']],
  ['Arataki Itto', 'm', 'spiky', ['#f0f0f0', '#d83a3a'], WARM, '#d83a3a', 'open', ['#3a2a33', '#c9a03a'], GOLD, ['#4a4a54', '#1a1a22'], ['horns:#d83a3a', 'cape:#1a1a22']],
  ['Arlecchino', 'f', 'sidebang', ['#c0c0c8', '#a0a0aa'], FAIR, '#c0201f', 'coat', ['#b8bcc4', '#1a1a22'], '#c0201f', ['#1a1a22', '#101018'], ['locks:#2a2a33', 'cape:#8a1a20']],
  ['Baizhu', 'm', 'long', ['#6fc090', '#9ad8b0'], FAIR, '#e8c26a', 'vest', ['#2f5f7a', '#2a3a5a'], GOLD, ['#5a4a9a', '#1f2038'], ['glasses', 'scarf:#f2f2f6', 'cape:#7fd0c0']],
  ['Barbara', 'f', 'twin', ['#f2d98a', '#e8c26a'], FAIR, '#7a9ae0', 'dress', ['#f6f6fb', '#3f6fa8'], GOLD, ['#f6f6fb', '#2a2a33'], ['beret:#f6f6fb', 'wideSleeves:#f6f6fb', 'lowBoots']],
  ['Beidou', 'f', 'long', ['#3a2a2a', '#4a3430'], WARM, '#c0303a', 'robe', ['#1f1f28', '#c0303a'], GOLD, ['#1a1a22', '#2a1a1a'], ['eyepatch:#b02030', 'hairclip:#e8c26a', 'wideSleeves:#f2f2f6', 'cape:#5a1f2a']],
  ['Bennett', 'm', 'spiky', ['#e8e6da', '#d6d2c6'], WARM, '#6fa86a', 'vest', ['#2a2a33', '#d9cba0'], '#d9a44a', [WARM, '#2a2a33'], ['goggles', 'shorts:#2a3050', 'lowBoots', 'scarf:#e8b040']],
  ['Candace', 'f', 'long', ['#3a3a80', '#2f2f66'], TAN, '#d9a03a', 'corset', ['#2a2a5a', '#f2ece0'], GOLD, [TAN, '#c9a03a'], ['tiara:#e8c26a', 'cape:#3a2a70', 'shorts:#2a2a5a', 'lowBoots']],
  ['Charlotte', 'f', 'bob', ['#f0a8c0', '#f2c0d0'], FAIR, '#4fb890', 'coat', ['#8f1f2a', '#f2f2f6'], GOLD, [FAIR, '#a02030'], ['beret:#a02030', 'glasses', 'feather:#f2f2f6', 'wideSleeves:#8f1f2a', 'lowBoots']],
  ['Chasca', 'f', 'sidebang', ['#8a1f2a', '#a02a30'], FAIR, '#3f8fd8', 'corset', ['#1f1f28', '#7a2f2a'], GOLD, ['#1f1f28', '#111118'], ['locks:#3f5fc0', 'elfEars', 'widehat:#2a2028', 'scarf:#c0303a', 'cape:#d6d6de', 'shorts:#1f1f28']],
  ['Chevreuse', 'f', 'long', ['#5a4a9a', '#4a3a80'], FAIR, '#a070d8', 'corset', ['#2a1a22', '#c0303a'], GOLD, ['#f4f4f8', '#2a1a22'], ['eyepatch:#26324f', 'shako:#2a1a22', 'wideSleeves:#2a1a22']],
  ['Chiori', 'f', 'bun', ['#3a2a24', '#5a3a2a'], FAIR, '#c0403a', 'kimono', ['#e0a030', '#2a2a33'], GOLD, ['#2a2a33', '#7a2030'], ['flower:#c0303a', 'hairclip:#c0303a']],
  ['Chongyun', 'm', 'short', ['#5fb0e0', '#8ac8ea'], FAIR, '#5fa8e0', 'robe', ['#eef2f8', '#3f8fc0'], GOLD, ['#eef2f8', '#9a8a60'], ['ahoge:#5fb0e0', 'hairclip:#3f8fc0', 'wideSleeves:#eef2f8']],
  ['Citlali', 'f', 'long', ['#e8d8ec', '#b090e0'], FAIR, '#7a8ae8', 'corset', ['#2a2050', '#6a4fb0'], '#d0407a', [FAIR, '#1f1a22'], ['horns:#1f2a33', 'locks:#e090c8', 'longSkirt:#3a2a80', 'sash:#6a4fe0', 'lowBoots', 'braid']],
  ['Clorinde', 'f', 'sidebang', ['#2a2a55', '#3a3a70'], FAIR, '#7a68c0', 'corset', ['#1a1a26', '#f2f2f6'], GOLD, ['#5a4f55', '#1a1a26'], ['widehat:#2a2a5f', 'feather:#3f5fc0', 'cape:#2a2a8a', 'wideSleeves:#f2f2f6', 'shorts:#1a1a26', 'collar:#3a3a8a']],
  ['Collei', 'f', 'short', ['#8fd03a', '#6fb030'], WARM, '#b05fd0', 'tunic', ['#2a2430', '#3f6a2a'], '#d9c48a', ['#6a4a30', '#2a2a44'], ['hairclip:#c9a03a', 'collar:#3f6a2a', 'wideSleeves:#2a2430', 'tail:#e8702a', 'ahoge:#8fd03a']],
  // Сверено с артом: чёрные волосы с прямой чёлкой, малиновые пряди с белыми крестами, закрытые глаза, крылышки у головы, босые ноги.
  ['Columbina', 'f', 'hime', ['#1e1628', '#2c1c3c'], FAIR, '#3f3a6a', 'gown', ['#f2f2fb', '#7f8fe0'], '#ffffff', [FAIR, FAIR], ['closedEyes', 'locks:#a0245e', 'headWings:#f6f6ff', 'openGown:#f2f2fb', 'wideSleeves:#f2f2fb', 'lowBoots', 'anklet:#5f9fff']],
  ['Cyno', 'm', 'long', ['#e8e8ec', '#2a2233'], TAN, '#d9602a', 'open', ['#3a2a55', '#c9a03a'], GOLD, [TAN, '#2a2233'], ['anubis:#2a2233', 'shorts:#4a4fb0', 'lowBoots', 'collar:#c9a03a', 'cape:#b0a080']],
  ['Dahlia', 'm', 'short', ['#f2d8a8', '#f0b0a0'], FAIR, '#a890d8', 'coat', ['#f0ece0', '#c0303a'], GOLD, [FAIR, '#1a1a22'], ['shorts:#1a1a22', 'ears:#2a2a33', 'beret:#f2f2f6', 'cape:#a02030', 'lowBoots', 'hairclip:#c0303a']],
  ['Dehya', 'f', 'wavy', ['#2a2630', '#3a3440'], WARM, '#5fa0e0', 'corset', ['#1a1a22', '#c0303a'], GOLD, ['#2a2a33', '#1a1a22'], ['locks:#e8c26a', 'ears:#6a4a22', 'scarf:#c0303a', 'shorts:#1a1a22', 'cape:#c0303a']],
  ['Diluc', 'm', 'short', ['#e8502a', '#f06a30'], FAIR, '#c0303a', 'tailcoat', ['#1f1f2a', '#efe6d8'], '#a89a70', ['#1f1f2a', '#6a5a50'], ['ahoge:#e8502a', 'collar:#1f1f2a', 'tailcoatBack:#1f1f2a']],
  ['Diona', 'c', 'bob', ['#f2a8b0', '#e88a98'], FAIR, '#4fc8a8', 'tunic', ['#f6e8e8', '#e8b040'], GOLD, [FAIR, '#2a2a55'], ['beret:#2a2a55', 'ears:#f2a8b0', 'tail:#f2a8b0', 'shorts:#2a2a55', 'wideSleeves:#f6e8e8', 'lowBoots', 'scarf:#e8b040']],
  ['Dori', 'c', 'wavy', ['#f2a0c0', '#e880b0'], FAIR, '#e8902a', 'tunic', ['#f2ece0', '#2a2a33'], GOLD, ['#a890e0', '#f2ece0'], ['beret:#5a3f9a', 'hairclip:#e8c26a', 'ahoge:#f2a0c0', 'wideSleeves:#f2ece0', 'bow:#c0506a', 'shorts:#a890e0']],
  ['Durin', 'm', 'short', ['#c0a8c8', '#9a88a8'], FAIR, '#d83050', 'coat', ['#1c1c28', '#5a3a90'], '#d83050', ['#f2f2f6', '#1c1c28'], ['horns:#1c1c28', 'tail:#1c1c28', 'cape:#6a2a70', 'collar:#f2f2f6']],
  ['Emilie', 'f', 'bob', ['#f2d98a', '#f0b0a0'], FAIR, '#a08ad0', 'corset', ['#1f1f28', '#f2ece0'], GOLD, [FAIR, '#efe6cf'], ['glasses', 'beret:#1f5f3f', 'bow:#1f1f28', 'wideSleeves:#2a2a33', 'longSkirt:#1f5f3f', 'lowBoots', 'feather:#1f1f28']],
  ['Escoffier', 'f', 'long', ['#f0a040', '#e88a2a'], FAIR, '#4fb0c8', 'corset', ['#eef0f6', '#e8e4dc'], GOLD, ['#f4f4f8', '#f4f4f8'], ['chefHat:#f4f4f8', 'ahoge:#f0a040', 'bow:#a02040', 'hairclip:#7fd3ea', 'cape:#2a2028', 'shorts:#eef0f6']],
  ['Eula', 'f', 'bob', ['#a8dce0', '#7fc8d0'], FAIR, '#8a5a50', 'corset', ['#1f1f2c', '#f2f2f6'], GOLD, ['#1f2030', '#111118'], ['headband:#1f1f2c', 'feather:#c8d8e8', 'wideSleeves:#f2f2f6', 'scarf:#3f6fd8', 'shorts:#1f1f2c']],
  ['Faruzan', 'f', 'twin', ['#7fd8c8', '#5fc0b0'], FAIR, '#5fb09a', 'dress', ['#e8f2ea', '#2a4a6a'], GOLD, [FAIR, '#2a4a6a'], ['hairclip:#e8dcb0', 'ears:#2a4a4a', 'shorts:#2a4a6a', 'lowBoots', 'wideSleeves:#e8f2ea']],
  ['Fischl', 'f', 'twin', ['#f2d98a', '#e8c878'], FAIR, '#5fbf5f', 'corset', ['#1f1a2c', '#6a4fb0'], GOLD, ['#8a7a8a', '#1f1a2c'], ['eyepatch:#2a2a33', 'bow:#6a4fb0', 'hairclip:#2a2a33', 'cape:#4a3a90', 'shorts:#1f1a2c']],
  ['Flins', 'm', 'short', ['#4a5fc0', '#6a7ae0'], FAIR, '#e8c26a', 'coat', ['#2a2a33', '#7a68c0'], '#d6d6de', ['#7a7a88', '#1f1f28'], ['ahoge:#4a5fc0', 'collar:#2a2a33', 'cape:#2a2a33']],
  ['Freminet', 'm', 'sidebang', ['#f2e0a8', '#e0cc90'], FAIR, '#8a7ab0', 'coat', ['#20242e', '#efe6d0'], '#c09a50', [FAIR, '#20242e'], ['beret:#2a1f22', 'shorts:#20242e', 'collar:#efe6d0', 'lowBoots']],
  // Сверено с артом: белые волосы с голубыми прядями и чёлкой на глаз, завиток, цилиндр с короной, фрак с длинными фалдами, шорты, перчатки разного цвета.
  ['Furina', 'f', 'sidebang', ['#f2f5fb', '#e0e8f6'], FAIR, '#3f6fd8', 'tailcoat', ['#1f2f6e', '#f2f2f6'], '#c9a03a', [FAIR, '#1f2a55'], ['locks:#6f9fe0', 'ahoge:#f2f5fb', 'topHat:#1f3a8a', 'tailcoatBack:#1f2f6e', 'sash:#2f6fe0', 'shorts:#eef0f6', 'mismatchedGloves', 'lowBoots', 'frillSocks', 'thighStrap']],
  ['Gaming', 'm', 'short', ['#4a2a22', '#c0402a'], WARM, '#d9902a', 'tunic', ['#4a4a50', '#e0502a'], GOLD, ['#3a3a40', '#2a2a22'], ['ahoge:#4a2a22', 'headband:#1f1f22', 'scarf:#2a6a4a', 'sash:#2a6a4a']],
  ['Ganyu', 'f', 'wavy', ['#6fa8e8', '#8abcf0'], FAIR, '#b06a8a', 'corset', ['#2a2030', '#f2ece0'], GOLD, ['#2a2030', '#f2f2f2'], ['horns:#6a1f2a', 'ahoge:#6fa8e8', 'bow:#c9a03a', 'wideSleeves:#f2f2fa', 'lowBoots']],
  ['Gorou', 'm', 'short', ['#c9a050', '#f2f2f2'], WARM, '#4fc8c0', 'open', ['#2fa0a0', '#1f1a1a'], GOLD, ['#9a9a88', '#1f1a1a'], ['wolfears:#f2f2f2', 'tail:#c9a050', 'hairclip:#d9b060', 'sash:#7a1f24']],
  ['Hu Tao', 'f', 'long', ['#3a2a30', '#8a2f2a'], FAIR, '#e0602a', 'coat', ['#2a2024', '#c0303a'], '#c9b48a', [FAIR, '#f2f2f2'], ['widehat:#1f1a1e', 'flower:#c0303a', 'wideSleeves:#2a2024', 'cape:#2a2024', 'shorts:#1f1a1e', 'lowBoots', 'frillSocks']],
  ['Iansan', 'c', 'long', ['#e8e8e8', '#d0d0d0'], TAN, '#6fc83a', 'tunic', ['#f0a020', '#3a2a2a'], '#b080e0', [TAN, '#2a2a33'], ['skullMask:#efe6cf', 'elfEars', 'collar:#2a2a33', 'wideSleeves:#3a2a2a', 'lowBoots']],
  ['Ifa', 'm', 'short', ['#a8d8e8', '#88c0d0'], TAN, '#6fb0c0', 'coat', ['#f2f2f2', '#2a2a2a'], '#2fb8a0', ['#2a2a22', '#3a2a20'], ['widehat:#f2f2f2', 'feather:#2fb8a0', 'cape:#2fb8a0']],
  ['Illuga', 'm', 'sidebang', ['#c0c0c4', '#a8a8ae'], FAIR, '#8a7ab0', 'coat', ['#4f4a48', '#efece2'], '#e8a030', ['#1c1c20', '#efece2'], ['collar:#f3f6fb', 'sash:#5a3fa0', 'hairclip:#d0402a', 'cape:#d08a2a']],
  ['Ineffa', 'f', 'hime', ['#a8e0ec', '#90d4e4'], FAIR, '#4fb8d8', 'corset', ['#1f2030', '#eef0f4'], GOLD, ['#e8ecf2', '#e8ecf2'], ['locks:#a8e0ec', 'beret:#2a5f9a', 'scarf:#2a5f9a', 'cape:#c0502a', 'shorts:#1f2030', 'wideSleeves:#e8ecf2']],
  ['Jahoda', 'f', 'twin', ['#e8dca0', '#d9c888'], FAIR, '#e8902a', 'corset', ['#1f1f24', '#f2f2f2'], GOLD, [FAIR, '#1f1f24'], ['beret:#2a2028', 'goggles', 'cape:#e88a98', 'shorts:#2a2a33', 'wideSleeves:#1f1f24', 'lowBoots', 'frillSocks', 'hairMask:#e88aa8']],
  ['Jean', 'f', 'ponytail', ['#f0d890', '#e8c878'], FAIR, '#8a9ae0', 'corset', ['#f4f4f8', '#7a3a1f'], '#c09a50', ['#f4f4f8', '#f4f4f8'], ['collar:#1f3058', 'bow:#f4f4f8', 'cape:#3f8ab0', 'wideSleeves:#1f3058']],
  ['Kachina', 'c', 'twin', ['#d9d2c0', '#c0b8a8'], FAIR, '#3fc0e0', 'tunic', ['#f2ece0', '#3a2a22'], '#a0c040', [FAIR, '#1f1f22'], ['beret:#efe6c8', 'ears:#3a3028', 'scarf:#a0c040', 'cape:#e8901f', 'shorts:#3a2a22', 'lowBoots']],
  ['Kaedehara Kazuha', 'm', 'ponytail', ['#ecece6', '#d9d9d2'], FAIR, '#d9602a', 'kimono', ['#2a1f1f', '#f2f2f0'], '#c0303a', ['#3a1f1f', '#1f1414'], ['locks:#d9402a', 'hairclip:#d9402a', 'wideSleeves:#f2f2f0', 'scarf:#c0303a']],
  ['Kaeya', 'm', 'short', ['#2a4a6a', '#1f3a5a'], TAN, '#5f7ad8', 'coat', ['#1a1f2a', '#eef2f8'], GOLD, ['#1a1f2a', '#111622'], ['eyepatch:#1a1f2a', 'collar:#f3f6fb', 'cape:#d6dcf0', 'braid']],
  ['Kamisato Ayaka', 'f', 'hime', ['#b8c8e8', '#a0b4e0'], FAIR, '#7a8ab0', 'corset', ['#20264a', '#c9a03a'], GOLD, [FAIR, '#f2f2f2'], ['locks:#b8c8e8', 'hairclip:#c9a03a', 'bow:#e04a8a', 'wideSleeves:#bcd0ec', 'longSkirt:#20264a', 'lowBoots', 'frillSocks']],
  ['Kamisato Ayato', 'm', 'short', ['#a8c8ec', '#8ab0e0'], FAIR, '#a080c0', 'coat', ['#efe8d4', '#3f2f8a'], GOLD, ['#efe8d4', '#1f1f24'], ['cape:#3f2f8a', 'hairclip:#6a4fb0', 'bow:#c9a03a']],
  ['Kaveh', 'm', 'short', ['#f2d870', '#e0c050'], FAIR, '#d9902a', 'robe', ['#f0ece0', '#f0ece0'], GOLD, ['#1a1f1a', '#f0ece0'], ['sash:#2a5f9a', 'wideSleeves:#f0ece0', 'scarf:#3a2a24', 'cape:#a02a2a', 'feather:#5fd0b5']],
  ['Keqing', 'f', 'twin', ['#a8a0c8', '#c0b8e0'], FAIR, '#d0407a', 'corset', ['#3a2a80', '#c0b8e8'], GOLD, ['#3a2a28', '#3a2a80'], ['ears:#a8a0c8', 'hairclip:#e8c26a', 'flower:#f2ece0', 'wideSleeves:#a0b8e8']],
  ['Kinich', 'm', 'short', ['#1f2a33', '#2f8a6a'], TAN, '#e8d040', 'tunic', ['#1f1f24', '#1f1f24'], '#3fb0c0', ['#2f8a9a', '#1f2a4a'], ['ahoge:#1f2a33', 'locks:#3fc07a', 'sash:#e8e0b0', 'cape:#2f8a9a']],
  ['Kirara', 'f', 'long', ['#d9c8a0', '#c9b890'], FAIR, '#5fc83a', 'corset', ['#1f2a33', '#2f8a9a'], GOLD, [FAIR, '#2a2a33'], ['ahoge:#d9c8a0', 'ears:#1f2a33', 'tail:#c9b890', 'bow:#e8b040', 'wideSleeves:#2f8a9a', 'shorts:#1f4a5a']],
  ['Klee', 'c', 'twin', ['#f6e8b8', '#f2dca0'], FAIR, '#e0602a', 'coat', ['#c0302a', '#f6efe2'], '#e8c26a', [FAIR, '#7a4a2a'], ['beret:#c0302a', 'elfEars', 'feather:#f6efe2', 'ahoge:#f6e8b8', 'backpack:#e8d8a0', 'shorts:#f6efe2', 'scarf:#f2c8a8']],
  ['Kujou Sara', 'f', 'bob', ['#2a2f55', '#3a4070'], WARM, '#e8b040', 'robe', ['#1f1f24', '#f2f2f2'], GOLD, ['#1f1f24', '#c0303a'], ['hairMask:#c0303a', 'feather:#2a2a33', 'wideSleeves:#f2f2f2', 'longSkirt:#6a2a4a', 'bow:#e8b040']],
  ['Kuki Shinobu', 'f', 'ponytail', ['#7fd050', '#6fc040'], FAIR, '#9a58c8', 'corset', ['#1f1a22', '#5a2a60'], '#c0306a', ['#2a1a2a', '#c0306a'], ['faceMask:#1f1f22', 'horns:#c0306a', 'shorts:#3a2a22', 'wideSleeves:#5a2a60']],
  ['Lan Yan', 'f', 'long', ['#1f2030', '#2a2a44'], FAIR, '#a890d8', 'dress', ['#d8ecd0', '#1f6a6a'], '#d6d6de', [FAIR, '#1f1f24'], ['headband:#e8ecf2', 'hairclip:#d6d6de', 'wideSleeves:#1f8080', 'shorts:#1f4a3a', 'lowBoots', 'feather:#d6d6de']],
  ['Lauma', 'f', 'sidebang', ['#4a4470', '#5a5488'], FAIR, '#5fb0c0', 'gown', ['#a8d8d8', '#4fa8b0'], '#2a2a6a', [FAIR, '#efe0b0'], ['antlers:#c0d8ec', 'elfEars', 'openGown:#7fc0c8', 'lowBoots']],
  ['Layla', 'f', 'long', ['#2f3f9a', '#8ac0e0'], FAIR, '#e8b040', 'corset', ['#1f1f28', '#f2f2f6'], GOLD, ['#f4f4f8', '#e8c26a'], ['hood:#2a2a7a', 'tiara:#e8c26a', 'elfEars', 'sash:#2a3fa0', 'wideSleeves:#2a3fa0', 'shorts:#1f1f28']],
  ['Linnea', 'f', 'bob', ['#f0c8a8', '#e8b090'], FAIR, '#d0406a', 'corset', ['#a01f30', '#2a2a33'], '#efe6cf', [FAIR, '#2a1a22'], ['elfEars', 'horns:#7a1f2a', 'hairclip:#d6dcec', 'wideSleeves:#efe6cf', 'cape:#f2b8c0', 'shorts:#c0304a', 'lowBoots']],
  ['Lisa', 'f', 'wavy', ['#a88a62', '#bfa078'], FAIR, '#5fc05a', 'corset', ['#2f2a7a', '#f2ece0'], GOLD, ['#5a5a70', '#1f1f28'], ['witchHat:#2f2a7a', 'flower:#3f4fc0', 'cape:#8a8aa8', 'wideSleeves:#d8dcef']],
  ['Lohen', 'm', 'sidebang', ['#6a8a80', '#5a7a70'], FAIR, '#7a5a80', 'coat', ['#1a2240', '#a8c0dc'], '#c9b48a', ['#1a2240', '#c0c4cc'], ['cape:#1a2240', 'scarf:#2a4fb0', 'shorts:#f2f2f2']],
  ['Lynette', 'f', 'bob', ['#b8b0a0', '#a89c8c'], FAIR, '#7a58c0', 'corset', ['#1f1f24', '#2a2a30'], '#1f9aaa', ['#5a5040', '#1a1a1e'], ['ears:#b8b0a0', 'tail:#8a7a60', 'bow:#1f9aaa', 'wideSleeves:#f4f4f8', 'locks:#1f9aaa']],
  ['Lyney', 'm', 'sidebang', ['#ece0c8', '#d8c8b0'], FAIR, '#8a68c8', 'vest', ['#2a2a2c', '#f2f2f4'], '#d0306a', ['#5a5040', '#1f1f20'], ['topHat:#3a3a3c', 'bow:#d0306a', 'wideSleeves:#f2f2f4', 'cape:#8a1f30', 'shorts:#2a2a2c']],
  ['Mavuika', 'f', 'long', ['#e8501f', '#f8b040'], WARM, '#e8902a', 'coat', ['#2a1a18', '#e8501f'], GOLD, ['#2a1a18', '#1a0e0c'], ['ahoge:#f07a30', 'locks:#f8b040', 'collar:#2a1a18']],
  ['Mika', 'm', 'short', ['#f2d860', '#e8b830'], FAIR, '#5a8ac0', 'coat', ['#2a3a70', '#f0ece0'], '#e8c26a', ['#f0ece0', '#6a4a30'], ['ahoge:#e8902a', 'collar:#f3f6fb', 'hood:#f0ece0', 'shorts:#f0ece0']],
  ['Mona', 'f', 'twin', ['#3a2a55', '#4a3a70'], FAIR, '#7aa080', 'corset', ['#3a2a80', '#5a4fd0'], GOLD, ['#3a2830', '#3a2a60'], ['witchHat:#3a2a80', 'hairclip:#e8c26a', 'cape:#b02a2a', 'collar:#1f1f28', 'wideSleeves:#3a2a80']],
  ['Mualani', 'f', 'bob', ['#f2f4fa', '#b0d0f0'], TAN, '#e0502a', 'tunic', ['#f2f4fa', '#3f8fd8'], '#3fb0e0', [TAN, '#1f4a7a'], ['ears:#b0d0f0', 'locks:#5fa0e0', 'shorts:#3f8fd8', 'cape:#1f2a4a', 'lowBoots']],
  ['Nahida', 'c', 'ponytail', ['#f0f2f2', '#d8e8d0'], FAIR, '#5fc83a', 'dress', ['#f4f0e0', '#2a3a2a'], '#7fa83a', [FAIR, '#f2f2f2'], ['elfEars', 'locks:#7fc05a', 'hairclip:#5f8f3a', 'cape:#6fa83a', 'lowBoots']],
  ['Navia', 'f', 'wavy', ['#f0d078', '#e0b858'], FAIR, '#5fa0d8', 'corset', ['#1f2438', '#f2ece0'], '#e8b030', ['#1f1f24', '#1f1f24'], ['widehat:#1f1f24', 'flower:#2a3a5a', 'bow:#2a3a7a', 'cape:#e0a020', 'wideSleeves:#1f1f24', 'shorts:#f2ece0']],
  ['Nefer', 'f', 'bob', ['#1f3a33', '#2fa070'], WARM, '#5fc88a', 'dress', ['#1f2a2a', '#f2f2ee'], GOLD, [WARM, '#c9a03a'], ['anubis:#d9b040', 'locks:#2fc080', 'cape:#2f8a6a', 'wideSleeves:#1f2a2a', 'longSkirt:#f2f2ee', 'lowBoots']],
  ['Neuvillette', 'm', 'long', ['#eef0f0', '#d6dcdc'], FAIR, '#9a6a7a', 'coat', ['#1f2f6e', '#2f6fe0'], GOLD, ['#1f1f2a', '#141420'], ['locks:#3fa0d8', 'collar:#e8ecf0', 'cape:#3fa8c0', 'hairclip:#3fa8e0']],
  ['Nicole', 'f', 'long', ['#f0c870', '#e8b050'], FAIR, '#7a68c0', 'gown', ['#eef0f6', '#2a2a70'], GOLD, ['#f4f4f8', '#eef0f6'], ['beret:#eef0f6', 'elfEars', 'wideSleeves:#eef0f6', 'longSkirt:#c8d0e8']],
  ['Nilou', 'f', 'hime', ['#d9402a', '#e85a3a'], FAIR, '#4fc0b0', 'tunic', ['#eaf2fa', '#1f2f5a'], GOLD, [FAIR, '#c9a03a'], ['locks:#d9402a', 'horns:#2a2a33', 'tiara:#e8c26a', 'veil:#eaf2fa', 'wideSleeves:#eaf2fa', 'longSkirt:#a8c8e0', 'lowBoots']],
  ['Ningguang', 'f', 'long', ['#f2f2f2', '#e4e4e4'], FAIR, '#c0603a', 'robe', ['#f6f2e8', '#c9a03a'], '#3a2a18', [FAIR, '#3a2a18'], ['ears:#f2f2f2', 'hairclip:#e8b030', 'wideSleeves:#3a2a18', 'cape:#e8c040', 'locks:#c0603a', 'lowBoots']],
  ['Noelle', 'f', 'bob', ['#c8c8d8', '#b8b8cc'], FAIR, '#a8903a', 'armor', ['#f2ece0', '#d6d6de'], GOLD, ['#f2ece0', '#efe6cf'], ['tiara:#f2f2f6', 'flower:#c0304a', 'longSkirt:#2a2a2c', 'bow:#c0304a']],
  ['Odette', 'f', 'sidebang', ['#b8d4f0', '#a0c4ec'], FAIR, '#9a70e0', 'corset', ['#2a3a80', '#f2f6fb'], SILVER, ['#eef2f8', '#e8c26a'], ['ahoge:#c8e0f4', 'tiara:#d6dde6', 'wideSleeves:#d8e8f4', 'longSkirt:#eef4fa']],
  ['Ororon', 'm', 'long', ['#2a2a70', '#4a5fc0'], TAN, '#e0407a', 'vest', ['#1f1f24', '#1f1f24'], '#3fa8e0', ['#4a4a50', '#1f1f24'], ['hood:#1f2a33', 'scarf:#2f9ae0', 'cape:#1f1f24']],
  ['Prune', 'c', 'bob', ['#4a4ac0', '#5f5fd8'], FAIR, '#c060c0', 'coat', ['#1f1f24', '#eaeaf2'], '#d04a8a', [FAIR, '#1f1f24'], ['bow:#d04a8a', 'hairclip:#1f1f24', 'cape:#a0407a', 'collar:#1f1f24', 'lowBoots']],
  ['Qiqi', 'c', 'bob', ['#b0a0d8', '#c4b8e4'], '#f2e8f0', '#d05a9a', 'robe', ['#3a3a7a', '#6a9ae0'], GOLD, ['#eef0ee', '#1f1f28'], ['beret:#2f2a6a', 'talisman:#e8c868', 'collar:#a8d8c8', 'shorts:#6a9ae0', 'wideSleeves:#3a3a7a']],
  ['Raiden Shogun', 'f', 'long', ['#2a2060', '#3a2f80'], FAIR, '#a06ad8', 'kimono', ['#e8e0f0', '#5a1f4a'], '#a080d8', ['#2a2050', '#1f1a3a'], ['braid', 'flower:#a080e0', 'hairclip:#e8c26a', 'wideSleeves:#e8e0f0', 'cape:#3a2a50']],
  ['Razor', 'm', 'spiky', ['#c8ccd0', '#dfe2e6'], WARM, '#d9402a', 'tunic', ['#c9a860', '#1f1f22'], '#d9c48a', ['#5f7a30', '#5a2a22'], ['hood:#2a2a22', 'wolfears:#c8ccd0', 'tail:#c8ccd0', 'cape:#3a2a22']],
  ['Rosaria', 'f', 'sidebang', ['#7a1f3a', '#9a2a48'], '#f4e8e4', '#b0a0a0', 'robe', ['#f2f0f0', '#1f1f24'], '#c02030', ['#3a2a3a', '#2a1a22'], ['tiara:#e8ecf2', 'veil:#a01f30', 'cape:#a01f30', 'longSkirt:#1f1f24']],
  ['Sandrone', 'f', 'twin', ['#9a8a6a', '#b0a080'], FAIR, '#4a58c8', 'corset', ['#2a1f24', '#f2ece0'], GOLD, ['#f4f4f8', '#1f1f24'], ['tiara:#f2f2ee', 'longSkirt:#f2f2ee', 'cape:#a01f30', 'wideSleeves:#2a1f24']],
  ['Sangonomiya Kokomi', 'f', 'hime', ['#f2c8b0', '#f0b8a0'], FAIR, '#8a80d8', 'gown', ['#3a3a90', '#d8c8f0'], '#f2f2f6', ['#f4f4fb', '#3a3a90'], ['locks:#f0c0a8', 'bow:#f0a080', 'wideSleeves:#2a2a70', 'cape:#f0c8c0', 'collar:#1f1f28']],
  ['Sayu', 'c', 'bob', ['#b8b8a0', '#a8a890'], FAIR, '#c06a8a', 'tunic', ['#f2e4b0', '#1f1f24'], '#d9602a', [FAIR, '#1f1f24'], ['hood:#f2e4b0', 'ears:#6a4a2a', 'tail:#f2e4b0', 'hairclip:#5fa83a', 'scarf:#1f1f24', 'lowBoots']],
  ['Sethos', 'm', 'short', ['#2a2420', '#d6d0c0'], TAN, '#5fd83a', 'robe', ['#f2ecd8', '#e8a020'], GOLD, ['#1f1f24', '#efe6d0'], ['locks:#d6d0c0', 'cape:#e8a020', 'scarf:#e8a020', 'hairclip:#5fc83a']],
  ['Shenhe', 'f', 'sidebang', ['#eef0f6', '#dce0ec'], FAIR, '#c0a0b0', 'corset', ['#20242e', '#f2f2f6'], '#c9a03a', ['#2a3440', '#f2f2f6'], ['feather:#2a2a33', 'hairclip:#c0303a', 'wideSleeves:#f2f2f6', 'cape:#2f6f9a']],
  ['Shikanoin Heizou', 'm', 'short', ['#8a1f3a', '#a02a48'], FAIR, '#9ac03a', 'kimono', ['#f2f2f2', '#2a2428'], '#c9a03a', ['#1f1f24', '#a01f30'], ['longSkirt:#c07a1f', 'wideSleeves:#2a2428', 'collar:#f2f2f2']],
  ['Sigewinne', 'c', 'twin', ['#b8d0f0', '#c8b8e8'], FAIR, '#d0405a', 'dress', ['#2f8a90', '#f4f4f8'], '#e0405a', ['#f4f4f8', '#1f4a5a'], ['nurseCap:#f4f4f8', 'ears:#7ab4e8', 'bow:#e0405a', 'wideSleeves:#2f8a90', 'shorts:#1f1f28']],
  ['Skirk', 'f', 'long', ['#d0cce0', '#b8b4d4'], FAIR, '#a04a50', 'corset', ['#f2f2fa', '#1f1a2c'], '#c9a03a', ['#3a2a90', '#2a1f70'], ['hairclip:#3f8fe0', 'wideSleeves:#3a2a90', 'cape:#eef0f8', 'shorts:#3a2a90']],
  ['Sucrose', 'f', 'short', ['#8ad88a', '#6fc8a8'], FAIR, '#e0802a', 'coat', ['#1f3a7a', '#1f1f28'], '#c9a03a', ['#5a5a60', '#f2f2f6'], ['glasses', 'horns:#c9a03a', 'beret:#f2f2f6', 'cape:#e8ecf4', 'wideSleeves:#e8ecf4', 'shorts:#1f3a7a']],
  ['Tartaglia', 'm', 'short', ['#d9802a', '#c87020'], FAIR, '#5a58a8', 'coat', ['#b8b8c0', '#f2f2f2'], '#7a1f1f', ['#b8b8c0', '#1f1f22'], ['ahoge:#d9802a', 'hairMask:#c0303a', 'scarf:#a02a20', 'cape:#8a1f1f']],
  ['Thoma', 'm', 'short', ['#ecc860', '#e0b040'], WARM, '#7ab040', 'vest', ['#a82a30', '#1f1f22'], GOLD, ['#1f3a3a', '#5a2f22'], ['ahoge:#ecc860', 'horns:#3a2a2a', 'sash:#a01f30', 'cape:#a01f30']],
  ['Tighnari', 'm', 'short', ['#1f1f28', '#2a2a33'], FAIR, '#7ac05a', 'tunic', ['#1f2a55', '#f2ece0'], '#6a3a9a', ['#1f2a55', '#1f2a55'], ['foxears:#3a2a2a', 'locks:#a0e040', 'flower:#f0c020', 'tail:#3a2a2a', 'scarf:#f2ece0']],
  ['Traveler', 'm', 'short', ['#f2d060', '#e8b840'], FAIR, '#e8a040', 'tunic', ['#3a1f22', '#f6efe0'], GOLD, ['#2a1a1e', '#2a1a1e'], ['ahoge:#f2d060', 'scarf:#f6efe0', 'cape:#e8b030', 'braid']],
  ['Varesa', 'f', 'twin', ['#f0a0a8', '#f2b8b0'], FAIR, '#b070d8', 'tunic', ['#1f1f24', '#f0dc80'], '#d0506a', ['#efe6d8', '#efe6d8'], ['horns:#efe6d8', 'ears:#6a3a2a', 'ahoge:#f0a0a8', 'locks:#3fc0b0', 'wideSleeves:#f0dc80', 'shorts:#1f1f24', 'tail:#f0a0a8']],
  ['Varka', 'm', 'sidebang', ['#e0c888', '#c9b070'], FAIR, '#8a70a0', 'coat', ['#1f7a8a', '#1f1f24'], '#c8b078', ['#d0d0d0', '#1f1f24'], ['collar:#f2f2f2', 'cape:#b07020']],
  ['Venti', 'm', 'short', ['#1f2a33', '#2a3a44'], FAIR, '#3fd0b0', 'vest', ['#2f8a5a', '#f2ece0'], GOLD, ['#f6f6f6', '#4a2f22'], ['locks:#3fb0c8', 'beret:#2f8a5a', 'flower:#f6f6f0', 'feather:#a8c040', 'bow:#1f1f24', 'wideSleeves:#f2ece0', 'cape:#e8dcb8', 'shorts:#2f8a5a']],
  ['Vesna', 'f', 'bob', ['#f0d880', '#e8c868'], FAIR, '#3fc0a8', 'corset', ['#3fb0a0', '#1f3a44'], GOLD, ['#f4f4f8', '#f4f4f8'], ['elfEars', 'tiara:#f2f2f2', 'bow:#3fb0a0', 'wideSleeves:#3fb0a0', 'cape:#f2f2f2', 'shorts:#f2f2f2', 'ribbon:#3fb0a0']],
  ['Vodyanitsa', 'f', 'sidebang', ['#3f8a90', '#2f7a80'], FAIR, '#7a9ae0', 'gown', ['#f2f4f8', '#3fb0a8'], '#d0c8e8', [FAIR, FAIR], ['flower:#f6f6f6', 'headWings:#d8ecec', 'openGown:#f2f4f8', 'wideSleeves:#f2f4f8', 'anklet:#3fc0c0', 'lowBoots']],
  ['Wanderer', 'm', 'short', ['#2a2a70', '#3a3a8a'], FAIR, '#7a8ad0', 'kimono', ['#f2f2f2', '#1f1f28'], '#3fa8c0', ['#f2f2f2', '#1f1f28'], ['widehat:#1f2a44', 'shorts:#1f1f28', 'cape:#3fa8c0', 'scarf:#2a3f9a', 'lowBoots']],
  ['Wonderland Manekin', 'm', 'short', ['#1f2a55', '#2a3a70'], FAIR, '#8a8a98', 'coat', ['#e8f0f8', '#2f5fc0'], '#8ac0e8', ['#1f3f8a', '#1f2a55'], ['collar:#e8f0f8', 'cape:#e8f0f8']],
  ['Wriothesley', 'm', 'short', ['#1f1a1e', '#3a3438'], FAIR, '#8a88c0', 'vest', ['#3a3a42', '#7a1f28'], '#a01f30', ['#a8a8b0', '#1f1f24'], ['ears:#1f1a1e', 'collar:#1f1f24', 'cape:#7a1f28', 'hairclip:#d6d6de']],
  ['Xiangling', 'f', 'bun', ['#2a3a7a', '#3a4a90'], FAIR, '#d9a03a', 'corset', ['#1f1a1a', '#e8b030'], '#c0402a', [FAIR, '#2a1a18'], ['hairclip:#e8c060', 'collar:#c0402a', 'shorts:#e8b030', 'lowBoots', 'bow:#c0402a']],
  ['Xianyun', 'f', 'bob', ['#1f2028', '#2f3f4a'], FAIR, '#5a6a9a', 'robe', ['#1f1a22', '#2a8a70'], '#d9b060', ['#3a2a2a', '#1f1a1a'], ['glasses', 'feather:#1f2a2a', 'locks:#2fa090', 'cape:#a8e0c8', 'longSkirt:#1f1a22']],
  ['Xiao', 'm', 'short', ['#1f3a33', '#3fa890'], FAIR, '#d9a03a', 'tunic', ['#f2ecec', '#6a4fb0'], '#a080d8', ['#1f2a55', '#1f1f22'], ['ahoge:#1f3a33', 'collar:#f2ece0', 'sash:#6a4fb0']],
  ['Xilonen', 'f', 'wavy', ['#f2e8c8', '#e89a2a'], TAN, '#5fb03a', 'corset', ['#f2ece0', '#1f1f24'], '#e8c040', [TAN, '#f2ece0'], ['ears:#3a2a1f', 'tail:#6a3a1f', 'cape:#e8c040', 'shorts:#1f2a33', 'lowBoots']],
  ['Xingqiu', 'm', 'sidebang', ['#2f7aa8', '#3a8ab8'], FAIR, '#d9a03a', 'robe', ['#141a22', '#1f5a6a'], '#c9a03a', ['#f4f4f8', '#1f1f22'], ['wideSleeves:#1f4a5a', 'shorts:#1a1f2a', 'hairclip:#e8c26a']],
  ['Xinyan', 'f', 'bun', ['#1f1a1e', '#2a2428'], TAN, '#d9a03a', 'corset', ['#2a1f22', '#2a1f22'], '#d0302a', [TAN, '#2a1f22'], ['locks:#d0302a', 'collar:#d0302a', 'wideSleeves:#f2ece0', 'cape:#a01f24', 'lowBoots', 'braid']],
  ['Yae Miko', 'f', 'long', ['#f0a0b0', '#f2b0c0'], FAIR, '#a060c0', 'kimono', ['#f2f2f2', '#c0302a'], GOLD, [FAIR, '#c0302a'], ['horns:#e8c26a', 'hairclip:#e8c26a', 'wideSleeves:#f2f2f2', 'cape:#c0302a', 'lowBoots']],
  ['Yanfei', 'f', 'long', ['#f09a7a', '#f0b090'], FAIR, '#3fb080', 'corset', ['#b02030', '#1f1f24'], GOLD, [FAIR, '#a01f30'], ['beret:#a01f30', 'elfEars', 'wideSleeves:#f2f2f2', 'shorts:#1f1f24', 'bow:#e8b030']],
  ['Yaoyao', 'c', 'bun', ['#b09a70', '#c0aa80'], FAIR, '#d9902a', 'tunic', ['#a0b83a', '#f2ece0'], '#e8c040', ['#efe6d8', '#efe6d8'], ['goldBuns:#e8b830', 'bow:#8a6a3a', 'wideSleeves:#f2ece0', 'shorts:#3a2a1f', 'backpack:#e0602a']],
  ['Yelan', 'f', 'bob', ['#1f2650', '#2a3060'], FAIR, '#6ab090', 'corset', ['#2a2440', '#1f3fb0'], '#c9b48a', ['#2a2440', '#1a1a2c'], ['collar:#e8f0fa', 'wideSleeves:#8a8a98', 'hairclip:#3fb0e0']],
  ['Yoimiya', 'f', 'ponytail', ['#ecc890', '#e0a870'], FAIR, '#d9902a', 'kimono', ['#e0502a', '#efe6d8'], '#3fa8c0', [FAIR, '#a0241c'], ['flower:#e0502a', 'ahoge:#ecc890', 'shorts:#e0502a', 'cape:#a01f24', 'hairclip:#d0302a', 'lowBoots']],
  ['Yumemizuki Mizuki', 'f', 'long', ['#b8d8d8', '#c8e4e4'], FAIR, '#d060a0', 'kimono', ['#f0c8d8', '#f6f6f6'], '#8a4fc0', [FAIR, '#3a2a55'], ['elfEars', 'tiara:#f6f6f6', 'hairclip:#8a4fc0', 'wideSleeves:#f0c8d8', 'shorts:#f6d0dc', 'lowBoots', 'frillSocks']],
  ['Yun Jin', 'f', 'hime', ['#1f1a2a', '#2a2438'], FAIR, '#c0402a', 'robe', ['#2a2a55', '#f2f2f6'], '#f0a0b0', ['#8a7a9a', '#3a2a55'], ['locks:#1f1a2a', 'operaCrown:#3fa0a8', 'cape:#f090a8', 'collar:#f6f6f6', 'longSkirt:#2a2a55']],
  ['Zhongli', 'm', 'short', ['#3a2a24', '#4a3226'], WARM, '#e8a04a', 'coat', ['#4a2f1e', '#d9c9a8'], '#c9a03a', ['#1f1a18', '#141010'], ['locks:#d9902a', 'braid', 'cape:#c09a2a', 'collar:#d6d6d6']],
  // Сверено с артом: пепельные волосы, острые уши, ледяная корона, белое платье с голубым корсетом и длинные полы с бирюзовыми концами.
  ['Anastasya', 'f', 'long', ['#c9c6cc', '#a8a6b2'], '#fbeee6', '#6f9fe0', 'gown', ['#f2f6fb', '#a8d0ee'], '#e8c26a', ['#f4f6fb', '#dbe9f6'], ['elfEars', 'iceCrown:#8fd0f0', 'openGown:#f2f6fb', 'gownTips:#3fc0c0', 'wideSleeves:#e8f0fa', 'cape:#26325f', 'snowflakes:#9fe6f5']],
  ['Zibai', 'f', 'long', ['#e8e8e8', '#d6d6d6'], FAIR, '#c9a03a', 'gown', ['#f2f4f2', '#3f8a70'], GOLD, ['#f4f4f4', '#f4f4f4'], ['horns:#d9a83a', 'wideSleeves:#a0d0b0', 'cape:#a0d0b0', 'hairclip:#3fb0a0', 'shorts:#f2f4f2']],
];

const BUILDS = { f: 'female', m: 'male', c: 'child' } as const;
const HERO_BY_NAME = new Map(HEROES.map((hero) => [hero.name, hero]));

export const LOOKS = new Map<string, BlockySpec>();

for (const [name, build, hairStyle, hair, skin, eyes, kind, [main, second], trim, [thigh, boot], accessories] of ROWS) {
  const hero = HERO_BY_NAME.get(name);
  if (!hero) throw new Error(`Нет героя для внешности: ${name}`);
  const outfit: Outfit = { kind, main, second, trim, thigh, boot };
  LOOKS.set(heroId(name), {
    build: BUILDS[build], hairStyle, hair, skin, eyes: [eyes, eyes], outfits: [outfit, outfit], accessories,
    weapons: [hero.weapon], elements: [hero.element], tier: 1,
  });
}

// На арте глаза Фурины разного оттенка.
LOOKS.get('furina')!.eyes = ['#2f55c0', '#9fc4f0'];

// Богини носят знак своей атаки, и гибриды его наследуют.
LOOKS.get('columbina')!.accessories.push('moonOrb:#e8e0ff');
LOOKS.get('furina')!.accessories.push('waterHalo:#3fa7f0');
LOOKS.get('anastasya')!.accessories.push('iceShards:#9fe6f5');

// Люди-боссы без своей карточки героя.
const bossOutfit = (main: string, second: string, trim: string, thigh: string, boot: string, kind: OutfitKind = 'coat'): Outfit => ({ kind, main, second, trim, thigh, boot });
export const BOSS_LOOKS: Record<string, BlockySpec> = {
  signora: {
    build: 'female', hairStyle: 'long', hair: ['#f2e0a0', '#e8c878'], skin: FAIR, eyes: ['#7ab4e8', '#7ab4e8'],
    outfits: [bossOutfit('#2a2a3a', '#f2f2f6', GOLD, '#2a2a3a', '#1a1a22', 'gown'), bossOutfit('#2a2a3a', '#c0303a', GOLD, '#2a2a3a', '#1a1a22', 'gown')],
    accessories: ['mask:#c0303a', 'collar:#f3f6fb', 'cape:#1a1a2a', 'longSkirt:#2a2a3a', 'iceShards:#9fe6f5'], weapons: ['catalyst'], elements: ['cryo', 'pyro'], tier: 4,
  },
  dottore: {
    build: 'male', hairStyle: 'short', hair: ['#2a3a6a', '#3f5fa0'], skin: FAIR, eyes: ['#c0303a', '#c0303a'],
    outfits: [bossOutfit('#efe8d8', '#1a2a22', '#8fc73e', '#1a1a22', '#141418'), bossOutfit('#efe8d8', '#1a2a22', '#8fc73e', '#1a1a22', '#141418')],
    accessories: ['mask:#efe8d8', 'collar:#1a2a22', 'cape:#1a2a22', 'weaponRing:#8fc73e'], weapons: ['catalyst'], elements: ['dendro'], tier: 4,
  },
};

export const PAIMON_LOOK: BlockySpec = {
  build: 'child', hairStyle: 'bob', hair: ['#f2f2f6', '#d6dde6'], skin: FAIR, eyes: ['#3f6fd8', '#3f6fd8'],
  outfits: [
    { kind: 'dress', main: '#f2f2f6', second: '#2a2a4a', trim: GOLD, thigh: '#f2f2f6', boot: '#e8c26a' },
    { kind: 'dress', main: '#f2f2f6', second: '#2a2a4a', trim: GOLD, thigh: '#f2f2f6', boot: '#e8c26a' },
  ],
  accessories: ['halo:#ffe9a8', 'cape:#2a2a4a'], weapons: [], elements: [], tier: 1,
};

// Одна причёска, шляпа и пара ушей на голову: иначе гибрид превращается в кашу.
const SLOTS: Array<[string, RegExp]> = [['hat', /^(witchHat|widehat|beret|hood|tiara|veil|topHat|iceCrown|shako|anubis|chefHat|nurseCap|operaCrown)/], ['ears', /^(ears|foxears|wolfears)/], ['tail', /^tail/], ['back', /^(cape|wings)/], ['neck', /^(scarf|collar)/]];
const slotOf = (accessory: string) => SLOTS.find(([, match]) => match.test(accessory))?.[0];

export function mixLooks(a: BlockySpec, b: BlockySpec): BlockySpec {
  const accessories = [...a.accessories];
  for (const accessory of b.accessories) {
    const kind = accessory.split(':')[0];
    if (accessories.some((other) => other.split(':')[0] === kind)) continue;
    const slot = slotOf(accessory);
    if (slot && accessories.some((other) => slotOf(other) === slot)) continue;
    accessories.push(accessory);
  }
  return {
    build: a.build,
    hairStyle: a.hairStyle,
    hair: [a.hair[0], b.hair[0]],
    skin: a.skin,
    eyes: [a.eyes[0], b.eyes[1]],
    outfits: [a.outfits[0], b.outfits[1]],
    accessories,
    weapons: [...new Set([...a.weapons, ...b.weapons])],
    elements: [...new Set([...a.elements, ...b.elements])],
    tier: Math.max(a.tier, b.tier) + 1,
  };
}

const ELEMENT_HEX: Record<Element, string> = {
  pyro: '#ff6a3c', hydro: '#3fa7f0', anemo: '#5fe0bb', electro: '#b57bff', dendro: '#9bd63f', cryo: '#9fe6f5', geo: '#f0bd45',
};

function blend(a: string, b: string, t: number) {
  const parts = [1, 3, 5].map((i) => {
    const x = parseInt(a.slice(i, i + 2), 16);
    const y = parseInt(b.slice(i, i + 2), 16);
    return Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  });
  return `#${parts.join('')}`;
}

// Возвышение не копирует героя: цвета наряда, детали и оружие меняются с каждой ступенью.
function ascend(base: BlockySpec, level: number): BlockySpec {
  const glow = ELEMENT_HEX[base.elements[0]];
  const depth = (level - 1) / 3;
  const outfit = (item: Outfit): Outfit => ({
    ...item,
    main: level === 4 ? blend(item.main, '#1a1630', 0.45) : item.main,
    second: blend(item.second, glow, depth * 0.7),
    trim: level === 4 ? '#ffe27a' : glow,
    boot: blend(item.boot, glow, depth * 0.35),
  });
  const accessories = [...base.accessories, `ascPlates:${glow}`];
  if (level >= 3) accessories.push(`ascWings:${glow}`);
  if (level === 4 && !accessories.some((item) => item.startsWith('halo:'))) accessories.push('halo:#ffe27a');
  if (level === 4) accessories.push(`weaponRing:${glow}`);
  return {
    ...base,
    hair: [base.hair[0], blend(base.hair[1], glow, depth * 0.75)],
    eyes: level === 4 ? [glow, glow] : base.eyes,
    outfits: [outfit(base.outfits[0]), outfit(base.outfits[1])],
    accessories,
    tier: level,
    weaponScale: 1 + (level - 1) * 0.28,
  };
}

// Внешность юнита: герой из таблицы, гибрид собирается из внешности родителей.
export function lookOf(id: string): BlockySpec | null {
  const direct = LOOKS.get(id);
  if (direct) return direct;
  if (id === 'paimon') return PAIMON_LOOK;
  const def = getUnit(id);
  if (!def.parents || id.startsWith('paimon_')) return null;
  if (def.ascension) {
    const base = LOOKS.get(id.replace(/_asc\d$/, ''));
    return base ? ascend(base, def.ascension) : null;
  }
  const a = lookOf(def.parents[0]);
  const b = lookOf(def.parents[1]);
  if (!a || !b) return null;
  const mixed: BlockySpec = { ...mixLooks(a, b), tier: def.tier };
  if (def.rank === 'duo') mixed.accessories.push('ascWings:#ffffff');
  // Высокие ступени обычных гибридов растут на глазах: крылья, кольцо клинков, нимб, огромное оружие.
  if (!def.rank && def.tier >= 4) {
    const glow = ELEMENT_HEX[mixed.elements[0]];
    if (!mixed.accessories.some((item) => item.startsWith('ascWings'))) mixed.accessories.push(`ascWings:${glow}`);
    if (def.tier >= 5) mixed.accessories.push(`weaponRing:${ELEMENT_HEX[mixed.elements[mixed.elements.length - 1]]}`, `ascPlates:${glow}`);
    if (def.tier >= 6 && !mixed.accessories.some((item) => item.startsWith('halo:'))) mixed.accessories.push('halo:#ffe27a');
    if (def.tier >= 7) mixed.accessories = mixed.accessories.map((item) => (item.startsWith('ascWings') ? 'godWings:#ffffff' : item));
    mixed.weaponScale = 1 + (def.tier - 3) * 0.15;
  }
  if (def.rank === 'god') {
    // Каждый год-тир ведёт своя богиня, поэтому варианты не сливаются друг с другом.
    const triad = GOD_TRIADS.find(([god]) => god === id)!;
    const [moon, water, snow] = [lookOf(triad[3])!, lookOf(triad[4])!, lookOf(triad[5])!];
    const order = id === 'god_judgment' ? [water, moon, snow] : id === 'god_endtimes' ? [snow, water, moon] : [moon, water, snow];
    const god = mixLooks(mixLooks(order[0], order[1]), order[2]);
    const wings = id === 'god_judgment' ? '#c070ff' : id === 'god_endtimes' ? '#5fd0ff' : '#ffe27a';
    return { ...god, tier: def.tier, weaponScale: 1.5, accessories: [...god.accessories, `godWings:${wings}`, `weaponRing:${wings}`] };
  }
  return mixed;
}

export { enemyLookKey };
