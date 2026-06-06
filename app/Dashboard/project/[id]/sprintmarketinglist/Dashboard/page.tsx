'use client';
// ─── MarketingDashboardPage.tsx ───────────────────────────────────────────────

import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Clock, Users, Target, DollarSign,
  CheckCircle, AlertTriangle, AlertCircle, Zap, BarChart2,
  Calendar, ChevronRight, Award, Activity,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SprintStat {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  doneTasks: number;
  budget: number;
  spent: number;
  delayDays: number;
  status: 'done' | 'active' | 'upcoming';
}

interface WeeklyPoint {
  week: string;
  tasksRemaining: number;
  tasksIdeal: number;
  leads: number;
  leadsTarget: number;
  velocity: number;
  budgetSpent: number;
  budgetPlanned: number;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const TEAL   = '#0f9e75';
const TEAL_L = '#5dcaa5';
const CYAN   = '#06b6d4';
const CYAN_L = '#67e8f9';
const AMBER  = '#f59e0b';
const RED    = '#ef4444';
const SLATE  = '#64748b';

// ─── Mock data — replace with real API calls ──────────────────────────────────

const SPRINT_DATA: SprintStat[] = [
  { id: 1, name: 'Lancement & SEO',    startDate: '01 avr.', endDate: '15 avr.', totalTasks: 12, doneTasks: 12, budget: 900,  spent: 920,  delayDays: 0,   status: 'done'     },
  { id: 2, name: 'Campagne Email',      startDate: '16 avr.', endDate: '30 avr.', totalTasks: 10, doneTasks: 10, budget: 1100, spent: 980,  delayDays: 0,   status: 'done'     },
  { id: 3, name: 'Social Media',        startDate: '01 mai',  endDate: '20 mai',  totalTasks: 12, doneTasks: 9,  budget: 800,  spent: 870,  delayDays: 1.5, status: 'active'   },
  { id: 4, name: 'PPC & Ads',           startDate: '21 mai',  endDate: '10 jun.', totalTasks: 8,  doneTasks: 3,  budget: 600,  spent: 350,  delayDays: 3.2, status: 'active'   },
  { id: 5, name: 'Analyse & Rapport',   startDate: '11 jun.', endDate: '25 jun.', totalTasks: 10, doneTasks: 0,  budget: 500,  spent: 0,    delayDays: 0,   status: 'upcoming' },
];

const WEEKLY_DATA: WeeklyPoint[] = [
  { week: 'S1', tasksRemaining: 48, tasksIdeal: 46.8, leads: 3,  leadsTarget: 6,  velocity: 4, budgetSpent: 420,  budgetPlanned: 440  },
  { week: 'S2', tasksRemaining: 42, tasksIdeal: 41.6, leads: 9,  leadsTarget: 12, velocity: 6, budgetSpent: 860,  budgetPlanned: 880  },
  { week: 'S3', tasksRemaining: 35, tasksIdeal: 36.4, leads: 16, leadsTarget: 18, velocity: 7, budgetSpent: 1300, budgetPlanned: 1320 },
  { week: 'S4', tasksRemaining: 30, tasksIdeal: 31.2, leads: 22, leadsTarget: 24, velocity: 5, budgetSpent: 1780, budgetPlanned: 1760 },
  { week: 'S5', tasksRemaining: 22, tasksIdeal: 26.0, leads: 31, leadsTarget: 36, velocity: 8, budgetSpent: 2490, budgetPlanned: 2200 },
  { week: 'S6', tasksRemaining: 18, tasksIdeal: 20.8, leads: 38, leadsTarget: 60, velocity: 4, budgetSpent: 3120, budgetPlanned: 2640 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  progress?: number;
  color?: 'teal' | 'amber' | 'red' | 'cyan';
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, progress, color = 'teal' }) => {
  const barColor = { teal: TEAL, amber: AMBER, red: RED, cyan: CYAN }[color];
  const valColor = { teal: '#085041', amber: '#92400e', red: '#991b1b', cyan: '#0e7490' }[color];
  const bgColor  = { teal: 'bg-teal-50', amber: 'bg-amber-50', red: 'bg-red-50', cyan: 'bg-cyan-50' }[color];
  const iconBg   = { teal: 'bg-teal-100 text-teal-600', amber: 'bg-amber-100 text-amber-600', red: 'bg-red-100 text-red-600', cyan: 'bg-cyan-100 text-cyan-600' }[color];

  return (
    <div className={`${bgColor} rounded-2xl p-4 border border-white shadow-sm flex flex-col gap-2 relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {progress !== undefined && (
          <span className="text-xs font-bold" style={{ color: barColor }}>{progress}%</span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold" style={{ color: valColor }}>{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: barColor }} />
        </div>
      )}
    </div>
  );
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-teal-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name} : {typeof p.value === 'number' ? Math.round(p.value).toLocaleString('fr-FR') : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Sprint progress row ──────────────────────────────────────────────────────

const SprintRow: React.FC<{ sprint: SprintStat }> = ({ sprint }) => {
  const pct = sprint.totalTasks > 0 ? Math.round((sprint.doneTasks / sprint.totalTasks) * 100) : 0;
  const barColor = sprint.status === 'done' ? TEAL : sprint.delayDays > 2 ? AMBER : CYAN;
  const statusCfg = {
    done:     { label: 'Terminé',   cls: 'bg-teal-100 text-teal-700'  },
    active:   { label: 'En cours',  cls: 'bg-cyan-100 text-cyan-700'  },
    upcoming: { label: 'À venir',   cls: 'bg-slate-100 text-slate-500' },
  }[sprint.status];

  return (
    <div className={`bg-white rounded-2xl border border-teal-50 p-4 shadow-sm transition-all hover:shadow-md hover:border-teal-200 ${sprint.status === 'upcoming' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: sprint.status === 'done' ? '#e1f5ee' : '#ecfeff' }}>
            {sprint.status === 'done'
              ? <CheckCircle size={16} style={{ color: TEAL }} />
              : sprint.status === 'upcoming'
              ? <Clock size={16} className="text-slate-400" />
              : <Activity size={16} style={{ color: CYAN }} />}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-700 text-sm truncate">{sprint.name}</p>
            <p className="text-xs text-slate-400">{sprint.startDate} → {sprint.endDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
          {sprint.delayDays > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
              <AlertTriangle size={10} /> +{sprint.delayDays}j
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="font-bold" style={{ color: barColor }}>{pct}%</span>
        <span>{sprint.doneTasks}/{sprint.totalTasks} tâches</span>
        <span className="flex items-center gap-1"><DollarSign size={10} />{sprint.spent.toLocaleString('fr-FR')} / {sprint.budget.toLocaleString('fr-FR')} TND</span>
        {sprint.spent > sprint.budget && (
          <span className="text-amber-500 font-semibold">⚠ Dépassement budget</span>
        )}
      </div>
    </div>
  );
};

// ─── Alert card ───────────────────────────────────────────────────────────────

interface AlertItem {
  type: 'danger' | 'warn' | 'ok';
  title: string;
  desc: string;
}

const ALERTS: AlertItem[] = [
  { type: 'danger', title: 'Sprint 4 en retard critique (+3.2j)', desc: '3/8 tâches seulement à J-18. Risque sur la date de livraison.' },
  { type: 'warn',   title: 'Budget consommé à 71% — 60% du temps écoulé', desc: 'Rythme de dépense supérieur au prévu. Réévaluer Sprint 5.' },
  { type: 'warn',   title: '1 membre non assigné sur Sprint 4', desc: '3 tâches PPC sans responsable depuis 5 jours.' },
  { type: 'ok',     title: 'Leads en avance sur Sprints 1 & 2', desc: '38 leads vs 30 attendus. Canal email très performant.' },
];

const AlertCard: React.FC<{ alert: AlertItem }> = ({ alert }) => {
  const cfg = {
    danger: { bg: 'bg-red-50 border-red-200',   icon: <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />,  text: 'text-red-800'  },
    warn:   { bg: 'bg-amber-50 border-amber-200', icon: <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />, text: 'text-amber-800' },
    ok:     { bg: 'bg-teal-50 border-teal-200',  icon: <CheckCircle size={16} className="text-teal-500 shrink-0 mt-0.5" />,  text: 'text-teal-800'  },
  }[alert.type];

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.bg}`}>
      {cfg.icon}
      <div>
        <p className={`text-sm font-bold ${cfg.text}`}>{alert.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{alert.desc}</p>
      </div>
    </div>
  );
};

// ─── Decision card ────────────────────────────────────────────────────────────

interface DecisionItem { color: 'red'|'amber'|'teal'; icon: React.ReactNode; title: string; text: string; }

const DECISIONS: DecisionItem[] = [
  { color: 'red',   icon: <Zap size={18} />,        title: 'Réaffecter des ressources',  text: 'Sprint 4 nécessite 2 membres supplémentaires pour rattraper le retard avant le 10 juin.' },
  { color: 'amber', icon: <DollarSign size={18} />,  title: 'Revoir le budget Sprint 5',  text: 'Il reste ~1 280 TND. Prioriser les tâches à fort impact ROI.' },
  { color: 'teal',  icon: <Award size={18} />,       title: 'Capitaliser sur l\'email',   text: 'Le canal email dépasse les objectifs. Envisager une campagne additionnelle.' },
];

const DecisionCard: React.FC<{ d: DecisionItem }> = ({ d }) => {
  const cfg = {
    red:   { bg: 'bg-red-50 border-red-200',   icon: 'text-red-500',   title: 'text-red-800'   },
    amber: { bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-500', title: 'text-amber-800' },
    teal:  { bg: 'bg-teal-50 border-teal-200',  icon: 'text-teal-600',  title: 'text-teal-800'  },
  }[d.color];

  return (
    <div className={`rounded-2xl border p-4 ${cfg.bg} flex flex-col gap-2`}>
      <div className={`${cfg.icon}`}>{d.icon}</div>
      <p className={`font-bold text-sm ${cfg.title}`}>{d.title}</p>
      <p className="text-xs text-slate-500 leading-relaxed">{d.text}</p>
    </div>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
        {icon}
      </div>
      <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">{title}</h2>
      <div className="flex-1 h-px bg-teal-100" />
    </div>
    {children}
  </div>
);

// ─── Chart card wrapper ───────────────────────────────────────────────────────

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-teal-50 shadow-sm p-4 hover:shadow-md hover:border-teal-200 transition-all">
    <p className="text-sm font-bold text-slate-600 mb-4">{title}</p>
    {children}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const MarketingDashboardPage: React.FC = () => {

  const [activeTab, setActiveTab] = useState<'burndown' | 'budget' | 'velocity' | 'leads'>('burndown');

  const totalTasks  = useMemo(() => SPRINT_DATA.reduce((s, sp) => s + sp.totalTasks, 0),  []);
  const doneTasks   = useMemo(() => SPRINT_DATA.reduce((s, sp) => s + sp.doneTasks, 0),   []);
  const totalBudget = useMemo(() => SPRINT_DATA.reduce((s, sp) => s + sp.budget, 0),      []);
  const spentBudget = useMemo(() => SPRINT_DATA.reduce((s, sp) => s + sp.spent, 0),       []);
  const globalPct   = useMemo(() => Math.round((doneTasks / totalTasks) * 100),            [doneTasks, totalTasks]);
  const budgetPct   = useMemo(() => Math.round((spentBudget / totalBudget) * 100),         [spentBudget, totalBudget]);

  const chartTabs = [
    { key: 'burndown' as const, label: 'Burndown' },
    { key: 'budget'   as const, label: 'Budget'   },
    { key: 'velocity' as const, label: 'Vélocité' },
    { key: 'leads'    as const, label: 'Leads'    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/60 via-white to-cyan-50/40 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shadow-teal-200"
                 style={{ background: 'linear-gradient(135deg, #0f9e75, #06b6d4)' }}>
              <BarChart2 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                Tableau de bord Marketing
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Campagne Q2 2026 · Semaine 6/10 · Mis à jour aujourd'hui
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-teal-100 text-teal-700 border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              En cours
            </span>
          </div>
        </div>

        {/* ── KPIs ───────────────────────────────────────────────────── */}
        <Section icon={<Activity size={14} />} title="Indicateurs clés">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard icon={<TrendingUp size={16} />}    label="Avancement"    value={`${globalPct}%`}          sub="+5% cette semaine"            progress={globalPct}  color="teal"  />
            <KpiCard icon={<CheckCircle size={16} />}   label="Tâches"        value={`${doneTasks}/${totalTasks}`} sub={`${totalTasks - doneTasks} restantes`}   progress={Math.round(doneTasks/totalTasks*100)} color="cyan" />
            <KpiCard icon={<Clock size={16} />}         label="Retard moy."   value="+2.4j"                    sub="3 sprints affectés"           color="amber"         />
            <KpiCard icon={<DollarSign size={16} />}    label="Budget"        value={`${budgetPct}%`}          sub={`${spentBudget.toLocaleString('fr-FR')} / ${totalBudget.toLocaleString('fr-FR')} TND`} progress={budgetPct} color="amber" />
            <KpiCard icon={<Users size={16} />}         label="Membres"       value="4/5"                      sub="1 non assigné"               progress={80}         color="teal"  />
            <KpiCard icon={<Target size={16} />}        label="Leads"         value="38/60"                    sub="63% de l'objectif"            progress={63}         color="cyan"  />
          </div>
        </Section>

        {/* ── Charts ─────────────────────────────────────────────────── */}
        <Section icon={<TrendingUp size={14} />} title="Courbes d'avancement">

          {/* Tab selector */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {chartTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === key
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                    : 'bg-white text-slate-500 border border-teal-100 hover:border-teal-300 hover:text-teal-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Burndown */}
          {activeTab === 'burndown' && (
            <ChartCard title="Burndown — tâches restantes (réel vs idéal)">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={WEEKLY_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={TEAL}   stopOpacity={0.15} />
                      <stop offset="95%" stopColor={TEAL}   stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: SLATE }} />
                  <YAxis tick={{ fontSize: 12, fill: SLATE }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="tasksRemaining" name="Réel"  stroke={TEAL}   strokeWidth={2.5} fill="url(#gradTeal)" dot={{ r: 4, fill: TEAL,   strokeWidth: 2, stroke: '#fff' }} />
                  <Line type="monotone" dataKey="tasksIdeal"     name="Idéal" stroke={TEAL_L} strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded" style={{ background: TEAL }} />Réel</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded border-t border-dashed" style={{ borderColor: TEAL_L }} />Idéal</span>
              </div>
            </ChartCard>
          )}

          {/* Budget */}
          {activeTab === 'budget' && (
            <ChartCard title="Budget cumulé consommé vs planifié (TND)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={WEEKLY_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: SLATE }} />
                  <YAxis tick={{ fontSize: 12, fill: SLATE }} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="budgetPlanned" name="Planifié" fill={TEAL_L} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budgetSpent"   name="Consommé" fill={TEAL}   radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: TEAL_L }} />Planifié</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: TEAL }}   />Consommé</span>
              </div>
            </ChartCard>
          )}

          {/* Velocity */}
          {activeTab === 'velocity' && (
            <ChartCard title="Vélocité hebdomadaire — tâches complétées">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={WEEKLY_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: SLATE }} />
                  <YAxis tick={{ fontSize: 12, fill: SLATE }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="velocity"
                    name="Tâches/sem."
                    radius={[6, 6, 0, 0]}
                    fill={CYAN}
                    label={{ position: 'top', fontSize: 11, fill: SLATE, formatter: (v: number) => `${v}` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Leads */}
          {activeTab === 'leads' && (
            <ChartCard title="Leads générés vs objectif cumulé">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={WEEKLY_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CYAN} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={CYAN} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: SLATE }} />
                  <YAxis tick={{ fontSize: 12, fill: SLATE }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="leads"       name="Réel"    stroke={CYAN}    strokeWidth={2.5} dot={{ r: 5, fill: CYAN,  strokeWidth: 2, stroke: '#fff' }} />
                  <Line type="monotone" dataKey="leadsTarget" name="Objectif" stroke={CYAN_L} strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded" style={{ background: CYAN }}   />Réel</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded border-t border-dashed" style={{ borderColor: CYAN_L }} />Objectif</span>
              </div>
            </ChartCard>
          )}
        </Section>

        {/* ── Sprint list ─────────────────────────────────────────────── */}
        <Section icon={<Calendar size={14} />} title="Avancement par sprint">
          <div className="flex flex-col gap-3">
            {SPRINT_DATA.map((sp) => <SprintRow key={sp.id} sprint={sp} />)}
          </div>
        </Section>

        {/* ── Alerts + Decisions ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Section icon={<AlertTriangle size={14} />} title="Alertes & points d'attention">
            <div className="flex flex-col gap-3">
              {ALERTS.map((a, i) => <AlertCard key={i} alert={a} />)}
            </div>
          </Section>

          <Section icon={<ChevronRight size={14} />} title="Aide à la décision">
            <div className="flex flex-col gap-3">
              {DECISIONS.map((d, i) => <DecisionCard key={i} d={d} />)}
            </div>
          </Section>

        </div>

      </div>
    </div>
  );
};

export default MarketingDashboardPage;