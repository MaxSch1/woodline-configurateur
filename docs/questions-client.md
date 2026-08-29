# Questions ouvertes pour Wood-Pool

> Établi le 29/08/2026 en construisant la v1. Ce qui suit n'a **pas** été deviné :
> ce sont les points où l'information manquait ou était ambiguë. Ils complètent la
> section 10 de `ANALYSE-deviseur-excel.md`.

## 1. Un sous-total faux dans le classeur actuel

Sur la feuille `Bahia devis`, le sous-total « Options courantes » (cellule H19) vaut
`SOMME(D20:D25)`. La télécommande est en D26 : **elle est hors de la plage**. Le
sous-total affiche donc 740 € au lieu de 865 € dans l'état enregistré.

Le total général D77 (`SOMME(D12:D76)`) balaye bien tout : **le prix final du classeur
est juste**, seul le sous-total de section est court de 125 €. La plateforme, elle,
affiche 865 €.

**À confirmer** : c'est bien une erreur de formule, à corriger ? Et faut-il vérifier la
même plage sur les quatre autres modèles ?

## 2. Les lignes à zéro sur le devis imprimé

Le classeur imprime toutes les lignes, y compris « Sans robot », « Pas de couverture
hivernale », « Sans bonde » à 0 €. Sur le devis remis à un client, cela fait une
vingtaine de lignes vides qui noient l'offre.

**Choix fait dans cette v1** : n'imprimer que les lignes qui portent un montant, plus
la piscine et son coloris de liner. **Aucun total n'est affecté** (un test le vérifie).

**À confirmer** : est-ce le bon choix, ou tenez-vous à voir écrit ce qui n'est pas
compris ?

## 3. Escalier « Toute largeur » ou « Entre angles droits » ?

Le deviseur nomme l'option **« Toute largeur »**. Le catalogue 2025, page 46, présente
sur Bahia un escalier **« Entre angles droits »**. Nous avons supposé que c'est le même
produit et utilisé la photo du catalogue, en gardant le libellé du deviseur.

**À confirmer** : même produit, ou deux escaliers différents ?

## 4. Douches « acier » ou « aluminium » ?

Le deviseur propose « Douche solaire acier noir » et « Douche solaire acier imitation
bois (brun) ». Le catalogue page 59 décrit une **douche solaire aluminium**, disponible
en deux coloris, noir ou brun imitation bois. Les deux coloris coïncident exactement.

Nous avons supposé qu'il s'agit du même produit et utilisé la photo du catalogue.

**À confirmer** : et si oui, quel mot garder sur le devis ?

## 5. Les accents perdus

Le seed a été extrait du classeur en ASCII : les libellés avaient perdu leurs accents
(« Joint peripherique de sol »). Ils ont été rétablis — 54 repris directement de la
table de chaînes du classeur, 19 à la main faute d'appariement exact. Détail et
justification : `src/donnees/libelles.ts`.

**Rien à confirmer côté client**, mais à corriger à la source lors de la prochaine
extraction.

## 6. La grille revendeurs — bloquant pour la suite

Le fichier fourni est la version **« Tarifs PARTICULIERS »**. Il nous manque :

- la version revendeurs du deviseur, pour vérifier qu'elle suit la même structure ;
- **la règle exacte de la remise revendeur**, aujourd'hui tapée à la main dans le devis ;
- la grille de remises par statut de revendeur, si elle existe.

Sans cela, la plateforme ne peut pas servir de deviseur revendeur : elle ne sait
chiffrer qu'au tarif public.

## 7. Les images produit

Toutes les images de la v1 sont des recadrages du catalogue 2025 (`docs/visuels.md`).

**À obtenir** : soit les fichiers sources, soit l'autorisation formelle d'extraire ceux
du catalogue. Et les photos manquantes : local technique n°6, local à adosser,
enrouleurs, moteurs, sondes.

## 8. Options tarifées mais sans règle apparente

Quelques points relevés sans réponse dans le fichier :

- Le **kit hydraulique** est nul dans le seed pour Bahia, alors que le catalogue
  (page 15) indique un kit n°1. Est-il compris dans le prix du kit, ou faut-il le
  faire apparaître ?
- Le **pack poutrelles** dépend du type de pose, mais le classeur ne demande jamais
  quel type de pose est retenu : il laisse le revendeur choisir directement le pack.
  Faut-il poser la question du type de pose (hors-sol, semi-enterrée, enterrée) et en
  déduire le pack, comme le suggère le tableau de la page 43 ?
- Les **caches poutrelles** se comptent en quantité mais rien ne relie cette quantité
  au nombre de poutrelles commandé, que la page 43 donne pourtant (4 en 300x300,
  8 en 400x400). Automatisable ?

## 9. Ce qui n'est pas dans le périmètre de la v1, pour mémoire

Les quatre autres modèles, l'authentification, les comptes revendeurs et leurs droits,
le branchement CRM, l'envoi d'e-mails, les paiements.
