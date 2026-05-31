'use client';
// ─── MarketingTaskCard.tsx ────────────────────────────────────────────────────
// Read-only task row with inline edit via MarketingTaskForm.

import React from 'react';
import { Edit2, Trash2, Cpu, DollarSign, Calendar } from 'lucide-react';
import type {
  TaskMarketing,
  ProjectMember,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import { MarketingTaskForm } from './Marketingtaskform';
import {
  formatHours,
  safeNum,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Marketingestimationservice';

interface MarketingTaskCardProps {
  task: TaskMarketing;
  sprintId: number;
  members: ProjectMember[];
  isEditing: boolean;
  editingData: TaskMarketing | null;
  isEstimating: boolean;
  loading: boolean;
  onStartEdit: (task: TaskMarketing, sprintId: number) => void;
  onEditChange: (field: keyof TaskMarketing, value: unknown) => void;
  onEstimate: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: (taskId: number, sprintId: number) => void;
}

const STATUS_STYLE: Record<string, string> = {
  TO_DO:       'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW:   'bg-amber-100 text-amber-700',
  DONE:        'bg-emerald-100 text-emerald-700',
  BLOCKED:     'bg-red-100 text-red-700',
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW:      'text-emerald-600',
  MEDIUM:   'text-amber-600',
  HIGH:     'text-orange-600',
  CRITICAL: 'text-red-600',
};

const TYPE_EMOJI: Record<string, string> = {
  SEO: '🔍', PPC: '💰', EMAIL: '📧', SOCIAL: '📱', CONTENT: '✍️',
  VIDEO: '🎥', INFLUENCER: '🌟', AFFILIATE: '🤝', PR: '📢', EVENT: '🎪', OTHER: '📌',
};

// Format date locale FR (ex: 12 jan. 2026)
const fmtDate = (d?: string | null): string => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return ''; }
};

export const MarketingTaskCard: React.FC<MarketingTaskCardProps> = ({
  task,
  sprintId,
  members,
  isEditing,
  editingData,
  isEstimating,
  loading,
  onStartEdit,
  onEditChange,
  onEstimate,
  onSave,
  onCancelEdit,
  onDelete,
}) => {
  const aiHours = safeNum(task.aiEstimatedHours ?? task.estimatedHours);

  // Résoudre le nom du membre assigné depuis les différents formats possibles
  const getMemberName = (val: TaskMarketing['assignedTo']): string => {
    if (!val) return '';

    // Format objet { id, fullname }
    if (typeof val === 'object' && 'id' in val) {
      const obj = val as { id: number; fullname?: string; email?: string };
      // Chercher dans members pour avoir le nom complet
      const found = members.find((m) => m.id === obj.id);
      if (found) {
        const name =
          found.fullname ??
          found.name ??
          `${found.firstName ?? ''} ${found.lastName ?? ''}`.trim();
        return found.level ? `${name} (${found.level})` : name;
      }
      // Fallback sur fullname de l'objet
      return obj.fullname ?? `Membre #${obj.id}`;
    }

    // Format id numérique ou string
    const id = Number(val);
    const found = members.find((m) => m.id === id);
    if (!found) return '';
    const name =
      found.fullname ??
      found.name ??
      `${found.firstName ?? ''} ${found.lastName ?? ''}`.trim();
    return found.level ? `${name} (${found.level})` : name;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">

          {/* ── Info ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Title row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-base">{TYPE_EMOJI[task.type] ?? '📌'}</span>
              <h5 className="font-semibold text-slate-800 truncate">{task.title}</h5>
            </div>

            {task.description && (
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Status / type / priority / AI hours / budget badges */}
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  STATUS_STYLE[task.status] ?? 'bg-slate-100 text-slate-700'
                }`}
              >
                {task.status.replace('_', ' ')}
              </span>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
                {task.type}
              </span>
              <span className={`text-xs font-bold ${PRIORITY_COLOR[task.priority] ?? 'text-slate-600'}`}>
                ▲ {task.priority}
              </span>
              {aiHours > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                  <Cpu size={10} /> {formatHours(aiHours)}
                </span>
              )}
              {safeNum(task.budget) > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                  <DollarSign size={10} /> {safeNum(task.budget).toLocaleString()}€
                </span>
              )}
            </div>

            {/* Delay badge */}
            {task.delayHours !== undefined && task.delayHours !== 0 && (
              <div
                className={`text-xs font-semibold px-2 py-1 rounded mb-3 inline-block ${
                  task.delayHours > 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {task.delayHours > 0
                  ? `⚠️ Retard: +${task.delayHours}h`
                  : `✨ Avance: ${Math.abs(task.delayHours).toFixed(1)}h`}
              </div>
            )}

            {/* Meta row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-100">

              {/* Canal */}
              {task.channel && (
                <div>
                  <span className="text-slate-400">Canal: </span>
                  <span className="font-semibold text-slate-700">{task.channel}</span>
                </div>
              )}

              {/* ✅ Date de début */}
              {task.scheduledStartDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={10} className="text-green-500 shrink-0" />
                  <span className="text-slate-400">Début: </span>
                  <span className="font-semibold text-slate-700">
                    {fmtDate(task.scheduledStartDate)}
                  </span>
                </div>
              )}

              {/* Date de fin */}
              {task.scheduledEndDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={10} className="text-orange-400 shrink-0" />
                  <span className="text-slate-400">Échéance: </span>
                  <span className="font-semibold text-slate-700">
                    {fmtDate(task.scheduledEndDate)}
                  </span>
                </div>
              )}

              {/* Clics attendus */}
              {safeNum(task.expectedClicks) > 0 && (
                <div>
                  <span className="text-slate-400">Clics: </span>
                  <span className="font-semibold text-slate-700">
                    {safeNum(task.expectedClicks).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Assigné */}
              {task.assignedTo && getMemberName(task.assignedTo) && (
                <div>
                  <span className="text-slate-400">Assigné: </span>
                  <span className="font-semibold text-slate-700">
                    {getMemberName(task.assignedTo)}
                  </span>
                </div>
              )}

              {/* Date de complétion réelle */}
              {task.completedAt && (
                <div>
                  <span className="text-slate-400">Complété: </span>
                  <span className="font-semibold text-emerald-700">
                    {fmtDate(task.completedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onStartEdit(task, sprintId)}
              className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors"
              title="Éditer"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(task.id!, sprintId)}
              className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* ── Inline edit form ─────────────────────────────────────── */}
        {isEditing && editingData && (
          <MarketingTaskForm
            task={editingData}
            members={members}
            mode="edit"
            isEstimating={isEstimating}
            loading={loading}
            onChange={onEditChange}
            onEstimate={onEstimate}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        )}
      </div>
    </div>
  );
};