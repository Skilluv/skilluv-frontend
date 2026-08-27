<script lang="ts">
	/**
	 * W-02 — handing in a file too large to send through the API.
	 *
	 * The bytes never touch Skilluv's API: `init` hands out one presigned PUT
	 * per part, the browser uploads each straight to the object store, and
	 * `complete` asks the store to assemble them. Everything interesting about
	 * this component follows from that.
	 *
	 * Progress is per part, not per byte. A presigned PUT through `fetch` gives
	 * no upload progress events without dropping to XHR, and a fake smooth bar
	 * that jumps is worse than an honest one that steps: at sixteen megabytes
	 * per part, a five-gigabyte file steps three hundred and twenty times.
	 *
	 * The ceiling is checked here before anything moves, mirroring the server.
	 * That duplication is deliberate — the backend's own note is that telling
	 * somebody after five gigabytes have moved is telling them too late.
	 */
	import { CloudUpload, FileCheck, X } from '@lucide/svelte';
	import {
		MissingEtagError,
		maxBytesFor,
		requiresPreview,
		uploadDesignFile,
		uploadPreview,
		type UploadProgress
	} from '$api/design_uploads';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Select from '$components/ui/Select.svelte';
	import { DESIGN_SUBTYPES } from '$types';

	interface Props {
		/** Attaches the upload to a slice when there is one. */
		sliceId?: string | null;
		/** Pre-selected when the slice already declares its subtype. */
		subtype?: string;
		/** Called with the finished session id and the stored object key, so a
		 * parent form can use it as the artefact URL. */
		onuploaded?: (result: { sessionId: string; storageKey: string }) => void;
	}

	let { sliceId = null, subtype = $bindable('interface'), onuploaded }: Props = $props();

	let file = $state<File | null>(null);
	let preview = $state<File | null>(null);
	let uploading = $state(false);
	let progress = $state<UploadProgress | null>(null);
	let finishedSessionId = $state<string | null>(null);
	let previewStored = $state(false);
	let errorText = $state('');
	let controller: AbortController | null = null;

	let subtypeOptions = $derived(
		DESIGN_SUBTYPES.map((slug) => ({
			value: slug as string,
			label: i18n.t(`designUpload.subtypes.${slug}`)
		}))
	);

	let ceiling = $derived(maxBytesFor(subtype));
	let needsPreview = $derived(requiresPreview(subtype));
	let overCeiling = $derived(!!file && ceiling !== null && file.size > ceiling);

	let percent = $derived(
		progress && progress.bytesTotal > 0
			? Math.min(100, Math.round((progress.bytesDone / progress.bytesTotal) * 100))
			: 0
	);

	/** Bytes as a person reads them. Binary units, because the ceilings are
	 * binary and printing 5.37 GB against a "5 GB" limit reads as a bug. */
	function fmtBytes(bytes: number): string {
		const units = ['B', 'KiB', 'MiB', 'GiB'];
		let value = bytes;
		let unit = 0;
		while (value >= 1024 && unit < units.length - 1) {
			value /= 1024;
			unit += 1;
		}
		return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[unit]}`;
	}

	function pickFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		file = input.files?.[0] ?? null;
		finishedSessionId = null;
		previewStored = false;
		errorText = '';
		progress = null;
	}

	function pickPreview(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		preview = input.files?.[0] ?? null;
	}

	function cancel() {
		controller?.abort();
		controller = null;
		uploading = false;
	}

	async function start() {
		if (!file) return;
		if (overCeiling) {
			errorText = i18n.t('designUpload.tooLarge');
			return;
		}

		uploading = true;
		errorText = '';
		controller = new AbortController();

		try {
			const result = await uploadDesignFile(
				file,
				{ design_subtype: subtype, slice_id: sliceId },
				{
					signal: controller.signal,
					onProgress: (p) => {
						progress = p;
					}
				}
			);

			finishedSessionId = result.sessionId;

			if (preview) {
				await uploadPreview(result.sessionId, preview);
				previewStored = true;
			}

			toast.success(i18n.t('designUpload.done'));
			onuploaded?.({ sessionId: result.sessionId, storageKey: result.session.storage_key });
		} catch (err) {
			if (err instanceof MissingEtagError) {
				// Never the person uploading, and the copy says so: retrying a
				// five-gigabyte upload would fail identically.
				errorText = i18n.t('designUpload.etagMisconfigured');
			} else if (err instanceof RangeError) {
				errorText = i18n.t('designUpload.tooLarge');
			} else if (err instanceof DOMException && err.name === 'AbortError') {
				errorText = '';
			} else {
				errorText = err instanceof SkilluError ? err.message : i18n.t('designUpload.failed');
			}
		} finally {
			uploading = false;
			controller = null;
		}
	}
</script>

<section
	class="rounded-xl border border-border bg-surface-elevated p-5 space-y-4"
	data-testid="design-uploader"
>
	<h3 class="text-sm font-bold text-text">{i18n.t('designUpload.title')}</h3>

	<label class="flex flex-col gap-1 text-xs text-text-muted">
		{i18n.t('designUpload.subtypeLabel')}
		<Select items={subtypeOptions} bind:value={subtype} shape="rounded" size="sm" />
	</label>

	{#if ceiling !== null}
		<p class="text-xs text-text-muted">
			{i18n.t('designUpload.ceiling', { size: fmtBytes(ceiling) })}
		</p>
	{/if}

	{#if needsPreview}
		<p class="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
			{i18n.t('designUpload.previewRequired')}
		</p>
	{/if}

	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-xs text-text-muted">
			{i18n.t('designUpload.pickFile')}
			<input
				type="file"
				onchange={pickFile}
				disabled={uploading}
				class="text-sm text-text file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-text"
				data-testid="design-upload-file"
			/>
		</label>

		{#if file}
			<p class="text-xs {overCeiling ? 'text-error' : 'text-text-muted'}">
				{file.name} · {fmtBytes(file.size)}
			</p>
		{/if}

		{#if needsPreview}
			<label class="flex flex-col gap-1 text-xs text-text-muted">
				{i18n.t('designUpload.previewPick')}
				<input
					type="file"
					accept="image/*"
					onchange={pickPreview}
					disabled={uploading}
					class="text-sm text-text file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-text"
					data-testid="design-upload-preview"
				/>
			</label>
		{/if}
	</div>

	{#if uploading && progress}
		<div class="space-y-1" data-testid="design-upload-progress">
			<div class="flex items-center justify-between text-xs text-text-muted">
				<span>
					{i18n.t('designUpload.progress', {
						done: progress.partsDone,
						total: progress.partsTotal
					})}
				</span>
				<span>{percent}%</span>
			</div>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-surface">
				<div class="h-full rounded-full bg-accent transition-all" style="width: {percent}%"></div>
			</div>
		</div>
	{/if}

	{#if errorText}
		<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
			{errorText}
		</p>
	{/if}

	{#if finishedSessionId}
		<p class="flex items-center gap-2 text-sm text-success" data-testid="design-upload-done">
			<FileCheck size={16} />
			{i18n.t('designUpload.done')}
			{#if previewStored}<span class="text-text-muted">{i18n.t('designUpload.previewDone')}</span>{/if}
		</p>
	{/if}

	<div class="flex items-center gap-2">
		<Button size="sm" loading={uploading} disabled={!file || overCeiling} onclick={start}>
			<CloudUpload size={15} />
			{i18n.t('designUpload.uploading')}
		</Button>
		{#if uploading}
			<Button size="sm" variant="ghost" onclick={cancel}>
				<X size={15} />
				{i18n.t('designUpload.cancel')}
			</Button>
		{/if}
	</div>
</section>
