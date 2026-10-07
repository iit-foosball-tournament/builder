import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDateIso,
  formatDateLabel,
  matchDate,
  hasDate,
  matchDateKey,
  groupMatchesByDate,
  sortByDate,
  NO_DATE
} from '../src/roundDates.js';
import { validateEdition } from '../src/tournamentData.js';

const base = {
  name: 'Torneo',
  year: 2026,
  teams: [{ id: 't1', name: 'Team 1', logoColor: '#000' }],
  matches: [
    { id: 'm1', team1: 'Team 1', team2: 'Team 2', score1: null, score2: null, status: 'scheduled', date: '', time: '', pitch: '' }
  ]
};

test('parseDateIso validates strict YYYY-MM-DD', () => {
  assert.ok(parseDateIso('2026-10-05'));
  assert.equal(parseDateIso('2026-10-05').getUTCDate(), 5);
  assert.equal(parseDateIso('05/10/2026'), null);
  assert.equal(parseDateIso('garbage'), null);
  assert.equal(parseDateIso(null), null);
});

test('formatDateLabel renders a readable weekday + date', () => {
  assert.equal(formatDateLabel('2026-10-05', 'it'), 'Lun 05/10/2026');
  assert.equal(formatDateLabel('2026-10-05', 'en'), 'Mon 05/10/2026');
});

test('matchDate / hasDate read the optional per-match date', () => {
  assert.equal(matchDate({ date: '2026-10-07' }), '2026-10-07');
  assert.equal(matchDate({ date: ' 2026-10-07 ' }), '2026-10-07');
  assert.equal(matchDate({ date: '' }), '');
  assert.equal(matchDate({}), '');
  assert.equal(matchDate(null), '');
  assert.equal(hasDate({ date: '2026-10-07' }), true);
  assert.equal(hasDate({ date: '' }), false);
});

test('matchDateKey maps undated matches to the NO_DATE sentinel', () => {
  assert.equal(matchDateKey({ date: '2026-10-07' }), '2026-10-07');
  assert.equal(matchDateKey({ date: '' }), NO_DATE);
  assert.equal(matchDateKey({}), NO_DATE);
});

test('groupMatchesByDate buckets by date; undated share one bucket', () => {
  const matches = [
    { id: 'a', date: '2026-10-05' },
    { id: 'b', date: '2026-10-07' },
    { id: 'c', date: '2026-10-05' },
    { id: 'd', date: '' }
  ];
  const grouped = groupMatchesByDate(matches);
  assert.deepEqual(grouped['2026-10-05'].map(m => m.id), ['a', 'c']);
  assert.deepEqual(grouped['2026-10-07'].map(m => m.id), ['b']);
  assert.deepEqual(grouped[NO_DATE].map(m => m.id), ['d']);
});

test('sortByDate puts dated matches (oldest first) before undated ones', () => {
  const matches = [
    { id: 'late', date: '2026-11-02' },
    { id: 'nodate', date: '' },
    { id: 'early', date: '2026-10-05' },
    { id: 'nodate2' }
  ];
  const sorted = sortByDate(matches).map(m => m.id);
  assert.deepEqual(sorted, ['early', 'late', 'nodate', 'nodate2']);
});

test('schema still accepts a persisted roundDates map and undated matches', () => {
  // Existing stored data may still contain the (now unused) roundDates metadata;
  // it must keep validating so nothing is dropped.
  assert.doesNotThrow(() => validateEdition({ ...base, roundDates: { '1': '2026-10-05' } }));
  assert.doesNotThrow(() => validateEdition(base));
});
