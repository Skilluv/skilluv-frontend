<script lang="ts">
	import { i18n } from '$lib/i18n';
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Mentions légales' : 'Legal notice'} — Skilluv</title>
	<meta name="robots" content="index, follow" />
</svelte:head>

{#if i18n.locale === 'fr'}
	<h1>Mentions légales</h1>
	<p class="lede">
		Informations légales concernant l'éditeur, l'hébergeur et l'exploitation de la plateforme Skilluv,
		conformément à l'article 6-III de la loi pour la confiance dans l'économie numérique (LCEN) du
		21 juin 2004.
	</p>

	<h2>1. Éditeur du site</h2>
	<p>
		La plateforme Skilluv (ci-après « Skilluv ») est éditée par&nbsp;:
	</p>
	<ul>
		<li><strong>Raison sociale&nbsp;:</strong> <span class="todo">[TODO : raison sociale]</span></li>
		<li><strong>Forme juridique&nbsp;:</strong> <span class="todo">[TODO : SAS / SARL / EI / autre]</span></li>
		<li><strong>Capital social&nbsp;:</strong> <span class="todo">[TODO : montant en EUR / XOF]</span></li>
		<li><strong>Siège social&nbsp;:</strong> <span class="todo">[TODO : adresse complète, ville, pays]</span></li>
		<li><strong>Immatriculation&nbsp;:</strong> <span class="todo">[TODO : RCS / RCCM + numéro]</span></li>
		<li><strong>Numéro SIRET / IFU&nbsp;:</strong> <span class="todo">[TODO]</span></li>
		<li><strong>TVA intracommunautaire&nbsp;:</strong> <span class="todo">[TODO si applicable]</span></li>
		<li><strong>Adresse e-mail&nbsp;:</strong> <span class="todo">[TODO : contact@skilluv.…]</span></li>
		<li><strong>Téléphone&nbsp;:</strong> <span class="todo">[TODO]</span></li>
	</ul>

	<h2>2. Directeur de la publication</h2>
	<p>
		Le directeur de la publication est&nbsp;: <span class="todo">[TODO : nom, prénom, qualité]</span>.
	</p>

	<h2>3. Hébergement</h2>
	<p>Le site est hébergé par&nbsp;:</p>
	<ul>
		<li><strong>Hébergeur&nbsp;:</strong> <span class="todo">[TODO : nom de l'hébergeur]</span></li>
		<li><strong>Adresse&nbsp;:</strong> <span class="todo">[TODO]</span></li>
		<li><strong>Téléphone&nbsp;:</strong> <span class="todo">[TODO]</span></li>
		<li><strong>Site web&nbsp;:</strong> <span class="todo">[TODO]</span></li>
	</ul>

	<h2>4. Contact</h2>
	<p>
		Pour toute demande relative au site ou à son contenu, vous pouvez nous écrire à
		<span class="todo">[TODO : contact@skilluv.…]</span> ou par voie postale à l'adresse du siège
		social indiquée ci-dessus.
	</p>

	<h2>5. Propriété intellectuelle</h2>
	<p>
		L'ensemble des éléments composant la plateforme Skilluv (notamment&nbsp;: nom, logo, charte
		graphique, textes, illustrations, photographies, vidéos, code source, architecture, base de
		données, marques et logos) sont protégés par le droit de la propriété intellectuelle et
		demeurent la propriété exclusive de l'éditeur ou de ses partenaires.
	</p>
	<p>
		Toute reproduction, représentation, modification, publication, adaptation ou exploitation de
		tout ou partie des éléments du site, par quelque procédé que ce soit et sur quelque support
		que ce soit, est interdite sans l'autorisation écrite préalable de l'éditeur. Toute exploitation
		non autorisée est susceptible de constituer une contrefaçon sanctionnée par les articles
		L.&nbsp;335-2 et suivants du Code de la propriété intellectuelle.
	</p>

	<h2>6. Contenus utilisateurs</h2>
	<p>
		Les utilisateurs peuvent soumettre des challenges, solutions, commentaires et autres contenus
		via la plateforme. Ces contenus restent la propriété de leurs auteurs, qui en demeurent seuls
		responsables. Les conditions d'utilisation détaillées de ces contenus sont précisées dans
		<a href="/legal/terms">nos Conditions générales d'utilisation</a>.
	</p>

	<h2>7. Liens hypertextes</h2>
	<p>
		La plateforme peut contenir des liens vers des sites tiers. L'éditeur n'exerce aucun contrôle
		sur ces sites et décline toute responsabilité quant à leur contenu, leur disponibilité ou
		l'usage qui peut en être fait.
	</p>

	<h2>8. Crédits</h2>
	<ul>
		<li>Polices&nbsp;: Fraunces, Bricolage Grotesque et JetBrains Mono (SIL Open Font License).</li>
		<li>Icônes et illustrations&nbsp;: créations originales et bibliothèques open source.</li>
		<li>Pile technique&nbsp;: SvelteKit, Tailwind CSS, Vite.</li>
	</ul>

	<h2>9. Données personnelles</h2>
	<p>
		Le traitement des données à caractère personnel collectées via la plateforme est décrit dans
		notre <a href="/legal/privacy">Politique de confidentialité</a> et l'exercice de vos droits est
		détaillé dans notre <a href="/legal/gdpr">page dédiée au RGPD</a>.
	</p>

	<div class="callout">
		<strong>Note&nbsp;:</strong> ce document est un modèle. Il doit être relu et complété par un
		professionnel du droit avant publication officielle.
	</div>
{:else}
	<h1>Legal notice</h1>
	<p class="lede">
		Legal information about the publisher, host and operator of the Skilluv platform, pursuant to
		Article 6-III of the French Act for Confidence in the Digital Economy (LCEN) of 21 June 2004,
		and other applicable disclosure requirements.
	</p>

	<h2>1. Publisher</h2>
	<p>The Skilluv platform (hereinafter "Skilluv") is published by:</p>
	<ul>
		<li><strong>Legal name:</strong> <span class="todo">[TODO: legal name]</span></li>
		<li><strong>Legal form:</strong> <span class="todo">[TODO: company type]</span></li>
		<li><strong>Share capital:</strong> <span class="todo">[TODO: amount]</span></li>
		<li><strong>Registered office:</strong> <span class="todo">[TODO: full address, city, country]</span></li>
		<li><strong>Company registration:</strong> <span class="todo">[TODO: RCS / RCCM number]</span></li>
		<li><strong>Tax ID / VAT number:</strong> <span class="todo">[TODO if applicable]</span></li>
		<li><strong>Email:</strong> <span class="todo">[TODO: contact@skilluv.…]</span></li>
		<li><strong>Phone:</strong> <span class="todo">[TODO]</span></li>
	</ul>

	<h2>2. Publication director</h2>
	<p>Publication director: <span class="todo">[TODO: full name, role]</span>.</p>

	<h2>3. Hosting</h2>
	<p>The site is hosted by:</p>
	<ul>
		<li><strong>Host:</strong> <span class="todo">[TODO: host name]</span></li>
		<li><strong>Address:</strong> <span class="todo">[TODO]</span></li>
		<li><strong>Phone:</strong> <span class="todo">[TODO]</span></li>
		<li><strong>Website:</strong> <span class="todo">[TODO]</span></li>
	</ul>

	<h2>4. Contact</h2>
	<p>
		For any request regarding the site or its content, contact us at
		<span class="todo">[TODO: contact@skilluv.…]</span> or by mail at the registered office address
		above.
	</p>

	<h2>5. Intellectual property</h2>
	<p>
		All elements making up the Skilluv platform (including the name, logo, visual identity, text,
		illustrations, photographs, videos, source code, architecture, database, trademarks and logos)
		are protected by intellectual property law and remain the exclusive property of the publisher
		or its partners.
	</p>
	<p>
		Any reproduction, representation, modification, publication, adaptation or exploitation of all
		or part of the site, by any means and on any medium, is prohibited without the publisher's
		prior written authorisation.
	</p>

	<h2>6. User content</h2>
	<p>
		Users may submit challenges, solutions, comments and other content via the platform. Such
		content remains the property of its authors, who are solely responsible for it. Detailed
		conditions for user content are set out in our <a href="/legal/terms">Terms of Service</a>.
	</p>

	<h2>7. Hyperlinks</h2>
	<p>
		The platform may contain links to third-party sites. The publisher has no control over those
		sites and disclaims any liability regarding their content, availability or use.
	</p>

	<h2>8. Credits</h2>
	<ul>
		<li>Fonts: Fraunces, Bricolage Grotesque and JetBrains Mono (SIL Open Font License).</li>
		<li>Icons and illustrations: original work and open-source libraries.</li>
		<li>Tech stack: SvelteKit, Tailwind CSS, Vite.</li>
	</ul>

	<h2>9. Personal data</h2>
	<p>
		The processing of personal data collected via the platform is described in our
		<a href="/legal/privacy">Privacy Policy</a>, and your rights are detailed on our
		<a href="/legal/gdpr">GDPR rights page</a>.
	</p>

	<div class="callout">
		<strong>Note:</strong> this document is a template. It must be reviewed and completed by a
		qualified legal professional before official publication.
	</div>
{/if}
