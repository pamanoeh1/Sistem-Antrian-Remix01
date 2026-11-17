/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import fs from 'fs';
import path from 'path';
import {
  QueueSyncEvent,
  AudioSettings,
  MediaSettings,
  CompanyProfile,
  ServiceCategory,
  Counter,
  QueueItem,
  LanSettings,
} from '../types/queue';
import type { PenjagaAccount, AdminCredentials } from '../utils/authLogic';

export interface ServerQueueState {
  activeCall: any | null;
  callHistory: any[];
  counters: Record<string, any>;
  lastResetTime: string;
  audioSettings: AudioSettings | null;
  mediaSettings: MediaSettings | null;
  company: CompanyProfile | null;
  services: ServiceCategory[] | null;
  countersList: Counter[] | null;
  queues: QueueItem[] | null;
  penjagaAccounts: PenjagaAccount[] | null;
  adminCredentials: AdminCredentials | null;
  lanSettings: LanSettings | null;
}

const STATE_FILE = path.resolve(process.cwd(), '.queue_server_state.json');

function loadPersistedState(): Partial<ServerQueueState> {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('[Server] Error reading saved state:', err);
  }
  return {};
}

const initialSaved = loadPersistedState();

// Authoritative in-memory state on the server
const queueState: ServerQueueState = {
  activeCall: initialSaved.activeCall || null,
  callHistory: initialSaved.callHistory || [],
  counters: initialSaved.counters || {},
  lastResetTime: initialSaved.lastResetTime || new Date().toISOString(),
  audioSettings: initialSaved.audioSettings || null,
  mediaSettings: initialSaved.mediaSettings || null,
  company: initialSaved.company || null,
  services: initialSaved.services || null,
  countersList: initialSaved.countersList || null,
  queues: initialSaved.queues || null,
  penjagaAccounts: initialSaved.penjagaAccounts || null,
  adminCredentials: initialSaved.adminCredentials || null,
  lanSettings: initialSaved.lanSettings || null,
};

function saveStateThrottled() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(queueState, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Server] Error persisting state:', err);
  }
}

