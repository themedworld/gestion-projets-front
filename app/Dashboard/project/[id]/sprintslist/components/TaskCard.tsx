'use client';
// ─── TaskCard.tsx ─────────────────────────────────────────────────────────────
// Read-only task row with edit/delete buttons.
// Renders the inline <TaskForm> when this task is being edited.
// Passes sprint date bounds to TaskForm so date validation works in edit mode.

import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { Task, ProjectMember, Sprint } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { TaskForm } from '@/Dashboard/project/[id]/sprintslist/components/TaskForm';
import { safeHours } from '@/Dashboard/project/[id]/sprintslist/services/estimationService';
import {
  AiEstimateBadge,
  getStatusBadgeColor,
  getPriorityColor,
  getDelayStatus,
} from '@/Dashboard/project/[id]/sprintslist/components/ui';

interface TaskCardProps {
  task: Task;
  members: ProjectMember[];
  sprintId: number;
  /** Parent sprint — used to constrain task date inputs */
  sprint: Pick<Sprint, 'startDate' | 'endDate' | 'name'>;
  isEditing: boolean;
  editingData: Task | null;
  loading: boolean;
  estimating: boolean;
  onStartEdit: (task: Task, sprintId: number) => void;
  onEditChange: (field: keyof Task, value: unknown) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: (taskId: number, sprintId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  members,
  sprintId,
  sprint,
  isEditing,
  editingData,
  loading,
  estimating,
  onStartEdit,
  onEditChange,
  onSave,
  onCancelEdit,
  onDelete,
}) => {

  // Utilitaire robuste pour afficher le nom du membre assigné
  function getMemberName(assignedTo: any, members: ProjectMember[]): string {
    if (!assignedTo) return '—';

    // Si assignedTo est déjà un objet complet avec prénom/nom ou name
    if (typeof assignedTo === 'object' && (assignedTo.firstName || assignedTo.name || assignedTo.lastName)) {
      const nameFromObj = assignedTo.name ?? `${assignedTo.firstName ?? ''} ${assignedTo.lastName ?? ''}`.trim();
      return (nameFromObj || '—').trim();
    }

    // Extraire un id possible (gère { id }, "5", 5)
    const rawId = typeof assignedTo === 'object' ? assignedTo.id : assignedTo;
    if (rawId === undefined || rawId === null) return '—';

    const idStr = String(rawId);

    // Cherche dans members en normalisant les types (string/number)
    const member = members.find(m => String(m.id) === idStr);
    if (!member) return '—';

    const memberName = member.name ?? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
    return (memberName || '—').trim();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-4">

          {/* ── Task info ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-slate-800 mb-2">{task.title}</h5>
            {task.description && (
              <p className="text-sm text-slate-600 mb-3">{task.description}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusBadgeColor(task.status)}`}>
                {task.status}
              </span>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
                {task.type}
              </span>
              <span className={`text-xs font-bold ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-semibold">
                {task.storyPoints} pts
              </span>
              {safeHours(task.aiEstimatedHours ?? task.estimatedHours) > 0 && (
                <AiEstimateBadge hours={safeHours(task.aiEstimatedHours ?? task.estimatedHours)} />
              )}
            </div>

            {/* Delay */}
            {task.delayHours !== undefined && (
              <div
                className={`text-xs font-semibold px-2 py-1 rounded mb-3 inline-block ${
                  task.delayHours > 0
                    ? 'bg-red-100 text-red-700'
                    : task.delayHours < 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {getDelayStatus(task.delayHours)}
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-100">
              {task.scheduledStartDate && (
                <div>
                  <span className="text-slate-500">Début:</span>
                  <span className="ml-1 font-semibold text-slate-700">
                    {new Date(task.scheduledStartDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              {task.scheduledEndDate && (
                <div>
                  <span className="text-slate-500">Fin:</span>
                  <span className="ml-1 font-semibold text-slate-700">
                    {new Date(task.scheduledEndDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              {!!task.complexityScore && (
                <div>
                  <span className="text-slate-500">Complexité:</span>
                  <span className="ml-1 font-semibold text-slate-700">{task.complexityScore}/5</span>
                </div>
              )}
              {!!task.riskLevel && (
                <div>
                  <span className="text-slate-500">Risque:</span>
                  <span className="ml-1 font-semibold text-slate-700">{task.riskLevel}/5</span>
                </div>
              )}
              {task.dependencies && (
                <div>
                  <span className="text-slate-500">Dépendances:</span>
                  <span className="ml-1 font-semibold text-slate-700">{task.dependencies}</span>
                </div>
              )}
              {task.assignedTo && (
                <div>
                  <span className="text-slate-500">Assigné:</span>
                  <span className="ml-1 font-semibold text-slate-700">
                    <span>{getMemberName(task.assignedTo, members)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onStartEdit(task, sprintId)}
              className="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
              title="Éditer"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(task.id!, sprintId)}
              className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* ── Inline edit form ─────────────────────────────────────── */}
        {isEditing && editingData && (
          <TaskForm
            task={editingData}
            members={members}
            mode="edit"
            sprint={sprint}          // ← sprint bounds for date validation
            loading={loading}
            estimating={estimating}
            onChange={onEditChange}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        )}
      </div>
    </div>
  );
};
