import { error } from '@sveltejs/kit';
import { slicesApi } from '$api/slices';
import { SkilluError } from '$api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	try {
		const res = await slicesApi.get(params.id);
		return { slice: res.data };
	} catch (err) {
		if (err instanceof SkilluError && err.status === 404) {
			error(404, 'Slice introuvable');
		}
		throw err;
	}
};
