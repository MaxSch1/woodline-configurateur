# Changelog — woodline-configurateur

> Une entrée datée par mise à jour ou problème rencontré. Récent en haut. Append-only.

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
