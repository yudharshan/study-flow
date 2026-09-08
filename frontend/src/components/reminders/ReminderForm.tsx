import { FormEvent, useState } from "react";
import type {
  Reminder,
  ReminderInput,
} from "../../lib/reminders";
import {
  combineDateTime,
  toLocalDateInput,
  toLocalTimeInput,
} from "../../lib/dates";
import type { Task } from "../../lib/tasks";

interface ReminderFormProps {
  initial?: Reminder;
  tasks: Task[];
  defaultDate: string;
  defaultTime: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: ReminderInput) => void;
  onCancel: () => void;
}

export default function ReminderForm({
  initial,
  tasks,
  defaultDate,
  defaultTime,
  submitting,
  error,
  onSubmit,
  onCancel,
}: ReminderFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [message, setMessage] = useState(initial?.message ?? "");
  const [taskId, setTaskId] = useState(initial?.taskId ?? "");
  const [date, setDate] = useState(
    initial ? toLocalDateInput(initial.reminderTime) : defaultDate
  );
  const [time, setTime] = useState(
    initial ? toLocalTimeInput(initial.reminderTime) : defaultTime
  );
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!date) {
      setFormError("Date is required");
      return;
    }
    if (!time) {
      setFormError("Time is required");
      return;
    }
    setFormError(null);

    onSubmit({
      title: title.trim(),
      message: message.trim() || undefined,
      taskId: taskId || null,
      reminderTime: combineDateTime(date, time),
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
          htmlFor="reminder-title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title
        </label>
        <input
          id="reminder-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g. Submit Physics homework"
        />
      </div>

      <div>
        <label
          htmlFor="reminder-message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="reminder-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          placeholder="Optional notes"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="reminder-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date
          </label>
          <input
            id="reminder-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="reminder-time"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Time
          </label>
          <input
            id="reminder-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="reminder-task"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Linked Task
        </label>
        <select
          id="reminder-task"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">No task</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
        {tasks.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">
            You have no tasks yet. You can still set a reminder without one.
          </p>
        )}
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
          {submitting ? "Saving..." : initial ? "Save Changes" : "Add Reminder"}
        </button>
      </div>
    </form>
  );
}