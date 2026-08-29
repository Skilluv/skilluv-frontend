/**
 * Helper dev-mode : récupère le verify-token d'un compte fraîchement créé.
 *
 * Nécessite SKILLUV_DEV_MODE=true côté back staging. En prod, le endpoint
 * n'existe pas — l'appel renvoie 404 et le helper lève une erreur claire.
 *
 * Le fetch passe par le vite proxy du dev server front (route /api/*),
 * donc pas de CORS et pas besoin d'exposer PUBLIC_API_BASE_URL au browser.
 *
 * Rate-limit : cet endpoint n'est PAS soumis au rate-limit register (~1/5h/IP).
 * On peut l'appeler librement autant de fois que nécessaire.
 */
import type { Page } from '@playwright/test';

export interface DevVerifyToken {
	token: string;
	user_id?: string;
	ttl_seconds?: number;
	[key: string]: unknown;
}

/**
 * GET /api/dev/verify-tokens/{email}. Encode l'email (le '+' du plus-addressing
 * doit être encodé %2B pour ne pas être interprété comme espace).
 *
 * Le back peut être un poil lent à écrire le token juste après register — on
 * retry brièvement en cas de 404 (jusqu'à ~3s).
 */
export async function getVerifyToken(page: Page, email: string): Promise<DevVerifyToken> {
	const encoded = encodeURIComponent(email);
	const url = `/api/dev/verify-tokens/${encoded}`;

	let lastStatus = 0;
	let lastBody = '';
	for (let attempt = 0; attempt < 6; attempt++) {
		const res = await page.request.get(url);
		lastStatus = res.status();
		if (res.ok()) {
			const parsed = (await res.json().catch(() => null)) as Record<string, unknown> | null;
			if (parsed && typeof parsed === 'object') {
				// Le back peut wrapper la réponse dans { data: ... } ou la retourner à plat.
				const rawUnknown = 'data' in parsed && parsed.data ? parsed.data : parsed;
				const raw = rawUnknown as DevVerifyToken;
				if (raw && typeof raw.token === 'string' && raw.token.length > 0) return raw;
			}
			lastBody = await res.text().catch(() => '');
			throw new Error(`Réponse dev-verify inattendue (pas de champ "token") : ${lastBody.slice(0, 200)}`);
		}
		lastBody = await res.text().catch(() => '');
		if (lastStatus === 404) {
			await page.waitForTimeout(500);
			continue;
		}
		break;
	}

	throw new Error(
		`getVerifyToken(${email}) a échoué : status=${lastStatus} body=${lastBody.slice(0, 200)}. ` +
			`Vérifier que SKILLUV_DEV_MODE=true est bien actif sur le back staging.`
	);
}
