'use client';

import { Search, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@ui/components/input';
import { Button } from '@ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/components/select';

const MINNESOTA_CITIES = [
  'All Cities',
  'Minneapolis',
  'St. Paul',
  'Rochester',
  'Duluth',
  'Bloomington',
  'Plymouth',
  'Woodbury',
  'St. Cloud',
  'Mankato',
];

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (city && city !== 'All Cities') params.append('city', city);
    
    router.push(`/directory/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search businesses, services, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
        
        <div className="relative md:w-64">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10 pointer-events-none" />
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="pl-10 h-12 text-lg">
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              {MINNESOTA_CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button type="submit" size="lg" className="h-12 px-8">
          Search
        </Button>
      </div>
    </form>
  );
}