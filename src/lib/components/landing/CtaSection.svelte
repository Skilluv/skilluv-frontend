<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { scrollReveal } from '$lib/utils/animations';
	import Button from '$components/ui/Button.svelte';
</script>

<section class="py-16 sm:py-24 lg:py-32">
	<div class="mx-auto max-w-7xl px-4">
		<div use:scrollReveal class="rounded-3xl border border-border bg-surface-elevated p-12 sm:p-16 lg:p-20 text-center">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-5">
				{i18n.locale === 'fr' ? 'Prêt à prouver' : 'Ready to prove'}<br />
				<span class="text-accent">{i18n.locale === 'fr' ? 'ce que tu vaux ?' : 'your worth?'}</span>
			</h2>
			<p class="text-text-muted text-lg mb-10 max-w-lg mx-auto">
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
