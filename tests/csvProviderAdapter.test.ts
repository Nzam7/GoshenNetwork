import path from 'path';
import { CsvProviderAdapter } from '../src/data/csvProviderAdapter';

describe('CsvProviderAdapter', () => {
  const sampleCsvPath = path.join(process.cwd(), 'data', 'providers.csv');
  let adapter: CsvProviderAdapter;

  beforeEach(() => {
    adapter = new CsvProviderAdapter(sampleCsvPath);
  });

  test('loads active providers successfully', () => {
    const providers = adapter.getAllProviders();
    expect(providers.length).toBeGreaterThan(0);
    expect(providers.every((p) => p.active)).toBe(true);
  });

  test('returns unique category summaries', () => {
    const categories = adapter.getCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((c) => c.name === 'Home Repairs & Maintenance')).toBe(true);
  });

  test('filters providers by category', () => {
    const homeRepairs = adapter.getProvidersByCategory('Home Repairs & Maintenance');
    expect(homeRepairs.length).toBeGreaterThanOrEqual(2);
    expect(homeRepairs.some((p) => p.businessName === 'Grace Plumbing & Heating')).toBe(true);
  });

  test('searches providers by keyword in business name or subcategories', () => {
    const plumberResults = adapter.searchProviders('plumber');
    expect(plumberResults.length).toBeGreaterThan(0);
    expect(plumberResults[0].businessName).toBe('Grace Plumbing & Heating');
  });
});
