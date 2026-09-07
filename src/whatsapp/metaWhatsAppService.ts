import http from 'http';
import https from 'https';

export interface MetaOutgoingMessagePayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text' | 'interactive';
  text?: {
    preview_url?: boolean;
    body: string;
  };
  interactive?: any;
}

export class MetaWhatsAppService {
  private token: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor() {
    this.token = process.env.WHATSAPP_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';
  }

  /**
   * Constructs payload for a plain text WhatsApp message.
   */
  public createTextMessage(to: string, bodyText: string): MetaOutgoingMessagePayload {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: true,
        body: bodyText,
      },
    };
  }

  /**
   * Constructs payload for an interactive button reply message.
   */
  public createButtonMessage(to: string, bodyText: string, buttons: { id: string; title: string }[]): MetaOutgoingMessagePayload {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        action: {
          buttons: buttons.map((b) => ({
            type: 'reply',
            reply: {
              id: b.id,
              title: b.title.substring(0, 20), // WhatsApp max button title length is 20 chars
            },
          })),
        },
      },
    };
  }

  /**
   * Sends payload via Meta Graph API or logs if in mock/test mode.
   */
  public async sendMessage(payload: MetaOutgoingMessagePayload): Promise<{ success: boolean; data?: any; error?: any }> {
    // If running in mock / test environment, log and return success mock
    if (!this.token || this.token === 'mock_token' || !this.phoneNumberId) {
      console.log(`[MetaWhatsAppService MOCK] Sending outbound message to ${payload.to}:`);
      console.log(JSON.stringify(payload, null, 2));
      return { success: true, data: { mock: true, message_id: `wamid.mock.${Date.now()}` } };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const postData = JSON.stringify(payload);

    return new Promise((resolve) => {
      const req = https.request(
        url,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          let responseBody = '';
          res.on('data', (chunk) => (responseBody += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(responseBody);
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ success: true, data: json });
              } else {
                resolve({ success: false, error: json });
              }
            } catch (err) {
              resolve({ success: false, error: responseBody });
            }
          });
        }
      );

      req.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      req.write(postData);
      req.end();
    });
  }
}
