# PRD: Statement of Work Importer

## Introduction

A web utility that helps users onboard into ScopeStack faster by importing existing Statement of Work (SOW) documents. Users upload Word or PDF documents, the system uses AI to suggest mappings to ScopeStack's data structure (Phases → Services → Subservices), and users can review/adjust these mappings before exporting JSON for the ScopeStack API.

## Goals

- Reduce manual data entry when migrating existing SOWs into ScopeStack
- Accurately parse document structure to identify services, subservices, phases, and pricing
- Provide a clear UI for users to review and correct AI-suggested mappings
- Flag ambiguous content for user decision rather than guessing
- Export clean JSON compatible with ScopeStack's CreateProjectService API
- Support common document formats: `.docx`, `.doc`, and PDF

## User Stories

### US-001: Upload SOW Document
**Description:** As a user, I want to upload my existing SOW document so that I can import it into ScopeStack.

**Acceptance Criteria:**
- [ ] Drag-and-drop upload zone accepts `.docx`, `.doc`, and `.pdf` files
- [ ] File size limit of 25MB with clear error message if exceeded
- [ ] Upload progress indicator shown during processing
- [ ] Invalid file types rejected with helpful error message
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Parse Document Structure
**Description:** As a user, I want the system to extract text and structure from my document so that it can be mapped to ScopeStack entities.

**Acceptance Criteria:**
- [ ] Extracts all text content preserving heading hierarchy
- [ ] Identifies document headers (H1, H2, H3, etc.) and their nesting
- [ ] Extracts tables if present (for pricing/hours data)
- [ ] Preserves paragraph text under each header
- [ ] Handles multi-column layouts gracefully
- [ ] npm run typecheck passes

### US-003: AI-Suggested Mappings
**Description:** As a user, I want the system to suggest which document sections map to Phases, Services, and Subservices so I don't have to manually categorize everything.

**Acceptance Criteria:**
- [ ] AI analyzes document structure and content
- [ ] Suggests Phase assignments based on section context (e.g., "Phase 1: Discovery")
- [ ] Suggests Service mappings for major section headers
- [ ] Suggests Subservice mappings for nested items under services
- [ ] Extracts pricing/hours when present in tables or inline text
- [ ] Identifies pricing type if detectable (Fixed Fee, Time & Materials, XaaS, etc.)
- [ ] Extracts service descriptions from body text under headers
- [ ] Preserves Markdown formatting (bold, bullets, nested lists) in extracted content
- [ ] npm run typecheck passes

### US-004: Flag Ambiguous Content
**Description:** As a user, I want unclear sections flagged for my review so I can make the final decision on how to categorize them.

**Acceptance Criteria:**
- [ ] Ambiguous sections visually highlighted (different color/icon)
- [ ] Tooltip or label explains why the section is flagged
- [ ] User can assign category from dropdown (Phase/Service/Subservice/Ignore)
- [ ] Flagged count shown in UI summary
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Review and Adjust Mappings UI
**Description:** As a user, I want to see all suggested mappings in a clear interface so I can review and correct them before export.

**Acceptance Criteria:**
- [ ] Tree view showing Phase → Service → Subservice hierarchy
- [ ] Each item shows: original text, suggested type, description preview
- [ ] Drag-and-drop to reorganize hierarchy
- [ ] Inline edit for service names and descriptions
- [ ] Delete button to exclude items from export
- [ ] Undo/redo for changes
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Edit Service Details
**Description:** As a user, I want to edit the extracted details for each service so I can fix any parsing errors.

**Acceptance Criteria:**
- [ ] Click to expand service and see full details
- [ ] Editable fields: name, description, phase, hours, price, pricing type
- [ ] Subservices listed with same editable fields
- [ ] Add new subservice manually if missed by parser
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Export JSON for ScopeStack API
**Description:** As a user, I want to export my reviewed mappings as JSON so I can use it with ScopeStack's API.

**Acceptance Criteria:**
- [ ] "Export JSON" button generates downloadable file
- [ ] JSON structure matches ScopeStack CreateProjectService API format
- [ ] Includes all mapped: phases, services, subservices, descriptions, pricing/hours
- [ ] Filename includes original document name and timestamp
- [ ] Copy-to-clipboard option for JSON content
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Validation Before Export
**Description:** As a user, I want the system to validate my mappings before export so I don't submit incomplete data.

