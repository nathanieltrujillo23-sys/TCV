import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { Transaction } from "../types";
import { formatCurrency, transactionTotal } from "./format";
import { monthlyPnl, quarterlyPnl, yearlyPnl, type PnlRow } from "./pnl";
import { rangeLabel, type DateRange } from "./period";
import { svgToPngDataUrl } from "./svgToImage";
import { SLICE_COLORS } from "../components/PieChart";
import type { BreakdownItem } from "./breakdown";

const MARGIN = 40;
const CHART_BG = "#1e293b";

export interface ChartCapture {
  title: string;
  svg: SVGSVGElement;
}

export async function exportSummaryPdf({
  transactions,
  range,
  totals,
  charts,
  expenseBreakdown,
}: {
  transactions: Transaction[];
  range: DateRange;
  totals: { income: number; expense: number; net: number; netMargin: number | null };
  charts: ChartCapture[];
  expenseBreakdown: BreakdownItem[];
}): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = MARGIN;

  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text("TRUCAPITALVENTURES — Financial Summary", MARGIN, y);
  y += 22;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Selected period: ${rangeLabel(range)}`, MARGIN, y);
  y += 14;
  doc.text(`Generated ${new Date().toLocaleString()}`, MARGIN, y);
  y += 24;

  doc.setFontSize(12);
  doc.setTextColor(20);
  const marginLine = [
    `Income: ${formatCurrency(totals.income)}`,
    `Expenses: ${formatCurrency(totals.expense)}`,
    `Net: ${formatCurrency(totals.net)}`,
    totals.netMargin !== null ? `Net margin: ${totals.netMargin.toFixed(0)}%` : null,
  ]
    .filter(Boolean)
    .join("    ");
  doc.text(marginLine, MARGIN, y);
  y += 26;

  for (const { title, svg } of charts) {
    const { dataUrl, width, height } = await svgToPngDataUrl(svg, CHART_BG);
    const imgWidth = Math.min(pageWidth - MARGIN * 2, width);
    const imgHeight = (height / width) * imgWidth;

    if (y + imgHeight + 30 > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text(title, MARGIN, y);
    y += 10;
    doc.addImage(dataUrl, "PNG", MARGIN, y, imgWidth, imgHeight);
    y += imgHeight + 10;

    if (title === "Where expenses went" && expenseBreakdown.length > 0) {
      y = addPieLegend(doc, expenseBreakdown, MARGIN, y);
    }
    y += 16;
  }

  doc.addPage();
  addPnlTable(doc, "Profit & Loss — Monthly", monthlyPnl(transactions), MARGIN);

  doc.addPage();
  addPnlTable(doc, "Profit & Loss — Quarterly", quarterlyPnl(transactions), MARGIN);

  doc.addPage();
  addPnlTable(doc, "Profit & Loss — Yearly", yearlyPnl(transactions), MARGIN);

  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text("Itemized transactions — all time", MARGIN, MARGIN);

  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  autoTable(doc, {
    startY: MARGIN + 14,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Date", "Type", "Item / Vendor", "Qty", "Unit price", "Total"]],
    body: sorted.map((t) => [
      new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      t.type === "income" ? "Income" : "Expense",
      t.type === "expense" ? t.item || "—" : t.vendor || "—",
      String(t.type === "expense" ? (t.purchases ?? 1) : (t.accounts ?? 1)),
      formatCurrency(t.amount),
      formatCurrency(transactionTotal(t)),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const rowType = sorted[data.row.index]?.type;
        data.cell.styles.textColor = rowType === "income" ? [16, 150, 90] : [220, 38, 38];
      }
    },
  });

  doc.save(`tcv-summary-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function addPnlTable(doc: jsPDF, title: string, rows: PnlRow[], margin: number) {
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text(title, margin, margin);
  autoTable(doc, {
    startY: margin + 14,
    margin: { left: margin, right: margin },
    head: [["Period", "Income", "Expenses", "Net"]],
    body: rows.map((r) => [r.label, formatCurrency(r.income), formatCurrency(r.expense), formatCurrency(r.net)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const net = rows[data.row.index]?.net ?? 0;
        data.cell.styles.textColor = net >= 0 ? [16, 150, 90] : [220, 38, 38];
      }
    },
  });
}

function addPieLegend(doc: jsPDF, items: BreakdownItem[], margin: number, startY: number): number {
  let y = startY;
  doc.setFontSize(9);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const color = hexToRgb(SLICE_COLORS[i % SLICE_COLORS.length]);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, y - 7, 8, 8, "F");
    doc.setTextColor(40);
    doc.text(`${item.label} — ${formatCurrency(item.value)} (${item.percent.toFixed(0)}%)`, margin + 14, y);
    y += 13;
  }
  return y;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
