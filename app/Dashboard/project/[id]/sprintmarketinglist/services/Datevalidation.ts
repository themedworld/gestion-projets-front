// ─── dateValidation.ts ───────────────────────────────────────────────────────
// Centralised date-validation helpers shared by form components and the page.
// All functions return a string (error message) or null (valid).

import type { SprintMarketing } from '@/Dashboard/project/[id]/sprintmarketinglist/services/Types';

// ── Low-level helpers ─────────────────────────────────────────────────────────

/** Convert any date-ish value to a plain Date (strips time) */
export const toDay = (v: string | Date | null | undefined): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const fmt = (d: Date) =>
  d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ── Task date validation ──────────────────────────────────────────────────────

/**
 * Validates a task's dates against its parent sprint.
 * Returns an error message or null.
 */
export const validateTaskDates = (
  taskStart: string | Date | null | undefined,
  taskEnd:   string | Date | null | undefined,
  sprintStart: string | Date | null | undefined,
  sprintEnd:   string | Date | null | undefined,
): string | null => {
  const ts  = toDay(taskStart);
  const te  = toDay(taskEnd);
  const ss  = toDay(sprintStart);
  const se  = toDay(sprintEnd);

  // Task internal consistency
  if (ts && te && ts > te)
    return 'La date de début de la tâche doit être antérieure à sa date de fin.';

  // Task must be within sprint bounds
  if (ts && ss && ts < ss)
    return `La tâche ne peut pas commencer avant le sprint (${fmt(ss)}).`;
  if (ts && se && ts > se)
    return `La tâche ne peut pas commencer après la fin du sprint (${fmt(se)}).`;
  if (te && ss && te < ss)
    return `La tâche ne peut pas se terminer avant le début du sprint (${fmt(ss)}).`;
  if (te && se && te > se)
    return `La tâche ne peut pas dépasser la fin du sprint (${fmt(se)}).`;

  return null;
};

// ── Sprint date validation ────────────────────────────────────────────────────

/**
 * Validates a sprint's dates:
 *   1. start < end
 *   2. Both within project bounds (if provided)
 *   3. No overlap with any existing sprint (excluding itself by id)
 */
export const validateSprintDates = (
  sprintId:     number | undefined,
  sprintStart:  string | Date | null | undefined,
  sprintEnd:    string | Date | null | undefined,
  projectStart: string | Date | null | undefined,
  projectEnd:   string | Date | null | undefined,
  allSprints:   SprintMarketing[] = [],
): string | null => {
  const ss = toDay(sprintStart);
  const se = toDay(sprintEnd);
  const ps = toDay(projectStart);
  const pe = toDay(projectEnd);

  if (!ss || !se) return null; // incomplete — other validators handle required

  // 1. Internal consistency
  if (ss >= se)
    return 'La date de début du sprint doit être antérieure à sa date de fin.';

  // 2. Within project bounds
  if (ps && ss < ps)
    return `Le sprint ne peut pas commencer avant le projet (${fmt(ps)}).`;
  if (pe && se > pe)
    return `Le sprint ne peut pas se terminer après le projet (${fmt(pe)}).`;

  // 3. No overlap with other sprints
  for (const other of allSprints) {
    if (other.id && other.id === sprintId) continue; // skip self
    const os = toDay(other.startDate);
    const oe = toDay(other.endDate);
    if (!os || !oe) continue;

    // Overlap condition: ss < oe && se > os  (strict — touching is NOT allowed)
    if (ss < oe && se > os) {
      return `Ce sprint chevauche le sprint "${other.name}" (${fmt(os)} – ${fmt(oe)}). Les sprints ne peuvent pas se chevaucher ni se toucher.`;
    }
  }

  return null;
};