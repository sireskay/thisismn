'use client';

import { useCategories } from '../lib/api';
import { Button } from '@ui/components/button';
import { Skeleton } from '@ui/components/skeleton';
import Link from 'next/link';
import { 
  Utensils, 
  ShoppingBag, 
  Briefcase, 
  Palette, 
  Bed, 
  Star,
  ChevronRight 
} from 'lucide-react';

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  'utensils': Utensils,
  'shopping-bag': ShoppingBag,
  'briefcase': Briefcase,
  'palette': Palette,
  'bed': Bed,
  'star': Star,
};

export function CategoryNav() {
  const { data: categories, isLoading } = useCategories({ 
    parentId: undefined, 
    featured: true 
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Explore Categories
        </h2>
        <Link href="/directory/categories">
          <Button variant="ghost" size="sm">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories?.map((category) => {
          const Icon = categoryIcons[category.icon || 'star'] || Star;
          
          return (
            <Link
              key={category.id}
              href={`/directory/category/${category.slug}`}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="mb-3 flex justify-center">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-full group-hover:bg-primary-200 dark:group-hover:bg-primary-900/30 transition-colors">
                    <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {category._count.businesses} businesses
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}