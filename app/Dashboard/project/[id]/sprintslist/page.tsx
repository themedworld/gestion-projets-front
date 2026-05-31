'use client';
// ─── SprintsPage.tsx ──────────────────────────────────────────────────────────
//
// FLUX COMPLET après chaque sauvegarde de sprint / tâche :
//
//  1. estimateAllTaskHours()  → POST /predict-hours pour chaque tâche
//                               → task.aiEstimatedHours
//
//  2. computeProjectMetrics() →
//       totalHours    = Σ aiEstimatedHours (ou estimatedHours) de TOUTES les tâches
//       teamSize      = membres distincts affectés
//       durationDays  = ceil(totalHours / 8 / teamSize)   ← estimatedDurationDays
//       estimatedCost = Σ (heures × taux horaire)         ← fallback local seulement
//
//  3. estimateProjectCost()   → POST /predict-cost { estimatedDurationDays, teamSize, … }
//                               → coût IA en DT
//
//  4. persistProjectMetrics() → PATCH /projects/:id/it-details
//                               { estimatedDurationDays, estimatedCost (IA), teamSize }
//                               → écrit dans ProjectITEntity
//
// Le coût stocké en base = résultat du modèle IA (fallback = taux horaires si API KO).

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, AlertCircle, X, ListTodo } from 'lucide-react';

import type { Sprint, Task, ProjectMember } from '@/Dashboard/project/[id]/sprintslist/services/types';
import { getEmptyTask } from '@/Dashboard/project/[id]/sprintslist/services/types';
import {
  estimateTaskHours,
  estimateAllTaskHours,
} from '@/Dashboard/project/[id]/sprintslist/services/estimationService';
import {
  computeProjectMetrics,
  type ProjectMetrics,
} from '@/Dashboard/project/[id]/sprintslist/services/projectMetrics';
import {
  estimateProjectCost,
  type CostEstimationRequest,
} from '@/Dashboard/project/[id]/sprintslist/services/costEstimationService';
import { SprintForm }          from '@/Dashboard/project/[id]/sprintslist/components/SprintForm';
import { SprintCard }          from '@/Dashboard/project/[id]/sprintslist/components/SprintCard';
import { ProjectSummaryPanel } from '@/Dashboard/project/[id]/sprintslist/components/ProjectSummaryPanel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAuthToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

