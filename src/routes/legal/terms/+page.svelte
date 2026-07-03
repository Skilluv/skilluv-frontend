<script lang="ts">
	import { i18n } from '$lib/i18n';
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? "Conditions générales d'utilisation" : 'Terms of service'} — Skilluv</title>
	<meta name="robots" content="index, follow" />
</svelte:head>

{#if i18n.locale === 'fr'}
	<h1>Conditions générales d'utilisation</h1>
	<p class="lede">
		Les présentes conditions générales d'utilisation (« CGU ») régissent l'accès et l'utilisation
		de la plateforme Skilluv. En créant un compte ou en utilisant le service, vous reconnaissez en
		avoir pris connaissance et les accepter sans réserve.
	</p>

	<h2>1. Objet</h2>
	<p>
		Les CGU ont pour objet de définir les conditions dans lesquelles
		<span class="todo">[TODO : raison sociale]</span> (ci-après « l'Éditeur ») met à disposition la
		plateforme Skilluv (ci-après « le Service ») et celles dans lesquelles les utilisateurs
		(ci-après « l'Utilisateur ») y accèdent et l'utilisent.
	</p>

	<h2>2. Définitions</h2>
	<ul>
		<li><strong>Service&nbsp;:</strong> la plateforme web Skilluv et l'ensemble de ses fonctionnalités.</li>
		<li><strong>Utilisateur&nbsp;:</strong> toute personne physique ou morale qui accède au Service, qu'elle soit inscrite ou non.</li>
		<li><strong>Compte&nbsp;:</strong> espace personnel créé par l'Utilisateur après inscription.</li>
		<li><strong>Challenge&nbsp;:</strong> exercice technique proposé sur la plateforme dans l'un des domaines code, design, game ou security.</li>
		<li><strong>Contenu Utilisateur&nbsp;:</strong> tout contenu publié, transmis ou téléversé par l'Utilisateur (solutions, challenges communautaires, commentaires, messages, etc.).</li>
		<li><strong>Entreprise&nbsp;:</strong> Utilisateur disposant d'un compte « entreprise » pour rechercher des talents.</li>
	</ul>

	<h2>3. Acceptation et modification</h2>
	<p>
		L'inscription au Service implique l'acceptation pleine et entière des présentes CGU. L'Éditeur
		se réserve le droit de modifier les CGU à tout moment. Les Utilisateurs seront informés des
		modifications substantielles au moins 30&nbsp;jours avant leur entrée en vigueur. La poursuite
		de l'utilisation du Service vaut acceptation des CGU modifiées.
	</p>

	<h2>4. Accès au Service</h2>
	<p>
		Le Service est accessible 24&nbsp;heures sur 24 et 7&nbsp;jours sur 7, sous réserve d'opérations
		de maintenance, de mises à jour ou de cas de force majeure. L'Éditeur s'efforce d'assurer une
		disponibilité continue mais ne peut garantir un fonctionnement ininterrompu.
	</p>
	<p>
		L'accès à certaines fonctionnalités nécessite la création d'un Compte. L'Utilisateur s'engage à
		fournir des informations exactes et à les maintenir à jour.
	</p>

	<h2>5. Compte utilisateur</h2>
	<p>
		L'inscription est gratuite et ouverte à toute personne physique âgée d'au moins 15&nbsp;ans
		(ou de l'âge minimum prévu par la loi locale, par exemple 16&nbsp;ans dans certains pays de
		l'UE), ou avec autorisation du titulaire de l'autorité parentale.
	</p>
	<p>
		L'Utilisateur est seul responsable de la confidentialité de ses identifiants. Toute action
		réalisée depuis son Compte est réputée effectuée par lui. L'Utilisateur doit notifier
		immédiatement l'Éditeur en cas de suspicion d'usage frauduleux.
	</p>
	<p>
		L'Éditeur peut suspendre ou supprimer un Compte en cas de manquement aux CGU, de comportement
		frauduleux ou de violation des droits d'autrui.
	</p>

	<h2>6. Description du Service</h2>
	<p>Skilluv propose notamment&nbsp;:</p>
	<ul>
		<li>la résolution de challenges techniques individuels ou en équipe&nbsp;;</li>
		<li>la création de challenges communautaires, soumis à validation par la modération&nbsp;;</li>
		<li>un système de progression (fragments, badges, titres, streaks) et de classements&nbsp;;</li>
		<li>un espace entreprise permettant de rechercher des talents et de manifester un intérêt&nbsp;;</li>
		<li>une messagerie restreinte entre talents et entreprises après acceptation mutuelle.</li>
	</ul>

	<h2>7. Contenus utilisateurs</h2>
	<h3>7.1 Responsabilité</h3>
	<p>
		L'Utilisateur garantit qu'il dispose de l'ensemble des droits sur les Contenus qu'il publie et
		qu'ils ne portent pas atteinte aux droits de tiers. Il est seul responsable de ses Contenus.
	</p>
	<h3>7.2 Licence accordée à l'Éditeur</h3>
	<p>
		En publiant un Contenu sur le Service, l'Utilisateur concède à l'Éditeur une licence non
		exclusive, gratuite, mondiale et pour la durée de protection des droits, aux seules fins
		d'exploitation du Service&nbsp;: stockage, affichage, distribution, traduction, indexation,
		référencement et archivage technique. Cette licence n'opère aucun transfert de propriété.
	</p>
	<h3>7.3 Contenus interdits</h3>
	<p>Sont notamment interdits&nbsp;:</p>
	<ul>
		<li>les contenus illicites, diffamatoires, injurieux, racistes, haineux, sexistes, violents ou pornographiques&nbsp;;</li>
		<li>les contenus portant atteinte aux droits de propriété intellectuelle d'autrui&nbsp;;</li>
		<li>les contenus contenant des virus, scripts malveillants ou techniques de contournement&nbsp;;</li>
		<li>la collecte non autorisée de données personnelles d'autres utilisateurs&nbsp;;</li>
		<li>l'usurpation d'identité&nbsp;;</li>
		<li>le spam, la publicité non sollicitée et toute activité commerciale non autorisée.</li>
	</ul>

	<h2>8. Propriété intellectuelle de l'Éditeur</h2>
	<p>
		La plateforme, son code source, sa charte graphique, ses textes officiels, sa base de
		challenges (hors challenges communautaires) et tous les éléments la composant sont protégés et
		demeurent la propriété exclusive de l'Éditeur. Toute exploitation non autorisée est
		strictement interdite.
	</p>

	<h2>9. Conduite et modération</h2>
	<p>
		L'Utilisateur s'engage à un usage loyal du Service. Toute tentative de triche, d'exploitation
		de faille, d'automatisation non autorisée ou de contournement des limitations techniques peut
		entraîner&nbsp;: avertissement, suppression de contenus, suspension temporaire, bannissement
		définitif et invalidation des classements obtenus.
	</p>
	<p>
		Tout Utilisateur peut signaler un contenu ou un comportement inapproprié via les outils
		intégrés. L'Éditeur peut retirer, modifier ou modérer tout Contenu contraire aux CGU ou à la
		loi, et collaborer avec les autorités compétentes le cas échéant.
	</p>

	<h2>10. Responsabilités</h2>
	<p>
		L'Éditeur met en œuvre les meilleurs efforts pour offrir un Service fonctionnel, sûr et
		conforme. Il ne saurait être tenu responsable&nbsp;:
	</p>
	<ul>
		<li>des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le Service&nbsp;;</li>
		<li>des interruptions temporaires liées à la maintenance, à des incidents techniques ou à un cas de force majeure&nbsp;;</li>
		<li>des Contenus publiés par les Utilisateurs&nbsp;;</li>
		<li>des conséquences d'un usage non conforme aux CGU.</li>
	</ul>
	<p>
		Aucune disposition des présentes CGU n'a pour objet d'exclure ou de limiter la responsabilité
		de l'Éditeur dans les cas où la loi l'interdit, notamment en cas de faute lourde ou
		intentionnelle, d'atteinte à la vie ou à l'intégrité corporelle.
	</p>

	<h2>11. Données personnelles</h2>
	<p>
		Le traitement des données personnelles est décrit dans notre
		<a href="/legal/privacy">Politique de confidentialité</a> et l'exercice de vos droits sur la
		<a href="/legal/gdpr">page RGPD</a>.
	</p>

	<h2>12. Liens et services tiers</h2>
	<p>
		Le Service peut intégrer des liens vers des sites tiers (GitHub, etc.). Ces sites sont régis
		par leurs propres conditions. L'Éditeur n'exerce aucun contrôle sur leurs contenus et décline
		toute responsabilité à leur égard.
	</p>

	<h2>13. Résiliation</h2>
	<p>
		L'Utilisateur peut supprimer son Compte à tout moment depuis ses paramètres. L'Éditeur peut
		résilier de plein droit, sans préavis ni indemnité, en cas de manquement grave de l'Utilisateur
		ou pour des motifs légitimes. Les sections relatives à la propriété intellectuelle, à la
		responsabilité, à la protection des données et à la loi applicable survivent à la résiliation.
	</p>

	<h2>14. Force majeure</h2>
	<p>
		L'Éditeur ne pourra être tenu responsable d'une inexécution résultant d'un cas de force
		majeure tel que défini par la jurisprudence en vigueur.
	</p>

	<h2>15. Droit applicable et juridiction</h2>
	<p>
		Les présentes CGU sont régies par le droit
		<span class="todo">[TODO : droit français / droit béninois — à arbitrer selon l'entité]</span>.
		Tout litige sera, à défaut d'accord amiable, soumis à la juridiction compétente du ressort du
		siège social de l'Éditeur, sous réserve des règles impératives protectrices du consommateur le
		cas échéant.
	</p>

	<h2>16. Médiation de la consommation</h2>
	<p>
		Conformément aux articles L.&nbsp;612-1 et suivants du Code de la consommation français, les
		Utilisateurs consommateurs résidant en France peuvent recourir gratuitement à un médiateur de
		la consommation&nbsp;: <span class="todo">[TODO : médiateur désigné]</span>. Les Utilisateurs
		résidant dans l'UE peuvent également utiliser la plateforme européenne de règlement en ligne
		des litiges&nbsp;: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr</a>.
	</p>

	<h2>17. Nullité partielle</h2>
	<p>
		Si une ou plusieurs stipulations des présentes CGU sont tenues pour non valides ou déclarées
		telles en application d'une loi, d'un règlement ou d'une décision définitive, les autres
		stipulations garderont leur force et leur portée.
	</p>

	<div class="callout">
		<strong>Note&nbsp;:</strong> ces CGU constituent un modèle. Elles doivent être adaptées au
		modèle économique précis, aux pays ciblés et relues par un professionnel du droit avant
		publication.
	</div>
{:else}
	<h1>Terms of service</h1>
	<p class="lede">
		These terms of service ("Terms") govern access to and use of the Skilluv platform. By creating
		an account or using the service, you acknowledge that you have read and unreservedly accept
		these Terms.
	</p>

	<h2>1. Purpose</h2>
	<p>
		These Terms define the conditions under which <span class="todo">[TODO: legal name]</span>
		(hereinafter "the Publisher") makes the Skilluv platform (hereinafter "the Service") available
		and the conditions under which users (hereinafter "the User") access and use it.
	</p>

	<h2>2. Definitions</h2>
	<ul>
		<li><strong>Service:</strong> the Skilluv web platform and all of its features.</li>
		<li><strong>User:</strong> any natural or legal person accessing the Service, whether registered or not.</li>
		<li><strong>Account:</strong> personal space created by the User upon registration.</li>
		<li><strong>Challenge:</strong> technical exercise offered on the platform in code, design, game or security domains.</li>
		<li><strong>User Content:</strong> any content published, transmitted or uploaded by the User (solutions, community challenges, comments, messages, etc.).</li>
		<li><strong>Company:</strong> User with an "enterprise" account searching for talents.</li>
	</ul>

	<h2>3. Acceptance and changes</h2>
	<p>
		Registration to the Service implies full and unreserved acceptance of these Terms. The
		Publisher may amend the Terms at any time. Users will be informed of material changes at least
		30 days before they take effect. Continued use of the Service constitutes acceptance of the
		amended Terms.
	</p>

	<h2>4. Access to the Service</h2>
	<p>
		The Service is available 24/7, subject to maintenance, updates or force-majeure events. The
		Publisher makes its best efforts to ensure continuous availability but cannot guarantee
		uninterrupted operation.
	</p>
	<p>
		Access to some features requires an Account. The User undertakes to provide accurate
		information and keep it up to date.
	</p>

	<h2>5. User account</h2>
	<p>
		Registration is free and open to any individual aged at least 15 (or the minimum age set by
		local law, e.g. 16 in some EU countries), or with the consent of their parental authority
		holder.
	</p>
	<p>
		The User is solely responsible for the confidentiality of their credentials. Any action from
		their Account is deemed performed by them. The User must immediately notify the Publisher in
		case of suspected fraudulent use.
	</p>
	<p>
		The Publisher may suspend or delete an Account for breach of these Terms, fraudulent behaviour
		or infringement of third-party rights.
	</p>

	<h2>6. Description of the Service</h2>
	<p>Skilluv notably offers:</p>
	<ul>
		<li>solving individual or team technical challenges;</li>
		<li>creating community challenges, subject to moderation approval;</li>
		<li>a progression system (fragments, badges, titles, streaks) and leaderboards;</li>
		<li>an enterprise area to search for talents and express interest;</li>
		<li>a restricted messaging system between talents and companies upon mutual acceptance.</li>
	</ul>

	<h2>7. User content</h2>
	<h3>7.1 Responsibility</h3>
	<p>
		The User warrants that they hold all rights over the Content they publish and that it does not
		infringe third-party rights. They are solely responsible for their Content.
	</p>
	<h3>7.2 Licence granted to the Publisher</h3>
	<p>
		By publishing Content on the Service, the User grants the Publisher a non-exclusive,
		royalty-free, worldwide licence, for the duration of the rights, for the sole purpose of
		operating the Service: storage, display, distribution, translation, indexing, referencing and
		technical archiving. This licence does not transfer ownership.
	</p>
	<h3>7.3 Prohibited content</h3>
	<p>The following are prohibited:</p>
	<ul>
		<li>unlawful, defamatory, insulting, racist, hateful, sexist, violent or pornographic content;</li>
		<li>content infringing third-party intellectual-property rights;</li>
		<li>content containing viruses, malicious scripts or circumvention techniques;</li>
		<li>unauthorised collection of other users' personal data;</li>
		<li>impersonation;</li>
		<li>spam, unsolicited advertising and any unauthorised commercial activity.</li>
	</ul>

	<h2>8. Publisher's intellectual property</h2>
	<p>
		The platform, its source code, its visual identity, its official texts, its challenge database
		(excluding community challenges) and all its components are protected and remain the exclusive
		property of the Publisher. Any unauthorised exploitation is strictly prohibited.
	</p>

	<h2>9. Conduct and moderation</h2>
	<p>
		The User undertakes to use the Service in good faith. Any attempt at cheating, exploiting a
		flaw, unauthorised automation or circumventing technical limitations may result in warning,
		removal of content, temporary suspension, permanent ban and invalidation of obtained rankings.
	</p>
	<p>
		Any User may report inappropriate content or behaviour via the built-in tools. The Publisher
		may remove, modify or moderate any Content that breaches the Terms or the law, and cooperate
		with the competent authorities where applicable.
	</p>

	<h2>10. Liability</h2>
	<p>The Publisher uses best efforts to provide a functional, secure and compliant Service. It cannot be held liable for:</p>
	<ul>
		<li>indirect damages resulting from the use or inability to use the Service;</li>
		<li>temporary interruptions due to maintenance, technical incidents or force majeure;</li>
		<li>Content published by Users;</li>
		<li>consequences of use that does not comply with these Terms.</li>
	</ul>
	<p>
		Nothing in these Terms excludes or limits the Publisher's liability in cases where the law
		prohibits it, including gross or intentional misconduct, or harm to life or bodily integrity.
	</p>

	<h2>11. Personal data</h2>
	<p>
		Processing of personal data is described in our
		<a href="/legal/privacy">Privacy Policy</a> and rights are detailed on the
		<a href="/legal/gdpr">GDPR page</a>.
	</p>

	<h2>12. Third-party links and services</h2>
	<p>
		The Service may embed links to third-party sites (GitHub, etc.). These sites are governed by
		their own terms. The Publisher has no control over their content and disclaims any related
		liability.
	</p>

	<h2>13. Termination</h2>
	<p>
		The User may delete their Account at any time from settings. The Publisher may terminate
		without notice or compensation in case of serious breach by the User or for legitimate reasons.
		Sections on intellectual property, liability, data protection and applicable law survive
		termination.
	</p>

	<h2>14. Force majeure</h2>
	<p>
		The Publisher shall not be held liable for non-performance resulting from a force-majeure event
		as defined by applicable case law.
	</p>

	<h2>15. Governing law and jurisdiction</h2>
	<p>
		These Terms are governed by
		<span class="todo">[TODO: French law / Beninese law — to confirm per entity]</span>. Any dispute
		shall, failing amicable settlement, be submitted to the competent court of the registered
		office of the Publisher, subject to mandatory consumer-protection rules where applicable.
	</p>

	<h2>16. Consumer mediation</h2>
	<p>
		Pursuant to Articles L.&nbsp;612-1 et seq. of the French Consumer Code, consumer Users residing
		in France may use a consumer mediator free of charge:
		<span class="todo">[TODO: designated mediator]</span>. EU-resident Users may also use the EU
		online dispute resolution platform:
		<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr</a>.
	</p>

	<h2>17. Severability</h2>
	<p>
		If one or more provisions of these Terms are held invalid by virtue of a statute, regulation or
		final court decision, the other provisions remain in full force and effect.
	</p>

	<div class="callout">
		<strong>Note:</strong> these Terms are a template. They must be adapted to the precise business
		model, target countries, and reviewed by a qualified legal professional before publication.
	</div>
{/if}
