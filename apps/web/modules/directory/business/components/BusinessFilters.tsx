'use client';

import { useCategories } from '../../category/lib/api';
import { Label } from '@ui/components/label';
import { Checkbox } from '@ui/components/checkbox';
import { RadioGroup, RadioGroupItem } from '@ui/components/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/components/select';
import { Slider } from '@ui/components/slider';
import { Button } from '@ui/components/button';
import { RotateCcw } from 'lucide-react';

interface BusinessFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
}

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'createdAt', label: 'Recently Added' },
];

export function BusinessFilters({ filters, onFilterChange }: BusinessFiltersProps) {
  const { data: categories } = useCategories({ parentId: undefined });

  const handleReset = () => {
    onFilterChange({
      featured: true,
      verified: true,
      categoryId: undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 px-2 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Sort */}
      <div>
        <Label htmlFor="sort">Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFilterChange({ sortBy: value })}
        >
          <SelectTrigger id="sort" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <div>
        <Label>Categories</Label>
        <RadioGroup
          value={filters.categoryId || 'all'}
          onValueChange={(value) =>
            onFilterChange({ categoryId: value === 'all' ? undefined : value })
          }
          className="mt-2 space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <label
              htmlFor="all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              All Categories
            </label>
          </div>
          {categories?.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <RadioGroupItem value={category.id} id={category.id} />
              <label
                htmlFor={category.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {category.name}
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Business Status */}
      <div className="space-y-3">
        <Label>Business Status</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={filters.verified}
              onCheckedChange={(checked) =>
                onFilterChange({ verified: checked })
              }
            />
            <label
              htmlFor="verified"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Verified Only
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={filters.featured}
              onCheckedChange={(checked) =>
                onFilterChange({ featured: checked })
              }
            />
            <label
              htmlFor="featured"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Featured Only
            </label>
          </div>
        </div>
      </div>

      {/* Distance (if location available) */}
      {filters.lat && filters.lng && (
        <div>
          <Label htmlFor="radius">
            Distance: {filters.radius || 25} miles
          </Label>
          <Slider
            id="radius"
            min={1}
            max={100}
            step={1}
            value={[filters.radius || 25]}
            onValueChange={([value]) => onFilterChange({ radius: value })}
            className="mt-2"
          />
        </div>
      )}
    </div>
  );
}