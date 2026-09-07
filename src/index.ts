import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { CsvProviderAdapter } from './data/csvProviderAdapter';
import { GoogleSheetsProviderAdapter } from './data/googleSheetsAdapter';
import { SearchService } from './services/searchService';
import { SessionManager } from './services/sessionManager';
import { MetaWhatsAppService } from './whatsapp/metaWhatsAppService';
import { BotController } from './bot/botController';
import { createWebhookRouter } from './routes/webhook';

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

const dataAdapter = googleSheetUrl
  ? new GoogleSheetsProviderAdapter(googleSheetUrl, csvPath)
  : new CsvProviderAdapter(csvPath);

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
      mode: googleSheetUrl ? 'Google Sheets Sync' : 'Local CSV Data',
      timestamp: new Date().toISOString(),
      categoriesCount: categories.length,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/webhook', createWebhookRouter(botController));

// Server Startup
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`
=====================================================
  GOSHEN NETWORK WHATSAPP CONCIERGE SERVER ONLINE
=====================================================
Server running on port: ${PORT}
Data Source Mode: ${googleSheetUrl ? 'Google Sheets Live Sync' : 'Local CSV File'}
Webhook URL: http://localhost:${PORT}/webhook
Health check: http://localhost:${PORT}/health
=====================================================
`);
  });
}

export { app, botController };
