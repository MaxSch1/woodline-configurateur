import { useNavigate } from "react-router-dom";
import { MODELES, visuel } from "../donnees/presentation";
import { useAtelier } from "../etat/contexte";

/**
 * Ecran 1. Une seule carte active — Bahia, entierement chargee depuis le seed.
 * Les quatre autres sont visibles et grisees : la trajectoire est montree sans
 * mentir sur ce qui est fait.
 */
export default function ChoixModele() {
  const naviguer = useNavigate();
  const { catalogue } = useAtelier();

  return (
    <main className="modeles">
      <h1 className="modeles__titre">Configurez votre piscine</h1>
      <p className="modeles__chapeau">
        Choisissez le modèle, puis laissez-vous guider par les dix étapes du catalogue
        Wood-Line. Le prix se met à jour à chaque choix, et le devis est prêt à imprimer
        à la fin.
      </p>

      <div className="modeles__grille">
        {MODELES.map((modele) => (
          <article
            key={modele.code}
            className={`carte-modele ${modele.actif ? "carte-modele--actif" : "carte-modele--bientot"}`}
          >
            <img
              src={visuel(modele.visuel)}
              alt={`Piscine ${modele.nom}`}
              className="carte-modele__image"
            />
            <div className="carte-modele__corps">
              <h2 className="carte-modele__nom">{modele.nom}</h2>
              <p className="carte-modele__forme">{modele.forme}</p>
              <div className="carte-modele__pied">
                <span className={`jeton ${modele.actif ? "jeton--actif" : "jeton--bientot"}`}>
                  {modele.actif ? "Disponible" : "Bientôt"}
                </span>
                <span>
                  {modele.variantes} variantes · catalogue p. {modele.page}
                </span>
              </div>
              {modele.actif && (
                <button
                  type="button"
                  className="bouton bouton--primaire"
                  style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
                  onClick={() => naviguer("/configurer")}
                >
                  Configurer une {modele.nom}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="encart">
        <strong>Version de démonstration.</strong> Seul le modèle Bahia est chargé, avec ses
        12 variantes, ses 40 groupes d'options et ses {" "}
        {catalogue.groupes.reduce((n, g) => n + g.options.length, 0)} options, repris au
        centime du deviseur {catalogue.meta.version_tarif}. Les quatre autres modèles suivent
        la même structure : le code les accueille sans réécriture.
      </p>
    </main>
  );
}
