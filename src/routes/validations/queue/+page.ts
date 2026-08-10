// La queue de validation utilise les cookies de session ; on force
// l'hydratation client-only pour eviter de rejouer la requete cote SSR
// sans credentials (et pour aligner sur le pattern des autres pages
// P26 validator).
export const ssr = false;