export function setupSocketServer(httpServer: any): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 10000,
    pingInterval: 5000,
  });

  io.on('connection', (socket: Socket) => {
    // 1. Send authoritative latest saved state to newly connected client
    socket.emit('init_state', queueState);

    // Register device metadata (role, counterId)
    socket.on('register_device', (deviceInfo: { role?: string; counterId?: string }) => {
      socket.data.role = deviceInfo?.role || 'general';
      socket.data.counterId = deviceInfo?.counterId || null;
    });

    // 2. Request latest settings on demand
    socket.on('request_settings_sync', () => {
      socket.emit('settings_synced', {
        audioSettings: queueState.audioSettings,
        mediaSettings: queueState.mediaSettings,
        company: queueState.company,
        services: queueState.services,
        counters: queueState.countersList,
        queues: queueState.queues,
        penjagaAccounts: queueState.penjagaAccounts,
        adminCredentials: queueState.adminCredentials,
        lanSettings: queueState.lanSettings,
        activeTicket: queueState.activeCall?.ticket || null,
      });
    });

    // 3. Core Sync Event: Relays any QueueSyncEvent to all other connected clients & persists state
    socket.on('queue_sync_event', (event: QueueSyncEvent) => {
      // Broadcast to all clients EXCEPT the sender
      socket.broadcast.emit('queue_sync_event', event);

      // Track & persist latest settings based on event type
      if (event.type === 'AUDIO_UPDATED' && event.audioSettings) {
        queueState.audioSettings = event.audioSettings;
        saveStateThrottled();
        console.log('[Server] Audio settings updated and saved:', event.audioSettings.voicePersona);
      } else if (event.type === 'MEDIA_UPDATED' && event.mediaSettings) {
        queueState.mediaSettings = event.mediaSettings;
        saveStateThrottled();
      } else if (event.type === 'COMPANY_UPDATED' && event.company) {
        queueState.company = event.company;
        saveStateThrottled();
      } else if (event.type === 'SERVICES_UPDATED' && event.services) {
        queueState.services = event.services;
        saveStateThrottled();
      } else if (event.type === 'COUNTER_UPDATED' && event.counters) {
        queueState.countersList = event.counters;
        if (event.penjagaAccounts && Array.isArray(event.penjagaAccounts)) {
          queueState.penjagaAccounts = event.penjagaAccounts;
        }
        saveStateThrottled();
      } else if (event.type === 'ACCOUNTS_UPDATED' && Array.isArray(event.penjagaAccounts)) {
        queueState.penjagaAccounts = event.penjagaAccounts;
        if (event.counters && Array.isArray(event.counters)) {
          queueState.countersList = event.counters;
        }
        saveStateThrottled();
      } else if (event.type === 'ADMIN_CREDENTIALS_UPDATED' && event.adminCredentials) {
        queueState.adminCredentials = event.adminCredentials;
        saveStateThrottled();
      } else if (event.type === 'LAN_SETTINGS_UPDATED' && event.lanSettings) {
        queueState.lanSettings = event.lanSettings;
        saveStateThrottled();
      } else if (event.type === 'TICKET_CALLED' || event.type === 'TICKET_RECALLED') {
        queueState.activeCall = {
          ticket: event.ticket,
          counter: event.counter,
          audioSettings: event.audioSettings || queueState.audioSettings,
          timestamp: event.timestamp,
        };
        // Always store audio settings if bundled with call event
        if (event.audioSettings) {
          queueState.audioSettings = event.audioSettings;
        }
        // Save authoritative counters list with active ticket id
        if (event.counters && Array.isArray(event.counters)) {
          queueState.countersList = event.counters;
        } else if (event.counter && event.ticket) {
          if (queueState.countersList) {
            queueState.countersList = queueState.countersList.map((c) =>
              c.id === event.counter!.id
                ? { ...c, currentTicketId: event.ticket!.id, status: 'open' }
                : c
            );
          }
        }
        if (event.ticket) {
          queueState.callHistory = [
            { ticket: event.ticket, counter: event.counter, timestamp: event.timestamp },
            ...queueState.callHistory.slice(0, 9),
          ];
          if (!queueState.queues) queueState.queues = [];
          queueState.queues = queueState.queues.map((q) =>
            q.id === event.ticket!.id ? event.ticket! : q
          );
          if (!queueState.queues.some((q) => q.id === event.ticket!.id)) {
            queueState.queues.push(event.ticket!);
          }
        }
        saveStateThrottled();
      } else if (event.type === 'TICKET_COMPLETED' || event.type === 'TICKET_SKIPPED') {
        if (event.counters && Array.isArray(event.counters)) {
          queueState.countersList = event.counters;
        }
        if (event.ticket) {
          if (queueState.queues) {
            queueState.queues = queueState.queues.map((q) =>
              q.id === event.ticket!.id ? event.ticket! : q
            );
          }
          if (queueState.activeCall?.ticket?.id === event.ticket.id) {
            queueState.activeCall = null;
          }
        }
        saveStateThrottled();
      } else if (event.type === 'TICKET_CREATED' && event.ticket) {
        if (!queueState.queues) queueState.queues = [];
        if (!queueState.queues.some((q) => q.id === event.ticket!.id)) {
          queueState.queues.push(event.ticket!);
        }
        saveStateThrottled();
      } else if (event.type === 'STATE_RESET') {
        queueState.activeCall = null;
        queueState.callHistory = [];
        queueState.queues = [];
        if (event.counters && Array.isArray(event.counters)) {
          queueState.countersList = event.counters;
        } else if (queueState.countersList) {
          queueState.countersList = queueState.countersList.map((c) => ({
            ...c,
            currentTicketId: null,
          }));
        }
        queueState.lastResetTime = new Date().toISOString();
        saveStateThrottled();
      }
    });

    // 4. Explicit call_queue event
    socket.on('call_queue', (payload: any) => {
      const callData = {
        ...payload,
        audioSettings: payload.audioSettings || queueState.audioSettings,
        callId: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        isRecall: false,
      };
      queueState.activeCall = callData;
      if (payload.audioSettings) {
        queueState.audioSettings = payload.audioSettings;
      }
      saveStateThrottled();
      io.emit('queue_called', callData);
    });

    // 5. Explicit recall_queue event
    socket.on('recall_queue', (payload: any) => {
      const recallData = {
        ...payload,
        audioSettings: payload.audioSettings || queueState.audioSettings,
        callId: `recall_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        isRecall: true,
      };
      queueState.activeCall = recallData;
      if (payload.audioSettings) {
        queueState.audioSettings = payload.audioSettings;
      }
      saveStateThrottled();
      io.emit('queue_recalled', recallData);
    });

    // 6. Update status event
    socket.on('update_status', (payload: any) => {
      if (payload?.counterId) {
        queueState.counters[payload.counterId] = {
          ...queueState.counters[payload.counterId],
          ...payload,
        };
      }
      saveStateThrottled();
      io.emit('counter_status_updated', payload);
    });

    // 7. Reset queue event
    socket.on('reset_queue', (payload: any) => {
      queueState.activeCall = null;
      queueState.callHistory = [];
      queueState.lastResetTime = new Date().toISOString();
      saveStateThrottled();
      io.emit('queue_reset', {
        requestedBy: payload?.requestedBy || 'Admin',
        timestamp: queueState.lastResetTime,
      });
    });
  });

  return io;
}
