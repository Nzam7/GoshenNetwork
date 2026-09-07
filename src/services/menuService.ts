import { CategorySummary, Provider } from '../models/provider';
import { generateWaLink, buildProviderWaMessage } from './waLinkGenerator';

export class MenuService {
  /**
   * Generates the initial main greeting and category selection menu.
   */
  public static buildMainMenu(categories: CategorySummary[]): string {
    let message = `🤝 *Welcome to Goshen Network!*\n`;
    message += `*Your Church Community Service Hub*\n\n`;
    message += `Find and hire trusted professionals from our congregation.\n\n`;
    message += `📋 *Select a Category (Reply with number):*\n`;

    categories.forEach((cat, index) => {
      const emoji = this.getCategoryEmoji(cat.name);
      message += `${index + 1}️⃣ ${emoji} ${cat.name} (${cat.count})\n`;
    });

    message += `\n🔍 *Or type any keyword* (e.g., _plumber_, _tutor_, _legal_)\n`;
    message += `ℹ️ Type *MENU* anytime to return here.`;

    return message;
  }

  /**
   * Formats a list of provider business cards with direct wa.me links.
   */
  public static buildProviderCards(titleHeader: string, providers: Provider[]): string {
    if (providers.length === 0) {
      return `❌ *No listings found.*\n\nReply *MENU* to view available categories or search another keyword.`;
    }

    let message = `📌 *${titleHeader}*\n`;
    message += `Found ${providers.length} provider(s) in our church directory:\n\n`;

    providers.forEach((p, idx) => {
      const prefilledMessage = buildProviderWaMessage(p.ownerName, p.businessName);
      const waLink = generateWaLink(p.phoneNumber, prefilledMessage);
      const icon = this.getCategoryEmoji(p.category);

      message += `${idx + 1}. ${icon} *${p.businessName}*\n`;
      message += `   👤 *Owner:* ${p.ownerName}\n`;
      message += `   📝 *Services:* ${p.description}\n`;
      message += `   💬 *Contact via WhatsApp:*\n   👉 ${waLink}\n\n`;
    });

    message += `───────────────\n`;
    message += `Reply *MENU* to return to main options.`;

    return message;
  }

  private static getCategoryEmoji(categoryName: string): string {
    const lower = categoryName.toLowerCase();
    if (lower.includes('repair') || lower.includes('home') || lower.includes('maintenance')) return '🔧';
    if (lower.includes('legal') || lower.includes('professional')) return '⚖️';
    if (lower.includes('health') || lower.includes('wellness')) return '🩺';
    if (lower.includes('education') || lower.includes('tutor')) return '📚';
    if (lower.includes('event') || lower.includes('cater')) return '🎂';
    return '💼';
  }
}
