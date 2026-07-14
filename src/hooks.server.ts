import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { UserPrivate } from '$lib/types';

/**
 * Routes accessible whatever the completion / role state — auth flows,
 * legal pages, the API proxy, and the onboarding form itself.
 */
const ONBOARDING_ALLOWLIST = [
	'/onboarding/complete-profile',
	'/auth/', // login, logout, register, magic-link, verify-email, change-email/confirm
	'/legal/',
	'/api/'
];

/**
 * Cross-role neutral routes — anyone signed in reaches them regardless of the
 * "workspace" they live in. `/settings` is deliberately NOT neutral: the
 * candidate settings live under `/settings/*` and the enterprise variant
 * under `/enterprise/settings/*`, so recruiters never see the candidate
 * gamification chrome that surrounds `/settings/security` and vice versa.
 * Notifications stays cross-role because the notification list is identical
 * for both personas.
 */
const NEUTRAL_PREFIXES = ['/auth/', '/legal/', '/notifications', '/api/'];

/**
 * Enterprise workspace routes — dashboards, talents, SSO/SCIM config, invite
 * flows. The register + invite pages are open bootstrap paths that any user
 * (or visitor) can reach.
 */
const ENTERPRISE_PREFIXES = ['/enterprise/'];

function matchesAny(pathname: string, prefixes: string[]): boolean {
	return prefixes.some((prefix) => {
		const normalised = prefix.replace(/\/$/, '');
		return pathname === normalised || pathname.startsWith(prefix.endsWith('/') ? prefix : prefix + '/') || pathname === prefix;
	});
}

/**
 * Sanctuary: routes that MUST render even when auth state doesn't match the
 * user's expected workspace. Prevents redirect loops for bootstrap flows.
 */
const BOOTSTRAP_PATHS = ['/enterprise/register', '/enterprise/invite/accept'];

function isBootstrap(pathname: string): boolean {
	return BOOTSTRAP_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('access_token');

	if (accessToken) {
		try {
			const apiUrl = env.API_URL ?? 'http://localhost:3001/api';
			const response = await fetch(`${apiUrl}/auth/me`, {
				headers: {
					Cookie: `access_token=${accessToken}`
				}
			});

			if (response.ok) {
				const body = (await response.json()) as {
					data: { user: UserPrivate; has_passkey?: boolean };
				};
				event.locals.user = body.data.user;
				event.locals.hasPasskey = body.data.has_passkey ?? false;
			} else {
				event.locals.user = null;
				event.locals.hasPasskey = false;
			}
		} catch {
			event.locals.user = null;
			event.locals.hasPasskey = false;
		}
	} else {
		event.locals.user = null;
		event.locals.hasPasskey = false;
	}

	const pathname = event.url.pathname;

	// Pattern C onboarding gate: authenticated candidates without a completed
	// profile are pinned to the onboarding form until they pick skill_domain +
	// accept the terms. Enterprise/recruiter accounts have profile_completed
	// forced true by the backend at register time (skill_domain='code' hardcoded,
	// terms_accepted_at populated), so they never trigger this branch.
	if (
		event.locals.user &&
		!event.locals.user.profile_completed &&
		!ONBOARDING_ALLOWLIST.some((prefix) => pathname === prefix.replace(/\/$/, '') || pathname.startsWith(prefix))
	) {
		throw redirect(303, '/onboarding/complete-profile');
	}

	// ─── Role-based workspace isolation ────────────────────────────
	//
	// Hard rule: an enterprise/recruiter must NEVER see the candidate
	// gamification shell (challenges, forum, guilds, leaderboards, feed…) and
	// a candidate must NEVER see the enterprise workspace (except the two
	// bootstrap paths that let a candidate become an enterprise / accept an
	// invite). Admins have their own frontend (admin.skilluv.com) and
	// should not be able to reach ANY page on the public shell — see the
	// admin branch below.
	//
	// The redirect happens server-side so a user can't just type the URL to
	// bypass the enterprise layout guard.
	if (event.locals.user && !isBootstrap(pathname)) {
		const role = event.locals.user.role;
		const isNeutral = matchesAny(pathname, NEUTRAL_PREFIXES);
		const isEnterprisePath = matchesAny(pathname, ENTERPRISE_PREFIXES);

		// Candidate settings live under `/settings/*`. If an enterprise or
		// recruiter tries to hit them (typed URL, stale bookmark, or the
		// legacy TOTP-required redirect target), route them into the
		// mirrored enterprise settings under `/enterprise/settings/*` — so
		// they never see the candidate shell.
		const isCandidateSettings =
			pathname === '/settings' || pathname.startsWith('/settings/');
		const isEnterpriseSettings = pathname.startsWith('/enterprise/settings');
		// Bootstrap-adjacent enterprise routes that MUST render even when the
		// account hasn't armed 2FA yet — the onboarding wizard is literally
		// where the user goes to arm it, so gating it would trap them in an
		// infinite redirect loop. `/enterprise/settings/*` is exempt for the
		// same reason (the wizard's "add later" flow drops here).
		const isEnterpriseBootstrap =
			pathname === '/enterprise/onboarding' ||
			pathname.startsWith('/enterprise/onboarding/') ||
			isEnterpriseSettings;

		if (role === 'enterprise' || role === 'recruiter') {
			if (isCandidateSettings) {
				// Preserve the setup_totp / next / any other query params so
				// the enterprise-side redirect from a TOTP gate keeps working.
				const suffix = pathname.slice('/settings'.length); // '' or '/security' or '/x/y'
				const target = suffix
					? `/enterprise/settings${suffix}`
					: '/enterprise/settings';
				const query = event.url.search;
				throw redirect(303, target + query);
			}
			// Anything else that isn't the workspace or a neutral route is
			// candidate territory — bounce them home. Root `/` is candidate
			// landing so it also redirects.
			if (!isEnterprisePath && !isNeutral) {
				throw redirect(303, '/enterprise/dashboard');
			}
			// Extra gates ONLY when entering the workspace itself. The
			// onboarding wizard + settings sub-workspace are exempt so the
			// user can actually reach the pages where they arm 2FA.
			if (isEnterprisePath && !isEnterpriseBootstrap) {
				if (!event.locals.user.email_verified) {
					throw redirect(303, '/auth/verify-email?next=/enterprise/dashboard');
				}
				// The client-side layout guard also honours the login_method
				// (webauthn / sso bypass TOTP). At the SSR layer we err on the
				// safe side and always require totp_enabled — if the session
				// was minted with a strong factor, the backend still 200s the
				// downstream API calls, but sending an SSR user through the
				// setup once cements the TOTP fallback for them.
				// Enterprise 2FA gate: satisfied by EITHER TOTP or an enrolled
				// passkey — either strong factor covers future logins. Only
				// redirect to the wizard when neither is armed.
				if (!event.locals.user.totp_enabled && !event.locals.hasPasskey) {
					throw redirect(303, '/enterprise/onboarding');
				}
			}
		} else if (role === 'admin') {
			// Admins live on admin.skilluv.com — kick them out of the public
			// app entirely. The auth/* routes stay reachable so they can log
			// out or re-sign in with the right account. Every other page,
			// including root, redirects to the login screen with a clear
			// error the client-side login page surfaces as a message.
			if (!pathname.startsWith('/auth/')) {
				throw redirect(303, '/auth/login?error=admin_wrong_frontend');
			}
		} else {
			// role === 'user' (candidate). Block the enterprise workspace
			// (except the bootstrap paths already handled above).
			if (isEnterprisePath) {
				throw redirect(303, '/');
			}
		}
	}

	return resolve(event);
};
