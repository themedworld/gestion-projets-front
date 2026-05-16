'use client';
// ─── MarketingSprintCard.tsx ──────────────────────────────────────────────────
// Renders a single sprint row. Delegates to MarketingSprintForm when editing,
// to MarketingTaskCard for each task row.

import React from 'react';
import {
  ChevronDown, ChevronUp, Edit2, Trash2, Save, X, ListTodo,
  DollarSign, Target, Radio,
} from 'lucide-react';
import type { SprintMarketing, TaskMarketing, ProjectMember } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import { MarketingSprintForm } from '@/Dashboard/project/[id]/sprintmarketinglist/components/Marketingsprintform';
import { MarketingTaskCard } from './Marketingtaskcard';
import { safeNum } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Marketingestimationservice';

interface MarketingSprintCardProps {
  sprint: SprintMarketing;
  members: ProjectMember[];
  isExpanded: boolean;
  isEditing: boolean;
  editingSprintData: SprintMarketing | null;
  editingSprintTasks: TaskMarketing[];
  editingTaskId: number | null;
  editingTaskSprintId: number | null;
  editingTaskData: TaskMarketing | null;
  estimatingTaskIdx: number | null;
  loading: boolean;
  estimating: boolean;

  onToggleExpand: (id: number) => void;
  onStartEditSprint: (sprint: SprintMarketing) => void;
  onSprintChange: (field: keyof SprintMarketing, value: unknown) => void;
  onSprintTaskChange: (index: number, field: keyof TaskMarketing, value: unknown) => void;
  onAddSprintTask: () => void;
  onRemoveSprintTask: (index: number) => void;
  onEstimateSprintTask: (index: number) => void;
  onSaveSprint: () => void;
  onCancelEditSprint: () => void;
  onDeleteSprint: (id: number) => void;

  onStartEditTask: (task: TaskMarketing, sprintId: number) => void;
  onEditTaskChange: (field: keyof TaskMarketing, value: unknown) => void;
  onEstimateEditingTask: () => void;
  onSaveTask: () => void;
  onCancelEditTask: () => void;
  onDeleteTask: (taskId: number, sprintId: number) => void;
}

const STATUS_BADGE: Record<string, string> = {
  planned:   'bg-slate-100 text-slate-700',
  active:    'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  planned: 'Planifié', active: 'Actif', completed: 'Terminé', cancelled: 'Annulé',
};

export const MarketingSprintCard: React.FC<MarketingSprintCardProps> = ({
  sprint, members, isExpanded, isEditing,
  editingSprintData, editingSprintTasks,
  editingTaskId, editingTaskSprintId, editingTaskData,
  estimatingTaskIdx, loading, estimating,
  onToggleExpand, onStartEditSprint,
  onSprintChange, onSprintTaskChange, onAddSprintTask, onRemoveSprintTask,
  onEstimateSprintTask, onSaveSprint, onCancelEditSprint, onDeleteSprint,
  onStartEditTask, onEditTaskChange, onEstimateEditingTask,
  onSaveTask, onCancelEditTask, onDeleteTask,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">

    {/* ── Sprint header ───────────────────────────────────────────────── */}
    <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200">
      <div className="flex items-center justify-between gap-4">

        {/* Left */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => onToggleExpand(sprint.id!)}
            className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors flex-shrink-0"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <div className="flex-1 min-w-0">
            {isEditing && editingSprintData ? (
              <input
                type="text"
                value={editingSprintData.name}
                onChange={(e) => onSprintChange('name', e.target.value)}
                className="font-bold text-lg text-slate-800 px-3 py-1 border rounded-lg w-full max-w-sm"
              />
            ) : (
              <>
                <h3 className="font-bold text-lg text-slate-800 truncate">{sprint.name}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{sprint.tasks?.length ?? 0} tâche{(sprint.tasks?.length ?? 0) !== 1 ? 's' : ''}</span>
                  {sprint.campaignType && (
                    <span className="flex items-center gap-1"><Radio size={11} />{sprint.campaignType}</span>
                  )}
                  {safeNum(sprint.totalBudget) > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign size={11} />{safeNum(sprint.totalBudget).toLocaleString()}€
                    </span>
                  )}
                  {sprint.targetAudience && (
                    <span className="flex items-center gap-1"><Target size={11} />{sprint.targetAudience}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 uppercase font-semibold">Période</p>
            <p className="text-sm text-slate-700 font-medium">
              {new Date(sprint.startDate).toLocaleDateString('fr-FR')} –{' '}
              {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_BADGE[sprint.status] ?? 'bg-slate-100 text-slate-700'}`}>
            {STATUS_LABEL[sprint.status] ?? sprint.status}
          </span>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={onSaveSprint}
                  className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors" title="Enregistrer">
                  <Save size={17} />
                </button>
                <button onClick={onCancelEditSprint}
                  className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" title="Annuler">
                  <X size={17} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onStartEditSprint(sprint)}
                  className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors" title="Éditer">
                  <Edit2 size={17} />
                </button>
                <button onClick={() => onDeleteSprint(sprint.id!)}
                  className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors" title="Supprimer">
                  <Trash2 size={17} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Embedded edit form */}
      {isEditing && editingSprintData && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <MarketingSprintForm
            mode="edit"
            sprint={editingSprintData}
            tasks={editingSprintTasks}
            members={members}
            loading={loading}
            estimating={estimating}
            estimatingTaskIdx={estimatingTaskIdx}
            onSprintChange={onSprintChange}
            onTaskChange={onSprintTaskChange}
            onAddTask={onAddSprintTask}
            onRemoveTask={onRemoveSprintTask}
            onEstimateTask={onEstimateSprintTask}
            onSave={onSaveSprint}
            onCancel={onCancelEditSprint}
          />
        </div>
      )}
    </div>

    {/* ── Expanded task list ────────────────────────────────────────── */}
    {isExpanded && !isEditing && (
      <div className="p-5 bg-slate-50 border-t border-slate-200">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <ListTodo size={17} /> Tâches ({sprint.tasks?.length ?? 0})
        </h4>

        {sprint.tasks?.length ? (
          <div className="space-y-3">
            {sprint.tasks.map((task) => (
              <MarketingTaskCard
                key={task.id}
                task={task}
                sprintId={sprint.id!}
                members={members}
                isEditing={editingTaskId === task.id && editingTaskSprintId === sprint.id}
                editingData={editingTaskData}
                isEstimating={editingTaskId === task.id && estimatingTaskIdx !== null}
                loading={loading}
                onStartEdit={onStartEditTask}
                onEditChange={onEditTaskChange}
                onEstimate={onEstimateEditingTask}
                onSave={onSaveTask}
                onCancelEdit={onCancelEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-6 text-sm">Aucune tâche dans ce sprint</p>
        )}
      </div>
    )}
  </div>
);