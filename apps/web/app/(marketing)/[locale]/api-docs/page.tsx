import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../modules/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../modules/ui/components/tabs';
import { Badge } from '../../../../modules/ui/components/badge';
import { Button } from '../../../../modules/ui/components/button';
import { Code, Key, Zap, Shield, Globe, Database } from 'lucide-react';
import Link from 'next/link';

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Minnesota Business Directory API</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Access comprehensive business data through our powerful REST API
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/contact">Get API Key</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="https://github.com/thisismn/api-examples" target="_blank">
              View Examples
            </Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Fast & Reliable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              99.9% uptime with response times under 100ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Secure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              API key authentication with HTTPS encryption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Database className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Comprehensive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Access to businesses, events, reviews, and more
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Documentation */}
      <Tabs defaultValue="getting-started" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                All API requests require authentication using an API key
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                <p className="text-muted-foreground mb-2"># Include your API key in the header</p>
                <p>X-API-Key: your_api_key_here</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Base URL</h4>
                <code className="block bg-muted p-2 rounded">
                  https://api.thisismn.com/api/v1
                </code>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Response Format</h4>
                <p className="text-muted-foreground">
                  All responses are returned in JSON format with a consistent structure:
                </p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {...},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge status="info">GET</Badge>
                  <code className="flex-1">/businesses</code>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Search and filter businesses. Supports query, category, city, verified, and featured filters.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge status="info">GET</Badge>
                  <code className="flex-1">/businesses/:id</code>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Get detailed information about a specific business by ID or slug.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge status="info">GET</Badge>
                  <code className="flex-1">/businesses/categories</code>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Get all available business categories.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge status="info">GET</Badge>
                  <code className="flex-1">/events</code>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Get upcoming events with pagination.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge status="info">GET</Badge>
                  <code className="flex-1">/events/:id</code>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Get detailed information about a specific event.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge status="info">GET</Badge>
                  <code className="flex-1">/reviews/business/:businessId</code>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Get reviews for a specific business.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge status="info">GET</Badge>
                  <code className="flex-1">/reviews/business/:businessId/stats</code>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Get review statistics including rating distribution.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X GET "https://api.thisismn.com/api/v1/businesses?query=AI&city=Minneapolis&page=1&limit=10" \\
  -H "X-API-Key: your_api_key_here"`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Get Business Details</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X GET "https://api.thisismn.com/api/v1/businesses/techsolutions-mn" \\
  -H "X-API-Key: your_api_key_here"`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JavaScript/TypeScript Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.thisismn.com/api/v1';

async function searchBusinesses(query) {
  const response = await fetch(\`\${BASE_URL}/businesses?query=\${query}\`, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  
  const data = await response.json();
  return data;
}

// Usage
const results = await searchBusinesses('AI consulting');
console.log(results.data);`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting</CardTitle>
              <CardDescription>
                API usage is limited to ensure fair access for all users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Default Limits</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 1,000 requests per hour</li>
                  <li>• 10,000 requests per day</li>
                  <li>• Burst limit: 100 requests per minute</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Rate Limit Headers</h4>
                <p className="text-muted-foreground">
                  Each response includes headers indicating your current rate limit status:
                </p>
                <ul className="space-y-1 font-mono text-sm">
                  <li>X-RateLimit-Limit: 1000</li>
                  <li>X-RateLimit-Remaining: 950</li>
                  <li>X-RateLimit-Reset: 1640995200</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Exceeding Limits</h4>
                <p className="text-muted-foreground">
                  If you exceed the rate limit, you'll receive a 429 response with a Retry-After header.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Higher Limits?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Contact us for enterprise plans with higher rate limits and additional features.
              </p>
              <Button asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}