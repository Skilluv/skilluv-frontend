<script lang="ts">
	let { children } = $props();
	import { i18n } from '$lib/i18n';
	import BrandLogo from '$components/layout/BrandLogo.svelte';
</script>

<!-- Auth layout : bare mais avec identité Skilluv forte + ambiance CRAFT
     (auth = premier acte de forge : tu te crées un compte, tu poses tes fondations).
     Le trousseau posé en haut ancre la marque et rappelle le vocabulaire clés. -->
<div class="auth-shell">
	<div class="auth-shell__bg" aria-hidden="true"></div>

	<div class="auth-shell__inner">
		<!--
			The real mark, not the stand-in.

			This carried the hand-drawn keyring and the CSS wordmark that the
			navbar shed when the official artwork arrived — so sign-in and
			sign-up, the first page anyone sees and the one that asks for a
			password, were the last places still showing a placeholder. The
			enterprise funnel had been branded for a while; the candidate one
			never was.

			Putting it in the layout covers all eight auth pages at once, which
			is why it belongs here rather than on login and register.
		-->
		<a href="/" class="auth-brand" aria-label="Skilluv accueil">
			<BrandLogo size={44} />
		</a>

		<!-- Content card -->
		<div class="auth-card">
			{@render children()}
		</div>

		<!-- Baseline scout — ancre la promesse -->
		<p class="auth-baseline">
			{i18n.locale === 'fr'
				? 'Prouve ce que tu sais faire. Ensemble.'
				: 'Prove what you can do. Together.'}
		</p>

		<p class="auth-footer">
			{i18n.t('auth.footer', { year: new Date().getFullYear() })}
		</p>
	</div>
</div>

<style>
	.auth-shell {
		position: relative;
		min-height: 100vh;
		background-color: var(--sk-surface);
		color: var(--sk-text);
		overflow: hidden;
	}

	/* Ambiance craft — gradient ocre discret en fond, comme la lueur d'une forge */
	.auth-shell__bg {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 60% 40% at 50% 0%, var(--sk-surface-craft) 0%, transparent 60%),
			radial-gradient(ellipse 40% 30% at 20% 100%, var(--sk-surface-share) 0%, transparent 55%),
			radial-gradient(ellipse 40% 30% at 80% 100%, var(--sk-surface-understand) 0%, transparent 55%);
		opacity: 0.7;
		pointer-events: none;
	}

	.auth-shell__inner {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 3rem 1rem;
		gap: 2rem;
	}

	.auth-brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--sk-accent);
		transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.auth-brand:hover {
		transform: translateY(-2px);
	}

	.auth-card {
		width: 100%;
		max-width: 460px;
		padding: 2.5rem 2rem;
		background-color: var(--sk-surface-elevated);
		border: 1px solid var(--sk-border);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		backdrop-filter: blur(8px);
	}

	/* Impose la typo Fraunces sur les titres des pages auth
	   (évite d'éditer chaque login/register/etc individuellement) */
	.auth-card :global(h1),
	.auth-card :global(h2) {
		font-family: 'Fraunces Variable', Georgia, serif;
		font-variation-settings: 'opsz' 48, 'SOFT' 40, 'WONK' 0.5;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}
	.auth-card :global(h1) {
		font-size: clamp(1.5rem, 1.35rem + 0.5vw, 1.75rem);
		font-weight: 700;
	}

	.auth-baseline {
		max-width: 460px;
		text-align: center;
		font-family: 'Fraunces Variable', Georgia, serif;
		font-variation-settings: 'opsz' 48, 'SOFT' 40, 'WONK' 0.6;
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--sk-text-muted);
		font-style: italic;
	}

	.auth-footer {
		font-size: 0.75rem;
		color: var(--sk-text-muted);
		text-align: center;
	}

	/* Un peu plus d'air sur écran moyen+ */
	@media (min-width: 640px) {
		.auth-card {
			padding: 3rem 2.5rem;
		}
	}
</style>
