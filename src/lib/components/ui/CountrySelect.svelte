<script lang="ts">
	import { geo } from '$lib/stores/geo.svelte';
	import { i18n } from '$lib/i18n';
	import { onMount } from 'svelte';
	import type { Country } from '$lib/api/geo';

	interface Props {
		value?: string | null;
		label?: string;
		placeholder?: string;
		required?: boolean;
		error?: string;
		clearable?: boolean;
		onchange?: (iso3: string | null, country: Country | null) => void;
	}

	let {
		value = $bindable<string | null>(null),
		label,
		placeholder,
		required = false,
		error,
		clearable = false,
		onchange
	}: Props = $props();

	let open = $state(false);
	let query = $state('');
	let inputEl = $state<HTMLInputElement | undefined>();
	let containerEl = $state<HTMLDivElement | undefined>();
	let highlight = $state(0);

	onMount(() => {
		void geo.ensureCountries();
		// Outside-click : on écoute `click` au document. Le handler de toggle
		// sur le trigger a déjà fait son travail (Svelte fire onclick avant
		// que le click bulle au document), donc si l'user reclique le trigger
		// pour fermer, `open` est déjà repassé à false ici → rien à faire.
		const handleClick = (e: MouseEvent) => {
			if (!containerEl) return;
			if (!containerEl.contains(e.target as Node)) {
				open = false;
				query = '';
			}
		};
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	});

	let selected = $derived(geo.find(value));

	let filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return geo.countries;
		return geo.countries.filter(
			(c) => c.name.toLowerCase().includes(q) || c.iso3.toLowerCase().startsWith(q) || c.iso2.toLowerCase() === q
		);
	});

	$effect(() => {
		void filtered;
		highlight = 0;
	});

	function select(c: Country) {
		value = c.iso3;
		open = false;
		query = '';
		onchange?.(c.iso3, c);
	}

	function clear(e: MouseEvent) {
		e.stopPropagation();
		value = null;
		query = '';
		onchange?.(null, null);
	}

	function toggleDropdown(e: MouseEvent) {
		// stopPropagation() garantit que le click ne remonte pas au document,
		// donc le handler outside-click n'a aucune chance d'interférer avec
		// le toggle. Sans ça, sur certains navigateurs (Safari macOS
		// notamment), la propagation pouvait causer une reset immédiat.
		e.stopPropagation();
		open = !open;
		if (open) {
			// Focus l'input de recherche à l'ouverture ; à la fermeture on
			// laisse le blur naturel se faire.
			setTimeout(() => inputEl?.focus(), 0);
		} else {
			query = '';
		}
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlight = Math.min(highlight + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlight = Math.max(highlight - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const c = filtered[highlight];
			if (c) select(c);
		} else if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

<div bind:this={containerEl} class="relative flex flex-col gap-1.5">
	{#if label}
		<span class="text-sm font-medium text-text-primary">{label}</span>
	{/if}

	<div class="relative">
		<button
			type="button"
			onclick={toggleDropdown}
			class="flex h-11 w-full items-center justify-between rounded-xl border bg-surface-elevated px-4 text-left text-sm text-text-primary transition-colors
				{error ? 'border-error' : 'border-border hover:border-text-muted'}
				{open ? 'border-primary ring-1 ring-primary' : ''}"
			aria-haspopup="listbox"
			aria-expanded={open}
		>
			<span class="truncate {selected ? '' : 'text-text-muted'}">
				{selected ? selected.name : (placeholder ?? (i18n.locale === 'fr' ? 'Sélectionner un pays' : 'Select a country'))}
			</span>
			<span class="ml-2 flex shrink-0 items-center gap-1.5 text-text-muted">
				{#if clearable && value}
					<!-- spacer so the chevron stays aligned -->
					<span class="inline-block h-3.5 w-3.5"></span>
				{/if}
				<svg class="h-4 w-4 transition-transform {open ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</span>
		</button>
		{#if clearable && value}
			<button
				type="button"
				onclick={clear}
				class="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-text-muted hover:bg-surface-overlay hover:text-text-primary"
				aria-label={i18n.locale === 'fr' ? 'Effacer' : 'Clear'}
			>
				<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	{#if open}
		<div class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg">
			<div class="border-b border-border p-2">
				<input
					bind:this={inputEl}
					bind:value={query}
					onkeydown={onKey}
					placeholder={i18n.locale === 'fr' ? 'Rechercher…' : 'Search…'}
					class="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
				/>
			</div>
			<ul class="max-h-64 overflow-y-auto py-1" role="listbox">
				{#if geo.loading && geo.countries.length === 0}
					<li class="px-3 py-2 text-sm text-text-muted">{i18n.locale === 'fr' ? 'Chargement…' : 'Loading…'}</li>
				{:else if filtered.length === 0}
					<li class="px-3 py-2 text-sm text-text-muted">{i18n.locale === 'fr' ? 'Aucun pays' : 'No country'}</li>
				{:else}
					{#each filtered as c, i (c.iso3)}
						<li>
							<button
								type="button"
								onmouseenter={() => (highlight = i)}
								onclick={() => select(c)}
								class="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors
									{i === highlight ? 'bg-surface-overlay text-text-primary' : 'text-text-muted'}"
								role="option"
								aria-selected={value === c.iso3}
							>
								<span>{c.name}</span>
								<span class="font-mono text-[11px] text-text-muted">{c.iso3}</span>
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	{/if}

	{#if error}
		<p class="text-xs text-error" role="alert">{error}</p>
	{/if}
</div>
