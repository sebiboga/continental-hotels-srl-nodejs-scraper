import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import { fileURLToPath } from "url";
import { validateAndGetCompany, addCompanyToCompanyCore } from "./company.js";
import { querySOLR, deleteJobByUrl, upsertJobs } from "./solr.js";
import { generateDocs } from "./scripts/generate-docs.js";

const COMPANY_CIF = "1559737";
const JOB_API = "https://www.jobs-continentalhotels.ro/_ajax/get-job-list.php";
const JOB_BASE = "https://www.jobs-continentalhotels.ro";

let COMPANY_NAME = null;

const CITY_MAP = {
  "Mureș": "Targu Mures",
  "Severin": "Drobeta-Turnu Severin"
};

const STAR_PATTERN = /\s+\d+\*/g;

function extractCities(footerText) {
  let text = footerText.replace(STAR_PATTERN, '').trim();
  const parts = text.split(',').map(s => s.trim());
  return parts.map(part => {
    const words = part.split(' ');
    const city = words[words.length - 1];
    return CITY_MAP[city] || city;
  });
}

function parseJobs(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  $('a').each((i, el) => {
    const title = $(el).find('h3.job-listing-title').text().trim();
    const href = $(el).attr('href');
    const footer = $(el).find('div.job-listing-footer').text().trim();

    if (!title || !href) return;

    const url = href.startsWith('http') ? href : `${JOB_BASE}${href.startsWith('/') ? '' : '/'}${href}`;
    const cities = extractCities(footer);

    jobs.push({
      url,
      title,
      company: COMPANY_NAME || 'CONTINENTAL HOTELS SA',
      location: cities.length > 0 ? cities : ['România'],
      country: 'România',
      workmode: 'on-site'
    });
  });

  return jobs;
}

function mapToJobModel(job, cif, companyName) {
  const name = companyName || COMPANY_NAME || 'CONTINENTAL HOTELS SA';
  return {
    url: job.url,
    job_title: job.title,
    title: job.title,
    company: name,
    cif: cif || COMPANY_CIF,
    location: job.location || [],
    country: job.country || 'România',
    workmode: job.workmode || 'on-site',
    status: 'scraped',
    date: new Date().toISOString()
  };
}

function transformJobsForSOLR(payload) {
  const RO_COUNTRIES = ['românia', 'romania', 'ro'];

  return {
    ...payload,
    company: (payload.company || '').toUpperCase(),
    jobs: payload.jobs.map(job => ({
      ...job,
      company: (job.company || '').toUpperCase(),
      location: Array.isArray(job.location) && job.location.length > 0
        ? job.location
        : ['România'],
      country: RO_COUNTRIES.some(c =>
        (job.country || '').toLowerCase().includes(c)
      ) ? 'România' : (job.country || 'România'),
      workmode: (job.workmode || '').toLowerCase() === 'on-site' ? 'on-site'
        : (job.workmode || '').toLowerCase() === 'remote' ? 'remote'
        : 'hybrid'
    }))
  };
}

async function scrapeAllListings() {
  const body = {
    id_lang: 1,
    'filter-only-open': 1,
    'listing-section': 'job-list',
    id_job_department: 0,
    id_owner_branch: 0
  };

  console.log(`Scraping ${JOB_API}...`);

  const res = await fetch(JOB_API, {
    method: 'POST',
    headers: {
      "User-Agent": "job_seeker_ro_spider",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "text/html, */*"
    },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(30000)
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} from ${JOB_API}`);
  }

  const html = await res.text();
  const jobs = parseJobs(html);

  console.log(`Found ${jobs.length} jobs`);
  return jobs;
}

async function main() {
  try {
    console.log("=== Step 1: Get existing jobs count ===");
    const existingResult = await querySOLR(COMPANY_CIF);
    const existingCount = existingResult.numFound;
    console.log(`Found ${existingCount} existing jobs in SOLR`);

    console.log("=== Step 2: Validate company via ANAF ===");
    const { company, cif, anafData } = await validateAndGetCompany();
    COMPANY_NAME = company;
    const localCif = cif;

    const rawJobs = await scrapeAllListings();
    const scrapedCount = rawJobs.length;
    console.log(`Jobs scraped from Continental Hotels website: ${scrapedCount}`);

    console.log("=== Step 3: Remove expired jobs from SOLR ===");
    const scrapedUrls = new Set(rawJobs.map(j => j.url));
    if (scrapedUrls.size > 0) {
      const existingJobs = existingResult.docs || [];
      const expiredUrls = existingJobs
        .filter(j => !scrapedUrls.has(j.url))
        .map(j => j.url);
      if (expiredUrls.length > 0) {
        console.log(`${expiredUrls.length} jobs no longer on careers page - deleting from SOLR...`);
        for (const url of expiredUrls) {
          await deleteJobByUrl(url);
        }
        console.log(`Deleted ${expiredUrls.length} expired jobs`);
      } else {
        console.log("No expired jobs to remove");
      }
    } else {
      console.log("No jobs scraped - skipping expiry check");
    }

    if (scrapedCount === 0) {
      console.log("No jobs found on careers page.");
      fs.writeFileSync("jobs.json", JSON.stringify({ jobs: [], message: "No jobs found" }, null, 2), "utf-8");
      console.log("Saved jobs.json");
      return;
    }

    const jobs = rawJobs.map(job => mapToJobModel(job, localCif, COMPANY_NAME));

    const payload = {
      source: "www.jobs-continentalhotels.ro",
      scrapedAt: new Date().toISOString(),
      company: COMPANY_NAME,
      cif: localCif,
      jobs
    };

    console.log("Transforming jobs for SOLR...");
    const transformedPayload = transformJobsForSOLR(payload);

    fs.writeFileSync("jobs.json", JSON.stringify(transformedPayload, null, 2), "utf-8");
    console.log("Saved jobs.json");

    console.log("Step 4: Upsert jobs to SOLR...");
    await upsertJobs(transformedPayload.jobs);

    console.log("=== Step 5: Add/update company in Company Core ===");
    await addCompanyToCompanyCore(COMPANY_NAME, localCif, anafData, JOB_API);

    const finalResult = await querySOLR(COMPANY_CIF);
    console.log(`SUMMARY`);
    console.log(`Jobs existing in SOLR before scrape: ${existingCount}`);
    console.log(`Jobs scraped from Continental Hotels website: ${scrapedCount}`);
    console.log(`Jobs in SOLR after scrape: ${finalResult.numFound}`);

    if (scrapedCount > 0) {
      console.log(`Successfully scraped and uploaded ${scrapedCount} jobs`);
    }

    console.log("=== Step 6: Generate docs ===");
    generateDocs();
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  }
}

export { scrapeAllListings, parseJobs, mapToJobModel, transformJobsForSOLR, extractCities };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
