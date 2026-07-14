import type { UserPrivate } from '$lib/types';

/**
 * Where to send a user right after a successful authentication event
 * (password login, passkey, magic link, OAuth, SSO callback).
 *
 * Every login handler used to inline `user.profile_active ? '/' :
 * '/challenges/onboarding'`, which is a candidate-only heuristic. Enterprise
 * and recruiter accounts have `profile_active=false` (that flag is a talent
 * marketplace concept), so they'd land in the candidate onboarding — a screen
 * asking them to pick a skill_domain. Centralising the routing here keeps
 * every entry point aligned.
 *
 * Rules:
 *   - admin       → bounced to /auth/login (admins belong on admin.skilluv.com)
 *   - enterprise / recruiter → /enterprise/dashboard
 *   - candidate   → / when the profile is active, /challenges/onboarding otherwise
 *
 * Admin case: an admin account must never end up on the public shell — see
 * hooks.server.ts. Returning the login page with an explicit error param
 * lets the login page surface a "please use admin.skilluv.com" message
 * without a race with the SSR redirect.
 */
export function postLoginDestination(user: UserPrivate): string {
	switch (user.role) {
		case 'admin':
			return '/auth/login?error=admin_wrong_frontend';
		case 'enterprise':
		case 'recruiter':
			return '/enterprise/dashboard';
		default:
			return user.profile_active ? '/' : '/challenges/onboarding';
	}
}
