<script lang="ts">
	import { i18n } from '$lib/i18n';

	interface Props {
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { onConfirm, onCancel }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	role="dialog"
	aria-modal="true"
	tabindex="-1"
	class="term-overlay"
	onclick={onCancel}
>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
	<div role="document" class="term-dialog" onclick={(e) => e.stopPropagation()}>
		<pre class="term-text">
WARNING

{i18n.locale === 'fr'
? `You are about to enter terminal mode.
The graphical interface will be replaced
by a Unix terminal. No mouse. No buttons.
Only command lines.

You can exit at any time with 'exit' or [exit].`
: `You are about to enter terminal mode.
The graphical interface will be replaced
by a Unix terminal. No mouse. No buttons.
Only command lines.

You can exit at any time with 'exit' or [exit].`}

$ skilluv --mode terminal
{i18n.locale === 'fr' ? 'Are you sure? [Y/n]' : 'Are you sure? [Y/n]'}</pre>

		<div class="term-buttons">
			<button onclick={onCancel} class="term-btn">n</button>
			<button onclick={onConfirm} class="term-btn term-btn-confirm">Y</button>
		</div>
	</div>
</div>

<style>
	.term-overlay {
		position: fixed;
		inset: 0;
		z-index: 9998;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.92);
	}

	.term-dialog {
		width: 100%;
		max-width: 480px;
		margin: 0 16px;
		background: #000;
		border: 1px solid #333;
		padding: 24px;
		font-family: 'JetBrains Mono', 'Courier New', monospace;
		-webkit-font-smoothing: none;
	}

	.term-text {
		color: #aaa;
		font-size: 13px;
		line-height: 1.5;
		white-space: pre-wrap;
		margin: 0 0 20px;
	}

	.term-buttons {
		display: flex;
		gap: 12px;
	}

	.term-btn {
		flex: 1;
		padding: 8px;
		background: none;
		border: 1px solid #333;
		color: #666;
		font-family: inherit;
		font-size: 14px;
		cursor: pointer;
	}

	.term-btn:hover {
		color: #aaa;
		border-color: #555;
	}

	.term-btn-confirm {
		color: #aaa;
		border-color: #aaa;
	}

	.term-btn-confirm:hover {
		background: #aaa;
		color: #000;
	}
</style>
