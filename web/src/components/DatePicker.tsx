/**
 * Simple Date Picker Component
 * A basic date picker for selecting dates
 */
import React from 'react';
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DatePickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateSelect,
  className = '',
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date(selectedDate));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePreviousMonth = () => {
    setCurrentMonth(subDays(monthStart, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addDays(monthEnd, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    onDateSelect(dateString);
  };

  const isSelected = (date: Date) => {
    return format(date, 'yyyy-MM-dd') === selectedDate;
  };

  const isToday = (date: Date) => {
    return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <CardTitle className="text-lg">{format(currentMonth, 'MMMM yyyy')}</CardTitle>

          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(date => (
            <Button
              key={date.toISOString()}
              variant={isSelected(date) ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 w-8 p-0 ${isToday(date) ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleDateClick(date)}
            >
              {format(date, 'd')}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
