import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { CsvProviderAdapter } from './data/csvProviderAdapter';
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
const csvPath = process.env.DATA_SOURCE_PATH || path.join(process.cwd(), 'data', 'providers.csv');
const dataAdapter = new CsvProviderAdapter(csvPath);
const searchService = new SearchService(dataAdapter);
const sessionManager = new SessionManager(15); // 15-min session expiry
const whatsappService = new MetaWhatsAppService();
const botController = new BotController(searchService, sessionManager, whatsappService);

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Goshen Network WhatsApp Concierge',
    timestamp: new Date().toISOString(),
    categories: searchService.getCategories().length,
  });
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
Webhook URL: http://localhost:${PORT}/webhook
Health check: http://localhost:${PORT}/health
=====================================================
`);
  });
}

export { app, botController };
