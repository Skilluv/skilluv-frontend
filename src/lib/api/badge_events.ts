/**
 * Events — the whole of them, not just the stamp.
 *
 * ## What was broken here
 *
 * This module called `/badge-events`, `/badge-events/{slug}`,
 * `/badge-events/{slug}/join` and `/users/me/badge-events`. **None of those
 * four exist.** Nothing in the backend serves that prefix; the module and the
 * two pages built on it had been calling dead paths, so `/events` and
 * `/events/[slug]` were broken for every reader.
 *
 * The endpoints are `/events`, `/events/{slug}`, `/events/{slug}/join` and
 * `/users/me/events`. `routes::events` explains the consolidation: an event
 * grew a type, a place, a jury, a livestream and sponsors, and there is still
 * one table and one set of routes "because a hackathon that issues a stamp
 * *and* sells sponsorship is one event with one date". The stamp is still
 * emitted by `badge_engine`, which reads the participation rows.
 *
 * The file keeps its name so that nothing has to move at once, and the export
 * keeps its shape so the two pages keep working. What changed is the paths and
 * the payloads, which are richer: an event now carries its type, its location,
 * its participant ceiling and its showcase page, and the detail carries who is
 * backing it and where to watch.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * One event.
 *
 * `visual_theme` and `location_details` are free-form by design — the backend
 * stores what the front renders and does not care about the shape, which is
 * the right split for something a designer changes per edition.
 */
export interface SkilluvEvent {
	id: string;
	slug: string;
	name: string;
	description: string;
	/** Hackathon, fest, conference… the vocabulary grows server-side. */
	event_type: string;
	domain_focus: string[];
	location_type: string;
	location_details: Record<string, unknown>;
	max_participants: number | null;
	showcase_page_url: string | null;
	status: string;
	starts_at: string;
	ends_at: string | null;
	visual_theme: Record<string, unknown>;
	/** True for partner-hosted events, false for Skilluv-native ones. */
	is_partner: boolean;
}

export interface EventDetail {
	event: SkilluvEvent;
	participants: number;
	/** Signed sponsors, in the order their logos are sized. */
	sponsors: Record<string, unknown>[];
	livestreams: Record<string, unknown>[];
}

export interface JoinEventResponse {
	joined: boolean;
	event_slug: string;
	/** `participant`, `jury`, `organizer`, `speaker`, `sponsor_rep`. */
	role: string;
}

/**
 * One event the caller joined.
 *
 * Carries the slug and the name rather than the whole event, and a `role` —
 * so "my events" can be listed without a second call, but the card for one
 * has to be fetched. That is the right trade: a list of ten events does not
 * need ten visual themes.
 */
export interface MyEventRow {
	event_slug: string;
	event_name: string;
	/** `participant`, `jury`, `organizer`, `speaker`, `sponsor_rep`. */
	role: string;
	joined_at: string;
	/** The PR, repo or contribution counted for this event. */
	contribution_ref: string | null;
}

export const badgeEventsApi = {
	/** Every event on. Public. */
	list(eventType?: string) {
		return api.get<ApiResponse<{ events: SkilluvEvent[] }>>(
			'/events',
			eventType ? { event_type: eventType } : undefined
		);
	},

	/** One event, with who is backing it and where to watch. */
	detail(slug: string) {
		return api.get<ApiResponse<EventDetail>>(`/events/${encodeURIComponent(slug)}`);
	},

	join(slug: string) {
		return api.post<ApiResponse<JoinEventResponse>>(
			`/events/${encodeURIComponent(slug)}/join`,
			{}
		);
	},

	myEvents() {
		return api.get<ApiResponse<{ events: MyEventRow[] }>>('/users/me/events');
	}
};
