<script lang="ts">
	/**
	 * What somebody has bought around mentoring, and what is on offer.
	 *
	 * The form for opening a slot used to be here too, which put a mentor's own
	 * publishing control on the page that sells sessions to mentees. It lives
	 * in `MentorSlots.svelte`, under mentor management.
	 *
	 * ## Cancelling is not ending
	 *
	 * The server is explicit — `auto_renew: false`, `access_until_period_end:
	 * true`. Somebody who cancels has paid for the period and keeps it. A
	 * surface that rendered cancellation as "ended" would make them believe
	 * they threw away what they bought, and some of them would resubscribe to
	 * get back something they never lost.
	 *
	 * ## Usage needs both halves
	 *
	 * `used_this_month` and `included` come back together and are rendered
	 * together. "Three sessions used" means nothing without "of five", and the
	 * first number alone is the one that makes people ration something they
	 * have plenty of.
	 *
	 * ## Volunteer hours are here on purpose
	 *
	 * A platform that only counted paid sessions would make the people who help
	 * most look like the people who help least. Recording unpaid help is not a
	 * billing feature; it is what stops the record lying about who is generous.
	 */
	import { onMount } from 'svelte';
	import { HandHeart } from '@lucide/svelte';
	import { mentoringProductsApi } from '$api/mentoring_products';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	type Row = { id?: string; [key: string]: unknown };

	let subscriptions = $state<Row[]>([]);
	let programs = $state<Row[]>([]);
	let usage = $state<Record<string, { used_this_month: number; included: number }>>({});
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	/**
	 * Whether this block has anything to say at all.
	 *
	 * It used to print "no subscription and no programme yet" instead, which
	 * fails twice. It merges two unrelated facts: the subscriptions are the
	 * reader's own and need an account, the programme catalogue is public, and
	 * a signed-out visitor was being told they hold none of something they
	 * could not hold. And it printed that directly under a populated list of
	 * mentors, so the page announced emptiness while its actual offer sat just
	 * above.
	 *
	 * No programme is seeded today, so this is what everybody currently sees.
	 */
	let nothing = $derived(subscriptions.length === 0 && programs.length === 0);

	async function load() {
		loading = true;
		const [s, p] = await Promise.allSettled([
			mentoringProductsApi.mySubscriptions(),
			mentoringProductsApi.programs()
		]);
		if (s.status === 'fulfilled') subscriptions = (s.value.data?.subscriptions as Row[]) ?? [];
		if (p.status === 'fulfilled') programs = (p.value.data?.programs as Row[]) ?? [];

		// The usage of each subscription, so the pair of numbers can be shown.
		const results = await Promise.allSettled(
			subscriptions.filter((x) => x.id).map((x) => mentoringProductsApi.usage(x.id as string))
		);
		const next: typeof usage = {};
		subscriptions
			.filter((x) => x.id)
			.forEach((x, i) => {
				const r = results[i];
				if (r?.status === 'fulfilled' && r.value.data) {
					next[x.id as string] = r.value.data;
				}
			});
		usage = next;
		loading = false;
	}

	async function run(key: string, fn: () => Promise<unknown>, done: string) {
		if (busy[key]) return;
		busy = { ...busy, [key]: true };
		try {
			await fn();
			toast.success(done);
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [key]: false };
		}
	}

	onMount(load);
</script>

{#if !nothing || loading}
	<section class="space-y-6" data-testid="mentoring-products">
	{#if loading}
		<Skeleton class="h-32 w-full" rounded="xl" />
	{:else}
		{#if subscriptions.length > 0}
			<div class="space-y-3">
				<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
					<HandHeart size={14} />
					{i18n.t('mentoringProducts.subscriptionsTitle')}
				</h2>
				<ul class="space-y-2">
					{#each subscriptions as sub (sub.id)}
						{@const u = sub.id ? usage[sub.id as string] : undefined}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-center gap-3">
								<span class="text-sm font-medium text-text-primary">
									{String(sub.plan ?? sub.mentor_name ?? sub.id)}
								</span>
								<!-- Both numbers or neither. The first alone makes people
								     ration something they have plenty of. -->
								{#if u}
									<Badge size="sm">
										{i18n.t('mentoringProducts.usage', {
											used: u.used_this_month,
											included: u.included
										})}
									</Badge>
								{/if}
								<Button
									size="sm"
									variant="ghost"
									class="ml-auto"
									loading={busy[sub.id ?? '']}
									onclick={() =>
										sub.id &&
										run(
											sub.id as string,
											() => mentoringProductsApi.cancel(sub.id as string),
											i18n.t('mentoringProducts.cancelled')
										)}
									data-testid="cancel-subscription"
								>
									{i18n.t('mentoringProducts.cancelCta')}
								</Button>
							</div>
						</li>
					{/each}
				</ul>
				<!-- The sentence that stops somebody resubscribing to recover
				     something they never lost. -->
				<p class="text-xs text-text-muted">{i18n.t('mentoringProducts.cancelNote')}</p>
			</div>
		{/if}

		{#if programs.length > 0}
			<div class="space-y-3">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('mentoringProducts.programsTitle')}
				</h2>
				<ul class="space-y-2">
					{#each programs as p (p.id)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4 text-sm">
							{String(p.name ?? p.title ?? p.id)}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Nothing to show means nothing rendered. An empty catalogue does not
		     need to announce itself. -->
	{/if}
</section>
{/if}
