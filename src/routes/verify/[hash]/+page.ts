import type { PageLoad } from './$types';

// L'endpoint public `/verify/{hash}` est servi par le backend derriere
// le meme host (Caddy). Pour eviter que le SvelteKit SSR ne se resolve
// lui-meme sur cette route (collision avec le +page.svelte), on force
// l'hydratation client-only. La page reste indexable via les meta OG
// injectees a partir du state client.
export const ssr = false;

export const load: PageLoad = ({ params }) => {
	return { hash: params.hash };
};
