import type { RequestHandler } from './$types';

/**
 * Sitemap XML dynamique — n'inclut que les pages publiques SEO-worthy.
 * Les pages dynamiques (/profile/[username], /verify/[hash], /guilds/[slug])
 * ne sont pas listees ici : elles seraient trop nombreuses ou volatiles. Elles
 * sont decouvertes via les backlinks + le crawl a partir des pages listing
 * (/mentors, /challenges, /guilds, /leaderboards).
 *
 * A regenerer via un job cron quand on aura des listings statiques (blog,
 * etudes de cas, etc.). Pour l'instant, hardcode = simple, suffisant.
 */

const BASE_URL = 'https://skill-uv.com';

const STATIC_ROUTES: { path: string; changefreq: string; priority: number }[] = [
	{ path: '/', changefreq: 'weekly', priority: 1.0 },
	{ path: '/challenges', changefreq: 'daily', priority: 0.9 },
	{ path: '/leaderboards', changefreq: 'daily', priority: 0.8 },
	{ path: '/mentors', changefreq: 'weekly', priority: 0.8 },
	{ path: '/guides', changefreq: 'weekly', priority: 0.7 },
	{ path: '/guilds', changefreq: 'weekly', priority: 0.7 },
	{ path: '/tournaments', changefreq: 'weekly', priority: 0.7 },
	{ path: '/bounties', changefreq: 'weekly', priority: 0.7 },
	{ path: '/certifications', changefreq: 'weekly', priority: 0.7 },
	{ path: '/events', changefreq: 'weekly', priority: 0.6 },
	{ path: '/diplomas/verify', changefreq: 'monthly', priority: 0.6 },
	{ path: '/pricing', changefreq: 'monthly', priority: 0.8 },
	{ path: '/for-companies', changefreq: 'monthly', priority: 0.7 },
	{ path: '/for-companies/bounties', changefreq: 'monthly', priority: 0.6 },
	{ path: '/for-maintainers', changefreq: 'monthly', priority: 0.7 },
	{ path: '/auth/login', changefreq: 'yearly', priority: 0.4 },
	{ path: '/auth/register', changefreq: 'yearly', priority: 0.5 },
	{ path: '/legal/privacy', changefreq: 'yearly', priority: 0.3 },
	{ path: '/legal/terms', changefreq: 'yearly', priority: 0.3 },
	{ path: '/legal/gdpr', changefreq: 'yearly', priority: 0.3 },
	{ path: '/legal/mentions', changefreq: 'yearly', priority: 0.3 }
];

export const GET: RequestHandler = async () => {
	const now = new Date().toISOString().slice(0, 10);
	const urls = STATIC_ROUTES.map(
		(r) => `	<url>
		<loc>${BASE_URL}${r.path}</loc>
		<lastmod>${now}</lastmod>
		<changefreq>${r.changefreq}</changefreq>
		<priority>${r.priority.toFixed(1)}</priority>
	</url>`
	).join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};

export const prerender = true;
