/**
 * Accusing a contest entry of being copied, and letting its author answer.
 *
 * Three surfaces, and the middle one is the reason the other two exist: the
 * accused replies before anybody decides. The backend notifies them with the
 * accusation in full and sets a deadline, because being disqualified by a
 * process nobody told you about is the failure this whole flow prevents.
 *
 * Distinct from `$api/moderation`'s `plagiarism` namespace, which works the
 * `fraud/deliverables` queue over challenge deliverables. This one is contest
 * entries, and the two share no table.
 *
 * Raising a case is open to any authenticated member rather than to jurors
 * only: plagiarism is usually spotted by the one person who recognises the
 * original, and that is rarely whoever happens to be judging.
 */

import type {
	ApiResponse,
	FlagPlagiarismRequest,
	PlagiarismCase,
	RespondToPlagiarismRequest
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const contestPlagiarismApi = {
	/**
	 * Raise a case against a contest entry.
	 *
	 * 409 when a case is already open on that entry — a second accusation adds
	 * nothing and would restart the clock the accused is answering against.
	 */
	flag(submissionId: string, payload: FlagPlagiarismRequest) {
		return api.post<ApiResponse<PlagiarismCase>>(
			`/contests/submissions/${submissionId}/flag`,
			payload
		);
	},

	/**
	 * Read a case.
	 *
	 * The accused and the reviewers, nobody else. A 403 here is the system
	 * working, not a bug, and surfaces should say so rather than showing a
	 * generic failure on a page somebody was never meant to open.
	 */
	read(caseId: string) {
		return api.get<ApiResponse<PlagiarismCase>>(`/contests/plagiarism/${caseId}`);
	},

	/** Answer an accusation, before the deadline on the case. */
	respond(caseId: string, payload: RespondToPlagiarismRequest) {
		return api.post<ApiResponse<PlagiarismCase>>(
			`/contests/plagiarism/${caseId}/respond`,
			payload
		);
	}
};

/**
 * Whether the deadline to answer has passed.
 *
 * Read from the case rather than tracked client-side: a countdown that
 * disagrees with the server about whether somebody may still reply is worse
 * than no countdown.
 */
export function respondWindowClosed(entry: PlagiarismCase, now = new Date()): boolean {
	return new Date(entry.respond_by).getTime() <= now.getTime();
}
