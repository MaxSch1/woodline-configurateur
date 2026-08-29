import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formaterEuros, intituleLigne, lignesImprimables } from "../moteur/prix";
import type { Catalogue, Devis } from "../moteur/types";
import type { Client, Revendeur } from "../etat/useConfigurateur";

/**
 * Generation du PDF cote client, sans service externe : jsPDF est embarque dans le
 * bundle, rien ne sort du navigateur. La mise en page suit la feuille
 * « <Modele> devis » du classeur : sections avec sous-totaux, prix de la piscine,
 * bloc reserve aux revendeurs, total general.
 */

const TERRE: [number, number, number] = [171, 77, 19];
const BORDEAUX: [number, number, number] = [116, 10, 1];
const ENCRE: [number, number, number] = [36, 26, 19];
const DOUCE: [number, number, number] = [107, 92, 80];
const TRAIT: [number, number, number] = [231, 222, 214];
const PALE: [number, number, number] = [246, 236, 228];

export interface ParametresDevis {
  catalogue: Catalogue;
  devis: Devis;
  client: Client;
  revendeur: Revendeur;
  date: string;
}

/** Le logo, converti en data URI pour etre embarque dans le PDF. */
async function chargerLogo(): Promise<string | null> {
  try {
    const reponse = await fetch("/visuels/logo-woodline.png");
    if (!reponse.ok) return null;
    const blob = await reponse.blob();
    return await new Promise<string>((resoudre, rejeter) => {
      const lecteur = new FileReader();
      lecteur.onload = () => resoudre(lecteur.result as string);
      lecteur.onerror = rejeter;
      lecteur.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function euros(montant: number): string {
  return formaterEuros(montant).replace(/ | /g, " ");
}

export async function genererDevisPdf(p: ParametresDevis): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largeur = doc.internal.pageSize.getWidth();
  const marge = 16;

  // ---------------------------------------------------------------- En-tete --
  const logo = await chargerLogo();
  if (logo) doc.addImage(logo, "PNG", marge, 12, 34, 11.2);

  doc.setFont("times", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...BORDEAUX);
  doc.text(p.catalogue.modele.nom.toUpperCase(), largeur / 2, 24, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...DOUCE);
  doc.text(
    [`Date : ${p.date}`, `Tarif ${p.catalogue.meta.version_tarif}`, p.catalogue.meta.tva],
    largeur - marge,
    15,
    { align: "right" },
  );

  doc.setDrawColor(...TERRE);
  doc.setLineWidth(0.8);
  doc.line(marge, 28, largeur - marge, 28);

  // ------------------------------------------------------- Parties du devis --
  const colonne = (x: number, titre: string, lignes: [string, string][]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...TERRE);
    doc.text(titre.toUpperCase(), x, 35);
    doc.setDrawColor(...TRAIT);
    doc.setLineWidth(0.2);
    doc.line(x, 36.6, x + 78, 36.6);

    let y = 41;
    for (const [etiquette, valeur] of lignes) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...DOUCE);
      doc.text(etiquette, x, y);
      doc.setTextColor(...ENCRE);
      doc.setFont("helvetica", valeur ? "bold" : "normal");
      doc.text(valeur || "—", x + 24, y);
      y += 5;
    }
  };

  colonne(marge, "Revendeur", [
    ["Nom", p.revendeur.nom],
    ["Adresse", p.revendeur.adresse],
    ["Téléphone", p.revendeur.telephone],
    ["Email", p.revendeur.email],
    ["N° d'entreprise", p.revendeur.numero],
    ["Validité", p.revendeur.validite],
  ]);
  colonne(largeur / 2 + 2, "Client", [
    ["Nom", p.client.nom],
    ["Adresse", p.client.adresse],
    ["Téléphone", p.client.telephone],
    ["Email", p.client.email],
  ]);

  // ------------------------------------------------------- Corps du devis ----
  type Rangee = { etape: string; intitule: string; precision: string; montant: string };
  const corps: Rangee[] = [];
  const rangeesDeSection: number[] = [];

  for (const section of p.devis.sections) {
    const lignes = lignesImprimables(section);
    if (lignes.length === 0) continue;
    rangeesDeSection.push(corps.length);
    corps.push({
      etape: "",
      intitule: section.titre,
      precision: "",
      montant: euros(section.sousTotal),
    });
    for (const ligne of lignes) {
      corps.push({
        etape: ligne.etape ?? "",
        intitule: intituleLigne(ligne),
        precision: ligne.quantite ? `× ${ligne.quantite}` : "",
        montant: ligne.montant ? euros(ligne.montant) : "—",
      });
    }
  }

  autoTable(doc, {
    startY: 72,
    margin: { left: marge, right: marge },
    head: [["Étape", "Intitulé", "Qté", "Montant"]],
    body: corps.map((r) => [r.etape, r.intitule, r.precision, r.montant]),
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8.4, cellPadding: { top: 1.3, bottom: 1.3, left: 2, right: 2 }, textColor: ENCRE },
    headStyles: {
      fontSize: 7,
      fontStyle: "bold",
      textColor: [156, 141, 129],
      lineWidth: { bottom: 0.35 },
      lineColor: TRAIT,
    },
    columnStyles: {
      0: { cellWidth: 18, textColor: [156, 141, 129], fontSize: 7.4 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 12, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
    didParseCell: (donnees) => {
      if (donnees.section !== "body") return;
      if (rangeesDeSection.includes(donnees.row.index)) {
        donnees.cell.styles.fillColor = PALE;
        donnees.cell.styles.fontStyle = "bold";
        donnees.cell.styles.textColor = donnees.column.index === 3 ? ENCRE : TERRE;
        donnees.cell.styles.fontSize = donnees.column.index === 3 ? 8.6 : 7.6;
      } else {
        donnees.cell.styles.lineWidth = { bottom: 0.1 } as never;
        donnees.cell.styles.lineColor = TRAIT;
        if (donnees.column.index === 3 && donnees.cell.text[0] === "—") {
          donnees.cell.styles.textColor = [156, 141, 129];
        }
      }
    },
  });

  // ------------------------------------------------------ Prix de la piscine --
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  y = nouvellePageSiBesoin(doc, y, 40);

  doc.setDrawColor(...TERRE);
  doc.setLineWidth(0.8);
  doc.line(marge, y, largeur - marge, y);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BORDEAUX);
  doc.text("Prix de la piscine", marge + 2, y + 7.5);
  doc.text(euros(p.devis.prixDeLaPiscine), largeur - marge - 2, y + 7.5, { align: "right" });
  doc.line(marge, y + 11, largeur - marge, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...DOUCE);
  doc.text(
    `dont piscine et options de pose ${euros(p.devis.piscineEtOptionsDePose)} · accessoires ${euros(p.devis.accessoires)}`,
    largeur - marge - 2,
    y + 15,
    { align: "right" },
  );

  // ------------------------------------------------------- Bloc revendeur ----
  y = nouvellePageSiBesoin(doc, y + 24, 60);
  doc.setFillColor(234, 245, 252);
  doc.setDrawColor(207, 230, 246);
  doc.setLineWidth(0.2);
  const hauteurBloc = 14 + p.devis.blocRevendeur.length * 5.6;
  doc.roundedRect(marge, y, largeur - 2 * marge, hauteurBloc, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 114, 188);
  doc.text("RÉSERVÉ AUX REVENDEURS", marge + 4, y + 6);

  let yLigne = y + 12;
  for (const ligne of p.devis.blocRevendeur) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.4);
    doc.setTextColor(...ENCRE);
    doc.text(ligne.libelle, marge + 4, yLigne);
    doc.setFont("helvetica", "bold");
    doc.text(euros(ligne.montant), marge + 78, yLigne, { align: "right" });
    yLigne += 5.6;
  }

  y += hauteurBloc + 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.6);
  doc.setTextColor(...ENCRE);
  doc.text("Total installation", marge + 4, y);
  doc.text(euros(p.devis.totalInstallation), marge + 78, y, { align: "right" });

  // -------------------------------------------------------- Total general ----
  y = nouvellePageSiBesoin(doc, y + 8, 26);
  doc.setFillColor(...TERRE);
  doc.roundedRect(marge, y, largeur - 2 * marge, 16, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL PISCINE ET INSTALLATION", marge + 5, y + 10);
  doc.setFont("times", "bold");
  doc.setFontSize(17);
  doc.text(euros(p.devis.totalGeneral), largeur - marge - 5, y + 11, { align: "right" });

  // ---------------------------------------------------------------- Pied -----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    const bas = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(...TRAIT);
    doc.setLineWidth(0.2);
    doc.line(marge, bas - 4, largeur - marge, bas - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(156, 141, 129);
    doc.text(
      `Wood-Line — Wood-Pool SA, Burdinne · ${p.catalogue.meta.avertissement}`,
      marge,
      bas,
    );
    doc.text(`${i} / ${pages}`, largeur - marge, bas, { align: "right" });
  }

  return doc;
}

function nouvellePageSiBesoin(doc: jsPDF, y: number, besoin: number): number {
  if (y + besoin > doc.internal.pageSize.getHeight() - 18) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function nomDuFichier(devis: Devis, client: Client): string {
  const nom = client.nom.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  const bassin = `${devis.variante.taille}`.replace(/\s/g, "");
  return `devis-woodline-bahia-${bassin}${nom ? `-${nom}` : ""}.pdf`;
}
