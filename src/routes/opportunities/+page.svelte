<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';

	let ctaHref = $derived(auth.isAuthenticated ? '/challenges' : '/auth/register');
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Opportunités — Skilluv' : 'Opportunities — Skilluv'}</title>
	<meta name="description" content={i18n.locale === 'fr'
		? 'Sur Skilluv, tu ne fais pas que résoudre des défis. Bounties OSS, certifications, mentorship — construis ta preuve.'
		: 'On Skilluv, you don\'t just solve challenges. OSS bounties, certifications, mentorship — build your proof.'} />
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden border-b border-border">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 -top-20 h-[100vh] opacity-[0.04]"
		style="background-image: linear-gradient(var(--sk-text) 1px, transparent 1px), linear-gradient(90deg, var(--sk-text) 1px, transparent 1px); background-size: 60px 60px; mask-image: linear-gradient(to bottom, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);"
	></div>
	<div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
		<p class="mb-4 text-xs font-bold uppercase tracking-widest text-accent">
			{i18n.locale === 'fr' ? 'Au-delà des challenges' : 'Beyond challenges'}
		</p>
		<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
			{#if i18n.locale === 'fr'}
				Trois manières<br />
				<span class="text-primary">de faire tes preuves.</span>
			{:else}
				Three ways<br />
				<span class="text-primary">to prove yourself.</span>
			{/if}
		</h1>
		<p class="mt-8 max-w-2xl text-lg text-text-muted">
			{i18n.locale === 'fr'
				? "Sur Skilluv, tu ne joues pas juste. Tu gagnes des fragments en résolvant des issues open-source. Tu prouves ta maîtrise avec des certifications vérifiables. Tu apprends de mentors expérimentés."
				: 'On Skilluv, you don\'t just play. You earn fragments solving open-source issues. You prove mastery with verifiable certifications. You learn from experienced mentors.'}
		</p>
	</div>
</section>

<!-- 3 grands piliers -->
<section class="mx-auto max-w-6xl px-4 py-20 sm:py-24">
	<div class="grid gap-6 md:grid-cols-3">
		<!-- Bounties -->
		<article class="flex flex-col rounded-2xl border border-border bg-surface-elevated p-8 relative overflow-hidden">
			<div aria-hidden="true" class="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl"></div>
			<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary">⬢</div>
			<h2 class="mb-3 text-2xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Bounties OSS' : 'OSS Bounties'}
			</h2>
			<p class="mb-4 flex-1 text-sm leading-relaxed text-text-muted">
				{i18n.locale === 'fr'
					? "Des entreprises postent des bounties sur leurs issues GitHub. Tu revendiques, tu ouvres une PR, elle est mergée : les crédits séquestrés deviennent tes fragments."
					: 'Companies post bounties on their GitHub issues. You claim, open a PR, it gets merged: escrowed credits become your fragments.'}
			</p>
			<div class="mb-4 space-y-2 text-sm">
				<div class="flex items-center gap-2">
					<span class="text-success">✓</span>
					<span>{i18n.locale === 'fr' ? 'Rémunération à la PR mergée' : 'Paid on merged PR'}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-success">✓</span>
					<span>{i18n.locale === 'fr' ? 'Fragments + bonus perseverance' : 'Fragments + perseverance bonus'}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-success">✓</span>
					<span>{i18n.locale === 'fr' ? '7 jours pour ouvrir la PR' : '7 days to open PR'}</span>
				</div>
			</div>
			<Button variant="accent" href="/bounties">
				{i18n.locale === 'fr' ? 'Voir les bounties' : 'See bounties'}
			</Button>
		</article>

		<!-- Certifications -->
		<article class="flex flex-col rounded-2xl border border-accent/40 bg-surface-elevated p-8 relative overflow-hidden">
			<div class="absolute -top-3 left-6">
				<Badge variant="accent" size="md">★ {i18n.locale === 'fr' ? 'Recommandé' : 'Recommended'}</Badge>
			</div>
			<div aria-hidden="true" class="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent/10 blur-2xl"></div>
			<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-2xl text-accent">◈</div>
			<h2 class="mb-3 text-2xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Certifications' : 'Certifications'}
			</h2>
			<p class="mb-4 flex-1 text-sm leading-relaxed text-text-muted">
				{i18n.locale === 'fr'
					? 'Passe une suite de challenges chronométrés dans ton domaine. Obtiens un diplôme signé Skilluv avec un code de vérification publique. Score recalculé serveur, zéro tricherie.'
					: 'Take a series of timed challenges in your domain. Get a Skilluv-signed diploma with a public verification code. Score recalculated server-side, no cheating.'}
			</p>
			<div class="mb-4 space-y-2 text-sm">
				<div class="flex items-center gap-2">
					<span class="text-success">✓</span>
					<span>{i18n.locale === 'fr' ? 'Diplôme PDF téléchargeable' : 'Downloadable PDF diploma'}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-success">✓</span>
					<span>{i18n.locale === 'fr' ? 'Vérification publique par code' : 'Public code verification'}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-success">✓</span>
					<span>{i18n.locale === 'fr' ? 'Reconnu par les recruteurs' : 'Recognized by recruiters'}</span>
				</div>
			</div>
			<Button variant="accent" href="/certifications">
				{i18n.locale === 'fr' ? 'Voir les certifications' : 'See certifications'}
			</Button>
		</article>

		<!-- Mentorship -->
		<article class="flex flex-col rounded-2xl border border-border bg-surface-elevated p-8 relative overflow-hidden">
			<div aria-hidden="true" class="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl"></div>
			<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary">★</div>
			<h2 class="mb-3 text-2xl font-black tracking-tight">
				{i18n.locale === 'fr' ? 'Mentorship' : 'Mentorship'}
			</h2>
			<p class="mb-4 flex-1 text-sm leading-relaxed text-text-muted">
				{i18n.locale === 'fr'
					? "Réserve une session 1-on-1 avec un mentor Skilluv. Code review, prépa entretien, coaching carrière. Ou deviens mentor toi-même — 80% te reviennent."
					: 'Book a 1-on-1 session with a Skilluv mentor. Code review, interview prep, career coaching. Or become a mentor yourself — 80% is yours.'}
			</p>
			<div class="mb-4 space-y-2 text-sm">
				<div class="flex items-center gap-2">
					<span class="text-success">✓</span>
					<span>{i18n.locale === 'fr' ? 'Refund automatique 100%/50%' : 'Automatic 100%/50% refund'}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-success">✓</span>
					<span>{i18n.locale === 'fr' ? 'Mentors vérifiés Stripe Connect' : 'Stripe Connect verified mentors'}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-success">✓</span>
					<span>{i18n.locale === 'fr' ? 'Reviews uniquement post-session' : 'Reviews only post-session'}</span>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<Button variant="primary" href="/mentors">
					{i18n.locale === 'fr' ? 'Trouver un mentor' : 'Find a mentor'}
				</Button>
				<Button variant="ghost" href="/mentors/me">
					{i18n.locale === 'fr' ? 'Devenir mentor →' : 'Become a mentor →'}
				</Button>
			</div>
		</article>
	</div>
</section>

<!-- Comment ça marche pour un talent -->
<section class="border-t border-border bg-surface-elevated/40 py-20 sm:py-24">
	<div class="mx-auto max-w-6xl px-4">
		<h2 class="mb-12 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Ton parcours,' : 'Your journey,'}<br />
			<span class="text-accent">{i18n.locale === 'fr' ? 'ta preuve.' : 'your proof.'}</span>
		</h2>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#each [
				{ n: '01', fr: { t: 'Crée ton compte', d: 'Choisis ton domaine principal. Complète ton premier challenge onboarding.' }, en: { t: 'Create account', d: 'Pick your main domain. Complete your first onboarding challenge.' } },
				{ n: '02', fr: { t: 'Résous des challenges', d: 'Gagne des fragments. Fais grimper ton titre : Apprenti → Artisan → Maître → Légende.' }, en: { t: 'Solve challenges', d: 'Earn fragments. Level up: Apprentice → Artisan → Master → Legend.' } },
				{ n: '03', fr: { t: 'Prouve tes compétences', d: 'Passe une certification. Résous une bounty OSS. Prends un mentor si besoin.' }, en: { t: 'Prove your skills', d: 'Take a certification. Solve an OSS bounty. Get a mentor if needed.' } },
				{ n: '04', fr: { t: 'Sois recruté·e', d: 'Les entreprises te trouvent via tes preuves, pas ton CV. Recruteurs vérifient tes diplômes en 1 clic.' }, en: { t: 'Get hired', d: 'Companies find you via your proof, not your resume. Recruiters verify your diplomas in 1 click.' } }
			] as step}
				{@const t = i18n.locale === 'fr' ? step.fr : step.en}
				<div class="rounded-2xl border border-border bg-surface-elevated p-6">
					<div class="mb-3 text-4xl font-black text-primary">{step.n}</div>
					<h3 class="mb-2 text-base font-semibold">{t.t}</h3>
					<p class="text-sm leading-relaxed text-text-muted">{t.d}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA -->
<section class="mx-auto max-w-4xl px-4 py-24 text-center">
	<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
		{#if i18n.locale === 'fr'}
			Prêt à<br /><span class="text-primary">construire ta preuve ?</span>
		{:else}
			Ready to<br /><span class="text-primary">build your proof?</span>
		{/if}
	</h2>
	<p class="mx-auto mt-6 max-w-lg text-lg text-text-muted">
		{i18n.locale === 'fr'
			? 'Créer un compte prend 2 minutes. Aucune carte requise.'
			: 'Create an account in 2 minutes. No card required.'}
	</p>
	<div class="mt-8 flex justify-center gap-3">
		<Button variant="accent" size="lg" href={ctaHref}>
			{auth.isAuthenticated
				? (i18n.locale === 'fr' ? 'Voir les challenges' : 'See challenges')
				: (i18n.locale === 'fr' ? 'Créer mon compte' : 'Create my account')}
		</Button>
		<Button variant="ghost" size="lg" href="/leaderboards">
			{i18n.locale === 'fr' ? 'Voir les classements' : 'See leaderboards'}
		</Button>
	</div>
</section>
