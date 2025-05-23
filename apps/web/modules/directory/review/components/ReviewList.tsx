'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@ui/components/card';
import { Button } from '@ui/components/button';
import { Avatar, AvatarFallback, AvatarImage } from '@ui/components/avatar';
import { Star, ThumbsUp, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@shared/lib/api-client';
import { Spinner } from '@shared/components/Spinner';

interface ReviewListProps {
  businessId: string;
}

export function ReviewList({ businessId }: ReviewListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews', businessId, page],
    queryFn: async () => {
      const api = apiClient as any;
      const response = await api.review.$get({
        query: {
          businessId,
          page: page.toString(),
          limit: '10',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Unable to load reviews at this time.</p>
      </Card>
    );
  }

  if (!data?.reviews || data.reviews.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No reviews yet. Be the first to review this business!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.reviews.map((review: any) => (
        <Card key={review.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.user?.avatarUrl} />
                <AvatarFallback>
                  {review.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="font-medium">{review.user?.name || 'Anonymous'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
            
            {review.isVerified && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Verified Purchase
              </span>
            )}
          </div>
          
          {review.title && (
            <h4 className="font-semibold mb-2">{review.title}</h4>
          )}
          
          <p className="text-muted-foreground mb-4">{review.content}</p>
          
          {review.helpfulCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ThumbsUp className="h-4 w-4" />
              <span>{review.helpfulCount} people found this helpful</span>
            </div>
          )}
        </Card>
      ))}
      
      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === data.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}