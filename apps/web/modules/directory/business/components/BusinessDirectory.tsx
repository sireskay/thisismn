'use client';

import { useBusinessSearch } from '../lib/api';
import { BusinessCard } from './BusinessCard';
import { BusinessFilters } from './BusinessFilters';
import { Skeleton } from '@ui/components/skeleton';
import { Pagination } from '@shared/components/Pagination';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@ui/components/alert';
import { AlertCircle } from 'lucide-react';

interface BusinessDirectoryProps {
  searchQuery?: string;
}

export function BusinessDirectory({ searchQuery }: BusinessDirectoryProps) {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    featured: true,
    verified: true,
    query: searchQuery || '',
  });

  const { data, isLoading, error } = useBusinessSearch(filters);

  // Update filters when searchQuery changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      setFilters(prev => ({ ...prev, query: searchQuery, page: 1 }));
    }
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  if (error) {
    return (
      <Alert variant="error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading businesses. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex gap-8">
      {/* Filters Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <BusinessFilters 
          filters={filters} 
          onFilterChange={handleFilterChange} 
        />
      </aside>

      {/* Business Grid */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Featured Businesses
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discover verified businesses in Minnesota
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No businesses found matching your criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.data.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>

            {data && data.pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}