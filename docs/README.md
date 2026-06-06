# job_seeker_ro_spider

**job_seeker_ro_spider** — scraper pentru job-urile CONTINENTAL HOTELS SA din România.

Extrage anunțurile de pe [Continental Hotels Jobs](https://www.jobs-continentalhotels.ro/) și le publică în [peviitor.ro](https://peviitor.ro).

## Ce face

1. **Validează compania** — interoghează API-ul ANAF după brand
2. **Cross-validează cu Peviitor** — verifică existența în API-ul Peviitor
3. **Scrape-uiește job-urile** — extrage lista de job-uri din API-ul AJAX
4. **Elimină job-urile expirate** — compară cu SOLR, șterge ce nu mai e pe site
5. **Stochează în SOLR** și actualizează Company Core

## Structură proiect

```
├── index.js           # Orchestrator principal
├── company.js         # Validare companie
├── src/anaf.js        # Modul ANAF API
├── solr.js            # Operații SOLR
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── .github/workflows/
    ├── scrape.yml     # Rulează la fiecare 6 ore
    └── test.yml       # Teste la fiecare push/PR
```

## Testare

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
```
