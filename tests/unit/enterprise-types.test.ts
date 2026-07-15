import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-07-15' } })
	};
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.resetModules();
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('enterpriseTypesApi', () => {
	it('get() reads the type-config endpoint', async () => {
		fetchMock.mockResolvedValue(ok({ enterprise_type: 'direct_hire', type_config: {} }));
		const { enterpriseTypesApi } = await import('../../src/lib/api/enterprise_types');
		const res = await enterpriseTypesApi.get();
		expect(res.data.enterprise_type).toBe('direct_hire');
	});

	it('patch() sends staffing_agency type', async () => {
		fetchMock.mockResolvedValue(ok({ enterprise_type: 'staffing_agency', type_config: {} }));
		const { enterpriseTypesApi } = await import('../../src/lib/api/enterprise_types');
		await enterpriseTypesApi.patch({ enterprise_type: 'staffing_agency' });
		const [, init] = fetchMock.mock.calls[0];
		expect(init.method).toBe('PATCH');
		const body = JSON.parse(init.body);
		expect(body.enterprise_type).toBe('staffing_agency');
	});

	it('patch() sends remote_international type with EOR config', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { enterpriseTypesApi } = await import('../../src/lib/api/enterprise_types');
		await enterpriseTypesApi.patch({
			enterprise_type: 'remote_international',
			type_config: {
				eor_provider: 'deel',
				preferred_currency: 'EUR',
				timezone_requirement: 'Europe/Paris',
				tax_withholding_country: 'FR'
			}
		});
		const [, init] = fetchMock.mock.calls[0];
		const body = JSON.parse(init.body);
		expect(body.type_config.eor_provider).toBe('deel');
		expect(body.type_config.tax_withholding_country).toBe('FR');
	});
});

describe('agencyClientsApi CRUD lifecycle', () => {
	it('create → patch (active toggle) → remove all hit the expected paths', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ id: 'c1', client_name: 'Acme', active: true, created_at: '2026-01-01' }))
			.mockResolvedValueOnce(ok({ id: 'c1', client_name: 'Acme', active: false, created_at: '2026-01-01' }))
			.mockResolvedValueOnce(ok({ removed: true }));

		const { agencyClientsApi } = await import('../../src/lib/api/agency_clients');
		await agencyClientsApi.create({ client_name: 'Acme' });
		await agencyClientsApi.patch('c1', { active: false });
		await agencyClientsApi.remove('c1');

		expect(fetchMock.mock.calls[0][0]).toBe('/api/enterprises/me/agency-clients');
		expect(fetchMock.mock.calls[0][1].method).toBe('POST');
		expect(fetchMock.mock.calls[1][0]).toBe('/api/enterprises/me/agency-clients/c1');
		expect(fetchMock.mock.calls[1][1].method).toBe('PATCH');
		expect(fetchMock.mock.calls[2][0]).toBe('/api/enterprises/me/agency-clients/c1');
		expect(fetchMock.mock.calls[2][1].method).toBe('DELETE');
	});
});
