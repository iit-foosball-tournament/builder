export const TOURNAMENT_TABLE = 'tournament_editions';
export const TEAM_PHOTOS_BUCKET = 'foosball-team-photos';
export const MAX_TEAM_PHOTO_BYTES = 5 * 1024 * 1024;

const PHOTO_PATH = /^teams\/[a-zA-Z0-9_-]{1,80}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;
const PHOTO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const ROOT_KEYS = ['year', 'name', 'subtitle', 'location', 'accessHours', 'isFinished', 'organizers', 'teams', 'matches', 'rounds', 'knockout', 'customTrophies', 'rulesIt', 'rulesEn', 'roundDates'];
const TEAM_KEYS = ['id', 'num', 'name', 'logoColor', 'player1', 'player2', 'photo'];
const MATCH_KEYS = ['id', 'name', 'round', 'roundNum', 'matchNum', 'team1', 'team2', 'score1', 'score2', 'status', 'date', 'time', 'pitch'];

function asError(error, fallbackMessage) {
  const result = new Error(error?.message || fallbackMessage);
  result.code = error?.code;
  return result;
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function keys(value, allowed) {
  return Object.keys(value).every(key => allowed.includes(key));
}

function string(value) {
  return typeof value === 'string';
}

function optionalStrings(value, fields) {
  return fields.every(field => value[field] === undefined || string(value[field]));
}

function optionalNumbers(value, fields) {
  return fields.every(field => value[field] === undefined || (typeof value[field] === 'number' && Number.isFinite(value[field])));
}

function validMatch(match) {
  return object(match) && keys(match, MATCH_KEYS) &&
    string(match.team1) && string(match.team2) &&
    optionalStrings(match, ['id', 'name', 'round', 'status', 'date', 'time', 'pitch']) &&
    optionalNumbers(match, ['roundNum', 'matchNum']) &&
    ['score1', 'score2'].every(key => match[key] === undefined || match[key] === null ||
      (typeof match[key] === 'number' && Number.isFinite(match[key])));
}

export function isTeamPhotoPath(path) {
  return typeof path === 'string' && PHOTO_PATH.test(path);
}

function validRoundDates(roundDates) {
  return object(roundDates) && Object.entries(roundDates).every(
    ([round, date]) => /^\d{1,2}$/.test(round) && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
  );
}

// Public data is a closed schema: arbitrary keys can leak contact details or embedded media.
export function validateEdition(edition) {
  const invalidRoundDates = edition.roundDates !== undefined && !validRoundDates(edition.roundDates);
  if (!object(edition) || !keys(edition, ROOT_KEYS) ||
      !string(edition.name) || !Array.isArray(edition.teams) ||
      !Array.isArray(edition.matches) ||
      !optionalStrings(edition, ['subtitle', 'location', 'accessHours', 'rulesIt', 'rulesEn']) ||
      (edition.year !== undefined && (!Number.isInteger(edition.year) || edition.year < 2000 || edition.year > 2100)) ||
      (edition.isFinished !== undefined && typeof edition.isFinished !== 'boolean') ||
      !edition.teams.every(team => object(team) && keys(team, TEAM_KEYS) &&
        string(team.name) && optionalStrings(team, ['id', 'logoColor', 'player1', 'player2', 'photo']) &&
        optionalNumbers(team, ['num']) && (team.photo === undefined || team.photo === '' || isTeamPhotoPath(team.photo))) ||
      !edition.matches.every(validMatch) ||
      (edition.knockout !== undefined && (!object(edition.knockout) ||
        !Object.values(edition.knockout).every(validMatch))) ||
      (edition.rounds !== undefined && (!Array.isArray(edition.rounds) ||
        !edition.rounds.every(round => object(round) && keys(round, ['name', 'type', 'roundNum', 'knockoutType']) &&
          optionalStrings(round, ['name', 'type', 'knockoutType']) && optionalNumbers(round, ['roundNum'])))) ||
      (edition.organizers !== undefined && (!Array.isArray(edition.organizers) ||
        !edition.organizers.every(person => object(person) && keys(person, ['name', 'email']) &&
          string(person.name) && optionalStrings(person, ['email'])))) ||
      (edition.customTrophies !== undefined && (!Array.isArray(edition.customTrophies) ||
        !edition.customTrophies.every(trophy => object(trophy) && keys(trophy, ['name', 'team', 'description']) &&
          optionalStrings(trophy, ['name', 'team', 'description'])))) ||
      invalidRoundDates) {
    throw new Error('I dati della stagione non sono validi (squadre, partite o foto).');
  }
  return edition;
}

export function mapEditionRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Nessuna stagione inizializzata nel database cloud.');
  }
  const editions = {};
  const revisions = {};
  for (const row of rows) {
    const year = row?.edition_year;
    if (!Number.isInteger(year) || year < 2000 || year > 2100 ||
        !Number.isSafeInteger(row.revision) || row.revision < 1 ||
        Object.hasOwn(editions, year)) {
      throw new Error('Il database contiene una stagione con formato non valido.');
    }
    try {
      validateEdition(row.data);
      if (row.data.year !== undefined && row.data.year !== year) throw new Error('year mismatch');
    } catch {
      throw new Error('Il database contiene una stagione con formato non valido.');
    }
    editions[String(year)] = row.data;
    revisions[String(year)] = row.revision;
  }
  return { editions, revisions, hasRemoteData: true };
}

