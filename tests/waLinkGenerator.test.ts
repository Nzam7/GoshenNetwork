import { cleanPhoneNumber, generateWaLink, buildProviderWaMessage } from '../src/services/waLinkGenerator';

describe('waLinkGenerator', () => {
  test('cleanPhoneNumber strips formatting characters', () => {
    expect(cleanPhoneNumber('+1 (555) 123-4567')).toBe('15551234567');
    expect(cleanPhoneNumber('1-555-987-6543')).toBe('15559876543');
  });

  test('generateWaLink generates standard wa.me link without text', () => {
    const link = generateWaLink('+1 555 123 4567');
    expect(link).toBe('https://wa.me/15551234567');
  });

  test('generateWaLink generates wa.me link with URL-encoded prefilled message', () => {
    const message = buildProviderWaMessage('John Doe', 'Grace Plumbing');
    const link = generateWaLink('+1 555 123 4567', message);
    expect(link).toContain('https://wa.me/15551234567?text=');
    expect(link).toContain('Hi%20John%20Doe');
    expect(link).toContain('Grace%20Plumbing');
  });
});
