# SOW Importer

Import Statement of Work documents into ScopeStack with AI-powered extraction.

## Features

- **Upload** Word (.docx, .doc) and PDF documents
- **AI Analysis** extracts services, subservices, phases, and pricing
- **Review & Edit** mappings in an interactive tree view
- **Export** JSON compatible with ScopeStack API

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file:

```
OPENROUTER_API_KEY=your_api_key_here
```

## Documentation

- [Product Requirements Document](tasks/prd-sow-importer.md)

## Development

See [AGENTS.md](AGENTS.md) for development guidelines.

### Running Ralph (Autonomous Agent)

```bash
./scripts/ralph/ralph.sh 25
```
