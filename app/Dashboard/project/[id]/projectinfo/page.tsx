'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, Cpu, Calendar, Users, Clock, DollarSign,
  TrendingUp, AlertTriangle, CheckCircle2, Loader2, BarChart3,
  Zap, Target, Activity
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────
type TaskType = 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'TASK' | 'STORY';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface Task {
  id?: number;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  storyPoints: number;
  estimatedHours: number;
  aiEstimatedHours?: number;
  complexityScore: number;
  riskLevel: number;
  dependencies: string;
}

interface Sprint {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'in_progress' | 'completed';
  tasks: Task[];
}

interface ProjectDetails {
  project: {
    programmingLanguages: string;
    framework: string;
    database: string;
    serverDetails: string;
    architecture: string;
    apiIntegration: string;
    securityRequirements: string;
    devOpsRequirements: string;
    estimatedDurationDays: number;
    priority: string;
    businessImpact: string;
    startDate: string;
    endDate: string;
    itDetails?: {
      teamSize: number;
      estimatedCost?: number;
    };
    assignedTo: { id: number; name?: string; firstName?: string; lastName?: string }[];
  };
}

interface ProjectEstimationResult {
  totalHours: number;
  totalDays: number;
  estimatedEndDate: Date;
  dailyRate: number;
  totalCost: number;
  teamSize: number;
  hoursPerDay: number;
  projectCost: number;
}

interface TaskTimeline {
  taskId: string;
  taskTitle: string;
  startDate: Date;
  endDate: Date;
  estimatedHours: number;
  progress: number;
  status: 'planned' | 'in_progress' | 'completed';
}

// ── Auth token ─────────────────────────────────────────────────────────────────
const getAuthToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '';

