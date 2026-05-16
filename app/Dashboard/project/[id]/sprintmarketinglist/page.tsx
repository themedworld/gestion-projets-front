'use client';
// ─── MarketingSprintsPage.tsx ─────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, AlertCircle, X, ListTodo } from 'lucide-react';

import type { SprintMarketing, TaskMarketing, ProjectMember } from './services/Types';
import { getEmptyTask, getEmptySprint } from './services/Types';
import {
  estimateMarketingTaskHours,
  estimateAllMarketingTasks,
  serializeTask,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/Marketingestimationservice';
import {
  computeMarketingProjectMetrics,
  type MarketingProjectMetrics,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/marketingProjectMetrics';
import {
  estimateMarketingProjectCost,
} from '@/Dashboard/project/[id]/sprintmarketinglist/services/marketingCostEstimationService';
import { MarketingSprintForm } from '@/Dashboard/project/[id]/sprintmarketinglist/components/Marketingsprintform';
import { MarketingSprintCard } from '@/Dashboard/project/[id]/sprintmarketinglist/components/Marketingsprintcard';
import { validateSprintDates } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Datevalidation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAuthToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL ?? 'http://localhost:3001/api/v1';

async function apiFetch(url: string, options: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let body = '';
    try { body = await res.clone().text(); } catch { /* ignore */ }
    console.error(`[API] ${options.method ?? 'GET'} ${url} → ${res.status}`, body);
  }
  return res;
}

// ─── Page component ───────────────────────────────────────────────────────────

const MarketingSprintsPage: React.FC = () => {
  const params    = useParams() as { id?: string };
  const projectId = params?.id;
  const router    = useRouter();

  // ── Data ────────────────────────────────────────────────────────────────────
  const [members,            setMembers]            = useState<ProjectMember[]>([]);
  const [sprints,            setSprints]            = useState<SprintMarketing[]>([]);
  const [marketingProjectId, setMarketingProjectId] = useState<number | null>(null);
  const [metrics,            setMetrics]            = useState<MarketingProjectMetrics | null>(null);

  // ── Project date bounds (for sprint validation) ──────────────────────────
  const [projectStartDate, setProjectStartDate] = useState<string | null>(null);
  const [projectEndDate,   setProjectEndDate]   = useState<string | null>(null);

  // ── UI ──────────────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);
  const [expandedSprints, setExpandedSprints] = useState<Set<number>>(new Set());

  // ── Create sprint ────────────────────────────────────────────────────────────
  const [showCreate,       setShowCreate]       = useState(false);
  const [newSprint,        setNewSprint]        = useState<SprintMarketing>(getEmptySprint());
  const [newTasks,         setNewTasks]         = useState<TaskMarketing[]>([getEmptyTask()]);
  const [estimatingNewIdx, setEstimatingNewIdx] = useState<number | null>(null);

  // ── Edit sprint ──────────────────────────────────────────────────────────────
  const [editingSprintId,    setEditingSprintId]    = useState<number | null>(null);
  const [editingSprintData,  setEditingSprintData]  = useState<SprintMarketing | null>(null);
  const [editingSprintTasks, setEditingSprintTasks] = useState<TaskMarketing[]>([]);
  const [estimatingEditIdx,  setEstimatingEditIdx]  = useState<number | null>(null);

  // ── Edit task ────────────────────────────────────────────────────────────────
  const [editingTaskId,       setEditingTaskId]       = useState<number | null>(null);
  const [editingTaskSprintId, setEditingTaskSprintId] = useState<number | null>(null);
  const [editingTaskData,     setEditingTaskData]     = useState<TaskMarketing | null>(null);
  const [estimatingEditTask,  setEstimatingEditTask]  = useState(false);

  // ── persistMarketingMetrics ────────────────────────────────────────────────
  const persistMarketingMetrics = useCallback(
    async (m: MarketingProjectMetrics, aiCost: number) => {
      if (!projectId) return;
      try {
        const body = {
          estimatedDurationDays: m.durationDays,
          estimatedCost:         Math.round(aiCost * 100) / 100,
          teamSize:              m.teamSize,
        };
        await apiFetch(`${apiBase}/projects/${projectId}/marketing-details`, {
          method:  'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(body),
        });
      } catch (err) {
        console.error('[persistMarketingMetrics]', err);
      }
    },
    [projectId],
  );

  // ── refreshMarketingMetrics ────────────────────────────────────────────────
  const refreshMarketingMetrics = useCallback(
    async (updatedSprints: SprintMarketing[]) => {
      if (updatedSprints.length === 0) { setMetrics(null); return; }

      const m = computeMarketingProjectMetrics(updatedSprints, members, members.length);
      setMetrics(m);
      if (m.totalHours === 0) return;

      const sprintsMeta = {
        totalBudget:    updatedSprints.reduce((s, sp) => s + Number(sp.totalBudget ?? 0), 0),
        campaignType:   updatedSprints[0]?.campaignType,
        targetAudience: updatedSprints[0]?.targetAudience,
        channels:       updatedSprints.map((s) => s.channels).filter(Boolean).join('|'),
        goals:          updatedSprints.map((s) => s.goals).filter(Boolean).join('|'),
        expectedReach:  updatedSprints.reduce((s, sp) => s + Number(sp.expectedReach ?? 0), 0),
        expectedLeads:  updatedSprints.reduce((s, sp) => s + Number(sp.expectedLeads ?? 0), 0),
        expectedROI:    updatedSprints[0]?.expectedROI,
      };

      const aiCost   = await estimateMarketingProjectCost(m.durationDays, m.teamSize, sprintsMeta);
      const finalCost = aiCost !== null ? aiCost : m.estimatedBudget;

      await persistMarketingMetrics(m, finalCost);
      setMetrics({ ...m, estimatedBudget: finalCost });
    },
    [members, persistMarketingMetrics],
  );

  useEffect(() => {
    refreshMarketingMetrics(sprints);
  }, [sprints, refreshMarketingMetrics]);

  // ── Fetch sprints ─────────────────────────────────────────────────────────────
  const fetchSprints = useCallback(async (mktId: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/projects/${mktId}/marketing-sprints`,
        { headers: { Authorization: `Bearer ${getAuthToken()}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setSprints(Array.isArray(data) ? data : []);
      } else {
        setError('Erreur lors du chargement des sprints');
      }
    } catch {
      setError('Erreur lors du chargement des sprints');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch project details (members + domain id + project dates) ──────────────
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/projects/${projectId}/details`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        if (res.ok) {
          const data = await res.json();

          setMembers(data.project?.assignedTo ?? []);

          // ── Store project date bounds for sprint validation ──────────────
          setProjectStartDate(data.project?.startDate ?? null);
          setProjectEndDate(data.project?.endDate     ?? null);

          const mktId: number | undefined = data.domainDetails?.id;
          if (mktId) {
            setMarketingProjectId(mktId);
            fetchSprints(mktId);
          } else {
            setError(
              'Aucun sous-projet Marketing trouvé pour ce projet. ' +
              'Vérifiez que les détails Marketing ont bien été initialisés.',
            );
          }
        }
      } catch (e) {
        console.error(e);
        setError('Erreur lors du chargement du projet');
      }
    })();
  }, [projectId, fetchSprints]);

  const toggleExpand = (id: number) =>
    setExpandedSprints((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── CREATE SPRINT ────────────────────────────────────────────────────────────
  const handleCreateSprint = async () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      setError('Veuillez remplir les champs obligatoires (nom, dates).');
      return;
    }
    if (!marketingProjectId) {
      setError('ID du projet Marketing introuvable. Rechargez la page.');
      return;
    }

    // ── Guard: sprint date validation ────────────────────────────────────────
    const sprintErr = validateSprintDates(
      undefined,
      newSprint.startDate,
      newSprint.endDate,
      projectStartDate,
      projectEndDate,
      sprints,
    );
    if (sprintErr) { setError(sprintErr); return; }

    const validTasks = newTasks.filter((t) => t.title.trim());

    setEstimating(true);
    const tasksWithAI = await estimateAllMarketingTasks(validTasks);
    setEstimating(false);

    setLoading(true);
    try {
      const token   = getAuthToken();
      const payload = [{
        ...newSprint,
        totalBudget:   Number(newSprint.totalBudget   ?? 0),
        expectedReach: Number(newSprint.expectedReach ?? 0),
        expectedLeads: Number(newSprint.expectedLeads ?? 0),
        expectedROI:   Number(newSprint.expectedROI   ?? 0),
        startDate: new Date(newSprint.startDate).toISOString(),
        endDate:   new Date(newSprint.endDate).toISOString(),
        tasks: tasksWithAI.map(serializeTask),
      }];

      const res = await apiFetch(
        `${apiBase}/projects/${marketingProjectId}/marketing-sprints`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error('Erreur lors de la création du sprint');

      setSuccess('Sprint créé avec succès !');
      setShowCreate(false);
      setNewSprint(getEmptySprint());
      setNewTasks([getEmptyTask()]);
      fetchSprints(marketingProjectId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateNewTask = async (idx: number) => {
    setEstimatingNewIdx(idx);
    const hours = await estimateMarketingTaskHours(newTasks[idx]);
    setEstimatingNewIdx(null);
    if (hours !== null) {
      setNewTasks((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], aiEstimatedHours: hours, estimatedHours: hours };
        return next;
      });
    }
  };

  // ── EDIT SPRINT ──────────────────────────────────────────────────────────────
  const handleEditSprint = (sprint: SprintMarketing) => {
    setEditingSprintId(sprint.id ?? 0);
    setEditingSprintData({ ...sprint });
    setEditingSprintTasks([...sprint.tasks]);
  };

  const handleSaveSprint = async () => {
    if (!editingSprintData || !editingSprintId) return;
    if (!marketingProjectId) { setError('ID du projet Marketing introuvable.'); return; }

    // ── Guard: sprint date validation ────────────────────────────────────────
    const sprintErr = validateSprintDates(
      editingSprintId,
      editingSprintData.startDate,
      editingSprintData.endDate,
      projectStartDate,
      projectEndDate,
      sprints,
    );
    if (sprintErr) { setError(sprintErr); return; }

    setLoading(true);
    try {
      const token = getAuthToken();

      const res = await apiFetch(
        `${apiBase}/projects/marketing-sprints/${editingSprintId}`,
        {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name:           editingSprintData.name,
            startDate:      new Date(editingSprintData.startDate).toISOString(),
            endDate:        new Date(editingSprintData.endDate).toISOString(),
            status:         editingSprintData.status,
            priority:       editingSprintData.priority,
            complexity:     editingSprintData.complexity,
            totalBudget:    Number(editingSprintData.totalBudget   ?? 0),
            campaignType:   editingSprintData.campaignType,
            targetAudience: editingSprintData.targetAudience,
            channels:       editingSprintData.channels,
            goals:          editingSprintData.goals,
            expectedReach:  Number(editingSprintData.expectedReach ?? 0),
            expectedLeads:  Number(editingSprintData.expectedLeads ?? 0),
            expectedROI:    Number(editingSprintData.expectedROI   ?? 0),
          }),
        },
      );
      if (!res.ok) throw new Error('Erreur lors de la mise à jour du sprint');

      const newlyAdded = editingSprintTasks.filter((t) => !t.id && t.title.trim());
      if (newlyAdded.length) {
        setEstimating(true);
        const withAI = await estimateAllMarketingTasks(newlyAdded);
        setEstimating(false);

        for (const task of withAI) {
          const taskRes = await apiFetch(
            `${apiBase}/projects/marketing-sprints/${editingSprintId}/tasks`,
            {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body:    JSON.stringify(serializeTask(task)),
            },
          );
          if (!taskRes.ok) throw new Error('Erreur lors de la création de la tâche');
        }
      }

      setSuccess('Sprint mis à jour !');
      setEditingSprintId(null);
      setEditingSprintData(null);
      setEditingSprintTasks([]);
      fetchSprints(marketingProjectId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateEditTask = async (idx: number) => {
    setEstimatingEditIdx(idx);
    const hours = await estimateMarketingTaskHours(editingSprintTasks[idx]);
    setEstimatingEditIdx(null);
    if (hours !== null) {
      setEditingSprintTasks((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], aiEstimatedHours: hours, estimatedHours: hours };
        return next;
      });
    }
  };

  const handleDeleteSprint = async (id: number) => {
    if (!confirm('Supprimer ce sprint et toutes ses tâches ?')) return;
    if (!marketingProjectId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/projects/marketing-sprints/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setSprints((prev) => prev.filter((s) => s.id !== id));
      setSuccess('Sprint supprimé !');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── EDIT TASK ────────────────────────────────────────────────────────────────
  const handleStartEditTask = (task: TaskMarketing, sprintId: number) => {
    setEditingTaskId(task.id ?? 0);
    setEditingTaskSprintId(sprintId);
    const rawId = task.assignedTo;
    const normalizedId =
      typeof rawId === 'object' && rawId !== null && 'id' in rawId
        ? String((rawId as any).id)
        : String(rawId ?? '');
    setEditingTaskData({ ...task, assignedTo: normalizedId });
  };

  const handleSaveTask = async () => {
    if (!editingTaskData || !editingTaskId || !marketingProjectId) return;

    setEstimatingEditTask(true);
    const hours = await estimateMarketingTaskHours(editingTaskData);
    setEstimatingEditTask(false);

    // ── Merge AI estimation into task — sent to backend via DTO ─────────────
    const taskWithAI: TaskMarketing = {
      ...editingTaskData,
      aiEstimatedHours: hours ?? editingTaskData.aiEstimatedHours,
      estimatedHours:   hours ?? editingTaskData.estimatedHours ?? 0,
    };

    setLoading(true);
    try {
      const res = await apiFetch(
        `${apiBase}/projects/marketing-tasks/${editingTaskId}`,
        {
          method:  'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${getAuthToken()}`,
          },
          // serializeTask now includes aiEstimatedHours — see note below
          body: JSON.stringify(serializeTask(taskWithAI)),
        },
      );
      if (!res.ok) throw new Error('Erreur lors de la mise à jour de la tâche');

      setSprints((prev) =>
        prev.map((s) =>
          s.id === editingTaskSprintId
            ? { ...s, tasks: s.tasks.map((t) => (t.id === editingTaskId ? taskWithAI : t)) }
            : s,
        ),
      );
      setSuccess('Tâche mise à jour !');
      setEditingTaskId(null);
      setEditingTaskSprintId(null);
      setEditingTaskData(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number, sprintId: number) => {
    if (!confirm('Supprimer cette tâche ?')) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/projects/marketing-tasks/${taskId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setSprints((prev) =>
        prev.map((s) =>
          s.id === sprintId
            ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }
            : s,
        ),
      );
      setSuccess('Tâche supprimée !');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-2 transition-colors font-medium"
            >
              <ChevronLeft size={18} /> Retour au projet
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Sprints Marketing
            </h1>
            <p className="text-slate-500 mt-1">
              Gérez vos campagnes, assignez les tâches et suivez les performances.
            </p>
          </div>
          <button
            onClick={() => setShowCreate((v) => !v)}
            disabled={!marketingProjectId}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg
                       font-semibold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            {showCreate ? 'Annuler' : 'Nouveau Sprint'}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-700">
            <div className="flex items-center gap-3"><AlertCircle size={20} /><span>{error}</span></div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X size={18} /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-700">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700"><X size={18} /></button>
          </div>
        )}

        {/* Metrics */}
        {metrics && metrics.totalHours > 0 && (
          <div className="mb-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">
              Résumé du projet Marketing
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-emerald-50 rounded-xl">
                <p className="text-2xl font-extrabold text-emerald-600">{Math.round(metrics.totalHours)}h</p>
                <p className="text-xs text-slate-500 mt-1">Heures estimées</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-extrabold text-blue-600">{metrics.teamSize}</p>
                <p className="text-xs text-slate-500 mt-1">Membres</p>
              </div>
              <div className="p-4 bg-violet-50 rounded-xl">
                <p className="text-2xl font-extrabold text-violet-600">{metrics.durationDays}j</p>
                <p className="text-xs text-slate-500 mt-1">Durée estimée</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-2xl font-extrabold text-amber-600">
                  {metrics.estimatedBudget.toLocaleString('fr-FR', {
                    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-1">Coût IA estimé</p>
              </div>
            </div>
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <MarketingSprintForm
            mode="create"
            sprint={newSprint}
            tasks={newTasks}
            members={members}
            loading={loading}
            estimating={estimating}
            estimatingTaskIdx={estimatingNewIdx}
            allSprints={sprints}
            projectStartDate={projectStartDate}
            projectEndDate={projectEndDate}
            onSprintChange={(field, value) =>
              setNewSprint((prev) => ({ ...prev, [field]: value }))
            }
            onTaskChange={(idx, field, value) => {
              setNewTasks((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], [field]: value };
                return next;
              });
            }}
            onAddTask={() => setNewTasks((prev) => [...prev, getEmptyTask()])}
            onRemoveTask={(idx) =>
              setNewTasks((prev) =>
                prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
              )
            }
            onEstimateTask={handleEstimateNewTask}
            onSave={handleCreateSprint}
            onCancel={() => {
              setShowCreate(false);
              setNewSprint(getEmptySprint());
              setNewTasks([getEmptyTask()]);
            }}
          />
        )}

        {loading && !showCreate && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
            <p className="text-slate-600 mt-4">Chargement des sprints…</p>
          </div>
        )}

        {!loading && sprints.length === 0 && !showCreate && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <ListTodo size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-lg">Aucun sprint marketing trouvé</p>
            <p className="text-slate-400 text-sm mt-2">Créez votre premier sprint pour commencer</p>
          </div>
        )}

        {!loading && sprints.length > 0 && (
          <div className="space-y-4">
            {sprints.map((sprint) => (
              <MarketingSprintCard
                key={sprint.id}
                sprint={sprint}
                members={members}
                isExpanded={expandedSprints.has(sprint.id!)}
                isEditing={editingSprintId === sprint.id}
                editingSprintData={editingSprintData}
                editingSprintTasks={editingSprintTasks}
                editingTaskId={editingTaskId}
                editingTaskSprintId={editingTaskSprintId}
                editingTaskData={editingTaskData}
                estimatingTaskIdx={editingSprintId === sprint.id ? estimatingEditIdx : null}
                loading={loading}
                estimating={estimating}
                // ── Pass validation context down to the card/form ────────────
                allSprints={sprints}
                projectStartDate={projectStartDate}
                projectEndDate={projectEndDate}

                onToggleExpand={toggleExpand}
                onStartEditSprint={handleEditSprint}
                onSprintChange={(field, value) =>
                  setEditingSprintData((prev) => prev ? { ...prev, [field]: value } : prev)
                }
                onSprintTaskChange={(idx, field, value) => {
                  setEditingSprintTasks((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], [field]: value };
                    return next;
                  });
                }}
                onAddSprintTask={() =>
                  setEditingSprintTasks((prev) => [...prev, getEmptyTask()])
                }
                onRemoveSprintTask={(idx) => {
                  const task = editingSprintTasks[idx];
                  if (task.id) {
                    setError('Utilisez le bouton Supprimer pour les tâches existantes.');
                  } else {
                    setEditingSprintTasks((prev) => prev.filter((_, i) => i !== idx));
                  }
                }}
                onEstimateSprintTask={handleEstimateEditTask}
                onSaveSprint={handleSaveSprint}
                onCancelEditSprint={() => {
                  setEditingSprintId(null);
                  setEditingSprintData(null);
                  setEditingSprintTasks([]);
                }}
                onDeleteSprint={handleDeleteSprint}

                onStartEditTask={handleStartEditTask}
                onEditTaskChange={(field, value) =>
                  setEditingTaskData((prev) => prev ? { ...prev, [field]: value } : prev)
                }
                onEstimateEditingTask={async () => {
                  if (!editingTaskData) return;
                  setEstimatingEditTask(true);
                  const hours = await estimateMarketingTaskHours(editingTaskData);
                  setEstimatingEditTask(false);
                  if (hours !== null) {
                    setEditingTaskData((prev) =>
                      prev ? { ...prev, aiEstimatedHours: hours, estimatedHours: hours } : prev,
                    );
                  }
                }}
                onSaveTask={handleSaveTask}
                onCancelEditTask={() => {
                  setEditingTaskId(null);
                  setEditingTaskSprintId(null);
                  setEditingTaskData(null);
                }}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingSprintsPage;