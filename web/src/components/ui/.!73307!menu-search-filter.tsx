"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X,
  ChefHat,
  Clock,
  Star,
  Leaf,
  DollarSign,
  Utensils
} from 'lucide-react';
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
  className
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
    prepTime: ''
  });

  const dietaryOptions = [
