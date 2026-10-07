// Round-date mapping: each "giornata" (matchday, roundNum) is tied to a calendar date.
// The giornata number is a legacy grouping inherited from the original Excel sheet; the
// visible organizing principle is now the DATE. Admins edit dates in the builder's
// "Giornate & Date" section; by default we seed Giornata 1 -> the season start date and
// then the following weekdays (Mon-Fri only) for every remaining giornata.

export const DEFAULT_START_DATE = '2026-10-05';
const WEEKDAY_NAMES_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const WEEKDAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Parse a strict 'YYYY-MM-DD' string as a UTC date (no timezone drift). Returns null if invalid.
export function parseDateIso(iso) {
  if (typeof iso !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
}

export function toIso(d) {
  return d.toISOString().slice(0, 10);
}

export function isWeekday(d) {
  const w = d.getUTCDay();
  return w !== 0 && w !== 6;
}

// Deterministic default mapping: roundNum 1 = start date, then the next weekdays (Mon-Fri).
export function computeDefaultRoundDates({ start = DEFAULT_START_DATE, count = 30 } = {}) {
  const cursor = parseDateIso(start) || new Date(Date.UTC(2026, 9, 5));
  const dates = {};
  let n = 0;
  while (n < count) {
    if (isWeekday(cursor)) {
      n += 1;
      dates[String(n)] = toIso(cursor);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

// Give an edition a roundDates map covering every group round it references (fallback only
// seeds when the map is missing, so admin edits are never overwritten on later loads).
export function ensureRoundDates(edition) {
  if (!edition) return edition;
  if (edition.roundDates && typeof edition.roundDates === 'object') return edition;
  let maxRoundNum = 0;
  for (const match of edition.matches || []) {
    if (Number.isFinite(match.roundNum) && match.roundNum > maxRoundNum) maxRoundNum = match.roundNum;
  }
  for (const round of edition.rounds || []) {
    if (round && round.type !== 'knockout' && Number.isFinite(round.roundNum) && round.roundNum > maxRoundNum) {
      maxRoundNum = round.roundNum;
    }
  }
  const count = Math.max(1, maxRoundNum);
  return { ...edition, roundDates: computeDefaultRoundDates({ count }) };
}

// Effective date of a match: the giornata date, falling back to an explicit match date
// (legacy/override), then today (per the "default to today when nothing is set" rule).
export function getMatchDate(match, roundDates) {
  const matchday = (roundDates || {})[String(match && match.roundNum)];
  if (matchday) return matchday;
  if (match && match.date) return match.date;
  return toIso(new Date());
}

// Sortable numeric rank for a date (YYYY-MM-DD sorts correctly as a string too).
export function groupDates(matches, roundDates) {
  const byDate = {};
  for (const m of matches || []) {
    const date = getMatchDate(m, roundDates);
    (byDate[date] = byDate[date] || []).push(m);
  }
  return byDate;
}

export function formatDateLabel(iso, lang = 'it') {
  const d = parseDateIso(iso);
  if (!d) return iso;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const names = lang === 'en' ? WEEKDAY_NAMES_EN : WEEKDAY_NAMES_IT;
  return `${names[d.getUTCDay()]} ${dd}/${mm}/${yyyy}`;
}
