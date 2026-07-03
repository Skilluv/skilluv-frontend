<script lang="ts">
	import { geoApi, type City } from '$lib/api/geo';
	import { i18n } from '$lib/i18n';
	import { onDestroy, untrack } from 'svelte';

	interface Props {
		value?: string | null;
		country: string | null;
		label?: string;
		placeholder?: string;
		required?: boolean;
		error?: string;
		hint?: string;
	}

	let {
		value = $bindable<string | null>(null),
		country,
		label,
		placeholder,
		required = false,
		error,
		hint
	}: Props = $props();

	let input = $state(value ?? '');
	let open = $state(false);
	let suggestions = $state<City[]>([]);
	let loading = $state(false);
	let highlight = $state(0);
	let container = $state<HTMLDivElement | undefined>();
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let lastFetched = $state<{ country: string; q: string } | null>(null);

	onDestroy(() => clearTimeout(debounceTimer));

	let prevCountry = $state<string | null>(untrack(() => country ?? null));
	$effect(() => {
		// Reset uniquement si le pays change *après* le mount
		const c = country ?? null;
		if (c !== prevCountry) {
			input = '';
			value = null;
			suggestions = [];
			open = false;
			prevCountry = c;
		}
	});

	function onInput() {
		value = input.trim() || null;
		if (!country) return;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => fetchCities(input.trim()), 200);
		open = true;
	}

	async function fetchCities(q: string) {
		if (!country) return;
		const key = `${country}|${q}`;
		if (lastFetched && `${lastFetched.country}|${lastFetched.q}` === key) return;
		loading = true;
		try {
			const res = await geoApi.searchCities(country, q || undefined, 10);
			suggestions = res.data;
			lastFetched = { country, q };
		} catch {
			suggestions = [];
		} finally {
			loading = false;
		}
	}

	function pick(city: City) {
		input = city.name;
		value = city.name;
		open = false;
	}

	function onFocus() {
		if (!country) return;
		open = true;
		if (suggestions.length === 0) fetchCities(input.trim());
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlight = Math.min(highlight + 1, suggestions.length - 1);
			open = true;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlight = Math.max(highlight - 1, 0);
		} else if (e.key === 'Enter') {
			const s = suggestions[highlight];
			if (s) {
				e.preventDefault();
				pick(s);
			}
		} else if (e.key === 'Escape') {
			open = false;
		}
	}

	$effect(() => {
		const onClick = (e: MouseEvent) => {
			if (container && !container.contains(e.target as Node)) open = false;
		};
		document.addEventListener('mousedown', onClick);
		return () => document.removeEventListener('mousedown', onClick);
	});
</script>

<div bind:this={container} class="relative flex flex-col gap-1.5">
	{#if label}
		<span class="text-sm font-medium text-text-primary">{label}</span>
	{/if}

	<input
		type="text"
		bind:value={input}
		oninput={onInput}
		onfocus={onFocus}
		onkeydown={onKey}
		disabled={!country}
		{required}
		placeholder={country
			? (placeholder ?? (i18n.locale === 'fr' ? 'Ex. Paris' : 'e.g. Paris'))
			: i18n.locale === 'fr'
				? 'Choisir un pays d\'abord'
				: 'Pick a country first'}
		class="h-11 w-full rounded-xl border bg-surface-elevated px-4 text-sm text-text-primary placeholder:text-text-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50
			{error ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'}"
		aria-autocomplete="list"
	/>

	{#if open && country}
		<div class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg">
			<ul class="max-h-64 overflow-y-auto py-1" role="listbox">
				{#if loading && suggestions.length === 0}
					<li class="px-3 py-2 text-sm text-text-muted">{i18n.locale === 'fr' ? 'Recherche…' : 'Searching…'}</li>
				{:else if suggestions.length === 0}
					<li class="px-3 py-2 text-sm text-text-muted">
						{i18n.locale === 'fr' ? 'Aucune ville trouvée' : 'No city found'}
					</li>
				{:else}
					{#each suggestions as s, i (s.name)}
						<li>
							<button
								type="button"
								onmouseenter={() => (highlight = i)}
								onclick={() => pick(s)}
								class="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors
									{i === highlight ? 'bg-surface-overlay text-text-primary' : 'text-text-muted hover:text-text-primary'}"
								role="option"
								aria-selected={value === s.name}
							>
								<span>{s.name}</span>
								<span class="font-mono text-[10px] text-text-muted">
									{s.population.toLocaleString()} hab
								</span>
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	{/if}

	{#if error}
		<p class="text-xs text-error" role="alert">{error}</p>
	{:else if hint}
		<p class="text-xs text-text-muted">{hint}</p>
	{/if}
</div>
