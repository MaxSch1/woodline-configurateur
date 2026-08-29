import { describe, expect, it } from "vitest";
import seed from "../donnees/bahia.seed.json";
import { SECTIONS_DEVIS } from "./sections";
import {
  auCentime,
  calculerDevis,
  formaterEuros,
  lignesImprimables,
  prixOption,
  trouverVariante,
} from "./prix";
import type { Catalogue, Configuration } from "./types";

const catalogue = seed as unknown as Catalogue;
const demo = catalogue.demo_configuration;
const attendus = demo.totaux_attendus;

const configurationDemo: Configuration = {
  variante: demo.variante,
  choix: demo.choix,
};

describe("Acceptation — l'etat enregistre du classeur du client", () => {
  /**
   * LA regle non negociable. Le bloc demo_configuration du seed est l'etat enregistre
   * du fichier Excel de Wood-Pool au 20/03/2025. Si un seul centime derive, le moteur
   * est faux : le dirigeant ouvrira son classeur en face.
   */
  it("sort exactement 12 231,00 / 6 522,00 / 18 753,00 EUR", () => {
    const devis = calculerDevis(catalogue, configurationDemo);

    console.log("");
    console.log("  ┌─ Bahia 400 x 400 · H 143 cm · Pin Rouge 13cm ─────────────┐");
    console.log(`  │ piscine et options de pose : ${cadrer(devis.piscineEtOptionsDePose)} │`);
    console.log(`  │ accessoires                : ${cadrer(devis.accessoires)} │`);
    console.log(`  │ prix de la piscine         : ${cadrer(devis.prixDeLaPiscine)} │`);
    console.log("  └───────────────────────────────────────────────────────────┘");
    console.log("");

    expect(devis.piscineEtOptionsDePose).toBe(attendus.piscine_et_options_de_pose);
    expect(devis.accessoires).toBe(attendus.accessoires);
    expect(devis.prixDeLaPiscine).toBe(attendus.prix_de_la_piscine);
    expect(devis.prixDeLaPiscine).toBe(catalogue.meta.total_demo_attendu);
  });

  it("retrouve le total par la somme des lignes, pas seulement par les sections", () => {
    const devis = calculerDevis(catalogue, configurationDemo);
    const sommeDesLignes = auCentime(
      devis.sections.flatMap((s) => s.lignes).reduce((t, l) => t + l.montant, 0),
    );
    expect(sommeDesLignes).toBe(attendus.prix_de_la_piscine);
  });

  it("reproduit les sous-totaux de section de la feuille « Bahia devis »", () => {
    const devis = calculerDevis(catalogue, configurationDemo);
    const parId = Object.fromEntries(devis.sections.map((s) => [s.id, s.sousTotal]));

    // Releves cellule par cellule sur la feuille du client (H11, H15, H27 …).
    expect(parId.piscine).toBe(10330);
    expect(parId.pose).toBe(1036);
    expect(parId.feutres).toBe(0);
    expect(parId.couvertures).toBe(1034);
    expect(parId.pac).toBe(99);
    expect(parId.options).toBe(2109);
    expect(parId.eau).toBe(219);
    expect(parId.locaux).toBe(1175);
    expect(parId.aquabike).toBe(999);
    expect(parId.robots).toBe(470);
    expect(parId.douches).toBe(0);
    expect(parId.caches).toBe(62);
    expect(parId.relevage).toBe(355);

    // Ecart connu et documente : le classeur affiche 740 en H19 parce que sa formule
    // SOMME(D20:D25) laisse la telecommande (D26, 125 EUR) hors du sous-total.
    // Son total general D77 la reprend bien. Ici la section est complete.
    expect(parId.courantes).toBe(865);
    expect(parId.courantes).toBe(740 + 125);
  });

  it("additionne le bloc revendeur au prix de la piscine", () => {
    // Les valeurs saisies dans le classeur de demonstration : B84..B88 puis B93.
    const devis = calculerDevis(catalogue, configurationDemo, [
      { libelle: "Livraison", montant: 1 },
      { libelle: "Terrassement", montant: 2 },
      { libelle: "Dalle de béton", montant: 3 },
      { libelle: "Montage", montant: 4 },
      { libelle: "Remise", montant: -7 },
    ]);
    expect(devis.totalInstallation).toBe(3);
    expect(devis.totalGeneral).toBe(18756);
  });
});

