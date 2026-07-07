import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * /find-talents faisait doublon avec /talent-search (mini-outil de recherche
 * restrictée pour anon vs recherche complète). Fusionné dans /talent-search
 * qui couvre les deux cas. On préserve les query params pour ne pas casser
 * les liens externes.
 */
export const load: PageLoad = ({ url }) => {
	const target = `/talent-search${url.search}`;
	throw redirect(302, target);
};
