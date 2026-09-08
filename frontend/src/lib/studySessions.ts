import { apiRequest } from "./api";

export type StudySessionType = "POMODORO" | "CUSTOM" | "FOCUS";

export const STUDY_SESSION_TYPES: StudySessionType[] = [
  "POMODORO",
  "CUSTOM",
  "FOCUS",
];

export interface StudySessionSubject {
  id: string;
  name: string;
  color: string | null;
}

export interface StudySessionTask {
  id: string;
  title: string;
  status: string;
}

export interface StudySession {
  id: string;
  subjectId: string | null;
  taskId: string | null;
  type: StudySessionType;
  duration: number;
  startedAt: string;
  endedAt: string | null;
  completed: boolean;
  createdAt: string;
  subject?: StudySessionSubject | null;
  task?: StudySessionTask | null;
}

export interface StudySessionInput {
  subjectId: string;
  taskId?: string | null;
  type: StudySessionType;
  duration: number;
  startedAt: string;
  endedAt: string;
}

export interface StudySessionFilters {
  subjectId?: string;
  taskId?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface StudySessionListResponse {
  sessions: StudySession[];
}

export interface StudySessionResponse {
  session: StudySession;
}

function buildQuery(filters: StudySessionFilters): string {
  const params = new URLSearchParams();
  if (filters.subjectId) {
    params.set("subjectId", filters.subjectId);
  }
  if (filters.taskId) {
    params.set("taskId", filters.taskId);
  }
  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }
  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function fetchStudySessions(
  filters: StudySessionFilters = {}
): Promise<StudySessionListResponse> {
  return apiRequest<StudySessionListResponse>(
    `/study-sessions${buildQuery(filters)}`,
    { method: "GET" }
  );
}

export function createStudySession(
  input: StudySessionInput
): Promise<StudySessionResponse> {
  return apiRequest<StudySessionResponse>("/study-sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteStudySession(id: string): Promise<void> {
  return apiRequest<void>(`/study-sessions/${id}`, { method: "DELETE" });
}