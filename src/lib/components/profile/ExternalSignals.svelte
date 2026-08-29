<script lang="ts">
	/**
	 * SKI-42 — external context on a public profile.
	 *
	 * These sit visually apart from badges and attestations on purpose. A
	 * verified signal means "we confirmed this account belongs to this
	 * person", never "Skilluv vouches for the work" — the section says so in
	 * its own words, and the backend also ships a disclaimer string so no
	 * client can render these as proof by accident.
	 */
	import { onMount } from 'svelte';
	import { BadgeCheck, ExternalLink, Info } from '@lucide/svelte';
	import { externalSignalsApi } from '$lib/api/external_signals';
	import { i18n } from '$lib/i18n';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { ExternalSignal } from '$types';

	interface Props {
		userId: string;
	}

	let { userId }: Props = $props();

	let verified = $state<ExternalSignal[]>([]);
	let declared = $state<ExternalSignal[]>([]);
	let loading = $state(true);

	let total = $derived(verified.length + declared.length);

	function providerLabel(provider: string): string {
		const key = `externalSignals.providers.${provider}`;
		const translated = i18n.t(key);
		return translated === key ? provider : translated;
	}

	onMount(async () => {
		try {
			const res = await externalSignalsApi.forUser(userId);
			verified = res.data?.verified ?? [];
			declared = res.data?.declared ?? [];
		} catch {
			// Absent signals and unreadable signals look the same to a reader,
			// and neither is worth an error banner on someone's profile.
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<Skeleton class="h-24 w-full" rounded="xl" />
{:else if total > 0}
	<section
		class="rounded-xl border border-border bg-surface-elevated overflow-hidden"
		data-testid="profile-external-signals"
	>
		<div class="border-b border-border px-5 py-3">
			<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('externalSignals.profileTitle')}
			</span>
		</div>

		<div class="p-5">
			<p class="flex items-start gap-2 rounded-lg bg-surface-overlay p-3 text-xs text-text-muted">
				<Info size={13} strokeWidth={2} class="mt-0.5 shrink-0" />
				<span>{i18n.t('externalSignals.disclaimer')}</span>
			</p>

			{#each [{ rows: verified, isVerified: true }, { rows: declared, isVerified: false }] as bucket (bucket.isVerified)}
				{#if bucket.rows.length > 0}
					<div class="mt-4">
						<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
							{bucket.isVerified
								? i18n.t('externalSignals.verifiedTitle')
								: i18n.t('externalSignals.declaredTitle')}
						</p>
						<p class="mt-0.5 text-xs text-text-muted">
							{bucket.isVerified
								? i18n.t('externalSignals.verifiedHint')
								: i18n.t('externalSignals.declaredHint')}
						</p>
						<ul class="mt-2 space-y-2" role="list">
							{#each bucket.rows as signal (signal.id)}
								<li class="flex items-start gap-2">
									{#if bucket.isVerified}
										<BadgeCheck size={14} strokeWidth={2} class="mt-0.5 shrink-0 text-success" />
									{:else}
										<span
											class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted"
											aria-hidden="true"
										></span>
									{/if}
									<span class="min-w-0">
										<a
											href={signal.url}
											target="_blank"
											rel="external noopener noreferrer nofollow ugc"
											class="inline-flex items-center gap-1 text-sm text-text-primary underline-offset-4 hover:underline"
										>
											{signal.title}
											<ExternalLink size={11} strokeWidth={2} class="shrink-0 text-text-muted" />
										</a>
										<span class="ml-1.5 text-xs text-text-muted">
											{providerLabel(signal.provider)}
										</span>
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/each}
		</div>
	</section>
{/if}
