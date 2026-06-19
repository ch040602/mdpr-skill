export function inspectStyle(result: { traces: unknown[]; profile: { id: string }; coherenceLock: unknown }) {
  return {
    deckProfile: result.profile.id,
    coherenceLock: result.coherenceLock,
    traces: result.traces,
  };
}
