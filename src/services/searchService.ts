import { Provider, CategorySummary } from '../models/provider';
import { CsvProviderAdapter } from '../data/csvProviderAdapter';
import { GoogleSheetsProviderAdapter } from '../data/googleSheetsAdapter';

export interface DataProviderInterface {
  getCategories(): CategorySummary[] | Promise<CategorySummary[]>;
  getProvidersByCategory(category: string): Provider[] | Promise<Provider[]>;
  searchProviders(keyword: string): Provider[] | Promise<Provider[]>;
}

export class SearchService {
  private dataProvider: DataProviderInterface;

  constructor(dataProvider: DataProviderInterface) {
    this.dataProvider = dataProvider;
  }

  public async getCategories(): Promise<CategorySummary[]> {
    return await this.dataProvider.getCategories();
  }

  public async getProvidersByCategory(categoryName: string): Promise<Provider[]> {
    return await this.dataProvider.getProvidersByCategory(categoryName);
  }

  public async search(query: string): Promise<{ type: 'category' | 'keyword' | 'numeric' | 'none'; results: Provider[]; categoryName?: string }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { type: 'none', results: [] };
    }

    const categories = await this.getCategories();

    // Check if input is a numeric category selection (1, 2, 3...)
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 1 && num <= categories.length) {
      const selectedCategory = categories[num - 1].name;
      const results = await this.getProvidersByCategory(selectedCategory);
      return {
        type: 'numeric',
        categoryName: selectedCategory,
        results,
      };
    }

    // Direct category match check
    const exactCat = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exactCat) {
      const results = await this.getProvidersByCategory(exactCat.name);
      return {
        type: 'category',
        categoryName: exactCat.name,
        results,
      };
    }

    // Keyword search fallback
    const keywordResults = await this.dataProvider.searchProviders(trimmed);
    if (keywordResults.length > 0) {
      return {
        type: 'keyword',
        results: keywordResults,
      };
    }

    return { type: 'none', results: [] };
  }
}
