'use client';
// ─── SprintForm.tsx ───────────────────────────────────────────────────────────
// Used for both creating a new sprint and editing an existing one.
//
// Date validation:
//   • Sprint start ≤ sprint end
//   • Sprint must not overlap with any other sprint
//   • Sprint must lie within project bounds (if provided)
//   Each TaskForm receives the current sprint bounds so it can enforce
//   task dates stay within the sprint.

import React, { useMemo } from 'react';
import { Plus, Save, Loader2, ListTodo, Cpu, AlertCircle } from 'lucide-react';
import type { Sprint, Task, ProjectMember } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { inputClass, labelClass } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { TaskForm } from '@/Dashboard/project/[id]/sprintslist/components/TaskForm';
import { EstimatingBanner } from '@/Dashboard/project/[id]/sprintslist/components/ui';
import {
  validateSprintDates,
  validateTaskDates,
} from '@/Dashboard/project/[id]/sprintslist/services/Datevalidation';

interface SprintFormProps {
  mode: 'create' | 'edit';
  sprint: Sprint;
  tasks: Task[];
  members: ProjectMember[];
  /** All other existing sprints — used for overlap detection */
  allSprints?: Sprint[];
  /** Optional project date bounds */
  projectStartDate?: string;
  projectEndDate?: string;
  loading: boolean;
  estimating: boolean;
  onSprintChange: (field: keyof Sprint, value: unknown) => void;
  onTaskChange: (index: number, field: keyof Task, value: unknown) => void;
  onAddTask: () => void;
  onRemoveTask: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
    <AlertCircle size={11} className="flex-shrink-0" />
    {message}
  </p>
);

