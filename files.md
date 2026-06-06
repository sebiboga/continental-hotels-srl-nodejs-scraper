# Project Files

## JavaScript Files

| File | Description |
|------|-------------|
| `index.js` | Main scraper - full workflow: validate company, scrape jobs, remove expired, transform, upsert |
| `company.js` | Validates company via ANAF search + Peviitor APIs, manages company core data |
| `solr.js` | SOLR operations module - query, upsert, delete jobs + standalone verify command |
| `src/anaf.js` | ANAF API core module - searchCompany(brand) and getCompanyFromANAF(cif) |

## Markdown Files

| File | Description |
|------|-------------|
| `instructions.md` | Project documentation - workflow, technologies, API endpoints |
| `job-model.md` | Job schema definition (Peviitor Core) - fields, types, validation rules |
| `company-model.md` | Company schema definition (Peviitor Core) - fields, types, validation rules |
| `files.md` | This file - documents role of each project file |

## Configuration Files

| File | Description |
|------|-------------|
| `package.json` | Node.js project config - dependencies (node-fetch, cheerio, dotenv), scripts |
| `.gitignore` | Ignores node_modules/, company.json, jobs.json, jobs_existing.json, .env.local |
| `.env.local` | Local environment variables (SOLR_AUTH) - NOT committed |

## Dependencies (node_modules/)

Installed via npm:
- `node-fetch` - HTTP requests
- `cheerio` - HTML parsing
- `dotenv` - Environment variable loading
