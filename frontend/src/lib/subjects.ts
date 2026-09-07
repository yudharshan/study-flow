import { apiRequest } from "./api";

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

export interface SubjectInput {
  name: string;
  description?: string;
  color?: string;
}

export interface SubjectListResponse {
  subjects: Subject[];
}

export interface SubjectResponse {
  subject: Subject;
}

export function fetchSubjects(): Promise<SubjectListResponse> {
  return apiRequest<SubjectListResponse>("/subjects", { method: "GET" });
}

export function createSubject(input: SubjectInput): Promise<SubjectResponse> {
  return apiRequest<SubjectResponse>("/subjects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateSubject(
  id: string,
  input: SubjectInput
): Promise<SubjectResponse> {
  return apiRequest<SubjectResponse>(`/subjects/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteSubject(id: string): Promise<void> {
  return apiRequest<void>(`/subjects/${id}`, { method: "DELETE" });
}