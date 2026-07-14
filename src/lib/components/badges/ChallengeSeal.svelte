<script lang="ts">
	interface Props {
		challengeId: string;
		label?: string;
		date: Date | string;
		impact?: boolean;
		size?: 'sm' | 'md' | 'hero';
	}

	let { challengeId, label = 'PROOF', date, impact = false, size = 'md' }: Props = $props();

	const dim = $derived(size === 'sm' ? 48 : size === 'md' ? 72 : 112);
	const dateStr = $derived(
		(typeof date === 'string' ? new Date(date) : date).toLocaleDateString('fr-FR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		})
	);
</script>

<div
	class="seal"
	class:seal--impact={impact}
	style:width="{dim}px"
	style:height="{dim}px"
	role="img"
	aria-label="{label} · challenge {challengeId} · {dateStr}"
>
	<span class="seal__label">{label}</span>
	<span class="seal__id">{challengeId}</span>
	<span class="seal__date">{dateStr}</span>
</div>

<style>
	.seal {
		display: grid;
		place-items: center;
		grid-template-rows: auto auto auto;
		gap: 1px;
		background: linear-gradient(140deg, #c47a2e 0%, #a04520 100%);
		clip-path: polygon(15% 0, 85% 0, 100% 20%, 100% 80%, 85% 100%, 15% 100%, 0 80%, 0 20%);
		color: #f4ede0;
		font-family: var(--font-sans);
		text-align: center;
		box-shadow:
			inset 0 -4px 8px rgba(45, 24, 16, 0.4),
			var(--shadow-sm);
	}
	.seal--impact {
		background: linear-gradient(140deg, #e63946 0%, #a04520 100%);
	}
	.seal__label {
		font-weight: 700;
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
	}
	.seal__id {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.05em;
		opacity: 0.85;
	}
	.seal__date {
		font-family: var(--font-mono);
		font-size: 0.4375rem;
		letter-spacing: 0.05em;
		opacity: 0.7;
	}
</style>
