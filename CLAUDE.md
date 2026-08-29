# woodline-configurateur

> Les règles générales sont dans `DEV/CLAUDE.md` (documentation obligatoire, sécurité, déploiements). Ce fichier ne contient que le spécifique projet.

## Contexte (5 lignes max)
- **Quoi** : configurateur et deviseur web des piscines bois Wood-Line. Il remplace le classeur Excel à macros des revendeurs. v1 de démonstration, modèle Bahia uniquement.
- **Pour qui** : Wood-Pool SA (Burdinne) — fiche CB : `../../Mémoire Claude/Clients/broers-bois/main.md`
- **Stack** : React 18 + Vite + TypeScript, vitest, jsPDF. Aucun back-end, aucun service externe.
- **Prod** : pas encore déployé.
- **Particularités** : voir ci-dessous, la règle d'acceptation n'est pas négociable.

## 🔴 La règle qui prime sur tout
`npm run acceptation` rejoue l'état enregistré du classeur du client et doit sortir
**12 231,00 / 6 522,00 / 18 753,00 €**. Un centime d'écart = le moteur est faux.
Ne jamais « corriger » un prix pour faire passer le test : c'est le seed qui fait foi.

## Ce qu'il ne faut pas faire
- Recalculer, arrondir ou marger un prix. Le seed `src/donnees/bahia.seed.json` est
  une copie octet pour octet de celui du CB : ne pas l'éditer ici.
- Traiter la tarification (`fixe` / `par_taille` / `par_taille_hauteur`) ailleurs que
  dans `moteur/prix.ts`. C'est le piège numéro un du portage.
- Inventer une option, un libellé ou une photo de produit. S'il manque une
  information, elle va dans `docs/questions-client.md`.
- Mettre React dans `src/moteur/` : ce module est pur, il sera réutilisé pour les
  autres modèles et pour l'API.
- 🔴 **Exporter un composant ET un hook (ou un contexte) depuis le même fichier.**
  C'est incompatible avec le Fast Refresh de React : après une édition, un navigateur
  déjà ouvert reste sur un mélange de modules, le contexte est perdu, et l'écran tombe
  en panne. Ça a coûté deux allers-retours le 29/08/2026. `src/hygiene.test.ts` échoue
  si la faute revient. Un module exporte SOIT des composants, SOIT des hooks et des
  contextes.

- 🔴 **Écrire un `useEffect` à flèche concise** (`useEffect(() => faire(), [x])`).
  L'effet retourne alors la valeur de `faire()`, que React prend pour la fonction de
  nettoyage. Avec `window.scrollTo`, ça a donné `destroy is not a function` sur un poste
  équipé d'une extension de défilement fluide, et pas sur le mien. Corps en bloc,
  toujours. `src/hygiene.test.ts` le vérifie.

## Quand quelque chose casse à l'écran
- Regarder **le journal de `npm run dev`** avant le code : `Could not Fast Refresh` et
  `Pre-transform error` y sont écrits en clair et désignent la cause.
- Après un renommage ou une suppression de fichier, redémarrer `npm run dev` : Vite
  garde une résolution de module périmée.
- L'écran d'erreur affiche le message, le composant fautif et l'écran concerné : c'est
  la première chose à lire, avant d'ouvrir quoi que ce soit.
- **Un bug qui n'apparaît que chez l'utilisateur** : penser à ce que son navigateur
  ajoute — extensions, `prefers-reduced-motion`, API redéfinies. Le reproduire en
  détournant l'API soupçonnée coûte deux minutes et évite trois allers-retours.

## Commandes
- Installer : `npm install`
- Lancer en dev : `npm run dev` (port 5180)
- Tester : `npm test` · acceptation seule : `npm run acceptation`
- Déployer : pas encore de procédure.
