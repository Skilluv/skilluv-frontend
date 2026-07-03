import { describe, it, expect } from 'vitest';
import { profileJsonLd, websiteJsonLd, challengeJsonLd } from '../../src/lib/utils/jsonld';

describe('JSON-LD generators', () => {
	it('generates valid Person JSON-LD for a profile', () => {
		const user = {
			username: 'kofi',
			display_name: 'Kofi Mensah',
			title: 'artisan' as const,
			golden_stars: 2,
			skill_domain: 'code' as const,
			country: 'BJ',
			city: 'Cotonou',
			bio: 'Full stack developer',
			avatar_url: 'https://example.com/avatar.png',
			github: 'kofi',
			linkedin: 'kofi',
			website: 'https://kofi.dev',
			twitter: 'kofi',
			member_since: '2026-01-01'
		};
		const stats = { total_fragments: 1500, challenges_completed: 42 };
		const result = profileJsonLd(user, stats, '/profile/kofi');

		expect(result['@context']).toBe('https://schema.org');
		expect(result['@type']).toBe('Person');
		expect(result.name).toBe('Kofi Mensah');
		expect(result.jobTitle).toBe('Artisan');
		expect(result.knowsAbout).toBe('Software Development');
		expect(result.sameAs).toContain('https://github.com/kofi');
	});

	it('generates valid WebSite JSON-LD', () => {
		const result = websiteJsonLd();
		expect(result['@context']).toBe('https://schema.org');
		expect(result['@type']).toBe('WebSite');
		expect(result.name).toBe('Skilluv');
		expect(result.potentialAction).toBeDefined();
	});

	it('generates valid LearningResource JSON-LD for a challenge', () => {
		const challenge = {
			title: 'Build a REST API',
			description: 'Create a REST API with Rust',
			skill_domain: 'code'
		};
		const result = challengeJsonLd(challenge, '/challenges/123');

		expect(result['@context']).toBe('https://schema.org');
		expect(result['@type']).toBe('LearningResource');
		expect(result.name).toBe('Build a REST API');
	});
});
