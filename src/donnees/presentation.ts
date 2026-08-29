/**
 * Ce que le catalogue papier apporte a l'ecran : le decoupage en etapes, les
 * visuels et les textes descriptifs.
 *
 * SOURCE UNIQUE : « Catalogue Wood-Line 2025 V1.pdf », 84 pages. Les visuels sont
 * des recadrages de ce PDF (script d'extraction documente dans docs/visuels.md).
 * Les textes sont ceux du client, repris a l'identique et abreges. Rien n'est
 * invente ici : une option sans visuel connu reste sans visuel.
 */

export interface EtapeConfigurateur {
  id: string;
  /** Le numero d'etape du catalogue papier, quand il y en a un. */
  numero: string | null;
  titre: string;
  /** Phrase du catalogue, affichee sous le titre. */
  chapeau?: string;
  page: number;
  /** Les groupes du seed traites a cette etape. */
  groupes: string[];
  /** Etape speciale : le choix de la variante (taille, hauteur, essence). */
  bassin?: "dimension" | "essence";
  visuel?: string;
}

/** Les neuf etapes « a valider a la commande », dans la numerotation du catalogue. */
export const ETAPES_COMMANDE: EtapeConfigurateur[] = [
  {
    id: "dimension",
    numero: "2",
    titre: "Choisir la dimension",
    chapeau:
      "La bahia est notre modèle carré. La taille et la hauteur de parois déterminent le prix public du kit.",
    page: 38,
    groupes: [],
    bassin: "dimension",
    visuel: "modele-bahia.jpg",
  },
  {
    id: "essence",
    numero: "3",
    titre: "Choisir l'essence de bois et le profil",
    chapeau:
      "Le bois, matériau écologique et renouvelable. Il existe des centaines d'essences et elles ont chacune leurs caractéristiques.",
    page: 40,
    groupes: [],
    bassin: "essence",
  },
  {
    id: "liner",
    numero: "4",
    titre: "Choisir la couleur du liner",
    chapeau:
      "Liner vernis 75/100ème. Le liner est la membrane qui assure l'étanchéité du bassin, pré-soudée en usine.",
    page: 41,
    groupes: ["liner"],
  },
  {
    id: "joint",
    numero: "5",
    titre: "Le joint périphérique",
    chapeau:
      "Ce joint se place sous le premier madrier, au sol, pour éviter que l'eau soit en contact avec. Il permet de prolonger la durabilité du bassin.",
    page: 42,
    groupes: ["joint_peripherique"],
  },
  {
    id: "pose",
    numero: "6",
    titre: "Le type de pose",
    chapeau:
      "Dès lors qu'un bassin n'est pas entièrement enterré, des poutrelles de renfort devront être installées.",
    page: 43,
    groupes: ["pack_poutrelles"],
    visuel: "pose-types.jpg",
  },
  {
    id: "margelles",
    numero: "7",
    titre: "Les margelles",
    chapeau:
      "Nos margelles ont 33 mm d'épaisseur, ce qui améliore grandement leur maintien. Les blochets sont livrés avec les margelles.",
    page: 44,
    groupes: ["blochets_margelles", "margelles_ipe"],
  },
  {
    id: "escalier",
    numero: "8",
    titre: "Escalier sous liner",
    chapeau:
      "L'escalier triangulaire permet de garder un couloir de longueur maximale.",
    page: 46,
    groupes: ["escalier"],
  },
  {
    id: "volet",
    numero: "9",
    titre: "Volet électrique hors-sol",
    chapeau:
      "Le volet Wood-Line a été développé avec un fabricant réputé, afin d'être compatible avec nos piscines à ossatures bois. Norme NF-P90-308.",
    page: 47,
    groupes: ["volet"],
  },
  {
    id: "eclairage",
    numero: "10",
    titre: "Éclairage sub-aquatique",
    chapeau:
      "Créez une magnifique ambiance lumineuse à moindre frais. Le coffret électrique est déjà équipé du transformateur 220V/12V.",
    page: 54,
    groupes: ["spot", "telecommande"],
    visuel: "spot-ambiance.jpg",
  },
];

