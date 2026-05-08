'use client';

import React, { useState } from 'react';
import { Baby, CalendarDays, Edit3, Plus, ShieldCheck, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export default function ChildrenPage() {
  const [children] = useState(initialChildren);

  return (
    <div className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[var(--hasivu-primary)]">
              Parent Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold">My Children</h1>
            <p className="mt-2 text-[var(--hasivu-text-secondary)]">
              Manage student profiles, meal preferences, allergy notes, and RFID delivery cards.
            </p>
          </div>
          <Button
            type="button"
            className="min-h-11"
            onClick={() => toast.info('Add child workflow will open once school roster sync is enabled.')}
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
                    onClick={() => toast.info(`Editing ${child.name}`)}
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-white/70 p-4">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <Utensils className="h-4 w-4 text-green-700" />
                    Meal preferences
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {child.preferences.map(preference => (
                      <Badge key={preference} variant="secondary">
                        {preference}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-white/70 p-4">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-red-700" />
                    Allergy notes
                  </div>
                  {child.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {child.allergies.map(allergy => (
                        <Badge key={allergy} variant="destructive">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--hasivu-text-secondary)]">No allergy notes recorded.</p>
                  )}
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border bg-white/70 p-3">
                    <p className="text-[var(--hasivu-text-secondary)]">RFID card</p>
                    <p className="font-semibold">{child.rfid}</p>
                  </div>
                  <div className="rounded-xl border bg-white/70 p-3">
                    <p className="flex items-center gap-1 text-[var(--hasivu-text-secondary)]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Next meal
                    </p>
                    <p className="font-semibold">{child.nextMeal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
