import readline from 'readline';
import { CsvProviderAdapter } from './data/csvProviderAdapter';
import { GoogleSheetsProviderAdapter } from './data/googleSheetsAdapter';
import { SearchService } from './services/searchService';
import { MenuService } from './services/menuService';

const googleSheetUrl = process.env.GOOGLE_SHEETS_URL;
const adapter = googleSheetUrl
  ? new GoogleSheetsProviderAdapter(googleSheetUrl)
  : new CsvProviderAdapter();

const searchService = new SearchService(adapter);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(`
=====================================================
         GOSHEN NETWORK - WHATSAPP BOT SIMULATOR       
=====================================================
Simulating WhatsApp incoming text messages.
Type 'exit' to quit simulator.
`);

async function showWelcome() {
  const categories = await searchService.getCategories();
  const menuText = MenuService.buildMainMenu(categories);
  console.log('\n--- BOT OUTBOUND MESSAGE ---');
  console.log(menuText);
  console.log('----------------------------\n');
}

async function promptUser() {
  rl.question('You (WhatsApp User): ', async (userInput) => {
    const trimmed = userInput.trim();

    if (trimmed.toLowerCase() === 'exit') {
      console.log('Exiting simulator. Goodbye!');
      rl.close();
      return;
    }

    if (
      trimmed.toLowerCase() === 'menu' ||
      trimmed.toLowerCase() === 'hi' ||
      trimmed.toLowerCase() === 'hello' ||
      trimmed.toLowerCase() === '0'
    ) {
      await showWelcome();
      promptUser();
      return;
    }

    const searchResult = await searchService.search(trimmed);

    console.log('\n--- BOT OUTBOUND MESSAGE ---');
    if (searchResult.results.length === 0) {
      console.log(`❌ No matching service providers found for "${trimmed}".`);
      console.log('Type *MENU* to view main categories or try another keyword like "plumber" or "lawyer".');
    } else {
      const header = searchResult.categoryName
        ? `${searchResult.categoryName} Providers`
        : `Search Results for "${trimmed}"`;

      const responseCards = MenuService.buildProviderCards(header, searchResult.results);
      console.log(responseCards);
    }
    console.log('----------------------------\n');

    promptUser();
  });
}

(async () => {
  await showWelcome();
  promptUser();
})();
