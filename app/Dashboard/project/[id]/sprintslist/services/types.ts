// ─── types.ts ────────────────────────────────────────────────────────────────

export type TaskType     = 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'TASK' | 'STORY';
export type TaskStatus   = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectMember {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  level?: string; // "Junior" | "Mid" | "Senior" | "Expert"
}

export interface Task {
  id?: number;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number;
  estimatedHours: number;
  aiEstimatedHours?: number;
  complexityScore: number;
  riskLevel: number;
  complexity: string;
  assignedTo: number;
  dependencies: string;
  risks: string;
  additionalNotes: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  delayHours?: number;
}

export interface Sprint {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'in_progress' | 'completed';
  priority: 'Low' | 'Medium' | 'High';
  complexity: 'Low' | 'Medium' | 'High';
  tasks: Task[];
}

export function getEmptyTask(): Task {
  return {
    title: '',
    description: '',
    type: 'FEATURE',
    status: 'TO_DO',
    priority: 'MEDIUM',
    storyPoints: 1,
    estimatedHours: 0,
    complexityScore: 1,
    riskLevel: 1,
    complexity: 'Medium',
    assignedTo: '',
    dependencies: '',
    risks: '',
    additionalNotes: '',
    scheduledStartDate: '',
    scheduledEndDate: '',
    delayHours: 0,
  };
}

export const inputClass =
  'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 ' +
  'focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none';

export const labelClass =
  'block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5';