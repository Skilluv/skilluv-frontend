/**
 * Official Skilluv accounts, in one place.
 *
 * The footer used to hard-code four URLs, all of them wrong: they pointed at a
 * `skilluv` handle that is not ours. The handle is `joinskilluv` almost
 * everywhere, and a dead social link on a launch page costs more than no link.
 *
 * Anything whose exact URL is not confirmed stays out of this file rather than
 * being guessed — see PENDING_ACCOUNTS at the bottom.
 */

export interface SocialAccount {
	/** Stable key, also used as the i18n/testid suffix. */
	key: string;
	label: string;
	url: string;
	/** Shown in the footer. The rest live on the community page. */
	primary?: boolean;
}

export const SOCIAL_ACCOUNTS: SocialAccount[] = [
	// The code, the documentation and the design decisions (AGPL-3.0).
	{ key: 'github', label: 'GitHub', url: 'https://github.com/skilluv-community', primary: true },
	{ key: 'x', label: 'X', url: 'https://x.com/joinskilluv', primary: true },
	{
		key: 'linkedin',
		label: 'LinkedIn',
		url: 'https://linkedin.com/company/joinskilluv',
		primary: true
	},
	{ key: 'youtube', label: 'YouTube', url: 'https://youtube.com/@joinskilluv', primary: true },
	{ key: 'instagram', label: 'Instagram', url: 'https://instagram.com/joinskilluv', primary: true },
	{ key: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@joinskilluv' },
	{ key: 'threads', label: 'Threads', url: 'https://threads.net/@joinskilluv' },
	{ key: 'twitch', label: 'Twitch', url: 'https://twitch.tv/joinskilluv' },
	{ key: 'mastodon', label: 'Mastodon', url: 'https://fosstodon.org/@joinskilluv' },
	{ key: 'devto', label: 'DEV', url: 'https://dev.to/joinskilluv' },
	{ key: 'hashnode', label: 'Hashnode', url: 'https://hashnode.com/@joinskilluv' },
	{ key: 'medium', label: 'Medium', url: 'https://medium.com/@skilluv' },
	{ key: 'substack', label: 'Substack', url: 'https://joinskilluv.substack.com' },
	{ key: 'producthunt', label: 'Product Hunt', url: 'https://producthunt.com/@joinskilluv' },
	{ key: 'reddit', label: 'Reddit', url: 'https://reddit.com/r/Skilluv' }
];

export const PRIMARY_SOCIAL_ACCOUNTS = SOCIAL_ACCOUNTS.filter((a) => a.primary);

/**
 * Accounts that exist but whose exact URL was not confirmed. Guessing any of
 * these produces a 404 on the footer of a launch page, so they are listed here
 * instead of being published.
 *
 *  - Discord: needs the permanent invite code (`discord.gg/<code>`). It must be
 *    a never-expiring, unlimited-use invite — the default one dies after seven
 *    days and would break the footer without anyone noticing.
 *  - Bluesky: needs the full handle (`joinskilluv.bsky.social`, or a custom
 *    domain handle if one is configured).
 *  - GitHub `Skilluv` org: the documentation points at `skilluv-community` for
 *    the code, so that is the one linked. Say if the other should show too.
 */
export const PENDING_ACCOUNTS = ['discord', 'bluesky'] as const;

/**
 * Contact addresses, on the Skilluv domain.
 *
 * The footer advertised these on `skilluv.dev`, which is not ours. Both must be
 * receiving before launch: the GDPR one is a legal channel, and a mentions
 * legales pointing at a dead mailbox is a compliance problem, not a typo.
 */
export const CONTACT_EMAIL = 'contact@skill-uv.com';
export const DPO_EMAIL = 'dpo@skill-uv.com';
