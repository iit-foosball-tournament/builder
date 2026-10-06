import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isTeamPhotoPath, loadTournamentEditions, mapEditionRows, MAX_TEAM_PHOTO_BYTES,
  removeTeamPhotos, resolveTeamPhoto, saveTournamentEdition, uploadTeamPhoto,
  validateEdition, cleanupAbandonedTeamPhotos
} from '../src/tournamentData.js';

const edition = { name: 'Open', teams: [{ id: 'team-1', name: 'Example', photo: '' }], matches: [
  { team1: 'Example', team2: 'Rivals', round: 'Day 1', score1: null, score2: 1 }
], knockout: { final: { team1: 'Example', team2: 'Rivals' } } };
const row = (year, data = edition, revision = 1) => ({ edition_year: year, data, revision });
const photo = 'teams/team-1/123e4567-e89b-42d3-a456-426614174000.webp';

function clientForSave(response) {
  const calls = [];
  return {
    calls,
    rpc(name, params) { calls.push([name, params]); return Promise.resolve(response); },
    from() { throw new Error('Direct table writes are forbidden'); }
  };
}

test('real bundled edition satisfies the save contract without a fixed team count', () => {
  const bundled = JSON.parse(readFileSync(new URL('../src/data/database_fallback.json', import.meta.url)));
  assert.equal(validateEdition(bundled.editions['2026']), bundled.editions['2026']);
  assert.equal(validateEdition(edition), edition);
  assert.equal(validateEdition({ name: 'Fresh', teams: [], matches: [] }).teams.length, 0);
});

test('remote rows are authoritative: no fallback season is resurrected', () => {
  const result = mapEditionRows([row(2027, edition, 4)], { 2026: edition });
  assert.deepEqual(Object.keys(result.editions), ['2027']);
  assert.deepEqual(result.revisions, { 2027: 4 });
  assert.equal(result.hasRemoteData, true);
});

test('successful empty cloud read fails clearly rather than silently showing fallback', async () => {
  assert.throws(() => mapEditionRows([], { 2026: edition }), /Nessuna stagione inizializzata/);
  await assert.rejects(loadTournamentEditions({ from() {
    return { select() { return { order: async () => ({ data: [], error: null }) }; } };
  } }, { 2026: edition }), /Nessuna stagione inizializzata/);
});

test('cloud read requests only public columns and reports failed reads', async () => {
  const client = { from(table) {
    assert.equal(table, 'tournament_editions');
    return { select(columns) {
      assert.equal(columns, 'edition_year,data,revision');
      return { order: async () => ({ data: [row(2026)], error: null }) };
    } };
  } };
  assert.deepEqual((await loadTournamentEditions(client)).revisions, { 2026: 1 });
  await assert.rejects(loadTournamentEditions({ from() {
    return { select() { return { order: async () => ({ error: { message: 'network' } }) }; } };
  } }), /network/);
});

test('rejects malformed rows, duplicate years, mismatched edition and broken revisions', () => {
  for (const bad of [row('2026'), row(1999), row(2026, edition, 0), row(2026, edition, '1'),
    row(2026, { ...edition, year: 2027 }), row(2026, { ...edition, matches: [null] }),
    row(2026, { ...edition, teams: [{ name: 0 }] })]) {
    assert.throws(() => mapEditionRows([bad]), /formato non valido/);
  }
  assert.throws(() => mapEditionRows([row(2026), row(2026)]), /formato non valido/);
});

