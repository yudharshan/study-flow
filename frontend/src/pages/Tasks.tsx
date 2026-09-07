import { useCallback, useEffect, useState } from "react";
import {
  TASK_STATUSES,
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "../lib/tasks";
import { fetchSubjects, type Subject } from "../lib/subjects";
import { backgroundColor } from "../lib/colors";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import TaskForm from "../components/tasks/TaskForm";

const STATUS_FILTERS: { value: TaskStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "OVERDUE", label: "Overdue" },
];

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

const statusStyles: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
};

function formatDueDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [flash, setFlash] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await fetchSubjects();
      setSubjects(data.subjects);
    } catch {
      // Subject dropdown degrades to "no subjects available" if the load fails.
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await fetchTasks({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        subjectId: subjectFilter,
      });
      setTasks(data.tasks);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, subjectFilter]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function openAdd() {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(input: TaskInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await updateTask(editing.id, input);
        setFlash("Task updated");
      } else {
        await createTask(input);
        setFlash("Task added");
      }
      closeForm();
      await loadTasks();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangeStatus(task: Task, status: TaskStatus) {
    setLoading(true);
    try {
      await updateTask(task.id, { status });
      await loadTasks();
    } catch {
      setFlash("Could not update task status");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteTask(deleting.id);
      setFlash("Task deleted");
      setDeleting(null);
      await loadTasks();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete task");
    } finally {
      setDeleteBusy(false);
    }
  }

  const hasActiveFilter = statusFilter !== "ALL" || subjectFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">
            Track assignments and deadlines.
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={subjects.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {flash && (
        <div className="p-3 rounded-lg bg-emerald-50 text-sm text-emerald-700 border border-emerald-200">
          {flash}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading tasks...</p>
      ) : loadError ? (
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700">
          <p className="font-medium mb-3">{loadError}</p>
          <button
            onClick={loadTasks}
            className="rounded-lg bg-red-100 text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
            <Icon name="tasks" className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {hasActiveFilter ? "No tasks match your filters" : "No tasks yet"}
          </h2>
          <p className="text-gray-500 mt-1 mb-6">
            {hasActiveFilter
              ? "Try adjusting your filters."
              : "Add your first task to get started."}
          </p>
          {!hasActiveFilter && (
            <button
              onClick={openAdd}
              disabled={subjects.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Icon name="plus" className="h-4 w-4" />
              Add Task
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={() => openEdit(task)}
              onDelete={() => setDeleting(task)}
              onChangeStatus={(status) => handleChangeStatus(task, status)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <Modal
          title={editing ? "Edit Task" : "Add Task"}
          onClose={closeForm}
        >
          <TaskForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            subjects={subjects}
            submitting={submitting}
            error={formError}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete Task" onClose={() => setDeleting(null)}>
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

function TaskRow({
  task,
  onEdit,
  onDelete,
  onChangeStatus,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (status: TaskStatus) => void;
}) {
  const dueDate = formatDueDate(task.dueDate);
  const subjectName = task.subject?.name ?? "No subject";
  const subjectDot = task.subject?.color ? backgroundColor(task.subject.color) : undefined;

  return (
    <div className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={subjectDot}
          />
          <p className="text-sm font-medium text-gray-900 truncate">
            {task.title}
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-1">{subjectName}</p>
        {task.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
        {dueDate && (
          <p className="text-xs text-gray-400 mt-1">Due {dueDate}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <span
          className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}
        >
          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
        </span>
        <select
          value={task.status}
          onChange={(e) => onChangeStatus(e.target.value as TaskStatus)}
          className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statusStyles[task.status]}`}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Edit task"
          >
            <Icon name="edit" className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Delete task"
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}