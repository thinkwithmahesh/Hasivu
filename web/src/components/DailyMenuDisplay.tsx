/**
 * Daily Menu Display Component
 * Displays daily menus with date selection and menu management
 */
'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useDailyMenu } from '@/hooks/useDailyMenu';
import { useAuth } from '@/hooks/useAuth';

interface DailyMenuDisplayProps {
  schoolId: string;
  className?: string;
}

export const DailyMenuDisplay: React.FC<DailyMenuDisplayProps> = ({ schoolId, className = '' }) => {
  const { user } = useAuth();
  const {
    currentMenu: _currentMenu,
    selectedDate,
    selectedDateMenus,
    isLoading,
    isLoadingWeekly: _isLoadingWeekly,
    error,
    hasMenuForSelectedDate: _hasMenuForSelectedDate,
    isEmpty,
    hasError,
    loadDailyMenu,
    selectDate,
    refreshMenu,
    dismissError,
  } = useDailyMenu();

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load menu for selected date on mount and when date changes
  useEffect(() => {
    if (schoolId && selectedDate) {
      loadDailyMenu(schoolId, selectedDate);
    }
  }, [schoolId, selectedDate, loadDailyMenu]);

  const handleDateChange = (newDate: string) => {
    selectDate(newDate);
    setShowDatePicker(false);
  };

  const handlePreviousDay = () => {
    const prevDate = subDays(new Date(selectedDate), 1);
    selectDate(format(prevDate, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const nextDate = addDays(new Date(selectedDate), 1);
    selectDate(format(nextDate, 'yyyy-MM-dd'));
  };

  const handleRefresh = () => {
    refreshMenu(schoolId);
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const yesterday = subDays(today, 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    }
    if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return 'Tomorrow';
    }
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    }

    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const getMenuStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getMenuStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  if (hasError && error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={dismissError} className="ml-2">
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Date Navigation */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handlePreviousDay} disabled={isLoading}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formatDisplayDate(selectedDate)}
                </h2>
                <p className="text-sm text-gray-500">
                  {format(new Date(selectedDate), 'yyyy-MM-dd')}
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={handleNextDay} disabled={isLoading}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Pick Date
              </Button>

              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Date Picker */}
        {showDatePicker && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {Array.from({ length: 31 }, (_, i) => {
                const date = addDays(new Date(), i - 15);
                const dateString = format(date, 'yyyy-MM-dd');
                const isSelected = dateString === selectedDate;
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                return (
                  <Button
                    key={dateString}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 w-8 p-0 ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => handleDateChange(dateString)}
                  >
                    {format(date, 'd')}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Menu Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">No Menu Available</h3>
                <p className="text-gray-500 mt-1">
                  There is no menu scheduled for {formatDisplayDate(selectedDate).toLowerCase()}.
                </p>
              </div>
              {user?.role === 'admin' && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Menu
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {selectedDateMenus.map(menu => (
            <Card key={menu.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-xl">{menu.category} Menu</CardTitle>
                    <Badge className={getMenuStatusColor(menu.isActive)}>
                      {getMenuStatusText(menu.isActive)}
                    </Badge>
                  </div>

                  {user?.role === 'admin' && (
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {menu.notes && <p className="text-sm text-gray-600 mt-2">{menu.notes}</p>}
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menu.menuItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {item.preparationTime}min
                          </span>
                          {item.allergens && item.allergens.length > 0 && (
                            <span className="flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Allergens
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{item.price}</p>
                        {!item.available && (
                          <Badge variant="secondary" className="mt-1">
                            Unavailable
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {menu.availableQuantity && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        Available Quantity
                      </span>
                      <span className="font-medium">{menu.availableQuantity} servings</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
