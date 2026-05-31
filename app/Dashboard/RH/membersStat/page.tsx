"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, Award, TrendingUp, TrendingDown, ChevronUp, ChevronDown,
  ChevronsUpDown, BarChart2, Activity, Star, Eye, Building2, Filter,
  Download, AlertCircle, XCircle, Loader2, Medal, Target, Minus,
  CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";

// ─── Enums ────────────────────────────────────────────────────────────────────

enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN_COMPANY = "admin_company",
  MANAGER = "manager",
  PROJECT_MANAGER = "project_manager",
  CALL_CENTER_MANAGER = "call_center_manager",
  SALES_MANAGER = "sales_manager",
  MARKETING_MANAGER = "marketing_manager",
  QUALITY_MANAGER = "quality_manager",
  HR_MANAGER = "hr_manager",
  AGENT_TELEPRO = "agent_telepro",
  COMMERCIAL = "commercial",
  MARKETING_AGENT = "marketing_agent",
  QUALITE_AGENT = "qualite_agent",
  TECH_SUPPORT = "tech_support",
  MEMBER = "member",
}

enum EmploymentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ON_LEAVE = "on_leave",
  TERMINATED = "terminated",
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company { id: number; name: string }

interface User {
  id: number;
  fullname: string;
  email: string;
  role: UserRole;
  memberlevel?: string | null;
  company?: Company | null;
  isActive: boolean;
}

interface MemberProfile {
  id: number;
  userId: number;
  employmentStatus: EmploymentStatus;
  position: string | null;
  globalScore: number;
  grade: string;
  totalTasksDone: number;
  onTimeRate: number;
  attendanceRate: number;
  performanceRating: number;
  itScore: number;
  marketingScore: number;
  callCenterScore: number;
  itTasksDone: number;
  marketingTasksDone: number;
  callCenterTasksDone: number;
  scoreEvolution: number | null;
  baseSalary: number | null;
  bonuses: number;
}

interface UserWithProfile extends User {
  profile?: MemberProfile | null;
}

// Project from /projects API
interface Project {
  id: number;
  name: string;
  status: string;
  domain: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  assignedTo?: { id: number; fullname: string }[];
  projectManager?: { id: number; fullname: string };
}

type SortField = "fullname" | "globalScore" | "grade" | "totalTasksDone" | "onTimeRate" | "attendanceRate" | "performanceRating";
type SortDir = "asc" | "desc";

// ─── Config ───────────────────────────────────────────────────────────────────

