import type { PageLoad } from './$types';

// Cookies de session -> hydratation client-only.
export const ssr = false;

export const load: PageLoad = ({ params }) => {
	return { sliceId: params.slice_id };
};
