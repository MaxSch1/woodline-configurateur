/**
 * Modele de donnees du deviseur Wood-Line.
 *
 * Il reprend, sans le reinterpreter, celui du seed extrait du classeur
 * « 2025 03 20  DEVISEUR Tarifs PARTICULIERS V06.xlsm ».
 * Le seed fait foi : aucun prix n'est recalcule, arrondi ni marge ici.
 */

/** Taille de bassin, telle qu'ecrite dans le classeur : « 300 x 300 », « 400 x 400 ». */
export type Taille = string;
/** Hauteur de parois, telle qu'ecrite dans le classeur : « H 130 cm », « H 143 cm ». */
export type Hauteur = string;

/**
 * Comment lire le prix d'une option.
 * C'est le piege numero un du portage : une meme option ne vaut pas le meme prix
 * d'un bassin a l'autre. Il se traite ici, jamais dans l'interface.
 */
export type Tarification =
  | "aucune" /** option sans prix (le liner, dont les 5 coloris sont au meme tarif) */
  | "fixe" /** un nombre, valable quel que soit le bassin */
  | "par_taille" /** un prix par taille */
  | "par_taille_hauteur"; /** un prix par couple taille|hauteur */

export type TypeGroupe =
  | "choix_unique" /** une option parmi N (liste deroulante du classeur) */
  | "booleen" /** une case a cocher */
  | "booleens_multiples" /** plusieurs cases a cocher independantes */
  | "choix_unique_avec_quantite"; /** une option parmi N, multipliee par une quantite */

/**
 * Distinction explicite du client, isolee en R100/R101 de la feuille « Bahia suite » :
 * ce qui doit etre tranche a la commande, et ce qui peut s'ajouter plus tard.
 */
export type Phase = "commande" | "ulterieur";

/** Le prix brut tel qu'il vit dans le seed. */
export type PrixBrut = number | Record<string, number> | null;

export interface Option {
  id: string;
  libelle: string;
  prix: PrixBrut;
  /** false = l'option n'existe pas sur ce modele. Motif obligatoire dans ce cas. */
  disponible?: boolean;
  motif?: string;
  /** Option « Sans … » d'un groupe a quantite : la quantite ne la multiplie pas. */
  ignore_quantite?: boolean;
}

export interface Groupe {
  id: string;
  /** Numero d'etape du catalogue papier (2 a 10), ou null pour un accessoire. */
  etape: number | null;
  phase: Phase;
  type: TypeGroupe;
  libelle: string;
  tarification: Tarification;
  quantite_defaut?: number;
  options: Option[];
}

export interface Variante {
  numero: number;
  taille: Taille;
  hauteur: Hauteur;
  essence: string;
  prix_public: number;
}

export interface Modele {
  code: string;
  nom: string;
  forme: string;
  kit_hydraulique: string | null;
  regles_modele: string[];
}

export interface MetaCatalogue {
  source: string;
  version_tarif: string;
  extrait_le: string;
  devise: string;
  tva: string;
  avertissement: string;
  total_demo_attendu: number;
}

export interface Catalogue {
  meta: MetaCatalogue;
  modele: Modele;
  variantes: Variante[];
  groupes: Groupe[];
  bloc_revendeur: { commentaire: string; lignes: string[] };
  sections_devis: string[];
  demo_configuration: DemoConfiguration;
}

/** Ce que le revendeur a choisi pour un groupe. */
export type Choix =
  | string /** choix_unique : l'id de l'option */
  | boolean /** booleen : coche ou non */
  | string[] /** booleens_multiples : les ids coches */
  | { option: string; quantite: number } /** choix_unique_avec_quantite */
  | null;

export interface Configuration {
  variante: number;
  choix: Record<string, Choix>;
}

export interface DemoConfiguration extends Configuration {
  commentaire: string;
  totaux_attendus: {
    piscine_et_options_de_pose: number;
    accessoires: number;
    prix_de_la_piscine: number;
  };
}

/** Une ligne du devis, telle qu'elle sera imprimee. */
export interface LigneDevis {
  groupeId: string;
  optionId: string | null;
  /** « Etape 5 », « Etape 7.1 »… quand le classeur en affiche une. */
  etape: string | null;
  libelle: string;
  /** Precision affichee en colonne C du devis Excel (le coloris, la variante choisie). */
  precision: string | null;
  quantite: number | null;
  prixUnitaire: number;
  montant: number;
}

export interface SectionDevis {
  id: string;
  titre: string;
  phase: Phase;
  lignes: LigneDevis[];
  sousTotal: number;
}

/** Une ligne du bloc « Reserve aux revendeurs », saisie a la main. */
export interface LigneRevendeur {
  libelle: string;
  montant: number;
}

export interface Devis {
  sections: SectionDevis[];
  /** Feuille Bahia!AW28 : la piscine et tout ce qui se tranche a la commande. */
  piscineEtOptionsDePose: number;
  /** Feuille 'Bahia suite'!BK74 : tout ce qui peut s'ajouter plus tard. */
  accessoires: number;
  /** Feuille 'Bahia devis'!D77. */
  prixDeLaPiscine: number;
  /** Feuille 'Bahia devis'!B89. */
  totalInstallation: number;
  /** Feuille 'Bahia devis'!B93. */
  totalGeneral: number;
  blocRevendeur: LigneRevendeur[];
  variante: Variante;
}
