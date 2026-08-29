/**
 * Retablissement des accents des libelles.
 *
 * POURQUOI. Le seed `bahia.seed.json` a ete extrait du classeur en ASCII : ses
 * libelles ont perdu leurs diacritiques (« Joint peripherique de sol »). Sur un
 * devis remis a un client de Wood-Line, ca ne passe pas.
 *
 * D'OU CA VIENT. 54 intitules sont repris tels quels de la table de chaines du
 * classeur `2025 03 20 DEVISEUR Tarifs PARTICULIERS V06.xlsm` : un script a aligne
 * chaque libelle du seed sur sa chaine Excel et n'a transfere QUE les signes
 * diacritiques, en gardant la ponctuation et l'espacement du seed. Les 19 autres
 * sont retablis a la main faute d'appariement exact — memes mots, rien de reformule.
 *
 * CE QUE CA NE FAIT PAS. Aucun prix, aucun identifiant, aucune option n'est touche.
 * Le seed reste octet pour octet celui du CB, et le moteur ne voit que des libelles.
 *
 * A REMONTER AU CB : l'extraction du seed gagnerait a conserver les accents.
 */
export const LIBELLES_ACCENTUES: Record<string, string> = {
  // Reportes automatiquement depuis le classeur
  // seuls les signes diacritiques ont ete transferes : ponctuation et mots inchanges.
  "groupe:cache_ncc": "Cache nage à contre-courant",
  "groupe:echelle_inox": "Echelle inox 316 L (si électrolyseur de sel)",
  "groupe:enjoliveur_pac": "Enjoliveur pompe à chaleur",
  "groupe:feutre_parois": "Feutre 400gr/m² pour parois (remplace 250gr/m²)",
  "groupe:feutre_sol": "Feutre 400gr/m² pour sol (remplace 250gr/m²)",
  "groupe:joint_peripherique": "Joint périphérique de sol",
  "groupe:module_one": "Supplément module ONE sur coffret électrique",
  "groupe:pack_poutrelles": "Pack poutrelles supplémentaire (si pose hors-sol ou semi-enterrée)",
  "groupe:pompe_a_chaleur": "Pompe à chaleur",
  "groupe:telecommande": "Télécommande",
  "option:aquabike_wrmax": "Aquabike WR Max Aluminium T6 anodisé",
  "option:bonde_laterale": "Bonde latérale couleur + décaissement",
  "option:cache_ncc_oui": "Cache nage à contre-courant",
  "option:caillebotis_ipe": "Caillebotis en ipé (jusqu'à épuisement)",
  "option:couv_wood": "Couverture de sécurité et d'hivernage Wood",
  "option:couv_wood_up": "Couverture de sécurité et d'hivernage Wood-up",
  "option:easy_4salt": "Easy 4 Salt (pompe pH + électrolyseur de sel) + sondes",
  "option:enjoliveur_oui": "Enjoliveur pompe à chaleur",
  "option:enr_tel_4m": "Enrouleur téléscopique hors-sol 4 M",
  "option:enr_tel_5m": "Enrouleur téléscopique hors-sol 5 M",
  "option:enr_tel_7m": "Enrouleur téléscopique hors-sol 7 M",
  "option:filtre_cartouche_sans": "Sans filtre à cartouches",
  "option:joint_oui": "Joint périphérique de sol",
  "option:lame_inox": "Lame d'eau inox + décaissement margelles",
  "option:local_adosser": "Local à adosser",
  "option:module_one_oui": "Supplément module ONE sur coffret électrique",
  "option:ncc_40": "Nage à contre-courant 40m³/h",
  "option:ncc_60": "Nage à contre-courant 60m³/h",
  "option:ncc_preinstall": "Pré-installation nage à contre-courant",
  "option:ncc_sans": "Sans nage à contre-courant",
  "option:pac_aucune": "Pas de pompe à chaleur",
  "option:pac_fi_z1": "Pompe à chaleur Full Inverter Zone 1 (froide)",
  "option:pac_fi_z2": "Pompe à chaleur Full Inverter Zone 2 (tempérée)",
  "option:pac_fi_z3": "Pompe à chaleur Full Inverter Zone 3 (chaude)",
  "option:pac_onoff_z1": "Pompe à chaleur ON/OFF Zone 1 (froide)",
  "option:pac_onoff_z2": "Pompe à chaleur ON/OFF Zone 2 (tempérée)",
  "option:pac_onoff_z3": "Pompe à chaleur ON/OFF Zone 3 (chaude)",
  "option:photometre": "Photomètre Scuba 2",
  "option:pieds_45": "Pieds pour pompe à chaleur 45 cm",
  "option:pieds_60": "Pieds pour pompe à chaleur 60 cm",
  "option:pieds_aucun": "Pas de pied pour pompe à chaleur",
  "option:poutrelles_a_sceller": "à sceller",
  "option:pvv_075": "Pompe à vitesse variable 0,75cv (pompe standard déduite)",
  "option:pvv_1cv": "Pompe à vitesse variable 1cv (pompe standard déduite)",
  "option:pvv_sans": "Sans pompe à vitesse variable",
  "option:relevage_inox": "Pompe de relevage inox Stanley flotteur périphérique",
  "option:relevage_integre": "Pompe de relevage avec flotteur intégré",
  "option:relevage_stanley": "Pompe de relevage Stanley flotteur périphérique",
  "option:robot_diaphragme": "Nettoyeur à diaphragme",
  "option:skimmer_600_corten": "Skimmer 600 aspect Corten (partie extérieure)",
  "option:skimmer_corten": "Skimmer aspect Corten (partie extérieure)",
  "option:telecommande_oui": "Télécommande",
  "option:upgrade_volet": "Supplément upgrade avec volet",
  "option:volet_plage_immerges": "Volet et plage immergés",

  // Retablis a la main
  // le classeur ne porte pas ces intitules sous une forme appariable. Memes mots, accents francais.
  "groupe:couverture": "Couverture de sécurité et d'hivernage",
  "groupe:couverture_bulle": "Couverture à bulle",
  "groupe:enrouleur": "Enrouleur (accessoire des couvertures à bulles)",
  "groupe:filtre_cartouche": "Filtre à cartouche",
  "groupe:margelles_ipe": "Supplément margelles monobloc en ipé (jusqu'à épuisement)",
  "groupe:nage_contre_courant": "Nage à contre-courant",
  "groupe:pieds_pac": "Pieds pour pompe à chaleur",
  "groupe:pompe_vitesse_variable": "Pompe à vitesse variable",
  "groupe:spot": "Éclairage sub-aquatique",
  "option:bulle_oui": "Couverture à bulle Bleu/noir (cousue 4 côtés + œillets)",
  "option:couv_barres_wood": "Couverture à barres Wood",
  "option:couv_barres_woodup": "Couverture à barres Wood-up",
  "option:feutre_parois_oui": "Feutre 400gr/m² pour parois",
  "option:feutre_sol_oui": "Feutre 400gr/m² pour sol",
  "option:filtre_cartouche_oui": "Filtre à cartouche (transparent), supplément de",
  "option:local_4": "Local technique n°4",
  "option:local_5": "Local technique n°5",
  "option:local_6": "Local technique n°6",
  "option:margelles_ipe_oui": "Margelles monobloc en ipé (supplément)",
};

/**
 * Les textes du seed hors groupes et options, eux aussi extraits en ASCII :
 * l'avertissement de la grille et les intitules du bloc revendeur.
 */
export const TEXTES_ACCENTUES: Record<string, string> = {
  "meta:avertissement":
    "Grille PARTICULIERS. La grille revendeurs n'a pas encore été fournie.",
  "revendeur:commentaire":
    "Saisi à la main par le revendeur dans l'onglet devis. Ne fait pas partie du tarif Wood-Line.",
  "revendeur:Dalle de beton": "Dalle de béton",
};

/** Un intitule du bloc revendeur, reaccentue. */
export function libelleRevendeur(libelle: string): string {
  return TEXTES_ACCENTUES[`revendeur:${libelle}`] ?? libelle;
}

/** Le libelle a afficher pour un groupe. */
export function libelleGroupe(id: string, defaut: string): string {
  return LIBELLES_ACCENTUES[`groupe:${id}`] ?? defaut;
}

/** Le libelle a afficher pour une option. */
export function libelleOption(id: string, defaut: string): string {
  return LIBELLES_ACCENTUES[`option:${id}`] ?? defaut;
}
