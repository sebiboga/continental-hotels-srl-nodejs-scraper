# Job Model Schema

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| url | string | Full URL to job detail page. Must be valid HTTP/HTTPS URL |
| title | string | Position title. Max 200 chars, no HTML, trimmed whitespace. DIACRITICS ACCEPTED (ăâîșțĂÂÎȘȚ) |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| company | string | Hiring company name. Legal name, uppercase, DIACRITICS ACCEPTED |
| cif | string | CIF/CUI (8 digits, no RO prefix) |
| location | string[] | Romanian cities/addresses. DIACRITICS ACCEPTED. Multi-valued array |
| tags | string[] | Skills/education/experience. Lowercase, max 20 entries, NO DIACRITICS |
| workmode | string | "remote", "on-site", or "hybrid" |
| date | date | Scrape date. ISO8601 UTC timestamp |
| status | string | "scraped", "tested", "published", or "verified". Default: "scraped" |
| vdate | date | Verified date. ISO8601 |
| expirationdate | date | Estimated job expiration. ISO8601 |
| salary | string | Salary range + currency. Format: "MIN-MAX CURRENCY" |

## Status Flow

`scraped` → (`tested` OR `verified`) → `published`
