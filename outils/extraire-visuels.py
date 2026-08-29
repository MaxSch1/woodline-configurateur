#!/usr/bin/env python3
"""Extrait les visuels du catalogue Wood-Line 2025 vers public/visuels/.

    python3 outils/extraire-visuels.py public/visuels /tmp/rendu-catalogue

Chaque entree de CROPS est (nom, page du catalogue, boite de recadrage, largeur
cible, format). Les coordonnees sont exprimees dans le referentiel d'une page rendue
a 100 dpi (827 x 827 px) ; le script rend la page a 300 dpi et met la boite a
l'echelle. Dependances : poppler (pdftoppm) et Pillow.

Le catalogue source n'est pas versionne ici : il vit dans ~/Downloads. Les images
produites, elles, sont commitees — c'est ce qui rend le repo autonome.
"""
import os, subprocess, sys
from PIL import Image

PDF = os.path.expanduser("~/Downloads/Catalogue Wood-Line 2025 V1.pdf")
OUT = sys.argv[1]
TMP = sys.argv[2]
DPI = 300
K = DPI / 100.0

# nom, page, (x0,y0,x1,y1) en 100dpi, largeur cible
CROPS = [
    ("logo-woodline",            13, (352, 763, 474, 803), 700, "PNG"),
    ("modele-bahia",             13, (78, 243, 750, 697), 1100, "JPEG"),
    ("modele-atoll",              9, (78, 243, 750, 697), 1100, "JPEG"),
    ("modele-classy",            17, (78, 243, 750, 697), 1100, "JPEG"),
    ("modele-fidji",             21, (78, 243, 750, 697), 1100, "JPEG"),
    ("modele-longhi",            25, (78, 243, 750, 697), 1100, "JPEG"),
    ("essence-pin-13",           40, (38, 285, 210, 398), 520, "JPEG"),
    ("essence-pin-65",           40, (38, 488, 210, 608), 520, "JPEG"),
    ("essence-bilinga-13",       40, (38, 635, 210, 748), 520, "JPEG"),
    ("liner-anthracite",         41, (326, 219, 409, 303), 300, "JPEG"),
    ("liner-blanc",              41, (326, 320, 409, 403), 300, "JPEG"),
    ("liner-gris-clair",         41, (326, 412, 409, 495), 300, "JPEG"),
    ("liner-sable",              41, (326, 508, 409, 591), 300, "JPEG"),
    ("liner-bleu",               41, (326, 604, 409, 688), 300, "JPEG"),
    ("joint-peripherique",       42, (596, 136, 694, 284), 420, "JPEG"),
    ("pose-types",               42, (42, 443, 612, 553), 1000, "JPEG"),
    ("poutrelles",               42, (563, 588, 688, 746), 420, "JPEG"),
    ("margelles-pin",            44, (452, 264, 580, 359), 500, "JPEG"),
    ("margelles-ipe",            44, (452, 454, 580, 549), 500, "JPEG"),
    ("escalier-triangulaire",    46, (188, 252, 374, 442), 600, "JPEG"),
    ("escalier-toute-largeur",   46, (598, 252, 786, 442), 600, "JPEG"),
    ("volet-hors-sol",           48, (257, 586, 590, 772), 900, "JPEG"),
    ("spot-252",                 54, (58, 197, 178, 299), 450, "JPEG"),
    ("spot-3-9",                 54, (74, 324, 163, 403), 400, "JPEG"),
    ("spot-ambiance",            54, (40, 506, 396, 746), 950, "JPEG"),
    ("local-technique-4",        57, (443, 172, 703, 346), 800, "JPEG"),
    ("local-technique-5",        57, (428, 528, 703, 739), 800, "JPEG"),
    ("douche-alu",               59, (42, 157, 217, 398), 560, "JPEG"),
    ("douche-pvc",               59, (427, 157, 603, 398), 560, "JPEG"),
    ("douche-hybride",           59, (46, 450, 213, 691), 560, "JPEG"),
    ("caillebotis-ipe",          59, (427, 451, 606, 566), 560, "JPEG"),
    ("caillebotis-composite",    59, (427, 567, 606, 683), 560, "JPEG"),
    ("pac-onoff",                60, (487, 199, 779, 391), 850, "JPEG"),
    ("pac-full-inverter",        61, (525, 199, 779, 391), 850, "JPEG"),
    ("couverture-wood",          67, (498, 151, 769, 353), 800, "JPEG"),
    ("couverture-barres",        67, (503, 444, 779, 606), 800, "JPEG"),
    ("couverture-bulle",         66, (498, 151, 769, 353), 800, "JPEG"),
    ("robot-zodiac",             69, (566, 179, 763, 311), 600, "JPEG"),
    ("robot-sans-fil",           69, (568, 337, 765, 495), 600, "JPEG"),
]

os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
cache = {}
def page(n):
    if n not in cache:
        base = os.path.join(TMP, f"hi{n}")
        subprocess.run(["pdftoppm", "-png", "-r", str(DPI), "-f", str(n), "-l", str(n), PDF, base], check=True)
        f = [x for x in os.listdir(TMP) if x.startswith(f"hi{n}-")][0]
        cache[n] = Image.open(os.path.join(TMP, f)).convert("RGB")
    return cache[n]

for nom, p, box, largeur, fmt in CROPS:
    img = page(p)
    b = tuple(int(round(v * K)) for v in box)
    c = img.crop(b)
    if c.width > largeur:
        c = c.resize((largeur, int(round(c.height * largeur / c.width))), Image.LANCZOS)
    ext = "png" if fmt == "PNG" else "jpg"
    dest = os.path.join(OUT, f"{nom}.{ext}")
    if fmt == "PNG":
        c.save(dest, "PNG", optimize=True)
    else:
        c.save(dest, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"{nom}.{ext}  {c.size[0]}x{c.size[1]}  {os.path.getsize(dest)//1024} Ko")
