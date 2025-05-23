'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card';
import { Label } from '@ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/components/select';
import { RadioGroup, RadioGroupItem } from '@ui/components/radio-group';
import { Button } from '@ui/components/button';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { Input } from '@ui/components/input';
import { Checkbox } from '@ui/components/checkbox';

interface EventFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
}

export function EventFilters({ filters, onFilterChange }: EventFiltersProps) {
  const handleChange = (key: string, value: any) => {
    onFilterChange({ [key]: value });
  };

  const handleReset = () => {
    onFilterChange({
      isVirtual: undefined,
      isHybrid: undefined,
      city: undefined,
      startDate: undefined,
      endDate: undefined,
      sortBy: 'startDate',
      sortOrder: 'asc',
    });
  };

  return (
    <div className="space-y-6">
      {/* Event Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Event Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="virtual" 
                checked={filters.isVirtual || false}
                onCheckedChange={(checked) => handleChange('isVirtual', checked || undefined)}
              />
              <Label htmlFor="virtual">Virtual Events</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hybrid" 
                checked={filters.isHybrid || false}
                onCheckedChange={(checked) => handleChange('isHybrid', checked || undefined)}
              />
              <Label htmlFor="hybrid">Hybrid Events</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="start-date">From</Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date">To</Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="City name..."
            value={filters.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Sort Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sort By</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              onFilterChange({ sortBy, sortOrder });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startDate-asc">Date (Upcoming First)</SelectItem>
              <SelectItem value="startDate-desc">Date (Latest First)</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="createdAt-desc">Recently Added</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <Button variant="outline" className="w-full" onClick={handleReset}>
        Reset Filters
      </Button>
    </div>
  );
}