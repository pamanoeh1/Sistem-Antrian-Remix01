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
  broadcastSyncEvent,
  subscribeSyncEvents,
} from './utils/queueStore';
import { generateNextTicket } from './utils/queueLogic';
import { playQueueCall } from './utils/audioVoice';
import {
  getActiveUserSession,
  logoutUserSession,
} from './utils/authStore';
import { UserSession } from './utils/authLogic';
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

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(() =>
    getActiveUserSession()
  );

  // Read initial view from URL query parameter (e.g. ?view=display, ?view=penjaga, ?view=admin, ?view=kiosk, ?view=login)
  const [activePage, setActivePage] = useState<ActivePage>(() => {
    if (typeof window !== 'undefined') {
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
    }
    return 'display';
  });

  const [queues, setQueues] = useState<QueueItem[]>(() => getStoredQueues());
  const [counters, setCounters] = useState<Counter[]>(() => getStoredCounters());
  const [services, setServices] = useState<ServiceCategory[]>(() => getStoredServices());
  const [media, setMedia] = useState<MediaSettings>(() => getStoredMedia());
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => getStoredAudio());
  const [company, setCompany] = useState<CompanyProfile>(() => getStoredCompany());
  const [activeTicket, setActiveTicket] = useState<QueueItem | null>(() => getStoredActiveTicket());
  const [lastSyncEvent, setLastSyncEvent] = useState<QueueSyncEvent | null>(null);

  // Synchronize state across tabs and windows
  const reloadFromStorage = useCallback(() => {
    setQueues(getStoredQueues());
    setCounters(getStoredCounters());
    setServices(getStoredServices());
    setMedia(getStoredMedia());
    setAudioSettings(getStoredAudio());
    setCompany(getStoredCompany());
    setActiveTicket(getStoredActiveTicket());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeSyncEvents((event) => {
      setLastSyncEvent(event);
      reloadFromStorage();

      // Only play audio on receiving tab if NOT originated by this exact same tab (prevents echo/double voice)
      if (event.type === 'TICKET_CALLED' || event.type === 'TICKET_RECALLED') {
        const ticket = event.ticket;
        const counterName = event.counter ? event.counter.name : ticket?.counterName || 'Loket Pelayanan';
        if (ticket && audioSettings.enabled && event.senderId !== TAB_INSTANCE_ID) {
          playQueueCall(ticket.number, counterName, audioSettings, event.timestamp).catch(() => {});
        }
      }
    });

    return () => unsubscribe();
  }, [reloadFromStorage, audioSettings]);

  // Handlers for Queue & Counter Mutations
  const handleUpdateCounters = (updatedCounters: Counter[]) => {
    setCounters(updatedCounters);
    setStoredCounters(updatedCounters);
    const event: QueueSyncEvent = {
      type: 'COUNTER_UPDATED',
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
      callCount: (ticket.callCount || 0) + 1,
      calledAt: new Date(recallTimestamp).toISOString(),
    };

    const updatedQueues = queues.map((q) => (q.id === ticket.id ? updatedTicket : q));
    const updatedCounters = counters.map((c) =>
      c.id === counter.id ? { ...c, status: 'open' as const } : c
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
      timestamp: Date.now(),
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
      timestamp: Date.now(),
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
      timestamp: Date.now(),
    };
    broadcastSyncEvent(event);
    setLastSyncEvent(event);
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    if (session.role === 'server') {
      setActivePage('admin');
    } else {
      setActivePage('penjaga');
    }
  };

  const handleLogout = () => {
    logoutUserSession();
    setUserSession(null);
    setActivePage('display');
  };

  const waitingCount = queues.filter((q) => q.status === 'waiting').length;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Navigation Bar to switch views */}
      <HeaderNav
        activePage={activePage}
        onSelectPage={setActivePage}
        waitingCount={waitingCount}
        userSession={userSession}
        onLogout={handleLogout}
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
          />
        )}

        {activePage === 'kiosk' && (
          <KioskView
            services={services}
            queues={queues}
            company={company}
            audioSettings={audioSettings}
            onAddTicket={handleAddTicket}
          />
        )}

        {activePage === 'login' && (
          <AdminLoginView
            company={company}
            counters={counters}
            initialRoleTab="penjaga"
            onLoginSuccess={handleLoginSuccess}
            onNavigateDisplay={() => setActivePage('display')}
            onNavigateKiosk={() => setActivePage('kiosk')}
          />
        )}

        {activePage === 'penjaga' && (
          !userSession ? (
            <AdminLoginView
              company={company}
              counters={counters}
              initialRoleTab="penjaga"
              onLoginSuccess={handleLoginSuccess}
              onNavigateDisplay={() => setActivePage('display')}
              onNavigateKiosk={() => setActivePage('kiosk')}
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
              onCallTicket={handleCallTicket}
              onRecallTicket={handleRecallTicket}
              onCompleteTicket={handleCompleteTicket}
              onSkipTicket={handleSkipTicket}
              onManualCall={handleManualCall}
              onUpdateCounters={handleUpdateCounters}
              onLogout={handleLogout}
              onNavigateDisplay={() => setActivePage('display')}
            />
          )
        )}

        {activePage === 'admin' && (
          !userSession || userSession.role !== 'server' ? (
            <AdminLoginView
              company={company}
              counters={counters}
              initialRoleTab="server"
              onLoginSuccess={handleLoginSuccess}
              onNavigateDisplay={() => setActivePage('display')}
              onNavigateKiosk={() => setActivePage('kiosk')}
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
              onCallTicket={handleCallTicket}
              onRecallTicket={handleRecallTicket}
              onCompleteTicket={handleCompleteTicket}
              onSkipTicket={handleSkipTicket}
              onUpdateCounters={handleUpdateCounters}
              onUpdateServices={(updated) => {
                setServices(updated);
                setStoredServices(updated);
              }}
              onUpdateMedia={(updated) => {
                setMedia(updated);
                setStoredMedia(updated);
              }}
              onUpdateAudio={(updated) => {
                setAudioSettings(updated);
                setStoredAudio(updated);
              }}
              onUpdateCompany={(updated) => {
                setCompany(updated);
                setStoredCompany(updated);
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
      <HelpGuideModal onNavigatePage={setActivePage} />
    </div>
  );
}
