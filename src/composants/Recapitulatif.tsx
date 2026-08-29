import { Link } from "react-router-dom";
import { useAtelier } from "../etat/contexte";
import {
  formaterEuros,
  intituleLigne,
  lignesImprimables,
  sectionsImprimables,
} from "../moteur/prix";

/**
 * Le recapitulatif colle a droite et se lit exactement comme le devis final :
 * memes intitules, memes sections, memes sous-totaux. Ce que le revendeur voit
 * pendant qu'il configure est deja la page qu'il imprimera.
 */
export default function Recapitulatif() {
  const { devis, catalogue, chargerDemonstration, reinitialiser } = useAtelier();
  const sectionsPleines = sectionsImprimables(devis);

  return (
    <aside className="recap">
      <h2 className="recap__titre">Votre devis</h2>
      <p className="recap__source">
        Tarif public {catalogue.meta.version_tarif} · {catalogue.meta.tva}
      </p>

      {sectionsPleines.map((section) => (
        <div className="recap__section" key={section.id}>
          <div className="recap__section-entete">
            <span className="recap__section-titre">{section.titre}</span>
            <span className="recap__section-total chiffre">
              {formaterEuros(section.sousTotal)}
            </span>
          </div>
          {lignesImprimables(section).map((ligne, i) => (
            <div className="recap__ligne" key={`${ligne.groupeId}-${ligne.optionId}-${i}`}>
              <span className="recap__ligne-texte">
                {intituleLigne(ligne)}
                {ligne.quantite ? ` × ${ligne.quantite}` : ""}
              </span>
              <span
                className={`recap__ligne-montant${ligne.montant ? "" : " recap__ligne-montant--nul"}`}
              >
                {ligne.montant ? formaterEuros(ligne.montant) : "—"}
              </span>
            </div>
          ))}
        </div>
      ))}

      <div className="recap__masses">
        <div className="recap__masse">
          <span>Piscine et options de pose</span>
          <span className="chiffre">{formaterEuros(devis.piscineEtOptionsDePose)}</span>
        </div>
        <div className="recap__masse">
          <span>Accessoires</span>
          <span className="chiffre">{formaterEuros(devis.accessoires)}</span>
        </div>
        <div className="recap__total">
          <span className="recap__total-libelle">Prix de la piscine</span>
          <span className="recap__total-montant">{formaterEuros(devis.prixDeLaPiscine)}</span>
        </div>
        <div className="recap__tvac">TVA comprise</div>
      </div>

      <div className="recap__actions">
        <Link to="/devis" className="bouton bouton--primaire" style={{ justifyContent: "center" }}>
          Voir le devis
        </Link>
        <button
          type="button"
          className="bouton bouton--discret bouton--petit"
          style={{ justifyContent: "center" }}
          onClick={chargerDemonstration}
          title={catalogue.demo_configuration.commentaire}
        >
          Rejouer le devis enregistré du classeur
        </button>
        <button
          type="button"
          className="bouton bouton--discret bouton--petit"
          style={{ justifyContent: "center" }}
          onClick={reinitialiser}
        >
          Repartir de zéro
        </button>
      </div>
    </aside>
  );
}
