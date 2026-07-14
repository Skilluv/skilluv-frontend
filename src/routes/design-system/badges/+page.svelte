<script lang="ts">
	import {
		Key,
		Keyring,
		SkillPatch,
		RankChevron,
		GuildCrest,
		ChallengeSeal,
		EventStamp,
		AwardMedal,
		type KeyType,
		type SkillCategory,
		type Rarity,
		type RankLevel
	} from '$lib/components/badges';

	const keyTypes: KeyType[] = ['circle', 'trefle', 'rosace', 'star', 'heart'];
	const categories: SkillCategory[] = ['craft', 'create', 'understand', 'operate', 'share', 'meta'];
	const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
	const rankLevels: RankLevel[] = [1, 2, 3, 4, 5];

	const catKeyMap: Record<SkillCategory, KeyType> = {
		craft: 'circle',
		create: 'rosace',
		understand: 'star',
		operate: 'trefle',
		share: 'heart',
		meta: 'trefle'
	};

	const catSample: Record<SkillCategory, string> = {
		craft: 'React',
		create: 'UI Design',
		understand: 'Data',
		operate: 'Docker',
		share: 'Mentor',
		meta: 'OSS'
	};
</script>

<svelte:head>
	<title>Design System · Badges — Skilluv</title>
</svelte:head>

