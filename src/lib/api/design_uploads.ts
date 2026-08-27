/**
 * Handing in a file too large to send through the API.
 *
 * None of the five endpoints carries a byte of the file. `init` hands out one
 * presigned PUT per part, the browser uploads each part straight to the object
 * store, and `complete` asks the store to assemble what arrived. The backend
 * is explicit about why: five gigabytes through an axum handler holds a
 * connection and a buffer for as long as somebody's rural line takes, and it
 * degrades the API for everybody while it does.
 *
 * That shape is also what makes the upload resumable with no bookkeeping on
 * either side. A part that failed is one presigned URL away from being
 * retried, and asking for fresh URLs is the same call whether the reason is
 * "mine expired" or "I am resuming after a crash".
 *
 * ## The one deployment condition
 *
 * Assembly needs the `ETag` the store returned for each part, and a browser
 * can only read a response header on a cross-origin request when the store
 * sends `Access-Control-Expose-Headers: ETag`. Without it every part uploads
 * successfully and `complete` can never be called. {@link MissingEtagError}
 * exists so that failure names itself instead of surfacing as a mystery 400
 * at the end of a five-gigabyte upload.
 */

import type {
	ApiResponse,
	DesignSubtype,
	DesignUploadCompletedPart,
	DesignUploadInitiated,
	DesignUploadPart,
	DesignUploadSession,
	InitUploadRequest
} from '$lib/types';
import { DESIGN_SUBTYPE_MAX_BYTES, DESIGN_SUBTYPES_REQUIRING_PREVIEW } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const designUploadsApi = {
	/**
	 * Open an upload and get the URLs to push the parts to.
	 *
	 * Requires a completed profile rather than merely a session: an upload
	 * reserves storage somebody pays for, and an unverified address is the
	 * cheapest thing in the world to make.
	 */
	init(payload: InitUploadRequest) {
		return api.post<ApiResponse<{ upload: DesignUploadInitiated }>>('/design/uploads', payload);
	},

	/**
	 * Fresh URLs for a range of parts, 1-based and inclusive at both ends.
	 *
	 * The client asks for the parts it holds no ETag for; nothing server-side
	 * needs to know which those are.
	 */
	parts(sessionId: string, from: number, to: number) {
		return api.get<ApiResponse<{ parts: DesignUploadPart[] }>>(
			`/design/uploads/${sessionId}/parts`,
			{ from, to }
		);
	},

	/** Assemble the parts. Answers with the size the store actually holds. */
	complete(sessionId: string, parts: DesignUploadCompletedPart[]) {
		return api.post<ApiResponse<{ upload: DesignUploadSession }>>(
			`/design/uploads/${sessionId}/complete`,
			{ parts }
		);
	},

	/**
	 * A URL to PUT the preview to.
	 *
	 * Required for the subtypes a browser cannot open. Nothing renders one
	 * server-side: the person who made the file picks the frame that
	 * represents it, which is a better frame than any heuristic would find.
	 */
	previewUrl(sessionId: string) {
		return api.post<ApiResponse<{ url: string }>>(`/design/uploads/${sessionId}/preview-url`);
	},

	/** A link to the finished file, for a limited time. Capped at a day. */
	downloadUrl(sessionId: string, ttlSeconds?: number) {
		return api.get<ApiResponse<{ url: string; expires_in: number }>>(
			`/design/uploads/${sessionId}/download-url`,
			{ ttl_seconds: ttlSeconds }
		);
	}
};

/** The default download link lifetime, mirroring `DEFAULT_DOWNLOAD_TTL`. */
export const DOWNLOAD_TTL_DEFAULT_SECONDS = 60 * 60;

/** The ceiling the server clamps to, mirroring `MAX_DOWNLOAD_TTL`. */
export const DOWNLOAD_TTL_MAX_SECONDS = 24 * 60 * 60;

