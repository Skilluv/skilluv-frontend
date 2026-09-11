<script lang="ts">
	/**
	 * Several free-text answers, entered one at a time and shown as chips.
	 *
	 * `MultiSelect` covers several answers picked from a list the platform
	 * owns. This covers the other half: several answers the platform does
	 * *not* own — the things a developer works in run from Terraform to
	 * whatever shipped last year, and a closed list would refuse real answers.
	 *
	 * It exists because the domain wizard had no widget for that shape. A
	 * question served as `multi` with an empty vocabulary rendered as a row of
	 * zero options, so `security_tools`, `quality_tools`, `leadership_tools`
	 * and code's `main_tools` were questions nobody could answer — visible,
	 * captioned, and inert.
	 *
	 * Committing an entry: Enter, or a comma, or leaving the field. A comma is
	 * accepted because people type lists that way without being told to, and
	 * losing the last entry to a missed Enter is the classic way this widget
	 * disappoints.
	 */
	import { X } from '@lucide/svelte';
	import { i18n } from '$lib/i18n';

	interface Props {
		/** The committed entries. Bindable. */
		value?: string[];
		onchange?: (v: string[]) => void;
		/** How many entries at most. Beyond it the field refuses politely. */
		max?: number;
		/** Longest single entry, in characters. */
		maxLength?: number;
		label?: string;
		placeholder?: string;
		id?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		value = $bindable([]),
		onchange,
		max,
		maxLength,
		label,
		placeholder = '',
		id,
		disabled = false,
		class: className = ''
	}: Props = $props();

	let draft = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	let fieldId = $derived(id ?? `tag-input-${label?.toLowerCase().replace(/\s+/g, '-') ?? 'value'}`);
	let atCeiling = $derived(max !== undefined && value.length >= max);

	/**
	 * One slot under the field, always present.
	 *
	 * The same reasoning as `Input`'s message line: a hint that appears when
	 * the ceiling is reached would push whatever follows down, under a pointer
	 * that is already on its way to it.
	 */
	let message = $derived.by(() => {
		if (atCeiling && max !== undefined) return i18n.t('tagInput.atCeiling', { n: max });
		if (max !== undefined) return i18n.t('tagInput.upTo', { n: max });
		return '';
	});

	/**
	 * Commit the draft.
	 *
	 * Trimmed, length-capped and de-duplicated: the validator checks each
	 * entry's length server-side, and sending the same tool twice spends one
	 * of the few slots on nothing.
	 */
	function commit() {
		const entry = draft.trim();
		draft = '';
		if (!entry || atCeiling) return;
		if (maxLength !== undefined && entry.length > maxLength) return;
		if (value.some((v) => v.toLowerCase() === entry.toLowerCase())) return;
		value = [...value, entry];
		onchange?.(value);
	}

	function remove(entry: string) {
		value = value.filter((v) => v !== entry);
		onchange?.(value);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ',') {
			// Enter inside a form would submit it, and a comma would land in
			// the draft it has just been read as terminating.
			event.preventDefault();
			commit();
			return;
		}
		// Backspace on an empty draft takes back the last chip — the one
		// gesture people try without being shown it.
		if (event.key === 'Backspace' && draft === '' && value.length > 0) {
			event.preventDefault();
			remove(value[value.length - 1]);
		}
	}
</script>

<div class="flex flex-col gap-1.5 {className}">
	{#if label}
		<label for={fieldId} class="text-sm font-medium text-text-primary">{label}</label>
	{/if}

	<!-- The chips sit outside the field rather than inside it: an entry long
	     enough to wrap would otherwise grow the input under the caret. -->
	{#if value.length > 0}
		<ul class="flex flex-wrap gap-1.5" data-testid="tag-input-chips">
			{#each value as entry (entry)}
				<li
					class="inline-flex items-center gap-1.5 rounded-full bg-accent/10 py-1 pl-3 pr-1.5 text-sm text-accent"
				>
					{entry}
					<button
						type="button"
						onclick={() => remove(entry)}
						{disabled}
						aria-label={i18n.t('tagInput.remove', { value: entry })}
						class="rounded-full p-0.5 transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<X size={12} strokeWidth={2.5} />
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<input
		bind:this={inputEl}
		bind:value={draft}
		id={fieldId}
		type="text"
		{placeholder}
		disabled={disabled || atCeiling}
		maxlength={maxLength}
		{onkeydown}
		onblur={commit}
		aria-describedby="{fieldId}-msg"
		class="h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
	/>

	<p id="{fieldId}-msg" class="min-h-4 text-xs text-text-muted" aria-live="polite">
		{message}
	</p>
</div>
