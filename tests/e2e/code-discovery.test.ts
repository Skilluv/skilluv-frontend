import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * `/code`, against the shape the backend actually sends.
 *
 * Every field this page read used to be misnamed — `html_url` for `issue_url`,
 * `repository` for `project_name`, `language` for `languages`, `id` for
 * `slice_id`, `count` for `artifacts`. The client typed the rows as
 * `unknown[]`, so none of it was a compile error and none of it was a runtime
 * one either: the reads were `undefined` and the markup simply skipped them.
 * The list rendered titles and nothing else.
 *
 * So the fixture below is copied from `FirstIssueRow` in `routes/code.rs`
 * rather than written to suit the page, and the assertions are on what a
 * reader ends up with — a way in, a reward, a repository — not on classes.
 */
type ApiRoute = { path: string; handler: (route: Route) => Promise<void> | void };

async function mockApi(page: Page, routes: ApiRoute[]) {
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		const match = routes.find((r) => url.pathname.endsWith(r.path));
		if (match) return match.handler(route);
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ data: {} })
		});
	});
}

function json(body: unknown, status = 200) {
	return (route: Route) =>
		route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const SLICE_ID = '7f3d1c88-0a2b-4c9e-9f11-2b6d5a4e8c30';

const FIRST_ISSUES = {
	data: {
		issues: [
			{
				slice_id: SLICE_ID,
				title: 'Fix the retry backoff on flaky uploads',
				difficulty: 2,
				fragments_reward: 120,
				project_slug: 'skilluv-core',
				project_name: 'Skilluv Core',
				issue_url: 'https://github.com/skilluv/core/issues/412',
				orientation_slug: 'backend',
				orientation_name: 'Backend',
				languages: ['Rust', 'SQL'],
				ingested_at: '2026-08-01T10:00:00Z'
			}
		],
		orientation: null,
		language: null,
		max_difficulty: 3
	}
};

const ECOSYSTEMS = {
	data: {
		ecosystems: [
			{
				language: 'rust',
				display_name: 'Rust',
				community_url: 'https://users.rust-lang.org',
				summary: 'Where the Rust community answers questions.'
			}
		]
	}
};

const TOP_LANGUAGES = { data: { languages: [{ language: 'TypeScript', artifacts: 148 }] } };

test.describe('Code discovery', () => {
	test.beforeEach(async ({ page }) => {
		await mockApi(page, [
			{ path: '/code/first-issues', handler: json(FIRST_ISSUES) },
			{ path: '/code/ecosystems', handler: json(ECOSYSTEMS) },
			{ path: '/code/languages/top', handler: json(TOP_LANGUAGES) }
		]);
	});

	test('a first issue leads to its slice, where the work is claimed', async ({ page }) => {
		await gotoHydrated(page, '/code');

		const title = page.getByRole('link', { name: /retry backoff/i });
		await expect(title).toBeVisible();
		// The row carries `slice_id`; sending people to GitHub only would drop
		// them out of the platform at the moment they were ready to start.
		await expect(title).toHaveAttribute('href', `/slices/${SLICE_ID}`);
	});

	test('it still offers the upstream issue, read before anything is claimed', async ({ page }) => {
		await gotoHydrated(page, '/code');

		const out = page.getByRole('link', { name: /ouvrir|open/i }).first();
		await expect(out).toHaveAttribute('href', 'https://github.com/skilluv/core/issues/412');
		// External and user-supplied: it must not pass referrer or ranking.
		await expect(out).toHaveAttribute('rel', /noopener/);
		await expect(out).toHaveAttribute('rel', /nofollow/);
	});

	test('it says what the issue pays and what it is written in', async ({ page }) => {
		await gotoHydrated(page, '/code');

		const row = page.getByTestId('code-first-issues');
		// The reward is the answer to "why this one", and it was in the payload
		// all along while the page showed a bare title.
		await expect(row).toContainText('120');
		await expect(row).toContainText('Skilluv Core');
		await expect(row).toContainText('Rust');
	});

	test('an ecosystem points at where that community actually is', async ({ page }) => {
		await gotoHydrated(page, '/code');

		const eco = page.getByTestId('code-ecosystems').getByRole('link', { name: /rust/i });
		await expect(eco).toHaveAttribute('href', 'https://users.rust-lang.org');
	});

	test('top languages are counted, and say so', async ({ page }) => {
		await gotoHydrated(page, '/code');

		const langs = page.getByTestId('code-top-languages');
		await expect(langs).toContainText('TypeScript');
		await expect(langs).toContainText('148');
	});
});
