import type { UserPrivate } from '$lib/types';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type {
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
	AuthenticationResponseJSON
} from '@simplewebauthn/browser';
import { createApiClient, SkilluError } from './client';

const api = createApiClient();

export interface WebauthnCredential {
	id: string;
	label: string | null;
	last_used_at: string | null;
	created_at: string;
}

interface RegisterStartResponse {
	data: {
		ceremony_handle: string;
		publicKey: PublicKeyCredentialCreationOptionsJSON;
		label: string | null;
	};
}

interface LoginStartResponse {
	data: {
		ceremony_handle: string;
		publicKey: PublicKeyCredentialRequestOptionsJSON;
	};
}

interface LoginFinishResponse {
	data: {
		user: UserPrivate;
		csrf_token?: string;
		auth_method: 'passkey';
	};
}

interface CredentialsList {
	data: { credentials: WebauthnCredential[] };
}

/**
 * Feature detection: does the browser support platform-attached passkeys?
 * Falls back gracefully to `false` on old browsers / non-secure contexts.
 */
export function isPasskeySupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof window.PublicKeyCredential !== 'undefined' &&
		typeof navigator?.credentials?.create === 'function'
	);
}

export const webauthnApi = {
	/** End-to-end passkey enrolment (browser prompt included). */
	async register(label?: string): Promise<{ id: string }> {
		if (!isPasskeySupported()) {
			throw new Error('Passkeys are not supported on this device');
		}
		const start = await api.post<RegisterStartResponse>('/auth/webauthn/register/start', { label });
		let attResp: RegistrationResponseJSON;
		try {
			attResp = await startRegistration({ optionsJSON: start.data.publicKey });
		} catch (err) {
			throw new SkilluError(
				'WEBAUTHN_CEREMONY_CANCELLED',
				(err as Error)?.message ?? 'Passkey ceremony cancelled',
				0
			);
		}
		const finish = await api.post<{ data: { id: string; message: string } }>(
			'/auth/webauthn/register/finish',
			{
				ceremony_handle: start.data.ceremony_handle,
				credential: attResp,
				label
			}
		);
		return { id: finish.data.id };
	},

	/** End-to-end passkey sign-in (browser prompt included). Returns the user on success. */
	async login(identifier: string): Promise<UserPrivate> {
		if (!isPasskeySupported()) {
			throw new Error('Passkeys are not supported on this device');
		}
		const start = await api.post<LoginStartResponse>('/auth/webauthn/login/start', { identifier });
		let assertResp: AuthenticationResponseJSON;
		try {
			assertResp = await startAuthentication({ optionsJSON: start.data.publicKey });
		} catch (err) {
			throw new SkilluError(
				'WEBAUTHN_CEREMONY_CANCELLED',
				(err as Error)?.message ?? 'Passkey ceremony cancelled',
				0
			);
		}
		const finish = await api.post<LoginFinishResponse>('/auth/webauthn/login/finish', {
			ceremony_handle: start.data.ceremony_handle,
			credential: assertResp
		});
		return finish.data.user;
	},

	list() {
		return api.get<CredentialsList>('/auth/webauthn/credentials');
	},

	rename(id: string, label: string) {
		return api.patch<{ data: { message: string } }>(`/auth/webauthn/credentials/${id}`, { label });
	},

	remove(id: string) {
		return api.delete<{ data: { message: string } }>(`/auth/webauthn/credentials/${id}`);
	}
};
