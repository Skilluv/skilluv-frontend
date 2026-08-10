import { slicesApi, type Slice } from '$api/slices';
import { SkilluError } from '$api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [mineRes, recoRes] = await Promise.allSettled([
		slicesApi.mySlices({ per_page: 100 }),
		slicesApi.feedRecommended(20)
	]);

	const mine: Slice[] = mineRes.status === 'fulfilled' ? mineRes.value.data.slices : [];
	const mineError = mineRes.status === 'rejected'
		? mineRes.reason instanceof SkilluError ? mineRes.reason.message : 'Erreur de chargement'
		: null;

	const reco: Slice[] = recoRes.status === 'fulfilled' ? recoRes.value.data.slices : [];
	const recoMeta = recoRes.status === 'fulfilled' ? recoRes.value.data.meta ?? null : null;
	const recoError = recoRes.status === 'rejected'
		? recoRes.reason instanceof SkilluError ? recoRes.reason.message : 'Erreur de chargement'
		: null;

	return { mine, mineError, reco, recoMeta, recoError };
};
