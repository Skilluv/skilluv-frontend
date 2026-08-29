/**
 * Official Skilluv accounts, in one place.
 *
 * The footer used to hard-code four URLs, all of them wrong: they pointed at a
 * `skilluv` handle that is not ours. The handle is `joinskilluv` almost
 * everywhere, and a dead social link on a launch page costs more than no link.
 *
 * Every URL below was checked to resolve before being added. Nothing goes in
 * here on the strength of a handle alone.
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
	// Two orgs: `Skilluv` is the organisation proper, `skilluv-community` holds
	// the community repositories. The footer links the former; the latter is
	// reachable from the community page.
	{ key: 'github', label: 'GitHub', url: 'https://github.com/Skilluv', primary: true },
	{
		key: 'githubCommunity',
		label: 'GitHub Community',
		url: 'https://github.com/skilluv-community'
	},
	// Permanent invite, checked against the Discord API: never expires. The
	// default invite dies after seven days and would rot here unnoticed.
	{ key: 'discord', label: 'Discord', url: 'https://discord.gg/jSGF5RhR8u', primary: true },
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
	// On mastodon.social, not Fosstodon: the Fosstodon lookup comes back empty
	// under either handle, this one resolves.
	{ key: 'mastodon', label: 'Mastodon', url: 'https://mastodon.social/@joinskilluv' },
	{ key: 'devto', label: 'DEV', url: 'https://dev.to/joinskilluv' },
	{ key: 'hashnode', label: 'Hashnode', url: 'https://hashnode.com/@joinskilluv' },
	{ key: 'medium', label: 'Medium', url: 'https://medium.com/@skilluv' },
	{ key: 'substack', label: 'Substack', url: 'https://joinskilluv.substack.com' },
	{ key: 'producthunt', label: 'Product Hunt', url: 'https://producthunt.com/@joinskilluv' },
	{ key: 'reddit', label: 'Reddit', url: 'https://reddit.com/r/Skilluv' },
	// Handle verified against the domain itself: the `_atproto.skill-uv.com` TXT
	// record and the resolved DID match. On Bluesky the domain is the badge.
	{ key: 'bluesky', label: 'Bluesky', url: 'https://bsky.app/profile/skill-uv.com' }
];

export const PRIMARY_SOCIAL_ACCOUNTS = SOCIAL_ACCOUNTS.filter((a) => a.primary);

/**
 * Contact addresses, on the Skilluv domain.
 *
 * The footer advertised these on `skilluv.dev`, which is not ours. Both must be
 * receiving before launch: the GDPR one is a legal channel, and a mentions
 * legales pointing at a dead mailbox is a compliance problem, not a typo.
 */
export const CONTACT_EMAIL = 'contact@skill-uv.com';
export const DPO_EMAIL = 'dpo@skill-uv.com';
