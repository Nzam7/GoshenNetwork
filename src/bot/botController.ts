import { SearchService } from '../services/searchService';
import { MenuService } from '../services/menuService';
import { SessionManager } from '../services/sessionManager';
import { SessionState } from '../models/session';
import { MetaWhatsAppService, MetaOutgoingMessagePayload } from '../whatsapp/metaWhatsAppService';

export class BotController {
  private searchService: SearchService;
  private sessionManager: SessionManager;
  private whatsappService: MetaWhatsAppService;

  constructor(
    searchService: SearchService,
    sessionManager: SessionManager,
    whatsappService: MetaWhatsAppService
  ) {
    this.searchService = searchService;
    this.sessionManager = sessionManager;
    this.whatsappService = whatsappService;
  }

  /**
   * Processes an incoming message from a WhatsApp sender phone number.
   */
  public async handleIncomingMessage(senderPhone: string, messageText: string): Promise<MetaOutgoingMessagePayload> {
    const trimmedInput = messageText.trim();
    const session = this.sessionManager.getSession(senderPhone);

    // Reset command check
    if (
      trimmedInput.toLowerCase() === 'menu' ||
      trimmedInput.toLowerCase() === 'hi' ||
      trimmedInput.toLowerCase() === 'hello' ||
      trimmedInput.toLowerCase() === 'start'
    ) {
      this.sessionManager.updateSession(senderPhone, SessionState.CATEGORY_MENU);
      const categories = this.searchService.getCategories();
      const menuText = MenuService.buildMainMenu(categories);
      const payload = this.whatsappService.createTextMessage(senderPhone, menuText);
      await this.whatsappService.sendMessage(payload);
      return payload;
    }

    // Process search/selection query
    const searchResult = this.searchService.search(trimmedInput);

    let outboundText = '';
    if (searchResult.results.length === 0) {
      outboundText = `❌ *No matching service providers found for "${trimmedInput}".*\n\n` +
        `Reply *MENU* to view available categories or search another keyword (e.g., _plumber_, _tutor_, _lawyer_).`;
      this.sessionManager.updateSession(senderPhone, SessionState.GREETING);
    } else {
      const header = searchResult.categoryName
        ? `${searchResult.categoryName} Providers`
        : `Search Results for "${trimmedInput}"`;

      outboundText = MenuService.buildProviderCards(header, searchResult.results);
      this.sessionManager.updateSession(senderPhone, SessionState.SEARCH_RESULTS, {
        lastCategory: searchResult.categoryName,
        lastKeyword: trimmedInput,
      });
    }

    const payload = this.whatsappService.createTextMessage(senderPhone, outboundText);
    await this.whatsappService.sendMessage(payload);
    return payload;
  }
}
