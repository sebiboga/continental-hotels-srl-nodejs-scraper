import fs from "fs";

const DOCS_DIR = "docs";
const DOCS_FILE = `${DOCS_DIR}/index.html`;

function readJson(path) {
  try {
    if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path, "utf-8"));
    }
  } catch {
    // ignore
  }
  return null;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ro-RO", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function summarizeJobs(jobs) {
  if (!jobs || !Array.isArray(jobs)) {
    return { count: 0, cities: [], workmodes: {} };
  }
  const cities = [...new Set((jobs || []).flatMap(j => j.location || []))].sort();
  const workmodes = {};
  for (const j of jobs) {
    const w = j.workmode || "unknown";
    workmodes[w] = (workmodes[w] || 0) + 1;
  }
  return { count: jobs.length, cities, workmodes };
}

function generateDocs() {
  const jobsData = readJson("jobs.json");
  const companyData = readJson("company.json");
  const jobs = jobsData?.jobs || [];
  const summary = summarizeJobs(jobs);
  const scrapedAt = jobsData?.scrapedAt || null;
  const companyName = companyData?.summary?.company || "CONTINENTAL HOTELS SA";
  const cif = companyData?.summary?.cif || "1559737";
  const active = companyData?.summary?.active !== false;

  const workmodeRows = Object.entries(summary.workmodes)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join("");

  const cityList = summary.cities.map(c => `<li>${c}</li>`).join("");

  const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Continental Hotels Scraper — Documentație</title>
  <style>
    :root {
      --bg: #0d1117;
      --surface: #161b22;
      --border: #30363d;
      --text: #e6edf3;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --success: #3fb950;
      --warning: #d29922;
      --danger: #f85149;
      --radius: 8px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1rem;
    }

    .container { max-width: 960px; margin: 0 auto; }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    header h1 {
      font-size: 1.75rem;
      font-weight: 600;
    }

    header h1 small {
      display: block;
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 400;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .badge-success { background: rgba(63, 185, 80, 0.15); color: var(--success); border: 1px solid rgba(63, 185, 80, 0.3); }
    .badge-warning { background: rgba(210, 153, 34, 0.15); color: var(--warning); border: 1px solid rgba(210, 153, 34, 0.3); }
    .badge-danger  { background: rgba(248, 81, 73, 0.15); color: var(--danger); border: 1px solid rgba(248, 81, 73, 0.3); }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem;
      text-align: center;
    }

    .stat-card .value {
      font-size: 2.25rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .stat-card .label {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .stat-card .sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    section h2 {
      font-size: 1.15rem;
      font-weight: 600;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }

    ul, ol { padding-left: 1.25rem; }
    li { margin-bottom: 0.35rem; }

    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    code {
      background: rgba(110, 118, 129, 0.2);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.85em;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }

    pre {
      background: rgba(110, 118, 129, 0.1);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      overflow-x: auto;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.85rem;
      line-height: 1.5;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    th, td {
      padding: 0.6rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .chip-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .chip {
      background: rgba(88, 166, 255, 0.1);
      border: 1px solid rgba(88, 166, 255, 0.2);
      color: var(--accent);
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.8rem;
    }

    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .footer a { color: var(--text-muted); }
    .footer a:hover { color: var(--accent); }

    @media (max-width: 600px) {
      header { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="container">

    <header>
      <div>
        <h1>
          Continental Hotels Scraper
          <small>Colectare automată joburi pentru <a href="https://peviitor.ro" target="_blank">peviitor.ro</a></small>
        </h1>
      </div>
      <div>
        <span class="badge ${active ? "badge-success" : "badge-danger"}">${active ? "Activ" : "Inactiv"}</span>
        <span class="badge badge-warning">CIF ${cif}</span>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${summary.count}</div>
        <div class="label">Joburi active</div>
      </div>
      <div class="stat-card">
        <div class="value">${summary.cities.length}</div>
        <div class="label">Orașe</div>
      </div>
      <div class="stat-card">
        <div class="value">${Object.keys(summary.workmodes).length}</div>
        <div class="label">Tipuri de program</div>
      </div>
      <div class="stat-card">
        <div class="value" style="font-size:1rem;word-break:break-all;">${companyName}</div>
        <div class="label">Companie</div>
      </div>
    </div>

    <section>
      <h2>📊 Rezumat joburi</h2>
      <table>
        <thead>
          <tr><th>Tip program</th><th>Număr joburi</th></tr>
        </thead>
        <tbody>
          ${workmodeRows || "<tr><td colspan='2' style='color:var(--text-muted)'>Nu există date</td></tr>"}
        </tbody>
      </table>
    </section>

    <section>
      <h2>📍 Locații</h2>
      ${summary.cities.length > 0
        ? `<div class="chip-list">${summary.cities.map(c => `<span class="chip">${c}</span>`).join("")}</div>`
        : '<p style="color:var(--text-muted)">Nu există date</p>'}
    </section>

    <section>
      <h2>🏗️ Structură proiect</h2>
      <ul>
        <li><code>index.js</code> — orchestrator principal (scraping, transformare, upsert SOLR)</li>
        <li><code>company.js</code> — validare companie (ANAF + Peviitor + SOLR)</li>
        <li><code>solr.js</code> — operațiuni SOLR (query, upsert, delete)</li>
        <li><code>src/anaf.js</code> — bibliotecă ANAF (căutare, detalii, retry)</li>
        <li><code>scripts/generate-docs.js</code> — generator acestei pagini</li>
      </ul>
    </section>

    <section>
      <h2>🚀 Rulare</h2>
      <pre>npm run scrape             # rulează scraperul complet
npm run docs               # generează docs/index.html
npm run test               # teste unitare + integrare + e2e
npm run test:unit          # doar teste unitare
npm run test:integration   # teste integrare (necesită SOLR_AUTH)
npm run test:e2e           # teste e2e (necesită SOLR_AUTH)</pre>
    </section>

    <section>
      <h2>🔧 Variabile de mediu</h2>
      <table>
        <thead>
          <tr><th>Variabilă</th><th>Descriere</th></tr>
        </thead>
        <tbody>
          <tr><td><code>SOLR_AUTH</code></td><td>Credențiale SOLR (format <code>username:password</code>)</td></tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>⏰ Programare</h2>
      <p>Rulează automat la fiecare <strong>6 ore</strong> prin GitHub Actions (<code>.github/workflows/scrape.yml</code>).</p>
      <p>Testele rulează la fiecare push și PR prin <code>.github/workflows/test.yml</code>.</p>
    </section>

    <div class="footer">
      <span>
        <a href="https://github.com/sebiboga/continental-hotels-srl-nodejs-scraper" target="_blank">GitHub</a> •
        <a href="https://peviitor.ro" target="_blank">peviitor.ro</a>
      </span>
      <span>Generat la ${formatDate(scrapedAt)}</span>
    </div>

  </div>
</body>
</html>`;

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  fs.writeFileSync(DOCS_FILE, html, "utf-8");
  console.log(`✅ Docs generated: ${DOCS_FILE}`);
}

export { generateDocs };

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  generateDocs();
}
