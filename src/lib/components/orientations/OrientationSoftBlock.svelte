<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$lib/components/ui/Button.svelte';
	import { Compass } from '@lucide/svelte';

	interface Props {
		reason?: string;
	}

	let { reason }: Props = $props();

	let blocked = $derived(
		auth.isAuthenticated &&
			auth.user?.role === 'user' &&
			(auth.user?.orientations?.length ?? 0) === 0
	);
</script>

{#if blocked}
	<section
		class="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-accent/30 bg-surface-elevated p-10 text-center"
		aria-labelledby="orientation-soft-block-title"
	>
		<Compass size={40} strokeWidth={1.5} class="text-accent" aria-hidden="true" />
		<h2 id="orientation-soft-block-title" class="text-2xl font-bold text-text-primary">
			{i18n.t('orientations.softBlock.title')}
		</h2>
		<p class="text-sm text-text-muted">
			{reason ?? i18n.t('orientations.softBlock.defaultReason')}
		</p>
		<div class="mt-2 flex flex-wrap items-center justify-center gap-3">
			<Button variant="primary" href="/onboarding/orientations">
				{i18n.t('orientations.softBlock.ctaPrimary')}
			</Button>
			<Button variant="secondary" href="/">
				{i18n.t('orientations.softBlock.ctaLater')}
			</Button>
		</div>
	</section>
{/if}
