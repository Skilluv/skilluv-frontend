import type { UserPrivate, SkillDomain } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types requêtes/réponses auth ---

export interface RegisterRequest {
	email: string;
	username: string;
	password: string;
	first_name: string;
	last_name: string;
	skill_domain: SkillDomain;
	country?: string;
	city?: string;
}

export interface LoginRequest {
	identifier: string;
	password: string;
	totp_code?: string;
	email_2fa_code?: string;
}

interface AuthResponse {
	data: {
		user: UserPrivate;
		refresh_token: string;
		message?: string;
	};
}

interface LoginResponse {
	data: {
		user?: UserPrivate;
		refresh_token?: string;
		requires_email_2fa?: boolean;
		user_id?: string;
	};
}

interface MeResponse {
	data: {
		user: UserPrivate;
		rank: { global: number; domain: number };
	};
}

interface MessageResponse {
	data: { message: string };
}

interface TotpSetupResponse {
	data: {
		otpauth_url: string;
		secret_base32: string;
		message: string;
	};
}

// --- Fonctions API ---

export const authApi = {
	register(data: RegisterRequest) {
		return api.post<AuthResponse>('/auth/register', data);
	},

	login(data: LoginRequest) {
		return api.post<LoginResponse>('/auth/login', data);
	},

	verifyEmail2fa(code: string, userId?: string) {
		return api.post<AuthResponse>('/auth/email-2fa/verify', { code, user_id: userId });
	},

	refresh(refreshToken: string, userId: string) {
		return api.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken, user_id: userId });
	},

	verifyEmail(token: string) {
		return api.get<MessageResponse>(`/auth/verify-email?token=${token}`);
	},

	forgotPassword(email: string) {
		return api.post<MessageResponse>('/auth/forgot-password', { email });
	},

	resetPassword(token: string, newPassword: string) {
		return api.post<MessageResponse>('/auth/reset-password', { token, new_password: newPassword });
	},

	me() {
		return api.get<MeResponse>('/auth/me');
	},

	logout() {
		return api.post<MessageResponse>('/auth/logout');
	},

	changePassword(currentPassword: string, newPassword: string) {
		return api.post<MessageResponse>('/auth/change-password', {
			current_password: currentPassword,
			new_password: newPassword
		});
	},

	resendVerification() {
		return api.post<MessageResponse>('/auth/resend-verification');
	},

	totpSetup() {
		return api.post<TotpSetupResponse>('/auth/totp/setup');
	},

	totpEnable(code: string) {
		return api.post<MessageResponse>('/auth/totp/enable', { code });
	},

	totpDisable(code: string) {
		return api.post<MessageResponse>('/auth/totp/disable', { code });
	},

	enableEmail2fa() {
		return api.post<MessageResponse>('/auth/email-2fa/enable');
	},

	disableEmail2fa(currentPassword: string, newPassword: string) {
		return api.post<MessageResponse>('/auth/email-2fa/disable', {
			current_password: currentPassword,
			new_password: newPassword
		});
	},

	deleteAccount(password: string, totpCode?: string) {
		return api.delete<MessageResponse>('/auth/account', { password, totp_code: totpCode });
	}
};
