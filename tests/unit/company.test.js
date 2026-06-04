import { jest } from '@jest/globals';
import fs from 'fs';

const mockFetch = jest.fn();

jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch
}));

const COMPANY_JSON_PATH = 'company.json';

function backupCompanyJson() {
  if (fs.existsSync(COMPANY_JSON_PATH)) {
    const content = fs.readFileSync(COMPANY_JSON_PATH, 'utf-8');
    fs.renameSync(COMPANY_JSON_PATH, `${COMPANY_JSON_PATH}.bak`);
    return content;
  }
  return null;
}

function restoreCompanyJson() {
  if (fs.existsSync(`${COMPANY_JSON_PATH}.bak`)) {
    fs.renameSync(`${COMPANY_JSON_PATH}.bak`, COMPANY_JSON_PATH);
  }
  return null;
}

function anafSearchResponse(results) {
  return {
    ok: true,
    json: async () => ({ data: results, success: true })
  };
}

function anafCompanyResponse(data) {
  return {
    ok: true,
    json: async () => ({ data, success: true })
  };
}

function peviitorResponse(companies) {
  return {
    ok: true,
    json: async () => ({ companies })
  };
}

function solrResponse(numFound, docs) {
  return {
    ok: true,
    json: async () => ({ response: { numFound, docs } })
  };
}

function errorResponse(status) {
  return {
    ok: false,
    status,
    text: async () => 'Error'
  };
}

const CONTINENTAL_ANAF_RECORD = {
  cui: 1559737,
  name: 'CONTINENTAL HOTELS SA',
  address: 'Bucuresti',
  caenCode: '5510',
  inactive: false,
  registrationNumber: 'J40/9999/2002',
  vatRegistered: true,
  eFacturaRegistered: false,
  onrcStatusLabel: 'Funcțiune',
  legalForm: 'SA',
  headquartersAddress: { locality: 'Bucureşti Sectorul 1' }
};

describe('company.js', () => {
  let company;
  let savedCompanyJson;

  beforeAll(async () => {
    process.env.SOLR_AUTH = 'test:test';
    savedCompanyJson = backupCompanyJson();
    company = await import('../../company.js');
  });

  afterAll(() => {
    delete process.env.SOLR_AUTH;
    restoreCompanyJson();
  });

  beforeEach(() => {
    mockFetch.mockReset();
    if (fs.existsSync(COMPANY_JSON_PATH)) {
      fs.unlinkSync(COMPANY_JSON_PATH);
    }
  });

  describe('getCompanyBrand', () => {
    it('should return the company brand', () => {
      const brand = company.getCompanyBrand();
      expect(typeof brand).toBe('string');
      expect(brand).toBe('CONTINENTAL HOTELS');
    });
  });

  describe('getCompanyData (no cache)', () => {
    it('should find CONTINENTAL HOTELS via ANAF search', async () => {
      mockFetch
        .mockResolvedValueOnce(anafSearchResponse([
          { cui: 1559737, name: 'CONTINENTAL HOTELS SA', statusLabel: 'Funcțiune' }
        ]))
        .mockResolvedValueOnce(anafCompanyResponse(CONTINENTAL_ANAF_RECORD));

      const result = await company.getCompanyData();

      expect(result).toHaveProperty('company', 'CONTINENTAL HOTELS SA');
      expect(result).toHaveProperty('cif', '1559737');
      expect(result).toHaveProperty('active', true);
      expect(result).toHaveProperty('anafData');
      expect(result.anafData.name).toBe('CONTINENTAL HOTELS SA');
    });

    it('should pick first active company when no exact match', async () => {
      mockFetch
        .mockResolvedValueOnce(anafSearchResponse([
          { cui: 11111111, name: 'SOME OTHER COMPANY SA', statusLabel: 'Radiată' },
          { cui: 1559737, name: 'CONTINENTAL HOTELS SA', statusLabel: 'Funcțiune' }
        ]))
        .mockResolvedValueOnce(anafCompanyResponse(CONTINENTAL_ANAF_RECORD));

      const result = await company.getCompanyData();

      expect(result.cif).toBe('1559737');
      expect(result.active).toBe(true);
    });

    it('should throw when no companies found', async () => {
      mockFetch.mockResolvedValueOnce(anafSearchResponse([]));

      await expect(company.getCompanyData()).rejects.toThrow('No companies found');
    });

    it('should throw when no active company found', async () => {
      mockFetch.mockResolvedValueOnce(anafSearchResponse([
        { cui: 11111111, name: 'CONTINENTAL HOTELS SOMETHING SA', statusLabel: 'Radiată' }
      ]));

      await expect(company.getCompanyData()).rejects.toThrow('No active company found');
    });
  });

  describe('getCompanyData (with cache)', () => {
    const cachedData = {
      anaf: CONTINENTAL_ANAF_RECORD,
      summary: {
        company: 'CONTINENTAL HOTELS SA',
        cif: '1559737',
        active: true
      }
    };

    beforeEach(() => {
      fs.writeFileSync(COMPANY_JSON_PATH, JSON.stringify(cachedData), 'utf-8');
    });

    it('should use cached company data when available', async () => {
      const result = await company.getCompanyData();

      expect(result.company).toBe('CONTINENTAL HOTELS SA');
      expect(result.cif).toBe('1559737');
      expect(result.active).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('validateAndGetCompany', () => {
    it('should return company data with status active', async () => {
      mockFetch
        .mockResolvedValueOnce(anafSearchResponse([
          { cui: 1559737, name: 'CONTINENTAL HOTELS SA', statusLabel: 'Funcțiune' }
        ]))
        .mockResolvedValueOnce(anafCompanyResponse(CONTINENTAL_ANAF_RECORD))
        .mockResolvedValueOnce(solrResponse(3, [
          { url: 'https://test.com/1', title: 'Job 1' }
        ]))
        .mockResolvedValueOnce(peviitorResponse([{ company: 'CONTINENTAL HOTELS SA' }]));

      const result = await company.validateAndGetCompany();

      expect(result).toHaveProperty('status', 'active');
      expect(result).toHaveProperty('company', 'CONTINENTAL HOTELS SA');
      expect(result).toHaveProperty('cif', '1559737');
      expect(typeof result.existingJobsCount).toBe('number');
    });

    it('should return inactive status when company is inactive', async () => {
      const inactiveRecord = { ...CONTINENTAL_ANAF_RECORD, inactive: true };

      mockFetch
        .mockResolvedValueOnce(anafSearchResponse([
          { cui: 1559737, name: 'CONTINENTAL HOTELS SA', statusLabel: 'Funcțiune' }
        ]))
        .mockResolvedValueOnce(anafCompanyResponse(inactiveRecord))
        .mockResolvedValueOnce(solrResponse(0, []));

      const result = await company.validateAndGetCompany();

      expect(result).toHaveProperty('status', 'inactive');
    });
  });
});
