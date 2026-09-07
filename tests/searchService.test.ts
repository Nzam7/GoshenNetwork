import path from 'path';
import { CsvProviderAdapter } from '../src/data/csvProviderAdapter';
import { SearchService } from '../src/services/searchService';

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    const csvPath = path.join(process.cwd(), 'data', 'providers.csv');
    const adapter = new CsvProviderAdapter(csvPath);
    searchService = new SearchService(adapter);
  });

  test('handles numeric menu selection', () => {
    const result = searchService.search('1');
    expect(result.type).toBe('numeric');
    expect(result.results.length).toBeGreaterThan(0);
  });

  test('handles keyword search for terms like "lawyer"', () => {
    const result = searchService.search('lawyer');
    expect(result.type).toBe('keyword');
    expect(result.results.some((p) => p.businessName === 'Shepherds Legal Services')).toBe(true);
  });

  test('returns type "none" for non-matching queries', () => {
    const result = searchService.search('astronaut');
    expect(result.type).toBe('none');
    expect(result.results.length).toBe(0);
  });
});
