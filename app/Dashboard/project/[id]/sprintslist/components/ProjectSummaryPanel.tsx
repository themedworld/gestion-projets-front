'use client';
// ─── ProjectSummaryPanel.tsx ──────────────────────────────────────────────────
// Displays project-level metrics computed after sprint/task save.
// Shows: total hours, team size, estimated duration, cost, per-sprint breakdown,
// and all validation warnings (task dates vs sprint, sprint vs project).

import React, { useState } from 'react';
import { Clock, Users, CalendarDays, DollarSign, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import type { ProjectMetrics } from '@/Dashboard/project/[id]/sprintslist/services/projectMetrics';

interface Props {
  metrics: ProjectMetrics;
}

export const ProjectSummaryPanel: React.FC<Props> = ({ metrics }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  const fmtCost = (n: number) =>
    n.toLocaleString('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const errors   = metrics.warnings.filter((w) => w.severity === 'error');
  const warnings = metrics.warnings.filter((w) => w.severity === 'warning');

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-100 flex items-center gap-2">
        <TrendingUp size={20} className="text-violet-600" />
        <h2 className="text-base font-bold text-slate-800">Résumé du Projet</h2>
        <span className="ml-auto text-xs text-slate-400 italic">Calculé automatiquement après enregistrement</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
        <KpiCard
          icon={<Clock size={18} className="text-indigo-500" />}
          label="Total Heures"
          value={`${fmt(metrics.totalHours)} h`}
          sub="somme des estimations IA"
        />
        <KpiCard
          icon={<Users size={18} className="text-violet-500" />}
          label="Taille d'équipe"
          value={`${metrics.teamSize} membre${metrics.teamSize > 1 ? 's' : ''}`}
          sub="membres assignés distincts"
        />
        <KpiCard
          icon={<CalendarDays size={18} className="text-emerald-500" />}
          label="Durée Estimée"
          value={`${metrics.durationDays} jour${metrics.durationDays > 1 ? 's' : ''}`}
          sub={`heures / 8 / ${metrics.teamSize} membre${metrics.teamSize > 1 ? 's' : ''}`}
        />
        <KpiCard
          icon={<DollarSign size={18} className="text-amber-500" />}
          label="Coût Estimé"
          value={fmtCost(metrics.estimatedCost)}
          sub="taux par niveau (Junior→Expert)"
        />
      </div>

      {/* Warnings / Errors */}
      {metrics.warnings.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 space-y-2">
          {errors.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {metrics.warnings.length === 0 && metrics.totalHours > 0 && (
        <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 size={15} />
          <span>Toutes les dates de tâches et de sprints sont cohérentes.</span>
        </div>
      )}

      {/* Per-sprint breakdown (collapsible) */}
      {metrics.sprintMetrics.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setShowBreakdown((v) => !v)}
            className="w-full px-6 py-3 flex items-center justify-between text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span>Détail par sprint ({metrics.sprintMetrics.length})</span>
            {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showBreakdown && (
            <div className="px-6 pb-4 space-y-2">
              {metrics.sprintMetrics.map((sm) => (
                <div key={sm.sprintId} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-200">
                  <span className="font-semibold text-slate-700 truncate flex-1">{sm.sprintName}</span>
                  <div className="flex items-center gap-4 flex-shrink-0 text-slate-500">
                    <span>{fmt(sm.totalHours)} h estimées</span>
                    <span>{sm.durationDays} j calendrier</span>
                    {sm.taskWarnings.length > 0 && (
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        <AlertTriangle size={13} />
                        {sm.taskWarnings.length} date{sm.taskWarnings.length > 1 ? 's' : ''} invalide{sm.taskWarnings.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── KPI sub-component ────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}> = ({ icon, label, value, sub }) => (
  <div className="px-6 py-5 flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {icon}
      {label}
    </div>
    <div className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</div>
    <div className="text-[11px] text-slate-400">{sub}</div>
  </div>
);