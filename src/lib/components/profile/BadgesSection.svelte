<script lang="ts">
	// SKI-104 — Section "Badges Skilluv" sur la page profil.
	// Affiche le badge personnel de l'utilisateur (SVG) + snippets Markdown/HTML
	// a coller dans un README, un CV ou LinkedIn. Si `ownedProjects` est fourni
	// et que le viewer est le proprietaire du profil, affiche aussi les badges
	// des repos qu'il maintient.
	import { attestationApi } from '$api/attestation';
	import { toast } from '$stores/toast.svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import { Copy } from '@lucide/svelte';

	interface OwnedProject {
		slug: string;
		github_repo_owner: string;
		github_repo_name: string;
		name: string;
	}

	interface Props {
		username: string;
		isOwner?: boolean;
		ownedProjects?: OwnedProject[];
	}

	let { username, isOwner = false, ownedProjects }: Props = $props();

	// Base publique (deep-link stable pour les snippets a coller ailleurs).
	const BASE = 'https://skill-uv.com';

	let badgeUserSrc = $derived(attestationApi.badgeUserUrl(username));
	let badgeUserFailed = $state(false);

	let userMarkdown = $derived(
		`[![Skilluv](${BASE}/badge/user/${username}/validated.svg)](${BASE}/profile/${username})`
	);
	let userHtml = $derived(
		`<a href="${BASE}/profile/${username}"><img src="${BASE}/badge/user/${username}/validated.svg" alt="Skilluv" /></a>`
	);

	function repoMarkdown(owner: string, name: string): string {
		return `[![Skilluv](${BASE}/badge/repo/${owner}/${name}/validated.svg)](${BASE}/for-maintainers)`;
	}
	function repoHtml(owner: string, name: string): string {
		return `<a href="${BASE}/for-maintainers"><img src="${BASE}/badge/repo/${owner}/${name}/validated.svg" alt="Skilluv" /></a>`;
	}

	async function copyToClipboard(text: string): Promise<boolean> {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			try {
				const ta = document.createElement('textarea');
				ta.value = text;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				const ok = document.execCommand('copy');
				document.body.removeChild(ta);
				return ok;
			} catch {
				return false;
			}
		}
	}

	async function handleCopy(text: string) {
		const ok = await copyToClipboard(text);
		if (ok) toast.success(i18n.t('p26.badges.copyToastSuccess'));
		else toast.error(i18n.t('p26.badges.copyToastError'));
	}
</script>

<section
	class="rounded-xl border border-border bg-surface-elevated overflow-hidden"
	data-testid="profile-badges-section"
	aria-label={i18n.t('p26.badges.ariaLabel')}
>
	<div class="px-5 py-3 border-b border-border">
		<span class="text-xs font-bold uppercase tracking-wider text-text-muted">{i18n.t('p26.badges.sectionLabel')}</span>
	</div>

	<div class="p-5 space-y-6">
		<!-- Section 1 : badge personnel -->
		<div>
			<h2 class="font-heading text-lg font-semibold mb-1">{i18n.t('p26.badges.personalTitle')}</h2>
			<p class="text-xs text-text-muted mb-4">
				{i18n.t('p26.badges.personalDesc')}
			</p>

			<div class="mb-4 flex items-center justify-center rounded-lg border border-border bg-surface-overlay p-4">
				{#if badgeUserFailed}
					<span class="text-xs text-text-muted">{i18n.t('p26.badges.notGenerated')}</span>
				{:else}
					<img
						src={badgeUserSrc}
						alt={i18n.t('p26.badges.personalAlt', { username })}
						class="h-8"
						onerror={() => (badgeUserFailed = true)}
					/>
				{/if}
			</div>

			<!-- Markdown snippet -->
			<div class="mb-3">
				<div class="flex items-center justify-between mb-1">
					<span class="text-xs font-semibold uppercase tracking-wider text-text-muted">{i18n.t('p26.badges.markdownLabel')}</span>
					<Button variant="ghost" size="sm" onclick={() => handleCopy(userMarkdown)}>
						<Copy size={12} strokeWidth={2} />
						{i18n.t('p26.badges.copyBtn')}
					</Button>
				</div>
				<pre class="bg-surface-overlay rounded-xl p-3 overflow-x-auto text-xs"><code>{userMarkdown}</code></pre>
			</div>

			<!-- HTML snippet -->
			<div>
				<div class="flex items-center justify-between mb-1">
					<span class="text-xs font-semibold uppercase tracking-wider text-text-muted">{i18n.t('p26.badges.htmlLabel')}</span>
					<Button variant="ghost" size="sm" onclick={() => handleCopy(userHtml)}>
						<Copy size={12} strokeWidth={2} />
						{i18n.t('p26.badges.copyBtn')}
					</Button>
				</div>
				<pre class="bg-surface-overlay rounded-xl p-3 overflow-x-auto text-xs"><code>{userHtml}</code></pre>
			</div>
		</div>

		<!-- Section 2 : badges des repos maintenus (owner uniquement) -->
		{#if isOwner && ownedProjects && ownedProjects.length > 0}
			<div class="pt-6 border-t border-border">
				<h2 class="font-heading text-lg font-semibold mb-1">{i18n.t('p26.badges.reposTitle')}</h2>
				<p class="text-xs text-text-muted mb-4">
					{i18n.t('p26.badges.reposDesc')}
				</p>

				<div class="space-y-6">
					{#each ownedProjects as project (project.slug)}
						{@const md = repoMarkdown(project.github_repo_owner, project.github_repo_name)}
						{@const html = repoHtml(project.github_repo_owner, project.github_repo_name)}
						<div>
							<h3 class="text-sm font-semibold mb-2">
								{project.name}
								<span class="text-text-muted font-mono font-normal">
									— {project.github_repo_owner}/{project.github_repo_name}
								</span>
							</h3>

							<div class="mb-3 flex items-center justify-center rounded-lg border border-border bg-surface-overlay p-4">
								<img
									src={attestationApi.badgeRepoUrl(project.github_repo_owner, project.github_repo_name)}
									alt={i18n.t('p26.badges.repoBadgeAlt', { repo: `${project.github_repo_owner}/${project.github_repo_name}` })}
									class="h-8"
								/>
							</div>

							<div class="mb-3">
								<div class="flex items-center justify-between mb-1">
									<span class="text-xs font-semibold uppercase tracking-wider text-text-muted">{i18n.t('p26.badges.markdownLabel')}</span>
									<Button variant="ghost" size="sm" onclick={() => handleCopy(md)}>
										<Copy size={12} strokeWidth={2} />
										{i18n.t('p26.badges.copyBtn')}
									</Button>
								</div>
								<pre class="bg-surface-overlay rounded-xl p-3 overflow-x-auto text-xs"><code>{md}</code></pre>
							</div>

							<div>
								<div class="flex items-center justify-between mb-1">
									<span class="text-xs font-semibold uppercase tracking-wider text-text-muted">{i18n.t('p26.badges.htmlLabel')}</span>
									<Button variant="ghost" size="sm" onclick={() => handleCopy(html)}>
										<Copy size={12} strokeWidth={2} />
										{i18n.t('p26.badges.copyBtn')}
									</Button>
								</div>
								<pre class="bg-surface-overlay rounded-xl p-3 overflow-x-auto text-xs"><code>{html}</code></pre>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</section>
