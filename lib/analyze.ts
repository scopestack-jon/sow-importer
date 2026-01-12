import type { OpenRouterClient } from './openrouter';
import type { ParsedDocument } from '@/types/document';
import type { ParsedSOW, AnalysisResult, Service, Subservice, Phase } from '@/types/sow';
import { buildAnalysisPrompt, SYSTEM_PROMPT } from './prompts/analyze-sow';
import { randomUUID } from 'crypto';

type LLMResponse = {
  phases?: Array<{
    id?: string;
    name: string;
    position?: number;
  }>;
  services?: Array<{
    id?: string;
    name: string;
    description?: string;
    phaseId?: string;
    phaseName?: string;
    hours?: number;
    price?: number;
    pricingType?: string;
    languages?: Record<string, string>;
    subservices?: Array<{
      id?: string;
      name: string;
      description?: string;
      hours?: number;
      languages?: Record<string, string>;
      isAmbiguous?: boolean;
      ambiguousReason?: string;
      confidence?: number;
    }>;
    isAmbiguous?: boolean;
    ambiguousReason?: string;
    confidence?: number;
  }>;
  pricingType?: string;
  warnings?: string[];
};

export async function analyzeSOW(
  client: OpenRouterClient,
  document: ParsedDocument
): Promise<AnalysisResult> {
  try {
    const prompt = buildAnalysisPrompt(document);

    const response = await client.chatJson<LLMResponse>([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ], {
      temperature: 0.2,
      maxTokens: 8192,
    });

    // Transform response to our types with proper IDs
    const phases: Phase[] = (response.phases || []).map((p, i) => ({
      id: p.id || randomUUID(),
      name: p.name,
      position: p.position ?? i,
    }));

    const services: Service[] = (response.services || []).map((s) => ({
      id: s.id || randomUUID(),
      name: s.name,
      description: s.description || '',
      phaseId: s.phaseId,
      phaseName: s.phaseName,
      hours: s.hours,
      price: s.price,
      pricingType: normalizePricingType(s.pricingType),
      quantity: 1,
      languages: s.languages || {},
      subservices: (s.subservices || []).map((sub): Subservice => ({
        id: sub.id || randomUUID(),
        name: sub.name,
        description: sub.description || '',
        hours: sub.hours,
        quantity: 1,
        languages: sub.languages || {},
        isAmbiguous: sub.isAmbiguous ?? false,
        ambiguousReason: sub.ambiguousReason,
        confidence: sub.confidence ?? 0.8,
      })),
      isAmbiguous: s.isAmbiguous ?? false,
      ambiguousReason: s.ambiguousReason,
      confidence: s.confidence ?? 0.8,
    }));

    const parsedSOW: ParsedSOW = {
      id: document.id,
      fileName: document.fileName,
      phases,
      services,
      pricingType: normalizePricingType(response.pricingType),
      metadata: {
        extractedAt: new Date().toISOString(),
        modelUsed: 'anthropic/claude-3.5-sonnet',
        documentTitle: document.metadata?.title,
      },
      warnings: response.warnings,
    };

    return { success: true, data: parsedSOW };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

function normalizePricingType(value?: string): ParsedSOW['pricingType'] {
  if (!value) return undefined;
  
  const normalized = value.toLowerCase().replace(/[^a-z]/g, '_');
  
  const mapping: Record<string, ParsedSOW['pricingType']> = {
    'fixed_fee': 'fixed_fee',
    'fixedfee': 'fixed_fee',
    'fixed': 'fixed_fee',
    'time_and_materials': 'time_and_materials',
    'timeandmaterials': 'time_and_materials',
    't_m': 'time_and_materials',
    'tm': 'time_and_materials',
    'xaas': 'xaas',
    'as_a_service': 'xaas',
    'managed_services': 'managed_services',
    'managedservices': 'managed_services',
    'managed': 'managed_services',
    'subscription': 'subscription',
  };

  return mapping[normalized] || 'unknown';
}
