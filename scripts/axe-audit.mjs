/**
 * Axe a11y audit — pages publiques Skilluv sous 100 dans Lighthouse.
 *
 * Usage :
 *   npm run build && npm run preview  # dans un autre terminal
 *   node scripts/axe-audit.mjs
 *
 * Cible mobile viewport. Genere `axe-report/*.json` + resume console.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';

const BASE_URL = process.env.AXE_BASE_URL ?? 'http://localhost:4173';
const OUTPUT_DIR = 'axe-report';

const PAGES = [
	{ slug: 'home', path: '/' },
	{ slug: 'pricing', path: '/pricing' },
	{ slug: 'for-maintainers', path: '/for-maintainers' },
	{ slug: 'verify', path: '/verify/000000000000000000000000000000000000000000000000000000000deadbeef' }
];

async function main() {
	await fs.mkdir(OUTPUT_DIR, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({ viewport: { width: 390, height: 844 } });

	const summary = [];

	try {
		for (const p of PAGES) {
			process.stdout.write(`  ${p.slug.padEnd(20)} `);
			const page = await context.newPage();
			try {
				await page.goto(BASE_URL + p.path, { waitUntil: 'networkidle', timeout: 30_000 });
				const results = await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
					.analyze();

				await fs.writeFile(
					path.join(OUTPUT_DIR, `${p.slug}.json`),
					JSON.stringify(results, null, 2)
				);

				const violations = results.violations;
				const rows = violations.map((v) => ({
					id: v.id,
					impact: v.impact,
					nodes: v.nodes.length,
					desc: v.description.slice(0, 60)
				}));
				summary.push({ page: p.slug, violations: rows });
				const totalNodes = violations.reduce((n, v) => n + v.nodes.length, 0);
				console.log(`${violations.length} violations / ${totalNodes} nodes`);
			} finally {
				await page.close();
			}
		}

		console.log('\n---\n');
		for (const s of summary) {
			if (s.violations.length === 0) {
				console.log(`${s.page}: 0 violations`);
				continue;
			}
			console.log(`\n== ${s.page} ==`);
			for (const v of s.violations) {
				console.log(`  [${v.impact}] ${v.id} (${v.nodes} nodes): ${v.desc}`);
			}
		}

		const md =
			`# Axe a11y audit\n\nBase URL : ${BASE_URL}\n\n` +
			summary
				.map((s) => {
					if (s.violations.length === 0) return `## ${s.page}\n\n0 violations.\n`;
					const rows = s.violations
						.map((v) => `- **[${v.impact}] ${v.id}** — ${v.nodes} nodes\n  ${v.desc}`)
						.join('\n');
					return `## ${s.page}\n\n${rows}\n`;
				})
				.join('\n');
		await fs.writeFile(path.join(OUTPUT_DIR, 'summary.md'), md);
		console.log(`\nResume : ${OUTPUT_DIR}/summary.md`);
	} finally {
		await context.close();
		await browser.close();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
