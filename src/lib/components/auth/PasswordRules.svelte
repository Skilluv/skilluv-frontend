<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { passwordChecks, PASSWORD_RULES } from '$lib/utils/password';
	import { Check, Circle } from '@lucide/svelte';

	/**
	 * The password policy, ticking off as somebody types it.
	 *
	 * ## Why it is a list and not a sentence
	 *
	 * The policy has five parts. Stated as one sentence — "at least ten
	 * characters, with uppercase, lowercase, digit and symbol" — somebody who
	 * misses one has to work out which, on a field they cannot read back. Told
	 * only on submit, they find out after filling in the whole form. Both are
	 * avoidable: the requirements are knowable from the first keystroke.
	 *
	 * So all five are listed, each one ticks the moment it is satisfied, and
	 * nothing here is ever phrased as a mistake. Somebody halfway through typing
	 * has not made one.
	 *
	 * ## Why it appears only once there is something to judge
	 *
	 * Rendered from the first character, not before. Five unticked requirements
	 * sitting under an empty field read as five complaints about a password
	 * nobody has written yet. The hint under the field already says what is
	 * wanted; this replaces it once it becomes checkable.
	 *
	 * ## Accessibility
	 *
	 * Not a live region, deliberately. Five items re-announced on every keystroke
	 * is unusable, and the submit-time error — which *is* announced, through the
	 * field's `role="alert"` — already covers somebody who never sees this.
	 * Instead each item carries its state in text, so it can be read on demand:
	 * point the field's `aria-describedby` at `id` and the list is one gesture
	 * away rather than shouted.
	 *
	 * The tick is `aria-hidden`: colour and iconography are what make it fast to
	 * read, and the word after it is what makes it readable at all.
	 */

	interface Props {
		password: string;
		/** So a field can name this list in its `aria-describedby`. */
		id?: string;
	}

	let { password, id }: Props = $props();

	const checks = $derived(passwordChecks(password));
</script>

{#if password.length > 0}
	<div class="rules" {id}>
		<p class="rules__title">{i18n.t('auth.password.rules.title')}</p>
		<ul class="rules__list">
			{#each PASSWORD_RULES as rule (rule)}
				{@const met = checks[rule]}
				<li class="rules__item" data-met={met}>
					<span class="rules__mark" aria-hidden="true">
						{#if met}
							<Check size={13} strokeWidth={3} />
						{:else}
							<Circle size={13} strokeWidth={2} />
						{/if}
					</span>
					<span>{i18n.t(`auth.password.rules.${rule}`)}</span>
					<!-- The state in words. The tick carries it for anybody who can
					     see it; this is the same information for anybody who cannot. -->
					<span class="rules__state">
						{met ? i18n.t('auth.password.rules.met') : i18n.t('auth.password.rules.notMet')}
					</span>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.rules {
		margin-top: 0.5rem;
	}

	.rules__title {
		margin: 0 0 0.375rem;
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--sk-text-muted);
	}

	.rules__list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rules__item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--sk-text-muted);
		/* Only the colour moves. A row that slides or resizes as it is satisfied
		   makes the list jump under a hand that is still typing. */
		transition: color var(--sk-anim-fast) var(--sk-ease-standard);
	}

	.rules__item[data-met='true'] {
		color: var(--sk-success);
	}

	.rules__mark {
		display: inline-flex;
		flex-shrink: 0;
		/* Unmet is a hollow circle at low contrast: present, not shouting. */
		opacity: 0.45;
	}
	.rules__item[data-met='true'] .rules__mark {
		opacity: 1;
	}

	/* Read by assistive tech, never drawn. `display: none` would take it out of
	   the accessibility tree along with the pixels. */
	.rules__state {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
