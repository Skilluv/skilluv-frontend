import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Les trois canaux, dans l'ordre où l'écran les présente. */
export const CHANNELS = ['in_app', 'push', 'email'] as const;
export type Channel = (typeof CHANNELS)[number];

/**
 * Un type de notification, avec les réglages effectifs de l'appelant.
 *
 * « Effectifs » veut dire : son choix stocké, sinon le défaut du catalogue.
 * Le backend fait la fusion, donc l'écran n'a jamais à distinguer « jamais
 * touché » de « explicitement laissé comme ça ».
 */
export interface KindPreference {
	/** Identifiant pointé : `social.mention`, `payout.sent`. */
	kind: string;
	/** Regroupement d'affichage : `payments`, `social`, `guild`… */
	category: string;
	/** Titre traduit dans la langue de l'appelant. */
	label: string;
	/**
	 * Canaux que ce type peut utiliser. Un canal absent d'ici ne peut pas
	 * être activé, quoi que dise la requête — l'écran ne doit donc pas
	 * afficher d'interrupteur pour lui.
	 */
	available_channels: Channel[];
	in_app: boolean;
	push: boolean;
	email: boolean;
	/**
	 * Ne peut pas être coupé. À afficher comme fixe plutôt qu'en
	 * interrupteur qui revient tout seul : un virement échoué part quoi
	 * qu'il arrive, et prétendre le contraire est un mensonge.
	 */
	transactional: boolean;
}

/** Modification partielle : seuls les canaux fournis sont touchés. */
export interface PreferenceUpdate {
	kind: string;
	in_app?: boolean;
	push?: boolean;
	email?: boolean;
}

export interface UpdateResult {
	updated: number;
	/**
	 * Refusées, avec la raison. Le backend les remonte au lieu de les
	 * ignorer : un écran qui montre un interrupteur bouger alors que le
	 * serveur n'en a rien fait est pire qu'une erreur.
	 */
	rejected: string[];
}

/** Fenêtre de silence. Les deux bornes ou aucune, et un fuseau avec. */
export interface QuietHours {
	start: number | null;
	end: number | null;
	/** Nom IANA, ex. `Africa/Porto-Novo`. */
	timezone: string | null;
}

export const notificationPreferencesApi = {
	/**
	 * GET /users/me/notification-preferences
	 *
	 * Renvoie aussi la fenêtre de silence. Elle voyage ici plutôt que sur
	 * un endpoint à elle : elle pouvait être écrite et jamais relue, donc
	 * l'écran repartait des valeurs par défaut et écrasait le choix de la
	 * personne au premier enregistrement.
	 */
	list(): Promise<{ data: { preferences: KindPreference[]; quiet_hours: QuietHours } }> {
		return api.get<{ data: { preferences: KindPreference[]; quiet_hours: QuietHours } }>(
			'/users/me/notification-preferences'
		);
	},

	/** PUT /users/me/notification-preferences */
	update(preferences: PreferenceUpdate[]): Promise<{ data: UpdateResult }> {
		return api.put<{ data: UpdateResult }>('/users/me/notification-preferences', {
			preferences
		});
	},

	/**
	 * PUT /users/me/notification-preferences/reset — retour aux défauts.
	 *
	 * Le backend supprime les surcharges au lieu d'écrire les défauts :
	 * l'absence de ligne *est* le défaut, et une ligne qui stocke un défaut
	 * ne peut plus être distinguée d'un choix délibéré.
	 */
	reset(): Promise<ApiResponse<{ cleared: number }>> {
		return api.put<ApiResponse<{ cleared: number }>>(
			'/users/me/notification-preferences/reset',
			{}
		);
	},

	/**
	 * PUT /users/me/quiet-hours
	 *
	 * `start` et `end` à `null` ensemble effacent la fenêtre. Le fuseau
	 * survit à l'effacement : il appartient à la personne, pas à la
	 * fenêtre.
	 */
	setQuietHours(body: {
		start: number | null;
		end: number | null;
		timezone: string | null;
	}): Promise<ApiResponse<QuietHours>> {
		return api.put<ApiResponse<QuietHours>>('/users/me/quiet-hours', body);
	}
};
