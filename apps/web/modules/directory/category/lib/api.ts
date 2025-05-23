import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';

// TODO: Remove type assertions once API types are regenerated
const api = apiClient as any;
import type { Category } from '@repo/database';

// Types
export interface CategoryWithCount extends Category {
  children: CategoryWithCount[];
  _count: {
    businesses: number;
  };
}

export interface CategoryTree extends CategoryWithCount {
  parent?: Category;
}

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params?: { parentId?: string; featured?: boolean }) => 
    [...categoryKeys.lists(), params] as const,
  tree: () => [...categoryKeys.all, 'tree'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (slug: string) => [...categoryKeys.details(), slug] as const,
};

// API calls
async function getCategories(params?: { 
  parentId?: string; 
  featured?: boolean 
}): Promise<CategoryWithCount[]> {
  const query = new URLSearchParams();
  
  if (params?.parentId !== undefined) {
    query.append('parentId', params.parentId || 'null');
  }
  
  if (params?.featured !== undefined) {
    query.append('featured', String(params.featured));
  }

  const response = await api.categories.$get({
    query: query as any,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}

async function getCategoryTree(): Promise<CategoryTree[]> {
  const response = await api.categories.tree.$get();

  if (!response.ok) {
    throw new Error('Failed to fetch category tree');
  }

  return response.json();
}

async function getCategoryBySlug(slug: string): Promise<CategoryTree> {
  const response = await api.categories[':slug'].$get({
    param: { slug },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch category');
  }

  return response.json();
}

// Hooks
export function useCategories(params?: { 
  parentId?: string; 
  featured?: boolean 
}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => getCategories(params),
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: getCategoryTree,
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: () => getCategoryBySlug(slug),
    enabled: !!slug,
  });
}

// Utility functions
export function getCategoryPath(category: CategoryTree): Category[] {
  const path: Category[] = [];
  let current = category;
  
  while (current) {
    path.unshift(current);
    current = current.parent as CategoryTree;
  }
  
  return path;
}

export function flattenCategoryTree(categories: CategoryTree[]): Category[] {
  const flattened: Category[] = [];
  
  function traverse(cats: CategoryTree[]) {
    for (const cat of cats) {
      flattened.push(cat);
      if (cat.children?.length > 0) {
        traverse(cat.children);
      }
    }
  }
  
  traverse(categories);
  return flattened;
}