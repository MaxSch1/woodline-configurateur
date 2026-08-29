import { useCallback, useEffect, useMemo, useState } from "react";
import {
  construireCatalogue,
  grilleVierge,
  lireGrille,
  type GrilleTarifaire,
} from "../donnees/catalogue";
import {
  assainirConfiguration,
  choixParDefaut,
  configurationNeuve,
} from "../moteur/configuration";
import { calculerDevis } from "../moteur/prix";
import type { Catalogue, Choix, Configuration, LigneRevendeur } from "../moteur/types";

export { choixParDefaut, configurationNeuve };

/**
 * L'etat du configurateur. Toute la logique de prix est deleguee au moteur pur :
 * ce module ne fait que tenir les choix, la grille tarifaire courante et le bloc
 * revendeur, puis relancer le calcul a chaque frappe.
 */

export function blocRevendeurNeuf(catalogue: Catalogue): LigneRevendeur[] {
  return catalogue.bloc_revendeur.lignes.map((libelle) => ({ libelle, montant: 0 }));
}

export interface Client {
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
}

export interface Revendeur {
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  numero: string;
  validite: string;
}

const REVENDEUR_VIERGE: Revendeur = {
  nom: "",
  adresse: "",
  telephone: "",
  email: "",
  numero: "",
  validite: "",
};

const CLIENT_VIERGE: Client = { nom: "", adresse: "", telephone: "", email: "" };

/**
 * La configuration en cours survit a un rechargement de page : un revendeur qui
 * ferme son portable au milieu d'un rendez-vous retrouve son devis.
 */
const CLE_SESSION = "woodline.configuration-en-cours";

interface SessionEnregistree {
  configuration: Configuration;
  blocRevendeur: LigneRevendeur[];
  client: Client;
  revendeur: Revendeur;
}

function lireSession(): SessionEnregistree | null {
  try {
    const brut = localStorage.getItem(CLE_SESSION);
    if (!brut) return null;
    const session = JSON.parse(brut) as SessionEnregistree;
    return session.configuration?.choix ? session : null;
  } catch {
    return null;
  }
}

export function useConfigurateur() {
  const [grille, setGrille] = useState<GrilleTarifaire>(() =>
    typeof window === "undefined" ? grilleVierge() : lireGrille(),
  );
  const catalogue = useMemo(() => construireCatalogue(grille), [grille]);

  const reprise = typeof window === "undefined" ? null : lireSession();
  const neuf = construireCatalogue(grilleVierge());

  /**
   * Une session enregistree n'est jamais digne de confiance : elle a pu etre ecrite
   * par une version anterieure du catalogue. On la passe au tamis plutot que de la
   * donner telle quelle au moteur, qui leverait et emporterait toute la page.
   */
  const [configuration, setConfiguration] = useState<Configuration>(() => {
    if (!reprise?.configuration) return configurationNeuve(neuf);
    const { configuration: assainie, rejets } = assainirConfiguration(
      neuf,
      reprise.configuration,
    );
    if (rejets.length > 0) {
      console.warn(
        `[woodline] session enregistrée partiellement ignorée : ${rejets.join(", ")}`,
      );
    }
    return assainie;
  });
  const [blocRevendeur, setBlocRevendeur] = useState<LigneRevendeur[]>(() => {
    const enregistre = reprise?.blocRevendeur;
    const neufBloc = blocRevendeurNeuf(neuf);
    if (!Array.isArray(enregistre) || enregistre.length !== neufBloc.length) return neufBloc;
    // Les intitules font foi cote catalogue ; on ne reprend que les montants.
    return neufBloc.map((ligne, i) => ({
      ...ligne,
      montant: Number.isFinite(enregistre[i]?.montant) ? enregistre[i].montant : 0,
    }));
  });
  const [client, setClient] = useState<Client>(() => reprise?.client ?? CLIENT_VIERGE);
  const [revendeur, setRevendeur] = useState<Revendeur>(
    () => reprise?.revendeur ?? REVENDEUR_VIERGE,
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        CLE_SESSION,
        JSON.stringify({ configuration, blocRevendeur, client, revendeur }),
      );
    } catch {
      /* stockage indisponible : on continue sans persistance */
    }
  }, [configuration, blocRevendeur, client, revendeur]);

  /** Une republication de la grille depuis l'administration se voit tout de suite. */
  useEffect(() => {
    const relire = () => setGrille(lireGrille());
    window.addEventListener("storage", relire);
    window.addEventListener("woodline:grille-publiee", relire);
    return () => {
      window.removeEventListener("storage", relire);
      window.removeEventListener("woodline:grille-publiee", relire);
    };
  }, []);

  const devis = useMemo(
    () => calculerDevis(catalogue, configuration, blocRevendeur),
    [catalogue, configuration, blocRevendeur],
  );

  const choisir = useCallback((groupeId: string, choix: Choix) => {
    setConfiguration((precedente) => ({
      ...precedente,
      choix: { ...precedente.choix, [groupeId]: choix },
    }));
  }, []);

  const choisirVariante = useCallback((numero: number) => {
    setConfiguration((precedente) => ({ ...precedente, variante: numero }));
  }, []);

  /** Change une facette du bassin en conservant les deux autres. */
  const changerBassin = useCallback(
    (facette: "taille" | "hauteur" | "essence", valeur: string) => {
      setConfiguration((precedente) => {
        const actuelle = catalogue.variantes.find((v) => v.numero === precedente.variante)!;
        const cible = { ...actuelle, [facette]: valeur };
        const trouvee = catalogue.variantes.find(
          (v) =>
            v.taille === cible.taille &&
            v.hauteur === cible.hauteur &&
            v.essence === cible.essence,
        );
        return trouvee ? { ...precedente, variante: trouvee.numero } : precedente;
      });
    },
    [catalogue],
  );

  const reinitialiser = useCallback(() => {
    setConfiguration(configurationNeuve(catalogue));
    setBlocRevendeur(blocRevendeurNeuf(catalogue));
    setClient(CLIENT_VIERGE);
    setRevendeur(REVENDEUR_VIERGE);
  }, [catalogue]);

  /** Recharge l'etat enregistre du classeur du client : la preuve au centime. */
  const chargerDemonstration = useCallback(() => {
    const demo = catalogue.demo_configuration;
    setConfiguration({ variante: demo.variante, choix: { ...demo.choix } });
    setBlocRevendeur(blocRevendeurNeuf(catalogue));
  }, [catalogue]);

  const majLigneRevendeur = useCallback((index: number, montant: number) => {
    setBlocRevendeur((lignes) =>
      lignes.map((ligne, i) => (i === index ? { ...ligne, montant } : ligne)),
    );
  }, []);

  return {
    catalogue,
    grille,
    configuration,
    devis,
    blocRevendeur,
    client,
    revendeur,
    choisir,
    choisirVariante,
    changerBassin,
    reinitialiser,
    chargerDemonstration,
    majLigneRevendeur,
    setClient,
    setRevendeur,
  };
}

export type EtatConfigurateur = ReturnType<typeof useConfigurateur>;
