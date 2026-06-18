import { jest } from '@jest/globals';

describe('index.js Component Tests', () => {
  let index;

  beforeAll(async () => {
    index = await import('../../index.js');
  });

  describe('transformJobsForSOLR', () => {
    it('should filter locations to only Romanian cities', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', location: ['România'] },
          { url: 'https://test.com/2', title: 'Job 2', location: ['Bucharest'] },
          { url: 'https://test.com/3', title: 'Job 3', location: ['Bulgaria'] },
          { url: 'https://test.com/4', title: 'Job 4', location: ['Cluj-Napoca'] },
          { url: 'https://test.com/5', title: 'Job 5', location: [] }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].location).toEqual(['România']);
      expect(result.jobs[1].location).toEqual(['Bucharest']);
      expect(result.jobs[2].location).toEqual(['România']);
      expect(result.jobs[3].location).toEqual(['Cluj-Napoca']);
      expect(result.jobs[4].location).toEqual(['România']);
    });

    it('should keep company uppercase', () => {
      const payload = {
        source: 'jobs-continentalhotels.ro',
        company: 'continental hotels sa',
        cif: '1559737',
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', company: 'continental systems', cif: '1559737' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.company).toBe('CONTINENTAL HOTELS SA');
    });

    it('should normalize workmode values', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', workmode: 'Remote' },
          { url: 'https://test.com/2', title: 'Job 2', workmode: 'ON-SITE' },
          { url: 'https://test.com/3', title: 'Job 3', workmode: 'Hybrid' },
          { url: 'https://test.com/4', title: 'Job 4', workmode: 'hybrid' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
      expect(result.jobs[3].workmode).toBe('hybrid');
    });

    it('should handle empty jobs array', () => {
      const result = index.transformJobsForSOLR({ jobs: [] });
      expect(result.jobs).toEqual([]);
    });
  });

  describe('mapToJobModel', () => {
    it('should map raw job to job model format', () => {
      const rawJob = {
        url: 'https://www.jobs-continentalhotels.ro/job/123',
        title: 'Senior Developer',
        location: ['Bucharest'],
        tags: ['Java', 'Spring'],
        workmode: 'hybrid'
      };

      const COMPANY_NAME = 'CONTINENTAL HOTELS SA';
      const COMPANY_CIF = '1559737';

      const result = index.mapToJobModel(rawJob, COMPANY_CIF, COMPANY_NAME);

      expect(result.url).toBe(rawJob.url);
      expect(result.title).toBe(rawJob.title);
      expect(result.company).toBe(COMPANY_NAME);
      expect(result.cif).toBe(COMPANY_CIF);
      expect(result.location).toEqual(rawJob.location);
      expect(result.tags).toEqual(rawJob.tags);
      expect(result.workmode).toBe(rawJob.workmode);
      expect(result.status).toBe('scraped');
      expect(result.date).toBeDefined();
    });

    it('should remove undefined fields', () => {
      const rawJob = {
        url: 'https://test.com/1',
        title: 'Job 1'
      };

      const result = index.mapToJobModel(rawJob, '1559737');

      expect(result.location).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.workmode).toBeUndefined();
    });

    it('should handle missing title', () => {
      const rawJob = { url: 'https://test.com/1' };

      const result = index.mapToJobModel(rawJob, '1559737');

      expect(result.title).toBeUndefined();
      expect(result.url).toBe('https://test.com/1');
    });
  });

  describe('parseHtmlJobs (Continental Hotels AJAX response)', () => {
    const sampleHtml = `
      <a href="https://www.jobs-continentalhotels.ro/ro/job-details-future/100-achizitor" class="job-listing">
        <div class="job-listing-details">
          <div class="job-listing-description">
            <h3 class="job-listing-title">Achizitor</h3>
            <h4 class="job-listing-company">Aprovizionare</h4>
          </div>
        </div>
        <div class="job-listing-footer">
          <ul><li><small>Continental Hotels - Sediul central Bucuresti, Grand Hotel Continental Bucuresti</small></li></ul>
        </div>
      </a>
      <a href="/ro/job-details-future/200-bucatar" class="job-listing">
        <div class="job-listing-details">
          <div class="job-listing-description">
            <h3 class="job-listing-title">Bucătar</h3>
            <h4 class="job-listing-company">Food &amp; Beverage</h4>
          </div>
        </div>
        <div class="job-listing-footer">
          <ul><li><small>Continental Forum Sibiu 4*, Continental Forum Arad 4*</small></li></ul>
        </div>
      </a>
    `;

    it('parses title, URL and tags', () => {
      const { jobs, total } = index.parseHtmlJobs(sampleHtml);
      expect(total).toBe(2);
      expect(jobs[0].title).toBe('Achizitor');
      expect(jobs[0].url).toBe('https://www.jobs-continentalhotels.ro/ro/job-details-future/100-achizitor');
      expect(jobs[0].tags).toEqual(['aprovizionare']);
    });

    it('builds absolute URL from relative href', () => {
      const { jobs } = index.parseHtmlJobs(sampleHtml);
      expect(jobs[1].url).toBe('https://www.jobs-continentalhotels.ro/ro/job-details-future/200-bucatar');
    });

    it('extracts Romanian cities from concatenated locationText', () => {
      const { jobs } = index.parseHtmlJobs(sampleHtml);
      expect(jobs[0].location).toContain('București');
      expect(jobs[1].location).toEqual(expect.arrayContaining(['Sibiu', 'Arad']));
    });

    it('sets workmode to on-site (hotel staff)', () => {
      const { jobs } = index.parseHtmlJobs(sampleHtml);
      expect(jobs[0].workmode).toBe('on-site');
      expect(jobs[1].workmode).toBe('on-site');
    });

    it('returns empty when no .job-listing anchors are present', () => {
      const { jobs, total } = index.parseHtmlJobs('<html><body></body></html>');
      expect(jobs).toEqual([]);
      expect(total).toBe(0);
    });
  });
});
