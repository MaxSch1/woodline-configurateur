# Déploiement

## En ligne

| | |
|---|---|
| **Production** | https://woodline-configurateur.vercel.app |
| Projet Vercel | `meridiem/woodline-configurateur` |
| Dépôt | https://github.com/MaxSch1/woodline-configurateur (**privé**) |
| Déploiement automatique | oui — un `git push` sur `main` déclenche un déploiement |
| Protection | **aucune**, décision de Maxime du 29/08/2026. En-tête `noindex, nofollow` seulement |

Mise en ligne le 29/08/2026. Le dépôt est privé parce qu'il contient la grille
tarifaire et les visuels de Wood-Pool ; le **site**, lui, est public.

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

Le dépôt GitHub est connecté au projet : **un `git push` sur `main` suffit**. Pour
déployer à la main depuis le poste :

```bash
cd "DEV/woodline-configurateur"
vercel --scope meridiem            # prévisualisation, URL non devinable
vercel --prod --scope meridiem     # production
```

⚠️ `--scope meridiem` est obligatoire : le compte CLI (`maxsch1`) voit trois équipes,
et sans le scope la commande s'arrête en demandant laquelle.

### Ce que fait `vercel.json`

| Réglage | Pourquoi |
|---|---|
| `framework: vite`, `outputDirectory: dist` | Build standard, `npm run build` |
| 3 `rewrites` (`/configurer`, `/devis`, `/administration`) | Filet pour les anciennes URL sans `#` : elles ouvrent l'application (à l'accueil, puisque le routeur lit le dièse) au lieu de renvoyer un 404. L'application utilise un routeur à dièse, donc seule `/` est réellement demandée. ⚠️ **Ne pas mettre de réécriture attrape-tout** : le build utilise des chemins d'assets relatifs (`base: "./"`), donc `index.html` servi sur un chemin à plusieurs segments chercherait ses assets au mauvais endroit. Les trois routes ci-dessus n'ont qu'un segment, elles sont sûres. |
| **Pas de `cleanUrls`** | 🔴 Mesuré le 29/08/2026 : avec `cleanUrls: true`, Vercel ignore les `rewrites` ci-dessus et `/configurer` retombe en 404. Retiré. |
| `X-Robots-Tag: noindex, nofollow` | Les tarifs et les visuels de Wood-Pool n'ont rien à faire dans Google |
| Cache long sur `/assets/`, court sur `/visuels/` | Les assets portent une empreinte dans leur nom, les visuels non |

### Ce qui est public, et assumé

Décision de Maxime le 29/08/2026 : **pas de protection**. Ce qui est donc accessible à
qui a l'URL :

- les **161 prix publics** du modèle Bahia, tels que fournis par Wood-Pool ;
- **39 images extraites de leur catalogue 2025**, qui leur appartiennent ;
- la marque Wood-Line, sur un domaine Meridiem.

Seul garde-fou en place : l'en-tête `X-Robots-Tag: noindex, nofollow`, qui tient le
site hors des moteurs de recherche. Le point 7 de `docs/questions-client.md` demande
toujours à Wood-Pool l'autorisation formelle d'utiliser les visuels de leur catalogue.

Si la situation change, la protection se pose en deux clics : Vercel → le projet →
Settings → Deployment Protection → Password Protection.

## Rollback

```bash
vercel ls --scope meridiem                       # liste les déploiements
vercel rollback <url-du-déploiement> --scope meridiem
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
