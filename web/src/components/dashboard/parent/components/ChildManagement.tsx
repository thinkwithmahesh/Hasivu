'use client';

import React, { useState } from 'react';
import { Baby, CalendarDays, Edit3, Plus, ShieldCheck, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialChildren = [
  {
    id: 'student_1',
    name: 'Emma Doe',
    grade: 'Grade 5A',
    allergies: ['Peanuts'],
    preferences: ['Vegetarian lunches', 'Less spicy'],
    rfid: 'RFID-EMMA-1024',
    nextMeal: 'Mini Idli with Sambar',
  },
  {
    id: 'student_2',
    name: 'Liam Doe',
    grade: 'Grade 3B',
    allergies: [],
    preferences: ['Extra fruit', 'No mushrooms'],
    rfid: 'RFID-LIAM-2048',
    nextMeal: 'Butter Chicken with Naan',
  },
];

interface ChildManagementProps {
  children?: any[];
  onAddChild?: () => void;
  onEditChild?: (childId: string) => void;
  onDeleteChild?: (childId: string) => void;
}

export const ChildManagement: React.FC<ChildManagementProps> = props => {
  // Use props if provided and not empty, otherwise fallback to local mock state
  const [children, setChildren] = useState(
    props.children && props.children.length > 0 ? props.children : initialChildren
  );
  const [editingChild, setEditingChild] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    grade: '',
    allergies: '',
    preferences: '',
  });

  const handleEditClick = (child: any) => {
    setEditingChild(child);
    setEditForm({
      name: child.name || '',
      grade: child.grade || '',
      allergies: child.allergies?.join(', ') || '',
      preferences: child.preferences?.join(', ') || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editForm.name.trim()) {
      toast.error('Child name is required');
      return;
    }

    const updatedChildren = children.map(c => {
      if (c.id === editingChild.id) {
        return {
          ...c,
          name: editForm.name,
          grade: editForm.grade,
          allergies: editForm.allergies
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          preferences: editForm.preferences
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
        };
      }
      return c;
    });

    setChildren(updatedChildren);
    setIsDialogOpen(false);
    toast.success(`${editForm.name}'s profile updated successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Child Management</h2>
          <p className="text-sm text-[var(--hasivu-text-secondary)]">
            Manage your children's profiles and preferences.
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            toast.info('Add child workflow will open once school roster sync is enabled.')
          }
          className="bg-[var(--hasivu-primary)] hover:bg-[var(--hasivu-primary-dark)] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Child
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {children.map(child => (
          <Card key={child.id} className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                    <Baby className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block">{child.name}</span>
                    <span className="text-sm font-normal text-[var(--hasivu-text-secondary)]">
                      {child.grade}
                    </span>
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => handleEditClick(child)}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <Utensils className="h-4 w-4 text-green-700" />
                  Meal preferences
                </div>
                <div className="flex flex-wrap gap-2">
                  {child.preferences?.map((preference: string) => (
                    <Badge key={preference} variant="secondary">
                      {preference}
                    </Badge>
                  ))}
                  {(!child.preferences || child.preferences.length === 0) && (
                    <span className="text-sm text-gray-500">None set</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-red-700" />
                  Allergy notes
                </div>
                {child.allergies && child.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {child.allergies.map((allergy: string) => (
                      <Badge key={allergy} variant="destructive">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No allergy notes recorded.</p>
                )}
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border bg-gray-50 p-3">
                  <p className="text-gray-500">RFID card</p>
                  <p className="font-semibold">{child.rfid || 'Unassigned'}</p>
                </div>
                <div className="rounded-xl border bg-gray-50 p-3">
                  <p className="flex items-center gap-1 text-gray-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Next meal
                  </p>
                  <p className="font-semibold">{child.nextMeal || 'None scheduled'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Child Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="child-name" className="text-right">
                Name
              </Label>
              <Input
                id="child-name"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="child-grade" className="text-right">
                Class/Grade
              </Label>
              <Input
                id="child-grade"
                value={editForm.grade}
                onChange={e => setEditForm({ ...editForm, grade: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="child-allergies" className="text-right pt-2">
                Allergies
              </Label>
              <div className="col-span-3">
                <Input
                  id="child-allergies"
                  value={editForm.allergies}
                  onChange={e => setEditForm({ ...editForm, allergies: e.target.value })}
                  placeholder="E.g. Peanuts, Dairy (comma separated)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple allergies with commas.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="child-preferences" className="text-right pt-2">
                Preferences
              </Label>
              <div className="col-span-3">
                <Input
                  id="child-preferences"
                  value={editForm.preferences}
                  onChange={e => setEditForm({ ...editForm, preferences: e.target.value })}
                  placeholder="E.g. Vegetarian, Less spicy"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple preferences with commas.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[var(--hasivu-primary)] hover:bg-[var(--hasivu-primary-dark)] text-white"
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
