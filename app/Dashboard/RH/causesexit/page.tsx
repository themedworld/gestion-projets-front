"use client";

import { useEffect, useState, useMemo } from "react";
import {
  TrendingDown, Users, Clock, DollarSign, AlertTriangle,
  ThumbsUp, ThumbsDown, Loader2, RefreshCw, Filter,
} from "lucide-react";
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, LabelList,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberProfile {
  id: number;
  userId: number;
  contractType: string;
  hireDate: string;
  employmentStatus: string;
  position: string | null;
  baseSalary: number | null;
  bonuses: number;
  performanceRating: number;
  attendanceRate: number;
  absenceCount: number;
  deactivationDate: string | null;
  departureReason: string | null;
  globalScore: number;
  grade: string;
  totalTasksDone: number;
  onTimeCount: number;
  lateCount: number;
  avgDelayHours: number;
  onTimeRate: number;
  itTasksDone: number;
  itScore: number;
  marketingTasksDone: number;
  marketingScore: number;
  callCenterTasksDone: number;
  callCenterScore: number;
  scoreEvolution: number | null;
  user?: { fullname: string; role: string; memberlevel?: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  resignation: "Démission",
  termination: "Licenciement",
  end_of_contract: "Fin contrat",
  retirement: "Retraite",
  other: "Autre",
};

const REASON_COLORS: Record<string, string> = {
  resignation: "#E24B4A",
  termination: "#BA7517",
  end_of_contract: "#378ADD",
  retirement: "#639922",
  other: "#888780",
};

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI", cdd: "CDD", stage: "Stage", freelance: "Freelance",
};

const CONTRACT_COLORS: Record<string, string> = {
  cdi: "#1D9E75", cdd: "#378ADD", stage: "#E24B4A", freelance: "#888780",
};

const LEVEL_COLORS: Record<string, string> = {
  junior: "#378ADD", senior: "#7F77DD", expert: "#EF9F27",
};

const X_AXIS_OPTIONS = [
  { value: "tenure",            label: "Durée (mois)" },
  { value: "baseSalary",        label: "Salaire (TND)" },
  { value: "performanceRating", label: "Note RH" },
  { value: "absenceCount",      label: "Absences" },
  { value: "attendanceRate",    label: "Assiduité %" },
  { value: "globalScore",       label: "Score perf." },
];

const Y_AXIS_OPTIONS = [
  { value: "baseSalary",        label: "Salaire (TND)" },
  { value: "tenure",            label: "Durée (mois)" },
  { value: "performanceRating", label: "Note RH" },
  { value: "absenceCount",      label: "Absences" },
  { value: "attendanceRate",    label: "Assiduité %" },
  { value: "globalScore",       label: "Score perf." },
];

