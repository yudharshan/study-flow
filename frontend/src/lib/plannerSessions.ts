import { apiRequest } from "./api";

export interface PlannerSession {
  id: string;
  userId: string;
  subjectId: string | null;
  taskId: string | null;
  title: string;
  notes: string | null;
  startTime: string;
  endTime: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  task?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

export interface PlannerSessionInput {
  title: string;
  subjectId: string;
  taskId?: string | null;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface PlannerSessionFilters {
  startDate?: string | null;
  endDate?: string | null;
}

export interface PlannerSessionListResponse {
  sessions: PlannerSession[];
}

export interface PlannerSessionResponse {
  session: PlannerSession;
}

function buildQuery(filters: PlannerSessionFilters): string {
  const params = new URLSearchParams();
  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }
  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function fetchPlannerSessions(
  filters: PlannerSessionFilters = {}
): Promise<PlannerSessionListResponse> {
  return apiRequest<PlannerSessionListResponse>(
    `/planner${buildQuery(filters)}`,
    { method: "GET" }
  );
}

export function createPlannerSession(
  input: PlannerSessionInput
): Promise<PlannerSessionResponse> {
  return apiRequest<PlannerSessionResponse>("/planner", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePlannerSession(
  id: string,
  input: Partial<PlannerSessionInput>
): Promise<PlannerSessionResponse> {
  return apiRequest<PlannerSessionResponse>(`/planner/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deletePlannerSession(id: string): Promise<void> {
  return apiRequest<void>(`/planner/${id}`, { method: "DELETE" });
}