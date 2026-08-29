# Changelog — woodline-configurateur

> Une entrée datée par mise à jour ou problème rencontré. Récent en haut. Append-only.

## 2026-08-29 (7) — Dépôt rendu public

- Sur décision de Maxime, le dépôt GitHub passe en **public**. Condition posée : aucune
  variable d'environnement, aucun secret. **Vérifié** — historique git complet balayé,
  aucun `.env` jamais commité, aucun jeton, et le seul `import.meta.env` du code est
  `BASE_URL`, une constante de build. Aucune variable d'environnement sur Vercel non plus.
- **Trois passages neutralisés avant publication**, parce qu'ils relevaient de l'interne
  Meridiem et non du projet :
  - le titre de `DEMO.md` nommait le dirigeant du client — remplacé par sa fonction ;
  - une consigne évoquait le « signal financier » du client, ce qui trahissait une
    analyse interne de sa santé financière — remplacée par une consigne de tenue neutre ;
  - le montant exact de ses crédits Azure, qui relève de son accord avec Microsoft —
    remplacé par la mention du partenariat.
- Le reste est inchangé : la grille tarifaire publique, les visuels du catalogue et les
  questions ouvertes restent dans le dépôt, Maxime les ayant jugés non sensibles.

## 2026-08-29 (6) — 🚀 En ligne

- **Dépôt GitHub** : `MaxSch1/woodline-configurateur`, **privé** (il porte la grille
  tarifaire et les visuels de Wood-Pool). Connecté au projet Vercel : un `git push` sur
  `main` déclenche un déploiement.
- **Production** : https://woodline-configurateur.vercel.app, scope Vercel `meridiem`.
- **Public, sans mot de passe**, sur décision explicite de Maxime. Seul garde-fou :
  `X-Robots-Tag: noindex, nofollow`. L'autorisation du client sur les visuels du
  catalogue reste à obtenir (point 7 de `docs/questions-client.md`).
- **Problème rencontré et résolu** : `cleanUrls: true` dans `vercel.json` faisait ignorer
  les `rewrites`, et `/configurer` renvoyait un 404. Retiré ; les trois routes héritées
  répondent maintenant 200 et ouvrent l'application.
- **Piège de la CLI** : le compte `maxsch1` voit trois équipes, `vercel` s'arrête sans
  `--scope`. `--scope meridiem` documenté partout.
- Vérifié en ligne : parcours complet, rejeu du classeur à **18 753,00 €**, console
  vide, images et logo servis, en-têtes appliqués.

## 2026-08-29 (5) — Déploiement préparé (Vercel), sans être lancé

- `vercel.json` + `docs/deploy.md`. L'application étant entièrement statique, il n'y a
  ni serveur, ni base, ni variable d'environnement à fournir.
- ⚠️ **Piège évité** : pas de réécriture attrape-tout dans `vercel.json`. Le build
  utilise des chemins d'assets relatifs (`base: "./"`) ; `index.html` servi sur un
  chemin à plusieurs segments chercherait ses assets au mauvais endroit. Seules les
  trois routes à un segment sont réécrites, en filet pour d'anciennes URL sans `#`.
- `X-Robots-Tag: noindex, nofollow` : les tarifs et les visuels du client n'ont rien à
  faire dans un moteur de recherche.
- **Non déployé.** Une URL Vercel publierait 161 prix de Wood-Pool et 39 images de leur
  catalogue sur un domaine Meridiem. Demande la validation de Maxime, et l'autorisation
  du client sur les visuels (point 7 de `docs/questions-client.md`).
- Rappel écrit noir sur blanc dans `deploy.md` : sur une URL partagée, « publier la
  grille » ne change le prix que dans le navigateur qui a publié, puisqu'elle vit dans
  le `localStorage`. C'est le moment précis où la base devient nécessaire.

## 2026-08-29 (4) — 🔴 `destroy is not a function` : l'effet de remontée en haut de page

- **Symptôme** : Maxime voyait toujours l'écran d'erreur, avec le message
  `destroy is not a function`. Chez moi, jamais.
- **Cause, reproduite à l'identique** : `useEffect(() => window.scrollTo(0, 0), [pathname])`.
  La flèche **sans accolades RETOURNE** la valeur de `window.scrollTo`. Sur un navigateur
  standard c'est `undefined` et rien ne casse — d'où le fait que ça marchait chez moi.
  Mais dès qu'une **extension de défilement fluide** remplace `window.scrollTo` par une
  fonction qui retourne autre chose, React prend cette valeur pour la fonction de
  nettoyage de l'effet et l'appelle à la navigation suivante : `destroy is not a function`.
- **Reproduction** : en détournant `window.scrollTo` pour qu'il retourne un objet, on
  obtient exactement l'écran de Maxime dès la deuxième navigation.
