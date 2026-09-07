import request from 'supertest';
import { app } from '../src/index';

describe('Webhook API Endpoint Integrations', () => {
  test('GET /health returns 200 OK with server status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.service).toBe('Goshen Network WhatsApp Concierge');
  });

  test('GET /webhook verifies Meta token challenge successfully', async () => {
    const res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'goshen_verify_token',
        'hub.challenge': 'CHALLENGE_12345',
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('CHALLENGE_12345');
  });

  test('GET /webhook returns 403 on invalid verify token', async () => {
    const res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'CHALLENGE_12345',
      });

    expect(res.status).toBe(403);
  });

  test('POST /webhook accepts Meta WhatsApp incoming message payload', async () => {
    const sampleMetaPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550001111',
                  phone_number_id: '123456789',
                },
                messages: [
                  {
                    from: '15559998888',
                    id: 'wamid.HBgLMTU1NTk5OTg4ODgVAgASGBQzQTFF',
                    timestamp: '1690000000',
                    text: {
                      body: 'plumber',
                    },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const res = await request(app)
      .post('/webhook')
      .send(sampleMetaPayload);

    expect(res.status).toBe(200);
    expect(res.text).toBe('EVENT_RECEIVED');
  });
});