export async function loadTournamentEditions(client, knownRevisions) {
  if (!client) throw new Error('Connessione cloud non configurata.');
  if (knownRevisions && Object.keys(knownRevisions).length) {
    // Poll only a tiny revision list: do not transfer all 435 matches every minute.
    const { data: rows, error } = await client.from(TOURNAMENT_TABLE)
      .select('edition_year,revision').order('edition_year', { ascending: true });
    if (error) throw asError(error, 'Impossibile controllare gli aggiornamenti.');
    if (Array.isArray(rows) && rows.length === Object.keys(knownRevisions).length &&
        rows.every(row => Number.isSafeInteger(row.revision) && row.revision === knownRevisions[String(row.edition_year)])) return null;
  }
  const { data, error } = await client
    .from(TOURNAMENT_TABLE)
    .select('edition_year,data,revision')
    .order('edition_year', { ascending: true });
  if (error) throw asError(error, 'Impossibile leggere i dati del torneo.');
  return mapEditionRows(data);
}

export async function saveTournamentEdition(client, { year, edition, expectedRevision }) {
  if (!client) throw new Error('Connessione cloud non configurata.');
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2100) {
    throw new Error('Anno del torneo non valido.');
  }
  validateEdition(edition);
  if (edition.year !== undefined && edition.year !== numericYear) throw new Error('Anno della stagione incoerente.');
  const revision = expectedRevision == null ? null : expectedRevision;
  if (revision !== null && (!Number.isSafeInteger(revision) || revision < 1)) {
    throw new Error('Versione locale non valida. Ricarica i dati prima di salvare.');
  }

  const { data, error } = await client.rpc('save_tournament_edition', {
    p_year: numericYear,
    p_data: edition,
    p_expected_revision: revision
  });
  if (error?.message?.includes('TOURNAMENT_REVISION_CONFLICT') || error?.code === '23505') {
    throw new Error('I dati sono stati aggiornati da un’altra sessione. Ricarica la pagina prima di salvare.');
  }
  if (error) throw asError(error, 'Impossibile salvare i dati del torneo.');
  if (!Number.isSafeInteger(data) || data < 1) throw new Error('Risposta di salvataggio non valida.');
  return data;
}

export function resolveTeamPhoto(photo, client) {
  if (typeof photo === 'string' && photo.startsWith('blob:')) return photo; // Local preview only; never persist.
  if (!isTeamPhotoPath(photo) || !client) return '';
  return client.storage.from(TEAM_PHOTOS_BUCKET).getPublicUrl(photo).data.publicUrl;
}

export async function uploadTeamPhoto(client, teamId, file) {
  if (!client) throw new Error('Connessione cloud non configurata.');
  if (!file) throw new Error('Seleziona una foto.');
  if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_TEAM_PHOTO_BYTES) {
    throw new Error('La foto deve essere inferiore a 5 MB e non vuota.');
  }
  const extension = PHOTO_TYPES[file.type];
  if (!extension) throw new Error('Formato non supportato. Usa JPG, PNG o WebP.');
  if (typeof teamId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(teamId)) {
    throw new Error('Identificativo squadra non valido.');
  }
  const path = `teams/${teamId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(TEAM_PHOTOS_BUCKET).upload(path, file, {
    cacheControl: '3600', contentType: file.type, upsert: false
  });
  if (error) throw asError(error, 'Impossibile caricare la foto.');
  return path;
}

export async function cleanupAbandonedTeamPhotos(client) {
  const { data, error } = await client.rpc('list_abandoned_team_photos');
  if (error) throw asError(error, 'Pulizia delle foto abbandonate non riuscita.');
  if (!Array.isArray(data) || data.length > 100 || !data.every(isTeamPhotoPath)) {
    throw new Error('Risposta di pulizia foto non valida.');
  }
  await removeTeamPhotos(client, data);
}

export async function removeTeamPhotos(client, paths) {
  const uniquePaths = [...new Set((paths || []).filter(isTeamPhotoPath))];
  if (!client || uniquePaths.length === 0) return;
  const { error } = await client.storage.from(TEAM_PHOTOS_BUCKET).remove(uniquePaths);
  if (error) throw asError(error, 'Non è stato possibile rimuovere una foto non più utilizzata.');
}
