import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { Provider, CategorySummary } from '../models/provider';

export class CsvProviderAdapter {
  private csvFilePath: string;
  private providers: Provider[] = [];

  constructor(filePath?: string) {
    this.csvFilePath = filePath || path.join(process.cwd(), 'data', 'providers.csv');
    this.loadData();
  }

  public loadData(): void {
    if (!fs.existsSync(this.csvFilePath)) {
      this.providers = [];
      return;
    }

    const fileContent = fs.readFileSync(this.csvFilePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    this.providers = records.map((record: any) => ({
      id: record.id,
      businessName: record.business_name,
      ownerName: record.owner_name,
      category: record.category,
      subcategories: record.subcategories
        ? record.subcategories.split(',').map((s: string) => s.trim().toLowerCase())
        : [],
      phoneNumber: record.phone_number,
      description: record.description,
      active: record.active === 'true' || record.active === true,
    }));
  }

  public getAllProviders(): Provider[] {
    return this.providers.filter((p) => p.active);
  }

  public getCategories(): CategorySummary[] {
    const activeProviders = this.getAllProviders();
    const categoryMap: Map<string, number> = new Map();

    for (const provider of activeProviders) {
      const currentCount = categoryMap.get(provider.category) || 0;
      categoryMap.set(provider.category, currentCount + 1);
    }

    const result: CategorySummary[] = [];
    categoryMap.forEach((count, name) => {
      result.push({ name, count });
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  public getProvidersByCategory(categoryName: string): Provider[] {
    const lowerCategory = categoryName.trim().toLowerCase();
    return this.getAllProviders().filter(
      (p) => p.category.toLowerCase() === lowerCategory
    );
  }

  public searchProviders(keyword: string): Provider[] {
    const term = keyword.trim().toLowerCase();
    if (!term) return [];

    return this.getAllProviders().filter((p) => {
      const matchBusiness = p.businessName.toLowerCase().includes(term);
      const matchOwner = p.ownerName.toLowerCase().includes(term);
      const matchCategory = p.category.toLowerCase().includes(term);
      const matchDescription = p.description.toLowerCase().includes(term);
      const matchSubcategory = p.subcategories.some((sub) => sub.includes(term));

      return matchBusiness || matchOwner || matchCategory || matchDescription || matchSubcategory;
    });
  }
}
