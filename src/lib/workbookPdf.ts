import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { Translate } from "../i18n/LanguageContext";
import type { StringKey } from "../i18n/en";
import { checkKey, checklistFor, questionKey } from "../content/workbook";
import { formatMoney } from "./money";
import { goalPlan, professionalQuestions, snapshot, type DebtLine, type Line, type WorkbookData } from "./workbook";

const MARGIN = 48;
const INK: [number, number, number] = [10, 26, 51];
const ACCENT: [number, number, number] = [31, 79, 216];
const SOFT: [number, number, number] = [74, 85, 104];

type Doc = jsPDF & { lastAutoTable?: { finalY: number } };

/** Builds the client's workbook as a dated PDF and starts the download. */
export async function exportWorkbookPdf(w: WorkbookData, t: Translate, today: Date) {
  const doc: Doc = new jsPDF({ unit: "pt", format: "letter" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const textWidth = width - MARGIN * 2;
  const dateText = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const s = snapshot(w);
  let y = MARGIN;

  const ensureRoom = (needed: number) => {
    if (y + needed > height - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };
  const heading = (text: string) => {
    ensureRoom(40);
    y += 10;
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...INK);
    doc.text(text, MARGIN, y);
    doc.setDrawColor(...INK).setLineWidth(1).line(MARGIN, y + 5, width - MARGIN, y + 5);
    y += 18;
  };
  const paragraph = (text: string, size = 9, color: [number, number, number] = SOFT) => {
    doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(...color);
    const lines = doc.splitTextToSize(text, textWidth) as string[];
    ensureRoom(lines.length * size * 1.35);
    doc.text(lines, MARGIN, y);
    y += lines.length * size * 1.35 + 6;
  };
  const table = (head: string[], body: string[][], rightAligned: number[] = []) => {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [head],
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5, lineColor: [220, 225, 232], lineWidth: 0.5, textColor: INK },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: "bold" },
      columnStyles: Object.fromEntries(rightAligned.map((i) => [i, { halign: "right" as const }])),
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 14;
  };
  const amountRows = (lines: Line[], perYear = false) =>
    lines.filter((l) => l.label.trim() || l.amount !== null).map((l) => [l.label || "—", l.amount === null ? "—" : perYear ? t("wb.pdf.perYear", { amount: formatMoney(l.amount) }) : formatMoney(l.amount)]);

  // Title block
  doc.setFillColor(...INK).rect(MARGIN, y - 4, 26, 26, "F");
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255).text("TCV", MARGIN + 5, y + 12);
  doc.setFontSize(18).setTextColor(...INK).text(t("wb.title"), MARGIN + 38, y + 10);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...SOFT).text(t("wb.pdf.prepared", { date: dateText }), MARGIN + 38, y + 24);
  y += 44;
  paragraph(t("wb.pdf.disclaimer"), 8);

  if (w.stage || w.payType) {
    const about = [w.stage && `${t("wb.stage.label")}: ${t(`wb.stage.${w.stage}` as StringKey)}`, w.payType && `${t("wb.pay.label")}: ${t(`wb.pay.${w.payType}` as StringKey)}`].filter(Boolean).join("   ·   ");
    paragraph(about, 10, INK);
  }

  heading(t("wb.cashflow.title"));
  const amount = t("wb.pdf.colAmount");
  for (const [titleKey, lines, perYear] of [
    ["wb.income.title", w.income, false],
    ["wb.fixed.title", w.fixed, false],
    ["wb.variable.title", w.variable, false],
    ["wb.occasional.title", w.occasional, true],
  ] as const) {
    const rows = amountRows(lines as Line[], perYear);
    if (rows.length) table([t(titleKey), amount], rows, [1]);
  }
  table(
    [t("wb.pdf.colFigure"), amount],
    [
      [t("wb.fig.monthlyIncome"), formatMoney(s.monthlyIncome)],
      [t("wb.fig.monthlyExpenses"), formatMoney(s.monthlyExpenses)],
      [t("wb.fig.cashFlow"), formatMoney(s.cashFlow)],
    ],
    [1]
  );

  heading(t("wb.networth.title"));
  for (const [titleKey, lines] of [
    ["wb.cash.title", w.cash],
    ["wb.otherAssets.title", w.otherAssets],
  ] as const) {
    const rows = amountRows(lines);
    if (rows.length) table([t(titleKey), amount], rows, [1]);
  }
  const debtRows = (w.debts as DebtLine[])
    .filter((l) => l.label.trim() || l.amount !== null)
    .map((l) => [l.label || "—", l.amount === null ? "—" : formatMoney(l.amount), l.rate === null ? "—" : `${l.rate}%`]);
  if (debtRows.length) table([t("wb.debts.title"), amount, t("wb.debts.rate")], debtRows, [1, 2]);
  table(
    [t("wb.pdf.colFigure"), amount],
    [
      [t("wb.fig.totalAssets"), formatMoney(s.totalAssets)],
      [t("wb.fig.totalDebts"), formatMoney(s.totalDebts)],
      [t("wb.fig.netWorth"), formatMoney(s.netWorth)],
      [t("wb.fig.monthsCovered"), s.monthsCovered === null ? "—" : t("wb.fig.months", { months: s.monthsCovered })],
    ],
    [1]
  );

  heading(t("wb.goals.title"));
  const goals = w.goals.filter((g) => g.name.trim());
  if (goals.length) {
    table(
      [t("wb.goal.name"), t("wb.goal.target"), t("wb.goal.saved"), t("wb.goal.date"), t("wb.pdf.colPlan")],
      goals.map((g) => {
        const plan = goalPlan(g, today);
        const planText =
          plan.status === "onTrack"
            ? t("wb.goal.monthly", { amount: formatMoney(plan.monthlyNeeded ?? 0), months: plan.months ?? 0 })
            : plan.status === "reached"
              ? t("wb.goal.reached")
              : plan.status === "pastDate"
                ? t("wb.goal.pastDate")
                : "—";
        return [g.name, g.target === null ? "—" : formatMoney(g.target), g.saved === null ? "—" : formatMoney(g.saved), g.date || "—", planText];
      }),
      [1, 2]
    );
  }
  paragraph(t("wb.goals.help"), 8);

  heading(t("wb.checklist.title"));
  const visible = checklistFor(w.stage);
  table(
    [t("wb.pdf.colStatement"), t("wb.pdf.colAnswer")],
    visible.map((c) => {
      const answer = w.checklist[c.id];
      return [t(checkKey(c.id)), answer ? t(`wb.answer.${answer}` as StringKey) : t("wb.pdf.notAnswered")];
    })
  );

  heading(t("wb.questions.title"));
  const questions = professionalQuestions(w, visible.map((c) => c.id), today);
  if (questions.length === 0) paragraph(t("wb.questions.empty"));
  questions.forEach((id, i) => paragraph(`${String(i + 1).padStart(2, "0")}   ${t(questionKey(id))}`, 10, INK));
  paragraph(t("wb.questions.help"), 8);

  // Footer on every page: page number and the short disclaimer.
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...SOFT);
    doc.text(t("site.footer.disclaimer"), MARGIN, height - 24);
    doc.setTextColor(...ACCENT).text(t("wb.pdf.page", { page: p, pages }), width - MARGIN, height - 24, { align: "right" });
  }

  doc.save(`tcv-workbook-${today.toISOString().slice(0, 10)}.pdf`);
}
