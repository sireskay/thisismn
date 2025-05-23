'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card';
import { Progress } from '@ui/components/progress';
import { Star } from 'lucide-react';
import { apiClient } from '@shared/lib/api-client';
import { Spinner } from '@shared/components/Spinner';

interface ReviewStatsProps {
  businessId: string;
}

export function ReviewStats({ businessId }: ReviewStatsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['review-stats', businessId],
    queryFn: async () => {
      const api = apiClient as any;
      const response = await api.review.stats.$get({
        query: { businessId },
      });
      
      if (!response.ok) throw new Error('Failed to fetch review stats');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rating Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const ratingDistribution = data.ratingDistribution || {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  const totalReviews = Object.values(ratingDistribution).reduce((sum: number, count: any) => sum + count, 0) as number;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rating Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Average Rating */}
          <div className="text-center pb-4 border-b">
            <div className="text-4xl font-bold">{data.averageRating?.toFixed(1) || '0.0'}</div>
            <div className="flex items-center justify-center mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(data.averageRating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{totalReviews} reviews</p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm">{rating}</span>
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Categories */}
          {data.categoryRatings && Object.keys(data.categoryRatings).length > 0 && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Category Ratings</h4>
                <div className="space-y-2">
                  {Object.entries(data.categoryRatings).map(([category, rating]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}