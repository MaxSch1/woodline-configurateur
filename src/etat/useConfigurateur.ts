import { useCallback, useEffect, useMemo, useState } from "react";
import {
  construireCatalogue,
  grilleVierge,
  lireGrille,
  type GrilleTarifaire,
} from "../donnees/catalogue";
import { calculerDevis } from "../moteur/prix";
import type {
  Catalogue,
  Choix,
  Configuration,
  Groupe,
  LigneRevendeur,
} from "../moteur/types";

/**
 * L'etat du configurateur. Toute la logique de prix est deleguee au moteur pur :
 * ce module ne fait que tenir les choix, la grille tarifaire courante et le bloc
 * revendeur, puis relancer le calcul a chaque frappe.
 */

/** Les libelles par lesquels le client designe l'absence d'option. */
const LIBELLE_NEUTRE = /^(sans\b|pas de\b|pas d'|aucun\b|non fournies\b)/i;

/** Le choix neutre d'un groupe, ou null quand le revendeur doit trancher. */
export function choixParDefaut(groupe: Groupe): Choix {
  switch (groupe.type) {
    case "booleen":
      return false;
    case "booleens_multiples":
      return [];
    case "choix_unique": {
      const neutre = groupe.options.find((o) => LIBELLE_NEUTRE.test(o.libelle));
      return neutre ? neutre.id : null;
    }
    case "choix_unique_avec_quantite": {
      const neutre = groupe.options.find((o) => LIBELLE_NEUTRE.test(o.libelle));
      return neutre
        ? { option: neutre.id, quantite: groupe.quantite_defaut ?? 1 }
        : null;
    }
  }
}

export function configurationNeuve(catalogue: Catalogue): Configuration {
  const choix: Record<string, Choix> = {};
  for (const groupe of catalogue.groupes) choix[groupe.id] = choixParDefaut(groupe);
  return { variante: catalogue.variantes[0].numero, choix };
}

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

  const [configuration, setConfiguration] = useState<Configuration>(
    () => reprise?.configuration ?? configurationNeuve(neuf),
  );
  const [blocRevendeur, setBlocRevendeur] = useState<LigneRevendeur[]>(
    () => reprise?.blocRevendeur ?? blocRevendeurNeuf(neuf),
  );
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
