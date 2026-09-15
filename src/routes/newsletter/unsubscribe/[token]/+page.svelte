<script lang="ts">
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { newsletterApi } from '$api/newsletter';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import { MailMinus, MailX, Loader2 } from '@lucide/svelte';

	/**
	 * Where the unsubscribe link lands.
	 *
	 * ## It acts on load, and that is the whole point
	 *
	 * The wording beside the form promises leaving in one click, and this page
	 * is that click. A confirm button here would make it two, on the one gesture
	 * that must never be made harder than the one that got somebody in.
	 *
	 * The cost of that choice is real and worth naming: the API exposes this as
	 * a GET, so a mail scanner that follows links can unsubscribe somebody who
	 * never clicked. Between a scanner removing an address and a person unable
	 * to leave, the first is the one that is recoverable, and the way back is on
	 * this page.
	 *
	 * ## One success state
	 *
	 * 200 covers both "removed just now" and "was already out", with nothing to
	 * separate them, so this says neither: a page that distinguished them would
	 * answer "is this address on the list" to whoever holds the URL.
	 */

	type State = 'working' | 'done' | 'unknown' | 'failed';

	let state = $state<State>('working');

	$effect(() => {
		const token = page.params.token;
		if (!token) {
			state = 'unknown';
			return;
		}
		let live = true;
		newsletterApi
			.unsubscribe(token)
			.then(() => {
				if (live) state = 'done';
			})
			.catch((err) => {
				if (!live) return;
				const status = err instanceof SkilluError ? err.status : 0;
				state = status === 404 ? 'unknown' : 'failed';
			});
		return () => {
			live = false;
		};
	});
</script>

<svelte:head>
	<title>{i18n.t('newsletter.unsubPage.title')} | Skilluv</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
	{#if state === 'working'}
		<Loader2 size={32} strokeWidth={1.5} class="animate-spin text-text-muted" />
		<p class="mt-4 text-sm text-text-muted">{i18n.t('newsletter.unsubPage.working')}</p>
	{:else if state === 'done'}
		<div
			class="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-overlay text-text-muted"
		>
			<MailMinus size={28} strokeWidth={1.5} />
		</div>
		<h1 class="mt-6 text-3xl font-black tracking-tight text-text-primary">
			{i18n.t('newsletter.unsubPage.doneTitle')}
		</h1>
		<p class="mt-3 text-sm leading-relaxed text-text-muted" data-testid="newsletter-unsub-state">
			{i18n.t('newsletter.unsubPage.doneBody')}
		</p>
		<!-- The way back, for the scanner case and for a change of mind. No
		     "are you sure", no reason asked: leaving stays free. -->
		<Button variant="ghost" href="/" class="mt-8">
			{i18n.t('newsletter.unsubPage.rejoin')}
		</Button>
	{:else}
		<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10 text-error">
			<MailX size={28} strokeWidth={1.5} />
		</div>
		<h1 class="mt-6 text-3xl font-black tracking-tight text-text-primary">
			{state === 'unknown'
				? i18n.t('newsletter.unsubPage.unknownTitle')
				: i18n.t('newsletter.unsubPage.failedTitle')}
		</h1>
		<p class="mt-3 text-sm leading-relaxed text-text-muted" data-testid="newsletter-unsub-state">
			{state === 'unknown'
				? i18n.t('newsletter.unsubPage.unknownBody')
				: i18n.t('newsletter.unsubPage.failedBody')}
		</p>
		<Button variant="ghost" href="/legal/privacy" class="mt-8">
			{i18n.t('newsletter.unsubPage.contact')}
		</Button>
	{/if}
</div>
