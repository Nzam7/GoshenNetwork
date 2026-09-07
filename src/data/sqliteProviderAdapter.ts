import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { Provider, CategorySummary } from '../models/provider';
import { CsvProviderAdapter } from './csvProviderAdapter';

export class SqliteProviderAdapter {
  private db: sqlite3.Database;

  constructor(dbPath?: string) {
    const finalPath = dbPath || process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'goshen.sqlite');
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new sqlite3.Database(finalPath);
    this.initDatabase();
  }

  private initDatabase(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        business_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategories TEXT,
        phone_number TEXT NOT NULL,
        description TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    this.db.run(sql, (err) => {
      if (err) {
        console.error('[SqliteProviderAdapter] Init table error:', err.message);
      } else {
        this.seedIfEmpty();
      }
    });
  }

  private seedIfEmpty(): void {
    this.db.get('SELECT COUNT(*) as count FROM providers', (err, row: any) => {
      if (!err && row && row.count === 0) {
        console.log('[SqliteProviderAdapter] Database empty. Seeding initial data from CSV...');
        const csvAdapter = new CsvProviderAdapter();
        const providers = csvAdapter.getAllProviders();
        for (const p of providers) {
          this.createProvider(p).catch(() => {});
        }
      }
    });
  }

  public async getAllProviders(includeInactive: boolean = false): Promise<Provider[]> {
    return new Promise((resolve, reject) => {
      const sql = includeInactive
        ? 'SELECT * FROM providers ORDER BY category ASC, business_name ASC'
        : 'SELECT * FROM providers WHERE active = 1 ORDER BY category ASC, business_name ASC';

      this.db.all(sql, [], (err, rows: any[]) => {
        if (err) return reject(err);
        resolve(rows.map(this.mapRowToProvider));
      });
    });
  }

  public async getCategories(): Promise<CategorySummary[]> {
    const providers = await this.getAllProviders(false);
    const categoryMap: Map<string, number> = new Map();

    for (const provider of providers) {
      const count = categoryMap.get(provider.category) || 0;
      categoryMap.set(provider.category, count + 1);
    }

    const result: CategorySummary[] = [];
    categoryMap.forEach((count, name) => {
      result.push({ name, count });
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getProvidersByCategory(categoryName: string): Promise<Provider[]> {
    const providers = await this.getAllProviders(false);
    const lowerCategory = categoryName.trim().toLowerCase();
    return providers.filter((p) => p.category.toLowerCase() === lowerCategory);
  }

  public async searchProviders(keyword: string): Promise<Provider[]> {
    const term = keyword.trim().toLowerCase();
    if (!term) return [];

    const providers = await this.getAllProviders(false);
    return providers.filter((p) => {
      const matchBusiness = p.businessName.toLowerCase().includes(term);
      const matchOwner = p.ownerName.toLowerCase().includes(term);
      const matchCategory = p.category.toLowerCase().includes(term);
      const matchDescription = p.description.toLowerCase().includes(term);
      const matchSubcategory = p.subcategories.some((sub) => sub.includes(term));

      return matchBusiness || matchOwner || matchCategory || matchDescription || matchSubcategory;
    });
  }

  public async getProviderById(id: string): Promise<Provider | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM providers WHERE id = ?', [id], (err, row: any) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(this.mapRowToProvider(row));
      });
    });
  }

  public async createProvider(provider: Partial<Provider>): Promise<Provider> {
    return new Promise((resolve, reject) => {
      const id = provider.id || `PROV-${Date.now().toString(36).toUpperCase()}`;
      const subcategoriesStr = Array.isArray(provider.subcategories)
        ? provider.subcategories.join(', ')
        : provider.subcategories || '';
      const active = provider.active !== undefined ? (provider.active ? 1 : 0) : 1;

      const sql = `
        INSERT OR REPLACE INTO providers (id, business_name, owner_name, category, subcategories, phone_number, description, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          id,
          provider.businessName || '',
          provider.ownerName || '',
          provider.category || 'General',
          subcategoriesStr,
          provider.phoneNumber || '',
          provider.description || '',
          active,
        ],
        function (err) {
          if (err) return reject(err);
          resolve({
            id,
            businessName: provider.businessName || '',
            ownerName: provider.ownerName || '',
            category: provider.category || 'General',
            subcategories: subcategoriesStr.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
            phoneNumber: provider.phoneNumber || '',
            description: provider.description || '',
            active: Boolean(active),
          });
        }
      );
    });
  }

  public async updateProvider(id: string, provider: Partial<Provider>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const subcategoriesStr = Array.isArray(provider.subcategories)
        ? provider.subcategories.join(', ')
        : provider.subcategories || '';
      const active = provider.active !== undefined ? (provider.active ? 1 : 0) : 1;

      const sql = `
        UPDATE providers
        SET business_name = ?, owner_name = ?, category = ?, subcategories = ?, phone_number = ?, description = ?, active = ?
        WHERE id = ?
      `;

      this.db.run(
        sql,
        [
          provider.businessName,
          provider.ownerName,
          provider.category,
          subcategoriesStr,
          provider.phoneNumber,
          provider.description,
          active,
          id,
        ],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  public async toggleProviderActive(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE providers SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?`;
      this.db.run(sql, [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  public async deleteProvider(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM providers WHERE id = ?', [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  private mapRowToProvider(row: any): Provider {
    return {
      id: row.id,
      businessName: row.business_name,
      ownerName: row.owner_name,
      category: row.category,
      subcategories: row.subcategories
        ? row.subcategories.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
        : [],
      phoneNumber: row.phone_number,
      description: row.description || '',
      active: Boolean(row.active),
    };
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
