import { FormEvent, useState } from "react";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "../../lib/tasks";
import type { Subject } from "../../lib/subjects";

interface TaskFormProps {
  initial?: Task;
  subjects: Subject[];
  submitting: boolean;
  error: string | null;
  onSubmit: (input: TaskInput) => void;
  onCancel: () => void;
}

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export default function TaskForm({
  initial,
  subjects,
  submitting,
  error,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? "");
  const [dueDate, setDueDate] = useState(() => toDateInputValue(initial?.dueDate ?? null));
  const [priority, setPriority] = useState<TaskPriority>(
    initial?.priority ?? "MEDIUM"
  );
  const [status, setStatus] = useState<TaskStatus>(
    initial?.status ?? "TODO"
  );
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setFormError("Task title is required");
      return;
    }
    if (!subjectId) {
      setFormError("Please select a subject");
      return;
    }
    setFormError(null);

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      subjectId,
      dueDate: dueDate || null,
      priority,
      status,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}
      {formError && (
        <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">
          {formError}
        </div>
      )}

      <div>
        <label
          htmlFor="task-title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g. Prepare for midterms"
        />
      </div>

      <div>
        <label
          htmlFor="task-description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          placeholder="Optional notes"
        />
      </div>

      <div>
        <label
          htmlFor="task-subject"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Subject
        </label>
        <select
          id="task-subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">Select a subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="task-due-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Due Date
          </label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="task-priority"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="task-status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
        >
          {submitting ? "Saving..." : initial ? "Save Changes" : "Add Task"}
        </button>
      </div>
    </form>
  );
}