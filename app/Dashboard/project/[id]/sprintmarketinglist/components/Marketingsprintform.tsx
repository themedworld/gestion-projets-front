'use client';
// ─── MarketingSprintForm.tsx ──────────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  Plus, Save, Loader2, ListTodo, Cpu, DollarSign,
  Target, TrendingUp, Radio, Calendar, AlertTriangle,
} from 'lucide-react';
import type {
  SprintMarketing, TaskMarketing, ProjectMember,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import { inputClass, labelClass, getEmptyTask } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import { MarketingTaskForm } from './Marketingtaskform';
import { validateSprintDates } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Datevalidation';

interface MarketingSprintFormProps {
  mode: 'create' | 'edit';
  sprint: SprintMarketing;
  tasks: TaskMarketing[];
  members: ProjectMember[];
  loading: boolean;
  estimating: boolean;
  estimatingTaskIdx: number | null;
  /** All existing sprints — used to check overlap (self excluded by id) */
  allSprints: SprintMarketing[];
  /** Project date bounds */
  projectStartDate?: string | null;
  projectEndDate?:   string | null;
  onSprintChange: (field: keyof SprintMarketing, value: unknown) => void;
  onTaskChange: (index: number, field: keyof TaskMarketing, value: unknown) => void;
  onAddTask: () => void;
  onRemoveTask: (index: number) => void;
  onEstimateTask: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const MarketingSprintForm: React.FC<MarketingSprintFormProps> = ({
  mode, sprint, tasks, members, loading, estimating, estimatingTaskIdx,
  allSprints, projectStartDate, projectEndDate,
  onSprintChange, onTaskChange, onAddTask, onRemoveTask, onEstimateTask,
  onSave, onCancel,
}) => {

  // ── Sprint date validation ────────────────────────────────────────────────
  const sprintDateError = useMemo(
    () =>
      validateSprintDates(
        sprint.id,
        sprint.startDate,
        sprint.endDate,
        projectStartDate,
        projectEndDate,
        allSprints,
      ),
    [sprint.id, sprint.startDate, sprint.endDate, projectStartDate, projectEndDate, allSprints],
  );

  // HTML min/max for date pickers
  const projMin = projectStartDate ? projectStartDate.split('T')[0] : undefined;
  const projMax = projectEndDate   ? projectEndDate.split('T')[0]   : undefined;
  const endMin  = sprint.startDate ? sprint.startDate.split('T')[0] : projMin;

  const content = (
    <div className="p-6 space-y-6">

      {estimating && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-700 text-sm font-medium">
          <Loader2 size={18} className="animate-spin flex-shrink-0" />
          Estimation IA de la durée des tâches en cours…
        </div>
      )}

      {/* Sprint date error banner */}
      {sprintDateError && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertTriangle size={16} className="shrink-0" />
          {sprintDateError}
        </div>
      )}

      {/* ── Sprint meta ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

        {/* Name */}
        <div className="md:col-span-5">
          <label className={labelClass}>Nom du sprint *</label>
          <input type="text" placeholder="Ex: Campagne Été – Social & Email" className={inputClass}
            value={sprint.name} onChange={(e) => onSprintChange('name', e.target.value)} />
        </div>

        {/* Campaign type */}
        <div className="md:col-span-3">
          <label className={labelClass}><Radio size={11} className="inline mr-1" />Type de campagne</label>
          <select className={inputClass} value={sprint.campaignType ?? ''} onChange={(e) => onSprintChange('campaignType', e.target.value)}>
            <option value="">Sélectionner…</option>
            {['Email','Social Media','SEO','PPC','Content','Video','Influencer','Event','PR','Mixed'].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className={labelClass}>Statut</label>
          <select className={inputClass} value={sprint.status} onChange={(e) => onSprintChange('status', e.target.value)}>
            <option value="planned">Planifié</option>
            <option value="active">Actif</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

        {/* Priority */}
        <div className="md:col-span-1">
          <label className={labelClass}>Priorité</label>
          <select className={inputClass} value={sprint.priority ?? 'Medium'} onChange={(e) => onSprintChange('priority', e.target.value)}>
            <option value="Low">Basse</option>
            <option value="Medium">Moyenne</option>
            <option value="High">Haute</option>
          </select>
        </div>

        {/* Complexity */}
        <div className="md:col-span-1">
          <label className={labelClass}>Complexité</label>
          <select className={inputClass} value={sprint.complexity ?? 'Medium'} onChange={(e) => onSprintChange('complexity', e.target.value)}>
            <option value="Low">Basse</option>
            <option value="Medium">Moyenne</option>
            <option value="High">Haute</option>
          </select>
        </div>

        {/* ── Start date — clamped to project bounds ─────────────────── */}
        <div className="md:col-span-2">
          <label className={labelClass}>
            <Calendar size={11} className="inline mr-1" />Début *
            {projMin && (
              <span className="ml-1 text-slate-400 font-normal normal-case text-[10px]">
                min {projMin}
              </span>
            )}
          </label>
          <input
            type="date"
            className={`${inputClass} ${sprintDateError ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
            value={sprint.startDate?.split('T')[0] ?? ''}
            min={projMin}
            max={projMax}
            onChange={(e) => onSprintChange('startDate', e.target.value)}
          />
        </div>

        {/* ── End date — min = sprint start, max = project end ────────── */}
        <div className="md:col-span-2">
          <label className={labelClass}>
            <Calendar size={11} className="inline mr-1" />Fin *
            {projMax && (
              <span className="ml-1 text-slate-400 font-normal normal-case text-[10px]">
                max {projMax}
              </span>
            )}
          </label>
          <input
            type="date"
            className={`${inputClass} ${sprintDateError ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
            value={sprint.endDate?.split('T')[0] ?? ''}
            min={endMin}
            max={projMax}
            onChange={(e) => onSprintChange('endDate', e.target.value)}
          />
        </div>

        {/* Budget */}
        <div className="md:col-span-2">
          <label className={labelClass}><DollarSign size={11} className="inline mr-1" />Budget (€)</label>
          <input type="number" min="0" placeholder="0" className={inputClass}
            value={sprint.totalBudget || ''}
            onChange={(e) => onSprintChange('totalBudget', e.target.value)} />
        </div>

        {/* Target audience */}
        <div className="md:col-span-3">
          <label className={labelClass}><Target size={11} className="inline mr-1" />Public cible</label>
          <input type="text" placeholder="B2B SaaS, 25-45 ans…" className={inputClass}
            value={sprint.targetAudience ?? ''}
            onChange={(e) => onSprintChange('targetAudience', e.target.value)} />
        </div>

        {/* Channels */}
        <div className="md:col-span-3">
          <label className={labelClass}>Canaux</label>
          <input type="text" placeholder="Google; Facebook; Email…" className={inputClass}
            value={sprint.channels ?? ''}
            onChange={(e) => onSprintChange('channels', e.target.value)} />
        </div>

        {/* Goals */}
        <div className="md:col-span-3">
          <label className={labelClass}><TrendingUp size={11} className="inline mr-1" />Objectifs</label>
          <input type="text" placeholder="Leads, Conversion, Trafic…" className={inputClass}
            value={sprint.goals ?? ''}
            onChange={(e) => onSprintChange('goals', e.target.value)} />
        </div>

        {/* KPIs */}
        <div className="md:col-span-2">
          <label className={labelClass}>Portée attendue</label>
          <input type="number" min="0" placeholder="0" className={inputClass}
            value={sprint.expectedReach || ''}
            onChange={(e) => onSprintChange('expectedReach', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Leads attendus</label>
          <input type="number" min="0" placeholder="0" className={inputClass}
            value={sprint.expectedLeads || ''}
            onChange={(e) => onSprintChange('expectedLeads', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>ROI attendu (%)</label>
          <input type="number" min="0" placeholder="0" className={inputClass}
            value={sprint.expectedROI || ''}
            onChange={(e) => onSprintChange('expectedROI', e.target.value)} />
        </div>
      </div>

      {/* ── Tasks section ────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ListTodo size={18} /> Tâches ({tasks.length})
          </h3>
          <button type="button" onClick={onAddTask}
            className="flex items-center gap-1 text-sm px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-semibold">
            <Plus size={16} /> Ajouter
          </button>
        </div>

        <div className="space-y-4 max-h-[36rem] overflow-y-auto pr-1">
          {tasks.map((task, idx) => (
            <MarketingTaskForm
              key={task.id ?? `new-${idx}`}
              task={task}
              index={idx}
              members={members}
              mode="inline"
              sprint={sprint}  
              isEstimating={estimatingTaskIdx === idx}
              showRemoveButton={tasks.length > 1}
              onChange={(field, value) => onTaskChange(idx, field, value)}
              onEstimate={() => onEstimateTask(idx)}
              onRemove={() => onRemoveTask(idx)}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-violet-600 flex items-center gap-1.5">
        <Cpu size={12} />
        La durée est estimée par le modèle ML marketing (coût, impressions, clics, conversions, canal…).
      </p>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button onClick={onCancel}
          className="px-5 py-2.5 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors">
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={loading || estimating || !!sprintDateError}
          title={sprintDateError ?? undefined}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors shadow-md shadow-emerald-200"
        >
          {estimating
            ? <><Loader2 size={18} className="animate-spin" />Estimation IA…</>
            : <><Save size={18} />{loading ? 'Enregistrement…' : mode === 'create' ? 'Créer le Sprint' : 'Enregistrer'}</>}
        </button>
      </div>
    </div>
  );

  if (mode === 'edit') return content;

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Plus className="text-emerald-500" size={22} />
          Nouveau Sprint Marketing
        </h2>
      </div>
      {content}
    </div>
  );
};