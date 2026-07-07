<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { mentorshipApi, type MyMentorProfile, type ConnectStatus } from '$api/mentorship';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let profile = $state<MyMentorProfile | null>(null);
	let connect = $state<ConnectStatus | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let onboarding = $state(false);

	// Form state
	let headline = $state('');
	let bio = $state('');
	let expertise = $state('');
	let languages = $state('');
	let rateEur = $state<number | ''>(50);
	let minSessionMin = $state<number>(30);
	let active = $state(true);

	async function load() {
		loading = true;
		try {
			const [p, c] = await Promise.all([
				mentorshipApi.getMyProfile().catch(() => null),
				mentorshipApi.connectStatus().catch(() => null)
			]);
			if (p) {
				profile = p.data.profile;
				if (profile) {
					headline = profile.headline;
					bio = profile.bio;
					expertise = profile.expertise_areas.join(', ');
					languages = profile.languages_spoken.join(', ');
					rateEur = Math.round(profile.hourly_rate_eur_cents / 100);
					minSessionMin = profile.min_session_minutes;
					active = profile.active;
				}
			}
			if (c) connect = c.data;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		if (!headline.trim() || !bio.trim() || typeof rateEur !== 'number') return;
		saving = true;
		try {
			await mentorshipApi.upsertMyProfile({
				headline: headline.trim(),
				bio: bio.trim(),
				expertise_areas: expertise.split(',').map((s) => s.trim()).filter(Boolean),
				languages_spoken: languages.split(',').map((s) => s.trim()).filter(Boolean),
				hourly_rate_eur_cents: rateEur * 100,
				min_session_minutes: minSessionMin,
				active
			});
			toast.success(i18n.locale === 'fr' ? 'Profil sauvegardé' : 'Profile saved');
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			saving = false;
		}
	}

	async function startOnboarding() {
		onboarding = true;
		try {
			const res = await mentorshipApi.startConnectOnboarding();
			window.location.href = res.data.onboarding_url;
		} catch (e) {
			onboarding = false;
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		}
	}

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login?redirect=/mentors/me');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Mon profil mentor — Skilluv' : 'My mentor profile — Skilluv'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10 sm:py-14">
	<div class="mb-10">
		<p class="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Mentorship</p>
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Devenir mentor.' : 'Become a mentor.'}
		</h1>
		<p class="mt-3 max-w-xl text-sm text-text-muted">
			{i18n.locale === 'fr'
				? 'Partage ton expertise. Skilluv prend 20 % ; tu touches 80 % via Stripe Connect Express.'
				: 'Share your expertise. Skilluv takes 20%; you get 80% via Stripe Connect Express.'}
		</p>
	</div>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-32 rounded bg-surface-elevated"></div>
			<div class="h-64 rounded bg-surface-elevated"></div>
		</div>
	{:else}
		<!-- Connect status -->
		<div class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6">
			<div class="mb-3 flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-lg text-accent">◈</div>
				<div class="flex-1">
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">Stripe Connect</p>
					<h3 class="text-base font-semibold">
						{i18n.locale === 'fr' ? 'Compte de paiement mentor' : 'Mentor payout account'}
					</h3>
				</div>
			</div>
			{#if connect?.onboarded && connect.payouts_enabled}
				<div class="flex items-center gap-2">
					<Badge variant="success" size="sm">✓ {i18n.locale === 'fr' ? 'Actif' : 'Active'}</Badge>
					<span class="text-sm text-text-muted">
						{i18n.locale === 'fr' ? 'Tu peux recevoir des paiements.' : 'You can receive payouts.'}
					</span>
				</div>
			{:else if connect?.onboarded}
				<div class="flex items-center gap-2">
					<Badge variant="warning" size="sm">⧗ {i18n.locale === 'fr' ? 'En vérification' : 'Under review'}</Badge>
					<span class="text-sm text-text-muted">
						{i18n.locale === 'fr' ? 'Stripe finalise la vérification.' : 'Stripe is completing verification.'}
					</span>
				</div>
			{:else}
				<p class="mb-4 text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Sans compte Connect, tu ne peux pas recevoir de paiements. L\'onboarding prend ~5 minutes.'
						: 'Without a Connect account you cannot receive payouts. Onboarding takes ~5 minutes.'}
				</p>
				<Button variant="accent" loading={onboarding} onclick={startOnboarding}>
					{i18n.locale === 'fr' ? 'Configurer Stripe Connect' : 'Set up Stripe Connect'}
				</Button>
			{/if}
		</div>

		<!-- Profile form -->
		<form onsubmit={save} class="space-y-5 rounded-2xl border border-border bg-surface-elevated p-6">
			<div>
				<label for="headline" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Headline (1 phrase percutante)' : 'Headline (1 punchy sentence)'}
				</label>
				<input
					id="headline"
					bind:value={headline}
					required
					maxlength="200"
					placeholder={i18n.locale === 'fr' ? 'Ex : Senior Rust engineer, 10 ans en systèmes distribués' : 'e.g. Senior Rust engineer, 10 years distributed systems'}
					class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
				/>
			</div>
			<div>
				<label for="bio" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Bio complète' : 'Full bio'}
				</label>
				<textarea
					id="bio"
					bind:value={bio}
					required
					rows="6"
					class="w-full rounded-2xl border border-border bg-surface-overlay px-4 py-3 text-sm focus:border-primary focus:outline-none"
				></textarea>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="rate" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Tarif €/h' : 'Rate €/h'}
					</label>
					<input
						id="rate"
						type="number"
						bind:value={rateEur}
						min="0"
						max="1000"
						required
						class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
					/>
				</div>
				<div>
					<label for="min" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Session min. (min)' : 'Min session (min)'}
					</label>
					<input
						id="min"
						type="number"
						bind:value={minSessionMin}
						min="15"
						max="240"
						class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
					/>
				</div>
			</div>
			<div>
				<label for="exp" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Expertise (virgules)' : 'Expertise (comma-separated)'}
				</label>
				<input
					id="exp"
					bind:value={expertise}
					placeholder="rust, distributed systems, tokio"
					class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
				/>
			</div>
			<div>
				<label for="lang" class="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.locale === 'fr' ? 'Langues parlées (virgules)' : 'Languages spoken (comma-separated)'}
				</label>
				<input
					id="lang"
					bind:value={languages}
					placeholder="fr, en"
					class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none"
				/>
			</div>
			<div class="flex items-center gap-2">
				<input id="active" type="checkbox" bind:checked={active} class="h-4 w-4 accent-primary" />
				<label for="active" class="text-sm">
					{i18n.locale === 'fr' ? 'Profil visible dans la liste publique' : 'Profile visible in public list'}
				</label>
			</div>
			<div class="flex justify-end">
				<Button variant="accent" loading={saving}>
					{i18n.locale === 'fr' ? 'Sauvegarder le profil' : 'Save profile'}
				</Button>
			</div>
		</form>
	{/if}
</div>
