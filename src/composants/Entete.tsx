import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAtelier } from "../App";
import { formaterEuros } from "../moteur/prix";

/**
 * L'en-tete porte le total en permanence : c'est la promesse de l'outil.
 * Le montant clignote en orange une demi-seconde a chaque fois qu'il bouge,
 * pour que le geste du revendeur se voie a l'ecran tourne vers le client.
 */
export default function Entete() {
  const { devis, catalogue } = useAtelier();
  const emplacement = useLocation();
  const surAccueil = emplacement.pathname === "/";

  const [bouge, setBouge] = useState(false);
  const precedent = useRef(devis.prixDeLaPiscine);

  useEffect(() => {
    if (precedent.current === devis.prixDeLaPiscine) return;
    precedent.current = devis.prixDeLaPiscine;
    setBouge(true);
    const minuteur = window.setTimeout(() => setBouge(false), 550);
    return () => window.clearTimeout(minuteur);
  }, [devis.prixDeLaPiscine]);

  return (
    <header className="entete">
      <Link to="/" className="entete__marque">
        <img src="/visuels/logo-woodline.png" alt="Wood-Line" className="entete__logo" />
        <span className="entete__intitule">
          Configurateur
          <br />
          revendeur
        </span>
      </Link>

      {!surAccueil && (
        <div>
          <div className="entete__modele">{catalogue.modele.nom}</div>
          <div className="entete__variante">
            {devis.variante.taille} · {devis.variante.hauteur} · {devis.variante.essence}
          </div>
        </div>
      )}

      <div className="entete__espace" />

      <nav className="entete__nav">
        <NavLink to="/" end className={({ isActive }) => onglet(isActive)}>
          Modèles
        </NavLink>
        <NavLink to="/configurer" className={({ isActive }) => onglet(isActive)}>
          Configurer
        </NavLink>
        <NavLink to="/devis" className={({ isActive }) => onglet(isActive)}>
          Devis
        </NavLink>
        <NavLink to="/administration" className={({ isActive }) => onglet(isActive)}>
          Tarifs
        </NavLink>
      </nav>

      {!surAccueil && (
        <div className="entete__total">
          <span className="entete__total-libelle">Prix de la piscine</span>
          <span
            className={`entete__total-montant${bouge ? " entete__total-montant--bouge" : ""}`}
          >
            {formaterEuros(devis.prixDeLaPiscine)}
          </span>
        </div>
      )}
    </header>
  );
}

function onglet(actif: boolean): string {
  return `onglet${actif ? " onglet--actif" : ""}`;
}
