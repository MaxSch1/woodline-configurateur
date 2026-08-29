# D'où viennent les images

Toutes les images de `public/visuels/` sont des recadrages du **catalogue Wood-Line 2025
V1** (84 pages), fourni par le client. Aucune image n'a été produite, retouchée ou
cherchée ailleurs : une option dont la photo n'a pas été identifiée dans le catalogue
reste sans photo, et l'interface affiche à sa place une pastille sobre.

## Reproduire l'extraction

```bash
python3 outils/extraire-visuels.py public/visuels /tmp/rendu-catalogue
```

Le script attend `~/Downloads/Catalogue Wood-Line 2025 V1.pdf`, `pdftoppm` (poppler) et
Pillow. Il rend chaque page utile à 300 dpi et découpe la zone déclarée dans sa table
`CROPS`, dont les coordonnées sont exprimées sur une page rendue à 100 dpi.

## Correspondance page par page

| Écran | Page du catalogue | Ce qui en est tiré |
|---|---|---|
| Choix du modèle | 9, 13, 17, 21, 25 | La photo pleine page de chaque modèle |
| Logotype | 13 (pied de page) | Le logo Wood-Line |
| Étape 3 — essence | 40 | Les trois profils : PRN 130, PRN 65, Bilinga 130 |
| Étape 4 — liner | 41 | Les cinq nuanciers de coloris |
| Étape 5 — joint | 42 | Le joint périphérique |
| Étape 6 — type de pose | 42, 43 | Le schéma des trois poses, les deux profils de poutrelles |
| Étape 7 — margelles | 44 | Margelles pin rouge et margelles monobloc ipé |
| Étape 8 — escalier | 46 | Triangulaire et entre angles droits |
| Étape 9 — volet | 48 | Le volet hors-sol posé |
| Étape 10 — éclairage | 54 | Spots 252 LED, spots 3/9 LED, ambiance de nuit |
| Couvertures | 66, 67 | Couverture à bulles, Wood, à barres |
| Pompes à chaleur | 60, 61 | On/Off et Full Inverter |
| Locaux techniques | 57 | Locaux n°4 et n°5 |
| Douches et caillebotis | 59 | Alu, PVC, hybride, caillebotis ipé et composite |
| Robots | 69 | Zodiac RT 3200 et robot sans fil |

## Ce qui reste sans visuel

Le local technique n°6 et le local à adosser, les enrouleurs, les moteurs, les sondes
et la plupart des petites pièces techniques. Le catalogue les décrit mais la photo n'a
pas été isolée avec certitude. Plutôt que de mettre la photo d'à côté, l'interface
affiche une pastille neutre.

## Droits

Ces images appartiennent à Wood-Pool SA. Elles ne sont utilisées que dans un outil
construit pour ce client. Le point 10 de l'analyse note qu'il faut leur demander soit
les fichiers sources, soit l'autorisation formelle d'extraire ceux du catalogue.
