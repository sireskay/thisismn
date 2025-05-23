'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Label } from '@ui/components/label';
import { Input } from '@ui/components/input';
import { Textarea } from '@ui/components/textarea';
import { RadioGroup, RadioGroupItem } from '@ui/components/radio-group';
import { Alert, AlertDescription } from '@ui/components/alert';
import { Star, AlertCircle } from 'lucide-react';
import { apiClient } from '@shared/lib/api-client';
import { useSession } from '@saas/auth/hooks/use-session';

interface ReviewFormProps {
  businessId: string;
  businessName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ businessId, businessName, onSuccess, onCancel }: ReviewFormProps) {
  const router = useRouter();
  const { user } = useSession();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [recommendsBusiness, setRecommendsBusiness] = useState<boolean | null>(null);
  const [visitDate, setVisitDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.length < 10) {
      setError('Review must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const api = apiClient as any;
      const response = await api.reviews.$post({
        json: {
          businessId,
          rating,
          title,
          comment,
          recommendsBusiness: recommendsBusiness || undefined,
          visitDate: visitDate || undefined,
        },
      });

      if (response.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>
          Share your experience with {businessName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label>Overall Rating*</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      value <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium">
                {getRatingLabel(hoveredRating || rating)}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Review Title*</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              required
              maxLength={255}
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review*</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with this business..."
              rows={5}
              required
              minLength={10}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/2000 characters (minimum 10)
            </p>
          </div>

          {/* Recommendation */}
          <div className="space-y-2">
            <Label>Would you recommend this business?</Label>
            <RadioGroup
              value={recommendsBusiness === null ? '' : recommendsBusiness.toString()}
              onValueChange={(value) => setRecommendsBusiness(value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="recommend-yes" />
                <Label htmlFor="recommend-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="recommend-no" />
                <Label htmlFor="recommend-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Visit Date */}
          <div className="space-y-2">
            <Label htmlFor="visitDate">Date of Visit (Optional)</Label>
            <Input
              id="visitDate"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}