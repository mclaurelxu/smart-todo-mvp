const AUTH_TOKEN_KEY = "smart_todo_auth_token";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type TaskEffort = "low" | "medium" | "high";

export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  effort: TaskEffort;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

function getToken(): string {
  const token = window.sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    throw new Error("You are not logged in.");
  }
  return token;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json()) as ApiErrorPayload;
    throw new Error(payload.error?.message ?? "Request failed.");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function authorizedFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken();
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function fetchTasks(): Promise<Task[]> {
  const response = await authorizedFetch("/tasks");
  const payload = await parseResponse<{ tasks: Task[] }>(response);
  return payload.tasks;
}

export async function fetchTodayTasks(): Promise<Array<Task & { smartScore: number }>> {
  const response = await authorizedFetch("/tasks/today");
  const payload = await parseResponse<{ tasks: Array<Task & { smartScore: number }> }>(response);
  return payload.tasks;
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority: TaskPriority;
  effort?: TaskEffort;
  dueDate?: string | null;
}): Promise<Task> {
  const response = await authorizedFetch("/tasks", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      description: input.description && input.description.trim().length > 0 ? input.description : null,
      priority: input.priority,
      effort: input.effort ?? "medium",
      dueDate: input.dueDate ?? null,
    }),
  });
  const payload = await parseResponse<{ task: Task }>(response);
  return payload.task;
}

export async function updateTask(
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    effort: TaskEffort;
    dueDate: string | null;
  }>,
): Promise<Task> {
  const response = await authorizedFetch(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const payload = await parseResponse<{ task: Task }>(response);
  return payload.task;
}

export async function deleteTask(id: string): Promise<void> {
  const response = await authorizedFetch(`/tasks/${id}`, { method: "DELETE" });
  await parseResponse<void>(response);
}

