import type { Phase } from "./types";

/**
 * Le decoupage du devis en sections, avec ses sous-totaux.
 *
 * Il n'est pas invente : il est releve cellule par cellule sur la feuille
 * « Bahia devis » du classeur, dans son ordre d'impression. La colonne de droite
 * donne la ligne du classeur ou le titre de section apparait, et les groupes
 * listes sont ceux que la formule SOMME de cette section additionne.
 *
 *   A11 Piscine selectionnee            H11 = D12
 *   A15 Options suivant Type de pose    H15 = SOMME(D16:D18)
 *   A19 Options courantes               H19 = SOMME(D20:D25)   <- voir NOTE
 *   A27 Feutres                         H27 = SOMME(D28:D29)
 *   A30 Couvertures                     H30 = SOMME(D31:D35)
 *   A36 Pompe a chaleur                 H36 = SOMME(D37:D40)
 *   A41 Options                         H41 = SOMME(D42:D50)
 *   A51 Accessoires: Technique de l'eau H51 = SOMME(D52:D58)
 *   A59 Locaux Techniques               H59 = SOMME(D60)
 *   A61 Aquabike                        H61 = SOMME(D62:D63)
 *   A64 Accessoires: Robots             H64 = SOMME(D65:D66)
 *   A67 Douches                         H67 = SOMME(D68:D69)
 *   A70 Caches                          H70 = SOMME(D71:D72)
 *   A73 Pompe de relevage               H73 = SOMME(D74)
 *   D77 Prix de la piscine              = SOMME(D12:D76)
 *
 * NOTE, a signaler au client : dans le classeur, le sous-total « Options courantes »
 * (H19) additionne D20:D25 et laisse donc la telecommande (D26, 125 EUR) EN DEHORS de
 * son sous-total. Le total general D77, lui, balaye D12:D76 et la reprend bien : le
 * prix final du classeur est juste, c'est le sous-total de section qui est court de
 * 125 EUR. Ici la telecommande est dans sa section, donc « Options courantes » vaut
 * 865 EUR la ou le classeur affiche 740 EUR. Les trois totaux de reference sont
 * identiques au centime.
 */
export interface DefinitionSection {
  id: string;
  titre: string;
  phase: Phase;
  /** Les groupes de la section, dans l'ordre d'impression du classeur. */
  groupes: string[];
}

export const SECTIONS_DEVIS: DefinitionSection[] = [
  {
    id: "piscine",
    titre: "Piscine sélectionnée",
    phase: "commande",
    groupes: ["liner"],
  },
  {
    id: "pose",
    titre: "Options suivant type de pose",
    phase: "commande",
    groupes: ["joint_peripherique", "pack_poutrelles", "blochets_margelles"],
  },
  {
    id: "courantes",
    titre: "Options courantes",
    phase: "commande",
    groupes: ["margelles_ipe", "escalier", "volet", "spot", "telecommande"],
  },
  {
    id: "feutres",
    titre: "Feutres",
    phase: "ulterieur",
    groupes: ["feutre_parois", "feutre_sol"],
  },
  {
    id: "couvertures",
    titre: "Couvertures",
    phase: "ulterieur",
    groupes: [
      "couverture",
      "couverture_bulle",
      "enrouleur",
      "moteur_enrouleur",
      "supports_muraux",
    ],
  },
  {
    id: "pac",
    titre: "Pompe à chaleur",
    phase: "ulterieur",
    groupes: ["pompe_a_chaleur", "kit_by_pass", "pieds_pac", "enjoliveur_pac"],
  },
  {
    id: "options",
    titre: "Options",
    phase: "ulterieur",
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
    ],
  },
  {
    id: "eau",
    titre: "Accessoires : technique de l'eau",
    phase: "ulterieur",
    groupes: ["traitement_easy", "accessoires_eau"],
  },
  {
    id: "locaux",
    titre: "Locaux techniques",
    phase: "ulterieur",
    groupes: ["local_technique"],
  },
  {
    id: "aquabike",
    titre: "Aquabike",
    phase: "ulterieur",
    groupes: ["aquabike"],
  },
  {
    id: "robots",
    titre: "Accessoires : robots",
    phase: "ulterieur",
    groupes: ["robot", "set_nettoyage"],
  },
  {
    id: "douches",
    titre: "Douches",
    phase: "ulterieur",
    groupes: ["douche", "caillebotis"],
  },
  {
    id: "caches",
    titre: "Caches",
    phase: "ulterieur",
    groupes: ["cache_ncc", "cache_poutrelle"],
  },
  {
    id: "relevage",
    titre: "Pompe de relevage",
    phase: "ulterieur",
    groupes: ["pompe_relevage"],
  },
];

/** Le numero d'etape imprime en colonne A du devis, quand le classeur en affiche un. */
export const ETAPE_PAR_GROUPE: Record<string, string> = {
  joint_peripherique: "Étape 5",
  pack_poutrelles: "Étape 6",
  blochets_margelles: "Étape 7.1",
  margelles_ipe: "Étape 7.2",
  escalier: "Étape 8",
  volet: "Étape 9",
  spot: "Étape 10",
};

const index = new Map<string, DefinitionSection>();
for (const section of SECTIONS_DEVIS) {
  for (const groupe of section.groupes) index.set(groupe, section);
}

export function sectionDuGroupe(groupeId: string): DefinitionSection | undefined {
  return index.get(groupeId);
}
