'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BusinessWithDetails } from '../lib/api';
import { Badge } from '@ui/components/badge';
import { Card, CardContent } from '@ui/components/card';
import { MapPin, Star, CheckCircle } from 'lucide-react';

interface BusinessCardProps {
  business: BusinessWithDetails;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const primaryLocation = business.locations.find(l => l.isPrimary) || business.locations[0];
  const primaryCategory = business.categories.find(c => c.isPrimary) || business.categories[0];

  return (
    <Link href={`/directory/${business.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
        {/* Image */}
        <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
          {business.coverImage ? (
            <Image
              src={business.coverImage}
              alt={business.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-4xl font-bold text-gray-300 dark:text-gray-600">
                {business.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          {business.featured && (
            <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
              Featured
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Business Name and Verification */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">
              {business.name}
            </h3>
            {business.verified && (
              <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
            )}
          </div>

          {/* Category */}
          {primaryCategory && (
            <Badge className="mb-2">
              {primaryCategory.category.name}
            </Badge>
          )}

          {/* Rating */}
          {business.averageRating && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {business.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({business.reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Location */}
          {primaryLocation && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">
                {primaryLocation.city}, {primaryLocation.state}
              </span>
            </div>
          )}

          {/* Short Description */}
          {business.shortDescription && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {business.shortDescription}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}