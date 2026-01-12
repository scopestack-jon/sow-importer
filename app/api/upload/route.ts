import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/pdf', // .pdf
];

const ACCEPTED_EXTENSIONS = ['.docx', '.doc', '.pdf'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: 'Invalid file type. Accepted: .docx, .doc, .pdf' },
        { status: 400 }
      );
    }

    // Also check MIME type if available
    if (file.type && !ACCEPTED_TYPES.includes(file.type) && file.type !== 'application/octet-stream') {
      // Allow octet-stream as some systems don't set proper MIME types
      console.warn(`Unexpected MIME type: ${file.type}, but extension ${extension} is valid`);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Generate unique file ID
    const fileId = randomUUID();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storedFileName = `${fileId}-${safeFileName}`;

    // Store file temporarily
    // In production on Vercel, use Vercel Blob or similar
    // For local dev, use /tmp
    const uploadDir = join(process.cwd(), 'tmp', 'uploads');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory may already exist
    }

    const filePath = join(uploadDir, storedFileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: extension,
      storedPath: filePath,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
