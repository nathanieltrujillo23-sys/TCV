// Finds user facing text written straight into components instead of going
// through t() and src/i18n/strings. Looks at JSX text and at the attributes a
// person can see or hear (placeholder, title, alt, aria-label).
//
// Usage: npm run check:strings            fail if new code has hard coded text
//        npm run check:strings -- --all   also list the older ledger screens
//
// The ledger screens (LEGACY below) came from the original accounting app and
// are translated in a later pass; they are reported but do not fail the check.

import ts from "typescript";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");
const ATTRS = new Set(["placeholder", "title", "alt", "aria-label"]);

// Original ledger components. Everything else must use t().
const LEGACY = new Set(
  [
    "AccountMenu", "AuditLogPanel", "AveragesCard", "BreakdownList", "ChartTooltip", "ComparisonTrendChart",
    "CumulativeChart", "Dashboard", "DateInput", "DateRangePicker", "ExpenseForm", "ExportPdfButton", "ForecastChart",
    "GrowthCard", "ImportPanel", "IncomeForm", "ManageListsPanel", "MarginTrendChart", "MigrationPrompt", "Modal",
    "PieChart", "PresetsPanel", "SearchPanel", "Segmented", "SummaryView", "TaxesView", "TopBar", "TransactionCountChart",
    "TransactionEditRow", "TransactionList", "TrendChart", "VendorDetailModal",
  ].map((name) => `src/components/${name}.tsx`),
);

// Text that is not language: symbols, numbers, units, and brand marks.
function isWords(value) {
  const s = value.replace(/\s+/g, " ").trim();
  if (!s) return false;
  if (!/[A-Za-z]{2,}/.test(s)) return false;
  if (/^(TCV|USD|NQ|ES|P&L|R|AM|PM)$/.test(s)) return false;
  return true;
}

function walkDir(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walkDir(path);
    return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
  });
}

function findings(file) {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out = [];
  const report = (node, text) => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    out.push({ line: line + 1, text: text.replace(/\s+/g, " ").trim().slice(0, 70) });
  };
  const visit = (node) => {
    if (ts.isJsxText(node) && isWords(node.text)) report(node, node.text);
    if (ts.isJsxAttribute(node) && ATTRS.has(node.name.getText(source)) && node.initializer) {
      const init = node.initializer;
      if (ts.isStringLiteral(init) && isWords(init.text)) report(node, `${node.name.getText(source)}="${init.text}"`);
      if (ts.isJsxExpression(init) && init.expression) {
        const e = init.expression;
        if ((ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) && isWords(e.text)) report(node, `${node.name.getText(source)}="${e.text}"`);
        if (ts.isTemplateExpression(e) && isWords(e.head.text)) report(node, `${node.name.getText(source)}=\`${e.head.text}...\``);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

const showAll = process.argv.includes("--all");
let newCount = 0;
let legacyCount = 0;
for (const file of walkDir(SRC).sort()) {
  const rel = relative(ROOT, file);
  const found = findings(file);
  if (!found.length) continue;
  const legacy = LEGACY.has(rel);
  if (legacy) legacyCount += found.length;
  else newCount += found.length;
  if (legacy && !showAll) continue;
  console.log(`\n${rel}${legacy ? "  (older ledger screen)" : ""}`);
  for (const f of found) console.log(`  ${f.line}: ${f.text}`);
}

console.log(`\nHard coded strings: ${newCount} in new code, ${legacyCount} in older ledger screens.`);
if (!showAll && legacyCount) console.log("Run with --all to list the ledger ones.");
process.exit(newCount === 0 ? 0 : 1);
