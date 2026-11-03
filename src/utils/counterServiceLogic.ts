import { Counter, ServiceCategory } from '../types/queue';

/**
 * Validates a proposed prefix for a service category (must be a single capital letter A-Z and unique)
 */
export function validateServicePrefix(
  prefix: string,
  existingServices: ServiceCategory[],
  excludeServiceId?: string
): { valid: boolean; error?: string } {
  const clean = prefix.trim().toUpperCase();
  if (!clean || clean.length !== 1 || !/^[A-Z]$/.test(clean)) {
    return { valid: false, error: 'Prefix harus berupa satu huruf kapital (A-Z)' };
  }

  const isDuplicate = existingServices.some(
    (s) => s.id !== excludeServiceId && s.prefix.toUpperCase() === clean
  );

  if (isDuplicate) {
    return { valid: false, error: `Prefix huruf "${clean}" sudah digunakan oleh layanan lain` };
  }

  return { valid: true };
}

/**
 * Adds a new counter to the counters list
 */
export function addCounter(
  counters: Counter[],
  data: {
    name: string;
    operatorName: string;
    supportedServiceIds: string[];
    status?: 'open' | 'closed' | 'break';
  }
): { success: boolean; updatedCounters: Counter[]; error?: string; newCounter?: Counter } {
  if (!data.name || !data.name.trim()) {
    return { success: false, updatedCounters: counters, error: 'Nama loket tidak boleh kosong' };
  }
  if (!data.operatorName || !data.operatorName.trim()) {
    return { success: false, updatedCounters: counters, error: 'Nama petugas operator tidak boleh kosong' };
  }
  if (!data.supportedServiceIds || data.supportedServiceIds.length === 0) {
    return { success: false, updatedCounters: counters, error: 'Pilih minimal satu layanan untuk loket ini' };
  }

  const newCounter: Counter = {
    id: `loket-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    operatorName: data.operatorName.trim(),
    supportedServiceIds: data.supportedServiceIds,
    currentTicketId: null,
    status: data.status || 'open',
  };

  return {
    success: true,
    updatedCounters: [...counters, newCounter],
    newCounter,
  };
}

/**
 * Updates an existing counter
 */
export function updateCounter(
  counters: Counter[],
  counterId: string,
  updates: Partial<Omit<Counter, 'id'>>
): { success: boolean; updatedCounters: Counter[]; error?: string } {
  const exists = counters.some((c) => c.id === counterId);
  if (!exists) {
    return { success: false, updatedCounters: counters, error: 'Loket tidak ditemukan' };
  }

  const updatedCounters = counters.map((c) => {
    if (c.id === counterId) {
      return { ...c, ...updates };
    }
    return c;
  });

  return { success: true, updatedCounters };
}

/**
 * Deletes a counter
 */
export function deleteCounter(
  counters: Counter[],
  counterId: string
): { success: boolean; updatedCounters: Counter[]; error?: string } {
  if (counters.length <= 1) {
    return { success: false, updatedCounters: counters, error: 'Tidak dapat menghapus loket terakhir. Minimal harus ada 1 loket.' };
  }

  const updatedCounters = counters.filter((c) => c.id !== counterId);
  return { success: true, updatedCounters };
}

/**
 * Adds a new service category
 */
export function addServiceCategory(
  services: ServiceCategory[],
  data: {
    prefix: string;
    name: string;
    description: string;
    icon?: string;
    color?: string;
    estimatedMinutes?: number;
    active?: boolean;
  }
): { success: boolean; updatedServices: ServiceCategory[]; error?: string; newService?: ServiceCategory } {
  const prefixCheck = validateServicePrefix(data.prefix, services);
  if (!prefixCheck.valid) {
    return { success: false, updatedServices: services, error: prefixCheck.error };
  }

  if (!data.name || !data.name.trim()) {
    return { success: false, updatedServices: services, error: 'Nama layanan tidak boleh kosong' };
  }

  const newService: ServiceCategory = {
    id: `srv-${data.prefix.toLowerCase()}-${Date.now()}`,
    prefix: data.prefix.trim().toUpperCase(),
    name: data.name.trim(),
    description: data.description ? data.description.trim() : 'Layanan administrasi',
    icon: data.icon || 'Users',
    color: data.color || 'blue',
    estimatedMinutes: data.estimatedMinutes && data.estimatedMinutes > 0 ? data.estimatedMinutes : 5,
    active: data.active ?? true,
  };

  return {
    success: true,
    updatedServices: [...services, newService],
    newService,
  };
}

/**
 * Updates an existing service category
 */
export function updateServiceCategory(
  services: ServiceCategory[],
  serviceId: string,
  updates: Partial<Omit<ServiceCategory, 'id'>>
): { success: boolean; updatedServices: ServiceCategory[]; error?: string } {
  const target = services.find((s) => s.id === serviceId);
  if (!target) {
    return { success: false, updatedServices: services, error: 'Layanan tidak ditemukan' };
  }

  if (updates.prefix) {
    const prefixCheck = validateServicePrefix(updates.prefix, services, serviceId);
    if (!prefixCheck.valid) {
      return { success: false, updatedServices: services, error: prefixCheck.error };
    }
  }

  const updatedServices = services.map((s) => {
    if (s.id === serviceId) {
      return {
        ...s,
        ...updates,
        prefix: updates.prefix ? updates.prefix.trim().toUpperCase() : s.prefix,
        name: updates.name ? updates.name.trim() : s.name,
      };
    }
    return s;
  });

  return { success: true, updatedServices };
}

/**
 * Deletes a service category
 */
export function deleteServiceCategory(
  services: ServiceCategory[],
  serviceId: string
): { success: boolean; updatedServices: ServiceCategory[]; error?: string } {
  if (services.length <= 1) {
    return { success: false, updatedServices: services, error: 'Tidak dapat menghapus layanan terakhir. Minimal harus ada 1 layanan.' };
  }

  const updatedServices = services.filter((s) => s.id !== serviceId);
  return { success: true, updatedServices };
}
