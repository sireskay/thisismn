import { notFound } from 'next/navigation';
import { LocaleLink as Link } from '../../../../../../modules/i18n/routing';
import { Button } from '../../../../../../modules/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../../modules/ui/components/card';
import { Badge } from '../../../../../../modules/ui/components/badge';
import { MapPin, Phone, Globe, Mail, Clock, Star, Calendar, Users, DollarSign, Building, Shield, Award, UserCheck } from 'lucide-react';
import { apiClient } from '../../../../../../modules/shared/lib/api-client';

interface BusinessDetailPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default async function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const { slug, locale } = await params;
  try {
    const api = apiClient as any;
    const response = await api.business[':slug'].$get({
      param: { slug },
    });

    if (!response.ok) {
      notFound();
    }

    const business = await response.json();

    if (!business) {
      notFound();
    }

    // Get primary location and category
    const primaryLocation = business.locations?.[0];
    const primaryCategory = business.categories?.find((c: any) => c.isPrimary)?.category;

    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{business.name}</h1>
              <p className="text-xl text-muted-foreground mb-4">{business.shortDescription || business.description}</p>
              <div className="flex items-center gap-4 flex-wrap">
                {primaryCategory && (
                  <Badge status="info" className="text-sm">
                    {primaryCategory.name}
                  </Badge>
                )}
                {business.verified && (
                  <Badge status="success" className="text-sm">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified Business
                  </Badge>
                )}
                {business.featured && (
                  <Badge status="warning" className="text-sm">
                    <Award className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{business.averageRating?.toFixed(1) || '0.0'}</span>
                  <span className="text-muted-foreground">({business.reviewCount || 0} reviews)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/directory/${slug}/contact`}>Contact Business</Link>
              </Button>
              <Button variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Write Review
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About {business.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{business.description || business.shortDescription}</p>
              </CardContent>
            </Card>

            {/* Reviews Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customer Reviews</CardTitle>
                    <CardDescription>
                      See what customers are saying about {business.name}
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/directory/${slug}/reviews`}>
                      View All Reviews
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-bold">{business.averageRating?.toFixed(1) || '0.0'}</div>
                  <div>
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
                    <p className="text-sm text-muted-foreground">
                      Based on {business.reviewCount || 0} reviews
                    </p>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/directory/${slug}/reviews`}>
                    Write a Review
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {primaryLocation && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm">
                        {primaryLocation.streetAddress}
                        {primaryLocation.streetAddress2 && <><br />{primaryLocation.streetAddress2}</>}
                        <br />{primaryLocation.city}, {primaryLocation.state} {primaryLocation.zipCode}
                      </p>
                      <Link href={`https://maps.google.com/?q=${encodeURIComponent(`${primaryLocation.streetAddress} ${primaryLocation.city} ${primaryLocation.state} ${primaryLocation.zipCode}`)}`} target="_blank" className="text-xs text-primary hover:underline">
                        Get Directions
                      </Link>
                    </div>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${business.phone}`} className="text-sm hover:underline">
                      {business.phone}
                    </a>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${business.email}`} className="text-sm hover:underline">
                      {business.email}
                    </a>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                      Visit Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {business.yearEstablished && business.yearEstablished > 0 && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Established {business.yearEstablished}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{business.status === 'ACTIVE' ? 'Active Business' : business.status}</span>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Need AI Solutions?</h3>
                <p className="text-sm mb-4">Connect with this business to explore how AI can transform your operations.</p>
                <Button variant="secondary" className="w-full">
                  Schedule Consultation
                </Button>
              </CardContent>
            </Card>

            {/* Claim Business */}
            {!business.claimedById && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <UserCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Is this your business?</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Claim this listing to manage your business information and respond to reviews.
                      </p>
                      <Button asChild className="w-full">
                        <Link href={`/app/business/claim/${business.id}`}>
                          Claim This Business
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching business:', error);
    notFound();
  }
}