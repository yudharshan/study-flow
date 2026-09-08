import { useCallback, useEffect, useState } from "react";
import {
  completeReminder,
  createReminder,
  deleteReminder,
  getReminders,
  updateReminder,
  type Reminder,
  type ReminderInput,
} from "../lib/reminders";
import { fetchTasks, type Task } from "../lib/tasks";
import { formatTime, toLocalDateInput } from "../lib/dates";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import ReminderForm from "../components/reminders/ReminderForm";

type Filter = "all" | "upcoming" | "pending" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
];

function defaultTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatReminderDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function filterQuery(filter: Filter): Record<string, boolean> {
  if (filter === "upcoming") return { upcoming: true };
  if (filter === "pending") return { pending: true };
  if (filter === "completed") return { completed: true };
  return {};
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState<Reminder | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [flash, setFlash] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(data.tasks);
    } catch {
      // Task dropdown degrades gracefully if the load fails.
    }
  }, []);

  const loadReminders = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const data = await getReminders(filterQuery(filter));
      setReminders(data.reminders);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load reminders");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  function openAdd() {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(reminder: Reminder) {
    setEditing(reminder);
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(input: ReminderInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await updateReminder(editing.id, input);
        setFlash("Reminder updated");
      } else {
        await createReminder(input);
        setFlash("Reminder added");
      }
      closeForm();
      await loadReminders();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleComplete(reminder: Reminder) {
    try {
      await completeReminder(reminder.id, !reminder.isCompleted);
      setFlash(reminder.isCompleted ? "Reminder marked pending" : "Reminder completed");
      await loadReminders();
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Unable to update reminder");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteReminder(deleting.id);
      setFlash("Reminder deleted");
      setDeleting(null);
      await loadReminders();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete reminder");
    } finally {
      setDeleteBusy(false);
    }
  }

  const pendingCount = reminders.filter((r) => !r.isCompleted).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-500 mt-1">
            Set reminders for tasks and keep your study schedule on track.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition-colors"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add Reminder
        </button>
      </div>

      {flash && (
        <div className="p-3 rounded-lg bg-emerald-50 text-sm text-emerald-700 border border-emerald-200">
          {flash}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === item.key
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {item.label}
            {item.key === "pending" && pendingCount > 0 && (
              <span
                className={`ml-1.5 inline-flex items-center rounded-full px-1.5 text-xs ${
                  filter === item.key
                    ? "bg-white/20 text-white"
                    : "bg-primary-100 text-primary-700"
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading reminders...</p>
      ) : loadError ? (
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700">
          <p className="font-medium mb-3">{loadError}</p>
          <button
            onClick={loadReminders}
            className="rounded-lg bg-red-100 text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : reminders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
            <Icon name="reminders" className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {filter === "all" && "No reminders yet"}
            {filter === "upcoming" && "No upcoming reminders"}
            {filter === "pending" && "No pending reminders"}
            {filter === "completed" && "No completed reminders"}
          </h2>
          <p className="text-gray-500 mt-1 mb-6">
            {filter === "all"
              ? "Add a reminder to never miss an important study task."
              : "Try a different filter or add a new reminder."}
          </p>
          {filter === "all" && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition-colors"
            >
              <Icon name="plus" className="h-4 w-4" />
              Add Reminder
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={() => openEdit(reminder)}
              onDelete={() => setDeleting(reminder)}
              onToggleComplete={() => handleToggleComplete(reminder)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <Modal
          title={editing ? "Edit Reminder" : "Add Reminder"}
          onClose={closeForm}
        >
          <ReminderForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            tasks={tasks}
            defaultDate={toLocalDateInput(new Date().toISOString())}
            defaultTime={defaultTime()}
            submitting={submitting}
            error={formError}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete Reminder" onClose={() => setDeleting(null)}>
          <p className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-900">{deleting.title}</span>?
            This action cannot be undone.
          </p>
          {deleteError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-5">
            <button
              onClick={() => setDeleting(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteBusy}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {deleteBusy ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReminderCard({
  reminder,
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  reminder: Reminder;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}) {
  const time = new Date(reminder.reminderTime);
  const isPast = time.getTime() < Date.now();

  return (
    <div className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleComplete}
            aria-label={reminder.isCompleted ? "Mark as pending" : "Mark as complete"}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
              reminder.isCompleted
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-gray-300 text-transparent hover:border-primary-500 hover:text-primary-500"
            }`}
          >
            <Icon name="check" className="h-3 w-3" />
          </button>
          <p
            className={`text-sm font-medium truncate ${
              reminder.isCompleted ? "text-gray-400 line-through" : "text-gray-900"
            }`}
          >
            {reminder.title}
          </p>
          <span
            className={`shrink-0 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
              reminder.isCompleted
                ? "bg-gray-100 text-gray-500"
                : isPast
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {reminder.isCompleted ? "Completed" : isPast ? "Past" : "Pending"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-1.5 pl-7">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Icon name="calendar" className="h-3.5 w-3.5" />
            {formatReminderDate(reminder.reminderTime)} at {formatTime(reminder.reminderTime)}
          </span>
          {reminder.task && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
              <Icon name="tasks" className="h-3 w-3" />
              {reminder.task.title}
            </span>
          )}
        </div>

        {reminder.message && (
          <p className="text-sm text-gray-600 mt-1.5 pl-7 line-clamp-2">
            {reminder.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 sm:shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Edit reminder"
        >
          <Icon name="edit" className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label="Delete reminder"
        >
          <Icon name="trash" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}