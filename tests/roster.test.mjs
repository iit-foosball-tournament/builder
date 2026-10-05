import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const paths = [
  '../../database_foosball.json',
  '../src/data/database_fallback.json',
  '../public/data/data.json',
  '../../iit-foosball-tournament.github.io/data/data.json'
];

const rosters = paths.map(path => {
  const url = new URL(path, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8')).editions['2026'].teams;
});

test('all published and fallback rosters contain 30 complete, email-free teams', () => {
  const reference = rosters[0].map(({ id, num, name, player1, player2 }) => ({ id, num, name, player1, player2 }));
  assert.equal(reference.length, 30);
  for (const [index, teams] of rosters.entries()) {
    assert.deepEqual(teams.map(({ id, num, name, player1, player2 }) => ({ id, num, name, player1, player2 })), reference, paths[index]);
    for (const [position, team] of teams.entries()) {
      assert.equal(team.num, position + 1);
      assert.equal(team.id, `team-${team.num}`);
      for (const value of [team.name, team.player1, team.player2]) {
        assert.ok(typeof value === 'string' && value.trim() && !value.includes('@'), `${paths[index]} team ${team.num}: incomplete or email-containing roster`);
      }
    }
  }
});
