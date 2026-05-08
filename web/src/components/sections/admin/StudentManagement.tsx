// web/src/components/sections/admin/StudentManagement.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Priya } from '@/components/characters/HasivuFriend';
import { Plus, Search, GraduationCap, AlertTriangle, User } from 'lucide-react';

// ─── DIETARY FLAG SYSTEM ──────────────────────────────────────────────
const DIETARY_FLAGS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  VEG: {
    bg: 'bg-hasivu-success/15',
    text: 'text-hasivu-success',
    border: 'border-hasivu-success/30',
    label: 'Vegetarian',
  },
  'NON-VEG': {
    bg: 'bg-hasivu-danger/15',
    text: 'text-hasivu-danger',
    border: 'border-hasivu-danger/30',
    label: 'Non-Veg',
  },
  NUTS: {
    bg: 'bg-hasivu-warning/15',
    text: 'text-hasivu-warning',
    border: 'border-hasivu-warning/30',
    label: 'Nut Allergy',
  },
  GF: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-600',
    border: 'border-blue-500/30',
    label: 'Gluten Free',
  },
  DF: {
    bg: 'bg-gray-400/15',
    text: 'text-gray-600',
    border: 'border-gray-400/30',
    label: 'Dairy Free',
  },
};

function DietaryBadge({ flag }: { flag: string }) {
  const style = DIETARY_FLAGS[flag];
  if (!style) return null;
  return (
    <span
      className={`${style.bg} ${style.text} ${style.border} border rounded-full text-xs font-medium px-2.5 py-0.5 inline-flex items-center`}
    >
      {style.label}
    </span>
  );
}

// ─── MOCK STUDENT DATA ────────────────────────────────────────────────
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  dietary: string[];
  avatar?: string;
}

type Props = { hasStudents?: boolean; students?: Student[] };

export function StudentManagement({ hasStudents = false, students = [] }: Props) {
  const shouldReduce = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const instant = { duration: 0.001 };

  const fadeUp = shouldReduce
    ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: instant } }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } },
      };

  // ─── EMPTY STATE ────────────────────────────────────────────────
  if (!hasStudents && students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div aria-hidden="true" className="mb-6">
          <Priya size={80} animation="breathe" respectReducedMotion />
        </div>
        <h2 className="text-[20px] font-display font-bold text-hasivu-text-primary mb-2">
          No students added
        </h2>
        <p className="text-[14px] text-hasivu-text-secondary max-w-xs mb-6">
          No students added. Import a CSV to get started.
        </p>
        <Button
          className="bg-hasivu-primary hover:bg-hasivu-primary/90 text-white rounded-xl"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>
    );
  }

  // ─── STUDENT LIST ───────────────────────────────────────────────
  const filtered = students.filter(
    s =>
      s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Priya */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div aria-hidden="true">
            <Priya size={40} animation="breathe" respectReducedMotion />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-hasivu-text-primary">
              Student Management
            </h2>
            <p className="text-sm text-hasivu-text-secondary">
              {students.length} student{students.length !== 1 ? 's' : ''} enrolled
            </p>
          </div>
        </div>
        <Button
          className="bg-hasivu-primary hover:bg-hasivu-primary/90 text-white rounded-xl"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-hasivu-text-secondary/50" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl border-hasivu-primary/10 focus:border-hasivu-primary focus:ring-hasivu-primary/20"
        />
      </div>

      {/* Student Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={shouldReduce ? {} : { visible: { transition: { staggerChildren: 0.06 } } }}
        initial="hidden"
        animate="visible"
      >
        {filtered.map(student => (
          <motion.div key={student.id} variants={fadeUp}>
            <Card className="rounded-2xl shadow-warm-sm hover:shadow-warm-md transition-shadow border-hasivu-primary/10">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-hasivu-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-hasivu-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-hasivu-text-primary truncate">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-xs text-hasivu-text-secondary flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Grade {student.grade} • Section {student.section}
                    </p>
                  </div>
                </div>

                {/* Dietary Flags */}
                {student.dietary.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {student.dietary.map(flag => (
                      <DietaryBadge key={flag} flag={flag} />
                    ))}
                  </div>
                )}

                {student.dietary.length === 0 && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-hasivu-text-secondary/60">
                    <AlertTriangle className="h-3 w-3" />
                    No dietary flags set
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <p className="text-hasivu-text-secondary">No students match &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>
  );
}
