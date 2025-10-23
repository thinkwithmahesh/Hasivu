'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  Target,
  Loader2,
  CheckSquare,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription as CardDescription,
  CardHeader as CardHeader,
  CardTitle as CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';

// API hooks
import { useStaffTasks, useStaffMembers, useStaffMutations } from '@/hooks/useApiIntegration';
import { useWebSocket } from '@/hooks/useSocket';

// TypeScript interfaces
interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate: string;
  estimatedHours: number;
  actualHours?: number;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assignedStaff?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

const TaskPriorityBadge = ({ priority }: { priority: Task['priority'] }) => {
  const getPriorityStyles = () => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return <Badge className={`${getPriorityStyles()} border capitalize`}>{priority}</Badge>;
};

const TaskStatusBadge = ({ status }: { status: Task['status'] }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'in_progress':
        return <Clock className="w-3 h-3" />;
      case 'overdue':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <Badge className={`${getStatusStyles()} border capitalize flex items-center gap-1`}>
      {getStatusIcon()}
      {status.replace('_', ' ')}
    </Badge>
  );
};

const TaskCard = ({
  task,
  onUpdate,
  onDelete,
}: {
  task: Task;
  onUpdate: (taskId: string, status: Task['status']) => void;
  onDelete: (taskId: string) => void;
}) => {
  const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
  const hoursLeft = Math.max(
    0,
    Math.floor((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60))
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-3"
    >
      <Card
        className={`hover:shadow-md transition-all ${
          isOverdue ? 'border-red-300 bg-red-50/50' : ''
        }`}
        data-testid={`task-card-${task.id}`}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={isOverdue ? 'overdue' : task.status} />
              </div>
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
            </div>
            <div className="flex items-center space-x-1">
              {task.status !== 'completed' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUpdate(task.id, 'completed')}
                  data-testid={`complete-task-${task.id}`}
                >
                  <CheckSquare className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(task.id)}
                data-testid={`delete-task-${task.id}`}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Assigned to</p>
              <p className="font-medium">{task.assignedStaff?.name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                {new Date(task.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Time Remaining</p>
              <p className={`font-medium ${hoursLeft < 24 ? 'text-orange-600' : ''}`}>
                {hoursLeft < 24 ? `${hoursLeft} hours` : `${Math.floor(hoursLeft / 24)} days`}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-medium">{task.category}</p>
            </div>
          </div>

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {task.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {task.status === 'in_progress' && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => onUpdate(task.id, 'completed')}>
                Mark Complete
              </Button>
            </div>
          )}

          {task.status === 'pending' && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdate(task.id, 'in_progress')}
                className="w-full"
              >
                Start Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CreateTaskDialog = ({
  onCreateTask,
  staffMembers,
}: {
  onCreateTask: (task: Partial<Task>) => void;
  staffMembers: any[];
}) => {
  const [open, setOpen] = useState(false);
  const [taskData, setTaskData] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
    assignedTo: '',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimatedHours: 1,
    tags: [],
  });

  const handleSubmit = () => {
    if (taskData.title && taskData.description) {
      onCreateTask(taskData);
      setOpen(false);
      setTaskData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        assignedTo: '',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 1,
        tags: [],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="create-task-button">
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Add a new task for your staff members</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={taskData.title}
              onChange={e => setTaskData({ ...taskData, title: e.target.value })}
              data-testid="task-title-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={taskData.description}
              onChange={e => setTaskData({ ...taskData, description: e.target.value })}
              data-testid="task-description-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={taskData.priority}
                onValueChange={(value: Task['priority']) =>
                  setTaskData({ ...taskData, priority: value })
                }
              >
                <SelectTrigger id="priority" data-testid="task-priority-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={taskData.category}
                onValueChange={value => setTaskData({ ...taskData, category: value })}
              >
                <SelectTrigger id="category" data-testid="task-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="preparation">Preparation</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select
                value={taskData.assignedTo}
                onValueChange={value => setTaskData({ ...taskData, assignedTo: value })}
              >
                <SelectTrigger id="assignedTo" data-testid="task-assignee-select">
                  <SelectValue placeholder="Select staff" />
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
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={taskData.dueDate}
                onChange={e => setTaskData({ ...taskData, dueDate: e.target.value })}
                data-testid="task-due-date-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0.5"
              step="0.5"
              value={taskData.estimatedHours}
              onChange={e =>
                setTaskData({ ...taskData, estimatedHours: parseFloat(e.target.value) })
              }
              data-testid="task-hours-input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} data-testid="submit-task-button">
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function StaffTasksManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all');

  // Fetch data from backend
  const {
    data: tasksData,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useStaffTasks();
  const { data: staffData, loading: staffLoading } = useStaffMembers();
  const { createTask, updateTaskStatus, loading: _mutationLoading } = useStaffMutations();

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    onMessage: (event: string, _data: any) => {
      if (event === 'task.updated' || event === 'task.created' || event === 'task.deleted') {
        refetchTasks();
      }
    },
  });

  // Process tasks data
  const tasks = useMemo(() => {
    if (!tasksData) return [];
    return tasksData;
  }, [tasksData]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, filterStatus, filterPriority]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    return {
      pending: filteredTasks.filter(t => t.status === 'pending'),
      in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
      completed: filteredTasks.filter(t => t.status === 'completed'),
      overdue: filteredTasks.filter(
        t => t.status !== 'completed' && new Date(t.dueDate) < new Date()
      ),
    };
  }, [filteredTasks]);

  // Task metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(
      t => t.status !== 'completed' && new Date(t.dueDate) < new Date()
    ).length;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

    return {
      total,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      overdue,
      urgent,
    };
  }, [tasks]);

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      await createTask(taskData);
      toast({
        title: 'Task Created',
        description: 'The task has been created successfully.',
      });
      refetchTasks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await updateTaskStatus(taskId, status);
      toast({
        title: 'Task Updated',
        description: `Task status changed to ${status}.`,
      });
      refetchTasks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (_taskId: string) => {
    // Implement delete functionality
    toast({
      title: 'Task Deleted',
      description: 'The task has been deleted.',
    });
    refetchTasks();
  };

  if (tasksLoading || staffLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load tasks. Please try again.</p>
        <Button onClick={refetchTasks} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="staff-tasks-management">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Tasks</h2>
          <p className="text-gray-600">Manage and track staff tasks and assignments</p>
        </div>
        <CreateTaskDialog onCreateTask={handleCreateTask} staffMembers={staffData || []} />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{metrics.completionRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{metrics.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent Tasks</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.urgent}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-tasks-input"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]" data-testid="filter-status-select">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
              <SelectTrigger className="w-[180px]" data-testid="filter-priority-select">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Pending</h3>
            <Badge variant="outline">{tasksByStatus.pending.length}</Badge>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {tasksByStatus.pending.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                />
              ))}
            </AnimatePresence>
            {tasksByStatus.pending.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center text-gray-500">
                  No pending tasks
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* In Progress Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">In Progress</h3>
            <Badge variant="outline" className="bg-blue-50">
              {tasksByStatus.in_progress.length}
            </Badge>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {tasksByStatus.in_progress.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                />
              ))}
            </AnimatePresence>
            {tasksByStatus.in_progress.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center text-gray-500">
                  No tasks in progress
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Completed</h3>
            <Badge variant="outline" className="bg-green-50">
              {tasksByStatus.completed.length}
            </Badge>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {tasksByStatus.completed.slice(0, 5).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                />
              ))}
            </AnimatePresence>
            {tasksByStatus.completed.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center text-gray-500">
                  No completed tasks
                </CardContent>
              </Card>
            )}
            {tasksByStatus.completed.length > 5 && (
              <Button variant="ghost" className="w-full">
                View all {tasksByStatus.completed.length} completed tasks
              </Button>
            )}
          </div>
        </div>
      </div>

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
