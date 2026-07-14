<!--
  Sprite SVG des 5 clés canoniques.
  À inclure UNE FOIS dans le layout root (`src/routes/+layout.svelte`).
  Chaque <symbol> est référencé par <use href="#key-{type}"/> dans <Key>.

  PLACEHOLDER: dessins géométriques. À remplacer par les SVG produits via
  Recraft.ai (voir planning-artifacts/.working/prompt-recraft-vector.md)
  quand disponibles — même viewBox 100×300, même stroke="currentColor".
-->
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
	<!-- Clé CERCLE — Preuve -->
	<symbol id="key-circle" viewBox="0 0 100 300">
		<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="50" cy="42" r="30" />
			<circle cx="50" cy="42" r="20" stroke-width="1.5" />
			<line x1="50" y1="72" x2="50" y2="82" />
			<line x1="50" y1="82" x2="50" y2="238" />
			<line x1="46" y1="90" x2="46" y2="232" stroke-width="1.2" />
			<line x1="54" y1="90" x2="54" y2="232" stroke-width="1.2" />
		</g>
		<g fill="currentColor" stroke="none">
			<path d="M 50 238 L 82 238 L 82 254 L 68 254 L 68 264 L 60 264 L 60 254 L 50 254 Z" />
		</g>
	</symbol>

	<!-- Clé TRÈFLE — Craft -->
	<symbol id="key-trefle" viewBox="0 0 100 300">
		<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="50" cy="22" r="16" />
			<circle cx="30" cy="52" r="16" />
			<circle cx="70" cy="52" r="16" />
			<line x1="50" y1="68" x2="50" y2="82" />
			<line x1="50" y1="82" x2="50" y2="238" />
			<line x1="46" y1="90" x2="46" y2="232" stroke-width="1.2" />
			<line x1="54" y1="90" x2="54" y2="232" stroke-width="1.2" />
		</g>
		<g fill="currentColor" stroke="none">
			<path d="M 50 238 L 84 238 L 84 250 L 74 250 L 74 260 L 62 260 L 62 250 L 50 250 Z" />
		</g>
	</symbol>

	<!-- Clé ROSACE — Création (quatrefoil) -->
	<symbol id="key-rosace" viewBox="0 0 100 300">
		<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="50" cy="16" r="14" />
			<circle cx="24" cy="42" r="14" />
			<circle cx="76" cy="42" r="14" />
			<circle cx="50" cy="68" r="14" />
			<circle cx="50" cy="42" r="5" stroke-width="1.5" />
			<line x1="50" y1="82" x2="50" y2="92" />
			<line x1="50" y1="92" x2="50" y2="238" />
			<line x1="46" y1="100" x2="46" y2="232" stroke-width="1.2" />
			<line x1="54" y1="100" x2="54" y2="232" stroke-width="1.2" />
		</g>
		<g fill="currentColor" stroke="none">
			<path d="M 50 238 L 80 238 L 80 252 L 70 252 L 70 262 L 62 262 L 62 252 L 50 252 Z" />
		</g>
	</symbol>

	<!-- Clé ÉTOILE — Impact -->
	<symbol id="key-star" viewBox="0 0 100 300">
		<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="50" cy="42" r="30" />
			<line x1="50" y1="72" x2="50" y2="82" />
			<line x1="50" y1="82" x2="50" y2="238" />
			<line x1="46" y1="90" x2="46" y2="232" stroke-width="1.2" />
			<line x1="54" y1="90" x2="54" y2="232" stroke-width="1.2" />
		</g>
		<g fill="currentColor" stroke="none">
			<path d="M 50 20 L 55 36 L 72 36 L 58 46 L 63 62 L 50 52 L 37 62 L 42 46 L 28 36 L 45 36 Z" />
			<path d="M 50 238 L 82 238 L 82 250 L 72 250 L 72 262 L 60 262 L 60 250 L 50 250 Z" />
		</g>
	</symbol>

	<!-- Clé CŒUR — Luv (signature) -->
	<symbol id="key-heart" viewBox="0 0 100 300">
		<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
			<path d="M 50 30 C 34 6 12 18 12 40 C 12 60 50 88 50 88 C 50 88 88 60 88 40 C 88 18 66 6 50 30 Z" />
			<line x1="50" y1="88" x2="50" y2="98" />
			<line x1="50" y1="98" x2="50" y2="238" />
			<line x1="46" y1="106" x2="46" y2="232" stroke-width="1.2" />
			<line x1="54" y1="106" x2="54" y2="232" stroke-width="1.2" />
		</g>
		<g fill="currentColor" stroke="none">
			<path d="M 50 238 L 84 238 L 84 252 L 74 252 L 74 264 L 62 264 L 62 252 L 50 252 Z" />
		</g>
	</symbol>
</svg>
