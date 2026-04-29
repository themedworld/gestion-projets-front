'use client';
// ─── SprintCard.tsx ───────────────────────────────────────────────────────────
// Renders a single sprint row.
// Delegates to SprintForm when editing, to TaskCard for each task row.

import React from 'react';
import {
  ChevronDown, ChevronUp, Edit2, Trash2, Save, X, ListTodo,
} from 'lucide-react';
import type { Sprint, Task, ProjectMember } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { SprintForm } from './SprintForm';
import { TaskCard } from './TaskCard';

interface SprintCardProps {
  sprint: Sprint;
  members: ProjectMember[];
  isExpanded: boolean;
  isEditing: boolean;
  editingSprintData: Sprint | null;
  editingSprintTasks: Task[];
  editingTaskId: number | null;
  editingTaskSprintId: number | null;
  editingTaskData: Task | null;
  loading: boolean;
  estimating: boolean;

  onToggleExpand: (sprintId: number) => void;
  onStartEditSprint: (sprint: Sprint) => void;
  onSprintChange: (field: keyof Sprint, value: unknown) => void;
  onSprintTaskChange: (index: number, field: keyof Task, value: unknown) => void;
  onAddSprintTask: () => void;
  onRemoveSprintTask: (index: number) => void;
  onSaveSprint: () => void;
  onCancelEditSprint: () => void;
  onDeleteSprint: (sprintId: number) => void;

  onStartEditTask: (task: Task, sprintId: number) => void;
  onEditTaskChange: (field: keyof Task, value: unknown) => void;
  onSaveTask: () => void;
  onCancelEditTask: () => void;
  onDeleteTask: (taskId: number, sprintId: number) => void;
}

const statusLabel = (s: Sprint['status']) =>
  s === 'completed' ? 'Terminé' : s === 'in_progress' ? 'En cours' : 'Planifié';

const statusBadgeClass = (s: Sprint['status']) =>
  s === 'completed'
    ? 'bg-green-100 text-green-700'
    : s === 'in_progress'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-slate-100 text-slate-700';

export const SprintCard: React.FC<SprintCardProps> = ({
  sprint, members, isExpanded, isEditing,
  editingSprintData, editingSprintTasks,
  editingTaskId, editingTaskSprintId, editingTaskData,
  loading, estimating,
  onToggleExpand, onStartEditSprint,
  onSprintChange, onSprintTaskChange, onAddSprintTask, onRemoveSprintTask,
  onSaveSprint, onCancelEditSprint, onDeleteSprint,
  onStartEditTask, onEditTaskChange, onSaveTask, onCancelEditTask, onDeleteTask,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">

    {/* ── Sprint header ─────────────────────────────────────────────── */}
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
      <div className="flex items-center justify-between gap-4">

        {/* Left: expand toggle + name */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => onToggleExpand(sprint.id!)}
            className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors flex-shrink-0"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <div className="flex-1 min-w-0">
            {isEditing && editingSprintData ? (
              <input
                type="text"
                value={editingSprintData.name}
                onChange={(e) => onSprintChange('name', e.target.value)}
                className="font-bold text-xl text-slate-800 px-3 py-1 border rounded-lg w-full"
              />
            ) : (
              <>
                <h3 className="font-bold text-xl text-slate-800 truncate">{sprint.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {sprint.tasks?.length ?? 0} tâche{(sprint.tasks?.length ?? 0) !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right: dates, status badge, action buttons */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500 uppercase font-semibold">Début - Fin</p>
            <p className="text-sm text-slate-800 font-medium">
              {new Date(sprint.startDate).toLocaleDateString('fr-FR')} –{' '}
              {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadgeClass(sprint.status)}`}>
            {statusLabel(sprint.status)}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={onSaveSprint}
                  className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                  title="Enregistrer"
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={onCancelEditSprint}
                  className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Annuler"
                >
                  <X size={18} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onStartEditSprint(sprint)}
                  className="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
                  title="Éditer"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => onDeleteSprint(sprint.id!)}
                  className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Embedded edit form ─────────────────────────────────────── */}
      {isEditing && editingSprintData && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <SprintForm
            mode="edit"
            sprint={editingSprintData}
            tasks={editingSprintTasks}
            members={members}
            loading={loading}
            estimating={estimating}
            onSprintChange={onSprintChange}
            onTaskChange={onSprintTaskChange}
            onAddTask={onAddSprintTask}
            onRemoveTask={onRemoveSprintTask}
            onSave={onSaveSprint}
            onCancel={onCancelEditSprint}
          />
        </div>
      )}
    </div>

    {/* ── Expanded task list ────────────────────────────────────────── */}
    {isExpanded && !isEditing && (
      <div className="p-6 bg-slate-50 border-t border-slate-200">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <ListTodo size={18} /> Tâches ({sprint.tasks?.length ?? 0})
        </h4>

        {sprint.tasks?.length ? (
          <div className="space-y-3">
            {sprint.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                members={members}
                sprintId={sprint.id!}
                isEditing={editingTaskId === task.id && editingTaskSprintId === sprint.id}
                editingData={editingTaskData}
                loading={loading}
                estimating={estimating}
                onStartEdit={onStartEditTask}
                onEditChange={onEditTaskChange}
                onSave={onSaveTask}
                onCancelEdit={onCancelEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-6 text-sm">
            Aucune tâche dans ce sprint
          </p>
        )}
      </div>
    )}
  </div>
);