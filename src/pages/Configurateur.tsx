import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtelier } from "../etat/contexte";
import GroupeOptions from "../composants/GroupeOptions";
import Recapitulatif from "../composants/Recapitulatif";
import {
  ETAPES_ACCESSOIRES,
  ETAPES_COMMANDE,
  TEXTE_PAR_ESSENCE,
  TOUTES_LES_ETAPES,
  VISUEL_PAR_ESSENCE,
  visuel,
  type EtapeConfigurateur,
} from "../donnees/presentation";
import { auCentime, formaterEuros } from "../moteur/prix";

/**
 * Ecran 2. Le rail des etapes a gauche, les options au centre avec leur visuel,
 * le recapitulatif chiffre colle a droite. A chaque clic, le total bouge.
 * La numerotation des etapes est celle du catalogue papier, page pour page.
 */
export default function Configurateur() {
  const atelier = useAtelier();
  const { catalogue, configuration, devis, choisir, changerBassin } = atelier;
  const naviguer = useNavigate();
  const [etapeActive, setEtapeActive] = useState(TOUTES_LES_ETAPES[0].id);

  const etape = TOUTES_LES_ETAPES.find((e) => e.id === etapeActive) ?? TOUTES_LES_ETAPES[0];
  const index = TOUTES_LES_ETAPES.findIndex((e) => e.id === etape.id);
  const groupes = useMemo(
    () => new Map(catalogue.groupes.map((g) => [g.id, g])),
    [catalogue],
  );

  /** Ce que chaque etape pese dans le devis, affiche dans le rail. */
  const montantParEtape = useMemo(() => {
    const lignes = devis.sections.flatMap((s) => s.lignes);
    const total = new Map<string, number>();
    for (const e of TOUTES_LES_ETAPES) {
      const somme = lignes
        .filter((l) =>
          e.bassin === "dimension"
            ? l.groupeId === "__piscine__"
            : e.groupes.includes(l.groupeId),
        )
        .reduce((t, l) => t + l.montant, 0);
      total.set(e.id, auCentime(somme));
    }
    return total;
  }, [devis]);

  /**
   * Une etape de commande est « repondue » des que tous ses groupes ont un choix.
   * Une etape d'accessoires n'a rien d'obligatoire : elle ne se coche que si le
   * revendeur y a mis quelque chose. Sinon le rail dirait « fait » sur du vide.
   */
  const repondue = (e: EtapeConfigurateur) => {
    if (e.bassin !== undefined) return true;
    if (e.numero !== null) return e.groupes.every((id) => configuration.choix[id] !== null);
    return (montantParEtape.get(e.id) ?? 0) > 0;
  };

  return (
    <div className="atelier">
      <nav className="rail" aria-label="Étapes de configuration">
        <p className="rail__section">À valider à la commande</p>
        {ETAPES_COMMANDE.map((e) => (
          <BoutonEtape
            key={e.id}
            etape={e}
            actif={e.id === etape.id}
            complet={repondue(e)}
            montant={montantParEtape.get(e.id) ?? 0}
            onClick={() => setEtapeActive(e.id)}
          />
        ))}

        <div className="rail__separateur" />
        <p className="rail__section">Ajoutable plus tard</p>
        {ETAPES_ACCESSOIRES.map((e) => (
          <BoutonEtape
            key={e.id}
            etape={e}
            actif={e.id === etape.id}
            complet={repondue(e)}
            montant={montantParEtape.get(e.id) ?? 0}
            onClick={() => setEtapeActive(e.id)}
          />
        ))}
      </nav>

      <main className="scene">
        <p className="scene__fil">
          {etape.numero ? `Étape ${etape.numero}` : "Accessoires"}
        </p>
        <h1 className="scene__titre">{etape.titre}</h1>
        {etape.chapeau && <p className="scene__chapeau">{etape.chapeau}</p>}
        <p className="scene__source">
          Catalogue Wood-Line 2025, page {etape.page}
          {etape.numero === null && " et suivantes"}
        </p>

        {etape.visuel && (
          <img src={visuel(etape.visuel)} alt="" className="scene__banniere" />
        )}

        {etape.bassin === "dimension" && <ChoixDimension />}
        {etape.bassin === "essence" && <ChoixEssence />}

        {etape.groupes.map((id) => {
          const groupe = groupes.get(id);
          if (!groupe) return null;
          return (
            <GroupeOptions
              key={id}
              groupe={groupe}
              choix={configuration.choix[id] ?? null}
              variante={devis.variante}
              onChoisir={(choix) => choisir(id, choix)}
              compact={groupe.phase === "ulterieur" && groupe.options.length > 4}
            />
          );
        })}

        <div className="scene__pied">
          <button
            type="button"
            className="bouton"
            disabled={index === 0}
            onClick={() => setEtapeActive(TOUTES_LES_ETAPES[index - 1].id)}
          >
            ← Précédent
          </button>
          <span className="bloc__indice">
            Étape {index + 1} sur {TOUTES_LES_ETAPES.length}
          </span>
          {index < TOUTES_LES_ETAPES.length - 1 ? (
            <button
              type="button"
              className="bouton bouton--primaire"
              onClick={() => setEtapeActive(TOUTES_LES_ETAPES[index + 1].id)}
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              className="bouton bouton--primaire"
              onClick={() => naviguer("/devis")}
            >
              Établir le devis →
            </button>
          )}
        </div>
      </main>

      <Recapitulatif />
    </div>
  );

  /** Etape 2 : taille et hauteur de parois. */
  function ChoixDimension() {
    const tailles = [...new Set(catalogue.variantes.map((v) => v.taille))];
    const hauteurs = [...new Set(catalogue.variantes.map((v) => v.hauteur))];

    return (
      <div className="facettes">
        <section className="bloc">
          <div className="bloc__entete">
            <h3 className="bloc__titre">Taille du bassin</h3>
            <span className="bloc__indice">dimensions intérieures, en centimètres</span>
          </div>
          <div className="pastilles">
            {tailles.map((taille) => (
              <button
                key={taille}
                type="button"
                className={`pastille${devis.variante.taille === taille ? " pastille--choisie" : ""}`}
                onClick={() => changerBassin("taille", taille)}
              >
                {taille}
              </button>
            ))}
          </div>
        </section>

        <section className="bloc">
          <div className="bloc__entete">
            <h3 className="bloc__titre">Hauteur de parois</h3>
            <span className="bloc__indice">elle change aussi le prix de certaines options</span>
          </div>
          <div className="pastilles">
            {hauteurs.map((hauteur) => (
              <button
                key={hauteur}
                type="button"
                className={`pastille${devis.variante.hauteur === hauteur ? " pastille--choisie" : ""}`}
                onClick={() => changerBassin("hauteur", hauteur)}
              >
                {hauteur}
              </button>
            ))}
          </div>
        </section>

        <div className="tableau-prix-base">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Taille</th>
                <th>Hauteur</th>
                <th>Essence</th>
                <th>Prix public</th>
              </tr>
            </thead>
            <tbody>
              {catalogue.variantes.map((v) => (
                <tr key={v.numero} className={v.numero === devis.variante.numero ? "est-choisie" : ""}>
                  <td>{v.numero}</td>
                  <td>{v.taille}</td>
                  <td>{v.hauteur}</td>
                  <td>{v.essence}</td>
                  <td className="chiffre">{formaterEuros(v.prix_public)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /** Etape 3 : essence et profil de bois. */
  function ChoixEssence() {
    const essences = [...new Set(catalogue.variantes.map((v) => v.essence))];
    const prixDe = (essence: string) =>
      catalogue.variantes.find(
        (v) =>
          v.essence === essence &&
          v.taille === devis.variante.taille &&
          v.hauteur === devis.variante.hauteur,
      )?.prix_public ?? 0;

    return (
      <section className="bloc">
        <div className="bloc__entete">
          <h3 className="bloc__titre">Essence et profil</h3>
          <span className="bloc__indice">
            prix public du kit pour {devis.variante.taille} · {devis.variante.hauteur}
          </span>
        </div>
        <div className="options options--large">
          {essences.map((essence) => (
            <button
              key={essence}
              type="button"
              className={`option${devis.variante.essence === essence ? " option--choisie" : ""}`}
              onClick={() => changerBassin("essence", essence)}
              aria-pressed={devis.variante.essence === essence}
            >
              <img
                src={visuel(VISUEL_PAR_ESSENCE[essence])}
                alt=""
                className="option__image option__image--contenue"
              />
              {devis.variante.essence === essence && <span className="option__coche">✓</span>}
              <span className="option__corps">
                <span className="option__libelle">{essence}</span>
                <span className="option__note">{TEXTE_PAR_ESSENCE[essence]}</span>
                <span className="option__prix">{formaterEuros(prixDe(essence))}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }
}

function BoutonEtape({
  etape,
  actif,
  complet,
  montant,
  onClick,
}: {
  etape: EtapeConfigurateur;
  actif: boolean;
  complet: boolean;
  montant: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rail__etape${actif ? " rail__etape--actif" : ""}`}
      onClick={onClick}
    >
      <span className={`rail__numero${!actif && complet ? " rail__numero--rempli" : ""}`}>
        {etape.numero ?? (complet ? "✓" : "•")}
      </span>
      <span className="rail__libelle">{etape.titre}</span>
      {montant > 0 && (
        <span className="rail__montant">{Math.round(montant).toLocaleString("fr-BE")} €</span>
      )}
    </button>
  );
}
