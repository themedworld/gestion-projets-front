'use client';
// ─── Marketingestimationservice.ts ───────────────────────────────────────────
// AI estimation calls + serializeTask (the single source of truth for PATCH/POST body)

import type { TaskMarketing } from './Types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const safeNum = (v: unknown): number => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

export const formatHours = (h: number): string => {
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (Number.isInteger(h)) return `${h}h`;
  return `${h.toFixed(1)}h`;
};

// ─── serializeTask ────────────────────────────────────────────────────────────
// Single source of truth for POST /marketing-sprints/:id/tasks
// and PATCH /marketing-tasks/:id

export const serializeTask = (task: TaskMarketing): Record<string, unknown> => {
  // ── Résoudre l'id du membre assigné ──────────────────────────────────────
  let assignedToPayload: { id: number } | undefined;

  if (task.assignedTo != null && task.assignedTo !== '' && task.assignedTo !== '0') {
    const rawId =
      typeof task.assignedTo === 'object' && 'id' in task.assignedTo
        ? (task.assignedTo as { id: number }).id
        : Number(task.assignedTo);

    if (rawId && isFinite(rawId)) {
      assignedToPayload = { id: rawId };
    }
  }

  // ── Sérialiser les dates ──────────────────────────────────────────────────
  const toISO = (d: string | null | undefined): string | null => {
    if (!d) return null;
    try { return new Date(d).toISOString(); }
    catch { return null; }
  };

  // ── Choisir les heures: préférer l'estimation IA ─────────────────────────
  const estimatedHours =
    task.aiEstimatedHours != null
      ? Math.round(safeNum(task.aiEstimatedHours))
      : task.estimatedHours != null
        ? Math.round(safeNum(task.estimatedHours))
        : undefined;

  // ── Corps final — aligné avec CreateTaskMarketingDto / UpdateTaskMarketingDto ──
  return {
    title:       task.title,
    description: task.description ?? '',
    type:        task.type,
    status:      task.status,
    priority:    task.priority,
    channel:     task.channel ?? '',

    scheduledStartDate: toISO(task.scheduledStartDate),
    scheduledEndDate:   toISO(task.scheduledEndDate),

    estimatedHours,

    // Financial
    budget: task.budget != null ? safeNum(task.budget) : undefined,
    cost:   task.cost   != null ? safeNum(task.cost)   : undefined,

    // KPIs / performance targets
    expectedViews:       task.expectedViews       != null ? safeNum(task.expectedViews)       : undefined,
    impressions:         task.impressions          != null ? safeNum(task.impressions)          : undefined,
    expectedClicks:      task.expectedClicks       != null ? safeNum(task.expectedClicks)      : undefined,
    expectedLeads:       task.expectedLeads        != null ? safeNum(task.expectedLeads)       : undefined,
    expectedConversions: task.expectedConversions  != null ? safeNum(task.expectedConversions) : undefined,
   
expectedCTR: task.expectedCTR != null ? safeNum(task.expectedCTR) : undefined,

    // ML model inputs
    score:      task.score      != null ? safeNum(task.score)      : undefined,
    complexity: task.complexity != null ? safeNum(task.complexity) : undefined,
    effort:     task.effort     != null ? safeNum(task.effort)     : undefined,

    // assignedTo as { id } — aligned with DTO
    ...(assignedToPayload ? { assignedTo: assignedToPayload } : {}),
  };
};

// ─── AI estimation (single task) ─────────────────────────────────────────────
// Maps TaskMarketing fields to the ML model input schema:
// task_type, status, priority, cost, impressions, clicks, conversions,
// leads, score, ctr, channel_group, complexity, effort, + ch_* one-hot

const AI_PREDICT_URL =
  process.env.NEXT_PUBLIC_AI_MARKETING_URL ?? 'http://localhost:8001/predict';

// Maps our TaskMarketingType → numeric task_type expected by ML model
const TASK_TYPE_MAP: Record<string, number> = {
  SEO: 0, PPC: 1, EMAIL: 2, SOCIAL: 3, CONTENT: 4,
  VIDEO: 5, INFLUENCER: 6, AFFILIATE: 7, PR: 8, EVENT: 9, OTHER: 10,
};

// Maps status string → numeric
const STATUS_MAP: Record<string, number> = {
  TO_DO: 0, IN_PROGRESS: 1, IN_REVIEW: 2, DONE: 3, BLOCKED: 4,
};

// Maps priority string → numeric
const PRIORITY_MAP: Record<string, number> = {
  LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3,
};

export async function estimateMarketingTaskHours(
  task: TaskMarketing,
): Promise<number | null> {
  try {
    const payload = {
      // Numeric encodings of categorical fields
      task_type:     TASK_TYPE_MAP[task.type]     ?? 10,   // OTHER fallback
      status:        STATUS_MAP[task.status]       ?? 0,
      priority:      PRIORITY_MAP[task.priority]   ?? 1,

      // Numeric inputs
      cost:        safeNum(task.cost ?? task.budget),
      impressions: safeNum(task.impressions ?? task.expectedViews),
      clicks:      safeNum(task.expectedClicks),
      conversions: safeNum(task.expectedConversions),
      leads:       safeNum(task.expectedLeads),
      score:       safeNum(task.score ?? 3),
      ctr:         safeNum(task.expectedCTR),

      // channel_group: use first channel token (numeric index into CHANNEL_OPTIONS)
      channel_group: (() => {
        const ch = (task.channel ?? '').split(';')[0].trim();
        const CHANNEL_OPTIONS = [
          'App','Bing','Creative','Display','Email','Facebook','Google',
          'Instagram','Internal','LinkedIn','Multi','Native','Pinterest',
          'Programmatic','Push','SMS','Snapchat','Social','Spotify','TV',
          'TikTok','Twitter','Website','YouTube',
        ];
        const idx = CHANNEL_OPTIONS.indexOf(ch);
        return idx >= 0 ? idx : 0;
      })(),

      complexity:       safeNum(task.complexity ?? 3),
      effort:           safeNum(task.effort     ?? 2),
      conversion_rate:  0,
      unused1:          0,
      flag:             0,
      id:               0,

      // Pass raw channel string so the API can build ch_* one-hot columns
      channels: task.channel ?? '',
    };

    const res = await fetch(AI_PREDICT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) return null;
    const data = await res.json();
    // API returns { prediction: number }
    const raw = data.prediction ?? data.estimated_hours;
    return typeof raw === 'number' ? Math.round(raw * 100) / 100 : null;
  } catch {
    return null;
  }
}

// ─── AI estimation (batch) ────────────────────────────────────────────────────

export async function estimateAllMarketingTasks(
  tasks: TaskMarketing[],
): Promise<TaskMarketing[]> {
  const results = await Promise.allSettled(
    tasks.map((t) => estimateMarketingTaskHours(t)),
  );

  return tasks.map((task, i) => {
    const result = results[i];
    const hours =
      result.status === 'fulfilled' && result.value != null
        ? result.value
        : null;
    return hours != null
      ? { ...task, aiEstimatedHours: hours, estimatedHours: hours }
      : task;
  });
}