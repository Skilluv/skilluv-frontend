import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Analytics must not start before consent, and must stop after withdrawal.
 *
 * This is the assertion the whole change exists for. The bug it pins was
 * invisible from the outside: `observability.init()` ran on mount and loaded
 * PostHog with `capture_pageview: true`, so every EU visitor was measured
 * before being asked. Nothing failed, no type complained, and the only symptom
 * was a legal one.
 *
 * It stayed dormant purely because PUBLIC_POSTHOG_KEY was unset in every
 * environment so far — which is why the tests set it. A test that leaves the
 * key empty passes against the bug as happily as against the fix.
 */

const posthogInit = vi.fn();
const optOut = vi.fn();
const sentryInit = vi.fn();

vi.mock('posthog-js', () => ({
	default: {
		init: (...a: unknown[]) => posthogInit(...a),
		opt_out_capturing: () => optOut(),
		capture: vi.fn(),
		identify: vi.fn()
	}
}));

vi.mock('@sentry/sveltekit', () => ({
	init: (...a: unknown[]) => sentryInit(...a),
	captureException: vi.fn()
}));

describe('analytics consent gate', () => {
	beforeEach(() => {
		vi.resetModules();
		posthogInit.mockClear();
		optOut.mockClear();
		sentryInit.mockClear();
		vi.stubEnv('PUBLIC_POSTHOG_KEY', 'phc_test_key');
		vi.stubEnv('PUBLIC_SENTRY_DSN', '');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('does not load PostHog when consent has not been given', async () => {
		const { observability } = await import('../../src/lib/observability');
		await observability.init(false);
		expect(posthogInit).not.toHaveBeenCalled();
	});

	it('defaults to not loading it when called with no argument', async () => {
		// The default matters as much as the explicit false: an unaudited call
		// site that forgets the argument must fail closed, not open.
		const { observability } = await import('../../src/lib/observability');
		await observability.init();
		expect(posthogInit).not.toHaveBeenCalled();
	});

	it('loads PostHog once consent is given', async () => {
		const { observability } = await import('../../src/lib/observability');
		await observability.init(true);
		expect(posthogInit).toHaveBeenCalledTimes(1);
		expect(posthogInit).toHaveBeenCalledWith('phc_test_key', expect.any(Object));
	});

	it('does not boot it twice when init runs again', async () => {
		// init() runs at mount and again when consent arrives, so a second
		// capture-enabled boot would double every pageview.
		const { observability } = await import('../../src/lib/observability');
		await observability.init(false);
		await observability.init(true);
		await observability.init(true);
		expect(posthogInit).toHaveBeenCalledTimes(1);
	});

	it('opts out of capturing when consent is withdrawn', async () => {
		// Dropping the reference is not enough: the loaded SDK keeps its own
		// cookies and would carry on sending pageviews.
		const { observability } = await import('../../src/lib/observability');
		await observability.init(true);
		observability.stopAnalytics();
		expect(optOut).toHaveBeenCalledTimes(1);
	});

	it('can be started again after a withdrawal', async () => {
		const { observability } = await import('../../src/lib/observability');
		await observability.init(true);
		observability.stopAnalytics();
		await observability.init(true);
		expect(posthogInit).toHaveBeenCalledTimes(2);
	});

	it('leaves Sentry alone, since it is not gated on consent', async () => {
		// Crash reports keep the service running and rest on legitimate
		// interest; behavioural measurement does not. Gating them together
		// would mean losing error reporting for anyone who declines analytics.
		vi.stubEnv('PUBLIC_SENTRY_DSN', 'https://public@example.invalid/1');
		const { observability } = await import('../../src/lib/observability');
		await observability.init(false);
		expect(sentryInit).toHaveBeenCalledTimes(1);
		expect(posthogInit).not.toHaveBeenCalled();
	});
});
