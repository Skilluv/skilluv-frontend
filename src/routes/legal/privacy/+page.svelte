<script lang="ts">
	import { i18n } from '$lib/i18n';
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Politique de confidentialité' : 'Privacy policy'} — Skilluv</title>
	<meta name="robots" content="index, follow" />
</svelte:head>

{#if i18n.locale === 'fr'}
	<h1>Politique de confidentialité</h1>
	<p class="lede">
		La présente politique décrit comment Skilluv collecte, utilise, partage et protège vos données
		à caractère personnel, conformément au Règlement (UE) 2016/679 (« RGPD »), à la loi française
		« Informatique et Libertés » modifiée, à la loi béninoise n°&nbsp;2017-20 du 20 avril 2018 portant
		Code du numérique, et aux autres lois applicables.
	</p>

	<h2>1. Responsable du traitement</h2>
	<p>
		Le responsable du traitement est <span class="todo">[TODO : raison sociale]</span>, dont les
		coordonnées sont précisées dans les <a href="/legal/mentions">mentions légales</a>.
	</p>
	<p>
		Délégué à la protection des données (DPO) ou point de contact protection des données&nbsp;:
		<span class="todo">[TODO : dpo@skilluv.… ou nom du DPO]</span>.
	</p>

	<h2>2. Données collectées</h2>
	<p>Nous collectons les catégories de données suivantes&nbsp;:</p>
	<h3>2.1 Données que vous nous fournissez</h3>
	<ul>
		<li><strong>Compte&nbsp;:</strong> nom d'utilisateur, prénom, nom, adresse e-mail, mot de passe (haché), domaine d'intérêt (code, design, game, security).</li>
		<li><strong>Profil&nbsp;:</strong> bio, avatar, liens externes (GitHub, LinkedIn, X, site personnel), préférences de visibilité.</li>
		<li><strong>Contenus&nbsp;:</strong> solutions soumises, challenges créés, commentaires, votes, messages adressés à d'autres utilisateurs ou aux entreprises.</li>
		<li><strong>Communications&nbsp;:</strong> e-mails que vous nous envoyez, signalements, réponses au support.</li>
		<li><strong>Compte entreprise</strong> (le cas échéant)&nbsp;: raison sociale, taille, secteur, pays, listes de talents et bookmarks.</li>
	</ul>
	<h3>2.2 Données collectées automatiquement</h3>
	<ul>
		<li><strong>Données techniques&nbsp;:</strong> adresse IP, identifiant de session, type de navigateur et d'appareil, système d'exploitation, langue.</li>
		<li><strong>Données d'usage&nbsp;:</strong> pages consultées, challenges démarrés, soumissions, temps passé, séries (streaks), fragments gagnés, badges.</li>
		<li><strong>Journaux serveur&nbsp;:</strong> requêtes HTTP, codes de statut, horodatages, à des fins de sécurité et de diagnostic.</li>
		<li><strong>Cookies et traceurs&nbsp;:</strong> voir section&nbsp;9.</li>
	</ul>

	<h2>3. Finalités et bases légales</h2>
	<p>Nous traitons vos données pour les finalités suivantes&nbsp;:</p>
	<ul>
		<li><strong>Fourniture du service</strong> (création de compte, authentification, accès aux challenges, suivi de progression) — base&nbsp;: exécution du contrat (art. 6.1.b RGPD).</li>
		<li><strong>Fonctionnalités sociales et communautaires</strong> (classements, profils publics, contenus communautaires) — base&nbsp;: exécution du contrat et, le cas échéant, votre consentement (paramètres de visibilité).</li>
		<li><strong>Mise en relation talents&nbsp;/&nbsp;entreprises</strong> — base&nbsp;: votre consentement explicite via le paramètre « autoriser les manifestations d'intérêt ».</li>
		<li><strong>Sécurité, prévention de la fraude et modération</strong> — base&nbsp;: intérêt légitime (art. 6.1.f) et obligation légale.</li>
		<li><strong>Amélioration du service et statistiques agrégées</strong> — base&nbsp;: intérêt légitime.</li>
		<li><strong>Communications transactionnelles</strong> (e-mails de vérification, réinitialisation de mot de passe, notifications de compte) — base&nbsp;: exécution du contrat.</li>
		<li><strong>Communications marketing</strong> — base&nbsp;: votre consentement, révocable à tout moment.</li>
		<li><strong>Respect des obligations légales</strong> (conservation comptable, réponses aux autorités) — base&nbsp;: obligation légale.</li>
	</ul>

	<h2>4. Durées de conservation</h2>
	<ul>
		<li><strong>Compte actif&nbsp;:</strong> données conservées tant que votre compte existe.</li>
		<li><strong>Compte supprimé&nbsp;:</strong> suppression ou anonymisation sous 30&nbsp;jours, sauf obligations légales (par exemple journaux de connexion conservés jusqu'à 12&nbsp;mois conformément aux dispositions applicables).</li>
		<li><strong>Contenus publics</strong> (challenges communautaires approuvés, solutions classantes)&nbsp;: peuvent être conservés sous forme anonymisée pour la cohérence des classements.</li>
		<li><strong>Journaux serveur&nbsp;:</strong> 12&nbsp;mois maximum.</li>
		<li><strong>Cookies&nbsp;:</strong> 13&nbsp;mois maximum (recommandation CNIL).</li>
		<li><strong>Données comptables et factures&nbsp;:</strong> 10&nbsp;ans (obligation légale).</li>
	</ul>

	<h2>5. Destinataires et sous-traitants</h2>
	<p>
		Vos données sont accessibles uniquement aux personnels habilités de l'éditeur et à ses
		sous-traitants techniques, dans le cadre strict de leurs missions. Nous recourons notamment
		à&nbsp;:
	</p>
	<ul>
		<li><strong>Hébergement&nbsp;:</strong> <span class="todo">[TODO : fournisseur, pays]</span></li>
		<li><strong>E-mails transactionnels&nbsp;:</strong> <span class="todo">[TODO : fournisseur]</span></li>
		<li><strong>Analyse / mesure d'audience&nbsp;:</strong> <span class="todo">[TODO si applicable]</span></li>
		<li><strong>Stockage de fichiers&nbsp;:</strong> <span class="todo">[TODO si applicable]</span></li>
	</ul>
	<p>
		Chaque sous-traitant est lié par un contrat conforme à l'article 28 du RGPD. Nous ne vendons
		pas vos données personnelles.
	</p>

	<h2>6. Transferts hors UE</h2>
	<p>
		Certains sous-traitants peuvent être situés en dehors de l'Espace économique européen. Dans ce
		cas, le transfert est encadré par&nbsp;:
	</p>
	<ul>
		<li>une décision d'adéquation de la Commission européenne, ou</li>
		<li>les clauses contractuelles types (CCT) approuvées par la Commission, ou</li>
		<li>tout autre mécanisme prévu par les articles&nbsp;44 et suivants du RGPD.</li>
	</ul>
	<p>
		Pour les utilisateurs résidant au Bénin, les transferts hors du territoire respectent
		l'article&nbsp;391 et suivants de la loi n°&nbsp;2017-20 portant Code du numérique en
		République du Bénin.
	</p>

	<h2>7. Sécurité</h2>
	<p>
		Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
		vos données&nbsp;: chiffrement TLS des communications, hachage des mots de passe (bcrypt ou
		équivalent), contrôle d'accès, journalisation, sauvegardes régulières, authentification à deux
		facteurs disponible pour les utilisateurs.
	</p>
	<p>
		En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés,
		nous notifierons l'autorité compétente sous 72&nbsp;heures et, le cas échéant, les personnes
		concernées dans les meilleurs délais.
	</p>

	<h2>8. Vos droits</h2>
	<p>
		Conformément au RGPD et aux lois applicables, vous disposez de droits sur vos données&nbsp;:
		accès, rectification, effacement, limitation, opposition, portabilité, retrait du consentement
		et directives post-mortem. Le détail et la procédure d'exercice sont décrits sur notre
		<a href="/legal/gdpr">page dédiée aux droits RGPD</a>.
	</p>

	<h2>9. Cookies et traceurs</h2>
	<p>
		Skilluv utilise un nombre minimal de cookies, strictement nécessaires au fonctionnement&nbsp;:
	</p>
	<ul>
		<li><strong>Cookies de session</strong> (authentification, jeton CSRF) — exemptés de consentement.</li>
		<li><strong>Préférences utilisateur</strong> (thème, langue, mode terminal) — stockés en <code>localStorage</code>, exemptés de consentement car strictement nécessaires à un service que vous demandez.</li>
		<li><strong>Mesure d'audience anonymisée</strong> — <span class="todo">[TODO : préciser ou supprimer si non utilisée]</span>.</li>
	</ul>
	<p>
		Vous pouvez paramétrer votre navigateur pour refuser les cookies. Le refus des cookies
		strictement nécessaires peut empêcher le fonctionnement du service.
	</p>

	<h2>10. Mineurs</h2>
	<p>
		Skilluv n'est pas destiné aux personnes de moins de 15&nbsp;ans (16&nbsp;ans dans certains
		pays de l'UE). Si vous êtes mineur, le consentement de votre titulaire de l'autorité parentale
		est requis pour ouvrir un compte.
	</p>

	<h2>11. Résidents de Californie (CCPA / CPRA)</h2>
	<p>
		Si vous résidez en Californie, vous disposez de droits supplémentaires&nbsp;: droit de savoir,
		droit de suppression, droit de correction, droit de refuser la vente ou le partage de vos
		données personnelles, droit à la non-discrimination. <strong>Nous ne vendons pas vos données
		personnelles</strong> au sens de la loi californienne.
	</p>

	<h2>12. Modifications</h2>
	<p>
		Cette politique peut être mise à jour à tout moment. La date de dernière mise à jour figure
		dans la barre latérale. En cas de modification substantielle, nous vous en informerons par
		notification dans l'application ou par e-mail.
	</p>

	<h2>13. Contact</h2>
	<p>
		Pour toute question relative à vos données personnelles, écrivez à
		<span class="todo">[TODO : dpo@skilluv.…]</span> ou par voie postale à l'adresse du siège social
		(voir <a href="/legal/mentions">mentions légales</a>).
	</p>

	<div class="callout">
		<strong>Note&nbsp;:</strong> ce document est un modèle. Il doit être relu et complété par un
		professionnel du droit avant publication officielle, notamment pour préciser les sous-traitants,
		les durées exactes et les éventuels traitements spécifiques.
	</div>
{:else}
	<h1>Privacy policy</h1>
	<p class="lede">
		This policy describes how Skilluv collects, uses, shares and protects your personal data,
		pursuant to Regulation (EU) 2016/679 ("GDPR"), the French Data Protection Act, Beninese Act
		No.&nbsp;2017-20 of 20 April 2018 (Digital Code), and other applicable laws.
	</p>

	<h2>1. Data controller</h2>
	<p>
		The data controller is <span class="todo">[TODO: legal name]</span>, whose details are listed
		in the <a href="/legal/mentions">legal notice</a>.
	</p>
	<p>
		Data protection officer (DPO) or data-protection contact:
		<span class="todo">[TODO: dpo@skilluv.… or DPO name]</span>.
	</p>

	<h2>2. Data we collect</h2>
	<h3>2.1 Data you provide</h3>
	<ul>
		<li><strong>Account:</strong> username, first name, last name, email, hashed password, domain of interest (code, design, game, security).</li>
		<li><strong>Profile:</strong> bio, avatar, external links (GitHub, LinkedIn, X, personal site), visibility preferences.</li>
		<li><strong>Content:</strong> submitted solutions, created challenges, comments, votes, messages sent to other users or companies.</li>
		<li><strong>Communications:</strong> emails you send us, abuse reports, support replies.</li>
		<li><strong>Enterprise account</strong> (if applicable): company name, size, industry, country, talent lists and bookmarks.</li>
	</ul>
	<h3>2.2 Data collected automatically</h3>
	<ul>
		<li><strong>Technical data:</strong> IP address, session ID, browser and device type, OS, language.</li>
		<li><strong>Usage data:</strong> pages viewed, challenges started, submissions, time spent, streaks, fragments earned, badges.</li>
		<li><strong>Server logs:</strong> HTTP requests, status codes, timestamps, for security and diagnostics.</li>
		<li><strong>Cookies and trackers:</strong> see section 9.</li>
	</ul>

	<h2>3. Purposes and legal bases</h2>
	<ul>
		<li><strong>Provision of the service</strong> (account creation, authentication, access to challenges, progress tracking) — basis: performance of the contract (Art. 6(1)(b) GDPR).</li>
		<li><strong>Social and community features</strong> (leaderboards, public profiles, community content) — basis: contract and, where applicable, your consent (visibility settings).</li>
		<li><strong>Connecting talents and companies</strong> — basis: your explicit consent via the "allow expressions of interest" setting.</li>
		<li><strong>Security, fraud prevention and moderation</strong> — basis: legitimate interest (Art. 6(1)(f)) and legal obligation.</li>
		<li><strong>Service improvement and aggregated statistics</strong> — basis: legitimate interest.</li>
		<li><strong>Transactional communications</strong> (email verification, password reset, account notifications) — basis: contract.</li>
		<li><strong>Marketing communications</strong> — basis: your consent, withdrawable at any time.</li>
		<li><strong>Compliance with legal obligations</strong> (accounting records, responses to authorities) — basis: legal obligation.</li>
	</ul>

	<h2>4. Retention periods</h2>
	<ul>
		<li><strong>Active account:</strong> kept as long as your account exists.</li>
		<li><strong>Deleted account:</strong> deletion or anonymisation within 30 days, subject to legal obligations (e.g. connection logs kept for up to 12 months).</li>
		<li><strong>Public content</strong> (approved community challenges, ranking solutions): may be retained anonymously for leaderboard consistency.</li>
		<li><strong>Server logs:</strong> 12 months max.</li>
		<li><strong>Cookies:</strong> 13 months max (CNIL recommendation).</li>
		<li><strong>Accounting records and invoices:</strong> 10 years (legal obligation).</li>
	</ul>

	<h2>5. Recipients and processors</h2>
	<p>Your data is only accessible to authorised personnel and to technical sub-processors, strictly within their mission. We notably use:</p>
	<ul>
		<li><strong>Hosting:</strong> <span class="todo">[TODO: provider, country]</span></li>
		<li><strong>Transactional email:</strong> <span class="todo">[TODO: provider]</span></li>
		<li><strong>Analytics:</strong> <span class="todo">[TODO if applicable]</span></li>
		<li><strong>File storage:</strong> <span class="todo">[TODO if applicable]</span></li>
	</ul>
	<p>Each processor is bound by a contract compliant with Article 28 GDPR. We do not sell your personal data.</p>

	<h2>6. Transfers outside the EU</h2>
	<p>Some processors may be located outside the European Economic Area. In that case, the transfer is governed by:</p>
	<ul>
		<li>an adequacy decision of the European Commission, or</li>
		<li>Standard Contractual Clauses (SCCs) adopted by the Commission, or</li>
		<li>any other mechanism under Articles 44 et seq. GDPR.</li>
	</ul>
	<p>
		For users residing in Benin, cross-border transfers comply with Articles 391 et seq. of Act
		No.&nbsp;2017-20 (Beninese Digital Code).
	</p>

	<h2>7. Security</h2>
	<p>
		We implement appropriate technical and organisational measures: TLS-encrypted communications,
		password hashing (bcrypt or equivalent), access control, logging, regular backups, two-factor
		authentication available to users.
	</p>
	<p>
		In the event of a personal data breach likely to result in a risk to your rights and freedoms,
		we will notify the competent authority within 72 hours and, where applicable, affected
		individuals without undue delay.
	</p>

	<h2>8. Your rights</h2>
	<p>
		Under the GDPR and applicable laws, you have rights over your data: access, rectification,
		erasure, restriction, objection, portability, withdrawal of consent, and post-mortem
		directives. Details and the exercise procedure are on our
		<a href="/legal/gdpr">GDPR rights page</a>.
	</p>

	<h2>9. Cookies and trackers</h2>
	<p>Skilluv uses a minimal set of strictly necessary cookies:</p>
	<ul>
		<li><strong>Session cookies</strong> (authentication, CSRF token) — exempt from consent.</li>
		<li><strong>User preferences</strong> (theme, language, terminal mode) — stored in <code>localStorage</code>, exempt from consent as strictly necessary to a service you requested.</li>
		<li><strong>Anonymised analytics</strong> — <span class="todo">[TODO: specify or remove if unused]</span>.</li>
	</ul>
	<p>
		You may configure your browser to refuse cookies. Refusing strictly necessary cookies may
		prevent the service from working.
	</p>

	<h2>10. Minors</h2>
	<p>
		Skilluv is not intended for persons under 15 (16 in some EU countries). If you are a minor,
		consent from your parental authority holder is required to open an account.
	</p>

	<h2>11. California residents (CCPA / CPRA)</h2>
	<p>
		California residents have additional rights: right to know, delete, correct, opt out of sale or
		sharing of personal information, and to non-discrimination. <strong>We do not sell your personal
		information</strong> within the meaning of California law.
	</p>

	<h2>12. Changes</h2>
	<p>
		This policy may be updated at any time. The last-updated date appears in the sidebar. For
		material changes, we will notify you via the app or by email.
	</p>

	<h2>13. Contact</h2>
	<p>
		For any question regarding your personal data, write to
		<span class="todo">[TODO: dpo@skilluv.…]</span> or by mail at the registered office address (see
		<a href="/legal/mentions">legal notice</a>).
	</p>

	<div class="callout">
		<strong>Note:</strong> this document is a template. It must be reviewed and completed by a
		qualified legal professional before official publication, especially regarding processors,
		exact retention periods and any specific processing.
	</div>
{/if}
