# Robots.txt Analysis — jobs-continentalhotels.ro

Sursa: https://www.jobs-continentalhotels.ro/robots.txt

## Reguli

```
User-agent: *
Disallow:
```

## Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` | ✅ Da | Pagina principală, API-ul AJAX de job-uri |

## Recomandare

- Scraperul accesează API-ul AJAX intern (`/_ajax/get-job-list.php`) — permis de robots.txt
- Rate limiting: 1 request per scrape
- User-Agent standard (`job_seeker_ro_spider`)
- Risc minim de blocare
