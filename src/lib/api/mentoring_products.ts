/**
 * Paid mentoring: subscriptions, availability, programmes, and the hours
 * somebody gave for free.
 *
 * Distinct from `$api/mentorship`, which is the pairing and the sessions. This
 * is what is *sold* around it, and the two are separate because a mentor who
 * charges and a mentor who volunteers are the same person doing different
 * things.
 *
 * ## Volunteer hours are recorded, not billed
 *
 * `mentors/me/volunteer-hours` exists so unpaid help is on the record. A
 * platform that only counted paid sessions would make the people who help most
 * look like the people who help least, and the whole idea of a craft record is
 * that it reflects what somebody actually did.
 *
 * ## Cancelling does not cut access
 *
 * The cancel response says so itself: `auto_renew: false` and
 * `access_until_period_end: true`. Somebody who cancels has paid for the
 * period and keeps it, and a surface that renders cancellation as "ended"
 * would make them think they lost what they bought.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface MentorSubscription {
	id: string;
	[key: string]: unknown;
}

export const mentoringProductsApi = {
	/** Subscribe to a mentor. */
	subscribe(mentorId: string, body?: Record<string, unknown>) {
		return api.post<ApiResponse<{ subscription: MentorSubscription }>>(
			`/mentors/${encodeURIComponent(mentorId)}/subscribe`,
			body ?? {}
		);
	},

	mySubscriptions() {
		return api.get<ApiResponse<{ subscriptions: MentorSubscription[] }>>(
			'/users/me/mentor-subscriptions'
		);
	},

	/**
	 * Stop the renewal.
	 *
	 * Not "end it". The response is explicit — `auto_renew: false`,
	 * `access_until_period_end: true` — and a surface must say the same: the
	 * period is paid for and stays.
	 */
	cancel(subscriptionId: string) {
		return api.post<ApiResponse<{ auto_renew: boolean; access_until_period_end: boolean }>>(
			`/mentor-subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
			{}
		);
	},

	/**
	 * What has been used this period, against what is included.
	 *
	 * Both numbers come back together and belong together: "three sessions
	 * used" means nothing without "of five".
	 */
	usage(subscriptionId: string) {
		return api.get<ApiResponse<{ used_this_month: number; included: number }>>(
			`/mentor-subscriptions/${encodeURIComponent(subscriptionId)}/usage`
		);
	},

	/** Record hours given for free, so unpaid help is on the record. */
	recordVolunteerHours(body: { mentee_user_id: string; hours: string; session_id?: string }) {
		return api.post<ApiResponse<unknown>>('/mentors/me/volunteer-hours', body);
	},

	/**
	 * Offer a slot.
	 *
	 * Carries a timezone because a mentor in Cotonou and a mentee in Paris
	 * disagree about what "14:00" means, and a slot that renders in the
	 * reader's zone without saying which one it was set in produces missed
	 * sessions.
	 */
	openSlot(body: {
		date: string;
		start_time: string;
		end_time: string;
		timezone?: string;
	}) {
		return api.post<ApiResponse<{ slot_id: string }>>('/mentors/me/open-slots', body);
	},

	/** A mentor's free slots. Public, so somebody can see before subscribing. */
	openSlots(mentorId: string) {
		return api.get<ApiResponse<{ slots: unknown[] }>>(
			`/mentors/${encodeURIComponent(mentorId)}/open-slots`
		);
	},

	/** Structured mentoring programmes currently open. */
	programs() {
		return api.get<ApiResponse<{ programs: unknown[] }>>('/mentoring-programs');
	},

	/**
	 * Enrol somebody.
	 *
	 * Takes an email and a name rather than only a user id: a company enrolling
	 * a junior who is not on Skilluv yet is the normal case, and requiring an
	 * account first would mean the programme cannot start until they make one.
	 */
	enrol(programId: string, body: { mentee_email?: string; mentee_name?: string }) {
		return api.post<ApiResponse<unknown>>(
			`/mentoring-programs/${encodeURIComponent(programId)}/enrol`,
			body
		);
	}
};
