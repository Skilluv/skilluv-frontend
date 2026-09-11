<script lang="ts">
	/**
	 * Says why linking GitHub did not work, on the page it sent you back to.
	 *
	 * The callback is a redirect, so the failure arrives as `?github_error=`
	 * on the URL rather than as a response somebody reads. Until this existed
	 * the parameter was written by the API and read by nobody: the browser
	 * came back to the page it left, showing no link and no reason, which
	 * reads as "it worked" to anybody not checking their settings afterwards.
	 * That is worse than the raw JSON it replaced — at least the JSON was
	 * visibly wrong.
	 *
	 * Placed on every surface that sends a `return_to`. It renders nothing
	 * when the URL carries no error, so it costs a line at each call site.
	 *
	 * The parameter is cleared once read. Left in place it would come back on
	 * every reload, and it would travel in any link copied out of the address
	 * bar — one failed attempt becoming a permanent banner, including on
	 * somebody else's screen.
	 */
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import Alert from '$components/ui/Alert.svelte';
	import Button from '$components/ui/Button.svelte';
	import {
		githubLinkErrorKey,
		readGithubLinkError,
		type GithubLinkError
	} from '$lib/utils/github_link_error';

	interface Props {
		/** Where "try again" goes. Omit to show the message without a retry. */
		retryHref?: string;
		class?: string;
	}

	let { retryHref, class: className = '' }: Props = $props();

	let code = $state<GithubLinkError | null>(null);

	/**
	 * Retrying an `already_linked` refusal would fail identically: nothing
	 * about the second attempt differs, and offering the button would be the
	 * page pretending it might. The way out of that one is on the other
	 * account, and the message says so.
	 */
	let canRetry = $derived(Boolean(retryHref) && code !== null && code !== 'already_linked');

	$effect(() => {
		const { code: found, cleanedSearch } = readGithubLinkError(page.url.search);
		if (!found) return;
		code = found;
		// Same path, parameter gone. `replaceState` rather than `goto`: this
		// is tidying the address bar, not a navigation — `goto` would re-run
		// the load functions, and a history entry would let the back button
		// replay the failure.
		replaceState(`${page.url.pathname}${cleanedSearch}`, page.state);
	});
</script>

{#snippet retry()}
	<Button href={retryHref} size="sm" variant="secondary">
		{i18n.t('githubLink.retryCta')}
	</Button>
{/snippet}

{#if code}
	<Alert
		tone="error"
		title={i18n.t('githubLink.errorTitle')}
		action={canRetry ? retry : undefined}
		class={className}
	>
		{i18n.t(githubLinkErrorKey(code))}
	</Alert>
{/if}