/**
 * Raised when a part uploaded but its `ETag` could not be read back.
 *
 * Always a bucket CORS configuration, never the person uploading, and the
 * message says so: there is nothing a designer can do about it and pretending
 * otherwise sends them to retry a five-gigabyte upload that will fail
 * identically.
 */
export class MissingEtagError extends Error {
	readonly partNumber: number;

	constructor(partNumber: number) {
		super(
			`The object store accepted part ${partNumber} but did not expose its ETag. ` +
				'The bucket needs `Access-Control-Expose-Headers: ETag` before any upload ' +
				'can be assembled. Nothing about the file is wrong.'
		);
		this.name = 'MissingEtagError';
		this.partNumber = partNumber;
	}
}

/** Raised when a part upload was refused by the object store itself. */
export class PartUploadError extends Error {
	readonly partNumber: number;
	readonly status: number;

	constructor(partNumber: number, status: number) {
		super(`The object store refused part ${partNumber} with status ${status}.`);
		this.name = 'PartUploadError';
		this.partNumber = partNumber;
		this.status = status;
	}
}

export interface UploadProgress {
	/** Parts fully uploaded so far. */
	partsDone: number;
	partsTotal: number;
	bytesDone: number;
	bytesTotal: number;
}

export interface UploadOptions {
	/** Called after each part lands. The only honest progress signal available:
	 * a presigned PUT gives no byte-level events without XHR. */
	onProgress?: (progress: UploadProgress) => void;
	/** Abort in flight. Parts already stored survive, so the same session can
	 * be resumed later with {@link resumeParts}. */
	signal?: AbortSignal;
	/**
	 * ETags already collected from an earlier attempt, keyed by part number.
	 * Parts listed here are skipped, which is what makes a resume cheap.
	 */
	known?: Map<number, string>;
}

/**
 * Whether this subtype has to arrive with a preview.
 *
 * `init` returns `preview_required`, which is the authority. This is for the
 * form, so somebody choosing "3D scene" learns they will need a still frame
 * before they pick the file rather than after it has uploaded.
 */
export function requiresPreview(subtype: string): boolean {
	return (DESIGN_SUBTYPES_REQUIRING_PREVIEW as readonly string[]).includes(subtype);
}

/**
 * The ceiling for a subtype, or `null` for a subtype this build does not know.
 *
 * Null rather than a guess: a subtype added server-side must not be refused
 * client-side by a table that is merely out of date. The server checks too.
 */
export function maxBytesFor(subtype: string): number | null {
	return DESIGN_SUBTYPE_MAX_BYTES[subtype as DesignSubtype] ?? null;
}

/**
 * PUT one part straight to the object store.
 *
 * Deliberately not routed through the API client: this is a different origin,
 * and sending Skilluv's session cookie or CSRF header to a third-party bucket
 * would leak both to somewhere they have no business being.
 */
async function putPart(
	part: DesignUploadPart,
	body: Blob,
	signal?: AbortSignal
): Promise<string> {
	const res = await fetch(part.url, {
		method: 'PUT',
		body,
		credentials: 'omit',
		signal
	});

	if (!res.ok) throw new PartUploadError(part.part_number, res.status);

	const etag = res.headers.get('ETag') ?? res.headers.get('etag');
	if (!etag) throw new MissingEtagError(part.part_number);

	// Passed through untouched, quotes and all: the store compares it with its
	// own copy and a stripped quote is a mismatch.
	return etag;
}

/**
 * Upload every part of a file against an already-initiated session.
 *
 * Sequential on purpose. Parallel parts would finish sooner on a fat pipe and
 * are exactly wrong on the connection this feature exists for: a designer on a
 * rural line pushing a two-gigabyte motion file gets more throughput from one
 * stream than from six competing for the same bandwidth, and a failure costs
 * one part instead of six.
 */