export const SprintForm: React.FC<SprintFormProps> = ({
  mode,
  sprint,
  tasks,
  members,
  allSprints = [],
  projectStartDate,
  projectEndDate,
  loading,
  estimating,
  onSprintChange,
  onTaskChange,
  onAddTask,
  onRemoveTask,
  onSave,
  onCancel,
}) => {
  // ── Sprint date validation ─────────────────────────────────────────────────
  const sprintErrors = useMemo(() => {
    if (!sprint.startDate || !sprint.endDate) return [];
    const otherSprints = allSprints.filter((s) => s.id !== sprint.id);
    return validateSprintDates({ sprint, otherSprints, projectStartDate, projectEndDate });
  }, [sprint.startDate, sprint.endDate, sprint.id, allSprints, projectStartDate, projectEndDate]);

  const sprintFieldError = (field: string) =>
    sprintErrors.find((e) => e.field === field)?.message;

  // ── Task date validation (any task with errors blocks Save) ───────────────
  const anyTaskDateError = useMemo(() => {
    if (!sprint.startDate || !sprint.endDate) return false;
    return tasks.some((t) => validateTaskDates(t, sprint).length > 0);
  }, [tasks, sprint.startDate, sprint.endDate]);

  const hasErrors = sprintErrors.length > 0 || anyTaskDateError;

  // ── min/max for sprint date pickers ───────────────────────────────────────
  const projMin = projectStartDate
    ? new Date(projectStartDate).toISOString().split('T')[0]
    : undefined;
  const projMax = projectEndDate
    ? new Date(projectEndDate).toISOString().split('T')[0]
    : undefined;

  const errorBorder = 'border-red-400 focus:border-red-500 focus:ring-red-400/30';

  const content = (
    <div className="p-6 space-y-6">
      {estimating && <EstimatingBanner />}

      {/* ── Sprint meta fields ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Name */}
        <div className="md:col-span-4">
          <label className={labelClass}>
            Nom du Sprint <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Sprint 1 - Auth & Setup"
            className={inputClass}
            value={sprint.name}
            onChange={(e) => onSprintChange('name', e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className={labelClass}>Statut</label>
          <select
            className={inputClass}
            value={sprint.status}
            onChange={(e) => onSprintChange('status', e.target.value)}
          >
            <option value="planned">Planifié</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
          </select>
        </div>

        {/* Priority */}
        <div className="md:col-span-2">
          <label className={labelClass}>Priorité</label>
          <select
            className={inputClass}
            value={sprint.priority}
            onChange={(e) => onSprintChange('priority', e.target.value)}
          >
            <option value="Low">Basse</option>
            <option value="Medium">Moyenne</option>
            <option value="High">Haute</option>
          </select>
        </div>

        {/* Complexity */}
        <div className="md:col-span-2">
          <label className={labelClass}>Complexité</label>
          <select
            className={inputClass}
            value={sprint.complexity}
            onChange={(e) => onSprintChange('complexity', e.target.value)}
          >
            <option value="Low">Basse</option>
            <option value="Medium">Moyenne</option>
            <option value="High">Haute</option>
          </select>
        </div>

        {/* Start date */}
        <div className="md:col-span-1">
          <label className={labelClass}>
            Début <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            min={projMin}
            max={sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : projMax}
            className={`${inputClass} ${sprintFieldError('startDate') ? errorBorder : ''}`}
            value={sprint.startDate.split('T')[0]}
            onChange={(e) => onSprintChange('startDate', e.target.value)}
          />
          {sprintFieldError('startDate') && (
            <FieldError message={sprintFieldError('startDate')!} />
          )}
        </div>

        {/* End date */}
        <div className="md:col-span-1">
          <label className={labelClass}>
            Fin <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            min={sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : projMin}
            max={projMax}
            className={`${inputClass} ${sprintFieldError('endDate') ? errorBorder : ''}`}
            value={sprint.endDate.split('T')[0]}
            onChange={(e) => onSprintChange('endDate', e.target.value)}
          />
          {sprintFieldError('endDate') && (
            <FieldError message={sprintFieldError('endDate')!} />
          )}
        </div>
      </div>

      {/* ── Sprint-level error summary ────────────────────────────────────── */}
      {sprintErrors.length > 0 && (
        <div className="space-y-1.5">
          {sprintErrors.map((e, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            >
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tasks section ─────────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ListTodo size={18} /> Tâches ({tasks.length})
          </h3>
          <button
            type="button"
            onClick={onAddTask}
            className="flex items-center gap-1 text-sm px-3 py-1.5 bg-indigo-100 text-indigo-700
                       rounded-lg hover:bg-indigo-200 transition-colors font-semibold"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        <div className="space-y-4 max-h-[32rem] overflow-y-auto">
          {tasks.map((task, idx) => (
            <TaskForm
              key={task.id ?? `new-${idx}`}
              task={task}
              index={idx}
              members={members}
              mode="inline"
              sprint={sprint}            // ← pass sprint bounds for date validation
              showRemoveButton={tasks.length > 1}
              onChange={(field, value) => onTaskChange(idx, field, value)}
              onRemove={() => onRemoveTask(idx)}
            />
          ))}
        </div>
      </div>

      {/* ── AI hint ──────────────────────────────────────────────────────── */}
      <p className="text-xs text-violet-600 flex items-center gap-1.5">
        <Cpu size={12} />
        La durée de chaque tâche sera estimée par l'IA (en tenant compte du niveau du membre assigné).
      </p>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300
                     hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={loading || estimating || hasErrors}
          title={hasErrors ? 'Corrigez les erreurs de dates avant de sauvegarder.' : undefined}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold
                     hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed
                     transition-colors shadow-md shadow-indigo-200"
        >
          {estimating ? (
            <><Loader2 size={18} className="animate-spin" />Estimation IA…</>
          ) : (
            <><Save size={18} />{loading ? 'Enregistrement…' : mode === 'create' ? 'Créer le Sprint' : 'Enregistrer'}</>
          )}
        </button>
      </div>
    </div>
  );

  if (mode === 'edit') return content;

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Plus className="text-indigo-500" size={22} />
          Créer un nouveau Sprint
        </h2>
      </div>
      {content}
    </div>
  );
};