**Acceptance Criteria:**
- [ ] Warns if any services are missing required fields (name)
- [ ] Warns if ambiguous items remain unassigned
- [ ] Shows validation summary with error count
- [ ] Blocks export until critical errors resolved (or user overrides)
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Accept file uploads for `.docx`, `.doc`, and `.pdf` formats (max 25MB)
- FR-2: Parse document content extracting headers, body text, and tables
- FR-3: Use AI/LLM to analyze document structure and suggest entity mappings
- FR-4: Map document sections to ScopeStack hierarchy: Phase → Service → Subservice
- FR-5: Extract service descriptions from paragraph text under headers
- FR-6: Extract pricing and hours data from tables or inline mentions
- FR-6a: Identify pricing type when detectable (Fixed Fee, Time & Materials, XaaS, Managed Services, etc.)
- FR-7: Flag sections with low confidence or ambiguous categorization
- FR-8: Display parsed content in editable tree view with drag-and-drop reordering
- FR-9: Allow inline editing of all extracted fields (name, description, phase, hours, price)
- FR-10: Support adding/removing services and subservices manually
- FR-11: Validate mappings before export with clear error messages
- FR-12: Export JSON matching ScopeStack CreateProjectService API schema
- FR-13: Provide copy-to-clipboard and file download options for exported JSON

## Non-Goals

- No direct API integration with ScopeStack (MVP exports JSON only)
- No user authentication or saved import history
- No batch processing of multiple documents
- No editing of the original document
- No support for Google Docs or other cloud document formats
- No automatic creation of projects in ScopeStack
- No pre-built templates for specific SOW formats (MSP, consulting, etc.)

## Design Considerations (Frontend Design Skill)

### Design Philosophy
Create a **distinctive, production-grade interface** that avoids generic AI aesthetics. Commit to a clear aesthetic direction—this is a professional tool for consultants importing SOWs, so consider:
- **Editorial/Professional**: Clean, confident, typographically refined
- **Utilitarian/Industrial**: Function-forward, data-dense, no-nonsense

### Typography
- Avoid generic fonts (Inter, Roboto, Arial)
- Choose distinctive, professional fonts that elevate the experience
- Pair a characterful display font with a refined body font

### Color & Theme
- Use CSS variables for consistency
- Color coding for entity types with purpose:
  - **Phases**: Strong accent color (hierarchy anchor)
  - **Services**: Primary content color
  - **Subservices**: Subdued/secondary tone
  - **Ambiguous items**: Warning/attention color (not just yellow—consider coral, amber)
- Commit to a cohesive palette—dominant colors with sharp accents

### Layout & Composition
- Single-page app with three main views: **Upload → Review/Edit → Export**
- Progress stepper showing current stage
- Generous whitespace for document-heavy content
- Tree view with clear visual hierarchy
- Consider asymmetry or grid-breaking elements to avoid generic feel

### Motion & Interactions
- Staggered reveals on page load
- Smooth transitions between stages
- Meaningful hover states on interactive elements
- Drag-and-drop feedback animations

### Visual Details
- Add atmosphere: subtle gradients, noise textures, or layered shadows
- Custom focus states and selection highlights
- Polished empty states and loading indicators

### Responsive
- Optimized for desktop (primary use case)
- Functional on tablet; graceful degradation on mobile

## Technical Considerations

### Document Parsing (using docx and pdf skills)

**Word Documents (.docx):**
- Use `pandoc` for text extraction with structure preservation:
  ```bash
  pandoc path-to-file.docx -o output.md
  ```
- For raw XML access (headers, tables, metadata): unpack using `python ooxml/scripts/unpack.py`
- Key structures: `word/document.xml` (main content), tables preserved in XML

**Word Documents (.doc):**
- Requires server-side conversion via LibreOffice:
  ```bash
  soffice --headless --convert-to docx document.doc
  ```

**PDF Documents:**
- Text extraction with `pdfplumber`:
  ```python
  import pdfplumber
  with pdfplumber.open("document.pdf") as pdf:
      for page in pdf.pages:
          text = page.extract_text()
  ```
- Table extraction:
  ```python
  tables = page.extract_tables()
  ```
- For scanned PDFs, use OCR with `pytesseract` + `pdf2image`

**Maximum document size:** 20 pages
**Processing:** Server-side required for `.doc` conversion, PDF parsing, and LLM calls

### LLM Integration
- **Provider:** OpenRouter (allows model flexibility)
- Use LLM for: structure analysis, service/subservice identification, language field extraction
- Non-standard SOW structures: pass full content to LLM for best-effort extraction
- Consider chunking documents that exceed context limits

### ScopeStack API Structure (JSON:API Format)

All ScopeStack endpoints use JSON:API format with `data.type`, `data.attributes`, and `data.relationships`.

**Project Services** (`POST /v1/project-services`):
```json
{
  "data": {
    "type": "project-services",
    "attributes": {
      "name": "Discovery & Assessment",
      "quantity": 1,
      "override-hours": 40,
      "task-source": "custom",
      "service-type": "professional_services",
      "payment-frequency": "one_time",
      "position": 0,
      "service-description": "Initial discovery and assessment.",
      "languages": {
        "assumptions": "Client provides access to documentation...",
        "customer": "Client identifies key stakeholders...",
        "out": "Production changes are not performed...",
        "implementation_language": "Detailed scope narrative...",
        "deliverables": "Discovery report, risk assessment...",
        "operate": "Ongoing operation owned by client...",
        "design_language": "High-level design considerations...",
        "planning_language": "Project planning notes...",
        "internal_only": "Internal delivery notes...",
        "service_level_agreement": "N/A"
      }
    },
    "relationships": {
      "project": {
        "data": { "type": "projects", "id": "<project-id>" }
      }
    }
  }
}
```

