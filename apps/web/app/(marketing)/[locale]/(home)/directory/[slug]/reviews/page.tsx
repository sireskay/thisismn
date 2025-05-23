'use client';

import { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { Button } from '../../../../../../../modules/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../../../modules/ui/components/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../../../modules/ui/components/dialog';
import { Star, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../../../../../../modules/shared/lib/api-client';
import { ReviewList } from '../../../../../../../modules/directory/review/components/ReviewList';
import { ReviewStats } from '../../../../../../../modules/directory/review/components/ReviewStats';
import { ReviewForm } from '../../../../../../../modules/directory/review/components/ReviewForm';
import Link from 'next/link';
import { useSession } from '../../../../../../../modules/saas/auth/hooks/use-session';

interface BusinessReviewsPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default function BusinessReviewsPage({ params }: BusinessReviewsPageProps) {
  const { slug } = use(params);
  const { user } = useSession();
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch business data
  const { data: business, isLoading } = useQuery({
    queryKey: ['business', slug],
    queryFn: async () => {
      const api = apiClient as any;
      const response = await api.business[':slug'].$get({
        param: { slug },
      });
      
      if (!response.ok) throw new Error('Business not found');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!business) {
    notFound();
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/directory/${slug}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to business details
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{business.name} Reviews</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(business.averageRating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{business.averageRating?.toFixed(1) || '0.0'}</span>
              <span className="text-muted-foreground">({business.reviewCount || 0} reviews)</span>
            </div>
          </div>
          
          <Button onClick={() => setShowReviewForm(true)}>
            Write a Review
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Review Stats Sidebar */}
        <div className="lg:col-span-1">
          <ReviewStats businessId={business.id} />
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
          <ReviewList businessId={business.id} />
        </div>
      </div>

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Write a Review for {business.name}</DialogTitle>
          </DialogHeader>
          <ReviewForm
            businessId={business.id}
            businessName={business.name}
            onSuccess={() => {
              setShowReviewForm(false);
              // Trigger refetch of reviews
              window.location.reload();
            }}
            onCancel={() => setShowReviewForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}