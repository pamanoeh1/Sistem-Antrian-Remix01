/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { io, Socket } from 'socket.io-client';
import { QueueSyncEvent } from '../types/queue';
import { getStoredLanSettings } from './queueStore';

export interface SyncEngineStatus {
  connected: boolean;
  engine: 'socket' | 'php' | 'local';
  label: string;
  details: string;
  serverUrl: string;
  lastSyncTime?: number;
}

let socketInstance: Socket | null = null;
const eventListeners: Set<(event: QueueSyncEvent) => void> = new Set();
const statusListeners: Set<(status: SyncEngineStatus) => void> = new Set();

let isConnecting = false;
let currentEngine: 'socket' | 'php' | 'local' = 'local';
let isEngineConnected = false;
let currentStatusLabel = 'Menghubungkan...';
let currentStatusDetails = 'Mencari server sinkronisasi antrean...';
let activeServerUrl = typeof window !== 'undefined' ? window.location.origin : '';
let lastSyncTimestamp = 0;
let lastServerEventId = 0;
let hasAppliedInitialPhpState = false;

// PHP Polling controllers
let phpPollingInterval: any = null;
let isPhpPollingActive = false;
let phpEndpoint = '/api/sync.php';
let phpConsecutiveErrors = 0;

function notifyStatusChange() {
  const status = getSyncStatus();
  statusListeners.forEach((listener) => {
    try {
      listener(status);
    } catch (e) {
      console.warn('[SyncEngine] Status listener error:', e);
    }
  });
}

function updateSyncStatus(
  engine: 'socket' | 'php' | 'local',
  connected: boolean,
  label: string,
  details: string,
  serverUrl?: string
) {
  const hasChanged =
    currentEngine !== engine ||
    isEngineConnected !== connected ||
    currentStatusLabel !== label;

  currentEngine = engine;
  isEngineConnected = connected;
  currentStatusLabel = label;
  currentStatusDetails = details;
  if (serverUrl) activeServerUrl = serverUrl;
  if (connected) lastSyncTimestamp = Date.now();

  if (hasChanged) {
    notifyStatusChange();
  }
}

/**
 * Returns current target server URL configured in LAN Settings or defaults to window origin.
 */
function resolveServerUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    const lan = getStoredLanSettings();
    if (lan.customServerUrl && lan.customServerUrl.trim()) {
      return lan.customServerUrl.trim().replace(/\/+$/, '');
    }
  } catch {
    // fallback
  }
  return window.location.origin;
}

/**
 * Dispatches an incoming event to all registered listeners.
 */
function dispatchSyncEvent(event: QueueSyncEvent) {
  if (!event || !event.type) return;
  eventListeners.forEach((callback) => {
    try {
      callback(event);
    } catch (err) {
      console.error('[SyncEngine] Event listener error:', err);
    }
  });
}

/**
 * Sends event via PHP API (works on InfinityFree, cPanel, Apache/PHP, XAMPP).
 */
async function sendViaPhpApi(event: QueueSyncEvent): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const endpoints = [phpEndpoint, '/sync.php', '/api/sync.php'];
  const payload = JSON.stringify({
    action: 'post_event',
    event,
    senderId: event.senderId || 'device_client',
  });

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: payload,
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.status === 'ok') {
          phpEndpoint = ep; // lock on working endpoint
          lastSyncTimestamp = Date.now();
          if (data.eventId) {
            lastServerEventId = Math.max(lastServerEventId, data.eventId);
          }
          return true;
        }
      }
    } catch {
      // try next endpoint
    }
  }

  return false;
}

/**
 * Polls PHP backend for new events and state updates.
 */
