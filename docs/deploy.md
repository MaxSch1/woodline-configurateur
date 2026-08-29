# Déploiement

## Ce qu'il faut savoir avant

L'application est **entièrement statique**. Pas de serveur, pas de base de données,
pas de variable d'environnement, pas de secret. Le catalogue est un JSON embarqué
dans le bundle ; la seule donnée qui vit ailleurs est la grille tarifaire modifiée
depuis l'écran d'administration, et elle vit dans le `localStorage` du navigateur.

**Conséquence à ne pas perdre de vue** : sur une URL partagée, « publier la grille »
ne change le prix **que dans le navigateur qui a publié**. Les autres visiteurs voient
toujours le tarif d'origine. C'est acceptable pour une démonstration menée sur un seul
poste ; ce n'est pas acceptable pour un usage réel, et c'est exactement le moment où
la bascule vers une base devient nécessaire (voir « Et Supabase ? » plus bas).

## Vercel

Hébergeur le plus rapide pour une démo. Rien à configurer au-delà de `vercel.json`,
déjà présent à la racine.

```bash
cd "DEV/woodline-configurateur"
vercel            # déploiement de prévisualisation, URL non indexée
vercel --prod     # déploiement de production
```

Le compte utilisé est celui de la CLI (`vercel whoami`).

### Ce que fait `vercel.json`

| Réglage | Pourquoi |
|---|---|
| `framework: vite`, `outputDirectory: dist` | Build standard, `npm run build` |
| 3 `rewrites` (`/configurer`, `/devis`, `/administration`) | Filet pour les anciennes URL sans `#`. L'application utilise un routeur à dièse, donc seule `/` est réellement demandée. ⚠️ **Ne pas mettre de réécriture attrape-tout** : le build utilise des chemins d'assets relatifs (`base: "./"`), donc `index.html` servi sur un chemin à plusieurs segments chercherait ses assets au mauvais endroit. Les trois routes ci-dessus n'ont qu'un segment, elles sont sûres. |
| `X-Robots-Tag: noindex, nofollow` | Les tarifs et les visuels de Wood-Pool n'ont rien à faire dans Google |
| Cache long sur `/assets/`, court sur `/visuels/` | Les assets portent une empreinte dans leur nom, les visuels non |

### 🔴 Avant de déployer publiquement

Une URL Vercel est publique. Ce qui part en ligne :

- les **161 prix publics** du modèle Bahia, tels que fournis par Wood-Pool ;
- **39 images extraites de leur catalogue 2025**, qui leur appartiennent ;
- la marque Wood-Line, sur un domaine Meridiem.

Deux garde-fous possibles, à choisir avec Maxime et Fabrice :

1. **Protection par mot de passe** (Vercel → Settings → Deployment Protection →
   Password Protection). Recommandé tant que le client n'a pas donné son accord écrit.
2. **Déploiement de prévisualisation seulement** (`vercel` sans `--prod`) : URL non
   devinable, non indexée, et qui expire naturellement.

Le point 7 de `docs/questions-client.md` demande justement l'autorisation d'utiliser
les visuels du catalogue. Tant qu'elle n'est pas obtenue, rester en accès protégé.

## Rollback

```bash
vercel ls                       # liste les déploiements
vercel rollback <url-du-déploiement>
```

Un déploiement Vercel est immuable : revenir en arrière consiste à repointer l'alias
de production sur un déploiement précédent. Rien à reconstruire.

## Azure, l'autre piste

Wood-Pool dispose d'environ **150 000 $ de crédits Azure** non consommés (partenariat
Microsoft, cf. fiche CB). Pour une mise en production chez le client, **Azure Static
Web Apps** héberge exactement le même `dist/` et présente deux avantages : la facture
tombe sur leurs crédits, et l'application vit dans leur propre tenant, à côté de leur
Microsoft 365. À arbitrer quand le projet dépasse la démonstration.

## Et Supabase ?

**La v1 n'utilise pas Supabase, ni aucune base.** C'était voulu : le périmètre demandait
un seed en JSON versionné et une bascule *préparée*, pas *faite*.

Ce que la base apportera, dans l'ordre d'utilité :

| Besoin | Ce qu'il faut |
|---|---|
| Une hausse tarifaire visible par **tous** les revendeurs | Table `prix`, avec date de validité. Remplace le `localStorage` de l'écran d'administration |
| Savoir **quels devis ont été faits** et ce qu'ils sont devenus | Tables `configuration` et `devis`, rattachées à un revendeur et à un client |
| Comptes revendeurs et **grille de remises** par statut | Table `revendeur` + authentification |
| Les quatre autres modèles | Rien de nouveau : les mêmes tables, plus de lignes |

Le code est déjà découpé pour ça. Un seul point d'entrée à changer :
`src/donnees/catalogue.ts`. `CATALOGUE_ORIGINE` devient un appel réseau,
`GrilleTarifaire` devient une ligne de table, et **la forme des clés de prix ne bouge
pas** (`variante:10`, `option:joint_peripherique:joint_oui:400 x 400`). Le moteur de
prix (`src/moteur/`) est pur et n'a aucune dépendance à l'interface ni au stockage :
il ne sera pas touché.
