<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import Button from '$components/ui/Button.svelte';
</script>

<section class="py-24 sm:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="rounded-xl border border-border bg-surface-elevated p-12 sm:p-16 text-center">
			<h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
				{i18n.locale === 'fr' ? 'Prêt à prouver ce que tu vaux ?' : 'Ready to prove your worth?'}
			</h2>
			<p class="text-text-muted mb-8 max-w-lg mx-auto">
				{i18n.locale === 'fr'
					? 'Rejoins les talents qui ont choisi la preuve plutôt que le blabla.'
					: 'Join the talents who chose proof over talk.'}
			</p>
			<Button variant="accent" size="lg" href="/auth/register">
				{i18n.locale === 'fr' ? 'Commencer maintenant' : 'Get started now'}
			</Button>
		</div>
	</div>
</section>
