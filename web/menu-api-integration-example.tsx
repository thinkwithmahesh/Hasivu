// HASIVU Menu API Integration Example
// This shows how to integrate the new menu APIs with the existing frontend

import React, { useState, useEffect } from 'react';

// MenuItem interface exactly matching the API response
interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  rating: number;
  prepTime: string;
  dietary: string[];
  image: string;
  priceValue: number;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  ingredients?: string[];
  allergens?: string[];
  availability?: {
    days: string[];
    timeSlots: string[];
  };
  schoolSpecific?: {
    ageGroup: string[];
    popularity: number;
    lastOrdered?: string;
  };
}

// API response interface
interface MenuResponse {
  status: 'success' | 'error';
  data?: MenuItem[];
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    categories: string[];
  };
}

// Example React component showing API integration
export default function MenuAPIExample() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [ageGroup, setAgeGroup] = useState('All');

  // 1. Basic API call - Load menu items
  const loadMenuItems = async (
    filters: {
      category?: string;
      search?: string;
      ageGroup?: string;
    } = {}
  ) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'All') {
        params.append('category', filters.category);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.ageGroup && filters.ageGroup !== 'All') {
        params.append('ageGroup', filters.ageGroup);
      }

      const response = await fetch(`/api/menu?${params.toString()}`);
      const data: MenuResponse = await response.json();

      if (data.status === 'success' && data.data) {
        setMenuItems(data.data);
        if (data.meta?.categories) {
          setCategories(['All', ...data.meta.categories]);
        }
      } else {
        console.error('Failed to load menu items:', data.message);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Advanced search API call
  const performAdvancedSearch = async () => {
    setLoading(true);
    try {
      const searchFilters = {
        filters: {
          query: searchTerm,
          categories: selectedCategory !== 'All' ? [selectedCategory] : undefined,
          ageGroups: ageGroup !== 'All' ? [ageGroup] : undefined,
          dietary: ['Vegetarian'], // Example filter
          priceRange: { min: 20, max: 100 },
          sortBy: 'popularity',
          sortOrder: 'desc',
          limit: 20,
        },
      };

      const response = await fetch('/api/menu/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchFilters),
      });

      const data = await response.json();

      if (data.status === 'success' && data.data) {
        setMenuItems(data.data);
        console.log('Search suggestions:', data.meta?.suggestions);
        console.log('Popular searches:', data.meta?.popularSearches);
      }
    } catch (error) {
      console.error('Error performing advanced search:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Get specific menu item details
  const getMenuItemDetails = async (menuId: number) => {
    try {
      const response = await fetch(`/api/menu/${menuId}`);
      const data = await response.json();

      if (data.status === 'success' && data.data) {
        console.log('Menu item details:', data.data);
        // Show detailed nutrition modal, ingredients, etc.
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching menu item details:', error);
    }
  };

  // 4. Load categories with statistics
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories');
      const data = await response.json();

      if (data.status === 'success' && data.data) {
        console.log('Categories with stats:', data.data);
        // Use category data for enhanced filtering, statistics display
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // 5. Admin function - Create new menu item
  const createMenuItem = async (newItem: Partial<MenuItem>) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      const data = await response.json();

      if (data.status === 'success') {
        console.log('Menu item created successfully:', data.data);
        // Refresh menu items
        loadMenuItems();
      } else {
        console.error('Failed to create menu item:', data.message);
      }
    } catch (error) {
      console.error('Error creating menu item:', error);
    }
  };

  // 6. Admin function - Update menu item
  const updateMenuItem = async (menuId: number, updates: Partial<MenuItem>) => {
    try {
      const response = await fetch(`/api/menu/${menuId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.status === 'success') {
        console.log('Menu item updated successfully:', data.data);
        // Update local state
        setMenuItems(items =>
          items.map(item => (item.id === menuId ? { ...item, ...updates } : item))
        );
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    loadMenuItems();
    loadCategories();
  }, []);

  // Handle filter changes
  useEffect(() => {
    loadMenuItems({
      category: selectedCategory,
      search: searchTerm,
      ageGroup,
    });
  }, [selectedCategory, ageGroup]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">HASIVU Menu API Integration Example</h1>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Age Group Filter */}
          <select
            value={ageGroup}
            onChange={e => setAgeGroup(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="All">All Ages</option>
            <option value="6-10">6-10 years</option>
            <option value="11-15">11-15 years</option>
            <option value="16-18">16-18 years</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded flex-1"
          />

          <button
            onClick={performAdvancedSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Advanced Search
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-lg">Loading menu items...</div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(item => (
          <div key={item.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{item.image}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.category}</p>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{item.price}</div>
                <div className="text-sm text-gray-500">⭐ {item.rating}</div>
              </div>
            </div>

            <p className="text-gray-700 mb-3">{item.description}</p>

            <div className="space-y-2">
              {/* Prep Time */}
              <div className="text-sm">
                <span className="font-medium">Prep Time:</span> {item.prepTime}
              </div>

              {/* Dietary Info */}
              <div className="flex flex-wrap gap-1">
                {item.dietary.map(diet => (
                  <span
                    key={diet}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                  >
                    {diet}
                  </span>
                ))}
              </div>

              {/* Nutritional Info */}
              {item.nutritionalInfo && (
                <div className="text-sm bg-gray-50 p-2 rounded">
                  <div className="font-medium mb-1">Nutrition per serving:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span>Calories: {item.nutritionalInfo.calories}</span>
                    <span>Protein: {item.nutritionalInfo.protein}g</span>
                    <span>Fat: {item.nutritionalInfo.fat}g</span>
                  </div>
                </div>
              )}

              {/* School-specific info */}
              {item.schoolSpecific && (
                <div className="text-sm">
                  <span className="font-medium">Popularity:</span> {item.schoolSpecific.popularity}%
                  <span className="ml-2 font-medium">Age Groups:</span>{' '}
                  {item.schoolSpecific.ageGroup.join(', ')}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => getMenuItemDetails(item.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200"
                >
                  View Details
                </button>
                <button
                  onClick={() => updateMenuItem(item.id, { rating: item.rating + 0.1 })}
                  className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded hover:bg-green-200"
                >
                  Rate Up
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && menuItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No menu items found</div>
          <p className="text-gray-400">Try adjusting your filters</p>
        </div>
      )}

      {/* Example Admin Actions */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-2">Admin Actions (Example)</h3>
        <div className="flex gap-2">
          <button
            onClick={() =>
              createMenuItem({
                name: 'Test Dish',
                description: 'A test dish',
                category: 'Lunch',
                price: '₹40',
                rating: 4.0,
                prepTime: '10 min',
                dietary: ['Vegetarian'],
                image: '🍽️',
                priceValue: 40,
              })
            }
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
          >
            Create Test Item
          </button>
        </div>
      </div>
    </div>
  );
}

// Usage notes:
// 1. This component demonstrates all API endpoints
// 2. Error handling is included for production use
// 3. Loading states provide good UX
// 4. The MenuItem interface exactly matches the API
// 5. Both basic and advanced search are demonstrated
// 6. Admin functions show how to modify data
// 7. All filtering options are properly implemented
