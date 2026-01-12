import mammoth from 'mammoth';
import { randomUUID } from 'crypto';
import type { 
  ParsedDocument, 
  ParseResult, 
  DocumentSection, 
  DocumentTable,
  HeadingLevel 
} from '@/types/document';

type MammothResult = {
  value: string;
  messages: Array<{ type: string; message: string }>;
};

export async function parseDocx(
  fileBuffer: Buffer,
  fileName: string
): Promise<ParseResult> {
  try {
    // Extract HTML with structure preserved
    const htmlResult: MammothResult = await mammoth.convertToHtml(
      { buffer: fileBuffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Heading 5'] => h5:fresh",
          "p[style-name='Heading 6'] => h6:fresh",
        ],
      }
    );

    // Extract plain text for raw content
    const textResult: MammothResult = await mammoth.extractRawText({ buffer: fileBuffer });

    // Parse the HTML to extract sections and structure
    const { sections, tables } = parseHtmlContent(htmlResult.value);

    // Collect any parse warnings
    const parseWarnings = htmlResult.messages
      .filter((m) => m.type === 'warning')
      .map((m) => m.message);

    const document: ParsedDocument = {
      id: randomUUID(),
      fileName,
      fileType: 'docx',
      rawText: textResult.value,
      sections,
      tables,
      parseWarnings: parseWarnings.length > 0 ? parseWarnings : undefined,
    };

    return { success: true, document };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing DOCX';
    return { success: false, error: message };
  }
}

function parseHtmlContent(html: string): {
  sections: DocumentSection[];
  tables: DocumentTable[];
} {
  const sections: DocumentSection[] = [];
  const tables: DocumentTable[] = [];
  
  // Simple regex-based parsing for server-side
  // More robust parsing could use cheerio or jsdom
  
  // Extract tables first
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[1];
    const table = parseTable(tableHtml);
    if (table.rows.length > 0) {
      tables.push(table);
    }
  }

  // Remove tables from HTML for section parsing
  const htmlWithoutTables = html.replace(tableRegex, '');

  // Split by headings
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const parts: Array<{ level: HeadingLevel; title: string; startIndex: number; matchLength: number }> = [];
  
  let match;
  while ((match = headingRegex.exec(htmlWithoutTables)) !== null) {
    parts.push({
      level: parseInt(match[1], 10) as HeadingLevel,
      title: stripHtml(match[2]),
      startIndex: match.index,
      matchLength: match[0].length,
    });
  }

  // Build sections with content between headings
  for (let i = 0; i < parts.length; i++) {
    const current = parts[i];
    const next = parts[i + 1];
    
    const contentStart = current.startIndex + current.matchLength;
    const contentEnd = next ? next.startIndex : htmlWithoutTables.length;
    const contentHtml = htmlWithoutTables.slice(contentStart, contentEnd);
    
    // Convert HTML content to markdown-ish format
    const content = htmlToMarkdown(contentHtml);

    sections.push({
      id: randomUUID(),
      level: current.level,
      title: current.title,
      content: content.trim(),
      children: [], // Flatten for now, can build hierarchy later
    });
  }

  // If no headings found, treat entire content as one section
  if (sections.length === 0 && htmlWithoutTables.trim()) {
    sections.push({
      id: randomUUID(),
      level: 1,
      title: 'Document Content',
      content: htmlToMarkdown(htmlWithoutTables).trim(),
      children: [],
    });
  }

  return { sections, tables };
}

function parseTable(tableHtml: string): DocumentTable {
  const rows: DocumentTable['rows'] = [];
  
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  
  let rowMatch;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[1];
    const cells: DocumentTable['rows'][0] = [];
    
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push({
        content: stripHtml(cellMatch[1]).trim(),
      });
    }
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return {
    id: randomUUID(),
    rows,
    headers: rows.length > 0 ? rows[0].map((c) => c.content) : undefined,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function htmlToMarkdown(html: string): string {
  return html
    // Bold
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    // Italic
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    // Lists
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<\/?[ou]l[^>]*>/gi, '\n')
    // Paragraphs
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Fix entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
