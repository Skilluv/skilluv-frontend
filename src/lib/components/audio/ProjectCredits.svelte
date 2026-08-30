<script lang="ts">
	/**
	 * Who is credited on this project.
	 *
	 * `work_credits` is a view over the attestations that carry an evidence
	 * URL, deliberately rather than a table: a second copy of these facts is
	 * one somebody has to remember to update when a credit is revoked, and a
	 * retracted credit has to leave the page it was printed on.
	 *
	 * It started audio-only (migration 0423) and was widened in 0515 — a
	 * documentation page carries a name too — so this panel is mounted on any
	 * slice, not only an audio one. It renders nothing when the project has no
	 * credit, which is the common case.
	 *
	 * Every row carries its verification code and links to it. That is the
	 * whole point: a credit nobody can check is a line on a page.
	 */
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { BadgeCheck } from '@lucide/svelte';
	import { audioDeliveryApi } from '$lib/api/audio';
	import { i18n } from '$lib/i18n';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { WorkCredit } from '$types';

	interface Props {
		projectSlug: string;
	}

	let { projectSlug }: Props = $props();

	let credits = $state<WorkCredit[]>([]);
	let loading = $state(true);

	async function load() {
		loading = true;
		try {
			const res = await audioDeliveryApi.projectCredits(projectSlug);
			credits = res.data ?? [];
		} catch {
			credits = [];
		} finally {
			loading = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, { month: 'short', year: 'numeric' });
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-24 w-full" rounded="xl" />
{:else if credits.length > 0}
	<section
		class="rounded-xl border border-border bg-surface-elevated overflow-hidden"
		data-testid="project-credits"
	>
		<div class="border-b border-border px-5 py-3">
			<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('projectCredits.title')}
			</span>
		</div>

		<ul class="space-y-3 p-5" role="list">
			{#each credits as credit (credit.verification_code)}
				<li>
					<p class="flex flex-wrap items-center gap-2">
						<BadgeCheck size={13} strokeWidth={2} class="shrink-0 text-success" />
						<a
							href={resolve(`/profile/${credit.username}`)}
							class="text-sm font-semibold text-text-primary hover:text-accent"
						>
							{credit.display_name || credit.username}
						</a>
						{#if credit.audio_subtype}
							<span class="text-xs text-text-muted">{credit.audio_subtype}</span>
						{/if}
					</p>
					<p class="mt-0.5 text-sm text-text-muted">{credit.credit_title}</p>
					<p class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
						<span>{fmtDate(credit.issued_at)}</span>
						<!-- Not `/verify/[hash]`: that route resolves a 64-hex slice
						     attestation hash, while this is a short verification code
						     on the attestations table. -->
						<a
							href={resolve(`/attestations/verify/${credit.verification_code}`)}
							class="underline-offset-4 hover:text-text-primary hover:underline"
						>
							{i18n.t('projectCredits.verifyCta')}
						</a>
					</p>
				</li>
			{/each}
		</ul>
	</section>
{/if}