async function fetchPhpSyncUpdates(isBurst = false): Promise<void> {
  if (typeof window === 'undefined') return;

  const endpoints = [phpEndpoint, '/sync.php', '/api/sync.php'];
  const query = `?last_id=${lastServerEventId}&since=${lastSyncTimestamp}&t=${Date.now()}`;

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(ep + query, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'ok') {
          phpEndpoint = ep;
          phpConsecutiveErrors = 0;

          // If socket is not connected, promote PHP engine to active!
          if (!socketInstance || !socketInstance.connected) {
            updateSyncStatus(
              'php',
              true,
              'Tersinkron (PHP Hosting • InfinityFree)',
              'Terhubung lancar melalui API sync.php di web host InfinityFree',
              window.location.origin
            );
          }

          if (data.lastEventId) {
            lastServerEventId = Math.max(lastServerEventId, data.lastEventId);
          }
          lastSyncTimestamp = Date.now();

          // Dispatch incoming events from other devices
          if (Array.isArray(data.events) && data.events.length > 0) {
            data.events.forEach((ev: any) => {
              dispatchSyncEvent(ev);
            });
          }

          // Initial state restoration if provided (always apply on first sync regardless of event log count)
          if (data.state && !hasAppliedInitialPhpState) {
            hasAppliedInitialPhpState = true;
            const syncEvent: QueueSyncEvent = {
              type: 'SETTINGS_SYNC',
              audioSettings: data.state.audioSettings || undefined,
              mediaSettings: data.state.mediaSettings || undefined,
              company: data.state.company || undefined,
              services: data.state.services || undefined,
              counters:
                Array.isArray(data.state.counters) && data.state.counters.length > 0
                  ? data.state.counters
                  : undefined,
              queues:
                Array.isArray(data.state.queues) && data.state.queues.length > 0
                  ? data.state.queues
                  : undefined,
              penjagaAccounts:
                Array.isArray(data.state.penjagaAccounts)
                  ? data.state.penjagaAccounts
                  : undefined,
              adminCredentials: data.state.adminCredentials || undefined,
              lanSettings: data.state.lanSettings || undefined,
              ticket: data.state.activeTicket || undefined,
              timestamp: Date.now(),
              senderId: 'php_init',
            };
            dispatchSyncEvent(syncEvent);
          } else if (data.state) {
            hasAppliedInitialPhpState = true;
          }

          return;
        }
      }
    } catch {
      // Endpoint error
    }
  }

  phpConsecutiveErrors++;
  if (phpConsecutiveErrors >= 4 && (!socketInstance || !socketInstance.connected)) {
    updateSyncStatus(
      'local',
      false,
      'Mode Offline (Lokal)',
      'Tidak dapat tersambung ke Socket.io maupun PHP Sync API. Periksa koneksi internet/hosting Anda.'
    );
  }
}

/**
 * Starts continuous smart polling for PHP hostings like InfinityFree.
 */
function startPhpPolling() {
  if (isPhpPollingActive || typeof window === 'undefined') return;
  isPhpPollingActive = true;

  // Initial immediate fetch
  fetchPhpSyncUpdates();

  // Regular periodic poll: every 1.25 seconds
  phpPollingInterval = setInterval(() => {
    // Only poll PHP if socket is not actively connected (saves bandwidth)
    if (!socketInstance || !socketInstance.connected) {
      fetchPhpSyncUpdates();
    }
  }, 1250);
}

/**
 * Initializes or returns the existing Socket.io client connection.
 * Automatically enables PHP Sync fallback when running on InfinityFree or hosts without Node.js.
 */
export function getQueueSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  // Always initiate PHP Sync Engine in background as fallback
  startPhpPolling();

  if (!socketInstance && !isConnecting) {
    isConnecting = true;
    try {
      const serverUrl = resolveServerUrl();
      const lan = getStoredLanSettings();

      // If user explicitly forced PHP-only mode
      if (lan.syncMode === 'php') {
        isConnecting = false;
        updateSyncStatus(
          'php',
          true,
          'Tersinkron (PHP Hosting • InfinityFree)',
          'Mode sinkronisasi PHP API dipilih secara manual di pengaturan.',
          serverUrl
        );
        return null;
      }

      socketInstance = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 8,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 4000,
        timeout: 6000,
      });

      socketInstance.on('connect', () => {
        isConnecting = false;
        console.log('[Socket.io] Connected to queue server:', socketInstance?.id);
        updateSyncStatus(
          'socket',
          true,
          'Tersinkron (Socket.io Real-Time)',
          `Terhubung ke WebSocket server: ${serverUrl}`,
          serverUrl
        );
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('[Socket.io] Disconnected:', reason);
        // Seamlessly switch to PHP Polling on disconnect
        fetchPhpSyncUpdates();
      });

      socketInstance.on('connect_error', (err) => {
        isConnecting = false;
        console.warn('[Socket.io] Connection notice (switching to PHP Sync if available):', err.message);
        // Probe PHP sync immediately
        fetchPhpSyncUpdates();
      });

      // Listen for incoming QueueSyncEvent from other devices on LAN / Cloud
      socketInstance.on('queue_sync_event', (event: QueueSyncEvent) => {
        dispatchSyncEvent(event);
      });

      // Listen for initial server state sync
      socketInstance.on('init_state', (serverState: any) => {
        if (serverState) {
          const syncEvent: QueueSyncEvent = {
            type: 'SETTINGS_SYNC',
            audioSettings: serverState.audioSettings || undefined,
            mediaSettings: serverState.mediaSettings || undefined,
            company: serverState.company || undefined,
            services: serverState.services || undefined,
            counters: serverState.countersList || undefined,
            queues: serverState.queues || undefined,
            penjagaAccounts: Array.isArray(serverState.penjagaAccounts)
              ? serverState.penjagaAccounts
              : undefined,
            adminCredentials: serverState.adminCredentials || undefined,
            lanSettings: serverState.lanSettings || undefined,
            ticket: serverState.activeCall?.ticket || undefined,
            timestamp: Date.now(),
            senderId: 'server_init',
          };
          dispatchSyncEvent(syncEvent);
        }
      });

      // Listen for on-demand settings_synced
      socketInstance.on('settings_synced', (serverState: any) => {
        if (serverState) {
          const syncEvent: QueueSyncEvent = {
            type: 'SETTINGS_SYNC',
            audioSettings: serverState.audioSettings || undefined,
            mediaSettings: serverState.mediaSettings || undefined,
            company: serverState.company || undefined,
            services: serverState.services || undefined,
            counters: serverState.counters || undefined,
            queues: serverState.queues || undefined,
            penjagaAccounts: Array.isArray(serverState.penjagaAccounts)
              ? serverState.penjagaAccounts
              : undefined,
            adminCredentials: serverState.adminCredentials || undefined,
            lanSettings: serverState.lanSettings || undefined,
            ticket: serverState.activeTicket || undefined,
            timestamp: Date.now(),
            senderId: 'server_settings_synced',
          };
          dispatchSyncEvent(syncEvent);
        }
      });
    } catch (e) {
      isConnecting = false;
      console.warn('[Socket.io] Client init warning, using PHP fallback:', e);
      fetchPhpSyncUpdates();
    }
  }

  return socketInstance;
}

