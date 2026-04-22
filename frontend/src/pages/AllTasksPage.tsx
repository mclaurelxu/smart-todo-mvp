import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  type Task,
  type TaskPriority,
  updateTask,
} from "../tasksApi";

const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

function isValidTitle(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 200;
}

function toDateInputValue(dueDate: string | null): string {
  if (!dueDate) {
    return "";
  }
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
}

function fromDateInput(value: string): string | null {
  if (!value) {
    return null;
  }
  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

export function AllTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium");
  const [editStatus, setEditStatus] = useState<Task["status"]>("todo");
  const [editDueDate, setEditDueDate] = useState("");

  const titleError = useMemo(() => {
    if (title.length === 0) {
      return null;
    }
    return isValidTitle(title) ? null : "Title must be 1-200 characters.";
  }, [title]);

  const editTitleError = useMemo(() => {
    if (editingId === null) {
      return null;
    }
    return isValidTitle(editTitle) ? null : "Title must be 1-200 characters.";
  }, [editTitle, editingId]);

  async function loadTasks() {
    setIsLoading(true);
    setError(null);
    try {
      const nextTasks = await fetchTasks();
      setTasks(nextTasks);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load tasks.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidTitle(title) || !PRIORITIES.includes(priority)) {
      setError("Please provide a valid title and priority.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createTask({
        title: title.trim(),
        description,
        priority,
        dueDate: fromDateInput(dueDate),
      });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      await loadTasks();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(toDateInputValue(task.dueDate));
  }

  function stopEditing() {
    setEditingId(null);
  }

  async function handleSaveEdit(taskId: string) {
    if (!isValidTitle(editTitle) || !PRIORITIES.includes(editPriority)) {
      setError("Please provide a valid title and priority.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await updateTask(taskId, {
        title: editTitle.trim(),
        description: editDescription.trim().length > 0 ? editDescription.trim() : null,
        priority: editPriority,
        status: editStatus,
        dueDate: fromDateInput(editDueDate),
      });
      stopEditing();
      await loadTasks();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete(task: Task) {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateTask(task.id, { status: "done" });
      await loadTasks();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Unable to complete task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(taskId: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteTask(taskId);
      await loadTasks();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSnooze(task: Task) {
    const baseDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const nextDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
    setIsSubmitting(true);
    setError(null);
    try {
      await updateTask(task.id, { dueDate: nextDate.toISOString() });
      await loadTasks();
    } catch (snoozeError) {
      setError(snoozeError instanceof Error ? snoozeError.message : "Unable to snooze task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h2>All Tasks</h2>

      <form className="task-form" onSubmit={handleCreate}>
        <h3>Create task</h3>
        <label htmlFor="new-title">Title</label>
        <input id="new-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
        {titleError ? <p className="form-error">{titleError}</p> : null}

        <label htmlFor="new-description">Description</label>
        <input id="new-description" value={description} onChange={(event) => setDescription(event.target.value)} />

        <label htmlFor="new-priority">Priority</label>
        <select id="new-priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <label htmlFor="new-dueDate">Due date (optional)</label>
        <input id="new-dueDate" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />

        <button type="submit" disabled={isSubmitting || titleError !== null}>
          {isSubmitting ? "Saving..." : "Create task"}
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}

      {isLoading ? <p>Loading tasks...</p> : null}

      {!isLoading && tasks.length === 0 ? (
        <div className="empty-state">
          <p>You do not have any tasks yet.</p>
          <p>Create your first task to get started.</p>
        </div>
      ) : null}

      <ul className="task-list">
        {tasks.map((task) => {
          const isEditing = editingId === task.id;
          return (
            <li key={task.id} className="task-item">
              {isEditing ? (
                <div className="task-edit-grid">
                  <label>
                    Title
                    <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                  </label>
                  {editTitleError ? <p className="form-error">{editTitleError}</p> : null}

                  <label>
                    Description
                    <input value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
                  </label>

                  <label>
                    Priority
                    <select
                      value={editPriority}
                      onChange={(event) => setEditPriority(event.target.value as TaskPriority)}
                    >
                      {PRIORITIES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Status
                    <select value={editStatus} onChange={(event) => setEditStatus(event.target.value as Task["status"])}>
                      <option value="todo">todo</option>
                      <option value="in_progress">in progress</option>
                      <option value="done">done</option>
                    </select>
                  </label>

                  <label>
                    Due date
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(event) => setEditDueDate(event.target.value)}
                    />
                  </label>

                  <div className="task-actions">
                    <button type="button" disabled={isSubmitting || editTitleError !== null} onClick={() => void handleSaveEdit(task.id)}>
                      Save
                    </button>
                    <button type="button" onClick={stopEditing}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="task-title">{task.title}</p>
                  <p className="task-meta">
                    status: {task.status} | priority: {task.priority} | due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "none"}
                  </p>
                  {task.description ? <p className="task-description">{task.description}</p> : null}
                  <div className="task-actions">
                    <button type="button" onClick={() => startEditing(task)}>
                      Edit
                    </button>
                    <button type="button" disabled={task.status === "done"} onClick={() => void handleComplete(task)}>
                      Complete
                    </button>
                    <button type="button" disabled={isSubmitting} onClick={() => void handleSnooze(task)}>
                      Snooze +1 day
                    </button>
                    <button type="button" disabled={isSubmitting} onClick={() => void handleDelete(task.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