<div class="ds-page">
	<header class="ds-header">
		<div class="ds-eyebrow">Design System · Playground interne</div>
		<h1 class="ds-title font-hero">Badges & Trousseau</h1>
		<p class="ds-lede">
			Toutes les variantes du système. Placeholder SVG pour les clés — remplacer par les
			assets Recraft finaux (voir <code>.working/prompt-recraft-vector.md</code>).
		</p>
	</header>

	<!-- SECTION 0a — Paliers de surface (démontrer la hiérarchie) -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">0. Paliers de surface — luminance claire</h2>
		<p class="ds-note">Chaque niveau doit se distinguer sans effort. Cards en top de pages, modals en top de cards.</p>
		<div class="ds-surface-ladder">
			<div class="ds-surface-box" style="background: var(--color-surface)">
				<span>surface</span><small>fond page</small>
			</div>
			<div class="ds-surface-box" style="background: var(--color-surface-alt)">
				<span>surface-alt</span><small>sections alternées</small>
			</div>
			<div class="ds-surface-box" style="background: var(--color-surface-elevated)">
				<span>surface-elevated</span><small>cards</small>
			</div>
			<div class="ds-surface-box" style="background: var(--color-surface-elevated-hover)">
				<span>elevated-hover</span><small>hover cards</small>
			</div>
			<div class="ds-surface-box" style="background: var(--color-surface-overlay)">
				<span>surface-overlay</span><small>modals · popovers</small>
			</div>
		</div>
	</section>

	<!-- SECTION 0b — Zones catégorielles (couleurs audacieuses) -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">0b. Surfaces catégorielles — zones chromatiques audacieuses</h2>
		<p class="ds-note">
			Persona × Melchior Leroux : marier des couleurs vives. Chaque zone du produit (challenges craft,
			guildes create, mentorship share…) peut porter sa propre ambiance chromatique.
		</p>
		<div class="ds-zone-grid">
			<article class="ds-zone" style="background: var(--color-surface-craft); border-color: var(--color-cat-craft)">
				<div class="ds-zone-tag" style="background: var(--color-cat-craft)">CRAFT</div>
				<h3 class="font-wonk">L'atelier des bâtisseurs</h3>
				<p>Ambre sombre. Zone dev, build, ship. Cards défis code.</p>
			</article>
			<article class="ds-zone" style="background: var(--color-surface-create); border-color: var(--color-cat-create)">
				<div class="ds-zone-tag" style="background: var(--color-cat-create)">CREATE</div>
				<h3 class="font-wonk">La forge créative</h3>
				<p>Rouge poppy. Zone design, motion, illustration. Cards challenges créatifs.</p>
			</article>
			<article class="ds-zone" style="background: var(--color-surface-understand); border-color: var(--color-cat-understand)">
				<div class="ds-zone-tag" style="background: var(--color-cat-understand)">UNDERSTAND</div>
				<h3 class="font-wonk">Le cabinet d'analyse</h3>
				<p>Bleu de Prusse. Zone data, ML, research. Dashboards, insights.</p>
			</article>
			<article class="ds-zone" style="background: var(--color-surface-operate); border-color: var(--color-cat-operate)">
				<div class="ds-zone-tag" style="background: var(--color-cat-operate)">OPERATE</div>
				<h3 class="font-wonk">La salle des machines</h3>
				<p>Sarcelle profonde. Zone devops, cloud, sécurité. Métriques, monitoring.</p>
			</article>
			<article class="ds-zone" style="background: var(--color-surface-share); border-color: var(--color-cat-share)">
				<div class="ds-zone-tag" style="background: var(--color-cat-share)">SHARE</div>
				<h3 class="font-wonk">Le foyer de la commu</h3>
				<p>Bordeaux rose. Zone mentorship, entraide, guilde. Cœurs, sessions.</p>
			</article>
			<article class="ds-zone" style="background: var(--color-surface-meta); border-color: var(--color-cat-meta)">
				<div class="ds-zone-tag" style="background: var(--color-cat-meta)">META</div>
				<h3 class="font-wonk">La table du stratège</h3>
				<p>Safran sombre. Zone product, growth, open source. Roadmap, initiatives.</p>
			</article>
		</div>
	</section>

	<!-- SECTION 1 — Les 5 clés canoniques -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">1. Les 5 clés canoniques</h2>
		<div class="ds-row">
			{#each keyTypes as k}
				<figure class="ds-keyfig">
					<Key type={k} size={80} />
					<figcaption>{k}</figcaption>
				</figure>
			{/each}
		</div>
	</section>

	<!-- SECTION 2 — Trousseau progression -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">2. Trousseau (0 → 5 clés)</h2>
		<div class="ds-row">
			<div class="ds-block">
				<Keyring keys={[]} size={160} />
				<div class="ds-caption">0 clés · empty state</div>
			</div>
			<div class="ds-block">
				<Keyring keys={['circle']} size={160} />
				<div class="ds-caption">1 clé — la Preuve</div>
			</div>
			<div class="ds-block">
				<Keyring keys={['circle', 'trefle', 'heart']} size={160} />
				<div class="ds-caption">3 clés</div>
			</div>
			<div class="ds-block">
				<Keyring keys={['circle', 'trefle', 'rosace', 'star', 'heart']} size={160} interactive />
				<div class="ds-caption">Full Skilluver · interactive (hover)</div>
			</div>
		</div>
	</section>

	<!-- SECTION 3 — Skill patches (grille 6 x 4) -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">3. Skill patches · 6 catégories × 4 raretés</h2>
		<div class="ds-grid">
			{#each categories as cat}
				<div class="ds-cat-column">
					<div class="ds-cat-label">{cat.toUpperCase()}</div>
					{#each rarities as rar}
						<SkillPatch
							skill={catSample[cat]}
							category={cat}
							keyType={catKeyMap[cat]}
							rarity={rar}
							size="md"
							subLabel={rar}
							interactive
						/>
					{/each}
				</div>
			{/each}
		</div>
	</section>

	<!-- SECTION 4 — Rank chevrons -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">4. Rank chevrons (5 rangs)</h2>
		<div class="ds-row">
			{#each rankLevels as lvl}
				<div class="ds-block">
					<RankChevron level={lvl} size="md" showLabel />
				</div>
			{/each}
		</div>
	</section>

	<!-- SECTION 5 — Guild crests -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">5. Guild crests</h2>
		<div class="ds-row">
			<GuildCrest guildName="Craft & Build" keys={['circle', 'trefle', 'rosace']} color="#c47a2e" memberCount={48} />
			<GuildCrest guildName="Red Team" keys={['star', 'heart', 'circle']} color="#a04520" memberCount={89} />
			<GuildCrest guildName="Open Garden" keys={['heart', 'rosace', 'trefle']} color="#2a9d8f" memberCount={156} />
			<GuildCrest guildName="Cotonou Guild" keys={['circle', 'star', 'heart']} color="#457b9d" memberCount={22} />
		</div>
	</section>

	<!-- SECTION 6 — Challenge seals -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">6. Challenge seals</h2>
		<div class="ds-row">
			<ChallengeSeal challengeId="042" date={new Date()} />
			<ChallengeSeal challengeId="128" date={new Date()} label="SHIPPED" />
			<ChallengeSeal challengeId="256" date={new Date()} impact />
			<ChallengeSeal challengeId="512" date={new Date()} size="hero" />
		</div>
	</section>

	<!-- SECTION 7 — Event stamps -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">7. Event stamps</h2>
		<div class="ds-row">
			<EventStamp eventName="SKILLUV FEST" year={2026} keyOverlay="star" color="#c47a2e" />
			<EventStamp eventName="HACKTOBER" year={2026} color="#a04520" />
			<EventStamp eventName="SAKURA" year={2026} color="#e8a5c1" keyOverlay="heart" />
			<EventStamp eventName="CAMP KIDS" year={2026} size="hero" color="#2a9d8f" />
		</div>
	</section>

	<!-- SECTION 8 — Award medals -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">8. Award medals</h2>
		<div class="ds-row">
			<AwardMedal variant="first-blood" label="First Blood" rarity="epic" awardedAt={new Date()} />
			<AwardMedal variant="centurion" label="Centurion" rarity="legendary" awardedAt={new Date()} />
			<AwardMedal variant="mentor-year" label="Mentor" rarity="legendary" awardedAt={new Date()} size="hero" />
		</div>
	</section>

	<!-- SECTION 9 — Wordmark -->
	<section class="ds-section">
		<h2 class="ds-section-title font-wonk">9. Wordmark & typography</h2>
		<div class="ds-typo">
			<div class="ds-wordmark wordmark">
				<span class="wordmark-skil">sKIL</span><span class="wordmark-luv">LUV</span>
			</div>
			<div class="ds-typo-stack">
				<h1 class="font-hero">Prouve ce que tu sais faire.</h1>
				<h2 class="font-wonk">Une baseline chaleureuse</h2>
				<p>
					Le body en <strong>Bricolage Grotesque</strong> — corps chaleureux, ligatures ludiques,
					plus warm que Space Grotesk sans sacrifier la lisibilité. <code>const skill = 'luv';</code>
				</p>
			</div>
		</div>
	</section>
</div>

<style>
	.ds-page {
		max-width: 1280px;
		margin: 0 auto;
		padding: 3rem 2rem 5rem;
		color: var(--color-text-primary);
	}
	.ds-header {
		margin-bottom: 4rem;
		border-bottom: 1px dashed var(--color-border);
		padding-bottom: 2rem;
	}
	.ds-eyebrow {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.15em;
		text-transform: uppercase;
		margin-bottom: 1rem;
	}
	.ds-title {
		font-size: var(--text-5xl);
		margin-bottom: 1rem;
	}
	.ds-lede {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		max-width: 60ch;
	}
	.ds-lede code {
		font-size: 0.875em;
		background: var(--color-surface-elevated);
		padding: 2px 6px;
		border-radius: 4px;
	}

	.ds-section {
		margin-bottom: 4rem;
	}
	.ds-section-title {
		font-size: var(--text-2xl);
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: var(--color-accent);
	}
	.ds-note {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		margin-bottom: 1.5rem;
		max-width: 70ch;
	}

	.ds-surface-ladder {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 12px;
	}
	.ds-surface-box {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 1.5rem 1rem;
		color: var(--color-text-primary);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.ds-surface-box span {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.1em;
	}
	.ds-surface-box small {
		color: var(--color-text-muted);
		font-size: 0.6875rem;
	}

	.ds-zone-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.25rem;
	}
	.ds-zone {
		border: 2px solid;
		border-radius: var(--radius-lg);
		padding: 1.75rem 1.5rem;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		box-shadow: var(--shadow-md);
	}
	.ds-zone-tag {
		display: inline-block;
		width: fit-content;
		padding: 4px 12px;
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-weight: 700;
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
		color: #fff;
	}
	.ds-zone h3 {
		font-size: var(--text-xl);
		color: var(--color-text-primary);
		margin: 0;
	}
	.ds-zone p {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0;
	}

	.ds-row {
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
		align-items: flex-start;
	}
	.ds-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}
	.ds-caption {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.ds-keyfig {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-accent);
	}
	.ds-keyfig figcaption {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.ds-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1.5rem;
	}
	.ds-cat-column {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}
	.ds-cat-label {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.15em;
		margin-bottom: 0.5rem;
	}

	.ds-typo {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 2rem;
		background: var(--color-surface-elevated);
		border-radius: 16px;
	}
	.ds-wordmark {
		font-size: 4rem;
		font-variation-settings: 'opsz' 144, 'SOFT' 50, 'WONK' 1;
	}
	.ds-typo-stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.ds-typo-stack h1 {
		font-size: var(--text-4xl);
	}
	.ds-typo-stack h2 {
		font-size: var(--text-2xl);
		color: var(--color-text-muted);
	}
	.ds-typo-stack code {
		font-family: var(--font-mono);
		background: var(--color-surface);
		padding: 2px 6px;
		border-radius: 4px;
	}
</style>
