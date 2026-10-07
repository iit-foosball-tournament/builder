// Match date/round helpers.
// A match optionally carries its own 'YYYY-MM-DD' date (set by the admin) and belongs
// to an Excel round/giornata (match.roundNum / match.round). For display, matches with a
// date are grouped under their date (chronologically first); matches without a date are
// grouped under their Excel giornata.

export const NO_DATE = '__no_date__';
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

// The match's own date as a trimmed 'YYYY-MM-DD' string ('' when none).
export function matchDate(match) {
  if (!match || typeof match.date !== 'string') return '';
  return match.date.trim();
}

export function hasDate(match) {
  return matchDate(match) !== '';
}

// Stable sort key for grouping: dated matches first (oldest first), undated last.
export function matchDateKey(match) {
  return matchDate(match) || NO_DATE;
}

// Group matches by date. Matches without a date all fall under the NO_DATE sentinel.
export function groupMatchesByDate(matches) {
  const byDate = {};
  for (const m of matches || []) {
    const key = matchDateKey(m);
    (byDate[key] = byDate[key] || []).push(m);
  }
  return byDate;
}

// Sort dated matches chronologically first, then the undated ones at the end.
export function sortByDate(matches) {
  return [...(matches || [])].sort((a, b) => {
    const aKey = matchDateKey(a);
    const bKey = matchDateKey(b);
    if (aKey === bKey) return 0;
    if (aKey === NO_DATE) return 1; // undated always last
    if (bKey === NO_DATE) return -1;
    return aKey < bKey ? -1 : 1;
  });
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

// ****************************************************************************
// Excel-round (giornata) helpers
// ****************************************************************************

// Numeric round of a match (from the Excel scheduling). Falls back to Infinity so
// matches without a round go last.
export function matchRoundNum(match) {
  if (match && match.roundNum != null) {
    const n = Number(match.roundNum);
    if (!Number.isNaN(n)) return n;
  }
  if (match && typeof match.round === 'string') {
    const n = parseInt(match.round.replace(/\D+/g, ''), 10);
    if (!Number.isNaN(n)) return n;
  }
  return Infinity;
}

export function matchRoundLabel(match) {
  const n = matchRoundNum(match);
  return Number.isFinite(n) ? `Giornata ${n}` : (match && match.round ? match.round : 'Giornata');
}

// Build ordered display groups: dated matches first (grouped by date, chronologically),
// then undated matches grouped by their Excel giornata.
export function buildDisplayGroups(matches, lang = 'it') {
  const list = matches || [];
  const groups = [];
  const dated = list.filter(hasDate);
  const undated = list.filter(m => !hasDate(m));

  const byDate = groupMatchesByDate(dated);
  for (const d of Object.keys(byDate).sort()) {
    groups.push({ type: 'date', key: `date|${d}`, label: formatDateLabel(d, lang), matches: byDate[d] });
  }

  const byRound = {};
  for (const m of undated) {
    const rn = matchRoundNum(m);
    (byRound[rn] = byRound[rn] || []).push(m);
  }
  for (const rn of Object.keys(byRound).map(Number).sort((a, b) => a - b)) {
    groups.push({
      type: 'round',
      key: `round|${rn}`,
      label: Number.isFinite(rn) ? `Giornata ${rn}` : 'Giornata',
      matches: byRound[rn]
    });
  }
  return groups;
}
