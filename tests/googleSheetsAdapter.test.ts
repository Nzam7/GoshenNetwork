import path from 'path';
import { GoogleSheetsProviderAdapter } from '../src/data/googleSheetsAdapter';

describe('GoogleSheetsProviderAdapter', () => {
  const localCsvPath = path.join(process.cwd(), 'data', 'providers.csv');

  test('convertSheetUrlToCsvExportUrl converts standard Google Sheet URL to export link', () => {
    const rawUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0';
    const csvExport = GoogleSheetsProviderAdapter.convertSheetUrlToCsvExportUrl(rawUrl);
    expect(csvExport).toBe('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv');
  });

  test('falls back to local CSV when sheet URL is invalid or offline', async () => {
    const adapter = new GoogleSheetsProviderAdapter('invalid_url', localCsvPath);
    const providers = await adapter.getAllProviders();
    expect(providers.length).toBeGreaterThan(0);
    expect(providers.some((p) => p.businessName === 'Grace Plumbing & Heating')).toBe(true);
  });

  test('fetches categories asynchronously', async () => {
    const adapter = new GoogleSheetsProviderAdapter('', localCsvPath);
    const categories = await adapter.getCategories();
    expect(categories.length).toBeGreaterThan(0);
  });

  test('searches providers asynchronously', async () => {
    const adapter = new GoogleSheetsProviderAdapter('', localCsvPath);
    const results = await adapter.searchProviders('plumber');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].businessName).toBe('Grace Plumbing & Heating');
  });
});
