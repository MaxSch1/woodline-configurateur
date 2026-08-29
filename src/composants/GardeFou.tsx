import { Component, type ErrorInfo, type ReactNode } from "react";
import { LOGO } from "../donnees/presentation";

/**
 * Le garde-fou.
 *
 * Une exception non rattrapee dans React demonte tout l'arbre et laisse une PAGE
 * BLANCHE, sans le moindre message. C'est arrive le 29/08/2026 avec une session
 * enregistree devenue incompatible, et l'utilisateur n'avait aucun moyen de s'en
 * sortir sans vider le stockage du navigateur a la main.
 *
 * Pour un outil qu'un revendeur pilote devant son client, c'est inacceptable. On
 * affiche donc l'erreur et un bouton qui remet l'application a zero.
 */
interface Props {
  children: ReactNode;
}

interface Etat {
  erreur: Error | null;
  /** Le composant ou ca a lache, pour diagnostiquer sans ouvrir la console. */
  composant: string | null;
}

const CLES_STOCKAGE = ["woodline.configuration-en-cours", "woodline.grille-tarifaire"];

export default class GardeFou extends Component<Props, Etat> {
  state: Etat = { erreur: null, composant: null };

  static getDerivedStateFromError(erreur: Error): Partial<Etat> {
    return { erreur };
  }

  componentDidCatch(erreur: Error, infos: ErrorInfo) {
    console.error("[woodline] écran interrompu :", erreur, infos.componentStack);
    // Premiere ligne utile de la pile : « at Entete (…) » -> « Entete ».
    const premiere = (infos.componentStack ?? "")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("at "));
    this.setState({ composant: premiere?.replace(/^at\s+/, "").split(" ")[0] ?? null });
  }

  private repartirDeZero = () => {
    for (const cle of CLES_STOCKAGE) {
      try {
        localStorage.removeItem(cle);
      } catch {
        /* stockage indisponible : le rechargement suffira */
      }
    }
    window.location.hash = "#/";
    window.location.reload();
  };

  render() {
    if (!this.state.erreur) return this.props.children;

    return (
      <main className="panne">
        <img src={LOGO} alt="Wood-Line" className="panne__logo" />
        <h1 className="panne__titre">L'écran s'est interrompu</h1>
        <p className="panne__texte">
          La configuration en cours n'a pas pu être affichée. Rien n'est perdu côté
          tarifs : la grille est intacte. Repartez d'une configuration neuve, le
          chiffrage reprendra normalement.
        </p>
        <button type="button" className="bouton bouton--primaire" onClick={this.repartirDeZero}>
          Repartir de zéro
        </button>
        {/* Le message est visible d'emblee : sur un poste en clientele, personne ne
            pense a deplier un « detail technique » ni a ouvrir la console. */}
        {/* Message ET composant fautif, visibles d'emblee : sur un poste en
            clientele, personne n'ouvre la console, et un aller-retour pour
            demander « qu'est-ce qui est ecrit » coute une reunion. */}
        <pre className="panne__message">
          {this.state.erreur.message}
          {this.state.composant ? `\n\ncomposant : ${this.state.composant}` : ""}
          {`\nécran : ${window.location.hash || "#/"}`}
        </pre>
      </main>
    );
  }
}
