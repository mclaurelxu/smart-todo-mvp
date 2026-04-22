import { useEffect, useState } from "react";
import { fetchTodayTasks, type Task, updateTask } from "../tasksApi";

type TodayTask = Task & { smartScore: number };

export function TodayPage() {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTodayTasks() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchTodayTasks();
      // Preserve backend ranking exactly as returned by /tasks/today.
      setTasks(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load today tasks.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTodayTasks();
  }, []);

  async function handleStart(taskId: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateTask(taskId, { status: "in_progress" });
      await loadTodayTasks();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update task status.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete(taskId: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateTask(taskId, { status: "done" });
      await loadTodayTasks();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to complete task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSnooze(task: TodayTask) {
    const baseDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const nextDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
    setIsSubmitting(true);
    setError(null);
    try {
      await updateTask(task.id, { dueDate: nextDate.toISOString() });
      await loadTodayTasks();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to snooze task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Today</h2>
      {error ? <p className="form-error">{error}</p> : null}
      {isLoading ? <p>Loading prioritized tasks...</p> : null}

      {!isLoading && tasks.length === 0 ? (
        <div className="empty-state">
          <p>No prioritized tasks yet.</p>
          <p>Add tasks to see your ranked Today list.</p>
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-item">
              <p className="task-title">{task.title}</p>
              <p className="task-meta">
                status: {task.status} | priority: {task.priority} | effort: {task.effort} | due:{" "}
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "none"}
              </p>
              <p className="task-meta">smart score: {task.smartScore}</p>
              <div className="task-actions">
                {task.status === "todo" ? (
                  <button type="button" disabled={isSubmitting} onClick={() => void handleStart(task.id)}>
                    Start
                  </button>
                ) : null}
                <button type="button" disabled={isSubmitting} onClick={() => void handleComplete(task.id)}>
                  Complete
                </button>
                <button type="button" disabled={isSubmitting} onClick={() => void handleSnooze(task)}>
                  Snooze +1 day
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

