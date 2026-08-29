import { createContext, useContext, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Entete from "./composants/Entete";
import GardeFou from "./composants/GardeFou";
import Admin from "./pages/Admin";
import ChoixModele from "./pages/ChoixModele";
import Configurateur from "./pages/Configurateur";
import PageDevis from "./pages/Devis";
import { useConfigurateur, type EtatConfigurateur } from "./etat/useConfigurateur";

const Contexte = createContext<EtatConfigurateur | null>(null);

export function useAtelier(): EtatConfigurateur {
  const etat = useContext(Contexte);
  if (!etat) throw new Error("useAtelier hors du fournisseur");
  return etat;
}

/** Un changement d'ecran ramene en haut de page. */
function RetourEnHaut() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <GardeFou>
      <Atelier />
    </GardeFou>
  );
}

function Atelier() {
  const etat = useConfigurateur();

  return (
    <Contexte.Provider value={etat}>
      <RetourEnHaut />
      <Entete />
      <Routes>
        <Route path="/" element={<ChoixModele />} />
        <Route path="/configurer" element={<Configurateur />} />
        <Route path="/devis" element={<PageDevis />} />
        <Route path="/administration" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Contexte.Provider>
  );
}