/** Les accessoires, regroupes par famille. Ajoutables plus tard. */
export const ETAPES_ACCESSOIRES: EtapeConfigurateur[] = [
  {
    id: "feutres-couvertures",
    numero: null,
    titre: "Feutres et couvertures",
    chapeau:
      "Couverture de sécurité, hivernage, couverture à bulles et leurs enrouleurs.",
    page: 66,
    groupes: [
      "feutre_parois",
      "feutre_sol",
      "couverture",
      "couverture_bulle",
      "enrouleur",
      "moteur_enrouleur",
      "supports_muraux",
    ],
  },
  {
    id: "chauffage-eau",
    numero: null,
    titre: "Chauffage et traitement de l'eau",
    chapeau:
      "Pompes à chaleur On/Off et Full Inverter, gamme Easy d'analyse et de traitement.",
    page: 60,
    groupes: [
      "pompe_a_chaleur",
      "kit_by_pass",
      "pieds_pac",
      "enjoliveur_pac",
      "traitement_easy",
      "accessoires_eau",
    ],
  },
  {
    id: "equipements",
    numero: null,
    titre: "Équipements techniques",
    chapeau:
      "Skimmers, filtration, nage à contre-courant, lame d'eau et pompe de relevage.",
    page: 34,
    groupes: [
      "skimmer",
      "module_one",
      "pompe_vitesse_variable",
      "filtre_cartouche",
      "echelle_inox",
      "prise_balai",
      "nage_contre_courant",
      "lame_eau",
      "bonde",
      "pompe_relevage",
    ],
  },
  {
    id: "confort",
    numero: null,
    titre: "Confort et extérieur",
    chapeau:
      "Locaux techniques, robots de nettoyage, douches solaires, aquabike et caches.",
    page: 57,
    groupes: [
      "local_technique",
      "aquabike",
      "robot",
      "set_nettoyage",
      "douche",
      "caillebotis",
      "cache_ncc",
      "cache_poutrelle",
    ],
  },
];

export const TOUTES_LES_ETAPES: EtapeConfigurateur[] = [
  ...ETAPES_COMMANDE,
  ...ETAPES_ACCESSOIRES,
];

/**
 * Visuel par option. Une entree absente signifie : pas de photo identifiee dans le
 * catalogue 2025. On affiche alors une pastille sobre, jamais la photo d'a cote.
 */
export const VISUEL_PAR_OPTION: Record<string, string> = {
  // Étape 4 — les cinq coloris de liner, page 41.
  liner_anthracite: "liner-anthracite.jpg",
  liner_blanc: "liner-blanc.jpg",
  liner_gris_clair: "liner-gris-clair.jpg",
  liner_sable: "liner-sable.jpg",
  liner_bleu: "liner-bleu.jpg",
  // Étape 5, page 42.
  joint_oui: "joint-peripherique.jpg",
  // Étape 6, page 42 (les deux profils de poutrelles).
  poutrelles_en_l: "poutrelles.jpg",
  poutrelles_rectilignes: "poutrelles.jpg",
  poutrelles_a_sceller: "poutrelles.jpg",
  // Étape 7, page 44.
  blochets_oui: "margelles-pin.jpg",
  margelles_ipe_oui: "margelles-ipe.jpg",
  // Étape 8, page 46.
  escalier_triangulaire: "escalier-triangulaire.jpg",
  escalier_toute_largeur: "escalier-toute-largeur.jpg",
  // Étape 9, page 48.
  volet_hors_sol: "volet-hors-sol.jpg",
  // Étape 10, page 54.
  spot_252_blanc: "spot-252.jpg",
  spot_252_rvb: "spot-252.jpg",
  spot_3_blanc: "spot-3-9.jpg",
  spot_9_rvb: "spot-3-9.jpg",
  // Couvertures, pages 66 et 67.
  couv_wood: "couverture-wood.jpg",
  couv_wood_up: "couverture-wood.jpg",
  couv_barres_wood: "couverture-barres.jpg",
  couv_barres_woodup: "couverture-barres.jpg",
  bulle_oui: "couverture-bulle.jpg",
  // Pompes à chaleur, pages 60 et 61.
  pac_onoff_z1: "pac-onoff.jpg",
  pac_onoff_z2: "pac-onoff.jpg",
  pac_onoff_z3: "pac-onoff.jpg",
  pac_fi_z1: "pac-full-inverter.jpg",
  pac_fi_z2: "pac-full-inverter.jpg",
  pac_fi_z3: "pac-full-inverter.jpg",
  // Locaux techniques, page 57. Les n° 6 et « à adosser » sont sans visuel identifié.
  local_4: "local-technique-4.jpg",
  local_5: "local-technique-5.jpg",
  // Robots, page 69.
  robot_zodiac: "robot-zodiac.jpg",
  robot_sans_fil: "robot-sans-fil.jpg",
  // Douches et caillebotis, page 59. Le deviseur dit « acier » là où le catalogue
  // dit « aluminium » pour le même produit (mêmes deux coloris) — à confirmer.
  douche_pvc: "douche-pvc.jpg",
  douche_acier: "douche-alu.jpg",
  douche_bois: "douche-alu.jpg",
  douche_hybride: "douche-hybride.jpg",
  caillebotis_ipe: "caillebotis-ipe.jpg",
  caillebotis_composite: "caillebotis-composite.jpg",
};

