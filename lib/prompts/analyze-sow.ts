import type { ParsedDocument } from '@/types/document';

export function buildAnalysisPrompt(document: ParsedDocument): string {
  const sectionsText = document.sections
    .map((s) => `## ${s.title}\n${s.content}`)
    .join('\n\n');

  const tablesText = document.tables.length > 0
    ? document.tables
        .map((t, i) => {
          const rows = t.rows
            .map((r) => r.map((c) => c.content).join(' | '))
            .join('\n');
          return `### Table ${i + 1}\n${rows}`;
        })
        .join('\n\n')
    : '';

  return `You are analyzing a Statement of Work (SOW) document to extract structured data for import into ScopeStack.

## Document Content

${sectionsText}

${tablesText ? `## Tables\n${tablesText}` : ''}

## Your Task

Extract the following information and return it as JSON:

1. **Phases**: Identify any project phases (e.g., "Phase 1: Discovery", "Phase 2: Implementation")
2. **Services**: Major service offerings - typically major section headers
3. **Subservices**: Line items or tasks under each service
4. **Languages**: For each service/subservice, extract:
   - assumptions: Key assumptions
   - customer: Client responsibilities
   - out: Out of scope items
   - implementation_language: Scope details
   - deliverables: What will be delivered

5. **Pricing**: Extract hours, prices, or identify pricing type (fixed_fee, time_and_materials, xaas, managed_services)

## Important Guidelines

- Preserve Markdown formatting (bold, bullets, lists) in descriptions
- Flag items as "ambiguous" if you're uncertain about categorization (set confidence < 0.7)
- If a section could be a Service OR a Subservice, flag it with ambiguousReason
- Common language fields to look for: "Assumptions", "Client Responsibilities", "Out of Scope", "Deliverables"
- If pricing/hours not explicitly stated, omit those fields

## Response Format

Return ONLY valid JSON matching this structure:

{
  "phases": [
    { "id": "phase-1", "name": "Phase 1: Discovery", "position": 0 }
  ],
  "services": [
    {
      "id": "svc-1",
      "name": "Discovery & Assessment",
      "description": "Initial discovery and assessment activities.",
      "phaseId": "phase-1",
      "phaseName": "Phase 1: Discovery",
      "hours": 40,
      "price": null,
      "pricingType": "time_and_materials",
      "languages": {
        "assumptions": "- Client provides access to documentation\\n- Key stakeholders available",
        "customer": "- Identify project sponsors\\n- Provide existing documentation",
        "out": "- Production changes\\n- Hardware procurement",
        "implementation_language": "**Scope includes:**\\n- Current state assessment\\n- Gap analysis",
        "deliverables": "- Discovery report\\n- Risk assessment"
      },
      "subservices": [
        {
          "id": "sub-1",
          "name": "Current State Assessment",
          "description": "Assess current environment and document findings.",
          "hours": 16,
          "languages": {},
          "isAmbiguous": false,
          "confidence": 0.9
        }
      ],
      "isAmbiguous": false,
      "confidence": 0.95
    }
  ],
  "pricingType": "time_and_materials",
  "warnings": ["Could not determine hours for some services"]
}`;
}

export const SYSTEM_PROMPT = `You are an expert at analyzing Statement of Work (SOW) documents for IT professional services. You extract structured data accurately and flag uncertain items for human review. You preserve Markdown formatting in text fields. You return only valid JSON without any additional text or explanation.`;
