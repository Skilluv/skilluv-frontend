/**
 * Declared portfolios, and the words the platforms count things in.
 *
 * Its own namespace rather than a corner of the design or security one,
 * because `portfolio_platforms` is a cross-domain table: the same form serves
 * a security researcher's HackTheBox profile and an ops engineer's Terraform
 * Registry page.
 */
export interface PortfolioTranslations {
	/**
	 * The language-neutral count words a platform row names via
	 * `items_label_key` / `reach_label_key`. Rendered instead of the French
	 * words the table was seeded with, which is the point of SKI-311.
	 */
	portfolioLabels: {
		downloads: string;
		stars: string;
		repositories: string;
		packages: string;
		images: string;
		followers: string;
		machines: string;
		rooms: string;
		points: string;
		reputation: string;
		articles: string;
		videos: string;
		courses: string;
		contributions: string;
	};

	/** The two public exports of somebody's record: the JSON and the badge. */
	portableRecord: {
		title: string;
		subtitle: string;
		jsonCta: string;
		badgeAlt: string;
		copyMarkdown: string;
		copied: string;
	};

	portfolioSettings: {
		title: string;
		subtitle: string;
		/** The line that keeps "declared" and "proven" apart. */
		declaredNote: string;
		domainLabel: string;
		allDomains: string;
		empty: string;
		emptyHint: string;
		noPlatforms: string;
		addCta: string;
		formTitle: string;
		platformLabel: string;
		platformPlaceholder: string;
		handleLabel: string;
		handlePlaceholder: string;
		urlLabel: string;
		urlHint: string;
		itemsLabel: string;
		reachLabel: string;
		figuresOptional: string;
		saveCta: string;
		cancelCta: string;
		removeCta: string;
		removeConfirm: string;
		added: string;
		removed: string;
		declaredBadge: string;
		verifiedBadge: string;
		openProfile: string;
	};
}
