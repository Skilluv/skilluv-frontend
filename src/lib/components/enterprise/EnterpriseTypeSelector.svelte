<script lang="ts">
	import type { EnterpriseType } from '$lib/types';
	import EnterpriseTypeCard from './EnterpriseTypeCard.svelte';
	import { i18n } from '$lib/i18n';

	interface Props {
		value: EnterpriseType | null;
		onchange?: (t: EnterpriseType) => void;
		disabled?: boolean;
	}

	let { value = $bindable(), onchange, disabled = false }: Props = $props();

	const types: EnterpriseType[] = ['direct_hire', 'staffing_agency', 'remote_international'];

	function select(t: EnterpriseType) {
		value = t;
		onchange?.(t);
	}
</script>

<fieldset class="space-y-4" disabled={disabled}>
	<legend class="sr-only">{i18n.t('enterprise.types.legend')}</legend>
	<div class="grid gap-4 md:grid-cols-3">
		{#each types as t (t)}
			<EnterpriseTypeCard
				type={t}
				selected={value === t}
				{disabled}
				onSelect={select}
			/>
		{/each}
	</div>
</fieldset>