- **Correction** : corps de l'effet en bloc. Vérifié ensuite avec le même détournement
  actif — quatre navigations d'affilée, console vide.
- **Garde-fou** : `src/hygiene.test.ts` refuse désormais tout `useEffect` à flèche
  concise, dans tous les `.ts`/`.tsx`. C'est presque toujours ce piège.
- **L'écran d'erreur devient auto-diagnostique** : il affiche le message, **le composant
  fautif** et l'écran concerné. Les trois allers-retours de la journée venaient de ce que
  le diagnostic n'était visible qu'en console — ce qu'on n'ouvre pas devant un client.
- 42 tests verts. Acceptation toujours à 12 231 / 6 522 / 18 753 €.

## 2026-08-29 (3) — 🔴 Cause racine trouvée : Fast Refresh cassé par `App.tsx`

- **Symptôme suivant** : après le correctif précédent, Maxime voyait l'écran
  « L'écran s'est interrompu ». Le garde-fou faisait son travail, mais il y avait
  bien une erreur dessous.
- **Cause racine, enfin identifiée** : `App.tsx` exportait à la fois le composant
  `App` et le hook `useAtelier` avec son contexte. C'est **incompatible avec le Fast
  Refresh de React**, et Vite le disait à chaque édition dans son journal —
  `Could not Fast Refresh ("useAtelier" export is incompatible)`. Après une
  modification de ce fichier, un navigateur déjà ouvert restait sur un mélange
  d'anciens et de nouveaux modules : `useAtelier` ne retrouvait plus son fournisseur
  et levait. C'est **la même cause pour les deux symptômes** — page blanche avant le
  garde-fou, écran d'erreur après. Le message en console le disait :
  `useAtelier hors du fournisseur`, levé depuis `Entete`.
- **Correction** : le contexte et le hook vivent dans `src/etat/contexte.ts` (sans
  JSX, donc sans composant), le fournisseur dans `src/etat/FournisseurAtelier.tsx`,
  et `App.tsx` n'exporte plus qu'un composant. Journal Vite vérifié après trois
  éditions successives : plus aucun `Could not Fast Refresh`, plus aucun
  `page reload`, uniquement des `hmr update` propres.
- **Garde-fou automatique** : `src/hygiene.test.ts` parcourt les `.tsx` et échoue si
  un module exporte à la fois un composant et un hook. Il a d'ailleurs immédiatement
  attrapé la faute que je venais de réintroduire dans un `contexte.tsx` intermédiaire.
- **Renforcements passés au même moment** :
  - `restaurerConfiguration()` ne se contente plus de valider la forme des choix, elle
    fait tourner le moteur pour de vrai et repart d'une configuration neuve s'il lève.
  - `lignesDuGroupe` prend la première option **disponible** d'un groupe booléen, plus
    `options[0]` les yeux fermés — la même faute latente aurait explosé sur Atoll ou
    Longhi, qui ont leurs propres options indisponibles.
  - Les fiches client et revendeur sont recomposées champ par champ : un enregistrement
    incomplet faisait lever `nomDuFichier()` sur `client.nom.trim()` à l'export PDF.
  - Le message d'erreur du garde-fou est visible d'emblée, sans dépliage : sur un poste
    en clientèle, personne n'ouvre la console.
- 41 tests, tous verts. Le test d'acceptation sort toujours 12 231 / 6 522 / 18 753 €.
- ⚠️ **À savoir** : renommer ou supprimer un module laisse Vite sur une résolution
  périmée (`Failed to load url … Does the file exist ?`). Redémarrer `npm run dev`
  suffit ; ce n'est pas un défaut du code.

## 2026-08-29 (2) — 🔴 Page blanche au chargement, corrigée

- **Problème signalé par Maxime** : le configurateur s'ouvrait pendant le développement,
  puis rendait une **page blanche**, sans message.
- **Cause reproduite** : la persistance de la configuration, ajoutée le matin même,
  restaure telle quelle la session du `localStorage`. Une session pointant une variante
  ou une option que le catalogue ne connaît plus fait lever le moteur
  (`Variante inconnue : 99`) ; React démonte tout l'arbre et laisse une page blanche.
  L'utilisateur n'avait aucun moyen de s'en sortir sans vider le stockage à la main.
- **Correction en deux temps.**
  1. `src/moteur/configuration.ts` : `assainirConfiguration()` passe au tamis toute
     configuration venue de l'extérieur — variante inconnue, option disparue ou
     indisponible, choix de la mauvaise forme, groupe supprimé. Chaque choix douteux
     est ramené à sa valeur neutre, le reste est conservé, et les rejets sont tracés en
     console. 10 tests couvrent le cas, dont la régression exacte.
  2. `src/composants/GardeFou.tsx` : garde-fou React. Une exception non rattrapée
     affiche désormais un écran lisible à la charte, avec un bouton « Repartir de zéro »
     qui vide le stockage et recharge. Vérifié en injectant une panne réelle.
