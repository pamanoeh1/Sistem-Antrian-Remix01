import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage } from 'http';
import {defineConfig, Plugin} from 'vite';
import { setupSocketServer } from './src/server/socketHandler';
import { processSendResetCode, processVerifyResetCode } from './src/server/otpHandler';

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 64) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function socketIOPlugin(): Plugin {
  return {
    name: 'socket-io-dev-server',
    configureServer(server) {
      if (server.httpServer) {
        setupSocketServer(server.httpServer);
      }
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/api/auth/send-reset-code') && req.method === 'POST') {
          const body = await readJsonBody(req);
          const result = await processSendResetCode(body as unknown as Parameters<typeof processSendResetCode>[0]);
          res.statusCode = result.httpStatus;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(result.body));
          return;
        }
        if (url.startsWith('/api/auth/verify-reset-code') && req.method === 'POST') {
          const body = await readJsonBody(req);
          const result = await processVerifyResetCode(body as unknown as Parameters<typeof processVerifyResetCode>[0]);
          res.statusCode = result.httpStatus;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(result.body));
          return;
        }
        if (url.startsWith('/api/sync') || url.startsWith('/sync.php')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            status: 'ok',
            syncEngine: 'vite_dev_mock',
            serverTime: Date.now(),
            lastEventId: 0,
            events: [],
          }));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss(), socketIOPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/elevenlabs': {
          target: 'https://api.elevenlabs.io',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/elevenlabs/, ''),
        },
        '/api/speechify': {
          target: 'https://api.sws.speechify.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/speechify/, ''),
        },
        '/api/fishaudio': {
          target: 'https://api.fish.audio',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/fishaudio/, ''),
        },
        '/api/kokoro': {
          target: 'https://api.kokorotts.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/kokoro/, ''),
        },
        '/api/cartesia': {
          target: 'https://api.cartesia.ai',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/cartesia/, ''),
        },
        '/api/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/openai/, ''),
        },
      },
    },
  };
});
