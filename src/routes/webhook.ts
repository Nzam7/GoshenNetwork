import { Router, Request, Response } from 'express';
import { BotController } from '../bot/botController';

export function createWebhookRouter(botController: BotController): Router {
  const router = Router();
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'goshen_verify_token';

  /**
   * GET /webhook - Meta WhatsApp Webhook Verification Endpoint
   */
  router.get('/', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[Webhook GET] Webhook verification successful!');
      return res.status(200).send(challenge);
    } else {
      console.warn('[Webhook GET] Verification failed. Token mismatch.');
      return res.sendStatus(403);
    }
  });

  /**
   * POST /webhook - Meta WhatsApp Incoming Message Event Webhook
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const body = req.body;

      // Check if this is an event from a WhatsApp API subscription
      if (body.object === 'whatsapp_business_account' || body.entry) {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            const value = change.value;
            if (value && value.messages && value.messages.length > 0) {
              const incomingMsg = value.messages[0];
              const senderPhone = incomingMsg.from; // Sender's phone number

              let messageText = '';
              if (incomingMsg.type === 'text' && incomingMsg.text) {
                messageText = incomingMsg.text.body;
              } else if (incomingMsg.type === 'interactive') {
                if (incomingMsg.interactive.type === 'button_reply') {
                  messageText = incomingMsg.interactive.button_reply.id;
                } else if (incomingMsg.interactive.type === 'list_reply') {
                  messageText = incomingMsg.interactive.list_reply.id;
                }
              }

              if (senderPhone && messageText) {
                console.log(`[Webhook POST] Message from ${senderPhone}: "${messageText}"`);
                // Process asynchronously but respond 200 OK immediately to WhatsApp server
                botController.handleIncomingMessage(senderPhone, messageText).catch((err) => {
                  console.error('[Webhook Error] Error handling message:', err);
                });
              }
            }
          }
        }
        return res.status(200).send('EVENT_RECEIVED');
      }

      // If payload structure doesn't match WhatsApp event, still return 200/404 safely
      return res.sendStatus(404);
    } catch (error) {
      console.error('[Webhook POST Exception]', error);
      return res.status(500).send('INTERNAL_SERVER_ERROR');
    }
  });

  return router;
}
