<script lang="ts">
	/**
	 * Says why linking an account did not work, on the page it sent you back
	 * to.
	 *
	 * The callback is a redirect, so the failure arrives as
	 * `?<provider>_error=` on the URL rather than as a response somebody
	 * reads. Until this existed the parameter was written by the API and read
	 * by nobody: the browser came back to the page it left, showing no link
	 * and no reason, which reads as "it worked" to anybody not checking their
	 * settings afterwards. That is worse than the raw JSON it replaced — at
	 * least the JSON was visibly wrong.
	 *
	 * One component for all four providers. It reads whichever one failed and
	 * names it, which is the point of the parameter being namespaced: a
	 * settings page offering four connect buttons has to say which of them
	 * refused.
	 *
	 * Placed on every surface that sends a `return_to`. It renders nothing
	 * when the URL carries no failure, so it costs a line at each call site.
	 *
	 * The parameter is cleared once read. Left in place it would come back on
	 * every reload, and it would travel in any link copied out of the address
	 * bar — one failed attempt becoming a permanent banner.
	 */
	import { tick } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { oauthTrace } from '$lib/utils/oauth_trace';
	import { i18n } from '$lib/i18n';
	import Alert from '$components/ui/Alert.svelte';
	import Button from '$components/ui/Button.svelte';
	import OAuthStartLink from './OAuthStartLink.svelte';
	import {
		OAUTH_PROVIDER_NAMES,
		oauthLinkErrorKey,
		readOAuthLinkError,
		type LinkErrorProvider,
		type OAuthLinkFailure
	} from '$lib/utils/oauth_link_error';

	interface Props {
		/**
		 * The providers this instance speaks for.
		 *
		 * Required, and the reason is `/settings/security`: it renders the
		 * GitHub card and the linked-accounts card side by side, and with
		 * both instances reading the whole URL one failure drew two identical
		 * banners. Each says which buttons it owns, so exactly one answers.
		 *
		 * It also narrows `retryHref`'s argument to providers the caller can
		 * actually build a URL for.
		 */
		providers: readonly LinkErrorProvider[];
		/**
		 * Where "try again" goes, for whichever provider failed.
		 *
		 * A function rather than a string: each provider starts its flow at a
		 * different route — GitHub at `/auth/github/start`, the rest at
		 * `/auth/{provider}/link` — and only the caller knows how it builds
		 * those. Omit it to show the message with no retry.
		 */
		retryHref?: (provider: LinkErrorProvider) => string;
		class?: string;
	}

	let { providers, retryHref, class: className = '' }: Props = $props();

	let failure = $state<OAuthLinkFailure | null>(null);

	let providerName = $derived(failure ? OAUTH_PROVIDER_NAMES[failure.provider] : '');

	/**
	 * Where a second attempt would go, when a second attempt is worth
	 * offering.
	 *
	 * Retrying an `already_linked` refusal would fail identically: nothing
	 * about it differs, and offering the button would be the page pretending
	 * it might. The way out of that one is on the other account, and the
	 * message says so.
	 */
	let retryUrl = $derived(
		failure && retryHref && failure.code !== 'already_linked'
			? retryHref(failure.provider)
			: undefined
	);

	$effect(() => {
		const { failure: found, cleanedSearch } = readOAuthLinkError(page.url.search);
		oauthTrace('return: url read', {
			search: page.url.search || '(none)',
			found: found ? `${found.provider}/${found.code}` : null,
			owns: providers.join(',')
		});
		// Not ours: another instance on this page owns that button, and it
		// clears the parameter. Reading it here too would draw the banner
		// twice for one refusal.
		if (!found || !providers.includes(found.provider)) return;
		failure = found;

		// Tidying the address bar, and nothing more.
		//
		// `replaceState` rather than `goto`: `goto` would re-run the load
		// functions, and a history entry would let the back button replay the
		// failure.
		//
		// Deferred and guarded because it throws when the router has not
		// initialised yet, and this component renders at the top of its page
		// now — early enough to hit exactly that. Thrown from an effect
		// during hydration it took the rest of the page down with it, so the
		// banner it exists to show never appeared. The message matters; the
		// tidy URL is a courtesy, and it is allowed to fail.
		void tick().then(() => {
			try {
				replaceState(`${page.url.pathname}${cleanedSearch}`, page.state);
			} catch {
				// Router not ready. The parameter stays for this view and goes
				// on the next navigation, which is a far smaller cost than a
				// page that did not render.
			}
		});
	});
</script>

{#snippet retry()}
	<OAuthStartLink href={retryUrl ?? ''} size="sm" variant="secondary">
		{i18n.t('oauthLink.retryCta')}
	</OAuthStartLink>
{/snippet}

{#if failure}
	<Alert
		tone="error"
		title={i18n.t('oauthLink.errorTitle', { provider: providerName })}
		action={retryUrl ? retry : undefined}
		class={className}
	>
		{i18n.t(oauthLinkErrorKey(failure.code), { provider: providerName })}
	</Alert>
{/if}
