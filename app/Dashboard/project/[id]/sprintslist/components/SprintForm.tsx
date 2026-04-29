'use client';
// ─── SprintForm.tsx ───────────────────────────────────────────────────────────
// Used for both creating a new sprint and editing an existing one.
// Receives sprint data + task list as props and emits changes upward.

import React from 'react';
import { Plus, Save, Loader2, ListTodo, Cpu } from 'lucide-react';
import type { Sprint, Task, ProjectMember } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { inputClass, labelClass } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { TaskForm } from '@/Dashboard/project/[id]/sprintslist/components/TaskForm';
import { EstimatingBanner } from '@/Dashboard/project/[id]/sprintslist/components/ui';

interface SprintFormProps {
  /** "create" shows the full card with header; "edit" is embedded inside SprintCard */
  mode: 'create' | 'edit';
  sprint: Sprint;
  tasks: Task[];           // separate task list (editable copy)
  members: ProjectMember[];
  loading: boolean;
  estimating: boolean;
  onSprintChange: (field: keyof Sprint, value: unknown) => void;
  onTaskChange: (index: number, field: keyof Task, value: unknown) => void;
  onAddTask: () => void;
  onRemoveTask: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const SprintForm: React.FC<SprintFormProps> = ({
  mode,
  sprint,
  tasks,
  members,
  loading,
  estimating,
  onSprintChange,
  onTaskChange,
  onAddTask,
  onRemoveTask,
  onSave,
  onCancel,
}) => {
  const content = (
    <div className="p-6 space-y-6">
      {estimating && <EstimatingBanner />}

      {/* ── Sprint meta fields ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
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

        <div className="md:col-span-1">
          <label className={labelClass}>
            Début <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className={inputClass}
            value={sprint.startDate.split('T')[0]}
            onChange={(e) => onSprintChange('startDate', e.target.value)}
          />
        </div>

        <div className="md:col-span-1">
          <label className={labelClass}>
            Fin <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className={inputClass}
            value={sprint.endDate.split('T')[0]}
            onChange={(e) => onSprintChange('endDate', e.target.value)}
          />
        </div>
      </div>

      {/* ── Tasks section ───────────────────────────────────────────── */}
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
              showRemoveButton={tasks.length > 1}
              onChange={(field, value) => onTaskChange(idx, field, value)}
              onRemove={() => onRemoveTask(idx)}
            />
          ))}
        </div>
      </div>

      {/* AI hint */}
      <p className="text-xs text-violet-600 flex items-center gap-1.5">
        <Cpu size={12} />
        La durée de chaque tâche sera estimée par l'IA (en tenant compte du niveau du membre assigné).
      </p>

      {/* Actions */}
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
          disabled={loading || estimating}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold
                     hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-md shadow-indigo-200"
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

  // Create mode — full card wrapper
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