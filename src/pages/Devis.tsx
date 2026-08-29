import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { useAtelier } from "../etat/contexte";
import { LOGO } from "../donnees/presentation";
import {
  formaterEuros,
  intituleLigne,
  lignesImprimables,
  sectionsImprimables,
} from "../moteur/prix";

/**
 * Ecran 3. L'apercu a l'ecran est deja la page imprimee : memes sections, memes
 * sous-totaux, meme ordre que la feuille « Bahia devis » du classeur. Le bloc
 * revendeur est editable et s'ajoute au total, comme dans le fichier d'origine.
 */
export default function PageDevis() {
  const {
    catalogue,
    devis,
    blocRevendeur,
    majLigneRevendeur,
    client,
    setClient,
    revendeur,
    setRevendeur,
  } = useAtelier();
  const [enCours, setEnCours] = useState(false);
  const date = new Date().toLocaleDateString("fr-BE");

  const telecharger = async () => {
    setEnCours(true);
    try {
      // Chargement a la demande : jsPDF pese 400 Ko, il n'a rien a faire dans le
      // paquet initial que le revendeur telecharge pour configurer.
      const { genererDevisPdf, nomDuFichier } = await import("../pdf/devisPdf");
      const doc = await genererDevisPdf({ catalogue, devis, client, revendeur, date });
      doc.save(nomDuFichier(devis, client));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <main className="page-devis">
      <div className="page-devis__barre">
        <Link to="/configurer" className="bouton">
          ← Revenir à la configuration
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="bouton" onClick={() => window.print()}>
            Imprimer
          </button>
          <button
            type="button"
            className="bouton bouton--primaire"
            onClick={telecharger}
            disabled={enCours}
          >
            {enCours ? "Génération…" : "Télécharger le PDF"}
          </button>
        </div>
      </div>

      <article className="feuille">
        <header className="feuille__entete">
          <img src={LOGO} alt="Wood-Line" className="feuille__logo" />
          <h1 className="feuille__modele">{catalogue.modele.nom}</h1>
          <div className="feuille__meta">
            Date : {date}
            <br />
            Tarif {catalogue.meta.version_tarif}
            <br />
            {catalogue.meta.tva}
          </div>
        </header>

        <div className="feuille__parties">
          <section>
            <p className="partie__titre">Revendeur</p>
            <Champ etiquette="Nom" valeur={revendeur.nom} onChange={(v) => setRevendeur({ ...revendeur, nom: v })} />
            <Champ etiquette="Adresse" valeur={revendeur.adresse} onChange={(v) => setRevendeur({ ...revendeur, adresse: v })} />
            <Champ etiquette="Téléphone" valeur={revendeur.telephone} onChange={(v) => setRevendeur({ ...revendeur, telephone: v })} />
            <Champ etiquette="Email" valeur={revendeur.email} onChange={(v) => setRevendeur({ ...revendeur, email: v })} />
            <Champ etiquette="N° d'entreprise" valeur={revendeur.numero} onChange={(v) => setRevendeur({ ...revendeur, numero: v })} />
            <Champ etiquette="Validité" valeur={revendeur.validite} onChange={(v) => setRevendeur({ ...revendeur, validite: v })} />
          </section>
          <section>
            <p className="partie__titre">Client</p>
            <Champ etiquette="Nom" valeur={client.nom} onChange={(v) => setClient({ ...client, nom: v })} />
            <Champ etiquette="Adresse" valeur={client.adresse} onChange={(v) => setClient({ ...client, adresse: v })} />
            <Champ etiquette="Téléphone" valeur={client.telephone} onChange={(v) => setClient({ ...client, telephone: v })} />
            <Champ etiquette="Email" valeur={client.email} onChange={(v) => setClient({ ...client, email: v })} />
          </section>
        </div>

        <table className="devis">
          <thead>
            <tr>
              <th>Étape</th>
              <th>Intitulé</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            {sectionsImprimables(devis).map((section) => (
                <Fragment key={section.id}>
                  <tr className="devis__section">
                    <td />
                    <td>{section.titre}</td>
                    <td className="chiffre">{formaterEuros(section.sousTotal)}</td>
                  </tr>
                  {lignesImprimables(section).map((ligne, i) => (
                    <tr className="devis__ligne" key={`${section.id}-${i}`}>
                      <td>{ligne.etape ?? ""}</td>
                      <td>
                        {intituleLigne(ligne)}
                        {ligne.quantite ? (
                          <span className="devis__precision"> × {ligne.quantite}</span>
                        ) : null}
                      </td>
                      <td className="chiffre">
                        {ligne.montant ? formaterEuros(ligne.montant) : "—"}
                      </td>
                    </tr>
                  ))}
                </Fragment>
            ))}
            <tr className="devis__prix-piscine">
              <td />
              <td>Prix de la piscine</td>
              <td className="chiffre">{formaterEuros(devis.prixDeLaPiscine)}</td>
            </tr>
          </tbody>
        </table>

        <p className="scene__source" style={{ marginTop: 8, textAlign: "right" }}>
          dont piscine et options de pose {formaterEuros(devis.piscineEtOptionsDePose)} ·
          accessoires {formaterEuros(devis.accessoires)}
        </p>

        <section className="revendeur">
          <p className="revendeur__titre">Réservé aux revendeurs</p>
          <p className="revendeur__note">{catalogue.bloc_revendeur.commentaire}</p>
          <div className="revendeur__lignes">
            {blocRevendeur.map((ligne, index) => (
              <div className="revendeur__ligne" key={ligne.libelle}>
                <label htmlFor={`revendeur-${index}`}>{ligne.libelle}</label>
                <input
                  id={`revendeur-${index}`}
                  type="number"
                  step="0.01"
                  value={ligne.montant === 0 ? "" : ligne.montant}
                  placeholder={ligne.libelle === "Remise" ? "montant négatif" : "0,00"}
                  onChange={(e) => majLigneRevendeur(index, Number(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>
          <div className="revendeur__sous-total">
            <span>Total installation</span>
            <span>{formaterEuros(devis.totalInstallation)}</span>
          </div>
        </section>

        <div className="total-general">
          <span className="total-general__libelle">Total piscine et installation</span>
          <span className="total-general__montant">{formaterEuros(devis.totalGeneral)}</span>
        </div>

        <footer className="feuille__pied">
          <span>Wood-Line — Wood-Pool SA, Burdinne</span>
          <span>{catalogue.meta.avertissement}</span>
        </footer>
      </article>
    </main>
  );
}

function Champ({
  etiquette,
  valeur,
  onChange,
}: {
  etiquette: string;
  valeur: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <div className="champ">
      <span className="champ__etiquette">{etiquette}</span>
      <input
        value={valeur}
        placeholder="à compléter"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
