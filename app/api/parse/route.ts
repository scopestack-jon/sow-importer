import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { parseDocument } from '@/lib/parsers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, fileName } = body;

    if (!filePath || !fileName) {
      return NextResponse.json(
        { error: 'filePath and fileName are required' },
        { status: 400 }
      );
    }

    // Read the uploaded file
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(filePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found or cannot be read' },
        { status: 404 }
      );
    }

    // Parse the document (no LLM, just structure extraction)
    const parseResult = await parseDocument(fileBuffer, fileName);
    
    if (!parseResult.success || !parseResult.document) {
      return NextResponse.json(
        { error: parseResult.error || 'Failed to parse document' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      document: parseResult.document,
    });
  } catch (error) {
    console.error('Parse error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Parse failed: ${message}` },
      { status: 500 }
    );
  }
}
