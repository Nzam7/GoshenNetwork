/**
 * Formats phone numbers and generates direct WhatsApp wa.me links with pre-filled text messages.
 */

export function cleanPhoneNumber(phoneNumber: string): string {
  // Strip all non-numeric characters (retaining country code digits)
  return phoneNumber.replace(/\D/g, '');
}

export function generateWaLink(phoneNumber: string, prefilledMessage?: string): string {
  const digitsOnly = cleanPhoneNumber(phoneNumber);
  if (!digitsOnly) {
    return '';
  }

  const baseUrl = `https://wa.me/${digitsOnly}`;
  if (!prefilledMessage) {
    return baseUrl;
  }

  const encodedText = encodeURIComponent(prefilledMessage);
  return `${baseUrl}?text=${encodedText}`;
}

export function buildProviderWaMessage(ownerName: string, businessName: string): string {
  return `Hi ${ownerName}, I found your listing for "${businessName}" on Goshen Network and would like to ask for a quote!`;
}
