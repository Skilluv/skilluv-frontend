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

// ---------------------------------------------------------------------------
// The delivery itself — files and the sources they were built from
// ---------------------------------------------------------------------------

/** What part a file plays in a delivery, from migration 0409. */
export const AUDIO_FILE_ROLES = [
	'master',
	'stem',
	'preview',
	'project_archive',
	'documentation'
] as const;
export type AudioFileRole = (typeof AUDIO_FILE_ROLES)[number];

/**
 * One stored file.
 *
 * The measurements are measured, never declared: absent means the analysis has
 * not run — or that ffmpeg is not installed where it would have — and never
 * zero. A meter that draws `0 LUFS` for "unknown" is a meter that lies.
 */
export interface AudioFile {
	id: string;
	role: AudioFileRole;
	original_filename: string;
	byte_size: number;
	container: string;
	duration_ms: number | null;
	sample_rate_hz: number | null;
	bit_depth: number | null;
	channels: number | null;
	/** Integrated loudness. A number, not a decimal string — see the handler. */
	loudness_lufs: number | null;
	true_peak_dbfs: number | null;
	loudness_range_lu: number | null;
	analysis_status: string;
	analysis_error: string | null;
	/** Four hundred peaks, 0..100, for drawing. Absent until the sweep has run. */
	waveform_peaks: number[] | null;
}

/**
 * How a source was come by.
 *
 * The distinction that matters commercially is `creative_commons`: some of
 * those licences forbid exactly the commercial use a paid mission is.
 */
export const AUDIO_SOURCE_KINDS = [
	'original',
	'public_domain',
	'creative_commons',
	'royalty_free',
	'licensed_commercial',
	'third_party_work'
] as const;
export type AudioSourceKind = (typeof AUDIO_SOURCE_KINDS)[number];

export interface AudioSource {
	id: string;
	kind: AudioSourceKind;
	source_name: string;
	source_url: string | null;
	/** `CC-BY-4.0`, `CC0-1.0` — the licence's own identifier when it has one. */
	licence_identifier: string | null;
	/** The credit line, verbatim, as it must appear. Required for CC. */
	attribution_text: string | null;
	purchased_from: string | null;
	permits_commercial_use: boolean | null;
}

/**
 * The declaration, which is a statement and not a row count.
 *
 * `declared_complete_at` is the whole point: a wholly original track has no
 * sources and is not undeclared. An empty list with no timestamp means nobody
 * filled this in, and the attestation generators read the timestamp.
 */
export interface AudioSources {
	sources: AudioSource[];
	declared_complete_at: string | null;
}

export interface DeclareSourceRequest {
	kind: AudioSourceKind;
	source_name: string;
	source_url?: string;
	licence_identifier?: string;
	attribution_text?: string;
	purchased_from?: string;
	purchase_price_eur?: number;
	permits_commercial_use?: boolean;
}

/** A credit attested by hand on somebody's released work. */
export interface WorkCredit {
	username: string;
	display_name: string | null;
	credit_title: string;
	audio_subtype: string | null;
	/** The public attestation, so a reader can check rather than believe. */
	verification_code: string;
	issued_at: string;
}
