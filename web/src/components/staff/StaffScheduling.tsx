'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Coffee,
  Moon,
  Sun,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

// API hooks
import { useStaffSchedules, useStaffMembers, useStaffMutations } from '@/hooks/useApiIntegration';
import { useWebSocket } from '@/hooks/useSocket';

// TypeScript interfaces
interface Schedule {
  id: string;
  staffId: string;
  date: string;
  shiftId: string;
  status: 'scheduled' | 'confirmed' | 'absent' | 'sick' | 'completed';
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  notes?: string;
  staff?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    email: string;
    phone: string;
  };
  shift?: Shift;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  isActive: boolean;
  color?: string;
}

const shiftTemplates: Shift[] = [
  {
    id: 'morning',
    name: 'Morning Shift',
    startTime: '06:00',
    endTime: '14:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    isActive: true,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  {
    id: 'afternoon',
    name: 'Afternoon Shift',
    startTime: '14:00',
    endTime: '22:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    isActive: true,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'night',
    name: 'Night Shift',
    startTime: '22:00',
    endTime: '06:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    isActive: true,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'weekend',
    name: 'Weekend Shift',
    startTime: '08:00',
    endTime: '16:00',
    days: ['saturday', 'sunday'],
    isActive: true,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
];

const getShiftIcon = (shiftId: string) => {
  switch (shiftId) {
    case 'morning':
      return <Sun className="w-3 h-3" />;
    case 'afternoon':
      return <Coffee className="w-3 h-3" />;
    case 'night':
      return <Moon className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
};

const ScheduleStatusBadge = ({ status }: { status: Schedule['status'] }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'sick':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'absent':
        return <XCircle className="w-3 h-3" />;
      case 'sick':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <Badge className={`${getStatusStyles()} border capitalize flex items-center gap-1`}>
      {getStatusIcon()}
      {status}
    </Badge>
  );
};

const CalendarView = ({
  schedules,
  staffMembers,
  currentWeek,
  onScheduleClick,
  onCreateSchedule,
}: {
  schedules: Schedule[];
  staffMembers: any[];
  currentWeek: Date;
  onScheduleClick: (schedule: Schedule) => void;
  onCreateSchedule: (date: string, staffId: string) => void;
}) => {
  const weekDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeek]);

  const getSchedulesForDay = (date: Date, staffId: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(s => s.date === dateStr && s.staffId === staffId);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-3 border-b font-medium text-gray-700">Staff</th>
            {weekDays.map((day, index) => (
              <th
                key={index}
                className="text-center p-3 border-b border-l font-medium text-gray-700 min-w-[120px]"
              >
                <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-sm text-gray-500">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staffMembers.map(staff => (
            <tr key={staff.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={staff.avatar} alt={staff.name} />
                    <AvatarFallback>
                      {staff.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{staff.name}</p>
                    <p className="text-xs text-gray-500">{staff.role}</p>
                  </div>
                </div>
              </td>
              {weekDays.map((day, dayIndex) => {
                const daySchedules = getSchedulesForDay(day, staff.id);
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <td
                    key={dayIndex}
                    className={`p-2 border-b border-l ${isToday ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="space-y-1 min-h-[80px]">
                      {daySchedules.map(schedule => {
                        const shift = shiftTemplates.find(s => s.id === schedule.shiftId);
                        return (
                          <motion.div
                            key={schedule.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-2 rounded text-xs cursor-pointer hover:shadow-md transition-shadow ${
                              shift?.color || 'bg-gray-100'
                            }`}
                            onClick={() => onScheduleClick(schedule)}
                            data-testid={`schedule-${schedule.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {getShiftIcon(schedule.shiftId)}
                                <span className="font-medium">
                                  {shift?.startTime} - {shift?.endTime}
                                </span>
                              </div>
                            </div>
                            {schedule.status !== 'scheduled' && (
                              <div className="mt-1">
                                <ScheduleStatusBadge status={schedule.status} />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                      {daySchedules.length === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-full opacity-0 hover:opacity-100 transition-opacity"
                          onClick={() =>
                            onCreateSchedule(day.toISOString().split('T')[0], staff.id)
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CreateScheduleDialog = ({
  onCreateSchedule,
  staffMembers,
  initialDate,
  initialStaffId,
}: {
  onCreateSchedule: (schedule: Partial<Schedule>) => void;
  staffMembers: any[];
  initialDate?: string;
  initialStaffId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState<Partial<Schedule>>({
    staffId: initialStaffId || '',
    date: initialDate || new Date().toISOString().split('T')[0],
    shiftId: 'morning',
    status: 'scheduled',
    notes: '',
  });

  const handleSubmit = () => {
    if (scheduleData.staffId && scheduleData.date && scheduleData.shiftId) {
      onCreateSchedule(scheduleData);
      setOpen(false);
      setScheduleData({
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        shiftId: 'morning',
        status: 'scheduled',
        notes: '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="create-schedule-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Schedule</DialogTitle>
          <DialogDescription>Add a new schedule for a staff member</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="staff">Staff Member</Label>
            <Select
              value={scheduleData.staffId}
              onValueChange={value => setScheduleData({ ...scheduleData, staffId: value })}
            >
              <SelectTrigger id="staff" data-testid="schedule-staff-select">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name} - {staff.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={scheduleData.date}
              onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })}
              data-testid="schedule-date-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift">Shift</Label>
            <Select
              value={scheduleData.shiftId}
              onValueChange={value => setScheduleData({ ...scheduleData, shiftId: value })}
            >
              <SelectTrigger id="shift" data-testid="schedule-shift-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {shiftTemplates.map(shift => (
                  <SelectItem key={shift.id} value={shift.id}>
                    <div className="flex items-center gap-2">
                      {getShiftIcon(shift.id)}
                      <span>{shift.name}</span>
                      <span className="text-xs text-gray-500">
                        ({shift.startTime} - {shift.endTime})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Any special notes..."
              value={scheduleData.notes}
              onChange={e => setScheduleData({ ...scheduleData, notes: e.target.value })}
              data-testid="schedule-notes-input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} data-testid="submit-schedule-button">
            Create Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function StaffScheduling() {
  const { toast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Fetch data from backend
  const {
    data: schedulesData,
    loading: schedulesLoading,
    error: schedulesError,
    refetch: refetchSchedules,
  } = useStaffSchedules({
    startDate: new Date(
      currentWeek.getFullYear(),
      currentWeek.getMonth(),
      currentWeek.getDate() - currentWeek.getDay()
    ).toISOString(),
    endDate: new Date(
      currentWeek.getFullYear(),
      currentWeek.getMonth(),
      currentWeek.getDate() - currentWeek.getDay() + 6
    ).toISOString(),
  });
  const { data: staffData, loading: staffLoading } = useStaffMembers();
  const { createSchedule } = useStaffMutations();

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    onMessage: (event: string, _data: any) => {
      if (
        event === 'schedule.updated' ||
        event === 'schedule.created' ||
        event === 'schedule.deleted'
      ) {
        refetchSchedules();
      }
    },
  });

  // Process schedules data
  const schedules = useMemo(() => {
    if (!schedulesData) return [];
    return schedulesData;
  }, [schedulesData]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalScheduled = schedules.length;
    const confirmed = schedules.filter(s => s.status === 'confirmed').length;
    const absent = schedules.filter(s => s.status === 'absent').length;
    const completed = schedules.filter(s => s.status === 'completed').length;

    const totalHours = schedules.reduce((sum, s) => {
      if (s.hoursWorked) return sum + s.hoursWorked;
      const shift = shiftTemplates.find(sh => sh.id === s.shiftId);
      if (shift) {
        const start = parseInt(shift.startTime.split(':')[0]);
        const end = parseInt(shift.endTime.split(':')[0]);
        return sum + (end > start ? end - start : 24 - start + end);
      }
      return sum;
    }, 0);

    return {
      totalScheduled,
      confirmed,
      absent,
      completed,
      totalHours,
      attendanceRate:
        totalScheduled > 0 ? Math.round(((confirmed + completed) / totalScheduled) * 100) : 0,
    };
  }, [schedules]);

  const handleCreateSchedule = async (scheduleData: Partial<Schedule>) => {
    try {
      await createSchedule(scheduleData);
      toast({
        title: 'Schedule Created',
        description: 'The schedule has been created successfully.',
      });
      refetchSchedules();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create schedule. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
  };

  const handleQuickCreateSchedule = (date: string, staffId: string) => {
    // Open dialog with pre-filled data
    handleCreateSchedule({
      staffId,
      date,
      shiftId: 'morning',
      status: 'scheduled',
    });
  };

  if (schedulesLoading || staffLoading) {
    return (
      <div className="space-y-6" data-testid="staff-scheduling">
        {/* Header (always visible) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Staff Scheduling</h2>
            <p className="text-gray-600">Manage staff shifts and schedules</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleWeekChange('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 bg-gray-100 rounded">
              <span className="font-medium">
                {currentWeek.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={() => handleWeekChange('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <CreateScheduleDialog
              onCreateSchedule={handleCreateSchedule}
              staffMembers={staffData || []}
            />
          </div>
        </div>

        {/* Loading State */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Loading schedules...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (schedulesError) {
    return (
      <div className="space-y-6" data-testid="staff-scheduling">
        {/* Header (always visible) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Staff Scheduling</h2>
            <p className="text-gray-600">Manage staff shifts and schedules</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleWeekChange('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 bg-gray-100 rounded">
              <span className="font-medium">
                {currentWeek.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={() => handleWeekChange('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <CreateScheduleDialog
              onCreateSchedule={handleCreateSchedule}
              staffMembers={staffData || []}
            />
          </div>
        </div>

        {/* Error State */}
        <div className="text-center py-12">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load schedules. Please try again.</p>
          <Button onClick={refetchSchedules} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="staff-scheduling">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Scheduling</h2>
          <p className="text-gray-600">Manage staff shifts and schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleWeekChange('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 bg-gray-100 rounded">
            <span className="font-medium">
              {currentWeek.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={() => handleWeekChange('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <CreateScheduleDialog
            onCreateSchedule={handleCreateSchedule}
            staffMembers={staffData || []}
          />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Scheduled</p>
                <p className="text-2xl font-bold">{metrics.totalScheduled}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{metrics.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{metrics.absent}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold">{metrics.totalHours}h</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold">{metrics.attendanceRate}%</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Click on empty slots to add schedules, or on existing schedules to edit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarView
            schedules={schedules}
            staffMembers={staffData || []}
            currentWeek={currentWeek}
            onScheduleClick={handleScheduleClick}
            onCreateSchedule={handleQuickCreateSchedule}
          />
        </CardContent>
      </Card>

      {/* Shift Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Shift Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {shiftTemplates.map(shift => (
              <div
                key={shift.id}
                className={`flex items-center gap-2 px-3 py-2 rounded border ${shift.color}`}
              >
                {getShiftIcon(shift.id)}
                <span className="font-medium">{shift.name}</span>
                <span className="text-xs">
                  ({shift.startTime} - {shift.endTime})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Schedule Details */}
      {selectedSchedule && (
        <Dialog open={!!selectedSchedule} onOpenChange={() => setSelectedSchedule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Staff Member</Label>
                <p className="font-medium">{selectedSchedule.staff?.name}</p>
              </div>
              <div>
                <Label>Date</Label>
                <p className="font-medium">
                  {new Date(selectedSchedule.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label>Shift</Label>
                <p className="font-medium">
                  {shiftTemplates.find(s => s.id === selectedSchedule.shiftId)?.name}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <ScheduleStatusBadge status={selectedSchedule.status} />
              </div>
              {selectedSchedule.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-gray-600">{selectedSchedule.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedSchedule(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Real-time updates disconnected</span>
        </div>
      )}
    </div>
  );
}