**Project Subservices** (`POST /v1/project-subservices`):
```json
{
  "data": {
    "type": "project-subservices",
    "attributes": {
      "name": "Current-state environment assessment",
      "quantity": 1,
      "override-hours": 24,
      "service-description": "Perform workshops and technical assessment...",
      "task-source": "custom",
      "languages": {
        "assumptions": "Access to environment documentation...",
        "customer": "Provide SMEs for interviews...",
        "implementation_language": "Detailed subservice scope..."
      }
    },
    "relationships": {
      "project-service": {
        "data": { "type": "project-services", "id": "<service-id>" }
      }
    }
  }
}
```

### Language Field Mapping (SOW → ScopeStack)
The `languages` object maps SOW content to structured fields. **All fields support Markdown formatting.**

**Priority fields (commonly found in SOWs):**
| SOW Content | ScopeStack Field |
|-------------|------------------|
| Key Assumptions | `assumptions` |
| Client Responsibilities | `customer` |
| Out of Scope | `out` |

**Additional fields (LLM suggests if content is identified):**
| SOW Content | ScopeStack Field |
|-------------|------------------|
| Scope/implementation details | `implementation_language` |
| Deliverables | `deliverables` |
| Ongoing operations | `operate` |
| Design notes | `design_language` |
| Planning notes | `planning_language` |
| Internal notes | `internal_only` |

### Markdown Support
Service descriptions and all `languages` fields support Markdown formatting. Preserve formatting from source documents:
- **Bold headers** for subsections
- Bullet lists for line items
- Nested lists for hierarchical content

Example of preserved Markdown in `implementation_language`:
```markdown
**Proactive Monitoring**
- 24x7x365 proactive monitoring.
- Auto-Ticketing Events - When devices are down, thresholds are exceeded, or an impactful device event occurs, a trouble ticket is automatically created.

**Availability / Health**
Pomeroy will monitor for the following, as applicable:
- Up / down monitoring.
- Monitor for changes to the device's Primary or Secondary Status.
- Monitor devices for CPU Utilization, memory utilization, disk space utilization.
```

### Export Strategy (MVP)
Since MVP exports JSON only (no direct API calls), the export should generate:
1. **Per-service JSON files** ready for `POST /v1/project-services`
2. **Per-subservice JSON files** ready for `POST /v1/project-subservices`
3. Or a **combined manifest** with all services/subservices that user can iterate through

## Success Metrics

- User can import a typical 10-page SOW in under 5 minutes
- AI correctly categorizes >80% of services without user correction
- Exported JSON is valid for ScopeStack API on first attempt
- Reduces manual entry time by 70% compared to building from scratch

## Development Workflow (Compound Engineering)

Follow the **Plan → Work → Review → Compound** loop:

### Planning Phase (40%)
1. Research codebase for similar patterns before implementing
2. Create detailed implementation plan for each user story
3. Include code examples matching existing conventions
4. Define testable acceptance criteria

### Work Phase (20%)
1. Execute plan systematically, one task at a time
2. Run tests after each meaningful change:
   ```bash
   npm run typecheck
   npm test
   npm run lint
   ```
3. Commit incrementally with clear messages

### Review Phase (20%)
- [ ] Follows existing codebase patterns
- [ ] No unnecessary complexity
- [ ] Security: no secrets exposed, input validation
- [ ] Performance: no obvious regressions
- [ ] Tests cover acceptance criteria

### Compound Phase (20%)
After each feature, document:
- **Patterns**: New patterns discovered or created
- **Decisions**: Why certain approaches were chosen
- **Lessons**: Bugs encountered and how to prevent them

Update AGENTS.md with learnings to make future work easier.

## Open Questions

- ~~What is the exact JSON schema required by ScopeStack's CreateProjectService endpoint?~~ ✅ Resolved
- ~~Should we support templates for common SOW formats (MSP, consulting, etc.)?~~ ✅ No - out of scope
- ~~How should we handle SOWs with non-standard structures (no clear headers)?~~ ✅ Pass to LLM for best-effort extraction
- ~~What LLM provider and model should be used for content analysis?~~ ✅ OpenRouter
- ~~Is there a maximum document length we should support?~~ ✅ 20 pages max
- ~~Should pricing be required or optional for export?~~ ✅ Optional; extract if present or identify pricing type
- ~~How should we handle the `languages` sub-fields when SOW doesn't have explicit sections (e.g., no "Assumptions" header)?~~ ✅ Common fields (Out of Scope, Key Assumptions, Client Responsibilities) are prioritized; LLM suggests other language fields if content is identified