test('schema rejects unknown keys, leaked emails, render-crashing members and embedded photos', () => {
  const variants = [
    { ...edition, email: 'private@iit.it' },
    { ...edition, teams: null },
    { ...edition, teams: [null] },
    { ...edition, teams: [{ name: 'X', email: 'private@iit.it' }] },
    { ...edition, teams: [{ name: 'X', player1: 123 }] },
    { ...edition, teams: [{ name: 'X', photo: 'data:image/png;base64,AAA' }] },
    { ...edition, teams: [{ name: 'X', photo: 'blob:preview' }] },
    { ...edition, teams: [{ name: 'X', photo: 'https://example.com/a.png' }] },
    { ...edition, matches: [{ team1: null, team2: 'X' }] },
    { ...edition, matches: [{ team1: 'X', team2: [] }] },
    { ...edition, matches: [{ team1: 'X', team2: 'Y', email: 'private' }] },
    { ...edition, knockout: [] },
    { ...edition, knockout: { final: null } },
    { ...edition, knockout: { final: { team1: 'A', team2: 7 } } },
    { ...edition, organizers: [{ name: 'X', privateEmail: 'private' }] },
    { ...edition, rounds: [null] }
  ];
  for (const bad of variants) assert.throws(() => validateEdition(bad), /non sono validi/);
  assert.doesNotThrow(() => validateEdition({ ...edition, teams: [{ name: 'X', photo }] }));
});

test('RPC owns revision, author, time and insert/update paths', async () => {
  const client = clientForSave({ data: 5, error: null });
  assert.equal(await saveTournamentEdition(client, { year: '2026', edition, expectedRevision: 4, userId: 'spoof' }), 5);
  assert.deepEqual(client.calls, [['save_tournament_edition', {
    p_year: 2026, p_data: edition, p_expected_revision: 4
  }]]);
  const insert = clientForSave({ data: 1, error: null });
  assert.equal(await saveTournamentEdition(insert, { year: 2026, edition }), 1);
  assert.equal(insert.calls[0][1].p_expected_revision, null);
});

test('refuses stale, duplicate-create and authorization failures; never calls RPC on invalid input', async () => {
  for (const expectedRevision of [0, -1, '2', 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const client = clientForSave({ data: 1 });
    await assert.rejects(saveTournamentEdition(client, { year: 2026, edition, expectedRevision }), /Versione/);
    assert.equal(client.calls.length, 0);
  }
  const client = clientForSave({ data: null, error: { code: 'P0001', message: 'TOURNAMENT_REVISION_CONFLICT' } });
  await assert.rejects(saveTournamentEdition(client, { year: 2026, edition }), /un’altra sessione/);
  const duplicate = clientForSave({ data: null, error: { code: '23505', message: 'conflict' } });
  await assert.rejects(saveTournamentEdition(duplicate, { year: 2026, edition }), /un’altra sessione/);
  const forbidden = clientForSave({ data: null, error: { code: '42501', message: 'Not an approved tournament editor' } });
  await assert.rejects(saveTournamentEdition(forbidden, { year: 2026, edition }), /approved tournament editor/);
  await assert.rejects(saveTournamentEdition(clientForSave({ data: null }), { year: 2026, edition, expectedRevision: 1 }), /Risposta/);
  await assert.rejects(saveTournamentEdition(clientForSave({ data: 1 }), { year: 2026, edition: { ...edition, year: 2027 } }), /incoerente/);
});

test('only canonical storage paths resolve publicly; blob is a local preview', () => {
  const calls = [];
  const client = { storage: { from(bucket) {
    assert.equal(bucket, 'foosball-team-photos');
    return { getPublicUrl(path) { calls.push(path); return { data: { publicUrl: `https://storage.test/${path}` } }; } };
  } } };
  assert.equal(resolveTeamPhoto(photo, client), `https://storage.test/${photo}`);
  assert.equal(resolveTeamPhoto('blob:local', client), 'blob:local');
  for (const input of ['', 'https://evil.test/a', 'data:image/png;base64,AAA', 'teams/../oops',
    'teams/a/a.jpg', 'teams/a/123e4567-e89b-42d3-a456-426614174000.svg', null]) {
    assert.equal(resolveTeamPhoto(input, client), '');
    assert.equal(isTeamPhotoPath(input), false);
  }
  assert.deepEqual(calls, [photo]);
});

test('upload restricts mime, size, team id and does not overwrite', async () => {
  const uploads = [];
  const client = { storage: { from(bucket) {
    assert.equal(bucket, 'foosball-team-photos');
    return { upload: async (...args) => { uploads.push(args); return { error: null }; } };
  } } };
  const path = await uploadTeamPhoto(client, 'team-1', { size: MAX_TEAM_PHOTO_BYTES, type: 'image/webp' });
  assert.equal(isTeamPhotoPath(path), true);
  assert.equal(uploads[0][2].upsert, false);
  for (const file of [null, { size: 0, type: 'image/png' }, { size: MAX_TEAM_PHOTO_BYTES + 1, type: 'image/png' },
    { size: 12, type: 'image/svg+xml' }, { size: 12, type: 'image/png; charset=utf-8' }]) {
    await assert.rejects(uploadTeamPhoto(client, 'team-1', file));
  }
  await assert.rejects(uploadTeamPhoto(client, '../bad', { size: 12, type: 'image/png' }), /Identificativo/);
  assert.equal(uploads.length, 1);
});

test('migration keeps compare-and-swap and deletion authorization server-side', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261006170000_enforce_save_contract.sql', import.meta.url), 'utf8');
  assert.match(sql, /security definer\s+set search_path = ''/i);
  assert.match(sql, /not public\.is_tournament_editor\(\)/);
  assert.match(sql, /on conflict \(edition_year\) do nothing/);
  assert.match(sql, /where edition_year = p_year for update/);
  assert.match(sql, /current_revision <> p_expected_revision/);
  assert.match(sql, /revision = revision \+ 1/);
  assert.match(sql, /updated_by = \(select auth\.uid\(\)\)/);
  assert.match(sql, /grant select on table public\.tournament_editions to anon, authenticated/);
  assert.match(sql, /alter table public\.tournament_editions drop column updated_by/);
  assert.match(sql, /insert into private\.tournament_edition_authors/);
  assert.match(sql, /for key share/);
  assert.match(sql, /lock table public\.tournament_editions in share mode/);
  assert.match(sql, /team->>'photo' = p_name/);
  assert.match(sql, /private\.team_photo_unreferenced\(name\)/);
  assert.doesNotMatch(sql, /grant (?:insert|update|delete) on table public\.tournament_editions/i);
});

