/**
 * Consent store — unit tests (RGPD compliance).
 *
 * Vérifie :
 *   - init() charge la version du backend et hydrate le snapshot depuis
 *     localStorage si présent (clé versionnée).
 *   - acceptAll / rejectAll / updatePreferences persistent le snapshot dans
 *     localStorage ET appellent privacyApi.recordConsent avec les bons flags.
 *   - revoke() efface le snapshot local et POST des choix vides.
 *   - hasDecided reflète la présence du snapshot pour la version courante.
 *   - Un snapshot pour une AUTRE version est ignoré (banner ré-apparaît).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the API before importing the store (which imports privacyApi at
// module load).
const recordConsent = vi.fn().mockResolvedValue({ data: {} });
const consentVersion = vi.fn().mockResolvedValue({ data: { version: 3 } });

vi.mock('$lib/api/privacy', () => ({
	privacyApi: {
		consentVersion: (...args: unknown[]) => consentVersion(...args),
		recordConsent: (...args: unknown[]) => recordConsent(...args)
	}
}));

// Import AFTER mocks are wired up.
const { consent, __resetConsentForTests } = await import(
	'../../src/lib/stores/consent.svelte'
);

describe('consent store', () => {
	beforeEach(() => {
		localStorage.clear();
		recordConsent.mockClear();
		consentVersion.mockClear();
		consentVersion.mockResolvedValue({ data: { version: 3 } });
		__resetConsentForTests();
	});

	it('init() loads backend version and shows banner when no decision', async () => {
		await consent.init();

		expect(consent.version).toBe(3);
		expect(consent.hasDecided).toBe(false);
		expect(consent.bannerVisible).toBe(true);
		expect(consent.snapshot).toBeNull();
		expect(localStorage.getItem('skilluv-consent-version')).toBe('3');
	});

	it('init() hydrates snapshot for current version and hides banner', async () => {
		localStorage.setItem(
			'skilluv-consent-v3',
			JSON.stringify({
				essential: true,
				analytics: true,
				marketing: false,
				version: 3,
				decidedAt: '2026-01-01T00:00:00.000Z'
			})
		);

		await consent.init();

		expect(consent.hasDecided).toBe(true);
		expect(consent.bannerVisible).toBe(false);
		expect(consent.analyticsAllowed).toBe(true);
		expect(consent.marketingAllowed).toBe(false);
	});

	it('init() IGNORES snapshots stored under a different version', async () => {
		// Old snapshot for version 2 — backend now returns 3 → banner re-appears.
		localStorage.setItem(
			'skilluv-consent-v2',
			JSON.stringify({
				essential: true,
				analytics: true,
				marketing: true,
				version: 2,
				decidedAt: '2025-01-01T00:00:00.000Z'
			})
		);

		await consent.init();

		expect(consent.version).toBe(3);
		expect(consent.snapshot).toBeNull();
		expect(consent.bannerVisible).toBe(true);
	});

	it('acceptAll() persists snapshot + POSTs analytics:true, marketing:true', async () => {
		await consent.init();
		await consent.acceptAll();

		expect(recordConsent).toHaveBeenCalledWith({ analytics: true, marketing: true });
		expect(consent.analyticsAllowed).toBe(true);
		expect(consent.marketingAllowed).toBe(true);
		expect(consent.bannerVisible).toBe(false);

		const raw = localStorage.getItem('skilluv-consent-v3');
		expect(raw).toBeTruthy();
		const stored = JSON.parse(raw!);
		expect(stored.analytics).toBe(true);
		expect(stored.marketing).toBe(true);
		expect(stored.version).toBe(3);
		expect(typeof stored.decidedAt).toBe('string');
	});

	it('rejectAll() persists snapshot + POSTs both false (opt-in strict)', async () => {
		await consent.init();
		await consent.rejectAll();

		expect(recordConsent).toHaveBeenCalledWith({ analytics: false, marketing: false });
		expect(consent.analyticsAllowed).toBe(false);
		expect(consent.marketingAllowed).toBe(false);
		expect(consent.bannerVisible).toBe(false);
		expect(consent.hasDecided).toBe(true);
	});

	it('updatePreferences() honours individual toggles', async () => {
		await consent.init();
		await consent.updatePreferences({ analytics: true, marketing: false });

		expect(recordConsent).toHaveBeenCalledWith({ analytics: true, marketing: false });
		expect(consent.analyticsAllowed).toBe(true);
		expect(consent.marketingAllowed).toBe(false);
	});

	it('revoke() clears local snapshot, re-shows banner, POSTs empty choices', async () => {
		await consent.init();
		await consent.acceptAll();
		expect(localStorage.getItem('skilluv-consent-v3')).toBeTruthy();

		await consent.revoke();

		expect(localStorage.getItem('skilluv-consent-v3')).toBeNull();
		expect(consent.snapshot).toBeNull();
		expect(consent.bannerVisible).toBe(true);
		expect(recordConsent).toHaveBeenLastCalledWith({ analytics: false, marketing: false });
	});

	it('init() still works when the version endpoint fails (falls back to cached)', async () => {
		localStorage.setItem('skilluv-consent-version', '5');
		consentVersion.mockRejectedValueOnce(new Error('offline'));

		await consent.init();

		expect(consent.version).toBe(5);
		expect(consent.bannerVisible).toBe(true);
	});
});
