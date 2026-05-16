'use client';
// ─── MarketingTaskForm.tsx ────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  Trash2, Save, Loader2, Cpu, Calendar, DollarSign, User, AlertTriangle,
} from 'lucide-react';
import type {
  TaskMarketing,
  TaskMarketingType,
  TaskMarketingStatus,
  TaskMarketingPriority,
  ProjectMember,
  SprintMarketing,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import {
  inputClass,
  labelClass,
  CHANNEL_OPTIONS,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';
import {
  formatHours,
  safeNum,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Marketingestimationservice';
import { validateTaskDates } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Datevalidation';

// ─── Enum values — must match backend TaskMarketingType exactly ───────────────
const TASK_TYPE_OPTIONS: { value: TaskMarketingType; label: string }[] = [
  { value: 'CAMPAIGN'         as TaskMarketingType, label: 'Campagne' },
  { value: 'CONTENT_CREATION' as TaskMarketingType, label: 'Création de contenu' },
  { value: 'SEO'              as TaskMarketingType, label: 'SEO' },
  { value: 'SOCIAL_MEDIA'     as TaskMarketingType, label: 'Réseaux sociaux' },
  { value: 'EMAIL'            as TaskMarketingType, label: 'Email' },
  { value: 'PPC'              as TaskMarketingType, label: 'PPC' },
  { value: 'ANALYTICS'        as TaskMarketingType, label: 'Analytique' },
  { value: 'DESIGN'           as TaskMarketingType, label: 'Design' },
  { value: 'COPYWRITING'      as TaskMarketingType, label: 'Copywriting' },
  { value: 'OTHER'            as TaskMarketingType, label: 'Autre' },
];

interface MarketingTaskFormProps {
  task: TaskMarketing;
  index?: number;
  members: ProjectMember[];
  mode: 'inline' | 'edit';
  sprint?: SprintMarketing;
  isEstimating?: boolean;
  loading?: boolean;
  showRemoveButton?: boolean;
  onChange: (field: keyof TaskMarketing, value: unknown) => void;
  onEstimate?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
}

const resolveAssignedId = (val: TaskMarketing['assignedTo']): string => {
  if (!val) return '';
  if (typeof val === 'object' && 'id' in val) return String((val as { id: number }).id);
  return String(val);
};

export const MarketingTaskForm: React.FC<MarketingTaskFormProps> = ({
  task,
  index,
  members,
  mode,
  sprint,
  isEstimating = false,
  loading = false,
  showRemoveButton = false,
  onChange,
  onEstimate,
  onSave,
  onCancel,
  onRemove,
}) => {
  const isExisting = !!task.id;
  const aiHours    = task.aiEstimatedHours ?? task.estimatedHours ?? 0;
  const assignedId = resolveAssignedId(task.assignedTo);

  // ── Date helpers ──────────────────────────────────────────────────────────
  const dateVal = (field: 'scheduledStartDate' | 'scheduledEndDate'): string => {
    const v = task[field];
    if (!v) return '';
    return String(v).split('T')[0];
  };

  // HTML min/max — clamp picker to sprint bounds
  const sprintMinDate = sprint?.startDate ? sprint.startDate.split('T')[0] : undefined;
  const sprintMaxDate = sprint?.endDate   ? sprint.endDate.split('T')[0]   : undefined;
  // End date minimum = task start (if set) OR sprint start
  const endMin = dateVal('scheduledStartDate') || sprintMinDate;

  // ── Validation ────────────────────────────────────────────────────────────
  const dateError = useMemo(
    () =>
      sprint
        ? validateTaskDates(
            task.scheduledStartDate,
            task.scheduledEndDate,
            sprint.startDate,
            sprint.endDate,
          )
        : null,
    [task.scheduledStartDate, task.scheduledEndDate, sprint],
  );

  // ── Channel multi-picker ──────────────────────────────────────────────────
  const selectedChannels: string[] = useMemo(
    () => (task.channel ?? '').split(';').map((s) => s.trim()).filter(Boolean),
    [task.channel],
  );

  const toggleChannel = (ch: string) => {
    const next = selectedChannels.includes(ch)
      ? selectedChannels.filter((c) => c !== ch)
      : [...selectedChannels, ch];
    onChange('channel', next.join(';'));
  };

  return (
    <div
      className={
        mode === 'edit'
          ? 'p-5 bg-emerald-50 border border-emerald-200 rounded-xl mt-3 space-y-4'
          : 'p-5 bg-slate-50 border border-slate-200 rounded-xl'
      }
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      {mode === 'inline' && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-700">
            Tâche {index !== undefined ? index + 1 : ''}{' '}
            <span className="text-xs font-normal text-slate-400">
              {isExisting ? '(existante)' : '(nouvelle)'}
            </span>
          </span>
          <div className="flex items-center gap-2">
            {onEstimate && (
              <button
                type="button"
                onClick={onEstimate}
                disabled={isEstimating || !task.title.trim()}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50 rounded-lg transition-colors"
              >
                {isEstimating
                  ? <><Loader2 size={12} className="animate-spin" />Estimation…</>
                  : <><Cpu size={12} />Estimer</>}
              </button>
            )}
            {showRemoveButton && !isExisting && (
              <button
                onClick={onRemove}
                className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-emerald-800">Éditer la tâche</h5>
          {onEstimate && (
            <button
              type="button"
              onClick={onEstimate}
              disabled={isEstimating}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50 rounded-lg transition-colors"
            >
              {isEstimating
                ? <><Loader2 size={13} className="animate-spin" />Estimation…</>
                : <><Cpu size={13} />Re-estimer avec l'IA</>}
            </button>
          )}
        </div>
      )}

      {/* AI estimate badge */}
      {safeNum(aiHours) > 0 && (
        <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
          <Cpu size={13} />
          Estimation IA : <strong className="ml-1">{formatHours(safeNum(aiHours))}</strong>
        </div>
      )}

      {/* Date validation warning */}
      {dateError && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={13} className="shrink-0" />
          {dateError}
        </div>
      )}

      {/* ── Fields ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

        {/* Title */}
        <div className="md:col-span-6">
          <label className={labelClass}>Titre *</label>
          <input
            type="text"
            placeholder="Ex: Campagne email re-engagement"
            className={inputClass}
            value={task.title}
            onChange={(e) => onChange('title', e.target.value)}
          />
        </div>

        {/* Assigned to */}
        <div className="md:col-span-3">
          <label className={labelClass}>
            <User size={11} className="inline mr-1" />Assigné à
          </label>
          <select
            className={inputClass}
            value={assignedId}
            onChange={(e) => onChange('assignedTo', e.target.value)}
          >
            <option value="">Non assigné</option>
            {members.map((m) => {
              const label =
                m.fullname ??
                m.name ??
                `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
              return (
                <option key={m.id} value={m.id}>
                  {label}{m.level ? ` (${m.level})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Type */}
        <div className="md:col-span-3">
          <label className={labelClass}>Type</label>
          <select
            className={inputClass}
            value={task.type}
            onChange={(e) => onChange('type', e.target.value as TaskMarketingType)}
          >
            {TASK_TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-12">
          <label className={labelClass}>Description</label>
          <textarea
            rows={2}
            placeholder="Objectifs, critères de succès…"
            className={`${inputClass} resize-none`}
            value={task.description ?? ''}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className={labelClass}>Statut</label>
          <select
            className={inputClass}
            value={task.status}
            onChange={(e) => onChange('status', e.target.value as TaskMarketingStatus)}
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
          <label className={labelClass}>Priorité</label>
          <select
            className={inputClass}
            value={task.priority}
            onChange={(e) => onChange('priority', e.target.value as TaskMarketingPriority)}
          >
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>
        </div>

        {/* Budget */}
        <div className="md:col-span-2">
          <label className={labelClass}>
            <DollarSign size={11} className="inline mr-1" />Budget (€)
          </label>
          <input
            type="number"
            min="0"
            placeholder="0"
            className={inputClass}
            value={safeNum(task.budget) || ''}
            onChange={(e) => onChange('budget', e.target.value)}
          />
        </div>

        {/* ── Scheduled dates (clamped to sprint bounds) ────────────── */}
        <div className="md:col-span-3">
          <label className={labelClass}>
            <Calendar size={11} className="inline mr-1" />Date début prévue
            {sprintMinDate && (
              <span className="ml-1 text-slate-400 font-normal normal-case text-[10px]">
                min {sprintMinDate}
              </span>
            )}
          </label>
          <input
            type="date"
            className={`${inputClass} ${dateError ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
            value={dateVal('scheduledStartDate')}
            min={sprintMinDate}
            max={sprintMaxDate}
            onChange={(e) => onChange('scheduledStartDate', e.target.value || null)}
          />
        </div>

        <div className="md:col-span-3">
          <label className={labelClass}>
            <Calendar size={11} className="inline mr-1" />Date fin prévue
            {sprintMaxDate && (
              <span className="ml-1 text-slate-400 font-normal normal-case text-[10px]">
                max {sprintMaxDate}
              </span>
            )}
          </label>
          <input
            type="date"
            className={`${inputClass} ${dateError ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
            value={dateVal('scheduledEndDate')}
            min={endMin}        // >= task start OR sprint start
            max={sprintMaxDate} // cannot exceed sprint end
            onChange={(e) => onChange('scheduledEndDate', e.target.value || null)}
          />
        </div>

        {/* ── Channel picker ────────────────────────────────────────── */}
        <div className="md:col-span-12">
          <label className={labelClass}>
            Canaux{' '}
            <span className="text-slate-400 normal-case font-normal">
              (valeurs acceptées par le modèle ML)
            </span>
          </label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CHANNEL_OPTIONS.map((ch) => {
              const active = selectedChannels.includes(ch);
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-colors ${
                    active
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                >
                  {ch}
                </button>
              );
            })}
          </div>
          {selectedChannels.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Sélectionnés :{' '}
              <span className="font-semibold text-emerald-700">
                {selectedChannels.join(', ')}
              </span>
            </p>
          )}
        </div>

        {/* ── AI model inputs ───────────────────────────────────────── */}
        <div className="md:col-span-12 mt-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Données pour l'estimation IA
          </p>
        </div>

        {(
          [
            { field: 'cost',                label: 'Coût (€)',      placeholder: '1200',  isFloat: true  },
            { field: 'impressions',         label: 'Impressions',   placeholder: '15000', isFloat: false },
            { field: 'expectedClicks',      label: 'Clics',         placeholder: '600',   isFloat: false },
            { field: 'expectedConversions', label: 'Conversions',   placeholder: '25',    isFloat: false },
            { field: 'expectedLeads',       label: 'Leads',         placeholder: '6',     isFloat: false },
            { field: 'expectedCTR',         label: 'CTR (0.0–1.0)', placeholder: '0.04',  isFloat: true  },
          ] as const
        ).map(({ field, label, placeholder, isFloat }) => (
          <div key={field} className="md:col-span-2 sm:col-span-4">
            <label className={labelClass}>{label}</label>
            <input
              type="number"
              step={isFloat ? '0.01' : '1'}
              min="0"
              placeholder={placeholder}
              className={inputClass}
              value={
                (task as Record<string, unknown>)[field] != null
                  ? String((task as Record<string, unknown>)[field])
                  : ''
              }
              onChange={(e) => onChange(field as keyof TaskMarketing, e.target.value)}
            />
          </div>
        ))}

        {/* Score / Complexity / Effort */}
        {(
          [
            { field: 'score',      label: 'Score qualité (1–5)' },
            { field: 'complexity', label: 'Complexité (1–5)'    },
            { field: 'effort',     label: 'Effort (1–5)'        },
          ] as const
        ).map(({ field, label }) => (
          <div key={field} className="md:col-span-2 sm:col-span-4">
            <label className={labelClass}>{label}</label>
            <select
              className={inputClass}
              value={String(safeNum((task as Record<string, unknown>)[field]) || 1)}
              onChange={(e) => onChange(field as keyof TaskMarketing, Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* ── Save / Cancel (edit mode) ─────────────────────────────── */}
      {mode === 'edit' && (
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 text-sm transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={loading || isEstimating || !!dateError}
            title={dateError ?? undefined}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-emerald-400 text-sm transition-colors"
          >
            {isEstimating
              ? <><Loader2 size={14} className="animate-spin" />Estimation…</>
              : <><Save size={14} />Enregistrer</>}
          </button>
        </div>
      )}
    </div>
  );
};