/**
 * Les visuels a afficher en entier plutot qu'en cadrage plein : photos detourees,
 * schemas et prises de vue verticales, qu'un recadrage en 4/3 amputerait.
 */
export const VISUELS_CONTENUS = new Set([
  "joint_oui",
  "poutrelles_en_l",
  "poutrelles_rectilignes",
  "poutrelles_a_sceller",
  "spot_252_blanc",
  "spot_252_rvb",
  "spot_3_blanc",
  "spot_9_rvb",
]);

/** Visuel par essence de bois, page 40. */
export const VISUEL_PAR_ESSENCE: Record<string, string> = {
  "Pin Rouge 13cm": "essence-pin-13.jpg",
  "Pin Rouge 6,5cm": "essence-pin-65.jpg",
  "Bilinga 13 cm": "essence-bilinga-13.jpg",
};

/** Texte du catalogue par essence, page 40, abrégé. */
export const TEXTE_PAR_ESSENCE: Record<string, string> = {
  "Pin Rouge 13cm":
    "Pin Rouge du Nord, profil 130 mm. Densité plus importante grâce aux conditions du grand nord. Traité autoclave, il passe en classe 4 (très durable).",
  "Pin Rouge 6,5cm":
    "Pin Rouge du Nord, profil 65 mm. Profil étroit, pour plus de finesse dans le design.",
  "Bilinga 13 cm":
    "Bois exotique d'Afrique, profil 130 mm. Naturellement classe 4, sans traitement. Dépourvu de nœuds.",
};

/**
 * Les cinq modeles du deviseur. Seul Bahia est charge en v1 : le code accueille les
 * autres sans reecriture, il ne les invente pas.
 */
export interface FicheModele {
  code: string;
  nom: string;
  forme: string;
  visuel: string;
  page: number;
  actif: boolean;
  variantes: number;
}

export const MODELES: FicheModele[] = [
  { code: "bahia", nom: "Bahia", forme: "Carrée", visuel: "modele-bahia.jpg", page: 13, actif: true, variantes: 12 },
  { code: "atoll", nom: "Atoll", forme: "Octogonale ronde", visuel: "modele-atoll.jpg", page: 9, actif: false, variantes: 18 },
  { code: "classy", nom: "Classy", forme: "Rectangulaire", visuel: "modele-classy.jpg", page: 17, actif: false, variantes: 27 },
  { code: "fidji", nom: "Fidji", forme: "Hexagonale asymétrique", visuel: "modele-fidji.jpg", page: 21, actif: false, variantes: 18 },
  { code: "longhi", nom: "Longhi", forme: "Octogonale allongée", visuel: "modele-longhi.jpg", page: 25, actif: false, variantes: 18 },
];

export function visuel(fichier: string | undefined): string | undefined {
  return fichier ? `/visuels/${fichier}` : undefined;
}
