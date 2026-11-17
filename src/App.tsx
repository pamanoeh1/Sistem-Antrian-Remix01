/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  QueueItem,
  Counter,
  ServiceCategory,
  MediaSettings,
  AudioSettings,
  CompanyProfile,
  QueueSyncEvent,
} from './types/queue';
import {
  getStoredQueues,
  setStoredQueues,
  getStoredCounters,
  setStoredCounters,
  getStoredServices,
  setStoredServices,
  getStoredMedia,
  setStoredMedia,
  getStoredAudio,
  setStoredAudio,
  getStoredCompany,
  setStoredCompany,
  getStoredActiveTicket,
  setStoredActiveTicket,
  setStoredLanSettings,
  broadcastSyncEvent,
  subscribeSyncEvents,
} from './utils/queueStore';
import { generateNextTicket } from './utils/queueLogic';
import { playQueueCall } from './utils/audioVoice';
import { getQueueSocket, triggerImmediateSync } from './utils/queueSocket';
import {
  getActiveUserSession,
  logoutUserSession,
  getStoredPenjagaAccounts,
  setStoredPenjagaAccounts,
  setStoredAdminCredentials,
} from './utils/authStore';
import { UserSession, PenjagaAccount } from './utils/authLogic';
import { HeaderNav, ActivePage } from './components/common/HeaderNav';
import { DisplayView } from './components/display/DisplayView';
import { KioskView } from './components/kiosk/KioskView';
import { PenjagaView } from './components/penjaga/PenjagaView';
import { AdminView } from './components/admin/AdminView';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { HelpGuideModal } from './components/common/HelpGuideModal';

