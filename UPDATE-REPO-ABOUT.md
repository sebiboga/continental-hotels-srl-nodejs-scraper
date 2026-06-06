# Actualizare About repo pe GitHub

## CLI (gh)

```bash
# Descriere
gh repo edit sebiboga/continental-hotels-srl-nodejs-scraper \
  --description "web scraper pentru a aduce locurile de munca de la Continental Hotels in platforma peviitor.ro"

# Topics (EXACT aceste două)
gh repo edit sebiboga/continental-hotels-srl-nodejs-scraper \
  --add-topic job-seeker-ro-spider --add-topic peviitor-ro
```

## Verificare

```bash
gh repo view sebiboga/continental-hotels-srl-nodejs-scraper --json description,homepageUrl,repositoryTopics
```
