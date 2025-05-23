'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card';
import { Button } from '@ui/components/button';
import { Input } from '@ui/components/input';
import { Badge } from '@ui/components/badge';
import { Skeleton } from '@ui/components/skeleton';
import { MapPin, Navigation, Search, Loader2, X } from 'lucide-react';
import Link from 'next/link';

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  business: {
    id: string;
    name: string;
    slug: string;
    category: string;
    address: string;
    rating?: number;
    verified?: boolean;
  };
}

interface BusinessMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (marker: MapMarker) => void;
  height?: string;
}

// Minnesota default center (Minneapolis)
const DEFAULT_CENTER = { lat: 44.9778, lng: -93.2650 };
const DEFAULT_ZOOM = 11;

export function BusinessMap({ 
  markers, 
  center = DEFAULT_CENTER, 
  zoom = DEFAULT_ZOOM,
  onMarkerClick,
  height = '600px' 
}: BusinessMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    setMap(mapInstance);

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, [center, zoom]);

  // Add markers to map
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create info window
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    // Add new markers
    markers.forEach(markerData => {
      const marker = new google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map,
        title: markerData.business.name,
        icon: {
          url: markerData.business.verified 
            ? '/images/map-pin-verified.png' 
            : '/images/map-pin-default.png',
          scaledSize: new google.maps.Size(32, 32),
        },
      });

      marker.addListener('click', () => {
        setSelectedMarker(markerData);
        
        const content = `
          <div class="p-3 min-w-[200px]">
            <h3 class="font-semibold text-lg mb-1">${markerData.business.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${markerData.business.category}</p>
            <p class="text-sm mb-2">${markerData.business.address}</p>
            ${markerData.business.rating ? `
              <div class="flex items-center gap-1 mb-3">
                <span class="text-yellow-500">★</span>
                <span class="text-sm font-medium">${markerData.business.rating.toFixed(1)}</span>
              </div>
            ` : ''}
            <a href="/directory/${markerData.business.slug}" 
               class="inline-block px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
              View Details
            </a>
          </div>
        `;
        
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(map, marker);
        
        if (onMarkerClick) {
          onMarkerClick(markerData);
        }
      });

      markersRef.current.push(marker);
    });
  }, [map, markers, onMarkerClick]);

  // Get user location
  const getUserLocation = () => {
    setIsLoadingLocation(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          
          // Center map on user location
          if (map) {
            map.setCenter(location);
            map.setZoom(13);
            
            // Add user location marker
            new google.maps.Marker({
              position: location,
              map,
              title: 'Your Location',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            });
          }
          
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
        }
      );
    }
  };

  // Find nearest businesses
  const findNearestBusinesses = () => {
    if (!userLocation || !map) return;

    // Calculate distances
    const businessesWithDistance = markers.map(marker => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        marker.lat,
        marker.lng
      );
      return { ...marker, distance };
    });

    // Sort by distance
    businessesWithDistance.sort((a, b) => a.distance - b.distance);

    // Focus on nearest businesses
    const bounds = new google.maps.LatLngBounds();
    businessesWithDistance.slice(0, 5).forEach(marker => {
      bounds.extend(new google.maps.LatLng(marker.lat, marker.lng));
    });
    bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));
    
    map.fitBounds(bounds);
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="relative">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Button
          onClick={getUserLocation}
          disabled={isLoadingLocation}
          className="bg-white text-black hover:bg-gray-100 shadow-md"
          size="sm"
        >
          {isLoadingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          My Location
        </Button>
        
        {userLocation && (
          <Button
            onClick={findNearestBusinesses}
            className="bg-white text-black hover:bg-gray-100 shadow-md"
            size="sm"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Nearest Businesses
          </Button>
        )}
      </div>

      {/* Selected Business Info */}
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 right-4 z-10 max-w-md">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedMarker.business.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedMarker.business.category}</p>
                  <p className="text-sm mt-1">{selectedMarker.business.address}</p>
                  {selectedMarker.business.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-medium">{selectedMarker.business.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMarker(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-4">
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/directory/${selectedMarker.business.slug}`}>
                    View Details
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (map && userLocation) {
                      const directionsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${selectedMarker.lat},${selectedMarker.lng}`;
                      window.open(directionsUrl, '_blank');
                    }
                  }}
                  disabled={!userLocation}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-lg" />
    </div>
  );
}