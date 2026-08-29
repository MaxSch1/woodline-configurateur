import { VISUEL_PAR_OPTION, visuel } from "../donnees/presentation";
import { estDisponible, formaterEuros, prixOption } from "../moteur/prix";
import type { Choix, Groupe, Option, Variante } from "../moteur/types";

interface Props {
  groupe: Groupe;
  choix: Choix;
  variante: Variante;
  onChoisir: (choix: Choix) => void;
  /** Presentation compacte pour les longues listes d'accessoires. */
  compact?: boolean;
}

/**
 * Un groupe d'options du seed, rendu selon son type.
 * Aucun prix n'est calcule ici : tout passe par `prixOption`, qui sait seul que
 * le tarif depend de la taille et parfois de la hauteur du bassin.
 */
export default function GroupeOptions({ groupe, choix, variante, onChoisir, compact }: Props) {
  const prixDe = (option: Option) =>
    estDisponible(option) ? prixOption(option, groupe, variante) : null;

  const enTete = (
    <div className="bloc__entete">
      <h3 className="bloc__titre">{groupe.libelle}</h3>
      <span className="bloc__indice">{indice(groupe)}</span>
    </div>
  );

  if (groupe.type === "booleen") {
    // Le groupe porte une seule option cochable, mais il peut en porter d'autres
    // marquees indisponibles sur ce modele : on les montre grisees avec leur motif,
    // exactement comme le classeur le mentionne en toutes lettres.
    const cochable = groupe.options.find(estDisponible) ?? groupe.options[0];
    const coche = choix === true;
    return (
      <section className="bloc">
        {enTete}
        <div className={compact ? "options options--liste" : "options options--large"}>
          {groupe.options.map((option) => {
            const props = {
              option,
              prix: prixDe(option),
              choisie: option.id === cochable.id && coche,
              onClick: () => onChoisir(!coche),
            };
            return compact ? (
              <LigneOption key={option.id} {...props} />
            ) : (
              <CarteOption key={option.id} {...props} />
            );
          })}
        </div>
      </section>
    );
  }

  if (groupe.type === "booleens_multiples") {
    const coches = Array.isArray(choix) ? choix : [];
    return (
      <section className="bloc">
        {enTete}
        <div className="options options--liste">
          {groupe.options.map((option) => {
            const choisie = coches.includes(option.id);
            return (
              <LigneOption
                key={option.id}
                option={option}
                prix={prixDe(option)}
                choisie={choisie}
                onClick={() =>
                  onChoisir(
                    choisie ? coches.filter((id) => id !== option.id) : [...coches, option.id],
                  )
                }
              />
            );
          })}
        </div>
      </section>
    );
  }

  if (groupe.type === "choix_unique_avec_quantite") {
    const valeur =
      choix && typeof choix === "object" && !Array.isArray(choix)
        ? choix
        : { option: "", quantite: groupe.quantite_defaut ?? 1 };
    const optionChoisie = groupe.options.find((o) => o.id === valeur.option);
    const quantifiable = optionChoisie && !optionChoisie.ignore_quantite;

    return (
      <section className="bloc">
        {enTete}
        <div className={compact ? "options options--liste" : "options"}>
          {groupe.options.map((option) =>
            compact ? (
              <LigneOption
                key={option.id}
                option={option}
                prix={prixDe(option)}
                choisie={valeur.option === option.id}
                onClick={() => onChoisir({ option: option.id, quantite: valeur.quantite })}
              />
            ) : (
              <CarteOption
                key={option.id}
                option={option}
                prix={prixDe(option)}
                choisie={valeur.option === option.id}
                onClick={() => onChoisir({ option: option.id, quantite: valeur.quantite })}
              />
            ),
          )}
        </div>
        {quantifiable && (
          <div className="champ-quantite">
            <span>Quantité</span>
            <div className="quantite">
              <button
                type="button"
                aria-label="Retirer un"
                onClick={() =>
                  onChoisir({
                    option: valeur.option,
                    quantite: Math.max(1, valeur.quantite - 1),
                  })
                }
              >
                −
              </button>
              <span className="quantite__valeur">{valeur.quantite}</span>
              <button
                type="button"
                aria-label="Ajouter un"
                onClick={() =>
                  onChoisir({ option: valeur.option, quantite: valeur.quantite + 1 })
                }
              >
                +
              </button>
            </div>
            <span className="bloc__indice">
              {formaterEuros(prixDe(optionChoisie!) ?? 0)} × {valeur.quantite} ={" "}
              <strong>
                {formaterEuros((prixDe(optionChoisie!) ?? 0) * valeur.quantite)}
              </strong>
            </span>
          </div>
        )}
      </section>
    );
  }

  // choix_unique
  return (
    <section className="bloc">
      {enTete}
      <div className={compact ? "options options--liste" : "options"}>
        {groupe.options.map((option) =>
          compact ? (
            <LigneOption
              key={option.id}
              option={option}
              prix={prixDe(option)}
              choisie={choix === option.id}
              onClick={() => onChoisir(option.id)}
            />
          ) : (
            <CarteOption
              key={option.id}
              option={option}
              prix={prixDe(option)}
              choisie={choix === option.id}
              onClick={() => onChoisir(option.id)}
            />
          ),
        )}
      </div>
    </section>
  );
}

