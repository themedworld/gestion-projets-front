'use client';
// ─── ui.tsx ──────────────────────────────────────────────────────────────────
// Tiny shared UI primitives used across all sprint/task components.

import React from 'react';
import { Cpu, Loader2 } from 'lucide-react';
import type { TaskStatus, TaskPriority } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { formatHoursDays } from '@/Dashboard/project/[id]/sprintslist/services/estimationService';

// ── AI hour badge ─────────────────────────────────────────────────────────────
export const AiEstimateBadge = ({ hours }: { hours: number }) => (
  <span
    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full
               bg-violet-100 text-violet-700 border border-violet-200"
    title="Estimation IA"
  >
    <Cpu size={11} />
    {formatHoursDays(hours)}
  </span>
);

// ── Spinning banner shown while AI estimates are in flight ────────────────────
export const EstimatingBanner = () => (
  <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-lg flex items-center gap-3 text-violet-700 text-sm font-medium">
    <Loader2 size={18} className="animate-spin flex-shrink-0" />
    Estimation de la durée par l'IA en cours…
  </div>
);

// ── Colour helpers ────────────────────────────────────────────────────────────
export function getStatusBadgeColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    TO_DO:       'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    IN_REVIEW:   'bg-purple-100 text-purple-700',
    DONE:        'bg-green-100 text-green-700',
    BLOCKED:     'bg-red-100 text-red-700',
  };
  return colors[status] ?? 'bg-slate-100 text-slate-700';
}

export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    LOW:      'text-green-600',
    MEDIUM:   'text-yellow-600',
    HIGH:     'text-orange-600',
    CRITICAL: 'text-red-600',
  };
  return colors[priority] ?? 'text-slate-600';
}

export function getDelayStatus(delayHours?: number): string {
  if (!delayHours || delayHours === 0) return "✅ À l'heure";
  if (delayHours > 0) return `⚠️ Retard: +${delayHours.toFixed(1)}h`;
  return `✨ Avance: ${Math.abs(delayHours).toFixed(1)}h`;
}