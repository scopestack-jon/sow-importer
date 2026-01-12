import { parseDocx } from './docx';
import { parsePdf } from './pdf';
import { parseDoc, isLegacyDoc } from './doc';
import type { ParseResult } from '@/types/document';

export type FileType = 'docx' | 'doc' | 'pdf' | 'unknown';

export function getFileType(fileName: string): FileType {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'docx':
      return 'docx';
    case 'doc':
      return 'doc';
    case 'pdf':
      return 'pdf';
    default:
      return 'unknown';
  }
}

export async function parseDocument(
  fileBuffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ParseResult> {
  const fileType = getFileType(fileName);

  switch (fileType) {
    case 'docx':
      return parseDocx(fileBuffer, fileName);
    
    case 'doc':
      // Check if it's actually a docx with wrong extension
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return parseDocx(fileBuffer, fileName);
      }
      return parseDoc(fileBuffer, fileName);
    
    case 'pdf':
      return parsePdf(fileBuffer, fileName);
    
    default:
      return {
        success: false,
        error: `Unsupported file type: ${fileName}. Please upload a .docx, .doc, or .pdf file.`,
      };
  }
}

export { parseDocx, parsePdf, parseDoc, isLegacyDoc };
