# Démonstration devant Fabrice Landeloos — cinq gestes, cinq minutes

> Objectif : qu'il reconnaisse son produit, retrouve ses prix au centime, et
> comprenne en trente secondes ce qu'il gagne. Pas d'exhaustivité, pas de jargon.

## Avant d'ouvrir l'écran

```bash
cd "DEV/woodline-configurateur" && npm run dev
```

- **Faites tourner `npm run acceptation` une fois avant la réunion.** Les trois totaux
  doivent s'afficher. C'est votre filet.
- **Demandez-lui d'ouvrir son deviseur Excel sur son poste, feuille Bahia.** Toute la
  démonstration repose sur le fait qu'il compare en direct.
- Plein écran, zoom navigateur à 100 %, et **l'écran tourné vers lui**. C'est l'usage
  qu'il a décrit lui-même le 26/08.
- Si vous avez déjà cliqué avant : **Repartir de zéro** dans le récapitulatif.

---

## Geste 1 — « Voilà vos cinq modèles » · 0:00 → 0:30

Ouvrez `http://localhost:5180`.

> « Vos cinq modèles. La Bahia est chargée entièrement : les 12 variantes, les 40
> groupes d'options, les 118 options, avec vos photos de catalogue. Les quatre autres
> sont là pour vous montrer que la structure les attend. »

**Ne cliquez pas tout de suite.** Laissez-le regarder les cartes. Les photos sont les
siennes, prises dans son catalogue 2025.

Puis : **Configurer une Bahia**.

---

## Geste 2 — « C'est votre parcours, pas le mien » · 0:30 → 2:00

Vous êtes à l'étape 2. Montrez la colonne de gauche.

> « Les étapes sont numérotées comme dans votre catalogue papier. Étape 5 le joint
> périphérique, étape 6 le type de pose, étape 8 l'escalier. Chaque écran renvoie à sa
> page. »

Faites, dans cet ordre :

| Clic | Ce que vous dites |
|---|---|
| **400 x 400**, puis **H 143 cm** | « Le prix de base suit. » |
| Étape 3, **Pin Rouge 13cm** | « Les trois profils, avec vos photos de la page 40. » |
| Étape 4, **Blanc** | « Vos cinq coloris, page 41. » |
| Étape 5, cocher le **joint périphérique** | « 216 €. » |

**Le moment à ne pas manquer.** Revenez à l'étape 2 et repassez en **300 x 300**, puis
retournez à l'étape 5.

> « Regardez le joint : 216 € en 400x400, 168 € en 300x300. Le même joint. C'est votre
> règle, elle est dans le fichier, elle est ici. C'est exactement ce qu'un revendeur
> se trompe à recopier une fois sur deux. »

Remettez **400 x 400 · H 143 cm**.

Ouvrez ensuite l'**étape 9, le volet**.

> « Et là, la case grisée : le volet et plage immergés n'existe pas sur Bahia. Le
> revendeur ne peut plus le vendre par erreur. »

---

## Geste 3 — LA PREUVE · 2:00 → 2:45

**C'est le cœur de la démonstration. Ralentissez.**

Dans le récapitulatif à droite, cliquez **« Rejouer le devis enregistré du classeur »**.

> « Ce que je viens de charger, c'est l'état sauvegardé de VOTRE fichier, celui du
> 20 mars. Ouvrez-le. »

Laissez-le lire le total en haut à droite : **18 753,00 €**.

> « 12 231 € de piscine et d'options de pose, 6 522 € d'accessoires, 18 753 € au
> total. Les mêmes trois cases que votre feuille Bahia. Au centime. »

**Taisez-vous ici.** C'est le moment où il vérifie. Laissez-le vérifier.

S'il veut aller plus loin, montrez-lui le récapitulatif ligne à ligne : les sections
sont les siennes, dans son ordre, avec ses sous-totaux.

---

## Geste 4 — Le devis · 2:45 → 3:45

Cliquez **Voir le devis**.

> « La même feuille que votre onglet devis. Vos sections, vos sous-totaux, votre prix
> de la piscine. »

Remplissez deux champs seulement, en haut : un nom de revendeur, un nom de client.
Puis descendez au bloc bleu.

> « Et votre bloc réservé aux revendeurs : livraison, terrassement, dalle, montage,
> remise. Champs libres, comme aujourd'hui. »

Tapez **1800** dans Terrassement et **-900** dans Remise. Le total général suit.

Cliquez **Télécharger le PDF**, ouvrez-le.

> « Généré sur le poste du revendeur, sans rien envoyer nulle part. »

---

## Geste 5 — Ce qu'il gagne vraiment · 3:45 → 4:45

Onglet **Tarifs**. Tapez `joint` dans la recherche.

> « Vos 161 prix pour la Bahia. Le joint, ses deux tarifs. »

Passez **216** à **260** dans la colonne de droite. Le bandeau passe à
« 1 prix modifié, pas encore publié ».

> « Aujourd'hui, une hausse tarifaire, c'est rééditer le fichier et le renvoyer à tous
> vos revendeurs, qui travaillent trois mois de plus sur l'ancienne version. »

Cliquez **Publier la grille**.

**Regardez le total en haut à droite : il passe de 18 753,00 € à 18 797,00 €.**

> « Voilà. C'est fait. Tous vos revendeurs configurent sur ce prix à la seconde
> suivante. Il n'y a plus de fichier à renvoyer à personne, et plus personne ne peut
> travailler sur une version périmée. »

Cliquez **Revenir au tarif d'origine** pour laisser la démonstration propre.

---

## Si on vous pose ces questions

| Il demande | Répondez |
|---|---|
| « Et mes quatre autres modèles ? » | « Même structure, même moteur. C'est du remplissage de données, pas du développement. La Bahia a servi à prouver que le portage est exact. » |
| « Et la grille revendeurs ? » | « Je ne l'ai pas. Le fichier que vous m'avez donné est la grille PARTICULIERS. Il me la faut pour la suite — c'est écrit dans mes questions. » |
| « Où sont les devis ? » | « Pas dans cette v1. C'est la brique suivante : chaque devis rattaché à un revendeur et à un client, et on sait enfin ce qui se transforme. » |
| « C'est hébergé où ? » | « Rien n'est décidé. Vous avez 150 000 $ de crédits Azure : ça se pose sur votre propre tenant. » |
| « Combien ça coûte ? » | Rien n'est chiffré à ce stade. Ne pas improviser un prix. |

## Ce qu'il ne faut pas faire

- **Ne promettez pas une date de mise en production.** Cette v1 n'est pas déployée.
- **Ne parlez pas des chiffres de sa société.** Le signal financier du CB ne se cite
  jamais devant lui.
- **N'improvisez pas un prix de prestation.**
- Si un écart apparaît sur un total, **ne le défendez pas** : notez-le et vérifiez
  après. Le fichier fait foi, c'est ce qui rend la démonstration crédible.

## Le fil de secours

Si le poste lâche, `npm run acceptation` en terminal affiche les trois totaux en deux
secondes. C'est la démonstration réduite à sa preuve.

Si un écran se fige ou affiche « L'écran s'est interrompu » : cliquez
**Repartir de zéro**, l'application repart neuve et la grille tarifaire est intacte.
Rechargez ensuite et reprenez au geste 3, qui se rejoue en un clic.
