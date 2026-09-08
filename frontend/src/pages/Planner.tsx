import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPlannerSession,
  deletePlannerSession,
  fetchPlannerSessions,
  updatePlannerSession,
  type PlannerSession,
  type PlannerSessionInput,
} from "../lib/plannerSessions";
import { fetchSubjects, type Subject } from "../lib/subjects";
import { fetchTasks, type Task } from "../lib/tasks";
import {
  addDays,
  dayBounds,
  formatDuration,
  formatTime,
  toLocalDateKey,
  weekBounds,
  weekDays,
} from "../lib/dates";
import { backgroundColor, textOnColor } from "../lib/colors";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import PlannerSessionForm from "../components/planner/PlannerSessionForm";

type ViewMode = "day" | "week";

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatWeekLabel(date: Date): string {
  const days = weekDays(date);
  const start = days[0] as Date;
  const end = days[6] as Date;
  const startLabel = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

export default function Planner() {
  const [sessions, setSessions] = useState<PlannerSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlannerSession | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState<PlannerSession | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [flash, setFlash] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await fetchSubjects();
      setSubjects(data.subjects);
    } catch {
      // Subject/task dropdowns degrade gracefully if the load fails.
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(data.tasks);
    } catch {
      // Task dropdown degrades gracefully if the load fails.
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const bounds =
        view === "day"
          ? dayBounds(toLocalDateKey(currentDate))
          : weekBounds(currentDate);
      const data = await fetchPlannerSessions(bounds);
      setSessions(data.sessions);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load planner sessions");
    } finally {
      setLoading(false);
    }
  }, [view, currentDate]);

  useEffect(() => {
    loadSubjects();
    loadTasks();
  }, [loadSubjects, loadTasks]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  function openAdd() {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(session: PlannerSession) {
    setEditing(session);
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(input: PlannerSessionInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await updatePlannerSession(editing.id, input);
        setFlash("Study session updated");
      } else {
        await createPlannerSession(input);
        setFlash("Study session added");
      }
      closeForm();
      await loadSessions();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deletePlannerSession(deleting.id);
      setFlash("Study session deleted");
      setDeleting(null);
      await loadSessions();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete session");
    } finally {
      setDeleteBusy(false);
    }
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  function goPrevious() {
    setCurrentDate((d) => addDays(d, view === "day" ? -1 : -7));
  }

  function goNext() {
    setCurrentDate((d) => addDays(d, view === "day" ? 1 : 7));
  }

  function jumpToDay(session: PlannerSession) {
    setView("day");
    setCurrentDate(new Date(session.startTime));
  }

  const todayKey = toLocalDateKey(new Date());
  const currentKey = toLocalDateKey(currentDate);
  const isToday = todayKey === currentKey;

  const sessionsByDay = useMemo(() => {
    const map: Record<string, PlannerSession[]> = {};
    for (const session of sessions) {
      const key = toLocalDateKey(new Date(session.startTime));
      (map[key] ??= []).push(session);
    }
    return map;
  }, [sessions]);

  const week = view === "week" ? weekDays(currentDate) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Planner</h1>
          <p className="text-gray-500 mt-1">
            Plan your study sessions day by day.
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={subjects.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add Study Session
        </button>
      </div>

      {flash && (
        <div className="p-3 rounded-lg bg-emerald-50 text-sm text-emerald-700 border border-emerald-200">
          {flash}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrevious}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            aria-label="Previous"
          >
            <Icon name="chevron-left" className="h-4 w-4" />
          </button>
          <button
            onClick={goNext}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            aria-label="Next"
          >
            <Icon name="chevron-right" className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["day", "week"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === mode
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {mode === "day" ? "Day" : "Week"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm font-medium text-gray-700">
          {view === "day" ? formatDayLabel(currentDate) : formatWeekLabel(currentDate)}
          {view === "day" && isToday && (
            <span className="ml-2 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
              Today
            </span>
          )}
        </p>
      </div>

      {subjects.length === 0 && !loading && !loadError && (
        <div className="p-3 rounded-lg bg-amber-50 text-sm text-amber-700 border border-amber-200">
          Add a subject before planning study sessions.
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading planner...</p>
      ) : loadError ? (
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700">
          <p className="font-medium mb-3">{loadError}</p>
          <button
            onClick={loadSessions}
            className="rounded-lg bg-red-100 text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
            <Icon name="planner" className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No study sessions planned
          </h2>
          <p className="text-gray-500 mt-1 mb-6">
            {view === "day"
              ? "Plan a session for this day to stay on track."
              : "Plan a session for this week to stay on track."}
          </p>
          <button
            onClick={openAdd}
            disabled={subjects.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add Study Session
          </button>
        </div>
      ) : view === "day" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onEdit={() => openEdit(session)}
              onDelete={() => setDeleting(session)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[980px] grid grid-cols-7 gap-px bg-gray-200 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {week.map((day) => {
              const key = toLocalDateKey(day);
              const daySessions = sessionsByDay[key] ?? [];
              return (
                <div key={key} className="bg-white min-h-[320px] flex flex-col">
                  <div className="px-3 pt-3 pb-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {day.toLocaleDateString(undefined, { weekday: "short" })}
                    </p>
                    <p
                      className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        todayKey === key
                          ? "bg-primary-600 text-white"
                          : "text-gray-900"
                      }`}
                    >
                      {day.getDate()}
                    </p>
                  </div>
                  <div className="p-2 space-y-1.5 flex-1">
                    {daySessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => jumpToDay(session)}
                        className="w-full text-left rounded-lg border p-2 hover:bg-gray-50 transition-colors"
                        style={{
                          borderLeftWidth: 3,
                          borderLeftColor:
                            session.subject?.color ?? "#e2e8f0",
                        }}
                        title={session.title}
                      >
                        <p className="text-[11px] font-medium text-gray-500">
                          {formatTime(session.startTime)}
                        </p>
                        <p className="text-xs font-medium text-gray-900 truncate mt-0.5">
                          {session.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {formOpen && (
        <Modal
          title={editing ? "Edit Study Session" : "Add Study Session"}
          onClose={closeForm}
        >
          <PlannerSessionForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            subjects={subjects}
            tasks={tasks}
            defaultDate={toLocalDateKey(currentDate)}
            submitting={submitting}
            error={formError}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete Study Session" onClose={() => setDeleting(null)}>
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

function SessionCard({
  session,
  onEdit,
  onDelete,
}: {
  session: PlannerSession;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = session.subject?.color ?? null;

  return (
    <div className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={backgroundColor(color)}
          />
          <p className="text-sm font-medium text-gray-900 truncate">
            {session.title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${textOnColor(color)}`}
            style={backgroundColor(color)}
          >
            {session.subject?.name ?? "No subject"}
          </span>
          {session.task && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              <Icon name="tasks" className="h-3 w-3" />
              {session.task.title}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Icon name="calendar" className="h-3.5 w-3.5" />
            {formatTime(session.startTime)} – {formatTime(session.endTime)}
            <span className="text-gray-400">·</span>
            {formatDuration(session.startTime, session.endTime)}
          </span>
        </div>
        {session.notes && (
          <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">
            {session.notes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 sm:shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Edit session"
        >
          <Icon name="edit" className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label="Delete session"
        >
          <Icon name="trash" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}