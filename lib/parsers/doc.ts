import type { ParseResult } from '@/types/document';

/**
 * .doc file handling
 * 
 * Legacy .doc format (pre-2007) cannot be parsed directly in a serverless environment
 * like Vercel without external dependencies (LibreOffice, antiword, etc.).
 * 
 * Options for handling .doc files:
 * 1. Ask user to save as .docx (recommended - implemented here)
 * 2. Use a conversion API service (CloudConvert, Zamzar, etc.)
 * 3. Deploy a custom runtime with LibreOffice installed
 * 
 * For MVP, we guide users to save as .docx format.
 */
export async function parseDoc(
  _fileBuffer: Buffer,
  fileName: string
): Promise<ParseResult> {
  return {
    success: false,
    error: `Legacy .doc format is not directly supported. Please save "${fileName}" as .docx format in Microsoft Word and upload again.\n\nTo convert: Open in Word → File → Save As → Choose ".docx" format.`,
  };
}

/**
 * Check if file is legacy .doc format
 */
export function isLegacyDoc(fileName: string, mimeType?: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Check extension
  if (extension === 'doc') {
    // Additional check: .docx has different MIME type
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return false; // Actually a .docx with wrong extension
    }
    return true;
  }
  
  return false;
}