export async function uploadParts(
	file: Blob,
	parts: DesignUploadPart[],
	partSize: number,
	options: UploadOptions = {}
): Promise<DesignUploadCompletedPart[]> {
	const known = options.known ?? new Map<number, string>();
	const collected: DesignUploadCompletedPart[] = [];
	let bytesDone = 0;

	for (const part of parts) {
		const offset = (part.part_number - 1) * partSize;
		const existing = known.get(part.part_number);

		if (existing) {
			collected.push({ part_number: part.part_number, etag: existing });
		} else {
			const etag = await putPart(part, file.slice(offset, offset + part.bytes), options.signal);
			known.set(part.part_number, etag);
			collected.push({ part_number: part.part_number, etag });
		}

		bytesDone += part.bytes;
		options.onProgress?.({
			partsDone: collected.length,
			partsTotal: parts.length,
			bytesDone,
			bytesTotal: file.size
		});
	}

	return collected;
}

/**
 * Ask for fresh URLs for the parts still missing an ETag.
 *
 * Both the "my URLs expired" case and the "I am resuming after a crash" case,
 * because server-side they are the same request. Returns an empty list when
 * nothing is outstanding, so a resume of a finished upload is a no-op rather
 * than an error.
 */
export async function resumeParts(
	sessionId: string,
	partCount: number,
	known: Map<number, string>
): Promise<DesignUploadPart[]> {
	const missing: number[] = [];
	for (let n = 1; n <= partCount; n += 1) {
		if (!known.has(n)) missing.push(n);
	}
	if (missing.length === 0) return [];

	// One contiguous range covering everything outstanding. The endpoint takes
	// a range rather than a list, and asking for a part already held costs a
	// presigned URL that is simply never used.
	const res = await designUploadsApi.parts(sessionId, missing[0], missing[missing.length - 1]);
	const fresh = res.data?.parts ?? [];
	return fresh.filter((p) => !known.has(p.part_number));
}

export interface UploadResult {
	session: DesignUploadSession;
	/** True when this subtype still needs a preview PUT before the deliverable
	 * is usable by a reviewer. */
	previewRequired: boolean;
	sessionId: string;
}

/**
 * The whole upload, from `init` to `complete`.
 *
 * Refuses a file over the subtype's ceiling before anything moves. The server
 * refuses it too, but only after `init` — and a designer told at five
 * gigabytes that the subtype was wrong has been told too late, which is the
 * backend's own argument for making the ceiling a refusal rather than a
 * warning.
 */
export async function uploadDesignFile(
	file: File,
	request: Omit<InitUploadRequest, 'declared_bytes' | 'filename' | 'content_type'> & {
		filename?: string;
		content_type?: string;
	},
	options: UploadOptions = {}
): Promise<UploadResult> {
	const ceiling = maxBytesFor(request.design_subtype);
	if (ceiling !== null && file.size > ceiling) {
		throw new RangeError(
			`A ${request.design_subtype} may be at most ${ceiling} bytes; this file is ${file.size}.`
		);
	}

	const started = await designUploadsApi.init({
		design_subtype: request.design_subtype,
		filename: request.filename ?? file.name,
		content_type: request.content_type ?? file.type ?? 'application/octet-stream',
		declared_bytes: file.size,
		slice_id: request.slice_id ?? null
	});

	const upload = started.data.upload;
	const parts = await uploadParts(file, upload.parts, upload.part_size, options);
	const finished = await designUploadsApi.complete(upload.session_id, parts);

	return {
		session: finished.data.upload,
		previewRequired: upload.preview_required,
		sessionId: upload.session_id
	};
}

/**
 * PUT a preview still for a finished upload.
 *
 * Separate from {@link uploadDesignFile} because the preview is usually chosen
 * after the source is picked, and because a failed preview must not invalidate
 * a source file that already uploaded.
 */
export async function uploadPreview(sessionId: string, preview: Blob): Promise<void> {
	const res = await designUploadsApi.previewUrl(sessionId);
	const put = await fetch(res.data.url, {
		method: 'PUT',
		body: preview,
		credentials: 'omit'
	});
	if (!put.ok) throw new PartUploadError(0, put.status);
}
