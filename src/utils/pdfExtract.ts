import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PositionedItem {
  text: string;
  x: number;
  xEnd: number;
  y: number;
}

// Column gaps in a table are much wider than the gap between two words in
// the same cell — anything past this multiple of the average character
// width is treated as a new column and gets a comma; smaller gaps just get
// a space, keeping wrapped multi-word cells intact.
const COLUMN_GAP_CHAR_MULTIPLE = 2.2;
// Rows are grouped by y-position; text baselines within the same table row
// can jitter a couple of px, so cluster anything within this tolerance.
const ROW_Y_TOLERANCE = 3;

// Extracts text from a PDF and reconstructs it into CSV-like rows based on
// each text run's position, so tabular PDFs (like this app's own CSV-to-PDF
// exports, or similarly simple statements) can be pasted through the same
// parser used for pasted/dropped text.
export async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    const items: PositionedItem[] = [];
    for (const raw of content.items as Array<Record<string, unknown>>) {
      const str = raw.str;
      const transform = raw.transform;
      if (typeof str !== "string" || !str.trim() || !Array.isArray(transform)) continue;
      const [scaleX, , , , x, y] = transform as number[];
      const width = typeof raw.width === "number" ? raw.width : str.length * scaleX;
      items.push({ text: str, x, xEnd: x + width, y });
    }

    // Group into rows by y, tolerant of small jitter.
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const rows: PositionedItem[][] = [];
    for (const item of items) {
      const row = rows[rows.length - 1];
      if (row && Math.abs(row[0].y - item.y) <= ROW_Y_TOLERANCE) {
        row.push(item);
      } else {
        rows.push([item]);
      }
    }

    for (const row of rows) {
      row.sort((a, b) => a.x - b.x);
      const avgCharWidth =
        row.reduce((sum, i) => sum + (i.xEnd - i.x) / Math.max(i.text.length, 1), 0) / row.length || 5;
      let line = row[0].text;
      for (let i = 1; i < row.length; i++) {
        const gap = row[i].x - row[i - 1].xEnd;
        line += gap > avgCharWidth * COLUMN_GAP_CHAR_MULTIPLE ? ", " : " ";
        line += row[i].text;
      }
      lines.push(line.trim());
    }
  }

  return lines.join("\n");
}
