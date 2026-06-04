import { jest } from '@jest/globals';

describe('index.js Component Tests', () => {
  let index;
  
  beforeAll(async () => {
    index = await import('../../index.js');
  });

  describe('extractCities', () => {
    it('should extract single city from footer', () => {
      const result = index.extractCities('Continental Forum Sibiu 4*');
      expect(result).toEqual(['Sibiu']);
    });

    it('should extract multiple cities from footer', () => {
      const result = index.extractCities('Continental Forum Sibiu 4*, MyContinental Sibiu 3*');
      expect(result).toEqual(['Sibiu', 'Sibiu']);
    });

    it('should handle footer without star rating', () => {
      const result = index.extractCities('Continental Hotels - Sediul central Bucuresti');
      expect(result).toEqual(['Bucuresti']);
    });

    it('should map city Mureș to Targu Mures', () => {
      const result = index.extractCities('Continental Mureș 3*');
      expect(result).toEqual(['Targu Mures']);
    });

    it('should map city Severin to Drobeta-Turnu Severin', () => {
      const result = index.extractCities('Continental Drobeta Turnu Severin 3*');
      expect(result).toEqual(['Drobeta-Turnu Severin']);
    });
  });

  describe('parseJobs', () => {
    it('should parse jobs from Continental Hotels HTML', () => {
      const html = `
        <a href="https://www.jobs-continentalhotels.ro/ro/job-details/114-asistent">
          <h3 class="job-listing-title">Asistent Vânzări Hotel</h3>
          <div class="job-listing-footer">Continental Forum Sibiu 4*</div>
        </a>
        <a href="/ro/job-details/74-bucatar">
          <h3 class="job-listing-title">Bucătar</h3>
          <div class="job-listing-footer">Continental Drobeta Turnu Severin 3*</div>
        </a>
      `;
      
      const result = index.parseJobs(html);
      
      expect(result.length).toBe(2);
      expect(result[0].title).toBe('Asistent Vânzări Hotel');
      expect(result[0].url).toBe('https://www.jobs-continentalhotels.ro/ro/job-details/114-asistent');
      expect(result[0].location).toEqual(['Sibiu']);
      expect(result[1].title).toBe('Bucătar');
      expect(result[1].location).toEqual(['Drobeta-Turnu Severin']);
    });

    it('should handle empty job listings', () => {
      const html = '<div>No jobs</div>';
      const result = index.parseJobs(html);
      expect(result.length).toBe(0);
    });

    it('should skip entries without title or link', () => {
      const html = `
        <a href="/ro/job-details/1">
          <h3 class="job-listing-title">Valid Job</h3>
          <div class="job-listing-footer">Sibiu 3*</div>
        </a>
        <a href="/ro/job-details/2">
          <div class="job-listing-footer">No title here</div>
        </a>
        <div>
          <h3 class="job-listing-title">No link here</h3>
        </div>
      `;
      
      const result = index.parseJobs(html);
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Valid Job');
    });
  });

  describe('mapToJobModel', () => {
    it('should map raw job to job model format', () => {
      const rawJob = {
        url: 'https://www.jobs-continentalhotels.ro/ro/job-details/1',
        title: 'Test Job',
        location: ['Sibiu'],
        workmode: 'on-site'
      };
      
      const result = index.mapToJobModel(rawJob, '1559737', 'CONTINENTAL HOTELS SA');
      
      expect(result.url).toBe(rawJob.url);
      expect(result.title).toBe(rawJob.title);
      expect(result.company).toBe('CONTINENTAL HOTELS SA');
      expect(result.cif).toBe('1559737');
      expect(result.location).toEqual(rawJob.location);
      expect(result.workmode).toBe(rawJob.workmode);
      expect(result.status).toBe('scraped');
    });

    it('should use defaults for missing fields', () => {
      const rawJob = {
        url: 'https://www.jobs-continentalhotels.ro/ro/job-details/1',
        title: 'Test Job'
      };
      
      const result = index.mapToJobModel(rawJob, '1559737');
      
      expect(result.location).toEqual([]);
      expect(result.country).toBe('România');
      expect(result.workmode).toBe('on-site');
    });
  });

  describe('transformJobsForSOLR', () => {
    it('should normalize workmode values', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', workmode: 'Remote' },
          { url: 'https://test.com/2', title: 'Job 2', workmode: 'ON-SITE' },
          { url: 'https://test.com/3', title: 'Job 3', workmode: 'Hybrid' }
        ]
      };
      
      const result = index.transformJobsForSOLR(payload);
      
      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
    });

    it('should keep company uppercase', () => {
      const payload = {
        company: 'continental hotels sa',
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', company: 'continental hotels sa' }
        ]
      };
      
      const result = index.transformJobsForSOLR(payload);
      
      expect(result.company).toBe('CONTINENTAL HOTELS SA');
    });

    it('should set location default when empty', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', location: [] }
        ]
      };
      
      const result = index.transformJobsForSOLR(payload);
      
      expect(result.jobs[0].location).toEqual(['România']);
    });
  });
});
