import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CATALOGUE_ORIGINE } from "../donnees/catalogue";
import { calculerDevis } from "../moteur/prix";
import { genererDevisPdf, nomDuFichier } from "./devisPdf";

/**
 * Fumigation du generateur PDF. Il tourne normalement dans le navigateur ; ici on
 * lui sert le logo depuis le disque pour verifier qu'il produit bien un document.
 * Poser WOODLINE_PDF_OUT ecrit le fichier a ce chemin, pour l'inspecter a l'oeil.
 */
const demo = CATALOGUE_ORIGINE.demo_configuration;
const devis = calculerDevis(CATALOGUE_ORIGINE, { variante: demo.variante, choix: demo.choix }, [
  { libelle: "Livraison", montant: 450 },
  { libelle: "Terrassement", montant: 1800 },
  { libelle: "Dalle de béton", montant: 2400 },
  { libelle: "Montage", montant: 3200 },
  { libelle: "Remise", montant: -900 },
]);

beforeAll(() => {
  const logo = readFileSync(resolve(__dirname, "../../public/visuels/logo-woodline.png"));
  vi.stubGlobal("fetch", async () => ({
    ok: true,
    blob: async () => new Blob([logo], { type: "image/png" }),
  }));
  if (typeof globalThis.FileReader === "undefined") {
    class LecteurMinimal {
      result: string | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      async readAsDataURL(blob: Blob) {
        const octets = Buffer.from(await blob.arrayBuffer());
        this.result = `data:image/png;base64,${octets.toString("base64")}`;
        this.onload?.();
      }
    }
    vi.stubGlobal("FileReader", LecteurMinimal);
  }
});

describe("Génération du PDF", () => {
  it("produit un document A4 non vide", async () => {
    const doc = await genererDevisPdf({
      catalogue: CATALOGUE_ORIGINE,
      devis,
      client: { nom: "Dupont", adresse: "Rue de l'Étang 4, 4210 Burdinne", telephone: "", email: "" },
      revendeur: {
        nom: "Piscines du Condroz",
        adresse: "Chaussée de Namur 12, 4210 Burdinne",
        telephone: "081 24 14 17",
        email: "contact@example.be",
        numero: "BE 0669.725.216",
        validite: "30 jours",
      },
      date: "29/08/2026",
    });

    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    const sortie = doc.output("arraybuffer");
    expect(sortie.byteLength).toBeGreaterThan(20_000);

    const chemin = process.env.WOODLINE_PDF_OUT;
    if (chemin) writeFileSync(chemin, Buffer.from(sortie));
  });

  it("nomme le fichier d'après le bassin et le client", () => {
    expect(nomDuFichier(devis, { nom: "Dupont", adresse: "", telephone: "", email: "" })).toBe(
      "devis-woodline-bahia-400x400-Dupont.pdf",
    );
  });

  it("porte bien le bloc revendeur dans les totaux", () => {
    expect(devis.totalInstallation).toBe(6950);
    expect(devis.totalGeneral).toBe(25703);
  });
});
