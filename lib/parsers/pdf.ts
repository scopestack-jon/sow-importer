import { randomUUID } from 'crypto';
import type {
  ParsedDocument,
  ParseResult,
  DocumentSection,
  DocumentTable,
  HeadingLevel,
} from '@/types/document';

type PdfData = {
  text: string;
  numpages: number;
  info?: {
    Title?: string;
    Author?: string;
    CreationDate?: string;
    ModDate?: string;
  };
};

export async function parsePdf(
  fileBuffer: Buffer,
  fileName: string
): Promise<ParseResult> {
  try {
    // Dynamic import to avoid build issues with canvas dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as unknown as { default: (buffer: Buffer) => Promise<PdfData> }).default || pdfParseModule;
    const data: PdfData = await (pdfParse as (buffer: Buffer) => Promise<PdfData>)(fileBuffer);

    const { sections, tables } = extractStructure(data.text);

    const document: ParsedDocument = {
      id: randomUUID(),
      fileName,
      fileType: 'pdf',
      rawText: data.text,
      sections,
      tables,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        created: data.info?.CreationDate,
        modified: data.info?.ModDate,
      },
    };

    return { success: true, document };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing PDF';
    return { success: false, error: message };
  }
}

function extractStructure(text: string): {
  sections: DocumentSection[];
  tables: DocumentTable[];
} {
  const sections: DocumentSection[] = [];
  const tables: DocumentTable[] = [];
  const lines = text.split('\n');

  let currentSection: DocumentSection | null = null;
  let contentBuffer: string[] = [];
  let potentialTableRows: string[][] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      // Empty line might end a table
      if (potentialTableRows.length >= 2) {
        tables.push(createTableFromRows(potentialTableRows));
      }
      potentialTableRows = [];
      continue;
    }

    // Detect potential headings (heuristics)
    const headingInfo = detectHeading(trimmedLine, line);
    
    if (headingInfo) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentBuffer.join('\n').trim();
        sections.push(currentSection);
      }
      
      // Check for table before starting new section
      if (potentialTableRows.length >= 2) {
        tables.push(createTableFromRows(potentialTableRows));
      }
      potentialTableRows = [];

      currentSection = {
        id: randomUUID(),
        level: headingInfo.level,
        title: headingInfo.title,
        content: '',
        children: [],
      };
      contentBuffer = [];
    } else {
      // Check if this line looks like a table row
      const tableRow = detectTableRow(trimmedLine);
      if (tableRow) {
        potentialTableRows.push(tableRow);
      } else {
        // Regular content
        if (potentialTableRows.length >= 2) {
          tables.push(createTableFromRows(potentialTableRows));
        }
        potentialTableRows = [];
        contentBuffer.push(trimmedLine);
      }
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = contentBuffer.join('\n').trim();
    sections.push(currentSection);
  }

  // Check for remaining table
  if (potentialTableRows.length >= 2) {
    tables.push(createTableFromRows(potentialTableRows));
  }

  // If no sections found, create one with all content
  if (sections.length === 0 && text.trim()) {
    sections.push({
      id: randomUUID(),
      level: 1,
      title: 'Document Content',
      content: text.trim(),
      children: [],
    });
  }

  return { sections, tables };
}

function detectHeading(
  trimmedLine: string,
  originalLine: string
): { level: HeadingLevel; title: string } | null {
  // Skip very long lines (unlikely to be headings)
  if (trimmedLine.length > 100) return null;
  
  // Skip lines that look like sentences (end with period and have many words)
  if (trimmedLine.endsWith('.') && trimmedLine.split(' ').length > 10) return null;

  // Pattern: numbered sections like "1.", "1.1", "1.1.1", etc.
  const numberedMatch = trimmedLine.match(/^(\d+(?:\.\d+)*\.?)\s+(.+)$/);
  if (numberedMatch) {
    const depth = numberedMatch[1].split('.').filter(Boolean).length;
    const level = Math.min(depth, 6) as HeadingLevel;
    return { level, title: trimmedLine };
  }

  // Pattern: UPPERCASE lines (likely headings)
  if (
    trimmedLine === trimmedLine.toUpperCase() &&
    trimmedLine.length > 3 &&
    trimmedLine.length < 80 &&
    /[A-Z]/.test(trimmedLine)
  ) {
    return { level: 1, title: trimmedLine };
  }

  // Pattern: Phase/Section indicators
  if (/^(Phase|Section|Part|Chapter)\s+\d/i.test(trimmedLine)) {
    return { level: 1, title: trimmedLine };
  }

  // Pattern: Title Case short lines with no punctuation (heuristic)
  if (
    trimmedLine.length < 60 &&
    !trimmedLine.endsWith('.') &&
    !trimmedLine.endsWith(',') &&
    isTitleCase(trimmedLine) &&
    trimmedLine.split(' ').length <= 8
  ) {
    return { level: 2, title: trimmedLine };
  }

  return null;
}

function isTitleCase(str: string): boolean {
  const words = str.split(' ');
  const capitalizedWords = words.filter(
    (word) => word.length > 0 && word[0] === word[0].toUpperCase()
  );
  return capitalizedWords.length >= words.length * 0.5;
}

function detectTableRow(line: string): string[] | null {
  // Check for tab-separated values
  if (line.includes('\t')) {
    const cells = line.split('\t').map((c) => c.trim());
    if (cells.length >= 2) return cells;
  }

  // Check for pipe-separated values (markdown-style)
  if (line.includes('|')) {
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2) return cells;
  }

  // Check for consistent spacing (column alignment)
  const spacingMatch = line.match(/\s{3,}/g);
  if (spacingMatch && spacingMatch.length >= 1) {
    const cells = line.split(/\s{3,}/).map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2 && cells.length <= 10) return cells;
  }

  return null;
}

function createTableFromRows(rows: string[][]): DocumentTable {
  // Normalize column count
  const maxCols = Math.max(...rows.map((r) => r.length));
  const normalizedRows = rows.map((row) => {
    while (row.length < maxCols) row.push('');
    return row.map((cell) => ({ content: cell }));
  });

  return {
    id: randomUUID(),
    rows: normalizedRows,
    headers: normalizedRows[0]?.map((c) => c.content),
  };
}
