import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';
import type { Event, EventStatus } from '@repo/database';

const api = apiClient as any;

// Types
export interface EventWithDetails extends Event {
  business: {
    id: string;
    name: string;
    slug: string;
    locations: Array<{
      city: string;
      state: string;
    }>;
  };
  registrationCount: number;
}

export interface EventSearchParams {
  query?: string;
  businessId?: string;
  isVirtual?: boolean;
  isHybrid?: boolean;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: 'startDate' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface EventSearchResponse {
  data: EventWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateEventInput {
  businessId: string;
  title: string;
  description: string;
  shortDescription?: string;
  isVirtual?: boolean;
  isHybrid?: boolean;
  startDate: string;
  endDate: string;
  venue?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  virtualUrl?: string;
  maxAttendees?: number;
  price?: number;
  currency?: string;
  registrationRequired?: boolean;
  registrationUrl?: string;
  tags?: string[];
  images?: string[];
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params: EventSearchParams) => [...eventKeys.lists(), params] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  registrations: (eventId: string) => [...eventKeys.all, 'registrations', eventId] as const,
};

// API calls
async function searchEvents(params: EventSearchParams): Promise<EventSearchResponse> {
  const response = await api.events.search.$get({
    query: params as any,
  });

  if (!response.ok) {
    throw new Error('Failed to search events');
  }

  return response.json();
}

async function getEventById(id: string): Promise<EventWithDetails> {
  const response = await api.events[':id'].$get({
    param: { id },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch event');
  }

  return response.json();
}

async function createEvent(input: CreateEventInput): Promise<EventWithDetails> {
  const response = await api.events.$post({
    json: input,
  });

  if (!response.ok) {
    throw new Error('Failed to create event');
  }

  return response.json();
}

async function updateEvent({ id, ...input }: UpdateEventInput): Promise<EventWithDetails> {
  const response = await api.events[':id'].$put({
    param: { id },
    json: input,
  });

  if (!response.ok) {
    throw new Error('Failed to update event');
  }

  return response.json();
}

async function deleteEvent(id: string): Promise<void> {
  const response = await api.events[':id'].$delete({
    param: { id },
  });

  if (!response.ok) {
    throw new Error('Failed to delete event');
  }
}

async function registerForEvent(eventId: string, data: any): Promise<any> {
  const response = await api.events[':id'].register.$post({
    param: { id: eventId },
    json: data,
  });

  if (!response.ok) {
    throw new Error('Failed to register for event');
  }

  return response.json();
}

async function cancelRegistration(eventId: string): Promise<void> {
  const response = await api.events[':id'].register.$delete({
    param: { id: eventId },
  });

  if (!response.ok) {
    throw new Error('Failed to cancel registration');
  }
}

// Hooks
export function useEventSearch(params: EventSearchParams) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => searchEvents(params),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => getEventById(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEvent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(data.id) });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) => registerForEvent(eventId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.registrations(variables.eventId) });
    },
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelRegistration,
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.registrations(eventId) });
    },
  });
}