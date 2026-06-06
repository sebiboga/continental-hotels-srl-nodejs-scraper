# Company Model Schema

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | CIF/CUI of the company (8 digits, no RO prefix) |
| company | string | Legal name from Trade Register. DIACRITICS REQUIRED. Use uppercase |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| brand | string | Commercial brand name (e.g. "CONTINENTAL HOTELS") |
| group | string | Parent company group |
| status | string | "activ", "suspendat", "inactiv", or "radiat" |
| location | string[] | Romanian cities/addresses. DIACRITICS ACCEPTED. Multi-valued array |
| website | string[] | Official company website. Must be valid HTTP/HTTPS URL |
| career | string[] | Official career/jobs page. Must be valid HTTP/HTTPS URL |
| lastScraped | string | Date of last scrape in ISO8601 format |
| scraperFile | string | URL to scraper workflow YML file (github raw URL) |
