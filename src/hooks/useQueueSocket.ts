/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import {
  getQueueSocket,
  onSocketSyncEvent,
  isSocketConnected,
  getSyncStatus,
  onSyncStatusChange,
  SyncEngineStatus,
  triggerImmediateSync,
  reconnectSyncEngine,
} from '../utils/queueSocket';
import { QueueSyncEvent, QueueItem, Counter } from '../types/queue';

export interface CallPayload {
  ticketNumber: string;
  serviceName: string;
  counterId: string;
  counterName: string;
  operatorName?: string;
  timestamp?: number;
  isRecall?: boolean;
}

export interface UseQueueSocketOptions {
  role?: 'display' | 'counter' | 'kiosk';
  counterId?: string;
  onQueueCalled?: (ticket: QueueItem, counter?: Counter) => void;
  onQueueRecalled?: (ticket: QueueItem, counter?: Counter) => void;
  onQueueReset?: () => void;
  onCounterUpdated?: (counter?: Counter) => void;
}

/**
 * Custom React hook for connecting to Socket.io and reacting to real-time queue events.
 * Seamlessly supports both WebSocket LAN/Cloud and PHP InfinityFree hosting polling.
 */
export function useQueueSocket(options: UseQueueSocketOptions = {}) {
  const { role = 'counter', counterId, onQueueCalled, onQueueRecalled, onQueueReset, onCounterUpdated } = options;

  const [connected, setConnected] = useState<boolean>(() => isSocketConnected());
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>(() => getSyncStatus());
  const socketRef = useRef<Socket | null>(null);

  const callbacksRef = useRef({
    onQueueCalled,
    onQueueRecalled,
    onQueueReset,
    onCounterUpdated,
  });

  useEffect(() => {
    callbacksRef.current = {
      onQueueCalled,
      onQueueRecalled,
      onQueueReset,
      onCounterUpdated,
    };
  }, [onQueueCalled, onQueueRecalled, onQueueReset, onCounterUpdated]);

  // Subscribe to live sync status changes (Socket.io vs PHP InfinityFree)
  useEffect(() => {
    const unsubscribeStatus = onSyncStatusChange((status) => {
      setSyncStatus(status);
      setConnected(status.connected);
    });

    return () => unsubscribeStatus();
  }, []);

  useEffect(() => {
    const socket = getQueueSocket();
    socketRef.current = socket;

    if (socket) {
      if (socket.connected) {
        setConnected(true);
      }

      const handleConnect = () => {
        setConnected(true);
        socket.emit('register_device', { role, counterId });
      };

      const handleDisconnect = () => {
        // Only set disconnected if PHP engine is also offline
        setConnected(isSocketConnected());
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      if (socket.connected) {
        socket.emit('register_device', { role, counterId });
      }

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [role, counterId]);

  // Subscribe to sync events
  useEffect(() => {
    const unsubscribe = onSocketSyncEvent((event: QueueSyncEvent) => {
      if (event.type === 'TICKET_CALLED') {
        if (event.ticket && callbacksRef.current.onQueueCalled) {
          callbacksRef.current.onQueueCalled(event.ticket, event.counter);
        }
      } else if (event.type === 'TICKET_RECALLED') {
        if (event.ticket && callbacksRef.current.onQueueRecalled) {
          callbacksRef.current.onQueueRecalled(event.ticket, event.counter);
        }
      } else if (event.type === 'STATE_RESET') {
        if (callbacksRef.current.onQueueReset) {
          callbacksRef.current.onQueueReset();
        }
      } else if (event.type === 'COUNTER_UPDATED') {
        if (callbacksRef.current.onCounterUpdated) {
          callbacksRef.current.onCounterUpdated(event.counter);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const panggilNomor = useCallback((payload: CallPayload) => {
    const socket = socketRef.current || getQueueSocket();
    if (socket && socket.connected) {
      socket.emit('call_queue', payload);
    }
  }, []);

  const panggilUlang = useCallback((payload: CallPayload) => {
    const socket = socketRef.current || getQueueSocket();
    if (socket && socket.connected) {
      socket.emit('recall_queue', payload);
    }
  }, []);

  const updateStatusLoket = useCallback((cId: string, status: string, operator?: string) => {
    const socket = socketRef.current || getQueueSocket();
    if (socket && socket.connected) {
      socket.emit('update_status', { counterId: cId, status, operator });
    }
  }, []);

  const resetAntreanHarian = useCallback((requestedBy: string = 'Petugas') => {
    const socket = socketRef.current || getQueueSocket();
    if (socket && socket.connected) {
      socket.emit('reset_queue', { requestedBy });
    }
  }, []);

  return {
    isConnected: connected,
    syncStatus,
    panggilNomor,
    panggilUlang,
    updateStatusLoket,
    resetAntreanHarian,
    triggerImmediateSync,
    reconnectSyncEngine,
  };
}
