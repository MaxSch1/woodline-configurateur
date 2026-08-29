import type { ReactNode } from "react";
import { ContexteAtelier } from "./contexte";
import { useConfigurateur } from "./useConfigurateur";

/** Ce module n'exporte qu'un composant — voir la regle dans `contexte.ts`. */
export default function FournisseurAtelier({ children }: { children: ReactNode }) {
  const etat = useConfigurateur();
  return <ContexteAtelier.Provider value={etat}>{children}</ContexteAtelier.Provider>;
}
