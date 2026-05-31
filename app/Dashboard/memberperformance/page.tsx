"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, ArrowLeft, Loader2, Award, Briefcase, TrendingUp,
  TrendingDown, CheckCircle2, Clock, XCircle, Calendar,
  DollarSign, Target, Activity, BarChart2, Star, AlertCircle,
} from "lucide-react";

// ─── Enums ───────────────────────────────────────────────────────────────────

enum ContractType {
  CDI = "cdi",
  CDD = "cdd",
  STAGE = "stage",
  FREELANCE = "freelance",
}

enum EmploymentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ON_LEAVE = "on_leave",
  TERMINATED = "terminated",
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company { id: number; name: string }

interface UserType {
  id: number;
  fullname: string;
  email: string;
  numtel: string;
  role: string;
  memberlevel?: string | null;
  company?: Company | null;
  isActive: boolean;
}

interface TaskSnapshot {
  taskId: number;
  domain: "IT" | "Marketing" | "CallCenter";
  title: string;
  delayHours: number;
  completedAt: string;
  points: number;
}

interface MemberProfile {
  id: number;
  contractType: ContractType;
  hireDate: string;
  employmentStatus: EmploymentStatus;
  position: string | null;
  baseSalary: number | null;
  bonuses: number;
  totalCompensation: number;
  performanceRating: number;
  projectsCompleted: number;
  attendanceRate: number;
  absenceCount: number;
  globalScore: number;
  grade: string;
  totalTasksDone: number;
  onTimeCount: number;
  earlyCount: number;
  lateCount: number;
  avgDelayHours: number;
  onTimeRate: number;
  itTasksDone: number;
  itScore: number;
  itAvgDelay: number;
  marketingTasksDone: number;
  marketingScore: number;
  marketingAvgDelay: number;
  callCenterTasksDone: number;
  callCenterScore: number;
  callCenterAvgDelay: number;
  recentTasksSnapshot: TaskSnapshot[] | null;
  scoreEvolution: number | null;
  scoreUpdatedAt: string | null;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const CONTRACT_LABELS: Record<ContractType, string> = {
  [ContractType.CDI]: "CDI",
  [ContractType.CDD]: "CDD",
  [ContractType.STAGE]: "Stage",
  [ContractType.FREELANCE]: "Freelance",
};

const STATUS_CONFIG: Record<EmploymentStatus, { label: string; color: string; bg: string }> = {
  [EmploymentStatus.ACTIVE]:     { label: "Actif",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  [EmploymentStatus.INACTIVE]:   { label: "Inactif",  color: "text-slate-600",   bg: "bg-slate-50 border-slate-200"     },
  [EmploymentStatus.ON_LEAVE]:   { label: "En congé", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200"     },
  [EmploymentStatus.TERMINATED]: { label: "Résilié",  color: "text-red-700",     bg: "bg-red-50 border-red-200"         },
};

const GRADE_CONFIG: Record<string, { color: string; bg: string; bar: string }> = {
  "A+": { color: "text-emerald-800", bg: "bg-emerald-100", bar: "bg-emerald-500" },
  "A":  { color: "text-emerald-700", bg: "bg-emerald-50",  bar: "bg-emerald-400" },
  "B":  { color: "text-blue-800",    bg: "bg-blue-100",    bar: "bg-blue-500"    },
  "C":  { color: "text-amber-800",   bg: "bg-amber-100",   bar: "bg-amber-500"   },
  "D":  { color: "text-orange-800",  bg: "bg-orange-100",  bar: "bg-orange-500"  },
  "F":  { color: "text-red-800",     bg: "bg-red-100",     bar: "bg-red-500"     },
};

const DOMAIN_CONFIG = {
  IT:         { label: "IT",          color: "bg-blue-500",   light: "bg-blue-50 text-blue-700 border-blue-200"       },
  Marketing:  { label: "Marketing",   color: "bg-violet-500", light: "bg-violet-50 text-violet-700 border-violet-200" },
  CallCenter: { label: "Call Center", color: "bg-teal-500",   light: "bg-teal-50 text-teal-700 border-teal-200"       },
};

const LEVEL_LABELS: Record<string, string> = {
  junior: "Junior", senior: "Senior", expert: "Expert",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToPercent(score: number): number {
  return Math.min(100, Math.round((score / 120) * 100));
}

function formatDelay(hours: number): string {
  if (hours === 0) return "À l'heure";
  const abs = Math.abs(hours);
  const sign = hours < 0 ? "-" : "+";
  if (abs < 24) return `${sign}${abs.toFixed(1)}h`;
  return `${sign}${(abs / 24).toFixed(1)}j`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function hireDuration(hireDate: string): string {
  const ms = Date.now() - new Date(hireDate).getTime();
  const months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30.5));
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} an${years > 1 ? "s" : ""} ${rem} mois` : `${years} an${years > 1 ? "s" : ""}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ?? "bg-slate-50"}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, colorClass }: { value: number; colorClass: string }) {
  const pct = Math.min(100, Math.round(value));
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DomainCard({ domain, tasksDone, score, avgDelay }: {
  domain: keyof typeof DOMAIN_CONFIG; tasksDone: number; score: number; avgDelay: number;
}) {
  const cfg = DOMAIN_CONFIG[domain];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${cfg.light}`}>{cfg.label}</span>
        <span className="text-xs text-slate-500">{tasksDone} tâche{tasksDone !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-xl font-bold text-slate-900">{Number(score).toFixed(1)} pts</span>
        <span className={`text-xs font-medium ${avgDelay <= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {formatDelay(avgDelay)} moy.
        </span>
      </div>
      <ProgressBar value={scoreToPercent(score)} colorClass={cfg.color} />
    </div>
  );
}

function TaskRow({ task }: { task: TaskSnapshot }) {
  const cfg = DOMAIN_CONFIG[task.domain];
  const isLate = task.delayHours > 0;
  const isEarly = task.delayHours < 0;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
        <p className="text-xs text-slate-500">{formatDate(task.completedAt)} · {cfg.label}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-semibold ${isEarly ? "text-emerald-600" : isLate ? "text-red-500" : "text-slate-500"}`}>
          {formatDelay(task.delayHours)}
        </span>
        <span className="text-xs font-bold text-slate-700 w-12 text-right">{task.points} pts</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// FIX: plus de prop id — l'userId est lu directement depuis le localStorage
export default function MemberDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  const load = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const meStr = localStorage.getItem("user");

      if (!token || !meStr) throw new Error("Session invalide — veuillez vous reconnecter");

      const me = JSON.parse(meStr);
      const userId: number = me.id;

      if (!userId) throw new Error("ID utilisateur introuvable dans la session");

      const [uRes, pRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        // ✅ Utiliser /me au lieu de /:userId
        fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/member-profiles/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!uRes.ok) throw new Error("Impossible de charger le profil utilisateur");
      const userData: UserType = await uRes.json();
      setUser(userData);

      if (pRes.ok) {
        const pData: MemberProfile = await pRes.json();
        setProfile({
          ...pData,
          attendanceRate:
            pData.attendanceRate >= 0 && pData.attendanceRate <= 1
              ? Number((pData.attendanceRate * 100).toFixed(1))
              : pData.attendanceRate,
        });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);
  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin mx-auto text-blue-600" size={28} />
          <p className="text-slate-500 text-sm">Chargement du dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-xl mt-10 rounded-2xl bg-red-50 border border-red-100 p-8 text-center">
        <XCircle className="mx-auto mb-3 text-red-400" size={32} />
        <p className="text-red-700 font-medium text-sm">{error || "Utilisateur introuvable"}</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 text-xs text-red-500 underline"
        >
          Se reconnecter
        </button>
      </div>
    );
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const grade = profile?.grade ?? "—";
  const gradeCfg = GRADE_CONFIG[grade] ?? { color: "text-slate-600", bg: "bg-slate-100", bar: "bg-slate-400" };
  const statusCfg = profile
    ? STATUS_CONFIG[profile.employmentStatus] ?? STATUS_CONFIG[EmploymentStatus.ACTIVE]
    : null;
  const evolution = profile?.scoreEvolution ?? null;
  const hasDomainData = profile && (
    profile.itTasksDone > 0 || profile.marketingTasksDone > 0 || profile.callCenterTasksDone > 0
  );
  const recentTasks = profile?.recentTasksSnapshot ?? [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6">

      {/* ── Back ── */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
      >
        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-colors">
          <ArrowLeft size={15} />
        </div>
        Retour
      </button>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">

          {/* Avatar initiales */}
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">
              {user.fullname.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
            </span>
          </div>

          {/* Infos principales */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{user.fullname}</h1>
              {profile?.grade && (
                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg ${gradeCfg.color} ${gradeCfg.bg}`}>
                  Grade {grade}
                </span>
              )}
              {statusCfg && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${statusCfg.color} ${statusCfg.bg}`}>
                  {statusCfg.label}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
              {profile?.position && (
                <span className="flex items-center gap-1"><Briefcase size={12} />{profile.position}</span>
              )}
              {user.company && (
                <span className="flex items-center gap-1"><User size={12} />{user.company.name}</span>
              )}
              {user.memberlevel && (
                <span className="flex items-center gap-1"><Award size={12} />{LEVEL_LABELS[user.memberlevel] ?? user.memberlevel}</span>
              )}
              {profile?.contractType && (
                <span className="flex items-center gap-1"><Calendar size={12} />{CONTRACT_LABELS[profile.contractType]}</span>
              )}
              {profile?.hireDate && (
                <span className="flex items-center gap-1"><Clock size={12} />{hireDuration(profile.hireDate)} d'ancienneté</span>
              )}
            </div>
          </div>

          {/* Score global */}
          {profile && (
            <div className="flex-shrink-0 text-center sm:text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Score global</p>
              <p className={`text-4xl font-black ${gradeCfg.color}`}>
                {Number(profile.globalScore).toFixed(1)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">pts / 120</p>
              {evolution !== null && (
                <div className={`flex items-center justify-end gap-1 mt-1 text-xs font-semibold ${evolution >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {evolution >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {evolution >= 0 ? "+" : ""} pts
                </div>
              )}
            </div>
          )}
        </div>

        {/* Score bar */}
        {profile && (
          <div className="mt-4">
            <ProgressBar value={scoreToPercent(profile.globalScore)} colorClass={gradeCfg.bar} />
          </div>
        )}
      </div>

      {/* ══ KPIs ════════════════════════════════════════════════════════════ */}
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Target size={16} className="text-violet-600" />}
            label="Tâches"
            value={profile.totalTasksDone}
            sub="complétées"
            accent="bg-violet-50"
          />
          <StatCard
            icon={<CheckCircle2 size={16} className="text-emerald-600" />}
            label="Taux à temps"
            value={`${(Number(profile.onTimeRate) * 100).toFixed(1)}%`}
            sub={`${profile.earlyCount} avances · ${profile.lateCount} retards`}
            accent="bg-emerald-50"
          />
          <StatCard
            icon={<Activity size={16} className="text-blue-600" />}
            label="Assiduité"
            value={`${Number(profile.attendanceRate).toFixed(1)}%`}
            sub={`${profile.absenceCount} absence${profile.absenceCount !== 1 ? "s" : ""}`}
            accent="bg-blue-50"
          />
          <StatCard
            icon={<Star size={16} className="text-amber-600" />}
            label="Note RH"
            value={`${Number(profile.performanceRating).toFixed(1)} / 5`}
            sub={`${profile.projectsCompleted} projet${profile.projectsCompleted !== 1 ? "s" : ""} complété${profile.projectsCompleted !== 1 ? "s" : ""}`}
            accent="bg-amber-50"
          />
        </div>
      )}

      {/* ══ DOMAINES + RÉMUNÉRATION ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Domaines */}
        {hasDomainData && profile && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={16} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Performance par domaine</h2>
            </div>
            {profile.itTasksDone > 0 && (
              <DomainCard domain="IT" tasksDone={profile.itTasksDone} score={profile.itScore} avgDelay={profile.itAvgDelay} />
            )}
            {profile.marketingTasksDone > 0 && (
              <DomainCard domain="Marketing" tasksDone={profile.marketingTasksDone} score={profile.marketingScore} avgDelay={profile.marketingAvgDelay} />
            )}
            {profile.callCenterTasksDone > 0 && (
              <DomainCard domain="CallCenter" tasksDone={profile.callCenterTasksDone} score={profile.callCenterScore} avgDelay={profile.callCenterAvgDelay} />
            )}
          </div>
        )}

        {/* Rémunération */}
        {profile && (profile.baseSalary !== null || profile.bonuses > 0) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Rémunération</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Salaire de base</span>
                <span className="text-sm font-semibold text-slate-900">
                  {profile.baseSalary !== null ? `${Number(profile.baseSalary).toLocaleString("fr-FR")} TND` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Bonus</span>
                <span className="text-sm font-semibold text-emerald-700">
                  + {Number(profile.bonuses).toLocaleString("fr-FR")} TND
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Total</span>
                <span className="text-base font-bold text-violet-700">
                 {(Number(profile.baseSalary ?? 0) + Number(profile.bonuses)).toLocaleString("fr-FR")} TND
                </span>
              </div>
            </div>

            {/* Ratio salaire / bonus */}
            {profile.baseSalary !== null && profile.baseSalary > 0 && (
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Salaire</span>
                  <span>Bonus ({Math.round((Number(profile.bonuses) / (Number(profile.baseSalary) + Number(profile.bonuses))) * 100)}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-violet-400"
                    style={{ width: `${Math.round((profile.baseSalary / (profile.baseSalary + profile.bonuses)) * 100)}%` }}
                  />
                  <div className="h-full bg-emerald-400 flex-1" />
                </div>
              </div>
            )}

            {/* Infos contrat */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {profile.hireDate && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Date d'embauche</span>
                  <span className="text-slate-700 font-medium">{formatDate(profile.hireDate)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Contrat</span>
                <span className="text-slate-700 font-medium">{CONTRACT_LABELS[profile.contractType]}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ TÂCHES RÉCENTES ════════════════════════════════════════════════ */}
      {recentTasks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">10 dernières tâches</h2>
          </div>
          <div>
            {recentTasks.map((t) => (
              <TaskRow key={`${t.domain}-${t.taskId}`} task={t} />
            ))}
          </div>
        </div>
      )}

      {/* ══ PAS DE PROFIL RH ═══════════════════════════════════════════════ */}
      {!profile && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-amber-500" size={24} />
          <p className="text-amber-800 font-medium text-sm">Aucun profil RH trouvé pour votre compte.</p>
          <p className="text-amber-600 text-xs mt-1">Contactez votre responsable RH pour en créer un.</p>
        </div>
      )}

    </div>
  );
}