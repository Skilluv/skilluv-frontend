import { describe, it, expect } from 'vitest';
import { foldNotifications, actorsLine } from '$lib/utils/notificationGrouping';
import type { Notification } from '$lib/types';

/** A minimal notification, with the fields a test cares about applied over it. */
function notif(over: Partial<Notification> = {}): Notification {
	return {
		id: over.id ?? 'n1',
		user_id: 'u1',
		notification_type: 'social.mention',
		kind: 'social.mention',
		title: 'Titre',
		body: null,
		data: null,
		read: false,
		group_count: 1,
		group_actors: [],
		created_at: '2026-01-01T00:00:00Z',
		updated_at: null,
		...over
	};
}

/** Test translator: echoes the key and its params, with no catalogue. */
const t = (key: string, params: Record<string, string | number> = {}) =>
	`${key}(${Object.entries(params)
		.map(([k, v]) => `${k}=${v}`)
		.join(',')})`;

describe('foldNotifications', () => {
	it('counts one event per row when nothing is grouped', () => {
		const rows = foldNotifications([notif({ id: 'a' }), notif({ id: 'b' })]);
		expect(rows).toHaveLength(2);
		expect(rows.map((r) => r.count)).toEqual([1, 1]);
	});

	it('takes the backend tally rather than counting rows', () => {
		const rows = foldNotifications([notif({ group_count: 5 })]);
		expect(rows[0].count).toBe(5);
	});

	it('folds consecutive notifications about the same slice', () => {
		const rows = foldNotifications([
			notif({ id: 'a', data: { slice_id: 's1' } }),
			notif({ id: 'b', data: { slice_id: 's1' } }),
			notif({ id: 'c', data: { slice_id: 's2' } })
		]);
		expect(rows).toHaveLength(2);
		expect(rows[0].count).toBe(2);
		expect(rows[0].notif.id).toBe('a');
	});

	it('adds both folds up: the count is the number of events', () => {
		// The backend already folded three events onto the first row and two
		// onto the second. Both are about the same slice, so the displayed
		// row stands for five — not two.
		const rows = foldNotifications([
			notif({ id: 'a', group_count: 3, data: { slice_id: 's1' } }),
			notif({ id: 'b', group_count: 2, data: { slice_id: 's1' } })
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0].count).toBe(5);
	});

	it('never merges read rows with unread ones', () => {
		const rows = foldNotifications([
			notif({ id: 'a', read: false, data: { slice_id: 's1' } }),
			notif({ id: 'b', read: true, data: { slice_id: 's1' } })
		]);
		expect(rows).toHaveLength(2);
	});

	it('does not fold notifications with no slice', () => {
		const rows = foldNotifications([notif({ id: 'a' }), notif({ id: 'b' })]);
		expect(rows).toHaveLength(2);
	});

	it('treats a missing group_count as a single event', () => {
		// Rows written before grouping existed have no such column.
		const legacy = { ...notif(), group_count: undefined } as unknown as Notification;
		expect(foldNotifications([legacy])[0].count).toBe(1);
	});
});

describe('actorsLine', () => {
	it('renders nothing when nobody is named', () => {
		expect(actorsLine(notif(), t)).toBe('');
	});

	it('renders the bare name for one person', () => {
		expect(actorsLine(notif({ group_actors: [{ username: 'fatou' }], group_count: 1 }), t)).toBe(
			'fatou'
		);
	});

	it('joins the last two names when everyone is named', () => {
		const line = actorsLine(
			notif({ group_actors: [{ username: 'fatou' }, { username: 'kofi' }], group_count: 2 }),
			t
		);
		expect(line).toBe('notifTypes.actorsLast(names=fatou,last=kofi)');
	});

	it('derives the remainder from group_count, not from the truncated list', () => {
		// The backend only keeps the four most recent: counting the "others"
		// off the list would say "and 0 others" when ten people took part.
		const line = actorsLine(
			notif({
				group_actors: [
					{ username: 'a' },
					{ username: 'b' },
					{ username: 'c' },
					{ username: 'd' }
				],
				group_count: 10
			}),
			t
		);
		expect(line).toBe('notifTypes.actorsAndOthers(names=a, b, c, d,n=6)');
	});

	it('skips actors with no name rather than rendering a blank', () => {
		const line = actorsLine(
			notif({ group_actors: [{ id: 'x' }, { username: 'fatou' }], group_count: 2 }),
			t
		);
		expect(line).toBe('notifTypes.actorsAndOthers(names=fatou,n=1)');
	});
});