describe("Ce qui s'imprime", () => {
  it("ne change aucun total en masquant les lignes a 0 EUR", () => {
    const devis = calculerDevis(catalogue, configurationDemo);
    for (const section of devis.sections) {
      const filtre = auCentime(
        lignesImprimables(section).reduce((t, l) => t + l.montant, 0),
      );
      expect(filtre).toBe(section.sousTotal);
    }
    const total = auCentime(
      devis.sections
        .flatMap((s) => lignesImprimables(s))
        .reduce((t, l) => t + l.montant, 0),
    );
    expect(total).toBe(attendus.prix_de_la_piscine);
  });

  it("garde la piscine et son liner, qui sont descriptifs", () => {
    const devis = calculerDevis(catalogue, configurationDemo);
    const piscine = devis.sections.find((s) => s.id === "piscine")!;
    const imprimees = lignesImprimables(piscine).map((l) => l.groupeId);
    expect(imprimees).toContain("__piscine__");
    expect(imprimees).toContain("liner");
  });

  it("retire bien les « Sans … » a 0 EUR", () => {
    const devis = calculerDevis(catalogue, configurationDemo);
    const robots = devis.sections.find((s) => s.id === "robots")!;
    expect(robots.lignes).toHaveLength(1);
    expect(lignesImprimables(robots)).toHaveLength(1);
    const douches = devis.sections.find((s) => s.id === "douches")!;
    expect(douches.lignes.length).toBeGreaterThan(0);
    expect(lignesImprimables(douches)).toHaveLength(0);
  });
});

describe("Le piege numero un — un prix qui change selon le bassin", () => {
  const groupe = (id: string) => {
    const g = catalogue.groupes.find((x) => x.id === id);
    if (!g) throw new Error(`groupe ${id} introuvable`);
    return g;
  };

  it("tarifie le joint peripherique par taille", () => {
    const joint = groupe("joint_peripherique");
    const option = joint.options[0];
    expect(prixOption(option, joint, trouverVariante(catalogue, 1))).toBe(168); // 300x300
    expect(prixOption(option, joint, trouverVariante(catalogue, 10))).toBe(216); // 400x400
  });

  it("tarifie l'escalier toute largeur par taille ET par hauteur", () => {
    const escalier = groupe("escalier");
    const toute = escalier.options.find((o) => o.id === "escalier_toute_largeur")!;
    expect(prixOption(toute, escalier, trouverVariante(catalogue, 1))).toBe(1785); // 300 H130
    expect(prixOption(toute, escalier, trouverVariante(catalogue, 4))).toBe(1890); // 300 H143
    expect(prixOption(toute, escalier, trouverVariante(catalogue, 7))).toBe(1985); // 400 H130
    expect(prixOption(toute, escalier, trouverVariante(catalogue, 10))).toBe(2090); // 400 H143
  });

  it("refuse de chiffrer une option qui n'existe pas sur le modele", () => {
    const volet = groupe("volet");
    const immerge = volet.options.find((o) => o.id === "volet_plage_immerges")!;
    expect(immerge.disponible).toBe(false);
    expect(immerge.motif).toBe("non dispo sur Bahia");
    expect(() => prixOption(immerge, volet, trouverVariante(catalogue, 10))).toThrow();
  });

  it("ne multiplie pas l'option « Sans spot » par la quantite", () => {
    const devis = calculerDevis(catalogue, {
      variante: 10,
      choix: { spot: { option: "spot_sans", quantite: 4 } },
    });
    expect(devis.prixDeLaPiscine).toBe(10330);
  });

  it("multiplie bien les spots par leur quantite", () => {
    const devis = calculerDevis(catalogue, {
      variante: 10,
      choix: { spot: { option: "spot_252_rvb", quantite: 3 } },
    });
    expect(devis.prixDeLaPiscine).toBe(10330 + 345 * 3);
  });
});

describe("Integrite du catalogue", () => {
  it("range chacun des 40 groupes dans une section, et une seule", () => {
    const ranges = SECTIONS_DEVIS.flatMap((s) => s.groupes);
    expect(new Set(ranges).size).toBe(ranges.length);
    expect(new Set(ranges)).toEqual(new Set(catalogue.groupes.map((g) => g.id)));
    expect(catalogue.groupes).toHaveLength(40);
  });

  it("fait coincider la phase de chaque groupe avec celle de sa section", () => {
    for (const section of SECTIONS_DEVIS) {
      for (const groupeId of section.groupes) {
        const groupe = catalogue.groupes.find((g) => g.id === groupeId)!;
        expect(`${groupeId}:${groupe.phase}`).toBe(`${groupeId}:${section.phase}`);
      }
    }
  });

  it("donne un prix a chaque combinaison taille x hauteur des options tarifees", () => {
    for (const groupe of catalogue.groupes) {
      for (const option of groupe.options) {
        if (option.disponible === false) continue;
        for (const variante of catalogue.variantes) {
          expect(() => prixOption(option, groupe, variante)).not.toThrow();
        }
      }
    }
  });

  it("couvre les 12 variantes du modele Bahia", () => {
    expect(catalogue.variantes).toHaveLength(12);
    expect(new Set(catalogue.variantes.map((v) => v.numero)).size).toBe(12);
  });

  it("formate les montants a la belge", () => {
    expect(formaterEuros(18753).replace(/ | /g, " ")).toBe("18 753,00 €");
  });
});

function cadrer(montant: number): string {
  return formaterEuros(montant).replace(/ | /g, " ").padStart(28);
}
