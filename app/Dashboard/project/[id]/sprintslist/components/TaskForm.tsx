'use client';
// ─── TaskForm.tsx ─────────────────────────────────────────────────────────────
// Reusable task form.
// • `mode="inline"` — compact, used inside sprint creation/edition (no save button)
// • `mode="edit"`   — standalone with Save / Cancel buttons, used for editing existing tasks
//
// Date validation:
//   task.scheduledStartDate and task.scheduledEndDate must both lie within
//   [sprint.startDate, sprint.endDate].  Errors are shown inline and the Save
//   button is disabled until all errors are resolved.

import React, { useMemo } from 'react';
import { Calendar, Cpu, Save, Loader2, Trash2, AlertCircle } from 'lucide-react';
import type {
  Task, TaskType, TaskStatus, TaskPriority, ProjectMember, Sprint,
} from '@/Dashboard/project/[id]/sprintslist/services/types';
import { inputClass } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { formatHoursDays, safeHours } from '@/Dashboard/project/[id]/sprintslist/services/estimationService';
import { validateTaskDates } from '@/Dashboard/project/[id]/sprintslist/services/Datevalidation';

interface TaskFormProps {
  task: Task;
  index?: number;
  members: ProjectMember[];
  mode: 'inline' | 'edit';
  /** Sprint bounds used for date validation */
  sprint?: Pick<Sprint, 'startDate' | 'endDate' | 'name'>;
  disabled?: boolean;
  loading?: boolean;
  estimating?: boolean;
  showRemoveButton?: boolean;
  onChange: (field: keyof Task, value: unknown) => void;
  onSave?: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
}

