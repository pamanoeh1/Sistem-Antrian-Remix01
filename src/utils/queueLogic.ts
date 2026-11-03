import { QueueItem, ServiceCategory, Counter, QueueStatus } from '../types/queue';

/**
 * Formats a sequence number into a 3-digit string (e.g. 1 -> "001", 12 -> "012")
 */
export function formatSequenceNumber(num: number): string {
  return num.toString().padStart(3, '0');
}

/**
 * Generates a full ticket number with prefix (e.g. "A-001")
 */
export function formatTicketNumber(prefix: string, seq: number): string {
  return `${prefix.toUpperCase()}-${formatSequenceNumber(seq)}`;
}

/**
 * Creates the next ticket item for a given service category based on current tickets.
 */
export function generateNextTicket(
  service: ServiceCategory,
  existingQueues: QueueItem[],
  customDate?: Date
): QueueItem {
  // Find highest sequence number for this service prefix today
  const samePrefixTickets = existingQueues.filter((q) => q.prefix === service.prefix);
  const maxSeq = samePrefixTickets.reduce((max, item) => Math.max(max, item.sequenceNumber), 0);
  const nextSeq = maxSeq + 1;
  const now = customDate ? customDate.toISOString() : new Date().toISOString();

  return {
    id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    number: formatTicketNumber(service.prefix, nextSeq),
    prefix: service.prefix.toUpperCase(),
    sequenceNumber: nextSeq,
    serviceId: service.id,
    serviceName: service.name,
    counterId: null,
    counterName: null,
    status: 'waiting',
    createdAt: now,
    calledAt: null,
    completedAt: null,
    callCount: 0,
  };
}

/**
 * Counts how many tickets are waiting ahead of a given ticket.
 */
export function getWaitingCountAhead(ticketId: string, queues: QueueItem[]): number {
  const target = queues.find((q) => q.id === ticketId);
  if (!target || target.status !== 'waiting') return 0;

  return queues.filter(
    (q) =>
      q.status === 'waiting' &&
      q.serviceId === target.serviceId &&
      new Date(q.createdAt).getTime() < new Date(target.createdAt).getTime()
  ).length;
}

/**
 * Calculates estimated waiting time in minutes for a ticket.
 */
export function calculateEstimatedWaitTimeMinutes(
  ticketId: string,
  queues: QueueItem[],
  services: ServiceCategory[]
): number {
  const target = queues.find((q) => q.id === ticketId);
  if (!target) return 0;

  const service = services.find((s) => s.id === target.serviceId);
  const avgMinutes = service ? service.estimatedMinutes : 5;
  const ahead = getWaitingCountAhead(ticketId, queues);

  return (ahead + 1) * avgMinutes;
}

/**
 * Finds the next waiting ticket that matches counter's supported services.
 */
export function getNextWaitingTicketForCounter(
  counter: Counter,
  queues: QueueItem[]
): QueueItem | null {
  const waitingTickets = queues
    .filter((q) => q.status === 'waiting' && counter.supportedServiceIds.includes(q.serviceId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return waitingTickets.length > 0 ? waitingTickets[0] : null;
}

/**
 * Converts a ticket number like "A-012" into clear Indonesian spoken words
 * e.g., "A, kosong, satu, dua" for better speech synthesizer clarity.
 */
export function pronounceQueueNumberIndonesian(ticketNumber: string): string {
  const [prefix, numPart] = ticketNumber.split('-');
  const digitWords: Record<string, string> = {
    '0': 'kosong',
    '1': 'satu',
    '2': 'dua',
    '3': 'tiga',
    '4': 'empat',
    '5': 'lima',
    '6': 'enam',
    '7': 'tujuh',
    '8': 'delapan',
    '9': 'sembilan',
  };

  const spokenDigits = (numPart || '')
    .split('')
    .map((d) => digitWords[d] || d)
    .join(' ');

  return `${prefix}, ${spokenDigits}`;
}

/**
 * Generates full spoken call message in natural Indonesian
 * e.g. "Nomor antrean A, kosong satu dua, silakan menuju ke Loket 1"
 */
export function formatIndonesianSpeechPhrase(ticketNumber: string, counterName: string): string {
  const pronouncedNumber = pronounceQueueNumberIndonesian(ticketNumber);
  return `Nomor antrean ${pronouncedNumber}, silakan menuju ke ${counterName}`;
}

/**
 * Filter and search queues for Admin panel
 */
export function filterQueues(
  queues: QueueItem[],
  filters: {
    status?: QueueStatus | 'all';
    serviceId?: string | 'all';
    searchTerm?: string;
  }
): QueueItem[] {
  return queues.filter((item) => {
    if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }
    if (filters.serviceId && filters.serviceId !== 'all' && item.serviceId !== filters.serviceId) {
      return false;
    }
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const term = filters.searchTerm.toLowerCase();
      const matchNumber = item.number.toLowerCase().includes(term);
      const matchService = item.serviceName.toLowerCase().includes(term);
      const matchCounter = item.counterName ? item.counterName.toLowerCase().includes(term) : false;
      if (!matchNumber && !matchService && !matchCounter) {
        return false;
      }
    }
    return true;
  });
}
