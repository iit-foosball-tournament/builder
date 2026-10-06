// Drafts and published data stay separate, including while previewing or refreshing.
export function initialTournamentState(fallback) {
  return { editions: fallback, savedEditions: fallback, revisions: {}, savedRevisions: {}, dirty: false, source: 'fallback', error: '' };
}

export function tournamentDraftReducer(state, action) {
  switch (action.type) {
    case 'loaded': {
      const savedEditions = { ...action.result.editions };
      const revisions = { ...action.result.revisions };
      // Realtime reads may complete out of order. Never regress a confirmed revision.
      for (const [year, revision] of Object.entries(state.savedRevisions)) {
        if (revision > (revisions[year] || 0)) {
          savedEditions[year] = state.savedEditions[year];
          revisions[year] = revision;
        }
      }
      const preserve = state.dirty && !action.discard;
      return { ...state, savedEditions, savedRevisions: revisions, revisions: preserve ? state.revisions : revisions,
        editions: preserve ? state.editions : savedEditions, dirty: preserve, source: 'cloud', error: '' };
    }
    case 'edit':
      return { ...state, editions: { ...state.editions, [action.year]: action.update(state.editions[action.year]) }, dirty: true };
    case 'saved':
      return { ...state, editions: { ...state.editions, [action.year]: action.edition },
        savedEditions: { ...state.savedEditions, [action.year]: action.edition },
        revisions: { ...state.revisions, [action.year]: action.revision },
        savedRevisions: { ...state.savedRevisions, [action.year]: action.revision }, dirty: false, source: 'cloud', error: '' };
    case 'discard':
      return { ...state, editions: state.savedEditions, revisions: state.savedRevisions, dirty: false };
    case 'error':
      return { ...state, error: action.message };
    default:
      return state;
  }
}
