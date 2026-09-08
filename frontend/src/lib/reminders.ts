import { apiRequest } from "./api";

export interface Reminder {
  id: string;
  userId: string;
  taskId: string | null;
  title: string;
  message: string | null;
  reminderTime: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  task?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

export interface ReminderInput {
  title: string;
  message?: string;
  reminderTime: string;
  taskId?: string | null;
  isCompleted?: boolean;
}

export interface ReminderFilters {
  upcoming?: boolean;
  completed?: boolean;
  pending?: boolean;
}

export interface ReminderListResponse {
  reminders: Reminder[];
}

export interface ReminderResponse {
  reminder: Reminder;
}

function buildQuery(filters: ReminderFilters): string {
  const params = new URLSearchParams();
  if (filters.upcoming) {
    params.set("upcoming", "true");
  }
  if (filters.completed) {
    params.set("completed", "true");
  }
  if (filters.pending) {
    params.set("pending", "true");
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function getReminders(
  filters: ReminderFilters = {}
): Promise<ReminderListResponse> {
  return apiRequest<ReminderListResponse>(
    `/reminders${buildQuery(filters)}`,
    { method: "GET" }
  );
}

export function createReminder(
  input: ReminderInput
): Promise<ReminderResponse> {
  return apiRequest<ReminderResponse>("/reminders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateReminder(
  id: string,
  input: Partial<ReminderInput>
): Promise<ReminderResponse> {
  return apiRequest<ReminderResponse>(`/reminders/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteReminder(id: string): Promise<void> {
  return apiRequest<void>(`/reminders/${id}`, { method: "DELETE" });
}

export function completeReminder(
  id: string,
  isCompleted: boolean
): Promise<ReminderResponse> {
  return updateReminder(id, { isCompleted });
}