# CONTINENTAL HOTELS SA — Job Scraper

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-24.x-green.svg)
![GitHub Actions](https://img.shields.io/badge/GitHub-Actions-orange.svg)

**job_seeker_ro_spider** — web scraper pentru a aduce locurile de munca de la **Continental Hotels** in platforma [peviitor.ro](https://peviitor.ro).

## Despre

Acest scraper extrage anunturile de angajare de pe [jobs-continentalhotels.ro](https://www.jobs-continentalhotels.ro/) si le publica in platforma peviitor.ro prin API-ul SOLR.

## Cum functioneaza

| Pas | Actiune | API/Sursa |
|-----|---------|-----------|
| 1 | Cauta compania in ANAF | [demoanaf.ro](https://demoanaf.ro) |
| 2 | Cross-valideaza in Peviitor | [api.peviitor.ro](https://api.peviitor.ro) |
| 3 | Extrage job-urile din API AJAX | [jobs-continentalhotels.ro](https://www.jobs-continentalhotels.ro/) |
| 4 | Elimina job-urile expirate | Compara cu SOLR |
| 5 | Transforma si trimite la SOLR | [solr.peviitor.ro](https://solr.peviitor.ro) |
| 6 | Actualizeaza Company Core | [solr.peviitor.ro](https://solr.peviitor.ro) |

## Tech Stack

- **Node.js 24** — Runtime
- **Cheerio** — HTML parsing
- **GitHub Actions** — CI/CD

## Instalare

```bash
git clone https://github.com/sebiboga/continental-hotels-srl-nodejs-scraper.git
cd continental-hotels-srl-nodejs-scraper
npm install
```

## Utilizare

```bash
# Ruleaza scraperul
npm run scrape

# Ruleaza testele
npm test
```

## Structura proiect

```
.
├── index.js              # Orchestrator principal
├── company.js            # Validare companie (ANAF + Peviitor + SOLR)
├── src/anaf.js           # Modul ANAF API
├── solr.js               # Operatii SOLR
├── package.json
├── .github/workflows/
│   ├── scrape.yml        # Scraper principal
│   └── test.yml          # Teste automate
├── tests/
│   ├── unit/             # Teste unitare
│   ├── integration/      # Teste de integrare
│   └── e2e/              # Teste end-to-end
└── docs/
    └── index.html        # GitHub Pages site
```

## License

MIT License — Copyright (c) 2026 BOGA SEBASTIAN-NICOLAE

## Autor

**Boga Sebastian-Nicolae**
- GitHub: [@sebiboga](https://github.com/sebiboga)
- Website: [peviitor.ro](https://peviitor.ro)
