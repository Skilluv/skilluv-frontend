<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import Input from '$components/ui/Input.svelte';
	import CountrySelect from '$components/ui/CountrySelect.svelte';
	import CityAutocomplete from '$components/ui/CityAutocomplete.svelte';
	import SsoButton from '$components/ui/SsoButton.svelte';
	import { authApi, type RegisterRequest } from '$api/auth';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { enlist } from '$stores/enlist.svelte';
	import { checkPassword } from '$lib/utils/password';
	import PasswordRules from '$components/auth/PasswordRules.svelte';

	/**
	 * The pact — the only screen that asks for anything about you.
	 *
	 * ## Why the shortcuts are here and not at the entrance
	 *
	 * Google, LinkedIn and GitHub used to sit on the first screen, next to the
	 * domain grid, where they were a fourth decision on top of three others.
	 * Here they are what they actually are: a way to skip typing a form you are
	 * already looking at. The domain and the trades chosen upstream are held in
	 * the tab's session and survive the round trip.
	 *
	 * ## Why the trades are registered after the account
	 *
	 * `POST /users/me/orientations` needs a session, so the picks made two
	 * screens ago are replayed here, once the account exists. If one of them is
	 * refused, the account still stands and the person is told — losing a real
	 * account over a track that can be added later would be the wrong trade.
	 */

	const inviteToken = $derived(page.url.searchParams.get('invite_token') ?? '');
	function oauthHref(base: string): string {
		return inviteToken ? `${base}?invite_token=${encodeURIComponent(inviteToken)}` : base;
	}

	let username = $state('');
	let email = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let country = $state<string | null>(null);
	let city = $state<string | null>(null);
	let termsAccepted = $state(false);

	let loading = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	/**
	 * Whether the confirmation has been left once.
	 *
	 * The mismatch is not shown while the second field is being typed: every
	 * prefix of a correct password differs from it, so live checking would call
	 * somebody wrong for the first nine characters of nine right ones. It is
	 * raised on blur and cleared as soon as the two agree again — told once you
	 * have finished, and dropped the moment you fix it.
	 */
	let confirmTouched = $state(false);

	/** Shown under the confirmation, before anybody presses anything. */
	const confirmError = $derived(
		confirmTouched && passwordConfirm.length > 0 && passwordConfirm !== password
			? i18n.t('auth.password.mismatch')
			: (fieldErrors.passwordConfirm ?? '')
	);

	onMount(() => {
		enlist.restore();
		if (!enlist.domain) {
			void goto('/auth/register/domain', { replaceState: true });
		}
	});

	const domainName = $derived(
		enlist.domain ? i18n.t(`disciplines.${enlist.domain}.label`) : ''
	);

	function validate(): boolean {
		const errors: Record<string, string> = {};
		if (!username.trim()) errors.username = i18n.t('enlist.errors.username');
		if (!email.trim()) errors.email = i18n.t('enlist.errors.email');
		if (!firstName.trim()) errors.firstName = i18n.t('enlist.errors.firstName');
		if (!lastName.trim()) errors.lastName = i18n.t('enlist.errors.lastName');
		// The rule itself lives in `$lib/utils/password.ts`, mirroring the
		// backend's `validate_password`. Checked here so the answer is instant,
		// enforced there because that is the only place it counts.
		const verdict = checkPassword(password);
		if (verdict !== 'ok') {
			errors.password = i18n.t(`auth.password.${verdict}`);
		} else if (passwordConfirm !== password) {
			// Only once the password itself holds. Telling somebody the two do not
			// match while the first one is still being rejected gives them two
			// problems to read and one of them is not theirs yet.
			errors.passwordConfirm = i18n.t('auth.password.mismatch');
		}
		if (!country) errors.country = i18n.t('enlist.errors.country');
		if (!termsAccepted) errors.terms = i18n.t('enlist.errors.terms');
		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = '';

		if (!enlist.domain) {
			error = i18n.t('enlist.errors.noDomain');
			return;
		}
		if (!validate()) return;

		loading = true;
		try {
			const body: RegisterRequest = {
				email: email.trim(),
				username: username.trim(),
				password,
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				skill_domain: enlist.domain,
				country: country ?? undefined,
				city: city ?? undefined,
				terms_accepted: true
			};

			const res = await authApi.register(body);
			auth.setUser(res.data.user);

			const { failed } = await enlist.replay();
			enlist.clear();

			await goto(failed.length > 0 ? '/challenges/onboarding?trades=partial' : '/challenges/onboarding');
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('enlist.account.title')} | Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="pact">
	<header class="pact__head">
		<p class="pact__eyebrow">{i18n.t('enlist.account.eyebrow')}</p>
		<h1 class="pact__title">{i18n.t('enlist.account.title')}</h1>
		<p class="pact__lead">{i18n.t('enlist.account.lead')}</p>
	</header>

	<!-- What was chosen upstream, restated so nobody signs a pact whose terms
	     have scrolled off two screens ago. Both lines are editable in place. -->
	<dl class="pact__recap">
		<div>
			<dt>{i18n.t('enlist.account.domainLabel')}</dt>
			<dd>
				<span>{domainName}</span>
				<a href="/auth/register/domain?d={enlist.domain}">{i18n.t('enlist.account.changeDomain')}</a>
			</dd>
		</div>
		{#if enlist.picks.length > 0}
			<div>
				<dt>{i18n.t('enlist.account.tradesLabel')}</dt>
				<dd>
					<span>{enlist.picks.map((p) => p.name).join(' · ')}</span>
					<a href="/auth/register/path?d={enlist.domain}">{i18n.t('enlist.account.changeTrades')}</a>
				</dd>
			</div>
		{/if}
	</dl>

	{#if error}
		<p class="pact__error" role="alert">{error}</p>
	{/if}

	<form class="pact__form" onsubmit={handleSubmit}>
		<Input
			label={i18n.t('enlist.account.username')}
			placeholder={i18n.t('enlist.account.usernamePlaceholder')}
			bind:value={username}
			error={fieldErrors.username}
			autocomplete="username"
			required
		/>

		<Input
			label={i18n.t('enlist.account.email')}
			type="email"
			placeholder={i18n.t('enlist.account.emailPlaceholder')}
			bind:value={email}
			error={fieldErrors.email}
			autocomplete="email"
			required
		/>

		<div class="pact__pair">
			<Input
				label={i18n.t('enlist.account.firstName')}
				bind:value={firstName}
				error={fieldErrors.firstName}
				autocomplete="given-name"
				required
			/>
			<Input
				label={i18n.t('enlist.account.lastName')}
				bind:value={lastName}
				error={fieldErrors.lastName}
				autocomplete="family-name"
				required
			/>
		</div>

		<Input
			label={i18n.t('enlist.account.password')}
			type="password"
			hint={password ? undefined : i18n.t('auth.password.hint')}
			bind:value={password}
			error={fieldErrors.password}
			autocomplete="new-password"
			aria-describedby={fieldErrors.password ? undefined : 'pact-password-rules'}
			required
		/>
		<PasswordRules {password} id="pact-password-rules" />

		<!-- A typo in a password nobody can read costs the account: the person
		     lands on a login that refuses them and has no way to know why.
		     `new-password` on both, so a password manager offers to fill the
		     pair rather than treating the second as a login field. -->
		<Input
			label={i18n.t('auth.password.confirm')}
			type="password"
			bind:value={passwordConfirm}
			error={confirmError}
			autocomplete="new-password"
			onblur={() => (confirmTouched = true)}
			required
		/>

		<div class="pact__pair">
			<CountrySelect
				label={i18n.t('enlist.account.country')}
				bind:value={country}
				error={fieldErrors.country}
				required
			/>
			<CityAutocomplete
				label={i18n.t('enlist.account.city')}
				bind:value={city}
				{country}
				hint={i18n.t('enlist.account.cityHint')}
			/>
		</div>

		<label class="pact__terms">
			<input type="checkbox" bind:checked={termsAccepted} required />
			<span>
				{i18n.t('enlist.account.terms')}
				<a href="/legal/terms" target="_blank" rel="noopener">
					{i18n.t('enlist.account.termsLink')}
				</a>
				&
				<a href="/legal/privacy" target="_blank" rel="noopener">
					{i18n.t('enlist.account.privacyLink')}
				</a>.
			</span>
		</label>
		{#if fieldErrors.terms}
			<p class="pact__field-error">{fieldErrors.terms}</p>
		{/if}

		<button class="pact__submit" type="submit" disabled={loading} data-testid="enlist-submit">
			{loading ? i18n.t('enlist.account.submitting') : i18n.t('enlist.account.submit')}
		</button>
	</form>

	<div class="pact__divider">
		<span>{i18n.t('enlist.account.ssoDivider')}</span>
	</div>

	<!-- Each one records the departure before the browser goes. The trades chosen
	     upstream can only be posted once a session exists, and on this path the
	     session appears after a round trip through a provider, on whatever page
	     the callback lands on — so the root layout finishes the job there. -->
	<div class="pact__sso">
		<SsoButton
			provider="google"
			href={oauthHref('/api/auth/google/start')}
			onclick={() => enlist.leaveForSso()}
		/>
		<SsoButton
			provider="linkedin"
			href={oauthHref('/api/auth/linkedin/start')}
			onclick={() => enlist.leaveForSso()}
		/>
		<SsoButton
			provider="github"
			href={oauthHref('/api/auth/github/login')}
			onclick={() => enlist.leaveForSso()}
		/>
	</div>
	<p class="pact__sso-hint">{i18n.t('enlist.account.ssoHint')}</p>
</section>

<style>
	.pact {
		flex: 1;
		width: 100%;
		max-width: 34rem;
		margin: 0 auto;
		padding: 1rem clamp(1rem, 5vw, 2rem) 5rem;
	}

	.pact__eyebrow {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.28em;
		color: var(--sk-text-muted);
	}

	.pact__title {
		margin: 0.75rem 0 0;
		font-family: 'Fraunces Variable', Georgia, serif;
		font-variation-settings: 'opsz' 96, 'SOFT' 40, 'WONK' 1;
		font-weight: 700;
		font-size: clamp(2rem, 5vw, 3rem);
		line-height: 1.02;
		letter-spacing: -0.03em;
	}

	.pact__lead {
		margin: 0.75rem 0 0;
		color: var(--sk-text-muted);
		line-height: 1.55;
	}

	.pact__recap {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 1.75rem 0 0;
		padding: 1rem 1.125rem;
		border: 1px solid var(--sk-border);
		border-radius: 1rem;
		background-color: var(--sk-surface-elevated);
	}
	.pact__recap > div {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		font-size: 0.8125rem;
	}
	.pact__recap dt {
		flex-shrink: 0;
		width: 5rem;
		font-family: var(--font-mono);
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--sk-text-muted);
	}
	.pact__recap dd {
		display: flex;
		align-items: baseline;
		gap: 0.625rem;
		flex: 1;
		min-width: 0;
		margin: 0;
	}
	.pact__recap dd span {
		flex: 1;
		min-width: 0;
		font-weight: 600;
	}
	.pact__recap dd a {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: var(--sk-text-muted);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.pact__recap dd a:hover {
		color: var(--sk-accent);
	}

	.pact__error {
		margin: 1.25rem 0 0;
		padding: 0.75rem 1rem;
		border: 1px solid color-mix(in srgb, var(--sk-error) 35%, transparent);
		border-radius: 1rem;
		background-color: var(--sk-error-soft);
		font-size: 0.875rem;
		color: var(--sk-error);
	}

	.pact__form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.75rem;
	}

	.pact__pair {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.pact__terms {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--sk-text-muted);
	}
	.pact__terms input {
		margin-top: 0.2rem;
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		accent-color: var(--sk-accent);
	}
	.pact__terms a {
		color: var(--sk-accent);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.pact__field-error {
		margin: -0.5rem 0 0;
		font-size: 0.8125rem;
		color: var(--sk-error);
	}

	.pact__submit {
		height: 3.25rem;
		margin-top: 0.5rem;
		border-radius: 999px;
		background-color: var(--sk-accent);
		color: var(--sk-accent-fg);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		transition: background-color var(--sk-anim-fast) var(--sk-ease-standard);
	}
	.pact__submit:hover:not(:disabled) {
		background-color: var(--sk-accent-hover);
	}
	.pact__submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.pact__submit:focus-visible {
		outline: 2px solid var(--sk-text);
		outline-offset: 3px;
	}

	.pact__divider {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		margin: 2rem 0 1.25rem;
		font-family: var(--font-mono);
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: var(--sk-text-muted);
	}
	.pact__divider::before,
	.pact__divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background-color: var(--sk-border);
	}

	.pact__sso {
		display: grid;
		gap: 0.5rem;
	}

	.pact__sso-hint {
		margin: 0.875rem 0 0;
		text-align: center;
		font-size: 0.75rem;
		color: var(--sk-text-muted);
	}

	@media (max-width: 520px) {
		.pact__pair {
			grid-template-columns: 1fr;
		}
		.pact__recap > div {
			flex-direction: column;
			gap: 0.25rem;
		}
	}
</style>
