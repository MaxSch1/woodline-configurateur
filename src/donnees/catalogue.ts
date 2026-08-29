import seed from "./bahia.seed.json";
import {
  TEXTES_ACCENTUES,
  libelleGroupe,
  libelleOption,
  libelleRevendeur,
} from "./libelles";
import { cleTarif } from "../moteur/prix";
import type { Catalogue, Groupe, Option } from "../moteur/types";

/**
 * Le catalogue vit en JSON versionne, tel qu'extrait du classeur du client.
 * Rien n'est recalcule ici : on se contente d'appliquer, quand il y en a, les
 * surcharges de prix publiees depuis la page d'administration.
 *
 * Bascule Supabase (hors v1) : `catalogueDeReference()` deviendra un appel reseau,
 * `GrilleTarifaire` une ligne de table, et rien d'autre ne bouge.
 */

const SEED = seed as unknown as Catalogue;

/**
 * Le catalogue de reference : le seed, avec ses libelles reaccentues.
 * Prix, identifiants et structure sont ceux du seed, intacts.
 */
export const CATALOGUE_ORIGINE: Catalogue = {
  ...SEED,
  meta: { ...SEED.meta, avertissement: TEXTES_ACCENTUES["meta:avertissement"] },
  bloc_revendeur: {
    commentaire: TEXTES_ACCENTUES["revendeur:commentaire"],
    lignes: SEED.bloc_revendeur.lignes.map(libelleRevendeur),
  },
  groupes: SEED.groupes.map((groupe) => ({
    ...groupe,
    libelle: libelleGroupe(groupe.id, groupe.libelle),
    options: groupe.options.map((option) => ({
      ...option,
      libelle: libelleOption(option.id, option.libelle),
    })),
  })),
};

/** Une grille tarifaire = la version d'origine plus les prix qu'on a republies. */
export interface GrilleTarifaire {
  version: string;
  publieeLe: string | null;
  publieePar: string | null;
  /** cle de prix -> montant. Voir `clePrixVariante` et `clePrixOption`. */
  surcharges: Record<string, number>;
}

const CLE_STOCKAGE = "woodline.grille-tarifaire";

export function grilleVierge(): GrilleTarifaire {
  return {
    version: CATALOGUE_ORIGINE.meta.version_tarif,
    publieeLe: null,
    publieePar: null,
    surcharges: {},
  };
}

export function clePrixVariante(numero: number): string {
  return `variante:${numero}`;
}

export function clePrixOption(
  groupe: Groupe,
  option: Option,
  cle: string | null,
): string {
  return `option:${groupe.id}:${option.id}:${cle ?? "fixe"}`;
}

export function lireGrille(): GrilleTarifaire {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return grilleVierge();
    const grille = JSON.parse(brut) as GrilleTarifaire;
    return { ...grilleVierge(), ...grille, surcharges: grille.surcharges ?? {} };
  } catch {
    return grilleVierge();
  }
}

export function ecrireGrille(grille: GrilleTarifaire): void {
  localStorage.setItem(CLE_STOCKAGE, JSON.stringify(grille));
}

export function effacerGrille(): void {
  localStorage.removeItem(CLE_STOCKAGE);
}

/** Applique les surcharges publiees et rend un catalogue pret pour le moteur. */
export function construireCatalogue(grille: GrilleTarifaire): Catalogue {
  const surcharges = grille.surcharges;
  if (Object.keys(surcharges).length === 0) return CATALOGUE_ORIGINE;

  return {
    ...CATALOGUE_ORIGINE,
    variantes: CATALOGUE_ORIGINE.variantes.map((variante) => {
      const remplacement = surcharges[clePrixVariante(variante.numero)];
      return remplacement === undefined
        ? variante
        : { ...variante, prix_public: remplacement };
    }),
    groupes: CATALOGUE_ORIGINE.groupes.map((groupe) => ({
      ...groupe,
      options: groupe.options.map((option) => surchargerOption(groupe, option, surcharges)),
    })),
  };
}

function surchargerOption(
  groupe: Groupe,
  option: Option,
  surcharges: Record<string, number>,
): Option {
  if (option.prix === null || option.disponible === false) return option;

  if (typeof option.prix === "number") {
    const cle = clePrixOption(groupe, option, "fixe");
    const remplacement = surcharges[cle];
    return remplacement === undefined ? option : { ...option, prix: remplacement };
  }

  let touche = false;
  const grille: Record<string, number> = { ...option.prix };
  for (const cle of Object.keys(grille)) {
    const remplacement = surcharges[clePrixOption(groupe, option, cle)];
    if (remplacement !== undefined) {
      grille[cle] = remplacement;
      touche = true;
    }
  }
  return touche ? { ...option, prix: grille } : option;
}

/** Une ligne du tableau de la page d'administration. */
export interface LignePrix {
  cle: string;
  famille: string;
  groupeId: string;
  groupe: string;
  libelle: string;
  /** Le bassin concerne : « toutes tailles », « 400 x 400 », « 400 x 400 · H 143 cm ». */
  contexte: string;
  origine: number;
  courant: number;
}

/** Toutes les cases de prix du modele, mises a plat. */
export function listerPrix(grille: GrilleTarifaire): LignePrix[] {
  const lignes: LignePrix[] = [];
  const surcharges = grille.surcharges;

  for (const variante of CATALOGUE_ORIGINE.variantes) {
    const cle = clePrixVariante(variante.numero);
    lignes.push({
      cle,
      famille: "Piscine",
      groupeId: "__piscine__",
      groupe: `${CATALOGUE_ORIGINE.modele.nom} — prix public`,
      libelle: `N° ${variante.numero} · ${variante.essence}`,
      contexte: `${variante.taille} · ${variante.hauteur}`,
      origine: variante.prix_public,
      courant: surcharges[cle] ?? variante.prix_public,
    });
  }

  for (const groupe of CATALOGUE_ORIGINE.groupes) {
    for (const option of groupe.options) {
      if (option.prix === null || option.disponible === false) continue;
      const famille = groupe.phase === "commande" ? "À la commande" : "Accessoire";

      if (typeof option.prix === "number") {
        const cle = clePrixOption(groupe, option, "fixe");
        lignes.push({
          cle,
          famille,
          groupeId: groupe.id,
          groupe: groupe.libelle,
          libelle: option.libelle,
          contexte: "toutes tailles",
          origine: option.prix,
          courant: surcharges[cle] ?? option.prix,
        });
        continue;
      }

      for (const [cleTarifaire, montant] of Object.entries(option.prix)) {
        const cle = clePrixOption(groupe, option, cleTarifaire);
        lignes.push({
          cle,
          famille,
          groupeId: groupe.id,
          groupe: groupe.libelle,
          libelle: option.libelle,
          contexte: cleTarifaire.replace("|", " · "),
          origine: montant,
          courant: surcharges[cle] ?? montant,
        });
      }
    }
  }
  return lignes;
}

/** La cle de prix qui s'applique a une option pour un bassin donne. */
export function clePrixCourante(
  groupe: Groupe,
  option: Option,
  variante: { taille: string; hauteur: string },
): string {
  return clePrixOption(
    groupe,
    option,
    typeof option.prix === "number" || option.prix === null
      ? "fixe"
      : cleTarif(groupe, variante as never),
  );
}
