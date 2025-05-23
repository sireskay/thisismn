'use client';

import { useState } from 'react';
import { useEventSearch } from '../../../../../modules/directory/event/lib/api';
import { EventCard } from '../../../../../modules/directory/event/components/EventCard';
import { EventFilters } from '../../../../../modules/directory/event/components/EventFilters';
import { Skeleton } from '../../../../../modules/ui/components/skeleton';
import { Pagination } from '../../../../../modules/shared/components/Pagination';
import { Alert, AlertDescription } from '../../../../../modules/ui/components/alert';
import { AlertCircle, Calendar } from 'lucide-react';

export default function EventsPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    sortBy: 'startDate' as const,
    sortOrder: 'asc' as const,
  });

  const { data, isLoading, error } = useEventSearch(filters);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Minnesota Business Events
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Discover AI-focused workshops, networking events, and conferences across Minnesota
            </p>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <EventFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
            </aside>

            {/* Events Grid */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Upcoming Events
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {data?.pagination.total || 0} events found
                </p>
              </div>

              {error && (
                <Alert variant="error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error loading events. Please try again later.
                  </AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-[400px] rounded-lg" />
                  ))}
                </div>
              ) : data?.data.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    No events found matching your criteria.
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Try adjusting your filters or check back later for new events.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.data.map((event) => (
                      <EventCard key={event.id} event={event} />
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
        </div>
      </section>
    </div>
  );
}