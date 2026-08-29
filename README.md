# Wood-Line — Configurateur revendeur (v1 de démonstration)

Plateforme web de configuration et de chiffrage des piscines bois **Wood-Line**
(Wood-Pool SA, Burdinne). Elle remplace le classeur Excel à macros, protégé par un
dongle USB, que les revendeurs utilisent aujourd'hui pour établir un devis.

**Cette v1 n'est pas destinée à la production.** Elle sert à poser une démonstration
devant le dirigeant : un seul modèle, **Bahia**, mais entièrement fonctionnel, aux prix
du deviseur, au centime.

- Fiche client (CB) : [`Mémoire Claude/Clients/broers-bois/main.md`](../../Mémoire%20Claude/Clients/broers-bois/main.md)
- Analyse du classeur : [`docs/configurateur/ANALYSE-deviseur-excel.md`](../../Mémoire%20Claude/Clients/broers-bois/docs/configurateur/ANALYSE-deviseur-excel.md)
- Scénario de démonstration : [`docs/DEMO.md`](docs/DEMO.md)
- Questions ouvertes pour le client : [`docs/questions-client.md`](docs/questions-client.md)

## Lancer

```bash
npm install && npm run dev
```

L'application s'ouvre sur `http://localhost:5180`. Aucun service externe, aucune clé,
aucune base : tout tourne dans le navigateur.

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm test` | Les 27 tests, dont le test d'acceptation |
| `npm run acceptation` | Le seul test d'acceptation, qui affiche les trois totaux |
| `npm run build` | Build de production dans `dist/` |

## La règle d'acceptation

Le seed contient `demo_configuration` : l'état enregistré du fichier Excel du client au
20/03/2025. Le moteur doit le rejouer et sortir exactement ceci.

```
piscine et options de pose : 12 231,00 €
accessoires                :  6 522,00 €
prix de la piscine         : 18 753,00 €
```

`npm run acceptation` affiche ces trois lignes. **Si un centime dérive, le moteur est
faux** : le dirigeant ouvrira son classeur en face.

## Les quatre écrans

1. **`/`** — le choix du modèle. Bahia active, les quatre autres visibles et grisées.
2. **`/configurer`** — le parcours en étapes, numéroté comme le catalogue papier.
   Rail des étapes à gauche, options avec leur visuel au centre, récapitulatif chiffré
   collé à droite. Le total bouge à chaque clic.
3. **`/devis`** — l'aperçu du devis, l'en-tête revendeur et client, le bloc
   « Réservé aux revendeurs », l'export PDF.
4. **`/administration`** — la grille tarifaire. On modifie un prix, on publie, le
   configurateur l'applique à la seconde suivante.

## Architecture

```
src/
├── moteur/            LE MOTEUR DE PRIX — module pur, sans dépendance à l'interface
│   ├── types.ts       Le modèle de données, repris tel quel du seed
│   ├── sections.ts    Le découpage du devis, relevé cellule par cellule sur l'Excel
│   ├── prix.ts        prixOption · lignesConfiguration · calculerDevis
│   └── *.test.ts      Le test d'acceptation et les garde-fous
├── donnees/
│   ├── bahia.seed.json   Copie versionnée du seed du CB, octet pour octet
│   ├── libelles.ts       Les accents perdus à l'extraction, rétablis
│   ├── catalogue.ts      Chargement + surcharges de prix publiées
│   └── presentation.ts   Étapes, visuels et textes du catalogue papier
├── etat/              L'état du configurateur (React)
├── composants/        En-tête, groupes d'options, récapitulatif
├── pages/             Les quatre écrans
└── pdf/               Génération du devis PDF, côté client
```

### Décisions techniques

- **Le moteur de prix est un module pur, testé, sans React.** C'est lui qui sera
  réutilisé tel quel pour les quatre autres modèles et pour l'API. Toute la
  complexité tarifaire y est enfermée : un prix `fixe`, `par_taille` ou
  `par_taille_hauteur` se lit par `prixOption`, jamais dans un composant.
- **Le seed fait foi.** Aucun prix n'est recalculé, arrondi ni margé. Les montants
  sont additionnés au centime (`auCentime`), jamais réinterprétés.
- **Les données vivent en JSON versionné.** La bascule vers Supabase se fera en
  remplaçant `catalogueDeReference()` par un appel réseau : la forme des clés de prix
  (`variante:10`, `option:joint_peripherique:joint_oui:400 x 400`) ne change pas.
- **Le PDF est produit dans le navigateur** (jsPDF), sans service externe : rien ne
  sort du poste du revendeur.
- **La grille publiée vit dans le `localStorage`** en v1. En production : une table,
  avec date de validité et historique.

### Accueillir les quatre autres modèles

Le code ne connaît pas « Bahia ». Il charge un `Catalogue`. Pour ajouter Atoll :
déposer `atoll.seed.json`, l'ouvrir depuis `donnees/catalogue.ts`, compléter
`SECTIONS_DEVIS` si sa feuille devis diffère, et passer `MODELES[atoll].actif` à
`true`. Le moteur, le devis et le PDF n'ont pas à bouger.

## Ce qui n'est pas dans cette v1

Les quatre autres modèles, l'authentification et les comptes revendeurs, le
branchement CRM, l'envoi d'e-mails, les paiements, et la grille de remises revendeurs
— que le client n'a pas encore fournie.
