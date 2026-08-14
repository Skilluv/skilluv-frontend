import type { Notification } from '$lib/types';

/** One displayed row, and how many events it stands for. */
export interface GroupedRow {
	notif: Notification;
	count: number;
}

/** A notification's `data`, for the one key the fold uses. */
function sliceIdOf(n: Notification): string | undefined {
	return (n.data as { slice_id?: string } | null)?.slice_id;
}

/**
 * Fold a list of notifications into displayable rows.
 *
 * Two mechanisms compose here:
 *
 * - the backend has already folded repeated events of the *same kind* on
 *   the *same context* into one row, and kept the tally in `group_count`;
 * - this fold gathers *consecutive* notifications about the same slice,
 *   whatever their kind. One claim otherwise emits five rows in a row
 *   (claimed, fork, PR, CI, validation) and buries everything else.
 *
 * The reported count is the sum: the number of events the row actually
 * stands for. Showing one number per mechanism would give the reader two
 * figures for the same thing.
 *
 * Read and unread rows never merge: marking a row read has to be an action
 * whose result you can see.
 */
export function foldNotifications(items: Notification[]): GroupedRow[] {
	const out: GroupedRow[] = [];
	for (const n of items) {
		const events = Math.max(1, n.group_count ?? 1);
		const sliceId = sliceIdOf(n);
		const prev = out[out.length - 1];
		if (sliceId && prev && sliceIdOf(prev.notif) === sliceId && prev.notif.read === n.read) {
			prev.count += events;
			continue;
		}
		out.push({ notif: n, count: events });
	}
	return out;
}

/**
 * "Fatou and 2 others", from the people the backend kept.
 *
 * It only keeps the four most recent, so the remainder comes from
 * `group_count` rather than from the list. Nothing to show when nobody is
 * named: a bare tally is rendered elsewhere, and "3 people" without names
 * teaches the reader nothing.
 */
export function actorsLine(
	n: Notification,
	t: (key: string, params?: Record<string, string | number>) => string
): string {
	const names = (n.group_actors ?? [])
		.map((a) => a.username)
		.filter((u): u is string => Boolean(u));
	if (names.length === 0) return '';

	const others = Math.max(0, (n.group_count ?? 1) - names.length);
	if (others > 0) {
		return t('notifTypes.actorsAndOthers', { names: names.join(', '), n: others });
	}
	if (names.length === 1) return names[0];
	return t('notifTypes.actorsLast', {
		names: names.slice(0, -1).join(', '),
		last: names[names.length - 1]
	});
}
