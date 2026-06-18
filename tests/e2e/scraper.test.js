import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import companyConfig from '../../config/company.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const HAS_SOLR = !!process.env.SOLR_AUTH;
function itIfSolr(name, fn, timeout) {
  if (HAS_SOLR) return it(name, fn, timeout);
  return it.skip(`${name} (skipped: SOLR_AUTH not set)`, fn, timeout);
}

const TEST_CIF = companyConfig.cif;
const ENDPOINT = `${companyConfig.apiBase}${companyConfig.apiEndpoint}`;

describe('E2E: Continental Hotels scraping pipeline', () => {
  describe('jobs-continentalhotels.ro AJAX — real HTML fragment fetch', () => {
    let html;
    let index;

    beforeAll(async () => {
      const body = new URLSearchParams({
        id_lang: '1',
        id_job_type: '0',
        id_hotel: '0',
        'filter-only-open': '1'
      });
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'User-Agent': 'job_seeker_ro_spider',
          'Referer': `${companyConfig.apiBase}/ro/job-list/0-toate/0-toate`,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      });
      expect(res.ok).toBe(true);
      html = await res.text();
      index = await import('../../index.js');
    }, 30000);

    it('contains at least one job-listing anchor', () => {
      expect(html).toMatch(/class=["']job-listing["']/);
    });

    it('parses at least one job with expected shape', () => {
      const { jobs, total } = index.parseHtmlJobs(html);
      expect(total).toBeGreaterThan(0);
      const sample = jobs[0];
      expect(sample.url.startsWith('https://www.jobs-continentalhotels.ro')).toBe(true);
      expect(sample.title.length).toBeGreaterThan(0);
      expect(sample.workmode).toBe('on-site');
      expect(Array.isArray(sample.location)).toBe(true);
      expect(sample.location.length).toBeGreaterThan(0);
    });
  });

  describe('Job model mapping', () => {
    it('maps a scraped job to the SOLR model with required fields', async () => {
      const index = await import('../../index.js');
      const raw = {
        url: 'https://www.jobs-continentalhotels.ro/ro/job-details-future/100-test',
        title: 'Test Position',
        location: ['București'],
        workmode: 'on-site',
        tags: ['cazare']
      };
      const mapped = index.mapToJobModel(raw, TEST_CIF, 'CONTINENTAL HOTELS SA');
      expect(mapped.url).toBe(raw.url);
      expect(mapped.cif).toBe(TEST_CIF);
      expect(mapped.company).toBe('CONTINENTAL HOTELS SA');
      expect(mapped.status).toBe('scraped');
      expect(mapped.date).toBeDefined();
    });
  });

  describe('Transform for SOLR', () => {
    it('uppercases company name and keeps Romanian city', async () => {
      const index = await import('../../index.js');
      const payload = {
        source: 'jobs-continentalhotels.ro',
        company: 'continental hotels sa',
        cif: TEST_CIF,
        jobs: [
          { url: 'https://www.jobs-continentalhotels.ro/ro/job-details-future/a', title: 'A', location: ['Sibiu'], workmode: 'on-site' }
        ]
      };
      const result = index.transformJobsForSOLR(payload);
      expect(result.company).toBe('CONTINENTAL HOTELS SA');
      expect(result.jobs[0].location).toEqual(['Sibiu']);
      expect(result.jobs[0].workmode).toBe('on-site');
    });
  });
});
