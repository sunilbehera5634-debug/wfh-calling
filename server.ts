import express from 'express';
import { createServer as createViteServer } from 'vite';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxMZRi_BZn827YRJ92sSxP8Mfy1ZC8-p57dIULk0w6kGXO3e4NDa_0kmhnL4qbXYxov/exec';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

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
