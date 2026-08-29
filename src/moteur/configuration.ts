import { calculerDevis } from "./prix";
import type { Catalogue, Choix, Configuration, Groupe } from "./types";

/**
 * Integrite d'une configuration.
 *
 * Une configuration peut venir d'ailleurs que de l'ecran : du `localStorage` d'un
 * revendeur qui rouvre son portable, demain d'une ligne en base ou du corps d'une
 * requete. Elle n'est donc PAS digne de confiance : une variante disparue, une option
 * retiree du catalogue ou un choix de la mauvaise forme feraient lever le moteur.
 *
 * Le 29/08/2026, c'est exactement ce qui est arrive : une session enregistree pointant
 * une variante inexistante faisait lever `trouverVariante`, et toute l'application
 * tombait en page blanche. D'ou ce module — et le garde-fou dans `App.tsx`.
 *
 * Regle : on ne jette jamais toute la configuration pour un choix douteux, on remet ce
 * seul choix a sa valeur neutre.
 */

/** Les libelles par lesquels le client designe l'absence d'option. */
const LIBELLE_NEUTRE = /^(sans\b|pas de\b|pas d'|aucun\b|non fournies\b)/i;

/** Le choix neutre d'un groupe, ou null quand le revendeur doit trancher. */
export function choixParDefaut(groupe: Groupe): Choix {
  switch (groupe.type) {
    case "booleen":
      return false;
    case "booleens_multiples":
      return [];
    case "choix_unique": {
      const neutre = groupe.options.find((o) => LIBELLE_NEUTRE.test(o.libelle));
      return neutre ? neutre.id : null;
    }
    case "choix_unique_avec_quantite": {
      const neutre = groupe.options.find((o) => LIBELLE_NEUTRE.test(o.libelle));
      return neutre ? { option: neutre.id, quantite: groupe.quantite_defaut ?? 1 } : null;
    }
  }
}

export function configurationNeuve(catalogue: Catalogue): Configuration {
  const choix: Record<string, Choix> = {};
  for (const groupe of catalogue.groupes) choix[groupe.id] = choixParDefaut(groupe);
  return { variante: catalogue.variantes[0].numero, choix };
}

/** Une option utilisable : elle existe dans ce groupe et n'est pas indisponible. */
function optionUtilisable(groupe: Groupe, id: unknown): boolean {
  if (typeof id !== "string") return false;
  const option = groupe.options.find((o) => o.id === id);
  return option !== undefined && option.disponible !== false;
}

/** Le choix est-il d'une forme que le moteur sait chiffrer pour ce groupe ? */
export function choixValide(groupe: Groupe, choix: unknown): boolean {
  if (choix === null || choix === undefined) return true; // « pas encore repondu »
  switch (groupe.type) {
    case "booleen":
      // Cocher n'a de sens que si le groupe porte au moins une option disponible.
      return (
        typeof choix === "boolean" &&
        (choix === false || groupe.options.some((o) => o.disponible !== false))
      );
    case "booleens_multiples":
      return Array.isArray(choix) && choix.every((id) => optionUtilisable(groupe, id));
    case "choix_unique":
      return optionUtilisable(groupe, choix);
    case "choix_unique_avec_quantite":
      return (
        typeof choix === "object" &&
        choix !== null &&
        !Array.isArray(choix) &&
        optionUtilisable(groupe, (choix as { option?: unknown }).option) &&
        Number.isFinite((choix as { quantite?: unknown }).quantite) &&
        (choix as { quantite: number }).quantite >= 0
      );
  }
}

/**
 * Rend une configuration que le moteur sait chiffrer a coup sur.
 * Ce qui ne tient pas debout est remplace par le choix neutre du groupe, le reste est
 * conserve. `rejets` dit ce qui a ete ecarte, pour pouvoir le tracer.
 */
export function assainirConfiguration(
  catalogue: Catalogue,
  brut: unknown,
): { configuration: Configuration; rejets: string[] } {
  const rejets: string[] = [];
  const source = (brut ?? {}) as Partial<Configuration>;

  const varianteDemandee = source.variante;
  const varianteConnue = catalogue.variantes.some((v) => v.numero === varianteDemandee);
  if (varianteDemandee !== undefined && !varianteConnue) {
    rejets.push(`variante ${String(varianteDemandee)}`);
  }

  const choixSource = (source.choix ?? {}) as Record<string, unknown>;
  const choix: Record<string, Choix> = {};
  for (const groupe of catalogue.groupes) {
    const propose = choixSource[groupe.id];
    if (propose === undefined) {
      choix[groupe.id] = choixParDefaut(groupe);
    } else if (choixValide(groupe, propose)) {
      choix[groupe.id] = propose as Choix;
    } else {
      choix[groupe.id] = choixParDefaut(groupe);
      rejets.push(groupe.id);
    }
  }
  for (const id of Object.keys(choixSource)) {
    if (!catalogue.groupes.some((g) => g.id === id)) rejets.push(`groupe inconnu ${id}`);
  }

  return {
    configuration: {
      variante: varianteConnue ? (varianteDemandee as number) : catalogue.variantes[0].numero,
      choix,
    },
    rejets,
  };
}

/**
 * Une configuration restauree est-elle reellement chiffrable ?
 *
 * `assainirConfiguration` verifie la forme des choix, un a un. Ce garde-fou-ci verifie
 * le resultat : il fait tourner le moteur pour de vrai. C'est la seule facon de couvrir
 * ce qu'on n'a pas prevu — une regle metier future, un catalogue remanie, un cas qu'on
 * n'a pas imagine. Ce qui compte pour un outil pilote devant un client, c'est qu'il
 * reparte, pas qu'il ait raison sur la cause.
 */
export function restaurerConfiguration(
  catalogue: Catalogue,
  brut: unknown,
): { configuration: Configuration; rejets: string[] } {
  const { configuration, rejets } = assainirConfiguration(catalogue, brut);
  try {
    calculerDevis(catalogue, configuration);
    return { configuration, rejets };
  } catch (erreur) {
    return {
      configuration: configurationNeuve(catalogue),
      rejets: [
        ...rejets,
        `configuration abandonnée (${erreur instanceof Error ? erreur.message : String(erreur)})`,
      ],
    };
  }
}
