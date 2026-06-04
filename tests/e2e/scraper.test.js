import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const HAS_SOLR = !!process.env.SOLR_AUTH;

function itIfSolr(name, fn, timeout) {
  if (HAS_SOLR) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: SOLR_AUTH not set)`, fn, timeout);
}

beforeAll(() => {
  if (HAS_SOLR) {
    process.env.SOLR_AUTH = process.env.SOLR_AUTH;
  }
});

const JOB_API = 'https://www.jobs-continentalhotels.ro/_ajax/get-job-list.php';
const COMPANY_CIF = '1559737';

describe('E2E: Full Scraping Pipeline', () => {

  describe('Continental Hotels Jobs API — Real Data Fetch', () => {
    let html;

    beforeAll(async () => {
      const body = {
        id_lang: 1,
        'filter-only-open': 1,
        'listing-section': 'job-list',
        id_job_department: 0,
        id_owner_branch: 0
      };

      const res = await fetch(JOB_API, {
        method: 'POST',
        headers: {
          'User-Agent': 'job_seeker_ro_spider',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'text/html'
        },
        body: new URLSearchParams(body)
      });
      html = await res.text();
    }, 15000);

    it('should respond with valid HTML from Continental Hotels API', () => {
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(100);
    });

    it('should contain job listings', () => {
      expect(html).toContain('job-listing');
    });

    it('should contain job titles', () => {
      const titleMatches = html.match(/job-listing-title/g);
      expect(titleMatches).toBeDefined();
      expect(titleMatches.length).toBeGreaterThan(0);
    });
  });

  describe('Parse Pipeline', () => {
    let index;

    beforeAll(async () => {
      index = await import('../../index.js');
    });

    it('should parse real HTML into standardized format', async () => {
      const body = {
        id_lang: 1,
        'filter-only-open': 1,
        'listing-section': 'job-list',
        id_job_department: 0,
        id_owner_branch: 0
      };

      const res = await fetch(JOB_API, {
        method: 'POST',
        headers: {
          'User-Agent': 'job_seeker_ro_spider',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'text/html'
        },
        body: new URLSearchParams(body)
      });
      const html = await res.text();
      const parsed = index.parseJobs(html);

      expect(parsed).toBeDefined();
      expect(Array.isArray(parsed)).toBe(true);

      parsed.forEach(job => {
        expect(job).toHaveProperty('url');
        expect(job).toHaveProperty('title');
        expect(job).toHaveProperty('location');
        expect(job).toHaveProperty('country', 'România');
      });
    }, 15000);

    it('should map parsed jobs to job model', () => {
      const rawJobs = [
        {
          url: 'https://www.jobs-continentalhotels.ro/ro/job-details/1-test',
          title: 'Test Job',
          location: ['Sibiu'],
          workmode: 'on-site'
        }
      ];

      const mapped = rawJobs.map(job => index.mapToJobModel(job, COMPANY_CIF, 'CONTINENTAL HOTELS SA'));

      expect(mapped.length).toBe(1);
      expect(mapped[0].company).toBe('CONTINENTAL HOTELS SA');
      expect(mapped[0].cif).toBe(COMPANY_CIF);
      expect(mapped[0].status).toBe('scraped');
    });
  });

  describe('Company Validation Path', () => {
    it('should find CONTINENTAL HOTELS in ANAF and return company data', async () => {
      const company = await import('../../company.js');
      const result = await company.getCompanyData();

      expect(result.company).toContain('CONTINENTAL');
      expect(result.cif).toBeDefined();
    }, 15000);

    itIfSolr('should run full validation and report active status with job count', async () => {
      const company = await import('../../company.js');
      const result = await company.validateAndGetCompany();

      expect(result.status).toBe('active');
      expect(result.company).toContain('CONTINENTAL');
      expect(result.cif).toBe(COMPANY_CIF);
      expect(typeof result.existingJobsCount).toBe('number');
    }, 30000);
  });

  describe('SOLR Data Verification', () => {
    itIfSolr('should have CONTINENTAL HOTELS jobs in SOLR with correct company name', async () => {
      const solr = await import('../../solr.js');
      const result = await solr.querySOLR(COMPANY_CIF);

      expect(result.numFound).toBeGreaterThan(0);
      result.docs.forEach(job => {
        expect(job.company.toUpperCase()).toContain('CONTINENTAL');
      });
    }, 15000);

    itIfSolr('should have CONTINENTAL HOTELS company core entry with required fields', async () => {
      const solr = await import('../../solr.js');
      const result = await solr.queryCompanySOLR(`id:${COMPANY_CIF}`);

      expect(result.numFound).toBe(1);
      const company = result.docs[0];
      expect(company).toHaveProperty('company');
      expect(company).toHaveProperty('brand');
      expect(company).toHaveProperty('status');
    }, 15000);
  });
});
