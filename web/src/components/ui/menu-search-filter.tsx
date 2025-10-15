'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, ChefHat, Clock, Star, Leaf, DollarSign, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  className?: string;
}

export function MenuSearchFilter({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  className,
}: SearchFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    dietary: string[];
    priceRange: string;
    rating: string;
    prepTime: string;
  }>({
    dietary: [],
    priceRange: '',
    rating: '',
    prepTime: '',
  });

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
    { id: 'vegan', label: 'Vegan', icon: '🌱' },
    { id: 'protein', label: 'High Protein', icon: '💪' },
    { id: 'gluten-free', label: 'Gluten Free', icon: '🌾' },
    { id: 'traditional', label: 'Traditional', icon: '🏛️' },
    { id: 'kid-friendly', label: 'Kid Friendly', icon: '👶' },
  ];

  const priceRanges = [
    { id: 'under-30', label: 'Under ₹30' },
    { id: '30-50', label: '₹30 - ₹50' },
    { id: '50-70', label: '₹50 - ₹70' },
    { id: 'above-70', label: 'Above ₹70' },
  ];

  const ratingOptions = [
    { id: '4.5+', label: '4.5+ Stars' },
    { id: '4.0+', label: '4.0+ Stars' },
    { id: '3.5+', label: '3.5+ Stars' },
  ];

  const prepTimeOptions = [
    { id: 'under-10', label: 'Under 10 min' },
    { id: '10-15', label: '10-15 min' },
    { id: 'above-15', label: 'Above 15 min' },
  ];

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      All: <Utensils className="h-4 w-4" />,
      Breakfast: <ChefHat className="h-4 w-4" />,
      Lunch: <Utensils className="h-4 w-4" />,
      Snack: <Star className="h-4 w-4" />,
      Dessert: <Leaf className="h-4 w-4" />,
      Curry: <ChefHat className="h-4 w-4" />,
      Side: <Clock className="h-4 w-4" />,
    };
    return icons[category] || <Utensils className="h-4 w-4" />;
  };

  const getActiveFiltersCount = () => {
    return (
      selectedFilters.dietary.length +
      (selectedFilters.priceRange ? 1 : 0) +
      (selectedFilters.rating ? 1 : 0) +
      (selectedFilters.prepTime ? 1 : 0)
    );
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      dietary: [],
      priceRange: '',
      rating: '',
      prepTime: '',
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search for delicious Indian dishes..."
            className={cn(
              'w-full pl-12 pr-12 py-4 text-lg',
              'bg-white border-2 border-gray-200 rounded-2xl',
              'focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500',
              'transition-all duration-200 placeholder:text-gray-400',
              'shadow-sm hover:shadow-md'
            )}
            data-testid="menu-search"
          />

          {/* Clear Search */}
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Suggestions */}
        {searchTerm && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-2">
            <div className="text-xs text-gray-500 px-3 py-2 border-b">Popular searches:</div>
            <div className="space-y-1">
              {['Dal Rice', 'Sambar', 'Dosa', 'Idli'].map(suggestion => (
                <Button
                  key={suggestion}
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchChange(suggestion)}
                  className="w-full justify-start text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Filters & Advanced Filter Button */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <div className="flex gap-2 shrink-0" data-testid="category-filters">
          {categories.map(category => (
            <Button
              key={category}
              variant={category === selectedCategory ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(category)}
              data-testid={`category-${category}`}
              className={cn(
                'gap-2 whitespace-nowrap transition-all duration-200',
                category === selectedCategory
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25'
                  : 'border-gray-300 hover:border-primary-500 hover:text-primary-600'
              )}
            >
              {getCategoryIcon(category)}
              {category}
            </Button>
          ))}
        </div>

        {/* Advanced Filter Toggle */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              'gap-2 border-gray-300 hover:border-primary-500 hover:text-primary-600',
              isFilterOpen && 'border-primary-500 text-primary-600 bg-primary-50'
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge className="bg-primary-600 text-white ml-1">{getActiveFiltersCount()}</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isFilterOpen && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-gray-900">Advanced Filters</h3>
            <div className="flex items-center gap-2">
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterOpen(false)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dietary Preferences */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                Dietary
              </h4>
              <div className="space-y-2">
                {dietaryOptions.map(option => (
                  <label key={option.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFilters.dietary.includes(option.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedFilters(prev => ({
                            ...prev,
                            dietary: [...prev.dietary, option.id],
                          }));
                        } else {
                          setSelectedFilters(prev => ({
                            ...prev,
                            dietary: prev.dietary.filter(d => d !== option.id),
                          }));
                        }
                      }}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Price Range
              </h4>
              <div className="space-y-2">
                {priceRanges.map(range => (
                  <label key={range.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={selectedFilters.priceRange === range.id}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedFilters(prev => ({
                            ...prev,
                            priceRange: range.id,
                          }));
                        }
                      }}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                Rating
              </h4>
              <div className="space-y-2">
                {ratingOptions.map(rating => (
                  <label key={rating.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={selectedFilters.rating === rating.id}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedFilters(prev => ({
                            ...prev,
                            rating: rating.id,
                          }));
                        }
                      }}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{rating.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Prep Time */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Prep Time
              </h4>
              <div className="space-y-2">
                {prepTimeOptions.map(time => (
                  <label key={time.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="prepTime"
                      checked={selectedFilters.prepTime === time.id}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedFilters(prev => ({
                            ...prev,
                            prepTime: time.id,
                          }));
                        }
                      }}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{time.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {getActiveFiltersCount() > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Active Filters:</h5>
              <div className="flex flex-wrap gap-2">
                {selectedFilters.dietary.map(dietary => {
                  const option = dietaryOptions.find(o => o.id === dietary);
                  return (
                    <Badge key={dietary} variant="secondary" className="gap-1">
                      <span>{option?.icon}</span>
                      {option?.label}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFilters(prev => ({
                            ...prev,
                            dietary: prev.dietary.filter(d => d !== dietary),
                          }));
                        }}
                        className="h-auto w-auto p-0 ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}

                {selectedFilters.priceRange && (
                  <Badge variant="secondary" className="gap-1">
                    <DollarSign className="h-3 w-3" />
                    {priceRanges.find(p => p.id === selectedFilters.priceRange)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFilters(prev => ({ ...prev, priceRange: '' }))}
                      className="h-auto w-auto p-0 ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}

                {selectedFilters.rating && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    {ratingOptions.find(r => r.id === selectedFilters.rating)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFilters(prev => ({ ...prev, rating: '' }))}
                      className="h-auto w-auto p-0 ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}

                {selectedFilters.prepTime && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {prepTimeOptions.find(t => t.id === selectedFilters.prepTime)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFilters(prev => ({ ...prev, prepTime: '' }))}
                      className="h-auto w-auto p-0 ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
