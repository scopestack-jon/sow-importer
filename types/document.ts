export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type DocumentSection = {
  id: string;
  level: HeadingLevel;
  title: string;
  content: string;
  children: DocumentSection[];
};

export type TableCell = {
  content: string;
  rowSpan?: number;
  colSpan?: number;
};

export type TableRow = TableCell[];

export type DocumentTable = {
  id: string;
  rows: TableRow[];
  headers?: string[];
};

export type ParsedDocument = {
  id: string;
  fileName: string;
  fileType: 'docx' | 'doc' | 'pdf';
  rawText: string;
  sections: DocumentSection[];
  tables: DocumentTable[];
  metadata?: {
    title?: string;
    author?: string;
    created?: string;
    modified?: string;
  };
  parseWarnings?: string[];
};

export type ParseResult = {
  success: boolean;
  document?: ParsedDocument;
  error?: string;
};
