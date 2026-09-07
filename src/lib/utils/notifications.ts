import type { Notification } from '$lib/types';
import { i18n } from '$lib/i18n';

/**
 * Turning a notification row into something a person can read.
 *
 * These lived inside `/notifications`, which was fine while that page was the
 * only thing rendering them. The bell now opens a panel showing the five most
 * recent, and two renderings of the same row that can disagree is worse than
 * either — a notification that says one thing in the panel and another on the
 * page is a bug nobody would think to look for.
 */

/**
 * The `data` payload, best effort.
 *
 * Every field is optional on purpose: the backend catalogue holds some sixty
 * kinds and gains one with every feature, so a row can carry anything or
 * nothing. A missing field drops its call to action rather than breaking the
 * row.
 */
export interface NotifData {
	slice_id?: string;
	slice_title?: string;
	fork_url?: string;
	pr_url?: string;
	repo?: string;
	claimer?: string;
	validator?: string;
	reason?: string;
	fragments_bonus?: number;
	invitation_id?: string;
	domain?: string;
	status?: string;
	notes?: string;
	attestation_hash?: string;
	upstream_issue_url?: string;
	/** SKI-43 promotion payloads. */
	to_rank?: string;
	unlock_hint?: { unlocked_slices_count?: number; sample?: { slice_id: string; title: string }[] };
	capability?: string;
	badge_slug?: string;
	goal_id?: string;
}

export function notifData(n: Notification): NotifData {
	return (n.data as NotifData | null) ?? {};
}

/**
 * The line a reader sees, translated where we have a translation for the kind.
 *
 * `t()` answers the key itself when it has no entry, which is how a raw
 * `notifTypes.something` reaches a screen. The backend writes a serviceable
 * `body` for every row, so that is the fallback rather than the key.
 */
export function notifBody(n: Notification): string {
	const d = notifData(n);
	const key = `notifTypes.${n.notification_type}`;
	const params: Record<string, string | number> = {
		title: d.slice_title ?? '',
		url: d.fork_url ?? d.pr_url ?? d.upstream_issue_url ?? '',
		user: d.claimer ?? d.validator ?? '',
		reason: d.reason ?? '',
		repo: d.repo ?? '',
		n: d.fragments_bonus ?? 0,
		domain: d.domain ?? '',
		notes: d.notes ?? '',
		status:
			d.status === 'approved'
				? i18n.t('notifTypes.statusApproved')
				: d.status === 'rejected'
					? i18n.t('notifTypes.statusRejected')
					: (d.status ?? '')
	};
	const text = i18n.t(key, params);
	return text === key ? (n.body ?? '') : text;
}

/**
 * How long ago, short enough for a badge.
 *
 * Minutes under an hour, hours under a day, then a date. The locale follows the
 * reader rather than being hardcoded to French, which is what it was.
 */
export function notifAge(iso: string, locale: string = i18n.locale): string {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return '';
	const diff = Date.now() - then;
	if (diff < 60_000) return locale === 'fr' ? "à l'instant" : 'just now';
	if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
	if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
	return new Date(then).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
		day: 'numeric',
		month: 'short'
	});
}