// ── Cost estimation from FastAPI ────────────────────────────────────────────────
async function estimateProjectCost(
  projectDetails: ProjectDetails,
  token: string,
  estimatedDurationDays: number
): Promise<number | null> {
  try {
    const costApiBase = process.env.NEXT_PUBLIC_COST_ESTIMATION_API_URL;
    
    console.log(`🔗 Appel API coût: ${costApiBase}/predict-cost`);
    console.log(`📅 Durée estimée: ${estimatedDurationDays} jours`);
    
    if (!costApiBase) {
      console.error('❌ NEXT_PUBLIC_COST_ESTIMATION_API_URL non définie');
      return null;
    }

    // ✅ Payload exact qui correspond au modèle
    const payload = {
      programmingLanguages: projectDetails.project.programmingLanguages || "Python",
      framework: projectDetails.project.framework || "FastAPI",
      database: projectDetails.project.database || "PostgreSQL",
      serverDetails: projectDetails.project.serverDetails || "AWS EC2",
      architecture: projectDetails.project.architecture || "Microservices",
      apiIntegration: projectDetails.project.apiIntegration || "REST",
      securityRequirements: projectDetails.project.securityRequirements || "OAuth2",
      devOpsRequirements: projectDetails.project.devOpsRequirements || "Kubernetes",
      estimatedDurationDays: Math.ceil(estimatedDurationDays),  // ✅ Arrondir à entier
      priority: projectDetails.project.priority || "High",
      businessImpact: projectDetails.project.businessImpact || "Critical",
      teamSize: projectDetails.project.itDetails?.teamSize || 
                projectDetails.project.assignedTo?.length || 1,
      complexity: projectDetails.project.priority === 'Critical' ? 'High' : 'Medium',  // ✅ Minuscule
      mainModules: "Main",
    };

    console.log('📤 Payload envoyé:', JSON.stringify(payload, null, 2));

    const res = await fetch(`${costApiBase}/predict-cost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`❌ API retourna ${res.status}: ${res.statusText}`);
      const errorData = await res.json();
      console.error('Détails erreur:', errorData);
      return null;
    }
    
    const data = await res.json();
    console.log('✅ Coût estimé:', data.estimated_cost);
    console.log('✅ Utilisateur:', data.requested_by);
    return typeof data.estimated_cost === 'number' ? data.estimated_cost : null;
  } catch (e) {
    console.error('❌ Erreur API coût:', e);
    return null;
  }
}
// ── Helpers ────────────────────────────────────────────────────────────────────
function addWorkingDays(startDate: Date, days: number): Date {
  const date = new Date(startDate);
  let remaining = Math.ceil(days);
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

const typeColors: Record<string, string> = {
  FEATURE: '#6366f1',
  BUG: '#ef4444',
  IMPROVEMENT: '#f59e0b',
  TASK: '#10b981',
  STORY: '#8b5cf6',
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SprintEstimationPage() {
  const params = useParams() as { id?: string };
  const projectId = params?.id;
  const router = useRouter();

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [estimation, setEstimation] = useState<ProjectEstimationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [estimationDone, setEstimationDone] = useState(false);

  // ── Fetch data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      if (!projectId) return;
      setLoading(true);
      const token = getAuthToken();
      const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;

      try {
        const [sprintsRes, detailsRes] = await Promise.all([
          fetch(`${apiBase}/projects/${projectId}/sprints`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiBase}/projects/${projectId}/details`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (sprintsRes.ok) setSprints(await sprintsRes.json());
        if (detailsRes.ok) setProjectDetails(await detailsRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [projectId]);

  // ── Run estimation ───────────────────────────────────────────────────────────
  const runEstimation = async () => {
    setEstimating(true);
    setEstimationDone(false);

    const token = getAuthToken();
    const allTasks = sprints.flatMap((s) => s.tasks);

    // ✅ ÉTAPE 1: Utiliser aiEstimatedHours de la BD
    const totalHours = allTasks.reduce((sum, task) => {
      return sum + (task.aiEstimatedHours || task.estimatedHours || 0);
    }, 0);

    const teamSize =
      projectDetails?.project?.itDetails?.teamSize ||
      projectDetails?.project?.assignedTo?.length ||
      1;

    const hoursPerDay = 8;
    
    // ✅ ÉTAPE 2: Calculer les jours AVANT d'appeler l'API
    const totalDays = totalHours / hoursPerDay / teamSize;
    const estimatedDurationDays = Math.ceil(totalDays);  // ✅ Valeur à envoyer à l'API

    const startDate = projectDetails?.project?.startDate
      ? new Date(projectDetails.project.startDate)
      : new Date();

    const estimatedEndDate = addWorkingDays(startDate, totalDays);

    // ✅ ÉTAPE 3: Appeler l'API avec les jours calculés
    let projectCost = 0;
    if (projectDetails) {
      projectCost = await estimateProjectCost(
        projectDetails,
        token,
        estimatedDurationDays  // ✅ Passer les jours calculés
      ) || 0;
    }

    const avgDailyRate = 350;
    const totalCost = Math.round(totalDays * teamSize * avgDailyRate);

    setEstimation({
      totalHours,
      totalDays,
      estimatedEndDate,
      dailyRate: avgDailyRate,
      totalCost,
      teamSize,
      hoursPerDay,
      projectCost,
    });

    setEstimating(false);
    setEstimationDone(true);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const allTasks = sprints.flatMap((s) => s.tasks.map((t) => ({ ...t, sprintName: s.name })));
  const teamSize =
    projectDetails?.project?.itDetails?.teamSize ||
    projectDetails?.project?.assignedTo?.length ||
    1;

  const tasksByType = allTasks.reduce((acc: Record<string, number>, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});

  // ── Calcul du planning par tâche ───────────────────────────────────────────
  const generateTaskTimeline = (): TaskTimeline[] => {
    const projectStart = projectDetails?.project?.startDate
      ? new Date(projectDetails.project.startDate)
      : new Date();
    
    const taskTimelines: TaskTimeline[] = [];
    let cumulativeHours = 0;

    allTasks.forEach((task, idx) => {
      const taskHours = task.aiEstimatedHours || task.estimatedHours || 0;
      const taskDays = taskHours / 8 / teamSize;

      const startDate = addWorkingDays(projectStart, cumulativeHours / 8 / teamSize);
      const endDate = addWorkingDays(startDate, taskDays);

      const today = new Date();
      let progress = 0;
      if (today >= endDate) {
        progress = 100;
      } else if (today >= startDate) {
        const totalMs = endDate.getTime() - startDate.getTime();
        const elapsedMs = today.getTime() - startDate.getTime();
        progress = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
      }

      taskTimelines.push({
        taskId: `${task.id ?? idx}`,
        taskTitle: task.title,
        startDate,
        endDate,
        estimatedHours: taskHours,
        progress,
        status: today < startDate ? 'planned' : today < endDate ? 'in_progress' : 'completed',
      });

      cumulativeHours += taskHours;
    });

    return taskTimelines;
  };

  const taskTimelines = estimationDone ? generateTaskTimeline() : [];

  // ── Courbe d'avancement (Sprint Burn-up) ──
  const sortedSprints = [...sprints].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  let cumulativeTotal = 0;
  let cumulativeCompleted = 0;

  const burnUpData = sortedSprints.map(sprint => {
    const sprintPoints = sprint.tasks.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
    cumulativeTotal += sprintPoints;

    if (sprint.status === 'completed') {
      cumulativeCompleted += sprintPoints;
    } 
    
    return {
      name: sprint.name,
      date: new Date(sprint.endDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      TotalPrévu: cumulativeTotal,
      Réalisé: sprint.status === 'planned' ? null : cumulativeCompleted,
    };
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c1a 0%, #1a1130 50%, #0d1a2e 100%)',
      fontFamily: '"DM Sans", "Segoe UI", sans-serif',
      color: '#e2e8f0',
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#94a3b8', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 500, marginBottom: 16,
              transition: 'color .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#6366f1')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            <ChevronLeft size={18} /> Retour
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Cpu size={20} color="#fff" />
                </div>
                <h1 style={{
                  fontSize: 28, fontWeight: 800, margin: 0,
                  background: 'linear-gradient(90deg, #e2e8f0, #a5b4fc)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Estimation du Projet
                </h1>
              </div>
              <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
                {allTasks.length} tâches · {sprints.length} sprints · {teamSize} membres
              </p>
            </div>

            <button
              onClick={runEstimation}
              disabled={estimating || loading || allTasks.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 28px', borderRadius: 12,
                background: estimating
                  ? 'rgba(99,102,241,0.3)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: estimating ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
                transition: 'transform .15s',
              }}
              onMouseEnter={e => { if (!estimating) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {estimating ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Estimation en cours…</>
              ) : (
                <><Zap size={18} /> Lancer l'estimation</>
              )}
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader2 size={40} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#64748b', marginTop: 16 }}>Chargement des données…</p>
          </div>
        )}

        {!loading && (
          <>
            {/* ── KPIs ── */}
            {estimationDone && estimation && (
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 16 }}>
                  <KpiCard
                    icon={<Clock size={22} color="#6366f1" />}
                    label="Total heures"
                    value={formatHours(estimation.totalHours)}
                    sub={`${allTasks.length} tâches`}
                    color="#6366f1"
                  />
                  <KpiCard
                    icon={<Calendar size={22} color="#8b5cf6" />}
                    label="Durée du projet"
                    value={`${Math.ceil(estimation.totalDays)} j`}
                    sub={`${estimation.teamSize} dev × ${estimation.hoursPerDay}h/j`}
                    color="#8b5cf6"
                  />
                  <KpiCard
                    icon={<Target size={22} color="#06b6d4" />}
                    label="Date fin"
                    value={formatDate(estimation.estimatedEndDate).split(' ').slice(1).join(' ')}
                    sub={formatDate(estimation.estimatedEndDate).split(' ')[0]}
                    color="#06b6d4"
                  />
                  <KpiCard
                    icon={<DollarSign size={22} color="#10b981" />}
                    label="Coût du projet"
                    value={`${estimation.projectCost.toLocaleString('fr-FR')} dt`}
                    sub="Estimation XGBoost"
                    color="#10b981"
                  />
                </div>

                {/* ── Planning Gantt ── */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem',
                  marginBottom: 16,
                }}>
                  <h3 style={{ margin: '0 0 1.5rem', fontWeight: 700, fontSize: 15, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChart3 size={18} color="#6366f1" />
                    Planning des tâches (Gantt)
                  </h3>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: '800px', paddingRight: '20px' }}>
                      {taskTimelines.map((tt) => (
                        <div key={tt.taskId} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: 12 }}>
                            <span style={{ color: '#e2e8f0', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {tt.taskTitle}
                            </span>
                            <span style={{ color: '#64748b', fontSize: 11 }}>
                              {tt.startDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} → {tt.endDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          
                          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 24, position: 'relative', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              background: tt.status === 'completed' ? '#10b981' : tt.status === 'in_progress' ? '#6366f1' : '#64748b',
                              width: `${tt.progress}%`,
                              transition: 'width 0.3s ease',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {tt.progress > 5 && (
                                <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>
                                  {tt.progress}%
                                </span>
                              )}
                            </div>
                            {tt.progress <= 5 && (
                              <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#a5b4fc', fontSize: 10, fontWeight: 700 }}>
                                {tt.progress}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Burn-up Chart ── */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem',
                  marginBottom: 16, minHeight: 350,
                }}>
                  <h3 style={{ margin: '0 0 1.5rem', fontWeight: 700, fontSize: 15, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={18} color="#f59e0b" />
                    Avancement Global (Burn-up)
                  </h3>
                  
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={burnUpData} margin={{ top: 5, right: 20, left: 0, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: '#0f0c1a', 
                            border: '1px solid rgba(99,102,241,0.3)', 
                            borderRadius: 8, 
                            color: '#e2e8f0',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                        <Line 
                          type="monotone" 
                          dataKey="TotalPrévu" 
                          name="Prévu (SP)" 
                          stroke="#64748b" 
                          strokeWidth={2} 
                          strokeDasharray="5 5" 
                          dot={{ r: 3, fill: '#64748b' }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Réalisé" 
                          name="Réalisé (SP)" 
                          stroke="#6366f1" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#10b981' }} 
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ── Cost Breakdown ── */}
                <div style={{
                  background: 'rgba(16,185,129,0.06)', borderRadius: 16,
                  border: '1px solid rgba(16,185,129,0.2)', padding: '1.5rem',
                }}>
                  <h3 style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: 15, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Détail du coût
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    {[
                      { label: 'Heures totales', value: formatHours(estimation.totalHours) },
                      { label: 'Durée (jours)', value: `${Math.ceil(estimation.totalDays)} jours` },
                      { label: 'Équipe', value: `${estimation.teamSize} dev` },
                      { label: 'Taux journalier', value: `${estimation.dailyRate} dt/dev/j` },
                      { label: 'Coût main d\'œuvre', value: `${estimation.totalCost.toLocaleString('fr-FR')} dt` },
                      { label: 'Coût projet (IA)', value: `${estimation.projectCost.toLocaleString('fr-FR')} dt` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: '#e2e8f0' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Task Table ── */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
            }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={18} color="#6366f1" />
                  Toutes les tâches
                  <span style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                    {allTasks.length}
                  </span>
                </h3>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Tâche', 'Sprint', 'Type', 'Heures estimées'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allTasks.map((task, idx) => {
                      const hours = task.aiEstimatedHours || task.estimatedHours || 0;
                      return (
                        <tr
                          key={`${task.id ?? idx}`}
                          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 500, color: '#e2e8f0' }}>
                            {task.title}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>
                            {task.sprintName}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              background: `${typeColors[task.type]}20`,
                              color: typeColors[task.type],
                              borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                            }}>
                              {task.type}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#a5b4fc', fontWeight: 600 }}>
                            {formatHours(hours)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', borderRadius: 16,
      border: `1px solid ${color}30`, padding: '1.25rem',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        borderRadius: '50%', background: `${color}15`, filter: 'blur(20px)',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: `${color}20`, flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#e2e8f0', lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#475569' }}>{sub}</div>
    </div>
  );
}