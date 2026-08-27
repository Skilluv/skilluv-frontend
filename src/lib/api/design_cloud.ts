/**
 * Connecting a design tool, and reading what a pasted link points at.
 *
 * The two halves are in very different states, and the UI has to be honest
 * about which is which:
 *
 * - **Reading a link works today.** `inspect` is public, unauthenticated, and
 *   parses a string. It is what lets the front warn about a private Figma
 *   link *before* a deliverable is handed in rather than after a reviewer has
 *   failed to open it.
 * - **Connecting an account does not, yet.** Skilluv holds no developer
 *   account on Figma, Miro or Webflow, so `start` answers 503 naming the
 *   missing variable. That is not a bug to swallow: a button that silently
 *   does nothing is worse than a button that says why, which is exactly what
 *   the backend chose, and the surface repeats it.
 */

import type {
	ApiResponse,
	DesignCloudConnection,
	DesignCloudInspection,
	DesignCloudStart
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const designCloudApi = {
	/** What this person has connected. Empty for everyone until a deployment
	 * carries credentials. */
	connections() {
		return api.get<ApiResponse<DesignCloudConnection[]>>('/design/cloud/connections');
	},

	/**
	 * Begin connecting a tool.
	 *
	 * Answers 503 when the deployment has no credentials for that provider,
	 * with the variable named in the message. Callers surface that message
	 * rather than a generic failure.
	 */
	start(provider: string) {
		return api.get<ApiResponse<DesignCloudStart>>(
			`/design/cloud/${encodeURIComponent(provider)}/start`
		);
	},

	/**
	 * Disconnect a tool, wiping its tokens.
	 *
	 * 204 whether or not there was a connection: disconnecting something
	 * already disconnected is not an error, and a 404 would tell a caller
	 * whether an account was connected.
	 */
	disconnect(provider: string) {
		return api.post<void>(`/design/cloud/${encodeURIComponent(provider)}/disconnect`);
	},

	/**
	 * Read a pasted link.
	 *
	 * Public and side-effect free, so it can run on every keystroke's debounce
	 * in a submit form. A `warning` is server-authored and shown verbatim.
	 */
	inspect(url: string) {
		return api.get<ApiResponse<DesignCloudInspection>>('/design/cloud/inspect', { url });
	}
};

/**
 * The longest a URL the inspector will accept, mirroring the server's
 * `check_max_len`. Checked here so an over-long paste is refused in the field
 * instead of costing a round trip that can only answer 400.
 */
export const INSPECT_URL_MAX_LENGTH = 2048;
