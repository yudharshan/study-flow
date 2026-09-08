import { FormEvent, useMemo, useState } from "react";
import type {
  PlannerSession,
  PlannerSessionInput,
} from "../../lib/plannerSessions";
import {
  combineDateTime,
  toLocalDateInput,
  toLocalTimeInput,
} from "../../lib/dates";
import type { Subject } from "../../lib/subjects";
import type { Task } from "../../lib/tasks";

interface PlannerSessionFormProps {
  initial?: PlannerSession;
  subjects: Subject[];
  tasks: Task[];
  defaultDate: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: PlannerSessionInput) => void;
  onCancel: () => void;
}

export default function PlannerSessionForm({
  initial,
  subjects,
  tasks,
  defaultDate,
  submitting,
  error,
  onSubmit,
  onCancel,
}: PlannerSessionFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? "");
  const [taskId, setTaskId] = useState(initial?.taskId ?? "");
  const [date, setDate] = useState(
    initial ? toLocalDateInput(initial.startTime) : defaultDate
  );
  const [startTime, setStartTime] = useState(
    initial ? toLocalTimeInput(initial.startTime) : ""
  );
  const [endTime, setEndTime] = useState(
    initial ? toLocalTimeInput(initial.endTime) : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const subjectTasks = useMemo(
    () => tasks.filter((t) => t.subjectId === subjectId),
    [tasks, subjectId]
  );

  function handleSubjectChange(value: string) {
    setSubjectId(value);
    if (taskId) {
      const selectedTask = tasks.find((t) => t.id === taskId);
      if (!selectedTask || selectedTask.subjectId !== value) {
        setTaskId("");
      }
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!subjectId) {
      setFormError("Please select a subject");
      return;
    }
    if (!date) {
      setFormError("Date is required");
      return;
    }
    if (!startTime) {
      setFormError("Start time is required");
      return;
    }
    if (!endTime) {
      setFormError("End time is required");
      return;
    }
    if (endTime <= startTime) {
      setFormError("End time must be after start time");
      return;
    }
    setFormError(null);

    onSubmit({
      title: title.trim(),
      subjectId,
      taskId: taskId || null,
      startTime: combineDateTime(date, startTime),
      endTime: combineDateTime(date, endTime),
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {(error || formError) && (
        <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">
          {error ?? formError}
        </div>
      )}

      <div>
        <label
          htmlFor="planner-title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title
        </label>
        <input
          id="planner-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g. Review Chemistry notes"
        />
      </div>

      <div>
        <label
          htmlFor="planner-subject"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Subject
        </label>
        <select
          id="planner-subject"
          value={subjectId}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">Select a subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        {subjects.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">
            Add a subject first before planning sessions.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="planner-task"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Linked Task
        </label>
        <select
          id="planner-task"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          disabled={!subjectId}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">No task</option>
          {subjectTasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
          {subjectId && subjectTasks.length === 0 && (
            <option value="" disabled>
              No tasks for this subject
            </option>
          )}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="planner-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date
          </label>
          <input
            id="planner-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="planner-start-time"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Time
          </label>
          <input
            id="planner-start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="planner-end-time"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Time
          </label>
          <input
            id="planner-end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="planner-notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="planner-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          placeholder="Optional notes for this session"
        />
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
          {submitting ? "Saving..." : initial ? "Save Changes" : "Add Session"}
        </button>
      </div>
    </form>
  );
}