const GRADE_CONFIG: Record<string, { color: string; bg: string; border: string; bar: string; rank: number; chartColor: string }> = {
  "A+": { color: "text-emerald-800", bg: "bg-emerald-100", border: "border-emerald-200", bar: "bg-emerald-500", rank: 1, chartColor: "#059669" },
  "A":  { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", bar: "bg-emerald-400", rank: 2, chartColor: "#10b981" },
  "B":  { color: "text-blue-800",    bg: "bg-blue-100",    border: "border-blue-200",    bar: "bg-blue-500",    rank: 3, chartColor: "#3b82f6" },
  "C":  { color: "text-amber-800",   bg: "bg-amber-100",   border: "border-amber-200",   bar: "bg-amber-500",   rank: 4, chartColor: "#f59e0b" },
  "D":  { color: "text-orange-800",  bg: "bg-orange-100",  border: "border-orange-200",  bar: "bg-orange-500",  rank: 5, chartColor: "#f97316" },
  "F":  { color: "text-red-800",     bg: "bg-red-100",     border: "border-red-200",     bar: "bg-red-500",     rank: 6, chartColor: "#ef4444" },
};

const STATUS_CONFIG: Record<EmploymentStatus, { label: string; color: string; bg: string }> = {
  [EmploymentStatus.ACTIVE]:     { label: "Actif",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  [EmploymentStatus.INACTIVE]:   { label: "Inactif",  color: "text-slate-500",   bg: "bg-slate-50 border-slate-200" },
  [EmploymentStatus.ON_LEAVE]:   { label: "Congé",    color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  [EmploymentStatus.TERMINATED]: { label: "Résilié",  color: "text-red-700",     bg: "bg-red-50 border-red-200" },
};

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  [UserRole.MEMBER]:          "Membre",
  [UserRole.AGENT_TELEPRO]:   "Agent Telepro",
  [UserRole.COMMERCIAL]:      "Commercial",
  [UserRole.MARKETING_AGENT]: "Agent Marketing",
  [UserRole.QUALITE_AGENT]:   "Agent Qualité",
  [UserRole.TECH_SUPPORT]:    "Support Technique",
};

const DOMAIN_COLORS: Record<string, string> = {
  IT:         "#0ea5e9",
  Marketing:  "#d946ef",
  CallCenter: "#f59e0b",
};

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#0ea5e9"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToPercent(score: number) { return Math.min(100, Math.round((score / 120) * 100)); }

function isProjectLate(p: Project): boolean {
  if (p.status === "completed") return false;
  if (!p.endDate) return false;
  return new Date(p.endDate) < new Date();
}

function getMedalIcon(rank: number) {
  if (rank === 1) return <Medal size={14} className="text-yellow-500 fill-yellow-400" />;
  if (rank === 2) return <Medal size={14} className="text-slate-400 fill-slate-300" />;
  if (rank === 3) return <Medal size={14} className="text-amber-700 fill-amber-600" />;
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ value, max = 100, colorClass }: { value: number; max?: number; colorClass: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SortButton({ field, current, dir, onClick }: { field: SortField; current: SortField; dir: SortDir; onClick: (f: SortField) => void }) {
  const active = current === field;
  return (
    <button onClick={() => onClick(field)} className={`inline-flex items-center gap-0.5 ${active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}>
      {active ? (dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} />}
    </button>
  );
}

function StatCard({ label, value, icon, accent, sub }: { label: string; value: string | number; icon: React.ReactNode; accent: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Charts Section ───────────────────────────────────────────────────────────

function ChartsSection({ usersWithProfiles, projects }: { usersWithProfiles: UserWithProfile[]; projects: Project[] }) {
  const withProfile = usersWithProfiles.filter(u => u.profile);

  // 1. Grade distribution bar chart
  const gradeDist = useMemo(() => {
    const map: Record<string, number> = {};
    withProfile.forEach(u => {
      const g = u.profile!.grade;
      map[g] = (map[g] ?? 0) + 1;
    });
    return Object.entries(GRADE_CONFIG)
      .filter(([g]) => map[g])
      .map(([grade, cfg]) => ({ grade, count: map[grade] ?? 0, fill: cfg.chartColor }));
  }, [withProfile]);

  // 2. Score distribution (buckets 0-20, 20-40, 40-60, 60-80, 80-100, 100-120)
  const scoreDist = useMemo(() => {
    const buckets = [
      { range: "0–20", min: 0, max: 20, count: 0 },
      { range: "20–40", min: 20, max: 40, count: 0 },
      { range: "40–60", min: 40, max: 60, count: 0 },
      { range: "60–80", min: 60, max: 80, count: 0 },
      { range: "80–100", min: 80, max: 100, count: 0 },
      { range: "100–120", min: 100, max: 120, count: 0 },
    ];
    withProfile.forEach(u => {
      const s = Number(u.profile!.globalScore);
      const bucket = buckets.find(b => s >= b.min && s < b.max) ?? buckets[buckets.length - 1];
bucket.count++;
    });
    return buckets;
  }, [withProfile]);

  // 3. Domain scores radar — average per domain
  const domainRadar = useMemo(() => [
    { domain: "IT",         score: withProfile.length ? withProfile.reduce((s, u) => s + Number(u.profile!.itScore ?? 0), 0) / withProfile.length : 0 },
    { domain: "Marketing",  score: withProfile.length ? withProfile.reduce((s, u) => s + Number(u.profile!.marketingScore ?? 0), 0) / withProfile.length : 0 },
    { domain: "Call Center",score: withProfile.length ? withProfile.reduce((s, u) => s + Number(u.profile!.callCenterScore ?? 0), 0) / withProfile.length : 0 },
  ], [withProfile]);

  // 4. Projects: on time vs late vs completed
  const projectStatus = useMemo(() => {
    const completed = projects.filter(p => p.status === "completed").length;
    const late      = projects.filter(p => isProjectLate(p)).length;
    const onTrack   = projects.filter(p => p.status !== "completed" && !isProjectLate(p) && p.status === "in_progress").length;
    const planned   = projects.filter(p => p.status === "planned").length;
    return [
      { name: "Terminés à temps", value: completed, color: "#22c55e" },
      { name: "En retard",        value: late,       color: "#ef4444" },
      { name: "En cours (OK)",    value: onTrack,    color: "#3b82f6" },
      { name: "Planifiés",        value: planned,    color: "#94a3b8" },
    ].filter(d => d.value > 0);
  }, [projects]);

  // 5. Projects per domain
  const projectsByDomain = useMemo(() => {
    const map: Record<string, { total: number; late: number; done: number }> = {};
    projects.forEach(p => {
      if (!map[p.domain]) map[p.domain] = { total: 0, late: 0, done: 0 };
      map[p.domain].total++;
      if (p.status === "completed") map[p.domain].done++;
      if (isProjectLate(p)) map[p.domain].late++;
    });
    return Object.entries(map).map(([domain, v]) => ({ domain, ...v }));
  }, [projects]);

  // 6. On-time rate evolution (by top performers vs at-risk)
  const performanceComparison = useMemo(() => {
    const topPerformers    = withProfile.filter(u => ["A+", "A"].includes(u.profile!.grade));
    const atRisk           = withProfile.filter(u => ["D", "F"].includes(u.profile!.grade));
    const mid              = withProfile.filter(u => ["B", "C"].includes(u.profile!.grade));
    const avgOnTime = (arr: UserWithProfile[]) =>
      arr.length ? arr.reduce((s, u) => {
        const v = Number(u.profile!.onTimeRate);
        return s + (v <= 1 ? v * 100 : v);
      }, 0) / arr.length : 0;
    return [
      { group: "Top (A/A+)", onTime: Math.round(avgOnTime(topPerformers)), score: topPerformers.length ? topPerformers.reduce((s, u) => s + Number(u.profile!.globalScore), 0) / topPerformers.length : 0 },
      { group: "Moyen (B/C)", onTime: Math.round(avgOnTime(mid)), score: mid.length ? mid.reduce((s, u) => s + Number(u.profile!.globalScore), 0) / mid.length : 0 },
      { group: "À risque (D/F)", onTime: Math.round(avgOnTime(atRisk)), score: atRisk.length ? atRisk.reduce((s, u) => s + Number(u.profile!.globalScore), 0) / atRisk.length : 0 },
    ];
  }, [withProfile]);

  // 7. Tasks done by domain (stacked)
  const tasksByDomain = useMemo(() => {
    return withProfile.map(u => ({
      name: u.fullname.split(" ")[0],
      IT:         u.profile!.itTasksDone ?? 0,
      Marketing:  u.profile!.marketingTasksDone ?? 0,
      CallCenter: u.profile!.callCenterTasksDone ?? 0,
    })).filter(u => u.IT + u.Marketing + u.CallCenter > 0)
      .sort((a, b) => (b.IT + b.Marketing + b.CallCenter) - (a.IT + a.Marketing + a.CallCenter))
      .slice(0, 12);
  }, [withProfile]);

  return (
    <div className="space-y-5">

      {/* ── Row 1: Grade dist + Score dist ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Grade distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Award size={15} className="text-indigo-500"/> Distribution des grades
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gradeDist} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="grade" tick={{ fontSize: 12, fontWeight: 600 }}/>
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v: number) => [v, "Employés"]}
              />
              <Bar dataKey="count" name="Employés" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {gradeDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart2 size={15} className="text-blue-500"/> Distribution des scores (/ 120)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={scoreDist} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="range" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v: number) => [v, "Employés"]}/>
              <Area type="monotone" dataKey="count" name="Employés" stroke="#6366f1"
                fill="url(#scoreGrad)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 2: Projects status pie + Projects by domain ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Projects: on time vs late */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
            <Clock size={15} className="text-amber-500"/> Projets : délais respectés vs en retard
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Un projet est <span className="text-red-500 font-medium">en retard</span> si sa date de fin est dépassée et il n'est pas terminé.
          </p>
          {projectStatus.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Aucun projet disponible.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={projectStatus} cx="50%" cy="50%" outerRadius={75} innerRadius={40}
                  dataKey="value" nameKey="name"
                  label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                  labelLine={false}>
                  {projectStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }}/>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Projects per domain — on time vs late */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-500"/> Retards par domaine de projet
          </h3>
          {projectsByDomain.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Aucun projet disponible.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={projectsByDomain} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="domain" tick={{ fontSize: 12 }}/>
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }}/>
                <Bar dataKey="done" name="Terminés"   fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a"/>
                <Bar dataKey="late" name="En retard"  fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 3: Performance comparison + Domain scores ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* On-time rate by grade group */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-500"/> Taux à temps & score moyen par groupe
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={performanceComparison} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="group" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 11 }}/>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}
                formatter={(v: number, name: string) => [
                  name === "onTime" ? `${v}%` : v.toFixed(1),
                  name === "onTime" ? "Taux à temps" : "Score moyen"
                ]}/>
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }}/>
              <Bar dataKey="onTime" name="Taux à temps (%)" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48}/>
              <Bar dataKey="score"  name="Score moyen"      fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={48}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Domain scores radar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Activity size={15} className="text-purple-500"/> Scores moyens par domaine
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={domainRadar} outerRadius={70}>
              <PolarGrid />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }}/>
              <Radar name="Score moyen" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3}/>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [v.toFixed(1), "Score moyen"]}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: Tasks by domain per employee ── */}
      {tasksByDomain.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Target size={15} className="text-violet-500"/> Tâches complétées par domaine (top 12 employés)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tasksByDomain} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }}/>
              <Bar dataKey="IT"         name="IT"          fill={DOMAIN_COLORS.IT}         radius={[0, 0, 0, 0]} stackId="t"/>
              <Bar dataKey="Marketing"  name="Marketing"   fill={DOMAIN_COLORS.Marketing}  radius={[0, 0, 0, 0]} stackId="t"/>
              <Bar dataKey="CallCenter" name="Call Center" fill={DOMAIN_COLORS.CallCenter} radius={[4, 4, 0, 0]} stackId="t"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HRScoreboardPage() {
  const router = useRouter();

  const [usersWithProfiles, setUsersWithProfiles] = useState<UserWithProfile[]>([]);
  const [projects, setProjects]                   = useState<Project[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState("");
  const [activeTab, setActiveTab]                 = useState<"table" | "charts">("table");

  const [searchTerm,     setSearchTerm]     = useState("");
  const [selectedGrade,  setSelectedGrade]  = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedRole,   setSelectedRole]   = useState("ALL");
  const [showNoProfile,  setShowNoProfile]  = useState(true);
  const [sortField,      setSortField]      = useState<SortField>("globalScore");
  const [sortDir,        setSortDir]        = useState<SortDir>("desc");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Token manquant");

        const headers = { Authorization: `Bearer ${token}` };
        const base    = process.env.NEXT_PUBLIC_NEST_API_URL;

        const [usersRes, profilesRes, projectsRes] = await Promise.all([
          fetch(`${base}/users`,          { headers }),
          fetch(`${base}/member-profiles`,{ headers }),
          fetch(`${base}/projects`,       { headers }),
        ]);

        if (!usersRes.ok) throw new Error("Impossible de charger les utilisateurs");

        const users: User[]           = await usersRes.json();
        const profiles: MemberProfile[] = profilesRes.ok ? await profilesRes.json() : [];
        const projs: Project[]          = projectsRes.ok ? await projectsRes.json() : [];

        const profileMap = new Map<number, MemberProfile>();
        profiles.forEach(p => profileMap.set(p.userId, p));

        setUsersWithProfiles(users.map(u => ({ ...u, profile: profileMap.get(u.id) ?? null })));
        setProjects(projs);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Sort ───────────────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  // ── Filter + sort ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...usersWithProfiles];
    if (!showNoProfile) list = list.filter(u => u.profile);
    list = list.filter(u => {
      const q = searchTerm.toLowerCase();
      return (
        (!q || u.fullname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (selectedGrade  === "ALL" || u.profile?.grade === selectedGrade) &&
        (selectedStatus === "ALL" || u.profile?.employmentStatus === selectedStatus) &&
        (selectedRole   === "ALL" || u.role === selectedRole)
      );
    });
    list.sort((a, b) => {
      const aP = a.profile, bP = b.profile;
      if (!aP && !bP) return 0;
      if (!aP) return 1;
      if (!bP) return -1;
      if (sortField === "fullname") {
        return sortDir === "asc" ? a.fullname.localeCompare(b.fullname) : b.fullname.localeCompare(a.fullname);
      }
      if (sortField === "grade") {
        const av = GRADE_CONFIG[aP.grade]?.rank ?? 99;
        const bv = GRADE_CONFIG[bP.grade]?.rank ?? 99;
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const vals: Record<SortField, number> = {
        fullname: 0, grade: 0,
        globalScore:        Number(aP.globalScore),
        totalTasksDone:     aP.totalTasksDone,
        onTimeRate:         Number(aP.onTimeRate),
        attendanceRate:     Number(aP.attendanceRate),
        performanceRating:  Number(aP.performanceRating),
      };
      const bVals: Record<SortField, number> = {
        fullname: 0, grade: 0,
        globalScore:        Number(bP.globalScore),
        totalTasksDone:     bP.totalTasksDone,
        onTimeRate:         Number(bP.onTimeRate),
        attendanceRate:     Number(bP.attendanceRate),
        performanceRating:  Number(bP.performanceRating),
      };
      return sortDir === "asc" ? vals[sortField] - bVals[sortField] : bVals[sortField] - vals[sortField];
    });
    return list;
  }, [usersWithProfiles, searchTerm, selectedGrade, selectedStatus, selectedRole, showNoProfile, sortField, sortDir]);

  // ── KPI stats ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const withProfile = usersWithProfiles.filter(u => u.profile);
    const scores      = withProfile.map(u => Number(u.profile!.globalScore));
    const avgScore    = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
    const topGrade    = withProfile.filter(u => ["A+", "A"].includes(u.profile!.grade)).length;
    const atRisk      = withProfile.filter(u => ["D", "F"].includes(u.profile!.grade)).length;
    const lateProjects = projects.filter(p => isProjectLate(p)).length;
    return { total: usersWithProfiles.length, withProfile: withProfile.length, avgScore, topGrade, atRisk, lateProjects };
  }, [usersWithProfiles, projects]);

  const grades = useMemo(() =>
    ["ALL", ...Object.keys(GRADE_CONFIG).filter(g => usersWithProfiles.some(u => u.profile?.grade === g))],
    [usersWithProfiles]
  );
  const roles = useMemo(() =>
    ["ALL", ...new Set(usersWithProfiles.map(u => u.role))],
    [usersWithProfiles]
  );

  // ── CSV export ─────────────────────────────────────────────────────────────

  const handleExport = () => {
    const rows = [
      ["Nom","Email","Rôle","Société","Grade","Score Global","Tâches","Taux à temps","Assiduité","Note RH","Statut"],
      ...filtered.map(u => [
        u.fullname, u.email, u.role, u.company?.name ?? "",
        u.profile?.grade ?? "—",
        u.profile?.globalScore?.toFixed(1) ?? "—",
        u.profile?.totalTasksDone ?? "—",
        u.profile?.onTimeRate !== undefined ? `${(Number(u.profile.onTimeRate) * 100).toFixed(1)}%` : "—",
        u.profile?.attendanceRate !== undefined ? `${Number(u.profile.attendanceRate).toFixed(1)}%` : "—",
        u.profile?.performanceRating?.toFixed(1) ?? "—",
        u.profile?.employmentStatus ?? "—",
      ]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `scores_employes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="animate-spin mx-auto text-indigo-600" size={28} />
        <p className="text-slate-500 text-sm animate-pulse">Chargement des données RH…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="mx-auto max-w-xl mt-10 rounded-2xl bg-red-50 border border-red-100 p-8 text-center">
      <XCircle className="mx-auto mb-3 text-red-400" size={32} />
      <p className="text-red-700 font-medium">{error}</p>
      <button onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition">
        Réessayer
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tableau de bord RH — Scores</h1>
          <p className="mt-1 text-slate-500 text-sm">Vue d'ensemble des performances et scores de tous les employés.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab toggle */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setActiveTab("table")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${activeTab === "table" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}>
              Tableau
            </button>
            <button onClick={() => setActiveTab("charts")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${activeTab === "charts" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}>
              Graphiques
            </button>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
            <Download size={15} /> Exporter CSV
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total employés"   value={stats.total}        icon={<Users size={16} className="text-indigo-600"/>}        accent="bg-indigo-50" sub={`${stats.withProfile} avec profil RH`}/>
        <StatCard label="Score moyen"      value={stats.avgScore}     icon={<BarChart2 size={16} className="text-blue-600"/>}       accent="bg-blue-50"   sub="/ 120 points"/>
        <StatCard label="Top performers"   value={stats.topGrade}     icon={<Medal size={16} className="text-amber-500"/>}          accent="bg-amber-50"  sub="Grade A+ ou A"/>
        <StatCard label="À risque"         value={stats.atRisk}       icon={<AlertCircle size={16} className="text-red-500"/>}      accent="bg-red-50"    sub="Grade D ou F"/>
        <StatCard label="Projets en retard" value={stats.lateProjects} icon={<Clock size={16} className="text-orange-500"/>}        accent="bg-orange-50" sub="Date dépassée, non terminé"/>
      </div>

      {/* ── Charts tab ── */}
      {activeTab === "charts" && (
        <ChartsSection usersWithProfiles={usersWithProfiles} projects={projects} />
      )}

      {/* ── Table tab ── */}
      {activeTab === "table" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="text" placeholder="Rechercher un employé…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"/>
              </div>
              <div className="md:col-span-2 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white">
                <Award size={14} className="text-slate-400 shrink-0"/>
                <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 outline-none w-full cursor-pointer">
                  <option value="ALL">Tous les grades</option>
                  {grades.slice(1).map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white">
                <Activity size={14} className="text-slate-400 shrink-0"/>
                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 outline-none w-full cursor-pointer">
                  <option value="ALL">Tous les statuts</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white">
                <Filter size={14} className="text-slate-400 shrink-0"/>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 outline-none w-full cursor-pointer">
                  <option value="ALL">Tous les rôles</option>
                  {roles.slice(1).map(r => <option key={r} value={r}>{ROLE_LABELS[r as UserRole] ?? r}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div onClick={() => setShowNoProfile(v => !v)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${showNoProfile ? "bg-indigo-500" : "bg-slate-200"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showNoProfile ? "translate-x-4" : "translate-x-0.5"}`}/>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">Sans profil</span>
                </label>
                {(searchTerm || selectedGrade !== "ALL" || selectedStatus !== "ALL" || selectedRole !== "ALL") && (
                  <button onClick={() => { setSearchTerm(""); setSelectedGrade("ALL"); setSelectedStatus("ALL"); setSelectedRole("ALL"); }}
                    className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2">
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/70 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-4 w-10 text-center text-xs font-semibold text-slate-500">#</th>
                    <th className="px-4 py-4 font-semibold text-slate-600"><div className="flex items-center gap-1">Employé <SortButton field="fullname" current={sortField} dir={sortDir} onClick={handleSort}/></div></th>
                    <th className="px-4 py-4 font-semibold text-slate-600"><div className="flex items-center gap-1">Grade <SortButton field="grade" current={sortField} dir={sortDir} onClick={handleSort}/></div></th>
                    <th className="px-4 py-4 font-semibold text-slate-600 min-w-[160px]"><div className="flex items-center gap-1">Score global <SortButton field="globalScore" current={sortField} dir={sortDir} onClick={handleSort}/></div></th>
                    <th className="px-4 py-4 font-semibold text-slate-600"><div className="flex items-center gap-1">Tâches <SortButton field="totalTasksDone" current={sortField} dir={sortDir} onClick={handleSort}/></div></th>
                    <th className="px-4 py-4 font-semibold text-slate-600 min-w-[110px]"><div className="flex items-center gap-1">À temps <SortButton field="onTimeRate" current={sortField} dir={sortDir} onClick={handleSort}/></div></th>
                    <th className="px-4 py-4 font-semibold text-slate-600 min-w-[110px]"><div className="flex items-center gap-1">Assiduité <SortButton field="attendanceRate" current={sortField} dir={sortDir} onClick={handleSort}/></div></th>
                    <th className="px-4 py-4 font-semibold text-slate-600"><div className="flex items-center gap-1">Note RH <SortButton field="performanceRating" current={sortField} dir={sortDir} onClick={handleSort}/></div></th>
                    <th className="px-4 py-4 font-semibold text-slate-600">Évol.</th>
                    <th className="px-4 py-4 font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((user, idx) => {
                    const p          = user.profile;
                    const grade      = p?.grade ?? null;
                    const gradeCfg   = grade ? GRADE_CONFIG[grade] : null;
                    const statusCfg  = p ? STATUS_CONFIG[p.employmentStatus] ?? STATUS_CONFIG[EmploymentStatus.ACTIVE] : null;
                    const evolution  = p?.scoreEvolution ?? null;
                    const onTimePct  = p?.onTimeRate !== undefined ? (Number(p.onTimeRate) <= 1 ? Number(p.onTimeRate) * 100 : Number(p.onTimeRate)) : null;
                    const attendance = p?.attendanceRate !== undefined ? (Number(p.attendanceRate) <= 1 ? Number(p.attendanceRate) * 100 : Number(p.attendanceRate)) : null;

                    // User's projects that are late
                    const userLateProjects = projects.filter(proj =>
                      isProjectLate(proj) &&
                      proj.assignedTo?.some(m => m.id === user.id)
                    );

                    return (
                      <tr key={user.id} className="group hover:bg-slate-50/70 transition-colors duration-150">
                        <td className="px-4 py-3 text-center">
                          {p ? (
                            <div className="flex items-center justify-center">
                              {getMedalIcon(idx + 1) ?? <span className="text-xs text-slate-400 font-medium">{idx + 1}</span>}
                            </div>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white">
                              {user.fullname.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors leading-tight">{user.fullname}</p>
                              <p className="text-xs text-slate-400 leading-tight mt-0.5">{user.email}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {user.company && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                                    <Building2 size={9}/> {user.company.name}
                                  </span>
                                )}
                                {statusCfg && (
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${statusCfg.color} ${statusCfg.bg}`}>
                                    {statusCfg.label}
                                  </span>
                                )}
                                {userLateProjects.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md">
                                    <Clock size={9}/> {userLateProjects.length} projet{userLateProjects.length > 1 ? "s" : ""} en retard
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {gradeCfg && grade ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold border ${gradeCfg.color} ${gradeCfg.bg} ${gradeCfg.border}`}>
                              {grade}
                            </span>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        <td className="px-4 py-3 min-w-[160px]">
                          {p ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-900">{Number(p.globalScore).toFixed(1)}</span>
                                <span className="text-[10px] text-slate-400">/ 120</span>
                              </div>
                              <ScoreBar value={scoreToPercent(p.globalScore)} colorClass={gradeCfg?.bar ?? "bg-slate-300"}/>
                            </div>
                          ) : <span className="text-xs text-slate-300 italic">Pas de profil</span>}
                        </td>

                        <td className="px-4 py-3">
                          {p ? (
                            <div className="flex items-center gap-1.5">
                              <Target size={13} className="text-violet-500"/>
                              <span className="font-semibold text-slate-800">{p.totalTasksDone}</span>
                            </div>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        <td className="px-4 py-3">
                          {onTimePct !== null ? (
                            <div className="space-y-1">
                              <span className={`text-sm font-semibold ${onTimePct >= 80 ? "text-emerald-700" : onTimePct >= 60 ? "text-amber-700" : "text-red-600"}`}>
                                {onTimePct.toFixed(0)}%
                              </span>
                              <ScoreBar value={onTimePct} colorClass={onTimePct >= 80 ? "bg-emerald-400" : onTimePct >= 60 ? "bg-amber-400" : "bg-red-400"}/>
                            </div>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        <td className="px-4 py-3">
                          {attendance !== null ? (
                            <div className="space-y-1">
                              <span className={`text-sm font-semibold ${attendance >= 90 ? "text-emerald-700" : attendance >= 70 ? "text-amber-700" : "text-red-600"}`}>
                                {attendance.toFixed(0)}%
                              </span>
                              <ScoreBar value={attendance} colorClass={attendance >= 90 ? "bg-emerald-400" : attendance >= 70 ? "bg-amber-400" : "bg-red-400"}/>
                            </div>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        <td className="px-4 py-3">
                          {p ? (
                            <div className="flex items-center gap-1">
                              <Star size={13} className="text-amber-400 fill-amber-400"/>
                              <span className="text-sm font-semibold text-slate-800">{Number(p.performanceRating).toFixed(1)}</span>
                              <span className="text-[10px] text-slate-400">/5</span>
                            </div>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        <td className="px-4 py-3">
                          {evolution !== null ? (
                            <div className={`flex items-center gap-1 text-xs font-semibold ${evolution > 0 ? "text-emerald-600" : evolution < 0 ? "text-red-500" : "text-slate-400"}`}>
                              {evolution > 0 ? <TrendingUp size={13}/> : evolution < 0 ? <TrendingDown size={13}/> : <Minus size={13}/>}
                              {evolution > 0 ? "+" : ""}{Number(evolution).toFixed(1)}
                            </div>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => router.push(`/Dashboard/users/${user.id}/details`)}
                              title="Voir le profil complet"
                              className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 transition-all">
                              <Eye size={15}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""} sur {usersWithProfiles.length} employés</span>
              <span>{filtered.filter(u => u.profile).length} avec profil RH</span>
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
              <h3 className="text-lg font-semibold text-slate-900">Aucun résultat</h3>
              <p className="text-sm text-slate-500 mt-1">Ajustez vos filtres pour afficher des employés.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}