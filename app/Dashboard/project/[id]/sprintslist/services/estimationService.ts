// ─── estimationService.ts ─────────────────────────────────────────────────────
// AI estimation logic.
//
// Fixes applied:
// 1. memberLevel is REQUIRED by the FastAPI schema (Field(..., example="Expert")).
//    We always send it — falling back to "Junior" when the task has no assignee.
// 2. estimatedHours coming back from the API (or stored on the task) can be
//    null/undefined. Every consumer must receive a safe number (0 as default).

import type { Task, ProjectMember } from '@/Dashboard/project/[id]/sprintslist/services/types';

// ─── Member level lookup ──────────────────────────────────────────────────────

export function getMemberLevel(
   assignedTo: number,
  members: ProjectMember[],
): string {
  if (!assignedTo) return 'Junior';
  const member = members.find((m) => m.id === Number(assignedTo));
  // Fall back to "Junior" if the member has no level set in the DB
  return member?.level ?? 'Junior';
}

// ─── Single-task estimate ─────────────────────────────────────────────────────

export async function estimateTaskHours(
  task: Task,
  authToken: string,
  members: ProjectMember[] = [],
): Promise<number | null> {
  try {
    const aiBase = process.env.NEXT_PUBLIC_AI_task_DURATION_API_URL;

    // FastAPI schema: memberLevel is Field(...) → required, no default.
    // Always resolve to a non-empty string before sending.
    const memberLevel = getMemberLevel(task. assignedTo, members);

    const payload = {
      type:     task.type.charAt(0).toUpperCase() + task.type.slice(1).toLowerCase(),
      priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase(),
      storyPoints:             Number(task.storyPoints),
      complexityScore:         Number(task.complexityScore),
      riskLevel:               Number(task.riskLevel),
      hasBlockingDependencies: !!(task.dependencies && task.dependencies.trim()),
      dependenciesCount:       task.dependencies
        ? task.dependencies.split(',').filter(Boolean).length
        : 0,
      memberLevel, // always present — required by FastAPI
    };

    const res = await fetch(`${aiBase}/predict-hours`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Log the full body so 422 details are visible in the browser console
      const body = await res.text().catch(() => '');
      console.error(`[estimationService] predict-hours ${res.status}:`, body);
      return null;
    }

    const data = await res.json();
    return typeof data.estimated_hours === 'number' ? data.estimated_hours : null;
  } catch (err) {
    console.error('[estimationService] predict-hours error:', err);
    return null;
  }
}

// ─── Bulk estimate ────────────────────────────────────────────────────────────

export async function estimateAllTaskHours(
  tasks: Task[],
  authToken: string,
  members: ProjectMember[] = [],
): Promise<Task[]> {
  return Promise.all(
    tasks.map(async (t) => {
      if (!t.title.trim()) return t;
      const hours = await estimateTaskHours(t, authToken, members);
      return hours !== null ? { ...t, aiEstimatedHours: hours } : t;
    }),
  );
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatHoursDays(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${m > 0 ? String(m).padStart(2, '0') : '00'}`;
}

// ─── Safe number helper ───────────────────────────────────────────────────────
// Converts null/undefined/NaN → 0.
// Use this for every <input type="number" value={...}> to silence the React
// "value prop should not be null" warning.
export function safeHours(v: number | null | undefined): number {
  if (v === null || v === undefined || Number.isNaN(v)) return 0;
  return v;
}