export type ScorePriority = "low" | "medium" | "high";
export type ScoreEffort = "low" | "medium" | "high";

export type ScorableTask = {
  priority: ScorePriority;
  effort: ScoreEffort;
  dueDate: string | null;
};

const PRIORITY_WEIGHTS: Record<ScorePriority, number> = {
  low: 20,
  medium: 40,
  high: 60,
};

const EFFORT_WEIGHTS: Record<ScoreEffort, number> = {
  low: 15,
  medium: 8,
  high: 0,
};

function dueDateScore(dueDate: string | null, now: Date): number {
  if (!dueDate) {
    return 0;
  }

  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((parsed.getTime() - now.getTime()) / msPerDay);

  if (days < 0) {
    return 45;
  }
  if (days === 0) {
    return 35;
  }
  if (days === 1) {
    return 25;
  }
  if (days <= 3) {
    return 15;
  }
  if (days <= 7) {
    return 8;
  }
  return 0;
}

export function computeSmartScore(task: ScorableTask, now: Date = new Date()): number {
  return PRIORITY_WEIGHTS[task.priority] + EFFORT_WEIGHTS[task.effort] + dueDateScore(task.dueDate, now);
}

