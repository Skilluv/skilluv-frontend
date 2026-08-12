import { createSlicesApi, type Slice } from '$api/slices';
import { SkilluError } from '$api/client';
import type { PageLoad } from './$types';

/** Tolerates a fulfilled response whose payload lacks the expected array. */
function toSlices(value: unknown): Slice[] {
	const slices = (value as { data?: { slices?: unknown } } | undefined)?.data?.slices;
	return Array.isArray(slices) ? (slices as Slice[]) : [];
}

export const load: PageLoad = async ({ fetch }) => {
	// The load event's fetch is the only one that resolves relative URLs during
	// SSR and forwards session cookies.
	const api = createSlicesApi(fetch);
	const [mineRes, recoRes] = await Promise.allSettled([
		api.mySlices({ per_page: 100 }),
		api.feedRecommended(20)
	]);

	// allSettled only guards against rejections. A 200 with an unexpected body
	// (endpoint not deployed yet, proxy returning something else) used to leave
	// `mine` undefined and crash the page on `filtered.length`.
	const mine: Slice[] = mineRes.status === 'fulfilled' ? toSlices(mineRes.value) : [];
	const mineError = mineRes.status === 'rejected'
		? mineRes.reason instanceof SkilluError ? mineRes.reason.message : 'Erreur de chargement'
		: null;

	const reco: Slice[] = recoRes.status === 'fulfilled' ? toSlices(recoRes.value) : [];
	const recoMeta = recoRes.status === 'fulfilled' ? recoRes.value.data?.meta ?? null : null;
	const recoError = recoRes.status === 'rejected'
		? recoRes.reason instanceof SkilluError ? recoRes.reason.message : 'Erreur de chargement'
		: null;

	return { mine, mineError, reco, recoMeta, recoError };
};