function emptyNewSprint(): Sprint {
  return {
    name: '', startDate: '', endDate: '',
    status: 'planned', priority: 'Medium', complexity: 'Medium',
    tasks: [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const SprintsPage = () => {
  const params    = useParams() as { id?: string };
  const projectId = params?.id;
  const router    = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [members, setMembers]   = useState<ProjectMember[]>([]);
  const [sprints, setSprints]   = useState<Sprint[]>([]);
  const [metrics, setMetrics]   = useState<ProjectMetrics | null>(null);

  // IT project details (framework, DB…) fetched once — passed to cost API
  const [itDetails, setItDetails] = useState<Partial<CostEstimationRequest>>({});

  const [loading,    setLoading]    = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);
  const [expandedSprints, setExpandedSprints] = useState<Set<number>>(new Set());

  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [newSprint,        setNewSprint]         = useState<Sprint>(emptyNewSprint());
  const [newSprintTasks,   setNewSprintTasks]    = useState<Task[]>([getEmptyTask()]);

  const [editingSprintId,    setEditingSprintId]    = useState<number | null>(null);
  const [editingSprintData,  setEditingSprintData]  = useState<Sprint | null>(null);
  const [editingSprintTasks, setEditingSprintTasks] = useState<Task[]>([]);

  const [editingTaskId,       setEditingTaskId]       = useState<number | null>(null);
  const [editingTaskSprintId, setEditingTaskSprintId] = useState<number | null>(null);
  const [editingTaskData,     setEditingTaskData]     = useState<Task | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL;

  // ── apiFetch ───────────────────────────────────────────────────────────────
  async function apiFetch(url: string, options: RequestInit): Promise<Response> {
    const res = await fetch(url, options);
    if (!res.ok) {
      let body = '';
      try { body = await res.clone().text(); } catch { /* ignore */ }
      console.error(`[API] ${options.method ?? 'GET'} ${url} → ${res.status}`, body);
    }
    return res;
  }

  // ── persistProjectMetrics → ProjectITEntity ────────────────────────────────
  //
  // Writes the three auto-computed fields to the DB:
  //   estimatedDurationDays  ← ceil(totalHours / 8 / teamSize)
  //   estimatedCost          ← AI cost model result  (DT)
  //   teamSize               ← distinct assigned members
  //
  const persistProjectMetrics = useCallback(
    async (m: ProjectMetrics, aiCost: number) => {
      if (!projectId) return;
      try {
        const token = getAuthToken();
        const body = {
          estimatedDurationDays: m.durationDays,             // from task hours
          estimatedCost:         Math.round(aiCost * 100) / 100, // AI or fallback
          teamSize:              m.teamSize,
        };
        console.log('[persistProjectMetrics] PATCH it-details →', body);
        await apiFetch(`${apiBase}/projects/${projectId}/it-details`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      } catch (err) {
        console.error('[persistProjectMetrics]', err);
      }
    },
    [projectId, apiBase],
  );

  // ── refreshMetrics ─────────────────────────────────────────────────────────
  //
  // Called after every sprint/task save.
  // Order: compute metrics → call AI cost API → write DB.
  //
const refreshMetrics = useCallback(
  async (updatedSprints: Sprint[]) => {
    if (updatedSprints.length === 0) {
      setMetrics(null);
      return;
    }

    // ✅ passer members.length comme teamSize forcé
    const m = computeProjectMetrics(updatedSprints, members, members.length);
    setMetrics(m);

    if (m.totalHours === 0) return;

    const token  = getAuthToken();
    const aiCost = await estimateProjectCost(
      m.durationDays,
      m.teamSize,
      itDetails,
      token,
    );

    const finalCost = aiCost !== null ? aiCost : m.estimatedCost;
    await persistProjectMetrics(m, finalCost);
    setMetrics({ ...m, estimatedCost: finalCost });
  },
  [members, itDetails, persistProjectMetrics],
);

  // Re-run when sprints array reference changes (after fetchSprints resolves)
  useEffect(() => {
    refreshMetrics(sprints);
  }, [sprints, refreshMetrics]);

  // ── Fetch members ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    const token = getAuthToken();
    fetch(`${apiBase}/projects/${projectId}/details`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setMembers(data.project?.assignedTo ?? []);

          // Pull IT-specific fields to enrich cost estimation payload
          const it = data.project?.itDetails ?? {};
          setItDetails({
            programmingLanguages: it.programmingLanguages,
            framework:            it.framework,
            database:             it.database,
            serverDetails:        it.serverDetails,
            architecture:         it.architecture,
            apiIntegration:       it.apiIntegration,
            securityRequirements: it.securityRequirements,
            devOpsRequirements:   it.devOpsRequirements,
            priority:             it.priority,
            businessImpact:       it.businessImpact,
            complexity:           it.complexity,
            mainModules:          it.mainModules,
          });
        }
      })
      .catch(console.error);
  }, [projectId]);

  // ── Fetch sprints ──────────────────────────────────────────────────────────
  useEffect(() => { fetchSprints(); }, [projectId]);

  const fetchSprints = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiBase}/projects/${projectId}/sprints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSprints(Array.isArray(data) ? data : []);
      }
    } catch {
      setError('Erreur lors du chargement des sprints');
    } finally {
      setLoading(false);
    }
  };

  const toggleSprintExpanded = (sprintId: number) => {
    setExpandedSprints((prev) => {
      const next = new Set(prev);
      next.has(sprintId) ? next.delete(sprintId) : next.add(sprintId);
      return next;
    });
  };

  // ── Sprint CRUD ────────────────────────────────────────────────────────────

  const handleCreateSprint = async () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      setError('Veuillez remplir tous les champs obligatoires du sprint');
      return;
    }
    const validTasks = newSprintTasks.filter((t) => t.title.trim());

    // AI task-hour estimation
    setEstimating(true);
    const token = getAuthToken();
    const tasksWithEstimates = await estimateAllTaskHours(validTasks, token, members);
    setEstimating(false);

    setLoading(true);
    try {
      const payload = [{
        ...newSprint,
        startDate: new Date(newSprint.startDate).toISOString(),
        endDate:   new Date(newSprint.endDate).toISOString(),
        tasks: tasksWithEstimates.map(serializeTask),
      }];
      const res = await apiFetch(`${apiBase}/projects/${projectId}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur lors de la création du sprint');

      setSuccess('Sprint créé avec succès!');
      setShowCreateSprint(false);
      setNewSprint(emptyNewSprint());
      setNewSprintTasks([getEmptyTask()]);
      await fetchSprints(); // triggers refreshMetrics via useEffect
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprintId(sprint.id ?? 0);
    setEditingSprintData({ ...sprint });
    setEditingSprintTasks([...sprint.tasks]);
  };

  const handleSaveSprint = async () => {
    if (!editingSprintData || !editingSprintId) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await apiFetch(`${apiBase}/projects/sprints/${editingSprintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:       editingSprintData.name,
          startDate:  new Date(editingSprintData.startDate).toISOString(),
          endDate:    new Date(editingSprintData.endDate).toISOString(),
          status:     editingSprintData.status,
          priority:   editingSprintData.priority,
          complexity: editingSprintData.complexity,
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour du sprint');

      // New tasks added during edit — estimate them before saving
      const newTasks = editingSprintTasks.filter((t) => !t.id && t.title.trim());
      if (newTasks.length) {
        setEstimating(true);
        const tasksWithEstimates = await estimateAllTaskHours(newTasks, token, members);
        setEstimating(false);
        for (const task of tasksWithEstimates) {
          const r = await apiFetch(
            `${apiBase}/projects/sprints/${editingSprintId}/tasks`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(serializeTask(task)),
            },
          );
          if (!r.ok) throw new Error('Erreur lors de la création de la tâche');
        }
      }

      setSuccess('Sprint mis à jour avec succès!');
      setEditingSprintId(null);
      setEditingSprintData(null);
      setEditingSprintTasks([]);
      await fetchSprints(); // triggers refreshMetrics via useEffect
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSprint = async (sprintId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sprint?')) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await apiFetch(`${apiBase}/projects/sprints/${sprintId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      const updated = sprints.filter((s) => s.id !== sprintId);
      setSprints(updated); // triggers refreshMetrics via useEffect
      setSuccess('Sprint supprimé!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Task CRUD ──────────────────────────────────────────────────────────────

const handleStartEditTask = (task: Task, sprintId: number) => {
  setEditingTaskId(task.id ?? 0);
  setEditingTaskSprintId(sprintId);
  setEditingTaskData({
    ...task,
    assignedTo: task.assignedTo
      ? Number(
          typeof task.assignedTo === 'object'
            ? (task.assignedTo as any).id
            : task.assignedTo,
        )
      : '',
  });
};

  const handleSaveTask = async () => {
    if (!editingTaskData || !editingTaskId) return;

    // Re-estimate this task with the AI model
    setEstimating(true);
    const token   = getAuthToken();
    const aiHours = await estimateTaskHours(editingTaskData, token, members);
    setEstimating(false);

    const taskWithAI: Task = {
      ...editingTaskData,
      aiEstimatedHours: aiHours ?? editingTaskData.aiEstimatedHours,
      estimatedHours:   aiHours ?? editingTaskData.estimatedHours ?? 0,
    };

    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/projects/tasks/${editingTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(serializeTask(taskWithAI)),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour');

      // Update local sprint state immediately (optimistic)
      const updatedSprints = sprints.map((s) =>
        s.id === editingTaskSprintId
          ? { ...s, tasks: s.tasks.map((t) => (t.id === editingTaskId ? taskWithAI : t)) }
          : s,
      );
      setSprints(updatedSprints); // triggers refreshMetrics via useEffect

      setSuccess('Tâche mise à jour!');
      setEditingTaskId(null);
      setEditingTaskSprintId(null);
      setEditingTaskData(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
// Avec les autres helpers (après getAuthToken)
// ✅ Envoie une ISO string complète — TypeORM la cast automatiquement en Date
const formatDate = (val: string | null | undefined): string | null => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString(); // "2024-01-20T00:00:00.000Z"
};
  const handleDeleteTask = async (taskId: number, sprintId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche?')) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await apiFetch(`${apiBase}/projects/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      const updatedSprints = sprints.map((s) =>
        s.id === sprintId ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) } : s,
      );
      setSprints(updatedSprints); // triggers refreshMetrics via useEffect
      setSuccess('Tâche supprimée!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── serializeTask ──────────────────────────────────────────────────────────
  //
  // Maps frontend Task → CreateTaskITDto / UpdateTaskITDto.
  //
  // Rules:
  //   ✅ estimatedHours   → aiEstimatedHours (priority) or manual fallback
  //   ✅ complexityScore  → int 1-5
  //   ✅ riskLevel        → int 1-5
  //   ✅ complexity       → text 'Low'|'Medium'|'High'
  //   ✅ hasBlockingDependencies / dependenciesCount → derived
  //   ✅ scheduledEndDate → only existing date column in TaskITEntity
  //   ✅ assignedTo       → { id: number } relation object
  //   ❌ scheduledStartDate → no DB column — never sent
  //   ❌ aiEstimatedHours  → not a DB column — never sent
  //
  function serializeTask(t: Task): Record<string, unknown> {
    // Resolve estimated hours — AI takes priority
    const estimatedHours =
      t.aiEstimatedHours != null
        ? Number(t.aiEstimatedHours)
        : Number(t.estimatedHours) || 0;

    // Dependency meta-fields derived from the text field
    const dependenciesRaw   = t.dependencies?.trim() ?? '';
    const dependenciesCount = dependenciesRaw
      ? dependenciesRaw.split(',').filter(Boolean).length
      : 0;
    const hasBlockingDependencies = dependenciesCount > 0;

    // scheduledEndDate — only existing date column in TaskITEntity
const scheduledStartDate = t.scheduledStartDate 
  ? new Date(t.scheduledStartDate).toISOString() 
  : null;

const scheduledEndDate = t.scheduledEndDate 
  ? new Date(t.scheduledEndDate).toISOString() 
  : null;


    // assignedTo — backend expects { id } relation object
    const assignedTo = (() => {
      const raw = t.assignedTo;
      if (!raw) return null;
      if (typeof raw === 'object' && 'id' in raw) {
        const id = Number((raw as any).id);
        return isNaN(id) || id === 0 ? null : { id };
      }
      const id = Number(raw);
      return isNaN(id) || id === 0 ? null : { id };
    })();

    return {
      // Core
      title:       t.title,
      description: t.description ?? null,

      // Enums (UPPER_CASE)
      type:     t.type     ?? 'FEATURE',
      status:   t.status   ?? 'TO_DO',
      priority: t.priority ?? 'MEDIUM',

      // Numeric
      storyPoints:     Number(t.storyPoints)    || 0,
      estimatedHours,                              // ← AI hours written here
      complexityScore: Number(t.complexityScore) || 1,
      riskLevel:       Number(t.riskLevel)       || 1,

      // Text label
      complexity: t.complexity ?? 'Medium',

      // Dependency meta
      hasBlockingDependencies,
      dependenciesCount,

      // Free text
      dependencies:    dependenciesRaw  || null,
      risks:           t.risks          || null,
      additionalNotes: t.additionalNotes || null,

      // Delay
      delayHours: Number(t.delayHours ?? 0) || 0,

      // Date (only scheduledEndDate exists in the entity)
scheduledStartDate: formatDate(t.scheduledStartDate ?? null),
scheduledEndDate: formatDate(t.scheduledEndDate ?? null),
      // scheduledStartDate intentionally omitted — no column in DB
      // aiEstimatedHours  intentionally omitted — not a DB column

      // Relation
      assignedTo,
    };
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-2 transition-colors font-medium"
            >
              <ChevronLeft size={18} /> Retour au projet
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Gestion des Sprints
            </h1>
            <p className="text-slate-500 mt-1">
              Créez, modifiez et gérez les sprints de votre projet
            </p>
          </div>
          <button
            onClick={() => setShowCreateSprint((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg
                       font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            <Plus size={18} />
            {showCreateSprint ? 'Annuler' : 'Nouveau Sprint'}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-700">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}><X size={18} /></button>
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-green-700">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)}><X size={18} /></button>
          </div>
        )}

        {/* Project summary */}
        {metrics && metrics.totalHours > 0 && (
          <ProjectSummaryPanel metrics={metrics} />
        )}

        {/* Create sprint form */}
        {showCreateSprint && (
          <SprintForm
            mode="create"
            sprint={newSprint}
            tasks={newSprintTasks}
            members={members}
            loading={loading}
            estimating={estimating}
            onSprintChange={(field, value) =>
              setNewSprint((p) => ({ ...p, [field]: value }))
            }
            onTaskChange={(idx, field, value) => {
              setNewSprintTasks((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], [field]: value };
                return next;
              });
            }}
            onAddTask={() => setNewSprintTasks((p) => [...p, getEmptyTask()])}
            onRemoveTask={(idx) =>
              setNewSprintTasks((p) =>
                p.length > 1 ? p.filter((_, i) => i !== idx) : p,
              )
            }
            onSave={handleCreateSprint}
            onCancel={() => {
              setShowCreateSprint(false);
              setNewSprint(emptyNewSprint());
              setNewSprintTasks([getEmptyTask()]);
            }}
          />
        )}

        {/* Loading */}
        {loading && !showCreateSprint && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            <p className="text-slate-600 mt-4">Chargement des sprints…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && sprints.length === 0 && !showCreateSprint && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <ListTodo size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-lg">Aucun sprint trouvé</p>
            <p className="text-slate-400 text-sm mt-2">
              Créez votre premier sprint pour commencer
            </p>
          </div>
        )}

        {/* Sprint list */}
        {!loading && sprints.length > 0 && (
          <div className="space-y-4">
            {sprints.map((sprint) => (
              <SprintCard
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
                loading={loading}
                estimating={estimating}
                onToggleExpand={toggleSprintExpanded}
                onStartEditSprint={handleEditSprint}
                onSprintChange={(field, value) =>
                  setEditingSprintData((p) => (p ? { ...p, [field]: value } : p))
                }
                onSprintTaskChange={(idx, field, value) => {
                  setEditingSprintTasks((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], [field]: value };
                    return next;
                  });
                }}
                onAddSprintTask={() =>
                  setEditingSprintTasks((p) => [...p, getEmptyTask()])
                }
                onRemoveSprintTask={(idx) => {
                  const task = editingSprintTasks[idx];
                  if (task.id) {
                    setError('Utilisez le bouton Supprimer pour les tâches existantes');
                  } else {
                    setEditingSprintTasks((p) => p.filter((_, i) => i !== idx));
                  }
                }}
                onSaveSprint={handleSaveSprint}
                onCancelEditSprint={() => {
                  setEditingSprintId(null);
                  setEditingSprintData(null);
                  setEditingSprintTasks([]);
                }}
                onDeleteSprint={handleDeleteSprint}
                onStartEditTask={handleStartEditTask}
                onEditTaskChange={(field, value) =>
                  setEditingTaskData((p) => (p ? { ...p, [field]: value } : p))
                }
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

export default SprintsPage;