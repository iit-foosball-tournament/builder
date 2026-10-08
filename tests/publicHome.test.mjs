import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { translations } from '../src/translations.js';

const edition = JSON.parse(readFileSync(new URL('../src/data/database_fallback.json', import.meta.url), 'utf8')).editions['2026'];

test('home previews at most ten teams with the qualification divider after eighth', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: PublicHome } = await server.ssrLoadModule('/src/components/public/PublicHome.jsx');
    for (const lang of ['it', 'en']) {
      assert.match(translations[lang].topStandingsTitle, /Top 10/);
      for (const count of [0, 1, 7, 8, 9, 10, 11, 30]) {
        const standings = edition.teams.slice(0, count);
        const html = renderToStaticMarkup(createElement(PublicHome, {
          edition, standings, lang, t: translations[lang], onNavigateTab() {},
        }));
        const table = html.match(/<table class="mini-standings-table">([\s\S]*?)<\/table>/)?.[1] || '';
        const ranks = [...table.matchAll(/class="pos-badge pos-\d+">(\d+)<\/span>/g)].map(match => Number(match[1]));
        assert.deepEqual(ranks, Array.from({ length: Math.min(count, 10) }, (_, index) => index + 1));
        assert.equal((table.match(/class="cutoff-divider-row"/g) || []).length, count > 8 ? 1 : 0);
        if (count > 8) {
          const cutoff = table.indexOf('class="cutoff-divider-row"');
          assert.ok(cutoff > table.indexOf('class="pos-badge pos-8"'));
          assert.ok(cutoff < table.indexOf('class="pos-badge pos-9"'));
          assert.match(table, /colSpan="7"/i);
          assert.ok(table.includes(translations[lang].cutoffLine));
        }
      }
    }
  } finally {
    await server.close();
  }
});