// ── Small inline error message ────────────────────────────────────────────────
const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
    <AlertCircle size={11} className="flex-shrink-0" />
    {message}
  </p>
);

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  index,
  members,
  mode,
  sprint,
  disabled = false,
  loading = false,
  estimating = false,
  showRemoveButton = false,
  onChange,
  onSave,
  onCancel,
  onRemove,
}) => {
  const isExisting = !!task.id;
  const lock = (forExisting = true) =>
    disabled || (mode === 'inline' && isExisting && forExisting);
  // Utilitaire à ajouter
function getMemberName(assignedTo: any, members: ProjectMember[]): string {
  if (!assignedTo) return '—';
  
  // Objet retourné directement par le backend { id, firstName, lastName }
  if (typeof assignedTo === 'object' && assignedTo.firstName) {
    return `${assignedTo.firstName} ${assignedTo.lastName ?? ''}`.trim();
  }
  
  // ID numérique ou string → chercher dans members
  const id = typeof assignedTo === 'object' ? assignedTo.id : Number(assignedTo);
  const member = members.find(m => m.id === id);
  return member
    ? (member.name ?? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim())
    : '—';
}

// Usage dans le JSX


  // ── Date validation ─────────────────────────────────────────────────────────
  const dateErrors = useMemo(() => {
    if (!sprint?.startDate || !sprint?.endDate) return [];
    return validateTaskDates(task, sprint);
  }, [task.scheduledStartDate, task.scheduledEndDate, sprint]);

  const fieldError = (field: string) =>
    dateErrors.find((e) => e.field === field)?.message;

  const hasDateErrors = dateErrors.length > 0;

  // ── Date input constraints (min/max) based on sprint ───────────────────────
  const sprintMin = sprint?.startDate
    ? new Date(sprint.startDate).toISOString().split('T')[0]
    : undefined;
  const sprintMax = sprint?.endDate
    ? new Date(sprint.endDate).toISOString().split('T')[0]
    : undefined;

  const errorBorder = 'border-red-400 focus:border-red-500 focus:ring-red-400/30';

  return (
    <div
      className={
        mode === 'edit'
          ? 'space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg mt-3'
          : 'p-4 bg-slate-50 border border-slate-200 rounded-lg'
      }
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {mode === 'inline' && (
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-semibold text-slate-700">
            {index !== undefined ? `Tâche ${index + 1}` : 'Tâche'}{' '}
            {isExisting ? '(existante)' : '(nouvelle)'}
          </h4>
          {showRemoveButton && !isExisting && (
            <button
              onClick={onRemove}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {mode === 'edit' && (
        <h5 className="font-bold text-blue-900">Éditer la tâche</h5>
      )}

      {/* ── Sprint date hint ────────────────────────────────────────────────── */}
      {sprint?.startDate && sprint?.endDate && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
          <Calendar size={12} />
          <span>
            Plage du sprint{sprint.name ? ` "${sprint.name}"` : ''} :{' '}
            <strong>
              {new Date(sprint.startDate).toLocaleDateString('fr-FR')} →{' '}
              {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
            </strong>
          </span>
        </div>
      )}

      {/* ── AI estimate display ─────────────────────────────────────────────── */}
      {safeHours(task.aiEstimatedHours ?? task.estimatedHours) > 0 && (
        <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
          <Cpu size={14} />
          <span>
            Estimation IA :{' '}
            <strong>
              {formatHoursDays(safeHours(task.aiEstimatedHours ?? task.estimatedHours))}
            </strong>
          </span>
        </div>
      )}

      {/* ── Fields grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

        {/* Title */}
        <div className="md:col-span-6">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Titre *</label>
          <input
            type="text"
            placeholder="Titre de la tâche"
            className={inputClass}
            value={task.title}
            onChange={(e) => onChange('title', e.target.value)}
            disabled={lock()}
          />
        </div>

        {/* Assigned to */}
        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Assigné à
            {task.assignedTo && (() => {
              const m = members.find((mb) => mb.id === Number(task.assignedTo));
              return m?.level ? (
                <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">
                 <span>{getMemberName(task.assignedTo, members)}</span>
                </span>
              ) : null;
            })()}
          </label>
          <select
            className={inputClass}
            value={task.assignedTo}
            onChange={(e) => onChange('assignedTo', e.target.value)}
          >
            <option value="">Non assigné</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? `${m.firstName} ${m.lastName}`}
                {m.level ? ` (${m.level})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
          <select
            className={inputClass}
            value={task.type}
            onChange={(e) => onChange('type', e.target.value as TaskType)}
            disabled={lock()}
          >
            <option value="FEATURE">Feature</option>
            <option value="BUG">Bug</option>
            <option value="IMPROVEMENT">Improvement</option>
            <option value="TASK">Task</option>
            <option value="STORY">Story</option>
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-12">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
          <textarea
            placeholder="Description technique…"
            className={`${inputClass} resize-none`}
            rows={2}
            value={task.description}
            onChange={(e) => onChange('description', e.target.value)}
            disabled={lock()}
          />
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Statut</label>
          <select
            className={inputClass}
            value={task.status}
            onChange={(e) => onChange('status', e.target.value as TaskStatus)}
          >
            <option value="TO_DO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="IN_REVIEW">En révision</option>
            <option value="DONE">Fait</option>
            <option value="BLOCKED">Bloqué</option>
          </select>
        </div>

        {/* Priority */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Priorité</label>
          <select
            className={inputClass}
            value={task.priority}
            onChange={(e) => onChange('priority', e.target.value as TaskPriority)}
            disabled={lock()}
          >
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>
        </div>

        {/* Story Points */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Story Points</label>
          <input
            type="number" min="0"
            className={inputClass}
            value={task.storyPoints}
            onChange={(e) => onChange('storyPoints', Number(e.target.value))}
            disabled={lock()}
          />
        </div>

        {/* Complexity */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Complexité (1-5)</label>
          <input
            type="number" min="1" max="5"
            className={inputClass}
            value={task.complexityScore}
            onChange={(e) => onChange('complexityScore', Number(e.target.value))}
            disabled={lock()}
          />
        </div>

        {/* Risk */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Risque (1-5)</label>
          <input
            type="number" min="1" max="5"
            className={inputClass}
            value={task.riskLevel}
            onChange={(e) => onChange('riskLevel', Number(e.target.value))}
            disabled={lock()}
          />
        </div>

        {/* Start date — clamped to sprint bounds */}
        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
            <Calendar size={12} /> Début
          </label>
          <input
            type="date"
            min={sprintMin}
            max={sprintMax}
            className={`${inputClass} ${fieldError('scheduledStartDate') ? errorBorder : ''}`}
            value={task.scheduledStartDate ?? ''}
            onChange={(e) => onChange('scheduledStartDate', e.target.value)}
            disabled={lock()}
          />
          {fieldError('scheduledStartDate') && (
            <FieldError message={fieldError('scheduledStartDate')!} />
          )}
        </div>

        {/* End date — clamped to sprint bounds */}
        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
            <Calendar size={12} /> Fin
          </label>
          <input
            type="date"
            min={task.scheduledStartDate || sprintMin}
            max={sprintMax}
            className={`${inputClass} ${fieldError('scheduledEndDate') ? errorBorder : ''}`}
            value={task.scheduledEndDate ?? ''}
            onChange={(e) => onChange('scheduledEndDate', e.target.value)}
            disabled={lock()}
          />
          {fieldError('scheduledEndDate') && (
            <FieldError message={fieldError('scheduledEndDate')!} />
          )}
        </div>

        {/* Dependencies */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Dépendances</label>
          <input
            type="text" placeholder="Task #12"
            className={inputClass}
            value={task.dependencies}
            onChange={(e) => onChange('dependencies', e.target.value)}
            disabled={lock()}
          />
        </div>

        {/* Risks text */}
        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-red-600 mb-1 block">Risques</label>
          <input
            type="text" placeholder="Risques identifiés…"
            className={inputClass}
            value={task.risks}
            onChange={(e) => onChange('risks', e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
          <input
            type="text" placeholder="Notes additionnelles…"
            className={inputClass}
            value={task.additionalNotes}
            onChange={(e) => onChange('additionalNotes', e.target.value)}
          />
        </div>
      </div>

      {/* ── Save / Cancel (edit mode) ───────────────────────────────────────── */}
      {mode === 'edit' && (
        <div className="flex justify-end gap-2 pt-3">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={loading || estimating || hasDateErrors}
            title={hasDateErrors ? 'Corrigez les erreurs de dates avant de sauvegarder.' : undefined}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700
                       disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1.5"
          >
            {estimating ? (
              <><Loader2 size={14} className="animate-spin" />Estimation IA…</>
            ) : (
              <><Save size={14} />Enregistrer</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};