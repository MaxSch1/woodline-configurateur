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

function fichiersSources(dossier: string, motif: RegExp): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) return fichiersSources(chemin, motif);
    return motif.test(entree.name) && !/\.test\.tsx?$/.test(entree.name) ? [chemin] : [];
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

    for (const fichier of fichiersSources(RACINE, /\.tsx$/)) {
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

  /**
   * Regression du 29/08/2026, second episode. `useEffect(() => window.scrollTo(0, 0), …)`
   * RETOURNE la valeur de `window.scrollTo`. Sur un navigateur standard c'est
   * `undefined` et rien ne casse ; des qu'une extension de defilement fluide remplace
   * `window.scrollTo` par une fonction qui retourne autre chose, React prend cette
   * valeur pour la fonction de nettoyage et leve `destroy is not a function`.
   *
   * Un effet a fleche concise est presque toujours ce piege. On les refuse tous : le
   * corps doit etre un bloc, et ne retourner qu'une fonction de nettoyage ou rien.
   */
  it("n'écrit jamais un useEffect à flèche concise", () => {
    const fautes: string[] = [];

    for (const fichier of fichiersSources(RACINE, /\.tsx?$/)) {
      const source = readFileSync(fichier, "utf-8");
      for (const ligne of source.split("\n")) {
        // Les commentaires parlent du piege, ils ne le commettent pas.
        if (/^\s*(\/\/|\*|\/\*)/.test(ligne)) continue;
        // `useEffect(() =>` non suivi d'une accolade ouvrante sur la meme ligne.
        if (/useEffect\(\s*\(\s*\)\s*=>\s*[^{\s]/.test(ligne)) {
          fautes.push(`${relative(RACINE, fichier)} : ${ligne.trim()}`);
        }
      }
    }

    expect(fautes, fautes.join("\n")).toEqual([]);
  });
});
