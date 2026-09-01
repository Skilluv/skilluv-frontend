<script lang="ts">
	/**
	 * The invitation to link Discord.
	 *
	 * ## Why it lives after the trades step, not at signup
	 *
	 * A brand-new account carries two things: the `challenger` capability and
	 * the `apprenti` rank. Both map to roles every member already has, so they
	 * open no channel and distinguish nobody — linking at signup spends the
	 * moment and gives back nothing visible.
	 *
	 * After the trades are declared, up to three domain roles exist, and the
	 * matching channels open within seconds. Same click, a result the person
	 * can see.
	 *
	 * The other reason is narrower and costs support tickets: Discord is
	 * link-only. There is no "sign in with Discord", so putting it in the
	 * signup funnel promises a door that does not exist.
	 *
	 * ## Why the button is a link
	 *
	 * `/auth/discord/link` starts an OAuth dance: the browser has to go there
	 * and come back through a callback the server handles. An XHR would follow
	 * the redirect invisibly and land a consent screen in a response body
	 * nobody can interact with.
	 *
	 * ## Skipping is a first-class answer
	 *
	 * Nothing downstream depends on this. Somebody who declines is not blocked,
	 * not nagged, and finds the same button in settings whenever they want it —
	 * which is the reason the settings surface exists at all.
	 */
	import { MessageCircle } from '@lucide/svelte';
	import { page } from '$app/state';
	import { linkUrl } from '$api/oauth_links';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';

	interface Props {
		/** Rendered under the actions — the step that follows, if any. */
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	/**
	 * Where the callback sends the browser back to.
	 *
	 * Without it the consent screen ends on raw JSON at the API origin, which
	 * is a bad place to land from anywhere and a worse one mid-onboarding: the
	 * step that follows is no longer reachable, and the person was in the
	 * middle of a sequence they were told to finish.
	 */
	let returnTo = $derived(page.url.pathname + page.url.search);
</script>

<section
	class="space-y-4 rounded-2xl border border-border bg-surface-elevated p-6 text-left"
	data-testid="discord-link-card"
>
	<div class="space-y-1">
		<h3 class="flex items-center gap-2 text-base font-semibold text-text-primary">
			<MessageCircle size={18} />
			{i18n.t('discordLink.title')}
		</h3>
		<p class="text-sm text-text-muted">{i18n.t('discordLink.body')}</p>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<!-- A link, not a button: this navigates into a consent screen. -->
		<Button
			href={linkUrl('discord', returnTo)}
			size="sm"
			variant="primary"
			data-testid="discord-link-cta"
		>
			{i18n.t('discordLink.cta')}
		</Button>
		{@render children?.()}
	</div>

	<!-- Said plainly rather than implied by a smaller button: declining costs
	     nothing and the offer does not expire. -->
	<p class="text-xs text-text-muted">{i18n.t('discordLink.laterNote')}</p>
</section>
