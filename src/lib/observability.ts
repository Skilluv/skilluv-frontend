/**
 * Skilluv observability shell — Sentry (error tracking) + PostHog (analytics)
 *
 * Design (MVP §0.9): the observability providers are opt-in via env vars.
 * Les SDK sont installes en dependances mais ne s'activent que si les
 * `PUBLIC_SENTRY_DSN` / `PUBLIC_POSTHOG_KEY` sont renseignes. Sinon les
 * methodes `captureException` / `capture` no-op (silent en prod, log en dev).
 *
 * Called at app boot from `+layout.svelte` via `observability.init()` +
 * declenche en fallback depuis `hooks.client.ts` / `hooks.server.ts` sur
 * chaque erreur non-catch.
 */

import * as Sentry from '@sentry/sveltekit';
import posthog from 'posthog-js';
import type { PostHog } from 'posthog-js';

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
	private posthog: PostHog | null = null;

	async init(): Promise<void> {
		if (typeof window === 'undefined') return;
		this.initSentry();
		this.initPosthog();
	}

	private initSentry(): void {
		const dsn = import.meta.env.PUBLIC_SENTRY_DSN as string | undefined;
		if (!dsn) return;
		Sentry.init({
			dsn,
			tracesSampleRate: 0.1,
			environment: import.meta.env.MODE ?? 'production',
			release: (import.meta.env.PUBLIC_APP_VERSION as string | undefined) ?? 'unknown'
		});
		this.sentryReady = true;
	}

	private initPosthog(): void {
		const key = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;
		if (!key) return;
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
	}

	captureException(err: unknown, ctx?: CaptureContext): void {
		if (this.sentryReady) {
			Sentry.captureException(err, { tags: ctx?.tags, extra: ctx?.extras });
			return;
		}
		if (import.meta.env.DEV) {
			console.warn('[observability] captureException (no Sentry):', err, ctx);
		}
	}

	capture(event: string, props?: EventProps): void {
		if (this.posthogReady && this.posthog) {
			this.posthog.capture(event, props);
			return;
		}
		if (import.meta.env.DEV) {
			console.debug('[observability] capture (no PostHog):', event, props);
		}
	}

	identify(userId: string, traits?: Record<string, string | number | boolean>): void {
		if (this.posthogReady && this.posthog) {
			this.posthog.identify(userId, traits);
		}
	}
}

export const observability = new Observability();
