/**
 * Lighthouse mobile audit — 5 pages critiques Skilluv.
 *
 * Usage :
 *   npm run dev  # dans un autre terminal
 *   node scripts/lighthouse-audit.mjs
 *
 * Genere `lighthouse-report/<slug>.html` pour chaque page + un resume
 * scores console. Cible mobile 4G throttled par defaut (le pire cas).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const BASE_URL = process.env.LH_BASE_URL ?? 'http://localhost:5173';
const OUTPUT_DIR = 'lighthouse-report';

const PAGES = [
	{ slug: 'home', path: '/' },
	{ slug: 'challenges', path: '/challenges' },
	{ slug: 'pricing', path: '/pricing' },
	{ slug: 'for-maintainers', path: '/for-maintainers' },
	{ slug: 'verify', path: '/verify/000000000000000000000000000000000000000000000000000000000deadbeef' }
];

// Detecte le chromium bundled par Playwright (Windows dev sans Chrome installe).
async function resolveChromePath() {
	const home = process.env.LOCALAPPDATA ?? process.env.HOME ?? '';
	if (!home) return undefined;
	const base = path.join(home, 'ms-playwright');
	try {
		const dirs = await fs.readdir(base);
		const chromiumDirs = dirs.filter((d) => d.startsWith('chromium-')).sort().reverse();
		for (const d of chromiumDirs) {
			const candidate = path.join(base, d, 'chrome-win64', 'chrome.exe');
			try {
				await fs.access(candidate);
				return candidate;
			} catch {
				// try next
			}
		}
	} catch {
		// pas de playwright chromium installe
	}
	return undefined;
}

async function auditPage(chrome, url) {
	const result = await lighthouse(
		url,
		{
			port: chrome.port,
			output: 'html',
			logLevel: 'error',
			onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
		},
		{
			extends: 'lighthouse:default',
			settings: {
				formFactor: 'mobile',
				screenEmulation: {
					mobile: true,
					width: 390,
					height: 844,
					deviceScaleFactor: 3,
					disabled: false
				},
				throttling: {
					rttMs: 150,
					throughputKbps: 1638.4,
					cpuSlowdownMultiplier: 4,
					requestLatencyMs: 0,
					downloadThroughputKbps: 0,
					uploadThroughputKbps: 0
				}
			}
		}
	);
	return result;
}

async function main() {
	await fs.mkdir(OUTPUT_DIR, { recursive: true });

	const chromePath = await resolveChromePath();
	if (!chromePath) {
		console.error(
			"Chromium introuvable. Installer Chrome/Edge ou faire `npx playwright install chromium`."
		);
		process.exit(1);
	}

	console.log(`Chromium: ${chromePath}`);
	console.log(`Base URL: ${BASE_URL}\n`);

	const chrome = await chromeLauncher.launch({
		chromePath,
		chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']
	});

	const summary = [];

	try {
		for (const page of PAGES) {
			const url = BASE_URL + page.path;
			process.stdout.write(`  ${page.slug.padEnd(20)} ${url} ... `);
			try {
				const runnerResult = await auditPage(chrome, url);
				const html = runnerResult.report;
				const jsonPath = path.join(OUTPUT_DIR, `${page.slug}.html`);
				await fs.writeFile(jsonPath, html);
				const cats = runnerResult.lhr.categories;
				const row = {
					page: page.slug,
					perf: Math.round((cats.performance?.score ?? 0) * 100),
					a11y: Math.round((cats.accessibility?.score ?? 0) * 100),
					best: Math.round((cats['best-practices']?.score ?? 0) * 100),
					seo: Math.round((cats.seo?.score ?? 0) * 100)
				};
				summary.push(row);
				console.log(
					`perf ${row.perf}  a11y ${row.a11y}  best ${row.best}  seo ${row.seo}`
				);
			} catch (err) {
				console.log(`ECHEC (${err instanceof Error ? err.message : String(err)})`);
				summary.push({ page: page.slug, perf: null, a11y: null, best: null, seo: null });
			}
		}

		// Resume markdown
		const rows = summary
			.map((r) => {
				const cell = (v) => (v === null ? 'N/A' : String(v));
				return `| ${r.page.padEnd(20)} | ${cell(r.perf).padStart(4)} | ${cell(r.a11y).padStart(4)} | ${cell(r.best).padStart(4)} | ${cell(r.seo).padStart(4)} |`;
			})
			.join('\n');
		const md = `# Lighthouse mobile audit\n\nBase URL : ${BASE_URL}\n\n| Page                 | Perf | A11y | Best |  SEO |\n| -------------------- | ---- | ---- | ---- | ---- |\n${rows}\n\nRapports HTML detailles dans \`${OUTPUT_DIR}/\`.\n`;
		await fs.writeFile(path.join(OUTPUT_DIR, 'summary.md'), md);
		console.log(`\nResume : ${OUTPUT_DIR}/summary.md`);
	} finally {
		await chrome.kill();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
