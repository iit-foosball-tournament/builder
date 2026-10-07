import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDefaultRoundDates,
  ensureRoundDates,
  getMatchDate,
  formatDateLabel,
  groupDates,
  isWeekday,
  parseDateIso
} from '../src/roundDates.js';
import { validateEdition } from '../src/tournamentData.js';

const base = {
  name: 'Torneo',
  year: 2026,
  teams: [{ id: 't1', name: 'Team 1', logoColor: '#000' }],
  matches: [
    { id: 'm1', round: 'Giornata 1', roundNum: 1, matchNum: 1, team1: 'Team 1', team2: 'Team 2', score1: null, score2: null, status: 'scheduled', date: '', time: '', pitch: '' }
  ],
  rounds: [{ name: 'Giornata 1', type: 'group', roundNum: 1 }]
};

test('default dates start 5 Oct 2026 and only use weekdays (Mon-Fri)', () => {
  const dates = computeDefaultRoundDates({ count: 30 });
  assert.equal(Object.keys(dates).length, 30);
  assert.equal(dates['1'], '2026-10-05');
  const parse = parseDateIso;
  for (const [round, iso] of Object.entries(dates)) {
    assert.match(round, /^\d{1,2}$/, `round key ${round}`);
    assert.ok(!round.startsWith('0'), `no leading zero ${round}`);
    const d = parse(iso);
    assert.ok(d, `valid date ${iso}`);
    assert.ok(isWeekday(d), `round ${round} date ${iso} must be a weekday`);
  }
  // sorted strictly increasing, one per round
  const values = Object.values(dates);
  assert.ok(values.every((v, i) => i === 0 || v > values[i - 1]), 'strictly increasing');
});

test('ensureRoundDates seeds a missing map and never overwrites an existing one', () => {
  const seeded = ensureRoundDates(base);
  assert.ok(seeded.roundDates && seeded.roundDates['1'], 'seeds round 1');
  assert.equal(seeded.roundDates['1'], '2026-10-05');
  // an existing map (as edited by an admin) must be left untouched
  const edited = { ...base, roundDates: { '1': '2026-12-24' } };
  const kept = ensureRoundDates(edited);
  assert.equal(kept.roundDates['1'], '2026-12-24');
});

test('getMatchDate prefers the giornata date, then explicit date, then today', () => {
  const rd = { '2': '2026-10-06' };
  assert.equal(getMatchDate({ roundNum: 2 }, rd), '2026-10-06');
  assert.equal(getMatchDate({ roundNum: 99, date: '2025-01-02' }, rd), '2025-01-02');
  const today = getMatchDate({ roundNum: 99, date: '' }, {});
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
});

test('formatDateLabel renders a readable weekday + date', () => {
  assert.equal(formatDateLabel('2026-10-05', 'it'), 'Lun 05/10/2026');
  assert.equal(formatDateLabel('2026-10-05', 'en'), 'Mon 05/10/2026');
});

test('groupDates bucketing, preserving order within a date', () => {
  const matches = [
    { id: 'a', roundNum: 1 },
    { id: 'b', roundNum: 2 },
    { id: 'c', roundNum: 1 }
  ];
  const rd = { '1': '2026-10-05', '2': '2026-10-06' };
  const grouped = groupDates(matches, rd);
  assert.deepEqual(grouped['2026-10-05'].map(m => m.id), ['a', 'c']);
  assert.deepEqual(grouped['2026-10-06'].map(m => m.id), ['b']);
});

test('schema accepts roundDates and rejects malformed roundDates keys/values', () => {
  const good = { ...base, roundDates: { '1': '2026-10-05' } };
  assert.doesNotThrow(() => validateEdition(good));
  const badKey = { ...base, roundDates: { 'x': '2026-10-05' } };
  assert.throws(() => validateEdition(badKey));
  const badValue = { ...base, roundDates: { '1': '05/10/2026' } };
  assert.throws(() => validateEdition(badValue));
  assert.throws(() => validateEdition({ ...base, roundDates: 'not-an-object' }));
});