interface PropsOption {
  option: Option;
  prix: number | null;
  choisie: boolean;
  onClick: () => void;
}

export function CarteOption({ option, prix, choisie, onClick }: PropsOption) {
  const image = visuel(VISUEL_PAR_OPTION[option.id]);
  const dispo = estDisponible(option);

  return (
    <button
      type="button"
      className={`option${choisie ? " option--choisie" : ""}${dispo ? "" : " option--indispo"}`}
      onClick={dispo ? onClick : undefined}
      disabled={!dispo}
      aria-pressed={choisie}
    >
      {image ? (
        <img src={image} alt="" className="option__image" loading="lazy" />
      ) : (
        <div className="option__pastille" aria-hidden>
          {option.libelle.slice(0, 1).toUpperCase()}
        </div>
      )}
      {choisie && <span className="option__coche">✓</span>}
      <span className="option__corps">
        <span className="option__libelle">{option.libelle}</span>
        {dispo ? (
          <span className={`option__prix${prix ? "" : " option__prix--nul"}`}>
            {prix ? `+ ${formaterEuros(prix)}` : "Compris"}
          </span>
        ) : (
          <span className="option__motif">Indisponible — {option.motif}</span>
        )}
      </span>
    </button>
  );
}

export function LigneOption({ option, prix, choisie, onClick }: PropsOption) {
  const image = visuel(VISUEL_PAR_OPTION[option.id]);
  const dispo = estDisponible(option);

  return (
    <button
      type="button"
      className={`ligne-option${choisie ? " ligne-option--choisie" : ""}${
        dispo ? "" : " option--indispo"
      }`}
      onClick={dispo ? onClick : undefined}
      disabled={!dispo}
      aria-pressed={choisie}
    >
      <span className="ligne-option__case">✓</span>
      {image && <img src={image} alt="" className="ligne-option__vignette" loading="lazy" />}
      <span className="ligne-option__libelle">{option.libelle}</span>
      {dispo ? (
        <span className={`ligne-option__prix${prix ? "" : " ligne-option__prix--nul"}`}>
          {prix ? `+ ${formaterEuros(prix)}` : "Compris"}
        </span>
      ) : (
        <span className="option__motif">Indisponible — {option.motif}</span>
      )}
    </button>
  );
}

function indice(groupe: Groupe): string {
  const tarif =
    groupe.tarification === "par_taille"
      ? "prix selon la taille du bassin"
      : groupe.tarification === "par_taille_hauteur"
        ? "prix selon la taille et la hauteur"
        : null;
  const type =
    groupe.type === "booleens_multiples"
      ? "plusieurs choix possibles"
      : groupe.type === "booleen"
        ? "à cocher"
        : groupe.type === "choix_unique_avec_quantite"
          ? "un choix, avec quantité"
          : "un seul choix";
  return tarif ? `${type} · ${tarif}` : type;
}
