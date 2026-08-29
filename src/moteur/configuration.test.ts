import { describe, expect, it } from "vitest";
import seed from "../donnees/bahia.seed.json";
import {
  assainirConfiguration,
  choixParDefaut,
  choixValide,
  configurationNeuve,
  restaurerConfiguration,
} from "./configuration";
import { calculerDevis } from "./prix";
import type { Catalogue } from "./types";

const catalogue = seed as unknown as Catalogue;
const groupe = (id: string) => catalogue.groupes.find((g) => g.id === id)!;

/**
 * Regression du 29/08/2026 : une session enregistree pointant une variante
 * inexistante faisait lever le moteur et toute l'application tombait en page
 * blanche. Aucune configuration venue du stockage ne doit plus pouvoir faire ca.
 */
describe("Une configuration venue du stockage ne doit jamais faire tomber le moteur", () => {
  const chiffrable = (brut: unknown) => {
    const { configuration } = assainirConfiguration(catalogue, brut);
    return () => calculerDevis(catalogue, configuration);
  };

  it("remplace une variante inexistante par la premiere", () => {
    const { configuration, rejets } = assainirConfiguration(catalogue, {
      variante: 99,
      choix: {},
    });
    expect(configuration.variante).toBe(1);
    expect(rejets).toContain("variante 99");
    expect(chiffrable({ variante: 99, choix: {} })).not.toThrow();
  });

  it("remplace un choix qui vise une option disparue", () => {
    const { configuration, rejets } = assainirConfiguration(catalogue, {
      variante: 1,
      choix: { liner: "liner_turquoise" },
    });
    expect(configuration.choix.liner).toBe(null);
    expect(rejets).toContain("liner");
  });

  it("remplace un choix de la mauvaise forme", () => {
    const { rejets } = assainirConfiguration(catalogue, {
      variante: 1,
      choix: { volet: "oui", spot: "pas-un-objet", accessoires_eau: "photometre" },
    });
    expect(rejets).toEqual(expect.arrayContaining(["volet", "spot", "accessoires_eau"]));
  });

  it("refuse un choix qui viserait une option indisponible sur ce modele", () => {
    expect(choixValide(groupe("volet"), "volet_plage_immerges")).toBe(false);
    expect(
      choixValide(groupe("accessoires_eau"), ["photometre", "volet_plage_immerges"]),
    ).toBe(false);
  });

  it("survit a n'importe quelle saleté", () => {
    for (const saleté of [null, undefined, 0, "", [], { choix: null }, { choix: 42 }]) {
      expect(chiffrable(saleté)).not.toThrow();
    }
  });

  it("garde intacts les choix qui tiennent debout", () => {
    const demo = catalogue.demo_configuration;
    const { configuration, rejets } = assainirConfiguration(catalogue, {
      variante: demo.variante,
      choix: demo.choix,
    });
    expect(rejets).toEqual([]);
    const devis = calculerDevis(catalogue, configuration);
    expect(devis.prixDeLaPiscine).toBe(18753);
  });

  it("signale un groupe qui n'existe plus au catalogue", () => {
    const { rejets } = assainirConfiguration(catalogue, {
      variante: 1,
      choix: { groupe_supprime_en_2024: true },
    });
    expect(rejets).toContain("groupe inconnu groupe_supprime_en_2024");
  });
});

describe("Choix par défaut", () => {
  it("prend l'option neutre quand le client en propose une", () => {
    expect(choixParDefaut(groupe("escalier"))).toBe("escalier_aucun");
    expect(choixParDefaut(groupe("robot"))).toBe("robot_aucun");
    expect(choixParDefaut(groupe("pack_poutrelles"))).toBe("poutrelles_non_fournies");
    expect(choixParDefaut(groupe("joint_peripherique"))).toBe(false);
    expect(choixParDefaut(groupe("accessoires_eau"))).toEqual([]);
    expect(choixParDefaut(groupe("spot"))).toEqual({ option: "spot_sans", quantite: 2 });
  });

  it("laisse le revendeur trancher quand il n'y a pas de neutre", () => {
    expect(choixParDefaut(groupe("liner"))).toBe(null);
    expect(choixParDefaut(groupe("skimmer"))).toBe(null);
  });

  it("part d'une configuration neuve qui vaut le prix du kit nu", () => {
    const devis = calculerDevis(catalogue, configurationNeuve(catalogue));
    expect(devis.prixDeLaPiscine).toBe(8258.25);
    expect(devis.accessoires).toBe(0);
  });
});

describe("Restauration auto-réparante", () => {
  it("rend une configuration neuve quand la restaurée ne se chiffre pas", () => {
    /**
     * Un catalogue tordu exprès : le groupe booléen porte en PREMIER une option
     * indisponible. Le tamis de forme laisse passer `true` — cocher est légitime
     * puisqu'une option disponible existe — mais un moteur qui prendrait
     * `options[0]` les yeux fermés lèverait. C'est la forme exacte du bug qui a
     * mis l'écran en panne le 29/08/2026.
     */
    const tordu: Catalogue = {
      ...catalogue,
      groupes: [
        {
          id: "volet",
          etape: 9,
          phase: "commande",
          type: "booleen",
          libelle: "Volet",
          tarification: "fixe",
          options: [
            { id: "immerge", libelle: "Volet immergé", prix: null, disponible: false, motif: "non dispo" },
            { id: "hors_sol", libelle: "Volet hors sol", prix: 5040 },
          ],
        },
      ],
    };

    const { configuration, rejets } = restaurerConfiguration(tordu, {
      variante: 1,
      choix: { volet: true },
    });
    // Le moteur sait désormais prendre la première option DISPONIBLE : rien à réparer.
    expect(rejets).toEqual([]);
    expect(configuration.choix.volet).toBe(true);
    expect(calculerDevis(tordu, configuration).prixDeLaPiscine).toBe(8258.25 + 5040);
  });

  it("abandonne la configuration et repart neuve si le moteur lève quand même", () => {
    // Aucune option disponible du tout : cocher n'a plus de sens, le moteur lève,
    // et la restauration doit rendre la main sans casser l'écran.
    const impossible: Catalogue = {
      ...catalogue,
      groupes: [
        {
          id: "volet",
          etape: 9,
          phase: "commande",
          type: "booleen",
          libelle: "Volet",
          tarification: "fixe",
          options: [
            { id: "immerge", libelle: "Volet immergé", prix: null, disponible: false, motif: "non dispo" },
          ],
        },
      ],
    };

    // On force un choix que le tamis de forme refuserait, pour atteindre le moteur.
    const { configuration, rejets } = restaurerConfiguration(impossible, {
      variante: 1,
      choix: { volet: true },
    });
    expect(configuration.choix.volet).toBe(false);
    expect(rejets).toContain("volet");
    expect(() => calculerDevis(impossible, configuration)).not.toThrow();
  });

  it("garde la configuration de démonstration intacte", () => {
    const demo = catalogue.demo_configuration;
    const { configuration, rejets } = restaurerConfiguration(catalogue, {
      variante: demo.variante,
      choix: demo.choix,
    });
    expect(rejets).toEqual([]);
    expect(calculerDevis(catalogue, configuration).prixDeLaPiscine).toBe(18753);
  });
});
