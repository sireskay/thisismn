'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BusinessMap } from '../../../../../../modules/directory/map/components/BusinessMap';
import { BusinessFilters } from '../../../../../../modules/directory/business/components/BusinessFilters';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../modules/ui/components/card';
import { Button } from '../../../../../../modules/ui/components/button';
import { Input } from '../../../../../../modules/ui/components/input';
import { Skeleton } from '../../../../../../modules/ui/components/skeleton';
import { Alert, AlertDescription } from '../../../../../../modules/ui/components/alert';
import { Search, Map, List, AlertCircle, MapPin } from 'lucide-react';
import { apiClient } from '../../../../../../modules/shared/lib/api-client';
import Link from 'next/link';
import Script from 'next/script';

interface Business {
  id: string;
  name: string;
  slug: string;
  locations: Array<{
    latitude: number;
    longitude: number;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  }>;
  categories: Array<{
    category: {
      name: string;
    };
  }>;
  averageRating?: number;
  verified: boolean;
}

export default function DirectoryMapPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 100, // Load more for map view
    featured: false,
    verified: true,
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Fetch businesses
  const { data, isLoading, error } = useQuery({
    queryKey: ['businesses', 'map', filters],
    queryFn: async () => {
      const api = apiClient as any;
      const response = await api.business.search.$get({
        query: filters as any,
      });
      
      if (!response.ok) throw new Error('Failed to fetch businesses');
      return response.json() as Promise<{
        data: Business[];
        pagination: any;
      }>;
    },
  });

  // Convert businesses to map markers
  const markers = data?.data
    .filter(business => business.locations.length > 0 && business.locations[0].latitude)
    .map(business => {
      const location = business.locations[0];
      const category = business.categories[0]?.category.name || 'Business';
      
      return {
        id: business.id,
        lat: location.latitude,
        lng: location.longitude,
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          category,
          address: `${location.streetAddress}, ${location.city}, ${location.state} ${location.zipCode}`,
          rating: business.averageRating,
          verified: business.verified,
        },
      };
    }) || [];

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading businesses. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {/* Load Google Maps */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setMapLoaded(true)}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Business Map</h1>
                <p className="text-muted-foreground">
                  Explore AI-focused businesses across Minnesota
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'map' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                >
                  <Map className="h-4 w-4 mr-1" />
                  Map
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <BusinessFilters 
                    filters={filters} 
                    onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
                  />
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[600px] w-full rounded-lg" />
                </div>
              ) : viewMode === 'map' ? (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {mapLoaded ? (
                      <BusinessMap 
                        markers={markers}
                        height="70vh"
                      />
                    ) : (
                      <div className="h-[600px] flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-muted-foreground">Loading map...</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {markers.map((marker) => (
                    <Card key={marker.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <Link href={`/directory/${marker.business.slug}`} className="block">
                          <h3 className="font-semibold text-lg mb-1">{marker.business.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{marker.business.category}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>{marker.business.address}</span>
                          </div>
                          {marker.business.rating && (
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-yellow-500">★</span>
                              <span className="text-sm font-medium">{marker.business.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}