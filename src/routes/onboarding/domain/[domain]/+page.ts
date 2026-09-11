import { error } from '@sveltejs/kit';
import { isProfileDomain } from '$lib/utils/domain_onboarding';
import type { PageLoad } from './$types';

/**
 * One route for twelve wizards.
 *
 * Each domain used to need a page of its own, and only three ever got one —
 * so `code`, which has its own ladder, its own goals and its own tools
 * question server-side, had no way in at all. The questions are served, so
 * the page is the same page whichever domain it is for.
 *
 * Client-only: the wizard reads `/users/me/domain-profile/…`, which is
 * authenticated by cookie and answers per account. Rendering it on the server
 * would produce a shell that is replaced on hydrate.
 */
export const ssr = false;

export const load: PageLoad = ({ params }) => {
	// 404 rather than the backend's 400. An unknown slug here is a URL that
	// does not exist, which is what a reader needs told; the API's "one of
	// code, design, …" is a message for somebody writing a request by hand.
	if (!isProfileDomain(params.domain)) {
		error(404, 'No onboarding for this discipline.');
	}
	return { domain: params.domain };
};
