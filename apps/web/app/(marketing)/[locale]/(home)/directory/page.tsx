'use client';

import { useState } from 'react';
import { BusinessDirectory } from '../../../../../modules/directory/business/components/BusinessDirectory';
import { CategoryNav } from '../../../../../modules/directory/category/components/CategoryNav';
import { AISearchBar } from '../../../../../modules/directory/shared/components/AISearchBar';
import { AIAssistant } from '../../../../../modules/directory/chat/components/AIAssistant';
import { Button } from '../../../../../modules/ui/components/button';
import { MessageCircle, X, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DirectoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Update URL with search params
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/directory?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              AI-Powered Minnesota Business Directory
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Find AI-focused businesses, services, and innovation across Minnesota
            </p>
            <AISearchBar onSearch={handleSearch} />
            <div className="mt-6 flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/directory/map">
                  <MapPin className="h-4 w-4 mr-2" />
                  View Map
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <CategoryNav />
        </div>
      </section>

      {/* Business Directory */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <BusinessDirectory searchQuery={searchQuery} />
        </div>
      </section>

      {/* AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showAIAssistant && (
          <Button
            onClick={() => setShowAIAssistant(true)}
            size="lg"
            className="rounded-full shadow-lg"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            AI Assistant
          </Button>
        )}
      </div>

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)]">
          <AIAssistant onClose={() => setShowAIAssistant(false)} />
        </div>
      )}
    </div>
  );
}