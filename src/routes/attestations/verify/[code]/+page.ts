import type { PageLoad } from './$types';

/**
 * Client-only, like the sibling `/verify/[hash]` page.
 *
 * The lookup goes through `/api`, so unlike that page there is no route
 * collision forcing the choice — but a verification page that renders the
 * same way whoever opens it is easier to reason about with one code path than
 * two, and the meta tags are injected from client state either way.
 */
export const ssr = false;

export const load: PageLoad = ({ params }) => {
	return { code: params.code };
};