const COLOR_BY_OPTIONS = [
  { value: "reason",   label: "Raison départ" },
  { value: "contract", label: "Contrat" },
  { value: "level",    label: "Niveau" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTenureMonths(hireDate: string, deactivationDate: string | null): number {
  const start = new Date(hireDate);
  const end = deactivationDate ? new Date(deactivationDate) : new Date();
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

type EnrichedProfile = MemberProfile & { tenure: number };

function getFieldValue(p: EnrichedProfile, key: string): number {
  const map: Record<string, number> = {
    tenure: p.tenure,
    baseSalary: p.baseSalary ?? 0,
    performanceRating: p.performanceRating,
    absenceCount: p.absenceCount,
    attendanceRate: p.attendanceRate,
    globalScore: p.globalScore,
  };
  return map[key] ?? 0;
}

function getLevel(p: MemberProfile): string {
  return p.user?.memberlevel ?? "junior";
}

function getColorForMember(p: MemberProfile, colorBy: string): { color: string; label: string } {
  if (colorBy === "reason") {
    const r = p.departureReason ?? "other";
    return { color: REASON_COLORS[r] ?? "#888", label: REASON_LABELS[r] ?? r };
  }
  if (colorBy === "contract") {
    return {
      color: CONTRACT_COLORS[p.contractType] ?? "#888",
      label: CONTRACT_LABELS[p.contractType] ?? p.contractType,
    };
  }
  const lvl = getLevel(p);
  return {
    color: LEVEL_COLORS[lvl] ?? "#888",
    label: lvl.charAt(0).toUpperCase() + lvl.slice(1),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = "text-slate-900" }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-600">
      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6">
      <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

// Custom tooltip for scatter
function ScatterTooltip({ active, payload, xAxis, yAxis }: any) {
  if (!active || !payload?.length) return null;
  const xLabel = X_AXIS_OPTIONS.find(o => o.value === xAxis)?.label;
  const yLabel = Y_AXIS_OPTIONS.find(o => o.value === yAxis)?.label;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{payload[0]?.name}</p>
      <p className="text-slate-500">{xLabel}: <span className="font-medium text-slate-800">{d?.x}</span></p>
      <p className="text-slate-500">{yLabel}: <span className="font-medium text-slate-800">{d?.y}</span></p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExitAnalyticsPage() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [activeProfiles, setActiveProfiles] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [xAxis, setXAxis] = useState("tenure");
  const [yAxis, setYAxis] = useState("baseSalary");
  const [colorBy, setColorBy] = useState("reason");
  const [filterContract, setFilterContract] = useState("all");
  const [filterReason, setFilterReason] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_NEST_API_URL}/member-profiles`,
          { headers }
        );
        if (!res.ok) throw new Error("Erreur lors du chargement des profils");
        const all: MemberProfile[] = await res.json();
        setProfiles(all.filter(p => p.employmentStatus === "inactive" || p.employmentStatus === "terminated"));
        setActiveProfiles(all.filter(p => p.employmentStatus === "active"));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enriched = useMemo<EnrichedProfile[]>(() =>
    profiles.map(p => ({ ...p, tenure: calcTenureMonths(p.hireDate, p.deactivationDate) })),
    [profiles]
  );

  const filtered = useMemo<EnrichedProfile[]>(() =>
    enriched.filter(p => {
      if (filterContract !== "all" && p.contractType !== filterContract) return false;
      if (filterReason !== "all" && (p.departureReason ?? "other") !== filterReason) return false;
      return true;
    }),
    [enriched, filterContract, filterReason]
  );

  // ── KPIs ──
  const avgTenure = filtered.length
    ? Math.round(filtered.reduce((s, p) => s + p.tenure, 0) / filtered.length) : 0;
  const medianSalary = median(filtered.map(p => p.baseSalary ?? 0));

  const reasonCounts = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach(p => { const r = p.departureReason ?? "other"; c[r] = (c[r] || 0) + 1; });
    return c;
  }, [filtered]);
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];

  const levelCounts = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach(p => { const l = getLevel(p); c[l] = (c[l] || 0) + 1; });
    return c;
  }, [filtered]);
  const topLevel = Object.entries(levelCounts).sort((a, b) => b[1] - a[1])[0];

  // ── Scatter: group by colorBy ──
  const scatterGroups = useMemo(() => {
    const groups: Record<string, { color: string; points: { x: number; y: number }[] }> = {};
    filtered.forEach(p => {
      const { color, label } = getColorForMember(p, colorBy);
      if (!groups[label]) groups[label] = { color, points: [] };
      groups[label].points.push({ x: getFieldValue(p, xAxis), y: getFieldValue(p, yAxis) });
    });
    return Object.entries(groups).map(([label, g]) => ({ label, color: g.color, points: g.points }));
  }, [filtered, xAxis, yAxis, colorBy]);

  const scatterLegendItems = useMemo(() => {
    const seen = new Set<string>();
    const items: { color: string; label: string }[] = [];
    filtered.forEach(p => {
      const { color, label } = getColorForMember(p, colorBy);
      if (!seen.has(label)) { seen.add(label); items.push({ color, label }); }
    });
    return items;
  }, [filtered, colorBy]);

  // ── Stacked bar: reasons by contract ──
  const reasonByContractData = useMemo(() => {
    const contracts = ["cdi", "cdd", "stage", "freelance"];
    const reasons = Object.keys(REASON_LABELS);
    return contracts.map(c => {
      const row: Record<string, any> = { contract: CONTRACT_LABELS[c] };
      reasons.forEach(r => {
        row[REASON_LABELS[r]] = filtered.filter(
          p => p.contractType === c && (p.departureReason ?? "other") === r
        ).length;
      });
      return row;
    });
  }, [filtered]);

  // ── Tenure by level ──
  const tenureByLevelData = useMemo(() => {
    const levels = ["junior", "senior", "expert"];
    return levels.map(l => {
      const grp = filtered.filter(p => getLevel(p) === l);
      return {
        level: l.charAt(0).toUpperCase() + l.slice(1),
        value: grp.length ? Math.round(grp.reduce((s, p) => s + p.tenure, 0) / grp.length) : 0,
        color: LEVEL_COLORS[l],
      };
    });
  }, [filtered]);

  // ── Salary distribution ──
  const salaryBuckets = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000];
  function buildHist(salaries: number[]) {
    return salaryBuckets.slice(0, -1).map((_, i) =>
      salaries.filter(v => v >= salaryBuckets[i] && v < salaryBuckets[i + 1]).length
    );
  }
  const salaryDistData = useMemo(() => {
    const exiting = buildHist(filtered.map(p => p.baseSalary ?? 0));
    const active = buildHist(activeProfiles.map(p => p.baseSalary ?? 0));
    return salaryBuckets.slice(0, -1).map((b, i) => ({
      range: `${b}–${salaryBuckets[i + 1]}`,
      Sortants: exiting[i],
      Actifs: active[i],
    }));
  }, [filtered, activeProfiles]);

  // ── Performance by reason ──
  const perfByReasonData = useMemo(() =>
    Object.keys(REASON_LABELS).map(r => {
      const grp = filtered.filter(p => (p.departureReason ?? "other") === r);
      return {
        reason: REASON_LABELS[r],
        value: grp.length
          ? Math.round((grp.reduce((s, p) => s + p.performanceRating, 0) / grp.length) * 10) / 10
          : 0,
        color: REASON_COLORS[r],
      };
    }),
    [filtered]
  );

  // ── Attendance by reason ──
  const attendanceByReasonData = useMemo(() =>
    Object.keys(REASON_LABELS).map(r => {
      const grp = filtered.filter(p => (p.departureReason ?? "other") === r);
      return {
        reason: REASON_LABELS[r],
        value: grp.length
          ? Math.round(grp.reduce((s, p) => s + p.attendanceRate, 0) / grp.length)
          : 0,
        color: REASON_COLORS[r],
      };
    }),
    [filtered]
  );

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl mt-10 rounded-2xl bg-red-50 border border-red-100 p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 text-red-400" size={32} />
        <p className="text-red-700 font-medium text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analyse des départs</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} membre{filtered.length > 1 ? "s" : ""} inactif{filtered.length > 1 ? "s" : ""} analysé{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={15} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtres</span>
        <select
          value={filterContract}
          onChange={e => setFilterContract(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
        >
          <option value="all">Tous les contrats</option>
          {Object.entries(CONTRACT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={filterReason}
          onChange={e => setFilterReason(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
        >
          <option value="all">Toutes les raisons</option>
          {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {(filterContract !== "all" || filterReason !== "all") && (
          <button
            onClick={() => { setFilterContract("all"); setFilterReason("all"); }}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Membres analysés" value={filtered.length} />
        <KpiCard label="Durée moy. avant départ" value={`${avgTenure} mois`} color="text-amber-600" />
        <KpiCard label="Salaire médian" value={`${medianSalary.toLocaleString("fr-FR")} TND`} color="text-blue-700" />
        <KpiCard
          label="Principale raison"
          value={topReason ? REASON_LABELS[topReason[0]] : "—"}
          sub={topReason ? `${topReason[1]} cas` : ""}
          color="text-red-600"
        />
        <KpiCard
          label="Niveau à risque"
          value={topLevel ? topLevel[0].charAt(0).toUpperCase() + topLevel[0].slice(1) : "—"}
          sub={topLevel ? `${topLevel[1]} départs` : ""}
          color="text-violet-600"
        />
      </div>

      {/* ── Scatter ── */}
      <SectionCard title="Courbe personnalisable — axe X / axe Y" icon={<TrendingDown size={15} className="text-blue-500" />}>
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Axe X :</span>
            <select value={xAxis} onChange={e => setXAxis(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none">
              {X_AXIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Axe Y :</span>
            <select value={yAxis} onChange={e => setYAxis(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none">
              {Y_AXIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Couleur :</span>
            <select value={colorBy} onChange={e => setColorBy(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none">
              {COLOR_BY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-3">
          {scatterLegendItems.map(i => <LegendDot key={i.label} {...i} />)}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number" dataKey="x"
              name={X_AXIS_OPTIONS.find(o => o.value === xAxis)?.label}
              label={{ value: X_AXIS_OPTIONS.find(o => o.value === xAxis)?.label, position: "insideBottom", offset: -15, fontSize: 11 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="number" dataKey="y"
              name={Y_AXIS_OPTIONS.find(o => o.value === yAxis)?.label}
              label={{ value: Y_AXIS_OPTIONS.find(o => o.value === yAxis)?.label, angle: -90, position: "insideLeft", fontSize: 11 }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<ScatterTooltip xAxis={xAxis} yAxis={yAxis} />} />
            {scatterGroups.map(g => (
              <Scatter key={g.label} name={g.label} data={g.points} fill={g.color} fillOpacity={0.75} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* ── 2 colonnes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Raisons par contrat */}
        <SectionCard title="Raisons de départ par contrat" icon={<Users size={15} className="text-violet-500" />}>
          <div className="flex flex-wrap gap-3 mb-3">
            {Object.entries(REASON_LABELS).map(([k, v]) => (
              <LegendDot key={k} color={REASON_COLORS[k]} label={v} />
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={reasonByContractData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="contract" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              {Object.entries(REASON_LABELS).map(([k, v]) => (
                <Bar key={k} dataKey={v} stackId="a" fill={REASON_COLORS[k]} radius={k === "other" ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Durée par niveau */}
        <SectionCard title="Durée moy. avant départ par niveau" icon={<Clock size={15} className="text-amber-500" />}>
          <div className="flex flex-wrap gap-3 mb-3">
            {Object.entries(LEVEL_COLORS).map(([k, v]) => (
              <LegendDot key={k} color={v} label={k.charAt(0).toUpperCase() + k.slice(1)} />
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tenureByLevelData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="level" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: "Mois", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v} mois`, "Durée moy."]} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {tenureByLevelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Note RH par raison */}
        <SectionCard title="Note RH moyenne par raison de départ" icon={<TrendingDown size={15} className="text-rose-500" />}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={perfByReasonData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="reason" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} label={{ value: "/ 5", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v} / 5`, "Note RH moy."]} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {perfByReasonData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Assiduité par raison */}
        <SectionCard title="Assiduité moyenne par raison de départ" icon={<Clock size={15} className="text-blue-500" />}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attendanceByReasonData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="reason" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: "%", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, "Assiduité moy."]} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {attendanceByReasonData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Distribution salariale */}
      <SectionCard title="Distribution salariale — sortants vs actifs" icon={<DollarSign size={15} className="text-emerald-500" />}>
        <div className="flex flex-wrap gap-3 mb-3">
          <LegendDot color="#E24B4A" label="Sortants (inactifs)" />
          <LegendDot color="#1D9E75" label="Actifs (référence)" />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={salaryDistData} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="range" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} label={{ value: "Nombre", angle: -90, position: "insideLeft", fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="Sortants" fill="#E24B4A" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Actifs" fill="#1D9E75" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* ── Profils ── */}
      <SectionCard title="Profils à recruter vs profils à risque" icon={<Users size={15} className="text-slate-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Bon profil */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp size={16} className="text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">Profil idéal à recruter</p>
            </div>
            {[
              ["Contrat", "CDI"],
              ["Niveau", "Senior"],
              ["Salaire", "3 500 – 5 000 TND"],
              ["Assiduité min.", "≥ 90%"],
              ["Note RH min.", "≥ 3.5 / 5"],
              ["Durée moy. prévue", `${Math.round(
                filtered.filter(p => getLevel(p) === "senior").reduce((s, p) => s + p.tenure, 0) /
                Math.max(filtered.filter(p => getLevel(p) === "senior").length, 1)
              )} mois`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2 border-b border-emerald-100 last:border-0">
                <span className="text-xs text-emerald-700">{k}</span>
                <span className="text-xs font-semibold text-emerald-900">{v}</span>
              </div>
            ))}
          </div>

          {/* Profil risqué */}
          <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown size={16} className="text-red-500" />
              <p className="text-sm font-semibold text-red-800">Profil à risque élevé</p>
            </div>
            {[
              ["Contrat", "Stage / CDD"],
              ["Niveau", "Junior"],
              ["Salaire", `< ${Math.round(
                median(filtered.filter(p => getLevel(p) === "junior").map(p => p.baseSalary ?? 0))
              ).toLocaleString("fr-FR")} TND`],
              ["Assiduité", "< 75%"],
              ["Note RH", "< 2.5 / 5"],
              ["Durée moy. prévue", `${Math.round(
                filtered.filter(p => getLevel(p) === "junior").reduce((s, p) => s + p.tenure, 0) /
                Math.max(filtered.filter(p => getLevel(p) === "junior").length, 1)
              )} mois`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2 border-b border-red-100 last:border-0">
                <span className="text-xs text-red-700">{k}</span>
                <span className="text-xs font-semibold text-red-900">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Insights calculés</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Taux démission juniors",
                value: filtered.filter(p => getLevel(p) === "junior").length
                  ? Math.round(
                      filtered.filter(p => getLevel(p) === "junior" && p.departureReason === "resignation").length /
                      Math.max(filtered.filter(p => getLevel(p) === "junior").length, 1) * 100
                    ) + "%"
                  : "—",
                color: "text-red-600",
              },
              {
                label: "Durée moy. stage",
                value: filtered.filter(p => p.contractType === "stage").length
                  ? Math.round(
                      filtered.filter(p => p.contractType === "stage").reduce((s, p) => s + p.tenure, 0) /
                      filtered.filter(p => p.contractType === "stage").length
                    ) + " mois"
                  : "—",
                color: "text-amber-600",
              },
              {
                label: "Assiduité moy. licenciés",
                value: filtered.filter(p => p.departureReason === "termination").length
                  ? Math.round(
                      filtered.filter(p => p.departureReason === "termination").reduce((s, p) => s + p.attendanceRate, 0) /
                      filtered.filter(p => p.departureReason === "termination").length
                    ) + "%"
                  : "—",
                color: "text-red-600",
              },
              {
                label: "Score moy. démissionnaires",
                value: filtered.filter(p => p.departureReason === "resignation").length
                  ? Math.round(
                      filtered.filter(p => p.departureReason === "resignation").reduce((s, p) => s + p.globalScore, 0) /
                      filtered.filter(p => p.departureReason === "resignation").length
                    ) + " pts"
                  : "—",
                color: "text-violet-600",
              },
              {
                label: "Durée moy. experts",
                value: filtered.filter(p => getLevel(p) === "expert").length
                  ? Math.round(
                      filtered.filter(p => getLevel(p) === "expert").reduce((s, p) => s + p.tenure, 0) /
                      filtered.filter(p => getLevel(p) === "expert").length
                    ) + " mois"
                  : "—",
                color: "text-emerald-600",
              },
              {
                label: "Salaire moy. CDI sortants",
                value: filtered.filter(p => p.contractType === "cdi").length
                  ? Math.round(
                      filtered.filter(p => p.contractType === "cdi").reduce((s, p) => s + (p.baseSalary ?? 0), 0) /
                      filtered.filter(p => p.contractType === "cdi").length
                    ).toLocaleString("fr-FR") + " TND"
                  : "—",
                color: "text-blue-600",
              },
            ].map(i => (
              <div key={i.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                <p className="text-xs text-slate-500 mb-1">{i.label}</p>
                <p className={`text-base font-bold ${i.color}`}>{i.value}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

    </div>
  );
}