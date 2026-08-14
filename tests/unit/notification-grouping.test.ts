import { describe, it, expect } from 'vitest';
import { foldNotifications, actorsLine } from '$lib/utils/notificationGrouping';
import type { Notification } from '$lib/types';

/** Une notification minimale, complétée par les champs utiles au test. */
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

/** Traduction de test : rend la clé et les paramètres, sans catalogue. */
const t = (key: string, params: Record<string, string | number> = {}) =>
	`${key}(${Object.entries(params)
		.map(([k, v]) => `${k}=${v}`)
		.join(',')})`;

describe('foldNotifications', () => {
	it('compte un événement par ligne quand rien n est groupé', () => {
		const rows = foldNotifications([notif({ id: 'a' }), notif({ id: 'b' })]);
		expect(rows).toHaveLength(2);
		expect(rows.map((r) => r.count)).toEqual([1, 1]);
	});

	it('reprend le compte du backend plutôt que de compter les lignes', () => {
		const rows = foldNotifications([notif({ group_count: 5 })]);
		expect(rows[0].count).toBe(5);
	});

	it('replie les notifications consécutives sur la même slice', () => {
		const rows = foldNotifications([
			notif({ id: 'a', data: { slice_id: 's1' } }),
			notif({ id: 'b', data: { slice_id: 's1' } }),
			notif({ id: 'c', data: { slice_id: 's2' } })
		]);
		expect(rows).toHaveLength(2);
		expect(rows[0].count).toBe(2);
		expect(rows[0].notif.id).toBe('a');
	});

	it('additionne les deux replis : le compte est le nombre d événements', () => {
		// Le backend a déjà replié 3 événements sur la première ligne et 2 sur
		// la seconde. Les deux portent sur la même slice, donc la ligne
		// affichée en représente cinq — et pas deux.
		const rows = foldNotifications([
			notif({ id: 'a', group_count: 3, data: { slice_id: 's1' } }),
			notif({ id: 'b', group_count: 2, data: { slice_id: 's1' } })
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0].count).toBe(5);
	});

	it('ne mélange pas les lues et les non-lues', () => {
		const rows = foldNotifications([
			notif({ id: 'a', read: false, data: { slice_id: 's1' } }),
			notif({ id: 'b', read: true, data: { slice_id: 's1' } })
		]);
		expect(rows).toHaveLength(2);
	});

	it('ne replie pas les notifications sans slice', () => {
		const rows = foldNotifications([notif({ id: 'a' }), notif({ id: 'b' })]);
		expect(rows).toHaveLength(2);
	});

	it('traite un group_count absent comme un seul événement', () => {
		// Les lignes écrites avant le groupement n ont pas la colonne.
		const legacy = { ...notif(), group_count: undefined } as unknown as Notification;
		expect(foldNotifications([legacy])[0].count).toBe(1);
	});
});

describe('actorsLine', () => {
	it('ne rend rien quand personne n est nommé', () => {
		expect(actorsLine(notif(), t)).toBe('');
	});

	it('rend le nom seul pour une personne', () => {
		expect(actorsLine(notif({ group_actors: [{ username: 'fatou' }], group_count: 1 }), t)).toBe(
			'fatou'
		);
	});

	it('joint les deux derniers noms quand tout le monde est nommé', () => {
		const line = actorsLine(
			notif({ group_actors: [{ username: 'fatou' }, { username: 'kofi' }], group_count: 2 }),
			t
		);
		expect(line).toBe('notifTypes.actorsLast(names=fatou,last=kofi)');
	});

	it('déduit le reste de group_count, pas de la liste tronquée', () => {
		// Le backend ne garde que les quatre plus récents : compter les
		// « autres » sur la liste dirait « et 0 autres » alors que dix
		// personnes ont participé.
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

	it('ignore les acteurs sans nom plutôt que de rendre un vide', () => {
		const line = actorsLine(
			notif({ group_actors: [{ id: 'x' }, { username: 'fatou' }], group_count: 2 }),
			t
		);
		expect(line).toBe('notifTypes.actorsAndOthers(names=fatou,n=1)');
	});
});
