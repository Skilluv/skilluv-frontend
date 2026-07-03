<script lang="ts">
	import { i18n } from '$lib/i18n';
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Vos droits — RGPD' : 'Your rights — GDPR'} — Skilluv</title>
	<meta name="robots" content="index, follow" />
</svelte:head>

{#if i18n.locale === 'fr'}
	<h1>Vos droits — RGPD</h1>
	<p class="lede">
		Cette page détaille les droits dont vous disposez sur vos données à caractère personnel et la
		procédure pour les exercer auprès de Skilluv. Elle complète notre
		<a href="/legal/privacy">Politique de confidentialité</a>.
	</p>

	<h2>1. Cadre légal</h2>
	<p>Vos droits sont garantis notamment par&nbsp;:</p>
	<ul>
		<li>le <strong>Règlement général sur la protection des données</strong> (UE) 2016/679 (« RGPD ») pour les résidents de l'Union européenne&nbsp;;</li>
		<li>la <strong>loi française n°&nbsp;78-17</strong> du 6 janvier 1978 modifiée (Informatique et Libertés)&nbsp;;</li>
		<li>la <strong>loi n°&nbsp;2017-20 du 20 avril 2018</strong> portant Code du numérique en République du Bénin (articles relatifs à la protection des données à caractère personnel)&nbsp;;</li>
		<li>les lois locales équivalentes dans les autres pays d'Afrique et hors UE (Convention de Malabo, lois nationales).</li>
	</ul>

	<h2>2. Vos droits en détail</h2>

	<h3>2.1 Droit d'accès <small>(art. 15 RGPD)</small></h3>
	<p>
		Vous pouvez obtenir la confirmation que vos données sont traitées et en recevoir une copie,
		ainsi que les informations sur les finalités, les catégories, les destinataires, les durées de
		conservation, etc.
	</p>

	<h3>2.2 Droit de rectification <small>(art. 16)</small></h3>
	<p>
		Vous pouvez demander la correction de données inexactes ou le complément de données
		incomplètes. La plupart des informations de profil peuvent être modifiées directement depuis
		vos <a href="/settings">paramètres</a>.
	</p>

	<h3>2.3 Droit à l'effacement <small>(art. 17 — « droit à l'oubli »)</small></h3>
	<p>
		Vous pouvez demander la suppression de vos données, sous réserve des cas où nous devons les
		conserver (obligation légale, défense en justice, etc.). La suppression de votre Compte
		entraîne la suppression ou l'anonymisation de vos données sous 30&nbsp;jours.
	</p>

	<h3>2.4 Droit à la limitation du traitement <small>(art. 18)</small></h3>
	<p>
		Dans certains cas (contestation de l'exactitude, opposition en cours, etc.), vous pouvez
		demander que le traitement de vos données soit limité, c'est-à-dire conservées sans être
		utilisées.
	</p>

	<h3>2.5 Droit à la portabilité <small>(art. 20)</small></h3>
	<p>
		Pour les données traitées sur la base de votre consentement ou de l'exécution d'un contrat et
		par moyens automatisés, vous pouvez recevoir vos données dans un format structuré, couramment
		utilisé et lisible par machine, ou demander leur transmission directe à un autre responsable
		de traitement lorsque c'est techniquement possible.
	</p>

	<h3>2.6 Droit d'opposition <small>(art. 21)</small></h3>
	<p>
		Vous pouvez vous opposer à tout moment, pour des raisons tenant à votre situation particulière,
		à un traitement fondé sur l'intérêt légitime. Vous pouvez en particulier vous opposer sans motif
		à un traitement à des fins de prospection.
	</p>

	<h3>2.7 Retrait du consentement <small>(art. 7.3)</small></h3>
	<p>
		Lorsque le traitement repose sur votre consentement (par exemple, communications marketing,
		paramètre « autoriser les manifestations d'intérêt »), vous pouvez retirer celui-ci à tout
		moment. Le retrait ne remet pas en cause la licéité du traitement antérieur.
	</p>

	<h3>2.8 Directives post-mortem <small>(loi n°&nbsp;78-17, art. 85)</small></h3>
	<p>
		Vous pouvez définir des directives relatives au sort de vos données après votre décès
		(conservation, effacement, communication à un tiers).
	</p>

	<h3>2.9 Droit de ne pas faire l'objet d'une décision automatisée <small>(art. 22)</small></h3>
	<p>
		Vous avez le droit de ne pas faire l'objet d'une décision fondée exclusivement sur un
		traitement automatisé produisant des effets juridiques ou vous affectant de manière
		significative. Skilluv ne met pas en œuvre, à ce jour, de telles décisions.
	</p>

	<h2>3. Comment exercer vos droits</h2>
	<p>Pour exercer l'un de ces droits, vous pouvez&nbsp;:</p>
	<ol>
		<li>utiliser les outils en libre-service de vos <a href="/settings">paramètres de compte</a> (édition du profil, suppression du compte, paramètres de visibilité)&nbsp;;</li>
		<li>nous écrire par e-mail à <span class="todo">[TODO : dpo@skilluv.…]</span> avec pour objet « Exercice de droits RGPD »&nbsp;;</li>
		<li>nous écrire par courrier à l'adresse du siège social (voir <a href="/legal/mentions">mentions légales</a>).</li>
	</ol>

	<h3>3.1 Justification d'identité</h3>
	<p>
		En cas de doute raisonnable sur votre identité, nous pouvons vous demander un justificatif
		complémentaire. Cette information n'est utilisée que pour traiter votre demande.
	</p>

	<h3>3.2 Délai de réponse</h3>
	<p>
		Nous répondons dans un délai d'un mois à compter de la réception de votre demande. Ce délai
		peut être prolongé de deux mois, compte tenu de la complexité ou du nombre de demandes&nbsp;;
		nous vous en informerons alors avec les motifs du report.
	</p>

	<h3>3.3 Gratuité</h3>
	<p>
		L'exercice de vos droits est gratuit. En cas de demande manifestement infondée ou excessive
		(notamment en raison de son caractère répétitif), nous pourrons exiger des frais raisonnables
		ou refuser de donner suite, en justifiant notre décision.
	</p>

	<h2>4. Réclamation auprès d'une autorité de contrôle</h2>
	<p>
		Si, après nous avoir contactés, vous estimez que vos droits ne sont pas respectés, vous avez
		le droit d'introduire une réclamation auprès de l'autorité de protection des données
		compétente&nbsp;:
	</p>
	<ul>
		<li><strong>France&nbsp;:</strong> CNIL — 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — <a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a></li>
		<li><strong>Bénin&nbsp;:</strong> APDP — Autorité de Protection des Données à caractère Personnel — <a href="https://apdp.bj" target="_blank" rel="noopener">apdp.bj</a></li>
		<li><strong>Union européenne&nbsp;:</strong> autorité de contrôle de votre État de résidence (liste sur <a href="https://edpb.europa.eu/about-edpb/board/members_fr" target="_blank" rel="noopener">edpb.europa.eu</a>)</li>
		<li><strong>Autres pays&nbsp;:</strong> autorité nationale compétente le cas échéant.</li>
	</ul>

	<h2>5. Délégué à la protection des données (DPO)</h2>
	<p>
		<span class="todo">[TODO : préciser si un DPO est désigné, son nom et ses coordonnées, ou
		« Aucun DPO désigné, point de contact protection des données&nbsp;: … ».]</span>
	</p>

	<div class="callout">
		<strong>Note&nbsp;:</strong> ce document est un modèle. Il doit être relu et complété par un
		professionnel du droit avant publication officielle, notamment pour préciser la procédure
		exacte d'exercice et l'éventuelle désignation d'un DPO.
	</div>
{:else}
	<h1>Your rights — GDPR</h1>
	<p class="lede">
		This page details the rights you have over your personal data and how to exercise them with
		Skilluv. It complements our <a href="/legal/privacy">Privacy Policy</a>.
	</p>

	<h2>1. Legal framework</h2>
	<p>Your rights are notably guaranteed by:</p>
	<ul>
		<li>the <strong>General Data Protection Regulation</strong> (EU) 2016/679 ("GDPR") for EU residents;</li>
		<li>the <strong>French Data Protection Act</strong> No.&nbsp;78-17 of 6 January 1978 as amended;</li>
		<li><strong>Beninese Act No.&nbsp;2017-20</strong> of 20 April 2018 (Digital Code, provisions on personal data protection);</li>
		<li>equivalent local laws in other African and non-EU countries (Malabo Convention, national laws).</li>
	</ul>

	<h2>2. Your rights in detail</h2>

	<h3>2.1 Right of access <small>(Art. 15 GDPR)</small></h3>
	<p>
		You may obtain confirmation that your data is processed and receive a copy, together with
		information on the purposes, categories, recipients, retention periods, etc.
	</p>

	<h3>2.2 Right to rectification <small>(Art. 16)</small></h3>
	<p>
		You may request the correction of inaccurate data or the completion of incomplete data. Most
		profile information can be edited directly from your <a href="/settings">settings</a>.
	</p>

	<h3>2.3 Right to erasure <small>(Art. 17 — "right to be forgotten")</small></h3>
	<p>
		You may request deletion of your data, subject to cases where we must retain it (legal
		obligation, defence of legal claims, etc.). Deleting your Account triggers deletion or
		anonymisation of your data within 30 days.
	</p>

	<h3>2.4 Right to restriction of processing <small>(Art. 18)</small></h3>
	<p>
		In certain cases (contesting accuracy, pending objection, etc.), you may ask that the
		processing of your data be restricted — kept but not actively used.
	</p>

	<h3>2.5 Right to data portability <small>(Art. 20)</small></h3>
	<p>
		For data processed based on your consent or contract performance, by automated means, you may
		receive your data in a structured, commonly used and machine-readable format, or have it
		transmitted directly to another controller where technically feasible.
	</p>

	<h3>2.6 Right to object <small>(Art. 21)</small></h3>
	<p>
		You may object at any time, on grounds relating to your particular situation, to processing
		based on legitimate interest. You may object without any reason to processing for direct
		marketing.
	</p>

	<h3>2.7 Withdrawal of consent <small>(Art. 7(3))</small></h3>
	<p>
		Where processing is based on your consent (e.g. marketing communications, "allow expressions
		of interest" setting), you may withdraw it at any time. Withdrawal does not affect the
		lawfulness of prior processing.
	</p>

	<h3>2.8 Post-mortem directives <small>(French Act 78-17, Art. 85)</small></h3>
	<p>
		You may set directives regarding the fate of your data after your death (retention, erasure,
		disclosure to a third party).
	</p>

	<h3>2.9 Automated individual decision-making <small>(Art. 22)</small></h3>
	<p>
		You have the right not to be subject to a decision based solely on automated processing that
		produces legal effects or significantly affects you. Skilluv does not currently make such
		decisions.
	</p>

	<h2>3. How to exercise your rights</h2>
	<p>To exercise any of these rights, you may:</p>
	<ol>
		<li>use the self-service tools in your <a href="/settings">account settings</a> (profile editing, account deletion, visibility settings);</li>
		<li>email us at <span class="todo">[TODO: dpo@skilluv.…]</span> with the subject "GDPR rights request";</li>
		<li>write to the registered office address (see <a href="/legal/mentions">legal notice</a>).</li>
	</ol>

	<h3>3.1 Proof of identity</h3>
	<p>
		In case of reasonable doubt about your identity, we may request additional proof. This
		information is used only to process your request.
	</p>

	<h3>3.2 Response time</h3>
	<p>
		We respond within one month of receiving your request. This period may be extended by two
		months given the complexity or number of requests; we will then inform you of the reasons for
		the delay.
	</p>

	<h3>3.3 Free of charge</h3>
	<p>
		Exercising your rights is free. For manifestly unfounded or excessive requests (in particular
		due to their repetitive nature), we may charge reasonable fees or refuse to act, with reasons.
	</p>

	<h2>4. Lodging a complaint with a supervisory authority</h2>
	<p>
		If, after contacting us, you believe your rights are not respected, you have the right to
		lodge a complaint with the competent data-protection authority:
	</p>
	<ul>
		<li><strong>France:</strong> CNIL — 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — <a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a></li>
		<li><strong>Benin:</strong> APDP — Personal Data Protection Authority — <a href="https://apdp.bj" target="_blank" rel="noopener">apdp.bj</a></li>
		<li><strong>European Union:</strong> supervisory authority of your country of residence (list at <a href="https://edpb.europa.eu/about-edpb/board/members_en" target="_blank" rel="noopener">edpb.europa.eu</a>)</li>
		<li><strong>Other countries:</strong> competent national authority, where applicable.</li>
	</ul>

	<h2>5. Data Protection Officer (DPO)</h2>
	<p>
		<span class="todo">[TODO: indicate whether a DPO is appointed, name and contact details, or
		"No DPO appointed, data-protection contact: …".]</span>
	</p>

	<div class="callout">
		<strong>Note:</strong> this document is a template. It must be reviewed and completed by a
		qualified legal professional before official publication, including the exact exercise
		procedure and any DPO appointment.
	</div>
{/if}
