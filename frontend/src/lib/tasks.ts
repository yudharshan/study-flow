import { apiRequest } from "./api";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

export const TASK_PRIORITIES: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export const TASK_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
  "OVERDUE",
];

export interface TaskSubject {
  id: string;
  name: string;
  color: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  subject?: TaskSubject | null;
}

export interface TaskInput {
  title: string;
  description?: string;
  subjectId: string;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface TaskFilters {
  subjectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface TaskListResponse {
  tasks: Task[];
}

export interface TaskResponse {
  task: Task;
}

function buildQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();
  if (filters.subjectId && filters.subjectId !== "all") {
    params.set("subjectId", filters.subjectId);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.priority) {
    params.set("priority", filters.priority);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function fetchTasks(filters: TaskFilters = {}): Promise<TaskListResponse> {
  return apiRequest<TaskListResponse>(`/tasks${buildQuery(filters)}`, {
    method: "GET",
  });
}

export function createTask(input: TaskInput): Promise<TaskResponse> {
  return apiRequest<TaskResponse>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTask(
  id: string,
  input: Partial<TaskInput>
): Promise<TaskResponse> {
  return apiRequest<TaskResponse>(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/tasks/${id}`, { method: "DELETE" });
}