// Liste partagée des secteurs d'activité — utilisée sur /enterprise/register
// (step 2) et /enterprise/profile pour garantir que les valeurs stockées
// backend restent cohérentes d'une page à l'autre.
//
// Le champ `value` est un slug stable en anglais → invariant aux traductions.
// Les libellés FR/EN vivent dans ce même fichier pour éviter d'avoir à
// dupliquer la liste dans les fichiers i18n (55+ entrées).

export interface IndustryOption {
	value: string;
	fr: string;
	en: string;
}

export const INDUSTRIES: IndustryOption[] = [
	{ value: 'software', fr: 'Logiciel & SaaS', en: 'Software & SaaS' },
	{ value: 'internet', fr: 'Internet & services web', en: 'Internet & web services' },
	{ value: 'ecommerce', fr: 'E-commerce & marketplace', en: 'E-commerce & marketplace' },
	{ value: 'fintech', fr: 'Fintech & services financiers', en: 'Fintech & financial services' },
	{ value: 'banking', fr: 'Banque & assurance', en: 'Banking & insurance' },
	{ value: 'blockchain', fr: 'Blockchain & crypto', en: 'Blockchain & crypto' },
	{ value: 'cybersecurity', fr: 'Cybersécurité', en: 'Cybersecurity' },
	{ value: 'ai_ml', fr: 'Intelligence artificielle & Machine learning', en: 'Artificial intelligence & Machine learning' },
	{ value: 'data', fr: 'Data & analytics', en: 'Data & analytics' },
	{ value: 'devtools', fr: 'Outils développeur & infrastructure', en: 'Developer tools & infrastructure' },
	{ value: 'cloud', fr: 'Cloud & hébergement', en: 'Cloud & hosting' },
	{ value: 'telecom', fr: 'Télécommunications', en: 'Telecommunications' },
	{ value: 'hardware', fr: 'Hardware & électronique', en: 'Hardware & electronics' },
	{ value: 'iot', fr: 'IoT & objets connectés', en: 'IoT & connected devices' },
	{ value: 'robotics', fr: 'Robotique & automatisation', en: 'Robotics & automation' },
	{ value: 'gaming', fr: 'Jeux vidéo & esport', en: 'Gaming & esports' },
	{ value: 'media', fr: 'Médias & divertissement', en: 'Media & entertainment' },
	{ value: 'music', fr: 'Musique & audio', en: 'Music & audio' },
	{ value: 'advertising', fr: 'Publicité & marketing', en: 'Advertising & marketing' },
	{ value: 'design_agency', fr: 'Design & agence créative', en: 'Design & creative agency' },
	{ value: 'consulting', fr: 'Conseil & services professionnels', en: 'Consulting & professional services' },
	{ value: 'staffing', fr: 'Recrutement & RH', en: 'Recruitment & HR' },
	{ value: 'legal', fr: 'Juridique & legaltech', en: 'Legal & legaltech' },
	{ value: 'accounting', fr: 'Comptabilité & audit', en: 'Accounting & audit' },
	{ value: 'realestate', fr: 'Immobilier & proptech', en: 'Real estate & proptech' },
	{ value: 'construction', fr: 'BTP & construction', en: 'Construction & building' },
	{ value: 'manufacturing', fr: 'Industrie & manufacturing', en: 'Manufacturing & industry' },
	{ value: 'automotive', fr: 'Automobile & mobilité', en: 'Automotive & mobility' },
	{ value: 'aerospace', fr: 'Aérospatial & défense', en: 'Aerospace & defense' },
	{ value: 'transport', fr: 'Transport & logistique', en: 'Transport & logistics' },
	{ value: 'energy', fr: 'Énergie & utilities', en: 'Energy & utilities' },
	{ value: 'cleantech', fr: 'Cleantech & environnement', en: 'Cleantech & environment' },
	{ value: 'agriculture', fr: 'Agriculture & agritech', en: 'Agriculture & agritech' },
	{ value: 'food', fr: 'Agroalimentaire & foodtech', en: 'Food & foodtech' },
	{ value: 'retail', fr: 'Retail & grande distribution', en: 'Retail & distribution' },
	{ value: 'fashion', fr: 'Mode & luxe', en: 'Fashion & luxury' },
	{ value: 'beauty', fr: 'Beauté & cosmétique', en: 'Beauty & cosmetics' },
	{ value: 'health', fr: 'Santé & healthtech', en: 'Health & healthtech' },
	{ value: 'biotech', fr: 'Biotech & pharma', en: 'Biotech & pharma' },
	{ value: 'medtech', fr: 'Dispositifs médicaux', en: 'Medical devices' },
	{ value: 'wellness', fr: 'Bien-être & sport', en: 'Wellness & fitness' },
	{ value: 'education', fr: 'Éducation & edtech', en: 'Education & edtech' },
	{ value: 'nonprofit', fr: 'ONG & associations', en: 'Nonprofit & NGO' },
	{ value: 'government', fr: 'Secteur public & administration', en: 'Government & public sector' },
	{ value: 'hospitality', fr: 'Hôtellerie & tourisme', en: 'Hospitality & tourism' },
	{ value: 'travel', fr: 'Voyage & traveltech', en: 'Travel & traveltech' },
	{ value: 'sports', fr: 'Sport & sportech', en: 'Sports & sportech' },
	{ value: 'research', fr: 'Recherche & R&D', en: 'Research & R&D' },
	{ value: 'other', fr: 'Autre', en: 'Other' }
];

/** Transforme la liste en `items` pour le composant `Select` selon la locale. */
export function industryItems(locale: 'fr' | 'en'): { value: string; label: string }[] {
	return INDUSTRIES.map((it) => ({
		value: it.value,
		label: locale === 'fr' ? it.fr : it.en
	}));
}