// Unique tab identifier to prevent double/echo audio triggers between sending & receiving in the same window
const TAB_INSTANCE_ID =
  typeof window !== 'undefined'
    ? `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    : 'srv';

const STORAGE_ACTIVE_PAGE_KEY = 'antrean_active_page_v1';

export function getInitialActivePage(): ActivePage {
  if (typeof window === 'undefined') return 'display';

  // 1. Priority: Explicit URL query param (?view=...)
  const params = new URLSearchParams(window.location.search);
  const v = params.get('view');
  if (
    v === 'display' ||
    v === 'kiosk' ||
    v === 'admin' ||
    v === 'penjaga' ||
    v === 'login'
  ) {
    return v as ActivePage;
  }

  // 2. Priority: Saved active page from previous session
  try {
    const saved = localStorage.getItem(STORAGE_ACTIVE_PAGE_KEY);
    if (
      saved === 'display' ||
      saved === 'kiosk' ||
      saved === 'admin' ||
      saved === 'penjaga' ||
      saved === 'login'
    ) {
      return saved as ActivePage;
    }
  } catch {
    // ignore
  }

  // 3. Priority: If user is logged in as Penjaga, maintain Penjaga desk view
  const session = getActiveUserSession();
  if (session) {
    if (session.role === 'penjaga') return 'penjaga';
    if (session.role === 'server') return 'admin';
  }

  return 'display';
}

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(() =>
    getActiveUserSession()
  );

  const [activePage, setActivePage] = useState<ActivePage>(() => getInitialActivePage());

  const [queues, setQueues] = useState<QueueItem[]>(() => getStoredQueues());
  const [counters, setCounters] = useState<Counter[]>(() => getStoredCounters());
  const [services, setServices] = useState<ServiceCategory[]>(() => getStoredServices());
  const [media, setMedia] = useState<MediaSettings>(() => getStoredMedia());
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => getStoredAudio());
  const [company, setCompany] = useState<CompanyProfile>(() => getStoredCompany());
  const [activeTicket, setActiveTicket] = useState<QueueItem | null>(() => getStoredActiveTicket());
  const [penjagaAccounts, setPenjagaAccounts] = useState<PenjagaAccount[]>(() =>
    getStoredPenjagaAccounts()
  );
  const [lastSyncEvent, setLastSyncEvent] = useState<QueueSyncEvent | null>(null);
  const [isDisplayFullscreen, setIsDisplayFullscreen] = useState<boolean>(false);

  // Synchronize state across tabs and windows
  const reloadFromStorage = useCallback(() => {
    setQueues(getStoredQueues());
    setCounters(getStoredCounters());
    setServices(getStoredServices());
    setMedia(getStoredMedia());
    setAudioSettings(getStoredAudio());
    setCompany(getStoredCompany());
    setActiveTicket(getStoredActiveTicket());
    setPenjagaAccounts(getStoredPenjagaAccounts());
  }, []);

  // Navigate and persist active page in localStorage + URL search params
  const handleSelectPage = useCallback((page: ActivePage) => {
    setActivePage(page);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_ACTIVE_PAGE_KEY, page);
        const url = new URL(window.location.href);
        url.searchParams.set('view', page);
        window.history.replaceState(null, '', url.toString());
      } catch {
        // ignore
      }
    }
  }, []);

  // Sync activePage to localStorage and URL search params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_ACTIVE_PAGE_KEY, activePage);
      const url = new URL(window.location.href);
      if (url.searchParams.get('view') !== activePage) {
        url.searchParams.set('view', activePage);
        window.history.replaceState(null, '', url.toString());
      }
    } catch {
      // ignore
    }
  }, [activePage]);

  // Mobile screen lock / sleep & resume handler: recovers view and prevents losing active desk queue
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        // 1. Refresh active session
        const currentSession = getActiveUserSession();
        setUserSession(currentSession);

        // 2. Reload storage
        reloadFromStorage();

        // 3. Ensure page remains on penjaga/admin if that was the active role
        try {
          const saved = localStorage.getItem(STORAGE_ACTIVE_PAGE_KEY);
          if (saved && (saved === 'penjaga' || saved === 'admin') && activePage !== saved) {
            setActivePage(saved as ActivePage);
          } else if (currentSession?.role === 'penjaga' && activePage !== 'penjaga') {
            setActivePage('penjaga');
          }
        } catch {
          // ignore
        }

        // 4. Ensure socket is connected and requests settings sync
        const socket = getQueueSocket();
        if (socket) {
          if (!socket.connected) {
            socket.connect();
          } else {
            socket.emit('request_settings_sync');
          }
        }
        triggerImmediateSync().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('pageshow', handleResume);
    window.addEventListener('focus', handleResume);

    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('pageshow', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [activePage, reloadFromStorage]);

  useEffect(() => {
    const unsubscribe = subscribeSyncEvents((event) => {
      setLastSyncEvent(event);

      // 1. Handle Counter Status Updates (Buka, Istirahat, Tutup)
      if (event.type === 'COUNTER_UPDATED') {
        if (event.counters && Array.isArray(event.counters)) {
          setCounters(event.counters);
          setStoredCounters(event.counters);
        } else if (event.counter) {
          setCounters((prev) => {
            const next = prev.map((c) => (c.id === event.counter!.id ? event.counter! : c));
            setStoredCounters(next);
            return next;
          });
        }
        if (event.penjagaAccounts && Array.isArray(event.penjagaAccounts)) {
          setPenjagaAccounts(event.penjagaAccounts);
          setStoredPenjagaAccounts(event.penjagaAccounts);
        }
      }

      // 2. Handle Ticket Calling and State Changes
      if (event.type === 'TICKET_CALLED' || event.type === 'TICKET_RECALLED') {
        if (event.ticket) {
          setActiveTicket(event.ticket);
          setStoredActiveTicket(event.ticket);
          setQueues((prev) => {
            const next = prev.map((q) => (q.id === event.ticket!.id ? event.ticket! : q));
            if (!prev.some((q) => q.id === event.ticket!.id)) {
              next.push(event.ticket!);
            }
            setStoredQueues(next);
            return next;
          });
        }
        if (event.counters && Array.isArray(event.counters)) {
          setCounters(event.counters);
          setStoredCounters(event.counters);
        }

        // Always apply latest audioSettings from call event if present
        const effectiveAudio = event.audioSettings || audioSettings;
        if (event.audioSettings) {
          setAudioSettings(event.audioSettings);
          setStoredAudio(event.audioSettings);
        }
        const ticket = event.ticket;
        const counterName = event.counter ? event.counter.name : ticket?.counterName || 'Loket Pelayanan';
        if (ticket && effectiveAudio.enabled && event.senderId !== TAB_INSTANCE_ID) {
          playQueueCall(ticket.number, counterName, effectiveAudio, event.timestamp).catch(() => {});
        }
      } else if (event.type === 'TICKET_COMPLETED' || event.type === 'TICKET_SKIPPED') {
        if (event.ticket) {
          setQueues((prev) => {
            const next = prev.map((q) => (q.id === event.ticket!.id ? event.ticket! : q));
            setStoredQueues(next);
            return next;
          });
          setActiveTicket((prev) => (prev?.id === event.ticket!.id ? null : prev));
          setStoredActiveTicket(null);
        }
        if (event.counters && Array.isArray(event.counters)) {
          setCounters(event.counters);
          setStoredCounters(event.counters);
        }
      } else if (event.type === 'TICKET_CREATED' && event.ticket) {
        setQueues((prev) => {
          if (prev.some((q) => q.id === event.ticket!.id)) return prev;
          const next = [...prev, event.ticket!];
          setStoredQueues(next);
          return next;
        });
      } else if (event.type === 'STATE_RESET') {
        setQueues([]);
        setStoredQueues([]);
        setActiveTicket(null);
        setStoredActiveTicket(null);
        if (event.counters && Array.isArray(event.counters)) {
          setCounters(event.counters);
          setStoredCounters(event.counters);
        } else {
          setCounters((prev) => {
            const next = prev.map((c) => ({ ...c, currentTicketId: null }));
            setStoredCounters(next);
            return next;
          });
        }
      }

      // 3. Handle Real-Time Settings Synchronization
      if (event.type === 'AUDIO_UPDATED' && event.audioSettings) {
        setAudioSettings(event.audioSettings);
        setStoredAudio(event.audioSettings);
      } else if (event.type === 'MEDIA_UPDATED' && event.mediaSettings) {
        setMedia(event.mediaSettings);
        setStoredMedia(event.mediaSettings);
      } else if (event.type === 'COMPANY_UPDATED' && event.company) {
        setCompany(event.company);
        setStoredCompany(event.company);
      } else if (event.type === 'SERVICES_UPDATED' && event.services) {
        setServices(event.services);
        setStoredServices(event.services);
      } else if (event.type === 'ACCOUNTS_UPDATED' && Array.isArray(event.penjagaAccounts)) {
        setPenjagaAccounts(event.penjagaAccounts);
        setStoredPenjagaAccounts(event.penjagaAccounts);
        if (event.counters && Array.isArray(event.counters)) {
          setCounters(event.counters);
          setStoredCounters(event.counters);
        }
      } else if (event.type === 'ADMIN_CREDENTIALS_UPDATED' && event.adminCredentials) {
        setStoredAdminCredentials(event.adminCredentials);
      } else if (event.type === 'LAN_SETTINGS_UPDATED' && event.lanSettings) {
        setStoredLanSettings(event.lanSettings);
      } else if (event.type === 'SETTINGS_SYNC') {
        if (event.counters && Array.isArray(event.counters)) {
          setCounters((prevCounters) => {
            const currentStoredQueues = getStoredQueues();
            const merged = event.counters!.map((srvCounter) => {
              if (srvCounter.currentTicketId) return srvCounter;
              // If server counter has currentTicketId null, check if local state or stored queues has active ticket for this counter
              const localCounter = prevCounters.find((c) => c.id === srvCounter.id);
              if (localCounter?.currentTicketId) {
                const stillActive = currentStoredQueues.find(
                  (q) =>
                    q.id === localCounter.currentTicketId &&
                    (q.status === 'calling' || q.status === 'serving')
                );
                if (stillActive) {
                  return { ...srvCounter, currentTicketId: localCounter.currentTicketId };
                }
              }
              const activeInQueues = currentStoredQueues.find(
                (q) =>
                  q.counterId === srvCounter.id &&
                  (q.status === 'calling' || q.status === 'serving')
              );
              if (activeInQueues) {
                return { ...srvCounter, currentTicketId: activeInQueues.id };
              }
              return srvCounter;
            });
            setStoredCounters(merged);
            return merged;
          });
        }
        if (event.queues && Array.isArray(event.queues) && event.queues.length > 0) {
          setQueues((prevQueues) => {
            const mergedMap = new Map<string, QueueItem>();
            prevQueues.forEach((q) => mergedMap.set(q.id, q));
            event.queues!.forEach((srvQ) => {
              const localQ = mergedMap.get(srvQ.id);
              if (!localQ) {
                mergedMap.set(srvQ.id, srvQ);
              } else {
                if (
                  srvQ.status === 'calling' ||
                  srvQ.status === 'serving' ||
                  srvQ.status === 'completed'
                ) {
                  mergedMap.set(srvQ.id, srvQ);
                }
              }
            });
            const merged = Array.from(mergedMap.values());
            setStoredQueues(merged);
            return merged;
          });
        }
        if (event.ticket) {
          setActiveTicket((prev) => prev || event.ticket!);
          setStoredActiveTicket(event.ticket);
        }
        if (event.audioSettings) {
          setAudioSettings(event.audioSettings);
          setStoredAudio(event.audioSettings);
        }
        if (event.mediaSettings) {
          setMedia(event.mediaSettings);
          setStoredMedia(event.mediaSettings);
        }
        if (event.company) {
          setCompany(event.company);
          setStoredCompany(event.company);
        }
        if (event.services) {
          setServices(event.services);
          setStoredServices(event.services);
        }
        if (Array.isArray(event.penjagaAccounts)) {
          setPenjagaAccounts(event.penjagaAccounts);
          setStoredPenjagaAccounts(event.penjagaAccounts);
        }
        if (event.adminCredentials) {
          setStoredAdminCredentials(event.adminCredentials);
        }
        if (event.lanSettings) {
          setStoredLanSettings(event.lanSettings);
        }
      }
    });

    return () => unsubscribe();
  }, [audioSettings]);

  // Handlers for Queue & Counter Mutations
  const handleUpdateCounters = (updatedCounters: Counter[]) => {
    setCounters(updatedCounters);
    setStoredCounters(updatedCounters);
    const event: QueueSyncEvent = {
      type: 'COUNTER_UPDATED',
      counters: updatedCounters,
      timestamp: Date.now(),
      senderId: TAB_INSTANCE_ID,
    };
    broadcastSyncEvent(event);
    setLastSyncEvent(event);
  };

  const handleUpdatePenjagaAccounts = (
    updatedAccounts: PenjagaAccount[],
    syncedCounters?: Counter[]
  ) => {
    setPenjagaAccounts(updatedAccounts);
    setStoredPenjagaAccounts(updatedAccounts);

    if (syncedCounters) {
      setCounters(syncedCounters);
      setStoredCounters(syncedCounters);
    }

    const event: QueueSyncEvent = {
      type: 'ACCOUNTS_UPDATED',
      penjagaAccounts: updatedAccounts,
      ...(syncedCounters ? { counters: syncedCounters } : {}),
      timestamp: Date.now(),
      senderId: TAB_INSTANCE_ID,
    };
    broadcastSyncEvent(event);
    setLastSyncEvent(event);
  };

  const handleAddTicket = (newTicket: QueueItem) => {
    const updated = [...queues, newTicket];
    setQueues(updated);
    setStoredQueues(updated);

    const event: QueueSyncEvent = {
      type: 'TICKET_CREATED',
      ticket: newTicket,
      timestamp: Date.now(),
      senderId: TAB_INSTANCE_ID,
    };
    broadcastSyncEvent(event);
    setLastSyncEvent(event);
  };

  const handleCallTicket = (ticket: QueueItem, counter: Counter) => {
    const callTimestamp = Date.now();
    const updatedTicket: QueueItem = {
      ...ticket,
      status: 'calling',
      counterId: counter.id,
      counterName: counter.name,
      calledAt: new Date(callTimestamp).toISOString(),
      callCount: (ticket.callCount || 0) + 1,
    };

    const updatedQueues = queues.map((q) => (q.id === ticket.id ? updatedTicket : q));
    const updatedCounters = counters.map((c) =>
      c.id === counter.id ? { ...c, status: 'open' as const, currentTicketId: ticket.id } : c
    );

    setQueues(updatedQueues);
    setCounters(updatedCounters);
    setActiveTicket(updatedTicket);
    setStoredQueues(updatedQueues);
    setStoredCounters(updatedCounters);
    setStoredActiveTicket(updatedTicket);

    const event: QueueSyncEvent = {
      type: 'TICKET_CALLED',
      ticket: updatedTicket,
      counter,
      counters: updatedCounters,
      audioSettings,
      timestamp: callTimestamp,
      senderId: TAB_INSTANCE_ID,
    };
    broadcastSyncEvent(event);
    setLastSyncEvent(event);

    // Audio announcement on the initiating desk
    if (audioSettings.enabled) {
      playQueueCall(updatedTicket.number, counter.name, audioSettings, callTimestamp).catch(() => {});
    }
  };

  const handleRecallTicket = (ticket: QueueItem, counter: Counter) => {
    const recallTimestamp = Date.now();
    const updatedTicket: QueueItem = {
      ...ticket,
      status: 'calling',
      counterId: counter.id,
      counterName: counter.name,
      callCount: (ticket.callCount || 0) + 1,
      calledAt: new Date(recallTimestamp).toISOString(),
    };

    const updatedQueues = queues.map((q) => (q.id === ticket.id ? updatedTicket : q));
    const updatedCounters = counters.map((c) =>
      c.id === counter.id ? { ...c, status: 'open' as const, currentTicketId: ticket.id } : c
    );
    setQueues(updatedQueues);
    setCounters(updatedCounters);
    setActiveTicket(updatedTicket);
    setStoredQueues(updatedQueues);
    setStoredCounters(updatedCounters);
    setStoredActiveTicket(updatedTicket);

    const event: QueueSyncEvent = {
      type: 'TICKET_RECALLED',
      ticket: updatedTicket,
      counter,
      counters: updatedCounters,
      audioSettings,
      timestamp: recallTimestamp,
      senderId: TAB_INSTANCE_ID,
    };
    broadcastSyncEvent(event);
    setLastSyncEvent(event);

    if (audioSettings.enabled) {
      playQueueCall(updatedTicket.number, counter.name, audioSettings, recallTimestamp).catch(() => {});
    }
  };

  const handleCompleteTicket = (ticket: QueueItem) => {
    const updatedTicket: QueueItem = {
      ...ticket,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    const updatedQueues = queues.map((q) => (q.id === ticket.id ? updatedTicket : q));
    const updatedCounters = counters.map((c) =>
      c.currentTicketId === ticket.id ? { ...c, currentTicketId: null } : c
    );

    setQueues(updatedQueues);
    setCounters(updatedCounters);
    setStoredQueues(updatedQueues);
    setStoredCounters(updatedCounters);

    if (activeTicket?.id === ticket.id) {
      setActiveTicket(null);
      setStoredActiveTicket(null);
    }

    const event: QueueSyncEvent = {
      type: 'TICKET_COMPLETED',
      ticket: updatedTicket,
      counters: updatedCounters,
      timestamp: Date.now(),
      senderId: TAB_INSTANCE_ID,
    };
    broadcastSyncEvent(event);
    setLastSyncEvent(event);
  };

  const handleSkipTicket = (ticket: QueueItem) => {
    const updatedTicket: QueueItem = {
      ...ticket,
      status: 'skipped',
    };

    const updatedQueues = queues.map((q) => (q.id === ticket.id ? updatedTicket : q));
    const updatedCounters = counters.map((c) =>
      c.currentTicketId === ticket.id ? { ...c, currentTicketId: null } : c
    );

    setQueues(updatedQueues);
    setCounters(updatedCounters);
    setStoredQueues(updatedQueues);
    setStoredCounters(updatedCounters);

    if (activeTicket?.id === ticket.id) {
      setActiveTicket(null);
      setStoredActiveTicket(null);
    }

    const event: QueueSyncEvent = {
      type: 'TICKET_SKIPPED',
      ticket: updatedTicket,
      counters: updatedCounters,
      timestamp: Date.now(),
      senderId: TAB_INSTANCE_ID,
    };
    broadcastSyncEvent(event);
    setLastSyncEvent(event);
  };

  const handleManualCall = (ticketNumber: string, counter: Counter) => {
    // Check if an existing ticket matches
    let target = queues.find(
      (q) => q.number.toUpperCase() === ticketNumber.toUpperCase()
    );

    if (!target) {
      // Create on the fly
      const prefix = ticketNumber.charAt(0).toUpperCase();
      const service = services.find((s) => s.prefix === prefix) || services[0];
      target = {
        id: `tkt-manual-${Date.now()}`,
        number: ticketNumber.toUpperCase(),
        prefix: service.prefix,
        sequenceNumber: 999,
        serviceId: service.id,
        serviceName: service.name,
        counterId: counter.id,
        counterName: counter.name,
        status: 'calling',
        createdAt: new Date().toISOString(),
        calledAt: new Date().toISOString(),
        completedAt: null,
        callCount: 1,
      };
      setQueues([...queues, target]);
      setStoredQueues([...queues, target]);
    }

    handleCallTicket(target, counter);
  };

  const handleAddManualTicket = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    const ticket = generateNextTicket(service, queues);
    handleAddTicket(ticket);
  };

  const handleResetQueues = () => {
    setQueues([]);
    setStoredQueues([]);
    setActiveTicket(null);
    setStoredActiveTicket(null);

    const clearedCounters = counters.map((c) => ({ ...c, currentTicketId: null }));
    setCounters(clearedCounters);
    setStoredCounters(clearedCounters);

    const event: QueueSyncEvent = {
      type: 'STATE_RESET',
      counters: clearedCounters,
      timestamp: Date.now(),
      senderId: TAB_INSTANCE_ID,
    };
    broadcastSyncEvent(event);
    setLastSyncEvent(event);
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    if (session.role === 'server') {
      handleSelectPage('admin');
    } else {
      handleSelectPage('penjaga');
    }
  };

  const handleLogout = () => {
    logoutUserSession();
    setUserSession(null);
    try {
      localStorage.removeItem(STORAGE_ACTIVE_PAGE_KEY);
    } catch {
      // ignore
    }
    handleSelectPage('display');
  };

  const waitingCount = queues.filter((q) => q.status === 'waiting').length;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col print:bg-white print:min-h-0">
      {/* Navigation Bar to switch views */}
      <HeaderNav
        activePage={activePage}
        onSelectPage={handleSelectPage}
        waitingCount={waitingCount}
        userSession={userSession}
        onLogout={handleLogout}
        isFullscreenLocked={activePage === 'display' && isDisplayFullscreen}
      />

      {/* View router for Display, Kiosk, Login, Penjaga, and Server Admin */}
      <div className="flex-1">
        <ErrorBoundary>
          {activePage === 'display' && (
          <DisplayView
            queues={queues}
            counters={counters}
            services={services}
            media={media}
            audioSettings={audioSettings}
            company={company}
            activeTicket={activeTicket}
            lastEvent={lastSyncEvent}
            onFullscreenChange={setIsDisplayFullscreen}
          />
        )}

        {activePage === 'kiosk' && (
          <KioskView
            services={services}
            queues={queues}
            counters={counters}
            company={company}
            audioSettings={audioSettings}
            onAddTicket={handleAddTicket}
          />
        )}

        {activePage === 'login' && (
          <AdminLoginView
            company={company}
            counters={counters}
            penjagaAccounts={penjagaAccounts}
            initialRoleTab="penjaga"
            onLoginSuccess={handleLoginSuccess}
            onPenjagaAccountsUpdated={(updated) => setPenjagaAccounts(updated)}
            onNavigateDisplay={() => handleSelectPage('display')}
            onNavigateKiosk={() => handleSelectPage('kiosk')}
          />
        )}

        {activePage === 'penjaga' && (
          !userSession ? (
            <AdminLoginView
              company={company}
              counters={counters}
              penjagaAccounts={penjagaAccounts}
              initialRoleTab="penjaga"
              onLoginSuccess={handleLoginSuccess}
              onPenjagaAccountsUpdated={(updated) => setPenjagaAccounts(updated)}
              onNavigateDisplay={() => handleSelectPage('display')}
              onNavigateKiosk={() => handleSelectPage('kiosk')}
            />
          ) : (
            <PenjagaView
              queues={queues}
              counters={counters}
              services={services}
              audioSettings={audioSettings}
              company={company}
              activeTicket={activeTicket}
              currentCounterId={userSession.counterId}
              penjagaName={userSession.name}
              userRole={userSession.role}
              onCallTicket={handleCallTicket}
              onRecallTicket={handleRecallTicket}
              onCompleteTicket={handleCompleteTicket}
              onSkipTicket={handleSkipTicket}
              onManualCall={handleManualCall}
              onUpdateCounters={handleUpdateCounters}
              onLogout={handleLogout}
              onNavigateDisplay={() => handleSelectPage('display')}
            />
          )
        )}

        {activePage === 'admin' && (
          !userSession || userSession.role !== 'server' ? (
            <AdminLoginView
              company={company}
              counters={counters}
              penjagaAccounts={penjagaAccounts}
              initialRoleTab="server"
              onLoginSuccess={handleLoginSuccess}
              onPenjagaAccountsUpdated={(updated) => setPenjagaAccounts(updated)}
              onNavigateDisplay={() => handleSelectPage('display')}
              onNavigateKiosk={() => handleSelectPage('kiosk')}
            />
          ) : (
            <AdminView
              queues={queues}
              counters={counters}
              services={services}
              media={media}
              audioSettings={audioSettings}
              company={company}
              activeTicket={activeTicket}
              penjagaAccounts={penjagaAccounts}
              onCallTicket={handleCallTicket}
              onRecallTicket={handleRecallTicket}
              onCompleteTicket={handleCompleteTicket}
              onSkipTicket={handleSkipTicket}
              onUpdateCounters={handleUpdateCounters}
              onUpdatePenjagaAccounts={handleUpdatePenjagaAccounts}
              onUpdateServices={(updated) => {
                setServices(updated);
                setStoredServices(updated);
                broadcastSyncEvent({
                  type: 'SERVICES_UPDATED',
                  services: updated,
                  timestamp: Date.now(),
                  senderId: TAB_INSTANCE_ID,
                });
              }}
              onUpdateMedia={(updated) => {
                setMedia(updated);
                setStoredMedia(updated);
                broadcastSyncEvent({
                  type: 'MEDIA_UPDATED',
                  mediaSettings: updated,
                  timestamp: Date.now(),
                  senderId: TAB_INSTANCE_ID,
                });
              }}
              onUpdateAudio={(updated) => {
                setAudioSettings(updated);
                setStoredAudio(updated);
                broadcastSyncEvent({
                  type: 'AUDIO_UPDATED',
                  audioSettings: updated,
                  timestamp: Date.now(),
                  senderId: TAB_INSTANCE_ID,
                });
              }}
              onUpdateCompany={(updated) => {
                setCompany(updated);
                setStoredCompany(updated);
                broadcastSyncEvent({
                  type: 'COMPANY_UPDATED',
                  company: updated,
                  timestamp: Date.now(),
                  senderId: TAB_INSTANCE_ID,
                });
              }}
              onResetQueues={handleResetQueues}
              onManualCall={handleManualCall}
              onAddManualTicket={handleAddManualTicket}
              onLogout={handleLogout}
            />
          )
        )}
        </ErrorBoundary>
      </div>

      {/* Floating Lightbulb Guide Button & Modal */}
      <HelpGuideModal
        onNavigatePage={setActivePage}
        hiddenInFullscreen={activePage === 'display' && isDisplayFullscreen}
      />
    </div>
  );
}
