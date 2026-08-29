import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression du 29/08/2026 : `App.tsx` exportait a la fois le composant `App` et le
 * hook `useAtelier`. C'est incompatible avec le Fast Refresh de React — Vite le disait
 * a chaque edition, « Could not Fast Refresh ("useAtelier" export is incompatible) ».
 * Consequence pour l'utilisateur : apres une modification, un navigateur deja ouvert
 * restait sur un melange d'anciens et de nouveaux modules, `useAtelier` ne retrouvait
 * plus son fournisseur, et l'ecran tombait en panne.
 *
 * Ce test empeche la faute de revenir. Il ne remplace pas un linter, il ferme la porte
 * par laquelle on est deja passe.
 */
const RACINE = resolve(__dirname);

function fichiersSources(dossier: string): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) return fichiersSources(chemin);
    return /\.tsx$/.test(entree.name) && !/\.test\.tsx$/.test(entree.name) ? [chemin] : [];
  });
}

/** Les exports d'un module, par nom. */
function exports(source: string): string[] {
  const noms: string[] = [];
  const motifs = [
    /export\s+(?:default\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /export\s+(?:const|let|class)\s+([A-Za-z_$][\w$]*)/g,
  ];
  for (const motif of motifs) {
    for (const trouve of source.matchAll(motif)) noms.push(trouve[1]);
  }
  return noms;
}

describe("Hygiène des modules React", () => {
  it("ne mélange jamais composants et hooks dans un même fichier .tsx", () => {
    const fautes: string[] = [];

    for (const fichier of fichiersSources(RACINE)) {
      const noms = exports(readFileSync(fichier, "utf-8"));
      const composants = noms.filter((n) => /^[A-Z]/.test(n));
      const hooks = noms.filter((n) => /^use[A-Z]/.test(n));
      if (composants.length > 0 && hooks.length > 0) {
        fautes.push(
          `${relative(RACINE, fichier)} exporte le composant ${composants[0]} ET le hook ${hooks[0]}`,
        );
      }
    }

    expect(fautes, fautes.join("\n")).toEqual([]);
  });
});
