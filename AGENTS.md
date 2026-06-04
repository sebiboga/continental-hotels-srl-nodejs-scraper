# AGENTS.md — Rules for AI agents

## Project
Continental Hotels scraper for peviitor.ro (Node.js, ESM, Jest)

## Critical Rules

### 1. Temporary Files
All temporary/scratch files MUST go in `tmp/` inside the project root.
NEVER use paths outside the project.

### 2. Environment Variables
- `SOLR_AUTH=your-solr-credentials` must be set in `.env.local` for SOLR tests
- `.env.local` is in `.gitignore` — never commit it

### 3. Testing
```bash
npm test
node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=integration --testTimeout=60000
node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=e2e --testTimeout=60000
```

### 4. ESM + Jest
- Use `jest.unstable_mockModule` (NOT `jest.mock`) for mocking ESM modules
- Run with `--experimental-vm-modules` flag
- SOLR tests use conditional `itIfSolr` helper — auto-skip when `SOLR_AUTH` not set

### 5. Module Structure
- `src/anaf.js` — core ANAF library (imported by company.js)
- `company.js` — company validation (ANAF + Peviitor + SOLR)
- `solr.js` — SOLR operations
- `index.js` — main scraper orchestrator
