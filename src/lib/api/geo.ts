import { createApiClient } from './client';
import type { ApiResponse } from '$lib/types';

const api = createApiClient();

export interface Country {
	iso2: string;
	iso3: string;
	name: string;
}

export interface City {
	name: string;
	country: string;
	population: number;
}

export const geoApi = {
	getCountries() {
		return api.get<ApiResponse<Country[]>>('/geo/countries');
	},

	searchCities(country: string, q?: string, limit = 20) {
		return api.get<ApiResponse<City[]>>('/geo/cities', {
			country,
			q: q && q.trim() ? q.trim() : undefined,
			limit
		});
	}
};
