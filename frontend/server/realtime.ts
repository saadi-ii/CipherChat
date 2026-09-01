/**
 * Shared timings for the polling realtime layer.
 *
 * Vercel Functions cannot hold a WebSocket open, so Socket.IO is replaced by a
 * short-poll against /api/sync. Presence and typing are therefore *expiring
 * facts in MongoDB* rather than connection state held in one process' memory -
 * which also makes them correct across multiple Function instances, something
 * the old in-memory `online` Map never was.
 */

/** A user counts as online if they polled within this window. */
export const PRESENCE_WINDOW_MS = 20_000

/** A typing flag older than this is stale (the client re-asserts while typing). */
export const TYPING_WINDOW_MS = 6_000

/**
 * Cursor overlap. Timestamps are written by the Function, so two instances can
 * disagree by a few hundred ms; re-reading a slice of the recent past costs a
 * duplicate the client de-dupes by _id, while skipping it would lose a message.
 */
export const CURSOR_OVERLAP_MS = 2_000
