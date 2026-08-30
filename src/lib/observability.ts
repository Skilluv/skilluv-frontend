/**
 * Skilluv observability shell — Sentry (error tracking) + PostHog (analytics)
 *
 * Design (MVP §0.9): the observability providers are opt-in via env vars.
 * Les SDK sont installes en dependances mais charges via dynamic import :
 * ils n'entrent dans le bundle client QUE quand un DSN/key est configure.
 * Sinon zero cout au boot — critique pour la perf mobile des visiteurs.
 *
 * Called at app boot from `+layout.svelte` via `observability.init()` +
 * declenche en fallback depuis `hooks.client.ts` / `hooks.server.ts` sur
 * chaque erreur non-catch.
 */

import type * as SentryType from '@sentry/sveltekit';
import type { PostHog } from 'posthog-js';

interface CaptureContext {
	tags?: Record<string, string>;
	extras?: Record<string, unknown>;
}

interface EventProps {
	[key: string]: string | number | boolean | null;
}

class Observability {
	private sentry: typeof SentryType | null = null;
	private posthog: PostHog | null = null;

	/**
	 * Boot the providers the visitor has actually allowed.
	 *
	 * The two are not equivalent and are not gated together. Sentry receives
	 * crash reports needed to keep the service running and is covered by
	 * legitimate interest; PostHog measures behaviour and is not, so it waits
	 * for an explicit opt-in.
	 *
	 * `analyticsAllowed` is read at call time rather than captured, because
	 * this runs again when the visitor changes their mind.
	 */
	async init(analyticsAllowed = false): Promise<void> {
		if (typeof window === 'undefined') return;
		const jobs: Promise<void>[] = [this.initSentry()];
		if (analyticsAllowed) jobs.push(this.initPosthog());
		await Promise.all(jobs);
	}

	/**
	 * Stop analytics after a withdrawal.
	 *
	 * A consent that cannot be withdrawn as easily as it was given is not
	 * consent, so this has to do more than flip a flag: PostHog keeps its own
	 * cookies and would carry on capturing pageviews from the already-loaded
	 * module. `opt_out_capturing()` is what actually stops it and clears them.
	 */
	stopAnalytics(): void {
		if (!this.posthog) return;
		try {
			this.posthog.opt_out_capturing();
		} catch {
			// Older builds may not expose it; dropping the reference below is
			// still enough to stop everything this app sends.
		}
		this.posthog = null;
	}

	private async initSentry(): Promise<void> {
		// init() runs twice by design — once at mount, once if consent is later
		// granted — so both providers guard against a second boot.
		if (this.sentry) return;
		const dsn = import.meta.env.PUBLIC_SENTRY_DSN as string | undefined;
		if (!dsn) return;
		const mod = await import('@sentry/sveltekit');
		mod.init({
			dsn,
			tracesSampleRate: 0.1,
			environment: import.meta.env.MODE ?? 'production',
			release: (import.meta.env.PUBLIC_APP_VERSION as string | undefined) ?? 'unknown'
		});
		this.sentry = mod;
	}

	private async initPosthog(): Promise<void> {
		if (this.posthog) return;
		const key = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;
		if (!key) return;
		const mod = await import('posthog-js');
		mod.default.init(key, {
			api_host:
				(import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined) ??
				'https://eu.i.posthog.com',
			person_profiles: 'identified_only',
			capture_pageview: true,
			capture_pageleave: true
		});
		this.posthog = mod.default;
	}

	captureException(err: unknown, ctx?: CaptureContext): void {
		if (this.sentry) {
			this.sentry.captureException(err, { tags: ctx?.tags, extra: ctx?.extras });
			return;
		}
		if (import.meta.env.DEV) {
			console.warn('[observability] captureException (no Sentry):', err, ctx);
		}
	}

	capture(event: string, props?: EventProps): void {
		if (this.posthog) {
			this.posthog.capture(event, props);
			return;
		}
		if (import.meta.env.DEV) {
			console.debug('[observability] capture (no PostHog):', event, props);
		}
	}

	identify(userId: string, traits?: Record<string, string | number | boolean>): void {
		if (this.posthog) {
			this.posthog.identify(userId, traits);
		}
	}
}

export const observability = new Observability();
