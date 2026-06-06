# Instructions

## Project Purpose

This scraper extracts job listings from Continental Hotels careers page and imports them to peviitor.ro.

Target: https://www.jobs-continentalhotels.ro/

## Technologies

- **Node.js & JavaScript** - For scraping and data extraction
- **Apache SOLR** - For data storage and indexing
- **Cheerio** - HTML parsing

## Workflow Steps

1. **Start with brand** - CONTINENTAL HOTELS
2. **Search ANAF** - Find company by brand name
3. **Validate with Peviitor** - Verify company exists
4. **Check existing jobs in SOLR** - Query SOLR by CIF
5. **Scrape jobs** - Extract jobs from AJAX API
6. **Remove expired jobs** - Delete jobs no longer on careers page
7. **Transform for SOLR** - Normalize locations, workmode
8. **Upsert to SOLR** - Import/update jobs
9. **Update Company Core** - Add/update company in SOLR company core

## API Endpoints

- **DemoANAF Search**: `https://demoanaf.ro/api/search?q=BRAND`
- **DemoANAF Company**: `https://demoanaf.ro/api/company/:cui`
- **Peviitor API**: `https://api.peviitor.ro/v1/company/`
- **Solr**: `https://solr.peviitor.ro/solr/job` (auth: via `SOLR_AUTH` environment variable)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SOLR_AUTH` | SOLR credentials in format `user:password` |

## Testing

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
```