test('revision checks avoid downloading unchanged tournament data', async () => {
  const selects = [];
  const client = { from() { return { select(columns) {
    selects.push(columns);
    return { order: async () => ({ data: [{ edition_year: 2026, revision: 4 }], error: null }) };
  } }; } };
  assert.equal(await loadTournamentEditions(client, { 2026: 4 }), null);
  assert.deepEqual(selects, ['edition_year,revision']);
});

test('abandoned-photo cleanup uses bounded server selection and validates its response', async () => {
  const removed = [];
  const client = {
    rpc: async name => { assert.equal(name, 'list_abandoned_team_photos'); return { data: [photo], error: null }; },
    storage: { from: () => ({ remove: async paths => { removed.push(paths); return { error: null }; } }) }
  };
  await cleanupAbandonedTeamPhotos(client);
  assert.deepEqual(removed, [[photo]]);
  client.rpc = async () => ({ data: ['https://invalid.test/path'], error: null });
  await assert.rejects(cleanupAbandonedTeamPhotos(client), /non valida/);
  client.rpc = async () => ({ data: Array(101).fill(photo), error: null });
  await assert.rejects(cleanupAbandonedTeamPhotos(client), /non valida/);
});

test('cleanup deduplicates canonical paths and excludes untrusted URLs, blobs and malformed objects', async () => {
  const removed = [];
  const client = { storage: { from() { return { remove: async paths => { removed.push(paths); return { error: null }; } }; } } };
  await removeTeamPhotos(client, [photo, photo, 'teams/../anything', 'blob:local', 'https://evil.test', 4]);
  assert.deepEqual(removed, [[photo]]);
  await removeTeamPhotos(client, ['data:photo', 'teams/a/x.jpg']);
  assert.equal(removed.length, 1);
});
