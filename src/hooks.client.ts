import type { HandleClientError } from '@sveltejs/kit';
import { observability } from '$lib/observability';

/**
 * Hook client-side qui intercepte toutes les erreurs Svelte non catch (dans les
 * loaders `+page.ts` ou les composants pendant l'hydratation) AVANT que le
 * layout `+error.svelte` ne les render.
 *
 * Deux roles :
 *  1. Capture Sentry (si configure) pour post-mortem.
 *  2. Sanitize le message qui sera passe a `$page.error.message` — en prod on
 *     ne veut PAS exposer les messages TypeScript / Rust / stack traces qui
 *     peuvent leak la structure interne. On garde l'ID de correlation pour le
 *     support.
 *
 * NOTE : ce hook ne se declenche que pour les erreurs cote client. Les
 * erreurs cote serveur sont gerees par `hooks.server.ts.handleError`.
 */
export const handleError: HandleClientError = ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();
	const isProd = import.meta.env.MODE === 'production';

	// Log complet en console dev, capture Sentry en prod.
	if (isProd) {
		observability.captureException(error, {
			tags: { source: 'client', pathname: event.url.pathname, status: String(status) },
			extras: { errorId, message }
		});
	} else {
		console.error(`[client error ${errorId}]`, error);
	}

	// Message safe pour l'user. En dev on garde le message brut pour debug.
	const safeMessage = isProd
		? 'Une erreur inattendue est survenue. Reessaie ou reviens plus tard.'
		: (error instanceof Error ? error.message : String(error));

	return {
		message: safeMessage,
		errorId
	};
};
