<script lang="ts">
	/**
	 * The frame every craft record shares: a title, the score, the trades
	 * claimed, the attestations, and a slot for what the domain alone has.
	 *
	 * The five records this wraps — code, quality, ops, leadership, security —
	 * were served for a long time and read nowhere, so the profile showed three
	 * disciplines out of eight. The frame is here rather than copied five times
	 * because only the middle differs.
	 *
	 * Loading and the 404 are the caller's job: each record fetches its own
	 * shape, and a domain somebody has never worked in answers 404, which is
	 * how the section knows not to render.
	 */
	import { i18n } from '$lib/i18n';
	import CraftScoreBlock from './CraftScoreBlock.svelte';
	import type { CraftScoreValue, DomainAttestation, DomainOrientation } from '$types';
	import type { Snippet } from 'svelte';

	interface Props {
		domain: string;
		score: CraftScoreValue;
		orientations: DomainOrientation[];
		attestations?: DomainAttestation[];
		scoreNote?: string;
		/** What this trade alone has to show. */
		sections?: Snippet;
		/** Rendered in the header, e.g. a recompute button on your own profile. */
		action?: Snippet;
	}

	let { domain, score, orientations, attestations = [], scoreNote, sections, action }: Props =
		$props();
</script>

<section
	class="rounded-xl border border-border bg-surface-elevated overflow-hidden"
	data-testid="profile-record-{domain}"
>
	<div class="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
		<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
			{i18n.t(`domainRecord.titles.${domain}`)}
		</span>
		{@render action?.()}
	</div>

	<div class="space-y-8 p-5">
		<CraftScoreBlock {score} note={scoreNote} />

		{#if orientations.length > 0}
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('craftProfile.tradesTitle')}
				</p>
				<div class="mt-2 flex flex-wrap gap-2">
					{#each orientations as orientation (orientation.slug)}
						<span
							class="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs"
						>
							<span class="text-text-primary">{orientation.name || orientation.slug}</span>
							{#if orientation.is_primary}
								<span class="text-text-muted">{i18n.t('domainRecord.primary')}</span>
							{/if}
						</span>
					{/each}
				</div>
			</div>
		{/if}

		{@render sections?.()}

		{#if attestations.length > 0}
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('craftProfile.attestationsTitle')}
				</p>
				<ul class="mt-2 space-y-2" role="list">
					{#each attestations as attestation (attestation.verification_code)}
						<li class="flex flex-wrap items-center justify-between gap-2 text-sm">
							<span class="text-text-primary">{attestation.title}</span>
							<!-- Not `/verify/[hash]`: that route resolves a 64-hex slice
							     attestation hash, and this is a short verification code. -->
							<a
								href="/attestations/verify/{attestation.verification_code}"
								class="text-xs text-text-muted underline-offset-4 hover:text-text-primary hover:underline"
							>
								{i18n.t('craftProfile.verifyCta')}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<p class="border-t border-border pt-4 text-xs text-text-muted">
			{i18n.t('craftProfile.notAClaim')}
		</p>
	</div>
</section>
