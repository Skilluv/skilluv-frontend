import type { UserPublic, Title } from '$lib/types';

/**
 * Génère le JSON-LD Person pour un profil public Skilluv
 */
export function profileJsonLd(user: UserPublic, stats: { total_fragments: number; challenges_completed: number }, profileUrl: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: user.display_name,
		url: profileUrl,
		image: user.avatar_url ?? undefined,
		description: user.bio ?? `${titleLabel(user.title)} on Skilluv — ${stats.total_fragments} fragments, ${stats.challenges_completed} challenges completed`,
		jobTitle: titleLabel(user.title),
		knowsAbout: domainLabel(user.skill_domain),
		sameAs: [
			user.github ? `https://github.com/${user.github}` : null,
			user.linkedin ? `https://linkedin.com/in/${user.linkedin}` : null,
			user.twitter ? `https://x.com/${user.twitter}` : null,
			user.website
		].filter(Boolean),
		memberOf: {
			'@type': 'Organization',
			name: 'Skilluv',
			url: 'https://skilluv.com'
		}
	};
}

/**
 * Génère le JSON-LD WebSite pour la landing page
 */
export function websiteJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Skilluv',
		url: 'https://skilluv.com',
		description: 'Plateforme gamifiée de démonstration de compétences tech — Code, Design, Game, Security',
		potentialAction: {
			'@type': 'SearchAction',
			target: 'https://skilluv.com/talents/search?q={search_term_string}',
			'query-input': 'required name=search_term_string'
		}
	};
}

/**
 * Génère le JSON-LD pour un challenge
 */
export function challengeJsonLd(challenge: { title: string; description: string; skill_domain: string }, challengeUrl: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'LearningResource',
		name: challenge.title,
		description: challenge.description,
		url: challengeUrl,
		provider: {
			'@type': 'Organization',
			name: 'Skilluv'
		},
		educationalLevel: domainLabel(challenge.skill_domain),
		inLanguage: ['fr', 'en']
	};
}

function titleLabel(title: Title): string {
	const labels: Record<Title, string> = {
		apprenti: 'Apprentice',
		artisan: 'Artisan',
		maitre: 'Master',
		legende: 'Legend'
	};
	return labels[title] ?? title;
}

function domainLabel(domain: string): string {
	const labels: Record<string, string> = {
		code: 'Software Development',
		design: 'Digital Design',
		game: 'Game Development',
		security: 'Cybersecurity'
	};
	return labels[domain] ?? domain;
}
