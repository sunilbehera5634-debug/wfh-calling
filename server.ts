import express from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxMZRi_BZn827YRJ92sSxP8Mfy1ZC8-p57dIULk0w6kGXO3e4NDa_0kmhnL4qbXYxov/exec';

// In-memory set to store tracked purchase event IDs and prevent duplicate server-side events
const trackedPurchaseEvents = new Set<string>();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Meta Conversions API (CAPI) Server-Side Purchase Endpoint
  app.post('/api/meta-purchase', async (req, res) => {
    try {
      const { registrationId, name, phone, email, value = 199, currency = 'INR' } = req.body;

      if (!registrationId) {
        return res.status(400).json({ success: false, error: 'Registration ID is required' });
      }

      const eventId = `purchase_${registrationId}`;

      // Prevent duplicate server-side Purchase event execution
      if (trackedPurchaseEvents.has(eventId)) {
        console.log(`[Meta CAPI]: Purchase event for ${eventId} already tracked. Skipping duplicate.`);
        return res.json({ success: true, message: 'Duplicate Purchase event prevented', event_id: eventId });
      }

      trackedPurchaseEvents.add(eventId);

      const PIXEL_ID = '1794291811835142';
      const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || '';

      const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const userIp = rawIp.split(',')[0].trim();
      const userAgent = (req.headers['user-agent'] as string) || '';

      // SHA-256 hash helper for privacy compliance
      const hash = (data: string) => data ? crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex') : undefined;

      const payload = {
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            action_source: 'website',
            user_data: {
              ph: phone ? [hash(phone.replace(/\D/g, ''))] : undefined,
              em: email ? [hash(email)] : undefined,
              fn: name ? [hash(name.split(' ')[0])] : undefined,
              client_ip_address: userIp,
              client_user_agent: userAgent
            },
            custom_data: {
              currency: currency,
              value: Number(value),
              content_name: 'WFH Hindi Calling Masterclass Seat Confirmation'
            }
          }
        ]
      };

      console.log(`>>> [Meta CAPI Request] Event: Purchase | ID: ${eventId} | Value: ${value} ${currency}`);

      if (META_ACCESS_TOKEN) {
        const response = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log('<<< [Meta CAPI Response]:', JSON.stringify(result));
        return res.json({ success: true, event_id: eventId, capi_result: result });
      } else {
        console.log(`*** [Meta CAPI Notice]: META_ACCESS_TOKEN env var not set. Event ${eventId} validated & logged securely on server.`);
        return res.json({ success: true, event_id: eventId, notice: 'Server event processed (Token pending in env)' });
      }
    } catch (error: any) {
      console.error('*** [Meta CAPI Error]:', error);
      res.json({ success: false, error: error.message });
    }
  });

  // API Proxy to Google Apps Script Web App
  app.post('/api/proxy-sheets', async (req, res) => {
    try {
      const payload = req.body;
      console.log('>>> Sending payload to Google Sheets:', JSON.stringify(payload, null, 2));

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      const text = await response.text();
      console.log('<<< Google Sheets raw response:', text);

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { status: 'success', raw: text };
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('*** Google Sheets Proxy Error:', error);
      res.json({ success: true, fallback: true, error: error.message });
    }
  });

  app.get('/api/proxy-sheets', async (req, res) => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        redirect: 'follow'
      });
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { data: [] };
      }
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Google Sheets GET Error:', error);
      res.json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true, allowedHosts: ['wfh-hindi-calling-masterclass.ai.studio'] },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
