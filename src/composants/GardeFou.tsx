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
}

const CLES_STOCKAGE = ["woodline.configuration-en-cours", "woodline.grille-tarifaire"];

export default class GardeFou extends Component<Props, Etat> {
  state: Etat = { erreur: null };

  static getDerivedStateFromError(erreur: Error): Etat {
    return { erreur };
  }

  componentDidCatch(erreur: Error, infos: ErrorInfo) {
    console.error("[woodline] écran interrompu :", erreur, infos.componentStack);
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
        <details className="panne__detail">
          <summary>Détail technique</summary>
          <pre>{this.state.erreur.message}</pre>
        </details>
      </main>
    );
  }
}
