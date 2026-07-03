<script lang="ts">
	let { children } = $props();
	import { i18n } from '$lib/i18n';
</script>

<div class="flex min-h-[100vh] flex-col items-center justify-center px-4 py-12">
	<!-- Logo -->
	<a href="/" class="mb-10 flex items-center gap-2 text-3xl font-black tracking-tight">
		<img src="/favicon.svg" alt="" class="h-8 w-8" />
		<span><span class="text-accent">Skill</span><span class="text-text-primary">uv</span></span>
	</a>

	<div class="w-full max-w-md">
		{@render children()}
	</div>

	<p class="mt-8 text-xs text-text-muted">
		{i18n.t('auth.footer', { year: new Date().getFullYear() })}
	</p>
</div>
