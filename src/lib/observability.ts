/**
 * Skilluv observability shell — Sentry (error tracking) + PostHog (analytics)
 *
 * Design (MVP §0.9): the observability providers are opt-in via env vars and
 * lazily loaded — code paths in the app call `captureException` / `capture`
 * unconditionally, and this module either forwards to the real SDK or no-ops
 * with a console warning (dev) / silent (prod).
 *
 * Activation:
 *   1. `npm install @sentry/sveltekit posthog-js`
 *   2. Set `PUBLIC_SENTRY_DSN` and/or `PUBLIC_POSTHOG_KEY` in your `.env`
 *   3. Optional: `PUBLIC_POSTHOG_HOST` (defaults to https://eu.i.posthog.com)
 *
 * Called at app boot from `+layout.svelte` via `observability.init()`.
 */

interface CaptureContext {
	tags?: Record<string, string>;
	extras?: Record<string, unknown>;
}

interface EventProps {
	[key: string]: string | number | boolean | null;
}

class Observability {
	private sentryReady = false;
	private posthogReady = false;
	private posthog: unknown = null;

	async init(): Promise<void> {
		if (typeof window === 'undefined') return;
		await Promise.all([this.initSentry(), this.initPosthog()]);
	}

	private async initSentry(): Promise<void> {
		const dsn = import.meta.env.PUBLIC_SENTRY_DSN as string | undefined;
		if (!dsn) return;
		try {
			// @ts-expect-error — Sentry SDK is opt-in; the import target is only
			// resolved when the package is actually installed.
			const Sentry = await import('@sentry/sveltekit');
			Sentry.init({
				dsn,
				tracesSampleRate: 0.1,
				environment: (import.meta.env.MODE as string) ?? 'production',
				release: (import.meta.env.PUBLIC_APP_VERSION as string) ?? 'unknown'
			});
			this.sentryReady = true;
		} catch {
			// SDK not installed — silent, this is a no-op mode.
		}
	}

	private async initPosthog(): Promise<void> {
		const key = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;
		if (!key) return;
		try {
			// @ts-expect-error — PostHog SDK is opt-in.
			const posthog = (await import('posthog-js')).default;
			posthog.init(key, {
				api_host:
					(import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined) ??
					'https://eu.i.posthog.com',
				person_profiles: 'identified_only',
				capture_pageview: true,
				capture_pageleave: true
			});
			this.posthog = posthog;
			this.posthogReady = true;
		} catch {
			// SDK not installed — silent.
		}
	}

	captureException(err: unknown, ctx?: CaptureContext): void {
		if (this.sentryReady && typeof window !== 'undefined') {
			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const g = window as unknown as { Sentry?: any };
				g.Sentry?.captureException?.(err, { tags: ctx?.tags, extra: ctx?.extras });
				return;
			} catch {
				// fall through to console
			}
		}
		if (import.meta.env.DEV) {
			// eslint-disable-next-line no-console
			console.warn('[observability] captureException (no Sentry):', err, ctx);
		}
	}

	capture(event: string, props?: EventProps): void {
		if (this.posthogReady && this.posthog) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this.posthog as any).capture?.(event, props);
				return;
			} catch {
				// fall through to console
			}
		}
		if (import.meta.env.DEV) {
			// eslint-disable-next-line no-console
			console.debug('[observability] capture (no PostHog):', event, props);
		}
	}

	identify(userId: string, traits?: Record<string, string | number | boolean>): void {
		if (this.posthogReady && this.posthog) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this.posthog as any).identify?.(userId, traits);
			} catch {
				// silent
			}
		}
	}
}

export const observability = new Observability();
