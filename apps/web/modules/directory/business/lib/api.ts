import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';

// TODO: Remove type assertions once API types are regenerated
const api = apiClient as any;
import type { Business, BusinessLocation, Category } from '@repo/database';

// Types
export interface BusinessWithDetails extends Business {
  locations: BusinessLocation[];
  categories: Array<{
    categoryId: string;
    category: Category;
    isPrimary: boolean;
  }>;
  averageRating: number | null;
  reviewCount: number;
}

export interface BusinessSearchParams {
  query?: string;
  categoryId?: string;
  city?: string;
  status?: string;
  featured?: boolean;
  verified?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'distance' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface BusinessSearchResponse {
  data: BusinessWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateBusinessInput {
  name: string;
  description?: string;
  shortDescription?: string;
  website?: string;
  email?: string;
  phone?: string;
  yearEstablished?: number;
  categoryIds: string[];
  location: {
    streetAddress: string;
    streetAddress2?: string;
    city: string;
    state?: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  };
}

export interface UpdateBusinessInput extends Partial<CreateBusinessInput> {
  id: string;
}

// Query keys
export const businessKeys = {
  all: ['businesses'] as const,
  lists: () => [...businessKeys.all, 'list'] as const,
  list: (params: BusinessSearchParams) => [...businessKeys.lists(), params] as const,
  details: () => [...businessKeys.all, 'detail'] as const,
  detail: (slug: string) => [...businessKeys.details(), slug] as const,
};

// API calls
async function searchBusinesses(params: BusinessSearchParams): Promise<BusinessSearchResponse> {
  const response = await api.business.search.$get({
    query: params as any,
  });

  if (!response.ok) {
    throw new Error('Failed to search businesses');
  }

  return response.json();
}

async function getBusinessBySlug(slug: string): Promise<BusinessWithDetails> {
  const response = await api.business[':slug'].$get({
    param: { slug },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch business');
  }

  return response.json();
}

async function createBusiness(input: CreateBusinessInput): Promise<BusinessWithDetails> {
  const response = await api.business.$post({
    json: input,
  });

  if (!response.ok) {
    throw new Error('Failed to create business');
  }

  return response.json();
}

async function updateBusiness({ id, ...input }: UpdateBusinessInput): Promise<BusinessWithDetails> {
  const response = await api.business[':id'].$put({
    param: { id },
    json: input,
  });

  if (!response.ok) {
    throw new Error('Failed to update business');
  }

  return response.json();
}

async function deleteBusiness(id: string): Promise<void> {
  const response = await api.business[':id'].$delete({
    param: { id },
  });

  if (!response.ok) {
    throw new Error('Failed to delete business');
  }
}

async function claimBusiness(id: string, data: any): Promise<any> {
  const response = await api.business[':id'].claim.$post({
    param: { id },
    json: data,
  });

  if (!response.ok) {
    throw new Error('Failed to claim business');
  }

  return response.json();
}

// Hooks
export function useBusinessSearch(params: BusinessSearchParams) {
  return useQuery({
    queryKey: businessKeys.list(params),
    queryFn: () => searchBusinesses(params),
  });
}

export function useBusiness(slug: string) {
  return useQuery({
    queryKey: businessKeys.detail(slug),
    queryFn: () => getBusinessBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBusiness,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(data.slug) });
    },
  });
}

export function useDeleteBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}

export function useClaimBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => claimBusiness(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
    },
  });
}