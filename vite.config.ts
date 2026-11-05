import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const SPRITES = resolve('public/sprites');

const readBody = async (req: AsyncIterable<Buffer>) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
};

// Только для локальной разработки: сохраняет спрайты, готовые в tools/bake.html.
const bakePlugin = (): Plugin => ({
  name: 'bake-sprites',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/bake/save', async (req, res) => {
      const id = new URL(req.url!, 'http://local').searchParams.get('id') ?? '';
      if (!/^[a-z0-9_]+$/.test(id)) {
        res.statusCode = 400;
        res.end('bad id');
        return;
      }
      mkdirSync(SPRITES, { recursive: true });
      writeFileSync(join(SPRITES, `${id}.png`), await readBody(req));
      res.end('ok');
    });
    server.middlewares.use('/bake/report', async (req, res) => {
      mkdirSync(SPRITES, { recursive: true });
      const results = JSON.parse((await readBody(req)).toString()) as Record<string, string>;
      writeFileSync(join(SPRITES, 'report.json'), JSON.stringify(results, null, 2));
      const done = readdirSync(SPRITES).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4));
      writeFileSync(join(SPRITES, 'manifest.json'), JSON.stringify(done));
      res.end('ok');
    });
  },
});

export default defineConfig({ plugins: [bakePlugin()], build: { target: 'esnext' } });
