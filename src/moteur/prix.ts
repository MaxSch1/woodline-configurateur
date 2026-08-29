import type {
  Catalogue,
  Choix,
  Configuration,
  Devis,
  Groupe,
  LigneDevis,
  LigneRevendeur,
  Option,
  SectionDevis,
  Variante,
} from "./types";
import { ETAPE_PAR_GROUPE, SECTIONS_DEVIS, sectionDuGroupe } from "./sections";

/**
 * MOTEUR DE PRIX — module pur.
 *
 * Aucune dependance a React ni au DOM : c'est lui qui sera reutilise tel quel pour
 * les quatre autres modeles et pour l'API. Il ne recalcule rien, n'arrondit aucun
 * tarif et n'applique aucune marge : le seed fait foi.
 *
 * Test d'acceptation : `src/moteur/acceptation.test.ts` rejoue l'etat enregistre du
 * classeur du client et doit sortir 12 231,00 / 6 522,00 / 18 753,00 EUR.
 */

/** Arrondi comptable au centime, insensible a la derive des flottants. */
export function auCentime(montant: number): number {
  return Math.round((montant + Number.EPSILON) * 100) / 100;
}

export function formaterEuros(montant: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(montant);
}

/** La cle d'un prix dependant du bassin, dans la forme utilisee par le seed. */
export function cleTarif(groupe: Groupe, variante: Variante): string | null {
  switch (groupe.tarification) {
    case "par_taille":
      return variante.taille;
    case "par_taille_hauteur":
      return `${variante.taille}|${variante.hauteur}`;
    default:
      return null;
  }
}

/**
 * Le prix unitaire d'une option pour un bassin donne.
 *
 * C'est ici, et nulle part ailleurs, que se traite le fait qu'une meme option
 * n'a pas le meme prix selon la taille et la hauteur du bassin. Le joint
 * peripherique vaut 168 EUR en 300x300 et 216 EUR en 400x400 ; l'escalier toute
 * largeur passe de 1 785 a 2 090 EUR selon taille et hauteur.
 */
export function prixOption(
  option: Option,
  groupe: Groupe,
  variante: Variante,
): number {
  if (option.disponible === false) {
    throw new Error(
      `Option indisponible sur ce modele : ${option.id} (${option.motif ?? "sans motif"})`,
    );
  }
  const prix = option.prix;
  if (prix === null || prix === undefined) return 0;
  if (typeof prix === "number") return prix;

  const cle = cleTarif(groupe, variante);
  if (cle === null) {
    throw new Error(
      `Le groupe ${groupe.id} porte une grille de prix mais une tarification « ${groupe.tarification} ».`,
    );
  }
  const montant = prix[cle];
  if (montant === undefined) {
    throw new Error(
      `Aucun prix pour ${option.id} a la cle « ${cle} » (groupe ${groupe.id}).`,
    );
  }
  return montant;
}

/** Une option est-elle proposable sur ce modele ? */
export function estDisponible(option: Option): boolean {
  return option.disponible !== false;
}

export function indexerGroupes(catalogue: Catalogue): Map<string, Groupe> {
  return new Map(catalogue.groupes.map((g) => [g.id, g]));
}

export function trouverVariante(catalogue: Catalogue, numero: number): Variante {
  const variante = catalogue.variantes.find((v) => v.numero === numero);
  if (!variante) throw new Error(`Variante inconnue : ${numero}`);
  return variante;
}

/**
 * Traduit le choix fait sur un groupe en lignes de devis.
 * Un choix vide (false, null, [], « sans » non tarifie) ne produit aucune ligne.
 */
function lignesDuGroupe(
  groupe: Groupe,
  choix: Choix,
  variante: Variante,
): LigneDevis[] {
  if (choix === false || choix === null || choix === undefined) return [];
  if (Array.isArray(choix) && choix.length === 0) return [];

  const options = new Map(groupe.options.map((o) => [o.id, o]));
  const etape = ETAPE_PAR_GROUPE[groupe.id] ?? null;

  const ligne = (
    option: Option,
    quantite: number | null,
    precision: string | null,
  ): LigneDevis => {
    const unitaire = prixOption(option, groupe, variante);
    const facteur = quantite ?? 1;
    return {
      groupeId: groupe.id,
      optionId: option.id,
      etape,
      libelle: groupe.libelle,
      precision,
      quantite,
      prixUnitaire: unitaire,
      montant: auCentime(unitaire * facteur),
    };
  };

  if (choix === true) {
    // Case a cocher : le groupe ne porte qu'une option, celle qui est cochee.
    const option = groupe.options[0];
    return [ligne(option, null, option.libelle)];
  }

  if (typeof choix === "string") {
    const option = options.get(choix);
    if (!option) throw new Error(`Option inconnue « ${choix} » dans ${groupe.id}.`);
    return [ligne(option, null, option.libelle)];
  }

  if (Array.isArray(choix)) {
    return choix.map((id) => {
      const option = options.get(id);
      if (!option) throw new Error(`Option inconnue « ${id} » dans ${groupe.id}.`);
      return ligne(option, null, option.libelle);
    });
  }

  const option = options.get(choix.option);
  if (!option) throw new Error(`Option inconnue « ${choix.option} » dans ${groupe.id}.`);
  // L'option « Sans … » d'un groupe a quantite n'est jamais multipliee.
  const quantite = option.ignore_quantite ? 0 : choix.quantite;
  return [ligne(option, quantite, option.libelle)];
}

