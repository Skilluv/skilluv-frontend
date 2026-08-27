import { error } from '@sveltejs/kit';
import { createSlicesApi } from '$api/slices';
import { SkilluError } from '$api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	// The load event's fetch is required during SSR: Node's global fetch cannot
	// resolve the relative `/api/slices/{id}`.
	const api = createSlicesApi(fetch);
	try {
		const res = await api.get(params.id);
		// `{ data: { slice } }`, not `{ data: slice }` — see `SliceEnvelope`.
		return { slice: res.data.slice };
	} catch (err) {
		if (err instanceof SkilluError && err.status === 404) {
			error(404, 'Slice introuvable');
		}
		throw err;
	}
};
