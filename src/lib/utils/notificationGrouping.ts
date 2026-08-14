import type { Notification } from '$lib/types';

/** Une ligne affichée, et le nombre d'événements qu'elle représente. */
export interface GroupedRow {
	notif: Notification;
	count: number;
}

/** Le `data` d'une notification, pour la seule clé qui sert au repli. */
function sliceIdOf(n: Notification): string | undefined {
	return (n.data as { slice_id?: string } | null)?.slice_id;
}

/**
 * Replie une liste de notifications en lignes affichables.
 *
 * Deux mécanismes se composent ici :
 *
 * - le backend a déjà replié plusieurs événements de *même type* sur un
 *   *même contexte* dans une seule ligne, et en a gardé le compte dans
 *   `group_count` ;
 * - ce repli-ci rassemble les notifications *consécutives* portant sur la
 *   même slice, quel que soit leur type. Une seule claim émet sinon cinq
 *   lignes d'affilée (claimed, fork, PR, CI, validation) et enterre tout le
 *   reste.
 *
 * Le compte rendu est la somme : le nombre d'événements que la ligne
 * représente vraiment. Afficher un nombre par mécanisme donnerait deux
 * chiffres pour la même chose.
 *
 * Les lues et les non-lues ne se mélangent pas : marquer une ligne comme lue
 * doit rester une action dont on voit le résultat.
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
 * « Fatou et 2 autres », à partir des personnes que le backend a retenues.
 *
 * Il n'en garde que les quatre plus récentes, donc le reste se déduit de
 * `group_count` plutôt que de la liste. Rien à afficher si personne n'est
 * nommé : un compteur seul est rendu ailleurs, et « 3 personnes » sans nom
 * n'apprend rien.
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
