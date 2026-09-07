import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { CsvProviderAdapter } from './data/csvProviderAdapter';
import { GoogleSheetsProviderAdapter } from './data/googleSheetsAdapter';
import { SqliteProviderAdapter } from './data/sqliteProviderAdapter';
import { SearchService } from './services/searchService';
import { SessionManager } from './services/sessionManager';
import { MetaWhatsAppService } from './whatsapp/metaWhatsAppService';
import { BotController } from './bot/botController';
import { createWebhookRouter } from './routes/webhook';
import { createAdminRouter } from './routes/admin';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dependency Injection Initialization
const googleSheetUrl = process.env.GOOGLE_SHEETS_URL;
const csvPath = process.env.DATA_SOURCE_PATH || path.join(process.cwd(), 'data', 'providers.csv');
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'goshen.sqlite');

const sqliteAdapter = new SqliteProviderAdapter(dbPath);

// Select active data adapter: Google Sheets (if set), Sqlite (default database), or CSV
const dataAdapter = googleSheetUrl
  ? new GoogleSheetsProviderAdapter(googleSheetUrl, csvPath)
  : sqliteAdapter;

const searchService = new SearchService(dataAdapter);
const sessionManager = new SessionManager(15); // 15-min session expiry
const whatsappService = new MetaWhatsAppService();
const botController = new BotController(searchService, sessionManager, whatsappService);

// Routes
app.get('/health', async (req, res) => {
  try {
    const categories = await searchService.getCategories();
    res.json({
      status: 'online',
      service: 'Goshen Network WhatsApp Concierge',
      mode: googleSheetUrl ? 'Google Sheets Sync' : 'SQLite Relational Database',
      timestamp: new Date().toISOString(),
      categoriesCount: categories.length,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Webhook & Admin Portal Routers
app.use('/webhook', createWebhookRouter(botController));
app.use('/admin', createAdminRouter(sqliteAdapter));

// Server Startup
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`
=====================================================
  GOSHEN NETWORK WHATSAPP CONCIERGE SERVER ONLINE
=====================================================
Server running on port: ${PORT}
Data Source Mode: ${googleSheetUrl ? 'Google Sheets Live Sync' : 'SQLite Database'}
WhatsApp Webhook: http://localhost:${PORT}/webhook
Church Admin Portal: http://localhost:${PORT}/admin
Health Check: http://localhost:${PORT}/health
=====================================================
`);
  });
}

export { app, botController, sqliteAdapter };
