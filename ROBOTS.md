# robots.txt — Continental Hotels

Sursa: https://www.jobs-continentalhotels.ro/robots.txt

Site-ul **nu publică un robots.txt** — request-ul returnează `302 Found` (redirect către homepage). Asta înseamnă că nu există restricții explicite documentate.

## Politica scraper-ului

Risc minim. Site-ul nu restricționează scraping, dar scraper-ul rămâne politicos:

- Un singur POST AJAX la `/_ajax/get-job-list.php` (toate joburile vin într-un singur răspuns — fără paginare, fără follow-up requests)
- Niciun fetch pentru paginile individuale de job (URL-urile sunt deja extrase din răspunsul AJAX)
- User-Agent identificabil: `job_seeker_ro_spider`
- Niciun concurrency, niciun retry agresiv

## Diferență față de EPAM template

EPAM (template-ul de la care a fost derivat acest scraper) are `Disallow: /api/*` și `Disallow: /*/vacancy/*` în robots.txt. Continental Hotels nu are robots.txt — scraping-ul este complet permis.