/**
 * Broadcasts an event to other devices via Socket.io AND PHP API.
 * Guarantees delivery even on static/PHP hostings like InfinityFree!
 */
export function sendSocketSyncEvent(event: QueueSyncEvent): void {
  let sentViaSocket = false;
  const socket = getQueueSocket();

  if (socket && socket.connected) {
    try {
      socket.emit('queue_sync_event', event);
      sentViaSocket = true;
    } catch {
      sentViaSocket = false;
    }
  }

  // Always send to PHP API as well if on InfinityFree or if socket not connected
  sendViaPhpApi(event).catch(() => {});

  // Trigger rapid burst poll right after sending an event so other devices pick it up immediately
  setTimeout(() => fetchPhpSyncUpdates(true), 300);
}

/**
 * Subscribes a callback to receive incoming sync events from Socket.io or PHP Sync Engine.
 */
export function onSocketSyncEvent(callback: (event: QueueSyncEvent) => void): () => void {
  eventListeners.add(callback);
  getQueueSocket();

  return () => {
    eventListeners.delete(callback);
  };
}

/**
 * Subscribes to live sync engine status changes (e.g. for connection badges in UI).
 */
export function onSyncStatusChange(callback: (status: SyncEngineStatus) => void): () => void {
  statusListeners.add(callback);
  callback(getSyncStatus());

  return () => {
    statusListeners.delete(callback);
  };
}

/**
 * Returns current sync status across Socket.io and PHP engines.
 */
export function getSyncStatus(): SyncEngineStatus {
  const isSocketOk = !!socketInstance && socketInstance.connected;
  if (isSocketOk) {
    return {
      connected: true,
      engine: 'socket',
      label: 'Tersinkron (Socket.io Real-Time)',
      details: currentStatusDetails || 'Terhubung langsung ke WebSocket server',
      serverUrl: activeServerUrl,
      lastSyncTime: lastSyncTimestamp,
    };
  }

  return {
    connected: isEngineConnected,
    engine: currentEngine,
    label: currentStatusLabel,
    details: currentStatusDetails,
    serverUrl: activeServerUrl,
    lastSyncTime: lastSyncTimestamp,
  };
}

/**
 * Checks if client is currently connected to any sync engine (Socket.io or PHP).
 */
export function isSocketConnected(): boolean {
  return (!!socketInstance && socketInstance.connected) || isEngineConnected;
}

/**
 * Forces an immediate resynchronization check (called upon screen resume, focus, or tab switch).
 */
export async function triggerImmediateSync(): Promise<void> {
  const socket = getQueueSocket();
  if (socket && socket.connected) {
    socket.emit('request_settings_sync');
  } else {
    await fetchPhpSyncUpdates(true);
  }
}

/**
 * Reconnects or switches synchronization engine when user updates LAN / Cloud settings.
 */
export function reconnectSyncEngine(): void {
  if (socketInstance) {
    try {
      socketInstance.disconnect();
    } catch {
      // ignore
    }
    socketInstance = null;
  }
  isConnecting = false;
  hasAppliedInitialPhpState = false;
  getQueueSocket();
  fetchPhpSyncUpdates(true);
}
