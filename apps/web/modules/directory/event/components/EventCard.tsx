'use client';

import Link from 'next/link';
import Image from 'next/image';
import { EventWithDetails } from '../lib/api';
import { Badge } from '@ui/components/badge';
import { Card, CardContent, CardHeader } from '@ui/components/card';
import { Button } from '@ui/components/button';
import { MapPin, Calendar, Clock, Users, DollarSign, Globe } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: EventWithDetails;
}

export function EventCard({ event }: EventCardProps) {
  const isVirtual = event.isVirtual || event.isHybrid;
  const isInPerson = !event.isVirtual || event.isHybrid;
  const isFree = event.isFree || !event.price || event.price === 0;
  const isFull = event.maxAttendees ? event.registrationCount >= event.maxAttendees : false;

  return (
    <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {isVirtual && (
            <Badge status="info">
              Virtual
            </Badge>
          )}
          {isFree && (
            <Badge status="success">
              Free
            </Badge>
          )}
          {isFull && (
            <Badge status="error">
              Full
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg line-clamp-2">
            {event.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            Hosted by {event.business.name}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date and Time */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(event.startDate), 'MMM d, yyyy')}</span>
          <Clock className="h-4 w-4 text-muted-foreground ml-2" />
          <span>{format(new Date(event.startDate), 'h:mm a')}</span>
        </div>

        {/* Location */}
        {isInPerson && event.city && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="line-clamp-1">
              {event.venue || `${event.city}, ${event.state}`}
            </span>
          </div>
        )}

        {/* Virtual URL indicator */}
        {isVirtual && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span>Online Event</span>
          </div>
        )}

        {/* Attendees and Price */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {event.maxAttendees && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{event.registrationCount}/{event.maxAttendees}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{isFree ? 'Free' : `$${event.price}`}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.shortDescription}
          </p>
        )}

        {/* Actions */}
        <div className="pt-2">
          <Button asChild className="w-full" disabled={isFull}>
            <Link href={`/events/${event.id}`}>
              {isFull ? 'Event Full' : 'View Details'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}