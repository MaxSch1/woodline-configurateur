import { describe, expect, it } from "vitest";
import seed from "./bahia.seed.json";
import { CATALOGUE_ORIGINE, construireCatalogue, grilleVierge, listerPrix } from "./catalogue";
import { LIBELLES_ACCENTUES } from "./libelles";
import { calculerDevis } from "../moteur/prix";
import type { Catalogue } from "../moteur/types";

const brut = seed as unknown as Catalogue;

describe("Réaccentuation des libellés", () => {
  it("ne touche aucun prix, aucun identifiant, aucune structure", () => {
    expect(CATALOGUE_ORIGINE.groupes).toHaveLength(brut.groupes.length);
    for (const [i, groupe] of CATALOGUE_ORIGINE.groupes.entries()) {
      const source = brut.groupes[i];
      expect(groupe.id).toBe(source.id);
      expect(groupe.type).toBe(source.type);
      expect(groupe.phase).toBe(source.phase);
      expect(groupe.tarification).toBe(source.tarification);
      expect(groupe.options).toHaveLength(source.options.length);
      for (const [j, option] of groupe.options.entries()) {
        expect(option.id).toBe(source.options[j].id);
        expect(option.prix).toEqual(source.options[j].prix);
        expect(option.disponible).toBe(source.options[j].disponible);
      }
    }
    expect(CATALOGUE_ORIGINE.variantes).toEqual(brut.variantes);
  });

  it("ne change pas les trois totaux de reference", () => {
    const demo = CATALOGUE_ORIGINE.demo_configuration;
    const devis = calculerDevis(CATALOGUE_ORIGINE, {
      variante: demo.variante,
      choix: demo.choix,
    });
    expect(devis.piscineEtOptionsDePose).toBe(12231);
    expect(devis.accessoires).toBe(6522);
    expect(devis.prixDeLaPiscine).toBe(18753);
  });

  it("ne garde que des corrections qui visent un objet existant", () => {
    const ids = new Set<string>();
    for (const groupe of brut.groupes) {
      ids.add(`groupe:${groupe.id}`);
      for (const option of groupe.options) ids.add(`option:${option.id}`);
    }
    for (const cle of Object.keys(LIBELLES_ACCENTUES)) expect(ids).toContain(cle);
  });

  it("dit les mêmes mots, aux accents près", () => {
    const plier = (s: string) =>
      s
        .replace(/²/g, "2")
        .replace(/³/g, "3")
        .replace(/°/g, "")
        .replace(/œ/g, "oe")
        .normalize("NFD")
        .replace(/\p{Mn}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");

    for (const groupe of brut.groupes) {
      const corrige = LIBELLES_ACCENTUES[`groupe:${groupe.id}`];
      if (corrige) expect(plier(corrige)).toBe(plier(groupe.libelle));
      for (const option of groupe.options) {
        const corrigee = LIBELLES_ACCENTUES[`option:${option.id}`];
        if (corrigee) expect(plier(corrigee)).toBe(plier(option.libelle));
      }
    }
  });
});

describe("Grille tarifaire", () => {
  it("met a plat toutes les cases de prix du modele", () => {
    const lignes = listerPrix(grilleVierge());
    // 12 variantes + une entree par case de prix des options disponibles.
    const casesOptions = brut.groupes.flatMap((g) =>
      g.options
        .filter((o) => o.prix !== null && o.disponible !== false)
        .map((o) => (typeof o.prix === "number" ? 1 : Object.keys(o.prix!).length)),
    );
    const attendu = 12 + casesOptions.reduce((a, b) => a + b, 0);
    expect(lignes).toHaveLength(attendu);
    expect(new Set(lignes.map((l) => l.cle)).size).toBe(lignes.length);
  });

  it("applique une surcharge de prix au moteur, sans rien casser d'autre", () => {
    const demo = CATALOGUE_ORIGINE.demo_configuration;
    const config = { variante: demo.variante, choix: demo.choix };

    // La Bahia 400x400 H143 Pin Rouge 13cm passe de 10 330 a 10 830 EUR.
    const catalogue = construireCatalogue({
      ...grilleVierge(),
      surcharges: { "variante:10": 10830 },
    });
    const devis = calculerDevis(catalogue, config);
    expect(devis.piscineEtOptionsDePose).toBe(12731);
    expect(devis.accessoires).toBe(6522);
    expect(devis.prixDeLaPiscine).toBe(19253);
  });

  it("surcharge un prix qui depend de la taille sans toucher l'autre taille", () => {
    const catalogue = construireCatalogue({
      ...grilleVierge(),
      surcharges: { "option:joint_peripherique:joint_oui:400 x 400": 240 },
    });
    const joint = catalogue.groupes.find((g) => g.id === "joint_peripherique")!;
    expect(joint.options[0].prix).toEqual({ "300 x 300": 168, "400 x 400": 240 });
  });
});
