/**
 * Voice castings — the audio domain's own hiring loop.
 *
 * A casting is a call for a voice on one slice: a character brief, a sample
 * line everybody records, a deadline, and a blind by default. Blind is the
 * substantive choice in this trade and the backend enforces it rather than
 * asking the client to: while a casting is blind and undecided, the identities
 * never leave the handler, so a client cannot show what it was not sent.
 */

/** Lifecycle of a casting, from migration 0509. */
export const CASTING_STATUSES = ['open', 'reviewing', 'selected', 'cancelled'] as const;
export type CastingStatus = (typeof CASTING_STATUSES)[number];

export interface VoiceCasting {
	id: string;
	slice_id: string;
	/** Markdown: who this character is and how they sound. */
	character_brief_md: string;
	/** The line every actor records, so takes are comparable. */
	sample_line_text: string;
	/** BCP-47: `fr` and `fr-BE` are different answers, an accent is part of the brief. */
	target_language: string;
	max_audition_seconds: number;
	is_blind: boolean;
	audition_deadline: string;
	status: CastingStatus;
}

/**
 * One take.
 *
 * `voice` is a username once the names are out, and a stable number while the
 * casting is blind — stable within one reading, so a listener can say "the
 * third take" out loud.
 */
export interface CastingAudition {
	id: string;
	voice: string;
	notes_md: string | null;
	duration_ms: number | null;
	submitted_at: string;
}

export interface CastingDetail {
	casting: VoiceCasting;
	/** True while the names are withheld. Not a display preference: they were not sent. */
	blind: boolean;
	auditions: CastingAudition[];
}

export interface OpenCastingRequest {
	slice_id: string;
	character_brief_md: string;
	sample_line_text: string;
	target_language: string;
	/** Must be in the future — a casting that closed before it opened wastes its readers. */
	audition_deadline: string;
	/** Defaults to 90 server-side. */
	max_audition_seconds?: number;
	/** Defaults to true. Turning it off is a visible choice. */
	is_blind?: boolean;
}

/**
 * A take needs something to listen to: either a link the actor hosts, or the
 * id of a file already uploaded through the platform. The storage key is read
 * from that file server-side, so nobody can point an audition at somebody
 * else's master.
 */
export interface AuditionRequest {
	audition_url?: string;
	audition_file_id?: string;
	notes_md?: string;
}

/** Longest brief and sample line the backend accepts, mirrored for the form. */
export const CASTING_BRIEF_MAX = 8000;
export const CASTING_SAMPLE_LINE_MAX = 4000;
export const AUDITION_NOTES_MAX = 4000;
/** Default take ceiling when the opener names none. */
export const CASTING_DEFAULT_MAX_SECONDS = 90;
