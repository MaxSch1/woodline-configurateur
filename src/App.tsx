import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Entete from "./composants/Entete";
import GardeFou from "./composants/GardeFou";
import FournisseurAtelier from "./etat/FournisseurAtelier";
import Admin from "./pages/Admin";
import ChoixModele from "./pages/ChoixModele";
import Configurateur from "./pages/Configurateur";
import PageDevis from "./pages/Devis";

/**
 * Ce module n'exporte QUE des composants — le contexte et le hook `useAtelier`
 * vivent dans `etat/contexte.tsx`. Voir l'explication la-bas : les melanger ici
 * cassait le Fast Refresh et mettait l'ecran en panne apres chaque edition.
 */

/** Un changement d'ecran ramene en haut de page. */
function RetourEnHaut() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <GardeFou>
      <FournisseurAtelier>
        <RetourEnHaut />
        <Entete />
        <Routes>
          <Route path="/" element={<ChoixModele />} />
          <Route path="/configurer" element={<Configurateur />} />
          <Route path="/devis" element={<PageDevis />} />
          <Route path="/administration" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </FournisseurAtelier>
    </GardeFou>
  );
}
