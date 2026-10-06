import test from 'node:test';
import assert from 'node:assert/strict';
import { initialTournamentState, tournamentDraftReducer as reduce } from '../src/tournamentDraft.js';

const edition = name => ({ name, teams: [{ id: 'one', name: 'Team', photo: '' }], matches: [] });
const load = (name, revision, discard = false) => ({ type: 'loaded', result: { editions: { 2026: edition(name) }, revisions: { 2026: revision } }, discard });
const edit = name => ({ type: 'edit', year: '2026', update: current => ({ ...current, name }) });

test('published refresh preserves draft and its original compare-and-swap revision', () => {
  let state = reduce(initialTournamentState({ 2026: edition('fallback') }), load('cloud', 1));
  state = reduce(state, edit('my draft'));
  state = reduce(state, load('colleague saved', 2));
  assert.equal(state.editions[2026].name, 'my draft');
  assert.equal(state.savedEditions[2026].name, 'colleague saved');
  assert.equal(state.revisions[2026], 1);
  assert.equal(state.savedRevisions[2026], 2);
  assert.equal(state.dirty, true);
});

test('sign-out/discard replaces the draft with the last confirmed public snapshot', () => {
  let state = reduce(initialTournamentState({}), load('cloud', 1));
  state = reduce(state, edit('private draft'));
  state = reduce(state, load('new public', 3));
  state = reduce(state, { type: 'discard' });
  assert.equal(state.editions[2026].name, 'new public');
  assert.equal(state.revisions[2026], 3);
  assert.equal(state.dirty, false);
});

test('out-of-order reads cannot roll back either a loaded or just-saved revision', () => {
  let state = reduce(initialTournamentState({}), load('new', 4));
  state = reduce(state, load('old', 2));
  assert.equal(state.savedEditions[2026].name, 'new');
  state = reduce(state, { type: 'saved', year: '2026', edition: edition('my save'), revision: 5 });
  state = reduce(state, load('stale load', 4));
  assert.equal(state.savedEditions[2026].name, 'my save');
  assert.equal(state.revisions[2026], 5);
});

test('functional edits patch the latest state rather than an old upload closure', () => {
  let state = reduce(initialTournamentState({}), load('cloud', 1));
  state = reduce(state, { type: 'edit', year: '2026', update: current => ({ ...current, teams: current.teams.map(team => ({ ...team, player1: 'Updated player' })) }) });
  state = reduce(state, { type: 'edit', year: '2026', update: current => ({ ...current, teams: current.teams.map(team => ({ ...team, photo: 'blob:local-preview' })) }) });
  assert.equal(state.editions[2026].teams[0].player1, 'Updated player');
  state = reduce(state, { type: 'edit', year: '2026', update: current => ({ ...current, teams: [] }) });
  state = reduce(state, { type: 'edit', year: '2026', update: current => ({ ...current, teams: current.teams.map(team => ({ ...team, photo: 'blob:late-preview' })) }) });
  assert.equal(state.editions[2026].teams.length, 0);
});

test('read failures preserve data and drafts; confirmed reload alone discards edits', () => {
  let state = reduce(initialTournamentState({}), load('cloud', 1));
  state = reduce(state, edit('draft'));
  state = reduce(state, { type: 'error', message: 'Offline' });
  assert.equal(state.editions[2026].name, 'draft');
  assert.equal(state.source, 'cloud');
  state = reduce(state, load('cloud', 1, true));
  assert.equal(state.error, '');
  assert.equal(state.dirty, false);
  assert.equal(state.editions[2026].name, 'cloud');
});