- **Deuxième cause de page blanche supprimée dans la foulée** : les chemins d'assets du
  build étaient absolus (`/assets/…`), donc un `dist/index.html` ouvert depuis le Finder
  rendait lui aussi une page blanche. `base: "./"` dans la config Vite, `HashRouter` à la
  place de `BrowserRouter`, et tous les chemins d'images passés par
  `import.meta.env.BASE_URL` (`cheminAsset()`). L'application s'ouvre maintenant depuis
  le serveur de dev, `npm run preview`, un hébergement statique sans règle de réécriture,
  ou un double-clic sur le fichier. Contrepartie assumée : les URL portent un `#`.
- 37 tests, tous verts. Le test d'acceptation sort toujours 12 231 / 6 522 / 18 753 €.

## 2026-08-29
- **v1 de démonstration créée**, à partir de `DEV/_TEMPLATE-projet/`. React 18 + Vite +
  TypeScript, vitest, jsPDF. Modèle Bahia seul, 12 variantes, 40 groupes, 118 options.
- **Socle de permissions posé et prouvé** (`poser-socle-permissions.py` puis
  `sonde-permissions.py`) : git lecture et écriture `ok`, `write` vérifié, `git push`
  `refuse` comme voulu, `websearch` `ok`. ⚠️ La sonde rend `erreur` sur `webfetch` —
  ce n'est pas un refus de permission, la cause n'a pas été creusée, le travail n'en
  dépendait pas.
- **Moteur de prix écrit en premier, avec son test d'acceptation.** Il rejoue
  `demo_configuration` du seed et sort 12 231,00 / 6 522,00 / 18 753,00 €. 27 tests au
  total, tous verts.
- **Découpage du devis relevé cellule par cellule** sur la feuille `Bahia devis` du
  classeur (`src/moteur/sections.ts`), plutôt que déduit. C'est ce qui a permis de
  reproduire les 14 sous-totaux de section, et pas seulement le total.
- **Problème trouvé dans le classeur du client** : le sous-total « Options courantes »
  (H19 = `SOMME(D20:D25)`) laisse la télécommande (D26, 125 €) hors de sa plage. Le
  total général D77 la reprend, donc le prix final du client est juste ; seul le
  sous-total affiché est court de 125 €. Documenté dans `sections.ts`, couvert par un
  test, et remonté dans `docs/questions-client.md`.
- **Problème : le seed a perdu ses accents à l'extraction.** Inacceptable sur un devis
  client. Résolu par `src/donnees/libelles.ts` : un script aligne chaque libellé du
  seed sur sa chaîne dans le classeur et ne transfère que les signes diacritiques
  (54 libellés) ; 19 autres sont rétablis à la main faute d'appariement exact. Le seed
  reste octet pour octet celui du CB, et un test vérifie qu'aucun prix, identifiant ni
  structure n'est touché.
- **39 visuels extraits du catalogue PDF** (`outils/extraire-visuels.py`, documenté
  dans `docs/visuels.md`). Aucune image inventée : une option sans photo identifiée
  reste sans photo.
- **Charte échantillonnée dans le catalogue** plutôt que devinée : terre cuite
  `#AB4D13`, bordeaux `#740A01`, bleu `#0072BC`, orange `#F09109`.
- **Problème : l'en-tête collant du tableau des tarifs se décalait d'une ligne** et
  masquait la première rangée. Deux causes cumulées, corrigées dans `styles.css` :
  `border-collapse: collapse` et surtout `overflow: hidden` sur la table, qui en
  faisait le conteneur de défilement du `th` sticky.
- **Problème : l'option indisponible ne s'affichait pas.** Le rendu des groupes
  booléens ne montrait que la première option, donc « Volet et plage immergés — non
  dispo sur Bahia » restait invisible. C'est pourtant une règle métier à montrer :
  toutes les options du groupe sont désormais rendues, les indisponibles grisées avec
  leur motif.
- **Choix assumé : les lignes à 0 € ne s'impriment pas.** Le classeur imprime les
  vingt « Sans robot » et « Pas de couverture » ; sur un devis client cela noie
  l'offre. `lignesImprimables()` les masque, la piscine et le liner exceptés. Aucun
  total n'est affecté, un test le vérifie. À confirmer avec le client.
- Configuration en cours persistée dans le `localStorage` : un rechargement de page ne
  perd plus le devis en construction.
- Les photos détourées et les schémas (joint périphérique, poutrelles, spots) s'affichent
  en entier plutôt qu'en cadrage plein : un recadrage 4/3 les amputait.
- Module PDF chargé à la demande : le paquet initial passe de 627 à 230 Ko.
- Écrit : `README.md`, `docs/DEMO.md` (scénario chronométré), `docs/questions-client.md`
  (9 points ouverts), `docs/visuels.md`.
