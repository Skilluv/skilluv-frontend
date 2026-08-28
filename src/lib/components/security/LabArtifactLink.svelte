<script lang="ts">
	/**
	 * B-05 — the artefact of a defensive lab, and nothing else.
	 *
	 * The link is minted per request and expires, so it is fetched when
	 * somebody asks for it rather than on mount: a signed URL sitting unused on
	 * a page the reader never scrolled to is a link that has already started
	 * running out.
	 *
	 * A lab's *questions* are not served by any endpoint yet (SKI-332), so this
	 * component deliberately stops at the download. Rendering an answer form
	 * with invented question ids would submit answers to a lab that never asked
	 * them — and the person filling it in would have no way to know.
	 *
	 * That is less of a compromise than it reads: the analysis of a blue lab
	 * was always meant to happen on the reader's own machine, in their own
	 * tools. The artefact is the part Skilluv owes them.
	 */
	import { Download } from '@lucide/svelte';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import type { LabArtifact } from '$types';

	interface Props {
		challengeId: string;
	}

	let { challengeId }: Props = $props();

	let artifact = $state<LabArtifact | null>(null);
	let loading = $state(false);
	let errorText = $state('');

	/** Bytes as the size somebody recognises, not as a number of digits. */
	function humanSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		const units = ['KB', 'MB', 'GB'];
		let value = bytes / 1024;
		let unit = 0;
		while (value >= 1024 && unit < units.length - 1) {
			value /= 1024;
			unit += 1;
		}
		return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
	}

	async function fetchLink() {
		if (loading) return;
		loading = true;
		errorText = '';
		try {
			const res = await securityApi.labArtifact(challengeId);
			artifact = res.data ?? null;
		} catch (err) {
			artifact = null;
			errorText = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}
</script>

<section
	class="space-y-3 rounded-xl border border-border bg-surface-elevated p-5"
	data-testid="lab-artifact"
>
	<h3 class="flex items-center gap-2 text-sm font-bold text-text">
		<Download size={16} />
		{i18n.t('blueLab.artifactTitle')}
	</h3>

	<!-- Said before the download, not after: this is where somebody decides
	     which tools they are about to open it in. -->
	<p class="text-sm text-text-muted">{i18n.t('blueLab.offlineNote')}</p>

	{#if errorText}
		<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
			{errorText}
		</p>
	{/if}

	{#if artifact}
		<div class="flex flex-wrap items-center gap-3">
			<a
				href={artifact.url}
				class="text-sm font-medium text-accent hover:underline"
				rel="noopener"
				data-testid="lab-artifact-link"
			>
				{artifact.filename}
			</a>
			<span class="text-xs text-text-muted">{humanSize(artifact.size_bytes)}</span>
		</div>
		<!-- The link expires. Saying so beats a 403 twenty minutes from now on a
		     tab that was left open. -->
		<p class="text-xs text-text-muted">
			{i18n.t('blueLab.artifactExpires', {
				n: Math.max(1, Math.round(artifact.expires_in_seconds / 60))
			})}
		</p>
	{:else}
		<Button size="sm" {loading} onclick={fetchLink} data-testid="lab-artifact-cta">
			{i18n.t('blueLab.artifactCta')}
		</Button>
	{/if}
</section>
