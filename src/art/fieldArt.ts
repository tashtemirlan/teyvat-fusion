// Фон поля боя: блочная земля, стена слева и портал врагов справа. Свой вид у каждого мира.
export interface FieldTheme {
  light: string;
  dark: string;
  accent: string;
  sky: [string, string];
  wall: string;
  hills: string;
}

export const FIELD_THEMES: FieldTheme[] = [
  { light: '#67ad4f', dark: '#5a9c45', accent: '#f2e27a', sky: ['#5fb4ea', '#bfe6f5'], wall: '#8d8f98', hills: '#3f7f4a' }, // Мондштадт
  { light: '#a5b552', dark: '#94a549', accent: '#e8913a', sky: ['#e8a860', '#f8dfa8'], wall: '#a58a5e', hills: '#6f7f3f' }, // Ли Юэ
  { light: '#6f7fb0', dark: '#6271a2', accent: '#f2a0c0', sky: ['#3f3a7a', '#a884c8'], wall: '#54506e', hills: '#3a3a66' }, // Инадзума
  { light: '#4fa06a', dark: '#44905e', accent: '#c8e04a', sky: ['#2f8a70', '#a8dfae'], wall: '#7a6a48', hills: '#256a4f' }, // Сумеру
  { light: '#5f9fc0', dark: '#538fb0', accent: '#e8f4ff', sky: ['#3f8fd8', '#bfe8f5'], wall: '#9fb0c4', hills: '#2f6a9a' }, // Фонтейн
  { light: '#a56a42', dark: '#945d3a', accent: '#ff8a3c', sky: ['#7a2f2a', '#f0904a'], wall: '#54403a', hills: '#4f2a24' }, // Натлан
  { light: '#5a6a9a', dark: '#4f5e8c', accent: '#d8c8ff', sky: ['#1f2a55', '#6a70b0'], wall: '#5a5a78', hills: '#2a2f5a' }, // Нод-Край
  { light: '#d6e4f0', dark: '#c6d6e6', accent: '#8fd0f0', sky: ['#7a9ac0', '#dfeaf5'], wall: '#8a9ab0', hills: '#a8bcd2' }, // Снежная
  { light: '#6a5a9a', dark: '#5e4f8c', accent: '#ffe27a', sky: ['#1a1640', '#5a3f90'], wall: '#46406a', hills: '#2a2458' }, // Вне регионов и бесконечный режим
];

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const shade = (hex: string, amount: number) => {
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  return `rgb(${channels(hex).map((v) => Math.round(v + (target - v) * t)).join(',')})`;
};
const noise = (x: number, y: number) => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export interface FieldLayout {
  width: number;
  height: number;
  boardX: number;
  boardY: number;
  cellW: number;
  cellH: number;
  rows: number;
  cols: number;
}

const BLOCKS = 8;

export function paintField(canvas: HTMLCanvasElement, theme: FieldTheme, layout: FieldLayout, night: boolean, scale: number) {
  const { width, height, boardX, boardY, cellW, cellH, rows, cols } = layout;
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Небо и холмы за верхней линией.
  const sky = ctx.createLinearGradient(0, 0, 0, boardY);
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, boardY + 2);
  const step = cellW / 3;
  for (let x = 0; x < width; x += step) {
    const peak = (0.35 + noise(Math.floor(x / step), 7) * 0.5) * boardY;
    ctx.fillStyle = shade(theme.hills, (noise(Math.floor(x / step), 3) - 0.5) * 0.12);
    ctx.fillRect(x, boardY - peak, step + 1, peak + 2);
  }

  // Клетки из пиксельных блоков.
  const blockW = cellW / BLOCKS;
  const blockH = cellH / BLOCKS;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const base = (row + col) % 2 === 0 ? theme.light : theme.dark;
      const cx = boardX + col * cellW;
      const cy = boardY + row * cellH;
      for (let by = 0; by < BLOCKS; by++) {
        for (let bx = 0; bx < BLOCKS; bx++) {
          const n = noise(col * 8 + bx, row * 8 + by);
          const edge = by === BLOCKS - 1 ? -0.1 : by === 0 ? 0.05 : 0;
          ctx.fillStyle = shade(base, (n - 0.5) * 0.14 + edge);
          ctx.fillRect(cx + bx * blockW, cy + by * blockH, blockW + 0.5, blockH + 0.5);
        }
      }
      // Редкие цветы и камешки оживляют поле, но не мешают читать юнитов.
      if (noise(col * 3.1, row * 5.7) > 0.84) {
        const fx = cx + (1 + Math.floor(noise(col, row * 2) * 6)) * blockW;
        const fy = cy + (1 + Math.floor(noise(col * 2, row) * 6)) * blockH;
        ctx.fillStyle = theme.accent;
        ctx.fillRect(fx, fy, blockW, blockH);
        ctx.fillStyle = shade(base, -0.3);
        ctx.fillRect(fx, fy + blockH, blockW, blockH);
      }
    }
  }

  // Каменная стена, которую защищают герои.
  const wallW = boardX;
  for (let y = 0; y < height; y += blockH * 2) {
    for (let x = 0; x < wallW; x += blockW * 2) {
      const offset = Math.floor(y / (blockH * 2)) % 2 ? blockW : 0;
      ctx.fillStyle = shade(theme.wall, (noise(x, y) - 0.5) * 0.3);
      ctx.fillRect(x - offset, y, blockW * 2 - 1, blockH * 2 - 1);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(wallW - blockW * 0.4, 0, blockW * 0.4, height);

  // Тёмный разлом, откуда идут враги.
  const gateX = boardX + cols * cellW;
  const gate = ctx.createLinearGradient(gateX, 0, width, 0);
  gate.addColorStop(0, shade(theme.dark, -0.55));
  gate.addColorStop(1, '#100a24');
  ctx.fillStyle = gate;
  ctx.fillRect(gateX, 0, width - gateX, height);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(190,120,255,${0.15 + noise(i, 2) * 0.5})`;
    ctx.fillRect(gateX + noise(i, 5) * (width - gateX), noise(i, 9) * height, blockW * 0.7, blockH * 0.7);
  }

  // Нижняя кромка земли.
  const bottom = boardY + rows * cellH;
  ctx.fillStyle = shade(theme.dark, -0.5);
  ctx.fillRect(boardX, bottom, cols * cellW, height - bottom);

  if (night) {
    ctx.fillStyle = 'rgba(12,16,52,0.5)';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = 'rgba(255,255,240,0.8)';
      ctx.fillRect(noise(i, 11) * width, noise(i, 13) * boardY, 2, 2);
    }
  }
}
