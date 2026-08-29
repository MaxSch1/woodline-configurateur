import { useMemo, useState } from "react";
import { useAtelier } from "../App";
import {
  CATALOGUE_ORIGINE,
  ecrireGrille,
  effacerGrille,
  listerPrix,
} from "../donnees/catalogue";
import { formaterEuros } from "../moteur/prix";

/**
 * Ecran 4. La demonstration tient en un geste : on change un prix, on publie, et
 * le configurateur l'applique tout de suite. Plus de fichier a renvoyer a
 * personne, plus de revendeur qui travaille sur une version perimee.
 *
 * v1 : la grille publiee vit dans le navigateur (localStorage). En production elle
 * ira dans Supabase, avec une date de validite et un historique — la forme des
 * cles de prix ne change pas.
 */
export default function Admin() {
  const { grille } = useAtelier();
  const lignes = useMemo(() => listerPrix(grille), [grille]);

  const [brouillon, setBrouillon] = useState<Record<string, number>>(
    () => ({ ...grille.surcharges }),
  );
  const [recherche, setRecherche] = useState("");
  const [famille, setFamille] = useState("toutes");
  const [publieeA, setPublieeA] = useState<string | null>(grille.publieeLe);

  const familles = ["toutes", "Piscine", "À la commande", "Accessoire"];

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return lignes.filter((ligne) => {
      if (famille !== "toutes" && ligne.famille !== famille) return false;
      if (!q) return true;
      return (
        ligne.libelle.toLowerCase().includes(q) ||
        ligne.groupe.toLowerCase().includes(q) ||
        ligne.contexte.toLowerCase().includes(q)
      );
    });
  }, [lignes, recherche, famille]);

  const enAttente = useMemo(() => {
    const cles = new Set([...Object.keys(brouillon), ...Object.keys(grille.surcharges)]);
    let n = 0;
    for (const cle of cles) if (brouillon[cle] !== grille.surcharges[cle]) n += 1;
    return n;
  }, [brouillon, grille.surcharges]);

  const nombreModifies = Object.keys(brouillon).length;

  const saisir = (cle: string, origine: number, valeur: string) => {
    const montant = Number(valeur.replace(",", "."));
    setBrouillon((precedent) => {
      const suivant = { ...precedent };
      if (valeur.trim() === "" || !Number.isFinite(montant) || montant === origine) {
        delete suivant[cle];
      } else {
        suivant[cle] = montant;
      }
      return suivant;
    });
  };

  const publier = () => {
    const maintenant = new Date().toISOString();
    ecrireGrille({
      version: CATALOGUE_ORIGINE.meta.version_tarif,
      publieeLe: maintenant,
      publieePar: "Administration Wood-Pool",
      surcharges: brouillon,
    });
    setPublieeA(maintenant);
    window.dispatchEvent(new Event("woodline:grille-publiee"));
  };

  const revenirAuTarifOrigine = () => {
    effacerGrille();
    setBrouillon({});
    setPublieeA(null);
    window.dispatchEvent(new Event("woodline:grille-publiee"));
  };

  return (
    <main className="admin">
      <div className="admin__entete">
        <div>
          <h1 className="admin__titre">Grille tarifaire</h1>
          <p className="admin__chapeau">
            {lignes.length} prix pour le modèle {CATALOGUE_ORIGINE.modele.nom}, tels
            qu'extraits du deviseur {CATALOGUE_ORIGINE.meta.version_tarif}. Modifiez une
            valeur, publiez : tous les revendeurs configurent sur la nouvelle grille à la
            seconde suivante. Plus rien à renvoyer par mail.
          </p>
        </div>
      </div>

      <div className={`bandeau-grille${enAttente > 0 ? " bandeau-grille--modifiee" : ""}`}>
        <span className="bandeau-grille__pastille" />
        <strong>
          {enAttente > 0
            ? `${enAttente} prix modifié${enAttente > 1 ? "s" : ""}, pas encore publié${enAttente > 1 ? "s" : ""}`
            : publieeA
              ? `Grille publiée · ${nombreModifies} prix modifié${nombreModifies > 1 ? "s" : ""}`
              : "Grille d'origine du deviseur"}
        </strong>
        <span style={{ color: "var(--encre-douce)" }}>
          {publieeA
            ? `dernière publication le ${new Date(publieeA).toLocaleString("fr-BE")}`
            : `version ${CATALOGUE_ORIGINE.meta.version_tarif}`}
        </span>
        <span className="bandeau-grille__espace" />
        {(nombreModifies > 0 || publieeA) && (
          <button type="button" className="bouton bouton--petit" onClick={revenirAuTarifOrigine}>
            Revenir au tarif d'origine
          </button>
        )}
        <button
          type="button"
          className="bouton bouton--primaire"
          onClick={publier}
          disabled={enAttente === 0}
        >
          Publier la grille
        </button>
      </div>

      <div className="admin__filtres">
        <input
          type="search"
          value={recherche}
          placeholder="Chercher une option, un groupe, une taille…"
          onChange={(e) => setRecherche(e.target.value)}
        />
        <select value={famille} onChange={(e) => setFamille(e.target.value)}>
          {familles.map((f) => (
            <option key={f} value={f}>
              {f === "toutes" ? "Toutes les familles" : f}
            </option>
          ))}
        </select>
      </div>

      <table className="table-admin">
        <thead>
          <tr>
            <th>Famille</th>
            <th>Groupe</th>
            <th>Intitulé</th>
            <th>Bassin</th>
            <th style={{ textAlign: "right" }}>Tarif {CATALOGUE_ORIGINE.meta.version_tarif}</th>
            <th style={{ textAlign: "right" }}>Nouveau prix</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((ligne) => {
            const modifiee = brouillon[ligne.cle] !== undefined;
            return (
              <tr key={ligne.cle} className={modifiee ? "modifiee" : ""}>
                <td>
                  <span
                    className={`jeton ${
                      ligne.famille === "Accessoire" ? "jeton--ulterieur" : "jeton--commande"
                    }`}
                  >
                    {ligne.famille}
                  </span>
                </td>
                <td className="table-admin__groupe">{ligne.groupe}</td>
                <td>{ligne.libelle}</td>
                <td className="table-admin__contexte">{ligne.contexte}</td>
                <td className="table-admin__origine">{formaterEuros(ligne.origine)}</td>
                <td className="table-admin__saisie">
                  <input
                    type="number"
                    step="0.01"
                    value={brouillon[ligne.cle] ?? ligne.origine}
                    onChange={(e) => saisir(ligne.cle, ligne.origine, e.target.value)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {visibles.length === 0 && <p className="vide">Aucun prix ne correspond à cette recherche.</p>}

      <p className="admin__pied">
        {visibles.length} ligne{visibles.length > 1 ? "s" : ""} affichée
        {visibles.length > 1 ? "s" : ""} sur {lignes.length}. Version de démonstration : la
        grille publiée est conservée dans ce navigateur. En production elle vivra dans la base,
        avec sa date de validité et son historique.
      </p>
    </main>
  );
}
