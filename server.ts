/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketServer } from './src/server/socketHandler';
import { processSendResetCode, processVerifyResetCode } from './src/server/otpHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // REST API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      mode: isProduction ? 'production' : 'development',
      time: new Date().toISOString(),
    });
  });

  // In-memory sync store for Node.js HTTP sync endpoint (matching InfinityFree PHP API)
  let syncEventCounter = 0;
  const syncEventsList: any[] = [];
  let syncStateSnapshot: any = {
    activeTicket: null,
    counters: [],
    queues: [],
    audioSettings: null,
    mediaSettings: null,
    company: null,
    services: null,
    penjagaAccounts: null,
    adminCredentials: null,
    lanSettings: null,
  };

  const handleSyncGet = (req: express.Request, res: express.Response) => {
    const since = parseFloat(String(req.query.since || '0'));
    const lastId = parseInt(String(req.query.last_id || '0'), 10);
    const getState = req.query.get_state === '1' || req.query.get_state === 'true' || since === 0;

    let filteredEvents = syncEventsList;
    if (lastId > 0) {
      filteredEvents = syncEventsList.filter((e) => e.id > lastId);
    } else if (since > 0) {
      filteredEvents = syncEventsList.filter((e) => (e.timestamp || 0) > since);
    }

    res.json({
      status: 'ok',
      syncEngine: 'node_express',
      serverTime: Date.now(),
      lastEventId: syncEventCounter,
      events: filteredEvents,
      ...(getState ? { state: syncStateSnapshot } : {}),
    });
  };

  const handleSyncPost = (req: express.Request, res: express.Response) => {
    const body = req.body || {};
    const now = Date.now();
    const event = body.event || body;

    if (event && event.type) {
      syncEventCounter++;
      const record = { ...event, id: syncEventCounter, timestamp: event.timestamp || now };
      syncEventsList.push(record);
      if (syncEventsList.length > 50) syncEventsList.shift();

      if (event.ticket) syncStateSnapshot.activeTicket = event.ticket;
      if (Array.isArray(event.counters)) syncStateSnapshot.counters = event.counters;
      if (Array.isArray(event.queues)) syncStateSnapshot.queues = event.queues;
      if (event.audioSettings) syncStateSnapshot.audioSettings = event.audioSettings;
      if (event.mediaSettings) syncStateSnapshot.mediaSettings = event.mediaSettings;
      if (event.company) syncStateSnapshot.company = event.company;
      if (Array.isArray(event.services)) syncStateSnapshot.services = event.services;
      if (Array.isArray(event.penjagaAccounts)) syncStateSnapshot.penjagaAccounts = event.penjagaAccounts;
      if (event.adminCredentials) syncStateSnapshot.adminCredentials = event.adminCredentials;
      if (event.lanSettings) syncStateSnapshot.lanSettings = event.lanSettings;

      res.json({
        status: 'ok',
        syncEngine: 'node_express',
        eventId: syncEventCounter,
        serverTime: now,
        event: record,
      });
      return;
    }

    if (body.state) {
      syncStateSnapshot = { ...syncStateSnapshot, ...body.state };
      res.json({ status: 'ok', syncEngine: 'node_express', serverTime: now });
      return;
    }

    res.json({ status: 'ignored' });
  };

  app.get(['/api/sync', '/api/sync.php', '/sync.php'], handleSyncGet);
  app.post(['/api/sync', '/api/sync.php', '/sync.php'], handleSyncPost);

  app.post('/api/auth/send-reset-code', async (req, res) => {
    const result = await processSendResetCode(req.body || {});
    res.status(result.httpStatus).json(result.body);
  });

  app.post('/api/auth/verify-reset-code', async (req, res) => {
    const result = await processVerifyResetCode(req.body || {});
    res.status(result.httpStatus).json(result.body);
  });

  // Production reverse proxy relay for AI TTS APIs to prevent browser CORS blocks
  const ttsProxyTargets: Array<[string, string]> = [
    ['/api/elevenlabs', 'https://api.elevenlabs.io'],
    ['/api/speechify', 'https://api.sws.speechify.com'],
    ['/api/fishaudio', 'https://api.fish.audio'],
    ['/api/kokoro', 'https://api.kokorotts.com'],
    ['/api/cartesia', 'https://api.cartesia.ai'],
    ['/api/openai', 'https://api.openai.com'],
  ];

  for (const [prefix, targetOrigin] of ttsProxyTargets) {
    app.use(prefix, async (req, res) => {
      try {
        const targetUrl = `${targetOrigin}${req.url}`;
        const forwardHeaders: Record<string, string> = {};
        for (const [key, val] of Object.entries(req.headers)) {
          const lower = key.toLowerCase();
          if (
            ['host', 'connection', 'content-length', 'origin', 'referer'].includes(lower) ||
            typeof val !== 'string'
          ) {
            continue;
          }
          forwardHeaders[key] = val;
        }
        const upstreamRes = await fetch(targetUrl, {
          method: req.method,
          headers: forwardHeaders,
          body:
            req.method !== 'GET' && req.method !== 'HEAD' && req.body
              ? JSON.stringify(req.body)
              : undefined,
        });
        res.status(upstreamRes.status);
        const contentType = upstreamRes.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        const arrayBuffer = await upstreamRes.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      } catch (err: unknown) {
        res.status(502).json({
          error: err instanceof Error ? err.message : 'TTS proxy error',
        });
      }
    });
  }

  const httpServer = http.createServer(app);

  // Initialize Socket.io on the same HTTP server
  const io = setupSocketServer(httpServer);

  if (!isProduction) {
    // In dev: mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In prod: serve static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Queue System] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Queue System] Failed to start server:', err);
  process.exit(1);
});
