<script lang="ts">
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { newsletterApi } from '$api/newsletter';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import { MailCheck, MailX, Loader2 } from '@lucide/svelte';

	/**
	 * Where the confirmation link lands.
	 *
	 * The mail carries a link to this page rather than to the API, because the
	 * API answers JSON: somebody who clicked would have got a wall of braces and
	 * no idea whether it had worked.
	 *
	 * ## It acts on load
	 *
	 * The click already happened, in the mail. Asking for a second one on
	 * arrival would be asking the same question twice, and the people who drop
	 * out at that point are exactly the ones who did want the letter.
	 *
	 * ## A 404 is two different people
	 *
	 * The token is spent on use, so a second click answers 404 rather than 200 —
	 * a confirmation link that kept working would be a live credential sitting
	 * in a mailbox somebody else may read one day.
	 *
	 * That means 404 reaches both somebody whose link expired — they last seven
	 * days — and somebody who simply clicked twice and is already on the list,
	 * with nothing to tell them apart. Telling the second to subscribe again
	 * would send them round a loop they have already finished, so the page names
	 * both and asks nothing of whoever is already done.
	 *
	 * Subscribing again is a real way out for the first half: a pending row
	 * re-subscribed gets a fresh token and a fresh mail. It is only a no-op for
	 * an address already confirmed, which is the half that needs nothing.
	 */

	type State = 'working' | 'done' | 'spent' | 'failed';

	let state = $state<State>('working');

	$effect(() => {
		const token = page.params.token;
		if (!token) {
			state = 'spent';
			return;
		}
		let live = true;
		newsletterApi
			.confirm(token)
			.then(() => {
				if (live) state = 'done';
			})
			.catch((err) => {
				if (!live) return;
				// Spent, expired or unknown — one answer from here, since the
				// server does not separate them. Anything else is ours to own,
				// and retrying may work.
				const status = err instanceof SkilluError ? err.status : 0;
				state = status === 404 ? 'spent' : 'failed';
			});
		return () => {
			live = false;
		};
	});
</script>

<svelte:head>
	<title>{i18n.t('newsletter.confirmPage.title')} | Skilluv</title>
	<!-- A one-time token in the URL has nothing to index. -->
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
	{#if state === 'working'}
		<Loader2 size={32} strokeWidth={1.5} class="animate-spin text-text-muted" />
		<p class="mt-4 text-sm text-text-muted">{i18n.t('newsletter.confirmPage.working')}</p>
	{:else if state === 'done'}
		<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
			<MailCheck size={28} strokeWidth={1.5} />
		</div>
		<h1 class="mt-6 text-3xl font-black tracking-tight text-text-primary">
			{i18n.t('newsletter.confirmPage.doneTitle')}
		</h1>
		<p class="mt-3 text-sm leading-relaxed text-text-muted" data-testid="newsletter-confirm-state">
			{i18n.t('newsletter.confirmPage.doneBody')}
		</p>
		<Button variant="primary" href="/" class="mt-8">
			{i18n.t('newsletter.confirmPage.home')}
		</Button>
	{:else}
		<!-- A spent token is not an error: half the people who land on it are
		     already subscribed and did nothing wrong. Red is kept for the case
		     that actually is a failure. -->
		<div
			class="flex h-14 w-14 items-center justify-center rounded-2xl {state === 'spent'
				? 'bg-surface-overlay text-text-muted'
				: 'bg-error/10 text-error'}"
		>
			<MailX size={28} strokeWidth={1.5} />
		</div>
		<h1 class="mt-6 text-3xl font-black tracking-tight text-text-primary">
			{state === 'spent'
				? i18n.t('newsletter.confirmPage.spentTitle')
				: i18n.t('newsletter.confirmPage.failedTitle')}
		</h1>
		<p class="mt-3 text-sm leading-relaxed text-text-muted" data-testid="newsletter-confirm-state">
			{state === 'spent'
				? i18n.t('newsletter.confirmPage.spentBody')
				: i18n.t('newsletter.confirmPage.failedBody')}
		</p>
		<!-- Offered, not instructed: whoever landed here because they clicked
		     twice is already on the list and has nothing to do. The link is for
		     the other half, whose token expired, and the form that issues a new
		     one is at the foot of the home page. -->
		<Button variant="ghost" href="/" class="mt-8">
			{i18n.t('newsletter.confirmPage.retry')}
		</Button>
	{/if}
</div>