/**
 * Toutes les lignes de la configuration, dans l'ordre d'impression du devis.
 * La premiere est toujours la piscine elle-meme.
 */
export function lignesConfiguration(
  catalogue: Catalogue,
  configuration: Configuration,
): LigneDevis[] {
  const variante = trouverVariante(catalogue, configuration.variante);
  const groupes = indexerGroupes(catalogue);

  const lignes: LigneDevis[] = [
    {
      groupeId: "__piscine__",
      optionId: null,
      etape: null,
      libelle: catalogue.modele.nom,
      precision: `${variante.taille} · ${variante.hauteur} · ${variante.essence}`,
      quantite: null,
      prixUnitaire: variante.prix_public,
      montant: variante.prix_public,
    },
  ];

  for (const section of SECTIONS_DEVIS) {
    for (const groupeId of section.groupes) {
      const groupe = groupes.get(groupeId);
      if (!groupe) continue;
      lignes.push(...lignesDuGroupe(groupe, configuration.choix[groupeId] ?? null, variante));
    }
  }
  return lignes;
}

/**
 * Le devis complet : sections, sous-totaux, les deux masses du classeur,
 * puis le bloc revendeur et le total general.
 */
export function calculerDevis(
  catalogue: Catalogue,
  configuration: Configuration,
  blocRevendeur: LigneRevendeur[] = [],
): Devis {
  const variante = trouverVariante(catalogue, configuration.variante);
  const lignes = lignesConfiguration(catalogue, configuration);

  const parSection = new Map<string, LigneDevis[]>();
  for (const ligne of lignes) {
    if (ligne.groupeId === "__piscine__") {
      pousser(parSection, "piscine", ligne);
      continue;
    }
    const section = sectionDuGroupe(ligne.groupeId);
    if (!section) {
      throw new Error(
        `Le groupe ${ligne.groupeId} n'appartient a aucune section du devis.`,
      );
    }
    pousser(parSection, section.id, ligne);
  }

  const sections: SectionDevis[] = SECTIONS_DEVIS.map((definition) => {
    const lignesSection = parSection.get(definition.id) ?? [];
    return {
      id: definition.id,
      titre: definition.titre,
      phase: definition.phase,
      lignes: lignesSection,
      sousTotal: auCentime(lignesSection.reduce((t, l) => t + l.montant, 0)),
    };
  });

  const sommeDesPhases = (phase: "commande" | "ulterieur") =>
    auCentime(
      sections
        .filter((s) => s.phase === phase)
        .reduce((total, s) => total + s.sousTotal, 0),
    );

  const piscineEtOptionsDePose = sommeDesPhases("commande");
  const accessoires = sommeDesPhases("ulterieur");
  const prixDeLaPiscine = auCentime(piscineEtOptionsDePose + accessoires);
  const totalInstallation = auCentime(
    blocRevendeur.reduce((total, l) => total + (Number.isFinite(l.montant) ? l.montant : 0), 0),
  );

  return {
    sections,
    piscineEtOptionsDePose,
    accessoires,
    prixDeLaPiscine,
    totalInstallation,
    totalGeneral: auCentime(prixDeLaPiscine + totalInstallation),
    blocRevendeur,
    variante,
  };
}

/**
 * Les lignes qu'on IMPRIME, par opposition a celles qu'on calcule.
 *
 * Le classeur imprime toutes les lignes, y compris les vingt « Sans robot »,
 * « Pas de couverture hivernale » a 0 EUR : dans une cellule Excel ca ne coute rien,
 * sur un devis remis a un client ca noie l'offre. On garde donc les lignes qui
 * portent un montant, plus la piscine elle-meme et son liner, qui sont descriptifs.
 *
 * Cette regle ne touche AUCUN total : les sous-totaux et les trois masses sont
 * calcules sur toutes les lignes, avant filtrage. Un test le verifie.
 * A confirmer avec le client — voir docs/questions-client.md.
 */
export function lignesImprimables(section: SectionDevis): LigneDevis[] {
  return section.lignes.filter(
    (l) => l.montant !== 0 || l.groupeId === "__piscine__" || l.groupeId === "liner",
  );
}

/**
 * L'intitule imprime pour une ligne.
 *
 * Le classeur affiche le groupe en colonne B et l'option choisie en colonne C
 * (« Escalier sous liner » / « Aucun », « Pack poutrelles supplementaire* » /
 * « rectilignes »). Ici on reunit les deux, sauf quand l'intitule de l'option
 * reprend deja celui du groupe — auquel cas le repeter serait du bruit.
 */
export function intituleLigne(ligne: LigneDevis): string {
  const option = ligne.precision ?? ligne.libelle;
  if (ligne.groupeId === "__piscine__") return option;
  const plier = (t: string) =>
    t
      .normalize("NFD")
      .replace(/\p{Mn}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  return plier(option).includes(plier(ligne.libelle))
    ? option
    : `${ligne.libelle} · ${option}`;
}

/** Les sections qui ont quelque chose a montrer. */
export function sectionsImprimables(devis: Devis): SectionDevis[] {
  return devis.sections.filter((s) => lignesImprimables(s).length > 0);
}

function pousser(carte: Map<string, LigneDevis[]>, cle: string, ligne: LigneDevis) {
  const existant = carte.get(cle);
  if (existant) existant.push(ligne);
  else carte.set(cle, [ligne]);
}
