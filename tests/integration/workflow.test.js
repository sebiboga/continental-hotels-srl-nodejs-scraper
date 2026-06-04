import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

  const CONTINENTAL_CIF = '1559737';

describe('Integration: API Workflow', () => {

  describe('ANAF API', () => {
    let anaf;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
    });

    it('should search for CONTINENTAL HOTELS brand and find the company', async () => {
      const results = await anaf.searchCompany('CONTINENTAL HOTELS');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const continental = results.find(c =>
        c.name.toUpperCase().includes('CONTINENTAL')
      );
      expect(continental).toBeDefined();
      expect(continental.cui).toBeDefined();
    }, 15000);

    it('should return empty array for non-existent brand', async () => {
      const results = await anaf.searchCompany('ThisBrandDoesNotExistXYZ123');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    }, 15000);

    it('should fetch company details by valid CIF', async () => {
      const data = await anaf.getCompanyFromANAF(CONTINENTAL_CIF);

      expect(data).toBeDefined();
      expect(data.cui).toBe(1559737);
      expect(data.name).toBe('CONTINENTAL HOTELS SA');
      expect(data).toHaveProperty('address');
      expect(data).toHaveProperty('registrationNumber');
      expect(data).toHaveProperty('caenCode');
    }, 15000);

    it('should throw for invalid CIF', async () => {
      await expect(anaf.getCompanyFromANAF('00000000')).rejects.toThrow();
    }, 60000);

    it('should use cached data when API fails (getCompanyFromANAFWithFallback)', async () => {
      const cached = { cui: 1559737, name: 'CONTINENTAL HOTELS SA' };

      const data = await anaf.getCompanyFromANAFWithFallback(CONTINENTAL_CIF, cached);

      expect(data).toBeDefined();
      expect(data.cui).toBe(1559737);
    }, 15000);
  });

  describe('Peviitor API', () => {
    let company;

    beforeAll(async () => {
      company = await import('../../company.js');
    });

    it.skip('should respond successfully and contain companies array', async () => {
      const fetch = (await import('node-fetch')).default;
      const res = await fetch('https://api.peviitor.ro/v1/company/', {
        headers: { 'User-Agent': 'job_seeker_ro_spider' }
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toHaveProperty('companies');
      expect(Array.isArray(data.companies)).toBe(true);
    }, 15000);
  });

  describe('SOLR Company Core', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should query company core by ID', async () => {
      const result = await solr.queryCompanySOLR(`id:${CONTINENTAL_CIF}`);

      expect(result.numFound).toBe(1);
      const company = result.docs[0];
      expect(company.id).toBe(CONTINENTAL_CIF);
      expect(company.company).toBe('CONTINENTAL HOTELS SA');
      expect(company.brand).toBe('CONTINENTAL HOTELS');
      expect(company.status).toBe('activ');
      expect(Array.isArray(company.location)).toBe(true);
      expect(company.lastScraped).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }, 15000);

    itIfSolr('should have required company model fields', async () => {
      const result = await solr.queryCompanySOLR(`id:${CONTINENTAL_CIF}`);
      const company = result.docs[0];

      expect(company).toHaveProperty('id', CONTINENTAL_CIF);
      expect(company).toHaveProperty('company');
      expect(company).toHaveProperty('brand', 'CONTINENTAL HOTELS');
      expect(company).toHaveProperty('status');
      expect(['activ', 'suspendat', 'inactiv', 'radiat']).toContain(company.status);
      expect(company).toHaveProperty('location');
      expect(Array.isArray(company.location)).toBe(true);
      expect(company).toHaveProperty('website');
      expect(Array.isArray(company.website)).toBe(true);
      expect(company.website[0]).toMatch(/^https?:\/\/.+/);
      expect(company).toHaveProperty('career');
      expect(Array.isArray(company.career)).toBe(true);
      expect(company.career[0]).toMatch(/^https?:\/\/.+/);
      expect(company).toHaveProperty('lastScraped');
      expect(company).toHaveProperty('scraperFile');
    }, 15000);

    itIfSolr('should have optional field (group) if present', async () => {
      const result = await solr.queryCompanySOLR(`id:${CONTINENTAL_CIF}`);
      const company = result.docs[0];

      if (company.group !== undefined) {
        expect(typeof company.group).toBe('string');
      }
    }, 15000);
  });

  describe('SOLR Jobs Core', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should query jobs by CIF and return valid data', async () => {
      const result = await solr.querySOLR(CONTINENTAL_CIF);

      expect(result.numFound).toBeGreaterThan(0);
      expect(Array.isArray(result.docs)).toBe(true);

      const job = result.docs[0];
      expect(job).toHaveProperty('url');
      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('company', 'CONTINENTAL HOTELS SA');
      expect(job).toHaveProperty('cif', CONTINENTAL_CIF);
      expect(job).toHaveProperty('status');
      expect(job).toHaveProperty('location');
    }, 15000);

    itIfSolr('should not have duplicate URLs for same CIF', async () => {
      const result = await solr.querySOLR(CONTINENTAL_CIF);

      const urls = result.docs.map(j => j.url);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(result.docs.length);
    }, 15000);

    itIfSolr('should have valid status values for all jobs', async () => {
      const validStatuses = ['scraped', 'tested', 'verified', 'published'];
      const result = await solr.querySOLR(CONTINENTAL_CIF);

      for (const job of result.docs) {
        expect(validStatuses).toContain(job.status);
      }
    }, 15000);

    itIfSolr('should have valid CIF format for all jobs', async () => {
      const result = await solr.querySOLR(CONTINENTAL_CIF);

      for (const job of result.docs) {
        expect(job.cif).toMatch(/^\d{7,8}$/);
      }
    }, 15000);
  });

  describe('Full Validation Workflow', () => {
    let anaf;
    let companyModule;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
      companyModule = await import('../../company.js');
    });

    it('should complete the ANAF validation path', async () => {
      const data = await anaf.getCompanyFromANAF(CONTINENTAL_CIF);

      expect(data).toBeDefined();
      expect(data.name).toBe('CONTINENTAL HOTELS SA');
      expect(data.inactive).toBe(false);
    }, 30000);

    itIfSolr('should validate company and query SOLR for existing jobs', async () => {
      const companyResult = await companyModule.validateAndGetCompany();

      expect(['active', 'inactive']).toContain(companyResult.status);
      expect(companyResult.company).toBe('CONTINENTAL HOTELS SA');
      expect(companyResult.cif).toBe(CONTINENTAL_CIF);
      expect(companyResult.existingJobsCount).toBeGreaterThan(0);
    }, 30000);

    itIfSolr('should have matching CIF in company core', async () => {
      const companyResult = await companyModule.validateAndGetCompany();
      const solrObj = await import('../../solr.js');

      const solrResult = await solrObj.queryCompanySOLR(`id:${CONTINENTAL_CIF}`);
      expect(solrResult.numFound).toBe(1);
      expect(solrResult.docs[0].id).toBe(CONTINENTAL_CIF);
      expect(solrResult.docs[0].company.toUpperCase().replace(/\./g, '')).toBe('CONTINENTAL HOTELS SA');
    }, 30000);
  });
});
