<script lang="ts">
	/**
	 * The files of one audio delivery, with what was measured on them.
	 *
	 * The measurements are the substance here. They are measured, never
	 * declared — absent means the analysis has not run, or ffmpeg is not
	 * installed where it would have, and never zero. So an unmeasured file says
	 * so instead of drawing a meter at 0 LUFS, which would be a lie a reviewer
	 * might grade on.
	 *
	 * Playing goes through a signed URL that expires. Nothing in this domain
	 * returns a stable link: unreleased work for a paying client is the normal
	 * case, and a URL that outlives the request that asked for it outlives the
	 * embargo too. The URL is fetched on demand, per file, when somebody
	 * presses play — never up front for a list.
	 */
	import { onMount } from 'svelte';
	import { AudioLines, Upload } from '@lucide/svelte';
	import { audioCastingsApi, audioDeliveryApi } from '$lib/api/audio';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { AUDIO_FILE_ROLES, type AudioFile, type AudioFileRole } from '$types';

	interface Props {
		sliceId: string;
		/** Shows the upload form. The backend gates it too. */
		isMine?: boolean;
	}

	let { sliceId, isMine = false }: Props = $props();

	let files = $state<AudioFile[]>([]);
	let loading = $state(true);
	let loaded = $state(false);

	/** Signed URLs already fetched, by file id. They expire; this is per view. */
	let playable = $state<Record<string, string>>({});
	let fetchingUrl = $state<string | null>(null);

	let uploading = $state(false);
	let uploadRole = $state<AudioFileRole>('master');
	let fileInput = $state<HTMLInputElement | undefined>();

	/** Grouped by role, in the order the roles were defined. */
	let grouped = $derived(
		AUDIO_FILE_ROLES.map((role) => ({ role, rows: files.filter((f) => f.role === role) })).filter(
			(g) => g.rows.length > 0
		)
	);

	async function load() {
		loading = true;
		try {
			const res = await audioDeliveryApi.files(sliceId);
			files = res.data ?? [];
			loaded = true;
		} catch {
			// Unreadable — signed out, most often. The panel does not render.
			files = [];
			loaded = false;
		} finally {
			loading = false;
		}
	}

	async function play(file: AudioFile) {
		if (playable[file.id]) return;
		fetchingUrl = file.id;
		try {
			const res = await audioCastingsApi.listen(file.id);
			playable = { ...playable, [file.id]: res.data.url };
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			fetchingUrl = null;
		}
	}

	async function upload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		try {
			await audioDeliveryApi.upload(sliceId, file, uploadRole);
			// Said out loud by the backend and repeated here: the analysis runs
			// on a sweep, so the numbers are not there yet and may never be.
			toast.success(i18n.t('audioDelivery.uploadedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	function fmtDuration(ms: number): string {
		const total = Math.round(ms / 1000);
		return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
	}

	function fmtSize(bytes: number): string {
		const mb = bytes / (1024 * 1024);
		return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} kB`;
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-40 w-full" rounded="xl" />
{:else if loaded}
	<section
		class="rounded-xl border border-border bg-surface-elevated overflow-hidden"
		data-testid="audio-delivery"
	>
		<div class="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
			<span class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
				<AudioLines size={13} strokeWidth={2} />
				{i18n.t('audioDelivery.title')}
			</span>
			{#if isMine}
				<div class="flex items-center gap-2">
					<select
						bind:value={uploadRole}
						aria-label={i18n.t('audioDelivery.roleLabel')}
						class="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text-primary"
					>
						{#each AUDIO_FILE_ROLES as role (role)}
							<option value={role}>{i18n.t(`audioDelivery.roles.${role}`)}</option>
						{/each}
					</select>
					<input
						bind:this={fileInput}
						type="file"
						class="hidden"
						onchange={upload}
						data-testid="audio-upload-input"
					/>
					<Button
						variant="ghost"
						size="sm"
						loading={uploading}
						onclick={() => fileInput?.click()}
					>
						<span class="inline-flex items-center gap-1.5">
							<Upload size={12} strokeWidth={2} />
							{i18n.t('audioDelivery.uploadCta')}
						</span>
					</Button>
				</div>
			{/if}
		</div>

		<div class="p-5">
			{#if files.length === 0}
				<p class="text-sm text-text-muted">{i18n.t('audioDelivery.empty')}</p>
			{:else}
				<div class="space-y-6">
					{#each grouped as group (group.role)}
						<div>
							<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
								{i18n.t(`audioDelivery.roles.${group.role}`)}
							</p>
							<ul class="mt-2 space-y-2" role="list">
								{#each group.rows as file (file.id)}
									<li class="rounded-xl border border-border p-4">
										<div class="flex flex-wrap items-center gap-2">
											<span class="truncate text-sm font-medium text-text-primary">
												{file.original_filename}
											</span>
											<Badge variant="default" size="sm">{file.container}</Badge>
											<span class="ml-auto font-mono text-xs text-text-muted">
												{fmtSize(file.byte_size)}
											</span>
										</div>

										<p class="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-text-muted">
											{#if file.duration_ms}
												<span class="font-mono">{fmtDuration(file.duration_ms)}</span>
											{/if}
											{#if file.sample_rate_hz}
												<span>{(file.sample_rate_hz / 1000).toFixed(1)} kHz</span>
											{/if}
											{#if file.bit_depth}
												<span>{file.bit_depth} bit</span>
											{/if}
											{#if file.channels}
												<span>
													{file.channels === 1
														? i18n.t('audioDelivery.mono')
														: i18n.t('audioDelivery.channels', { n: file.channels })}
												</span>
											{/if}
										</p>

										{#if file.loudness_lufs !== null || file.true_peak_dbfs !== null}
											<p class="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-xs text-text-muted">
												{#if file.loudness_lufs !== null}
													<span>{file.loudness_lufs.toFixed(1)} LUFS</span>
												{/if}
												{#if file.true_peak_dbfs !== null}
													<span>{file.true_peak_dbfs.toFixed(1)} dBTP</span>
												{/if}
												{#if file.loudness_range_lu !== null}
													<span>{file.loudness_range_lu.toFixed(1)} LU</span>
												{/if}
											</p>
										{:else}
											<!-- Not measured is not zero. -->
											<p class="mt-1 text-xs text-text-muted">
												{file.analysis_error
													? i18n.t('audioDelivery.analysisFailed')
													: i18n.t(`audioDelivery.analysis.${file.analysis_status}`)}
											</p>
										{/if}

										<div class="mt-3">
											{#if playable[file.id]}
												<audio controls src={playable[file.id]} class="w-full"></audio>
												<p class="mt-1 text-xs text-text-muted">
													{i18n.t('audioDelivery.linkExpires')}
												</p>
											{:else}
												<Button
													variant="secondary"
													size="sm"
													loading={fetchingUrl === file.id}
													onclick={() => play(file)}
												>
													{i18n.t('audioDelivery.listenCta')}
												</Button>
											{/if}
										</div>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
{/if}
