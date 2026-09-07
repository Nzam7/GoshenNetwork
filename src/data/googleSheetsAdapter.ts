import https from 'https';
import http from 'http';
import { parse } from 'csv-parse/sync';
import { Provider, CategorySummary } from '../models/provider';
import { CsvProviderAdapter } from './csvProviderAdapter';

export class GoogleSheetsProviderAdapter {
  private sheetUrl: string;
  private fallbackAdapter: CsvProviderAdapter;
  private cachedProviders: Provider[] = [];
  private lastFetchTime: number = 0;
  private cacheTtlMs: number;

  constructor(sheetUrl?: string, fallbackCsvPath?: string, cacheTtlMinutes: number = 5) {
    this.sheetUrl = sheetUrl || process.env.GOOGLE_SHEETS_URL || '';
    this.fallbackAdapter = new CsvProviderAdapter(fallbackCsvPath);
    this.cacheTtlMs = cacheTtlMinutes * 60 * 1000;
  }

  /**
   * Parses Google Sheet ID from full Google Sheets URL if needed.
   */
  public static convertSheetUrlToCsvExportUrl(url: string): string {
    if (!url) return '';
    // If it's already a direct CSV export link
    if (url.includes('/export?format=csv')) return url;

    // Extract Spreadsheet ID from standard Google Sheets URL format
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }

    return url;
  }

  /**
   * Fetches CSV data from Google Sheets HTTP endpoint.
   */
  public async fetchRemoteCsv(csvUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = csvUrl.startsWith('https') ? https : http;
      
      const req = client.get(csvUrl, (res) => {
        // Handle HTTP redirects (301, 302, 307)
        if (res.statusCode && [301, 302, 307].includes(res.statusCode) && res.headers.location) {
          return resolve(this.fetchRemoteCsv(res.headers.location));
        }

        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          return reject(new Error(`HTTP status ${res.statusCode}`));
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Google Sheets request timeout'));
      });
    });
  }

  /**
   * Refreshes cached providers from Google Sheets or falls back to local CSV.
   */
  public async loadProviders(): Promise<Provider[]> {
    const now = Date.now();
    if (this.cachedProviders.length > 0 && now - this.lastFetchTime < this.cacheTtlMs) {
      return this.cachedProviders;
    }

    const csvExportUrl = GoogleSheetsProviderAdapter.convertSheetUrlToCsvExportUrl(this.sheetUrl);

    if (csvExportUrl) {
      try {
        const rawCsv = await this.fetchRemoteCsv(csvExportUrl);
        const records = parse(rawCsv, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });

        this.cachedProviders = records.map((record: any) => ({
          id: record.id || `PROV-${Math.random().toString(36).substr(2, 6)}`,
          businessName: record.business_name || record['Business Name'] || '',
          ownerName: record.owner_name || record['Owner Name'] || '',
          category: record.category || record['Category'] || 'General',
          subcategories: (record.subcategories || record['Subcategories'] || '')
            .split(',')
            .map((s: string) => s.trim().toLowerCase())
            .filter(Boolean),
          phoneNumber: record.phone_number || record['Phone Number'] || '',
          description: record.description || record['Description'] || '',
          active: String(record.active || record['Active']).toLowerCase() === 'true',
        })).filter((p: Provider) => p.businessName && p.phoneNumber);

        this.lastFetchTime = now;
        console.log(`[GoogleSheetsProviderAdapter] Successfully fetched ${this.cachedProviders.length} providers from Google Sheets.`);
        return this.cachedProviders;
      } catch (err: any) {
        console.warn(`[GoogleSheetsProviderAdapter] Remote fetch failed (${err.message}). Falling back to local CSV.`);
      }
    }

    // Fallback to local CSV provider
    this.cachedProviders = this.fallbackAdapter.getAllProviders();
    this.lastFetchTime = now;
    return this.cachedProviders;
  }

  public async getAllProviders(): Promise<Provider[]> {
    const providers = await this.loadProviders();
    return providers.filter((p) => p.active);
  }

  public async getCategories(): Promise<CategorySummary[]> {
    const providers = await this.getAllProviders();
    const categoryMap: Map<string, number> = new Map();

    for (const provider of providers) {
      const currentCount = categoryMap.get(provider.category) || 0;
      categoryMap.set(provider.category, currentCount + 1);
    }

    const result: CategorySummary[] = [];
    categoryMap.forEach((count, name) => {
      result.push({ name, count });
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getProvidersByCategory(categoryName: string): Promise<Provider[]> {
    const providers = await this.getAllProviders();
    const lowerCategory = categoryName.trim().toLowerCase();
    return providers.filter((p) => p.category.toLowerCase() === lowerCategory);
  }

  public async searchProviders(keyword: string): Promise<Provider[]> {
    const term = keyword.trim().toLowerCase();
    if (!term) return [];

    const providers = await this.getAllProviders();
    return providers.filter((p) => {
      const matchBusiness = p.businessName.toLowerCase().includes(term);
      const matchOwner = p.ownerName.toLowerCase().includes(term);
      const matchCategory = p.category.toLowerCase().includes(term);
      const matchDescription = p.description.toLowerCase().includes(term);
      const matchSubcategory = p.subcategories.some((sub) => sub.includes(term));

      return matchBusiness || matchOwner || matchCategory || matchDescription || matchSubcategory;
    });
  }
}
