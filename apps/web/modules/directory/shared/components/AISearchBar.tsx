'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Sparkles, Loader2, X } from 'lucide-react';
import { Input } from '../../../ui/components/input';
import { Button } from '../../../ui/components/button';
import { Card, CardContent } from '../../../ui/components/card';
import { Badge } from '../../../ui/components/badge';
import { useDebounce } from '../../../shared/hooks/use-debounce';
import { apiClient } from '../../../shared/lib/api-client';
import Link from 'next/link';

interface AISearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  category?: string;
  relevanceScore?: number;
}

interface AISearchResponse {
  success: boolean;
  data: {
    results: SearchSuggestion[];
    searchEnhancements: {
      keywords: string[];
      businessTypes: string[];
      services: string[];
      intent: string;
    };
    recommendations?: string[];
    totalResults: number;
  };
}

export function AISearchBar({ placeholder = 'Search for AI-powered businesses...', className, onSearch }: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // AI-powered search
  const performAISearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setAiRecommendations([]);
      return;
    }

    setIsSearching(true);
    try {
      const api = apiClient as any;
      const response = await api.business['ai-search'].$post({
        json: {
          query: searchQuery,
          includeRecommendations: true,
          limit: 6,
        },
      });

      if (response.ok) {
        const data: AISearchResponse = await response.json();
        if (data.success) {
          setSuggestions(data.data.results);
          setAiRecommendations(data.data.recommendations || []);
          setShowDropdown(true);
        }
      }
    } catch (error) {
      console.error('AI search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Perform search on debounced query change
  useEffect(() => {
    if (debouncedQuery) {
      performAISearch(debouncedQuery);
    } else {
      setSuggestions([]);
      setAiRecommendations([]);
      setShowDropdown(false);
    }
  }, [debouncedQuery, performAISearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query);
      setShowDropdown(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setAiRecommendations([]);
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-24"
            onFocus={() => query && setShowDropdown(true)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="flex items-center gap-1"
              disabled={!query.trim() || isSearching}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Search</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* AI-Powered Dropdown */}
      {showDropdown && (suggestions.length > 0 || aiRecommendations.length > 0) && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg max-h-[500px] overflow-y-auto">
          <CardContent className="p-4">
            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">AI Recommendations</span>
                </div>
                <div className="space-y-1">
                  {aiRecommendations.map((recommendation, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      • {recommendation}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {suggestions.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-2">
                  Business Results
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href={`/directory/${suggestion.slug}`}
                      className="block hover:bg-muted rounded-lg p-3 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{suggestion.name}</h4>
                          {suggestion.shortDescription && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {suggestion.shortDescription}
                            </p>
                          )}
                        </div>
                        {suggestion.category && (
                          <Badge status="info" className="ml-2 text-xs">
                            {suggestion.category}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* View All Results */}
            {suggestions.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (onSearch) {
                      onSearch(query);
                    }
                    setShowDropdown(false);
                  }}
                >
                  View All Results
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}