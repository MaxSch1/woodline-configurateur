import { createContext, useContext } from "react";
import type { EtatConfigurateur } from "./useConfigurateur";

/**
 * Le contexte de l'atelier et son hook — dans un module SANS composant, et c'est
 * le point important.
 *
 * Ils vivaient au depart dans `App.tsx`, a cote du composant `App`. Un fichier qui
 * exporte a la fois un composant et un hook est incompatible avec le Fast Refresh de
 * React : Vite le disait a chaque edition, « Could not Fast Refresh ("useAtelier")
 * export is incompatible ». Consequence concrete, constatee le 29/08/2026 : apres une
 * modification de `App.tsx`, un navigateur deja ouvert restait sur un melange d'anciens
 * et de nouveaux modules, `useAtelier` ne retrouvait plus son fournisseur et levait.
 * L'ecran tombait alors en panne — page blanche avant le garde-fou, ecran d'erreur
 * apres.
 *
 * Regle a tenir, verifiee par `src/hygiene.test.ts` : un module exporte SOIT des
 * composants, SOIT des hooks et des contextes. Jamais les deux. Le fournisseur, qui est
 * un composant, vit donc dans `FournisseurAtelier.tsx`.
 */
export const ContexteAtelier = createContext<EtatConfigurateur | null>(null);

export function useAtelier(): EtatConfigurateur {
  const etat = useContext(ContexteAtelier);
  if (!etat) {
    throw new Error(
      "useAtelier a été appelé hors de FournisseurAtelier. " +
        "Si cela arrive en développement juste après une modification, rechargez la page : " +
        "il s'agit d'un rechargement à chaud incomplet.",
    );
  }
  return etat;
}
