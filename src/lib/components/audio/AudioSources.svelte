<script lang="ts">
	/**
	 * What a delivery was built from, and the statement that the list is whole.
	 *
	 * The declaration is the point, not the row count: a wholly original track
	 * has no sources and is not undeclared. The backend keeps the two apart —
	 * an empty list with no `declared_complete_at` means nobody filled this in,
	 * and it is the timestamp the attestation generators read.
	 *
	 * Adding a source after declaring clears the declaration, because the
	 * statement stopped being true. That is the backend's doing; this panel
	 * re-reads after every write rather than assuming the statement survived.
	 *
	 * Public on purpose: the provenance of a published piece is what a stranger
	 * has to be able to check for the attestation on it to mean anything.
	 */
	import { onMount } from 'svelte';
	import { BadgeCheck, ExternalLink, Scale } from '@lucide/svelte';
	import { audioDeliveryApi } from '$lib/api/audio';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Select from '$components/ui/Select.svelte';
	import { AUDIO_SOURCE_KINDS, type AudioSource, type AudioSourceKind } from '$types';

	interface Props {
		sliceId: string;
		/** Shows the declaration form and the "this list is complete" action. */
		isMine?: boolean;
	}

	let { sliceId, isMine = false }: Props = $props();

	let sources = $state<AudioSource[]>([]);
	let declaredAt = $state<string | null>(null);
	let loading = $state(true);
	let loaded = $state(false);

	let formOpen = $state(false);
	let kind = $state<AudioSourceKind>('original');
	let sourceName = $state('');
	let sourceUrl = $state('');
	let licence = $state('');
	let attribution = $state('');
	let submitting = $state(false);
	let completing = $state(false);

	let kindItems = $derived(
		AUDIO_SOURCE_KINDS.map((k) => ({ value: k, label: i18n.t(`audioSources.kinds.${k}`) }))
	);

	/** The credit line is not optional under a Creative Commons licence. */
	let attributionRequired = $derived(kind === 'creative_commons');

	async function load() {
		loading = true;
		try {
			const res = await audioDeliveryApi.sources(sliceId);
			sources = res.data?.sources ?? [];
			declaredAt = res.data?.declared_complete_at ?? null;
			loaded = true;
		} catch {
			// Not an audio delivery: the panel does not render.
			loaded = false;
		} finally {
			loading = false;
		}
	}

	async function declare() {
		submitting = true;
		try {
			await audioDeliveryApi.declareSource(sliceId, {
				kind,
				source_name: sourceName.trim(),
				source_url: sourceUrl.trim() || undefined,
				licence_identifier: licence.trim() || undefined,
				attribution_text: attribution.trim() || undefined
			});
			toast.success(i18n.t('audioSources.declaredToast'));
			formOpen = false;
			sourceName = '';
			sourceUrl = '';
			licence = '';
			attribution = '';
			// Declaring reopens the statement server-side; re-read rather than
			// patch the list and keep a timestamp that is no longer true.
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}

	async function complete() {
		completing = true;
		try {
			await audioDeliveryApi.completeSources(sliceId);
			toast.success(i18n.t('audioSources.completedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			completing = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-32 w-full" rounded="xl" />
<!-- Rendered whenever the endpoint answered, not only when there is something
     in it. The page already gates the mount on `slice_type`, and "nobody
     filled this in" is the fact a reader most needs: the attestation rests on
     the statement, so its absence is the substance, not an empty state. -->
{:else if loaded}
	<section
		class="rounded-xl border border-border bg-surface-elevated overflow-hidden"
		data-testid="audio-sources"
	>
		<div class="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
			<span class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
				<Scale size={13} strokeWidth={2} />
				{i18n.t('audioSources.title')}
			</span>
			{#if isMine}
				<Button variant="ghost" size="sm" onclick={() => (formOpen = true)}>
					{i18n.t('audioSources.addCta')}
				</Button>
			{/if}
		</div>

		<div class="p-5">
			{#if declaredAt}
				<p
					class="mb-4 inline-flex items-center gap-2 rounded-xl border border-success/40 bg-success/5 px-3 py-2 text-xs text-text-primary"
				>
					<BadgeCheck size={13} strokeWidth={2} class="text-success" />
					{i18n.t('audioSources.declaredComplete', { date: fmtDate(declaredAt) })}
				</p>
			{:else}
				<!-- The distinction the backend is careful about: an empty list
				     with no statement means nobody filled this in. -->
				<p class="mb-4 rounded-xl border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-text-primary">
					{i18n.t('audioSources.notDeclared')}
				</p>
			{/if}

			{#if sources.length === 0}
				<p class="text-sm text-text-muted">{i18n.t('audioSources.empty')}</p>
			{:else}
				<ul class="space-y-3" role="list">
					{#each sources as source (source.id)}
						<li class="rounded-xl border border-border p-4">
							<div class="flex flex-wrap items-center gap-2">
								<Badge
									variant={source.kind === 'creative_commons' ? 'warning' : 'default'}
									size="sm"
								>
									{i18n.t(`audioSources.kinds.${source.kind}`)}
								</Badge>
								<span class="text-sm font-medium text-text-primary">{source.source_name}</span>
								{#if source.licence_identifier}
									<span class="font-mono text-xs text-text-muted">
										{source.licence_identifier}
									</span>
								{/if}
							</div>

							{#if source.attribution_text}
								<p class="mt-2 rounded-lg bg-surface-overlay px-3 py-2 font-mono text-xs text-text-primary">
									{source.attribution_text}
								</p>
							{/if}

							<div class="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-text-muted">
								{#if source.purchased_from}
									<span>{i18n.t('audioSources.purchasedFrom', { name: source.purchased_from })}</span>
								{/if}
								{#if source.permits_commercial_use === false}
									<!-- The distinction that actually decides whether a paid
									     mission may ship this. -->
									<span class="text-warning">{i18n.t('audioSources.noCommercial')}</span>
								{/if}
								{#if source.source_url}
									<a
										href={source.source_url}
										target="_blank"
										rel="noopener noreferrer nofollow ugc"
										class="ml-auto inline-flex items-center gap-1 hover:text-text-primary"
									>
										{i18n.t('audioSources.openSource')}
										<ExternalLink size={11} strokeWidth={2} />
									</a>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}

			{#if isMine && !declaredAt}
				<div class="mt-4 flex justify-end">
					<Button variant="accent" size="sm" loading={completing} onclick={complete}>
						{i18n.t('audioSources.completeCta')}
					</Button>
				</div>
			{/if}
		</div>
	</section>
{/if}

<Modal
	open={formOpen}
	title={i18n.t('audioSources.formTitle')}
	onclose={() => (formOpen = false)}
	size="sm"
>
	<div class="space-y-4">
		<div>
			<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
				{i18n.t('audioSources.formKind')}
			</span>
			<Select items={kindItems} value={kind} onchange={(v) => (kind = v)} shape="rounded" />
		</div>

		<Input
			name="source_name"
			label={i18n.t('audioSources.formName')}
			placeholder={i18n.t('audioSources.formNamePlaceholder')}
			bind:value={sourceName}
			required
		/>

		<Input name="source_url" label={i18n.t('audioSources.formUrl')} placeholder="https://" bind:value={sourceUrl} />

		<Input
			name="licence_identifier"
			label={i18n.t('audioSources.formLicence')}
			placeholder="CC-BY-4.0"
			bind:value={licence}
		/>

		<div>
			<label
				for="attribution"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('audioSources.formAttribution')}
			</label>
			<textarea
				id="attribution"
				bind:value={attribution}
				rows="3"
				placeholder={i18n.t('audioSources.formAttributionPlaceholder')}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
			{#if attributionRequired}
				<p class="mt-1.5 text-xs text-warning">{i18n.t('audioSources.attributionRequired')}</p>
			{/if}
		</div>

		<p class="text-xs text-text-muted">{i18n.t('audioSources.reopensNotice')}</p>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => (formOpen = false)}>
			{i18n.t('common.actions.cancel')}
		</Button>
		<Button
			variant="accent"
			loading={submitting}
			disabled={!sourceName.trim() || (attributionRequired && !attribution.trim())}
			onclick={declare}
		>
			{i18n.t('audioSources.formSubmit')}
		</Button>
	{/snippet}
</Modal>
