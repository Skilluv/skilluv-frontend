/**
 * SKI-290 — /guilds/new.
 *
 * The backend refuses any composition other than exactly three co-founders, so
 * the cases that matter are the ones that stop the user before the 422: too
 * few, duplicates, self, and unknown usernames.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

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

/** Username -> profile, the only way to turn a handle into the id the API wants. */
const PEOPLE: Record<string, { id: string; display_name: string }> = {
	ama: { id: 'u-ama', display_name: 'Ama Doe' },
	yao: { id: 'u-yao', display_name: 'Yao Mensah' },
	efia: { id: 'u-efia', display_name: 'Efia Owusu' }
};

// One route per known handle. Anything else falls through to the catch-all,
// which returns no user -- exactly what an unknown username looks like.
const profileRoutes: ApiRoute[] = Object.entries(PEOPLE).map(([username, person]) => ({
	path: `/profile/${username}`,
	handler: json({
		data: {
			user: { id: person.id, username, display_name: person.display_name },
			stats: { challenges_completed: 0, total_fragments: 0, streak_current: 0, trust_score: 0 }
		}
	})
}));

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

async function addCofounder(page: Page, username: string) {
	await page.getByTestId('cofounder-input').fill(username);
	await page.getByTestId('add-cofounder').click();
	// Resolving a username is a round-trip, and the field is cleared once it
	// succeeds. Chaining the next add before that settles types into a field
	// that is about to be wiped, so the name is silently dropped.
	await expect
		.poll(async () => {
			const empty = (await page.getByTestId('cofounder-input').inputValue()) === '';
			const errored = (await page.getByTestId('cofounder-error').count()) > 0;
			return empty || errored;
		})
		.toBe(true);
}

test.beforeEach(async ({ page, context }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
	await context.addCookies([
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
});

test.describe('SKI-290 guild creation', () => {
	test('la regle des 3 cofondateurs est annoncee avant de remplir', async ({ page }) => {
		await mockApi(page, [...profileRoutes, ...common]);
		await gotoHydrated(page, '/guilds/new');

		await expect(page.getByTestId('guild-create-rule')).toContainText('3 cofondateurs');
		await expect(page.getByTestId('guild-create-submit')).toBeDisabled();
	});

	test('l identifiant se derive du nom', async ({ page }) => {
		await mockApi(page, [...profileRoutes, ...common]);
		await gotoHydrated(page, '/guilds/new');

		await page.getByLabel('Nom').fill('Les Forgerons du Nord');
		await expect(page.getByLabel('Identifiant')).toHaveValue('les-forgerons-du-nord');
	});

	test('un pseudo inconnu est refuse sans casser le formulaire', async ({ page }) => {
		await mockApi(page, [...profileRoutes, ...common]);
		await gotoHydrated(page, '/guilds/new');

		await addCofounder(page, 'personne');
		await expect(page.getByTestId('cofounder-error')).toHaveText(
			'Aucun compte ne porte ce pseudo.'
		);
		await expect(page.getByTestId('cofounder-count')).toContainText('0 / 3');
	});

	test('un doublon est refuse', async ({ page }) => {
		await mockApi(page, [...profileRoutes, ...common]);
		await gotoHydrated(page, '/guilds/new');

		await addCofounder(page, 'ama');
		await addCofounder(page, 'ama');

		await expect(page.getByTestId('cofounder-error')).toHaveText(
			'Ce compte est deja dans la liste.'
		);
		await expect(page.getByTestId('cofounder-row')).toHaveCount(1);
	});

	test('s ajouter soi-meme est refuse', async ({ page }) => {
		await mockApi(page, [...profileRoutes, ...common]);
		await gotoHydrated(page, '/guilds/new');

		// The mock backend serves `kofi` for the challenger token.
		await addCofounder(page, 'kofi');
		await expect(page.getByTestId('cofounder-error')).toContainText('deja fondateur');
		await expect(page.getByTestId('cofounder-row')).toHaveCount(0);
	});

	test('moins de 3 cofondateurs laisse le bouton inactif', async ({ page }) => {
		await mockApi(page, [...profileRoutes, ...common]);
		await gotoHydrated(page, '/guilds/new');

		await page.getByLabel('Nom').fill('Les Forgerons');
		await page.getByLabel('Tag').fill('FORG');
		await addCofounder(page, 'ama');
		await addCofounder(page, 'yao');

		await expect(page.getByTestId('cofounder-count')).toContainText('2 / 3');
		await expect(page.getByTestId('guild-create-submit')).toBeDisabled();
	});

	test('avec 3 cofondateurs, la guilde est creee avec le payload attendu', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/guilds',
				handler: (route) => {
					if (route.request().method() === 'POST') {
						sent = route.request().postDataJSON();
						return json({ data: { guild: { id: 'g-1', slug: 'les-forgerons' } } })(route);
					}
					return json({ data: { guilds: [] } })(route);
				}
			},
			...profileRoutes,
			...common
		]);
		await gotoHydrated(page, '/guilds/new');

		await page.getByLabel('Nom').fill('Les Forgerons');
		await page.getByLabel('Tag').fill('FORG');
		await addCofounder(page, 'ama');
		await addCofounder(page, 'yao');
		await addCofounder(page, 'efia');

		await expect(page.getByTestId('guild-create-submit')).toBeEnabled();
		await page.getByTestId('guild-create-submit').click();

		await expect.poll(() => sent).not.toBeNull();
		expect(sent).toMatchObject({
			name: 'Les Forgerons',
			slug: 'les-forgerons',
			tag: 'FORG',
			cofounder_ids: ['u-ama', 'u-yao', 'u-efia'],
			color_hex: '#c2703a'
		});
		await expect(page).toHaveURL(/\/guilds\/les-forgerons/);
	});

	test('un 4e cofondateur est refuse', async ({ page }) => {
		await mockApi(page, [...profileRoutes, ...common]);
		await gotoHydrated(page, '/guilds/new');

		await addCofounder(page, 'ama');
		await addCofounder(page, 'yao');
		await addCofounder(page, 'efia');
		await page.getByTestId('cofounder-input').fill('ama');
		await page.getByTestId('add-cofounder').click();

		await expect(page.getByTestId('cofounder-error')).toHaveText('Tu as deja 3 cofondateurs.');
		await expect(page.getByTestId('cofounder-row')).toHaveCount(3);
	});

	test('le CTA de /guilds mene bien a la page', async ({ page }) => {
		await mockApi(page, [{ path: '/guilds', handler: json({ data: { guilds: [] } }) }, ...common]);
		await gotoHydrated(page, '/guilds');

		await expect(page.getByTestId('guild-create-cta')).toHaveAttribute('href', '/guilds/new');
	});
});
