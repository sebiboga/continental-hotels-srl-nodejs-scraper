# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-18

### Added
- Initial release — derived from [EPAM template](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper) (v1.4.3)
- POST AJAX scraping for CONTINENTAL HOTELS SA (CIF 1559737) at `/_ajax/get-job-list.php`
- HTML fragment parsing with cheerio (selector: `a.job-listing`)
- City extraction from the concatenated hotel-locations string (Bucureşti, Sibiu, Arad, Oradea, Târgu Mureş, Suceava, Drobeta Turnu Severin, Constanţa)
- Default workmode `on-site` (hotel staff)
- All template features inherited: `config/company.json` single source of truth, 7-day ANAF cache, `docs/jobs.md` generation, 4-layer test suite, daily scheduled scraping, GitHub Pages dashboard

## License

Copyright (c) 2026 BOGA SEBASTIAN-NICOLAE
Licensed under MIT License
