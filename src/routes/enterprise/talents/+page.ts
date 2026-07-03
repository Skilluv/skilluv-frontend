import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * Fusion talent-search v1 → v2 : /enterprise/talents redirige vers
 * /talent-search qui propose 13 filtres croisés (v2 avancé).
 *
 * On préserve les query params (q, page, etc.) pour ne pas casser les liens
 * externes ou bookmarks existants.
 */
export const load: PageLoad = ({ url }) => {
	const target = `/talent-search${url.search}`;
	throw redirect(302, target);
};
