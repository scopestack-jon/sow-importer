import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { parseDocument } from '@/lib/parsers';
import { getOpenRouterClient } from '@/lib/openrouter';
import { analyzeSOW } from '@/lib/analyze';

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

    // Parse the document
    const parseResult = await parseDocument(fileBuffer, fileName);
    
    if (!parseResult.success || !parseResult.document) {
      return NextResponse.json(
        { error: parseResult.error || 'Failed to parse document' },
        { status: 400 }
      );
    }

    // Check for OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Analyze with LLM
    const client = getOpenRouterClient();
    const analysisResult = await analyzeSOW(client, parseResult.document);

    return NextResponse.json({
      success: true,
      document: parseResult.document,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
