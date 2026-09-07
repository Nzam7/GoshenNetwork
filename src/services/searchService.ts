import { CsvProviderAdapter } from '../data/csvProviderAdapter';
import { Provider, CategorySummary } from '../models/provider';

export class SearchService {
  private dataAdapter: CsvProviderAdapter;

  constructor(dataAdapter: CsvProviderAdapter) {
    this.dataAdapter = dataAdapter;
  }

  public getCategories(): CategorySummary[] {
    return this.dataAdapter.getCategories();
  }

  public getProvidersByCategory(categoryName: string): Provider[] {
    return this.dataAdapter.getProvidersByCategory(categoryName);
  }

  public search(query: string): { type: 'category' | 'keyword' | 'numeric' | 'none'; results: Provider[]; categoryName?: string } {
    const trimmed = query.trim();
    if (!trimmed) {
      return { type: 'none', results: [] };
    }

    // Check if input is a numeric category selection (1, 2, 3...)
    const num = parseInt(trimmed, 10);
    const categories = this.getCategories();

    if (!isNaN(num) && num >= 1 && num <= categories.length) {
      const selectedCategory = categories[num - 1].name;
      const results = this.getProvidersByCategory(selectedCategory);
      return {
        type: 'numeric',
        categoryName: selectedCategory,
        results,
      };
    }

    // Direct category match check
    const exactCat = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exactCat) {
      return {
        type: 'category',
        categoryName: exactCat.name,
        results: this.getProvidersByCategory(exactCat.name),
      };
    }

    // Keyword search fallback
    const keywordResults = this.dataAdapter.searchProviders(trimmed);
    if (keywordResults.length > 0) {
      return {
        type: 'keyword',
        results: keywordResults,
      };
    }

    return { type: 'none', results: [] };
  }
}
