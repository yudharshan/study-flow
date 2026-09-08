import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  STUDY_SESSION_TYPES,
  createStudySession,
  deleteStudySession,
  fetchStudySessions,
  type StudySession,
  type StudySessionType,
} from "../lib/studySessions";
import { fetchSubjects, type Subject } from "../lib/subjects";
import { fetchTasks, type Task } from "../lib/tasks";
import {
  dayBounds,
  formatMinutes,
  formatTime,
  toLocalDateKey,
} from "../lib/dates";
import { backgroundColor, textOnColor } from "../lib/colors";
import Icon from "../components/Icon";
import Modal from "../components/Modal";

type TimerStatus = "idle" | "running" | "paused" | "completed";

const MODE_LABELS: Record<StudySessionType, string> = {
  POMODORO: "Pomodoro",
  CUSTOM: "Custom",
  FOCUS: "Focus",
};

const MODE_DEFAULTS: Record<StudySessionType, number> = {
  POMODORO: 25,
  CUSTOM: 30,
  FOCUS: 50,
};

const MODE_DESCRIPTIONS: Record<StudySessionType, string> = {
  POMODORO: "25 minute sprint",
  CUSTOM: "Your own duration",
  FOCUS: "Longer focus block",
};

const TYPE_STYLES: Record<StudySessionType, string> = {
  POMODORO: "bg-blue-100 text-blue-700",
  CUSTOM: "bg-violet-100 text-violet-700",
  FOCUS: "bg-emerald-100 text-emerald-700",
};

function modeDurationSeconds(mode: StudySessionType, customMinutes: number): number {
  return (mode === "CUSTOM" ? customMinutes : MODE_DEFAULTS[mode]) * 60;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function Timer() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<StudySessionType>("POMODORO");
  const [subjectId, setSubjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [customMinutes, setCustomMinutes] = useState(30);

  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remainingMs, setRemainingMs] = useState(
    () => modeDurationSeconds("POMODORO", 30) * 1000
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<StudySession | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const deadlineAtRef = useRef(0);
  const remainingMsRef = useRef(modeDurationSeconds("POMODORO", 30) * 1000);
  const startedAtRef = useRef(0);
  const totalMsRef = useRef(modeDurationSeconds("POMODORO", 30) * 1000);
  const completionSavedRef = useRef(false);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await fetchSubjects();
      setSubjects(data.subjects);
    } catch {
      // Subject dropdown degrades gracefully if the load fails.
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
      const bounds = dayBounds(toLocalDateKey(new Date()));
      const data = await fetchStudySessions(bounds);
      setSessions(data.sessions);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load study sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
    loadTasks();
    loadSessions();
  }, [loadSubjects, loadTasks, loadSessions]);

  const saveSession = useCallback(
    async (durationMinutes: number, endedAtIso: string) => {
      if (completionSavedRef.current) return;
      if (!subjectId) {
        setSaveError("Select a subject before saving the session");
        return;
      }
      completionSavedRef.current = true;
      setSaving(true);
      setSaveError(null);
      try {
        await createStudySession({
          subjectId,
          taskId: taskId || null,
          type: mode,
          duration: durationMinutes,
          startedAt: new Date(startedAtRef.current).toISOString(),
          endedAt: endedAtIso,
        });
        await loadSessions();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save session");
        completionSavedRef.current = false;
      } finally {
        setSaving(false);
      }
    },
    [subjectId, taskId, mode, loadSessions]
  );

  const completeAndSave = useCallback(() => {
    const endedAt = new Date(deadlineAtRef.current).toISOString();
    const duration = Math.max(1, Math.round(totalMsRef.current / 60000));
    void saveSession(duration, endedAt);
  }, [saveSession]);

  const finishAndSave = useCallback(() => {
    const elapsedMs = totalMsRef.current - Math.max(0, remainingMsRef.current);
    const duration = Math.max(1, Math.round(elapsedMs / 60000));
    remainingMsRef.current = 0;
    setRemainingMs(0);
    setStatus("completed");
    void saveSession(duration, new Date().toISOString());
  }, [saveSession]);

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      const rem = deadlineAtRef.current - Date.now();
      if (rem <= 0) {
        window.clearInterval(id);
        remainingMsRef.current = 0;
        setRemainingMs(0);
        setStatus("completed");
        completeAndSave();
      } else {
        remainingMsRef.current = rem;
        setRemainingMs(rem);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [status, completeAndSave]);

  function applyModeDuration(nextMode: StudySessionType) {
    const secs = modeDurationSeconds(nextMode, customMinutes) * 1000;
    remainingMsRef.current = secs;
    setRemainingMs(secs);
  }

  function selectMode(nextMode: StudySessionType) {
    if (status === "running" || status === "paused") return;
    setMode(nextMode);
    completionSavedRef.current = false;
    setSaveError(null);
    applyModeDuration(nextMode);
    setStatus("idle");
  }

  function handleCustomMinutesChange(value: string) {
    const parsed = Number(value);
    const m = Number.isFinite(parsed) ? Math.min(240, Math.max(1, Math.round(parsed))) : 1;
    setCustomMinutes(m);
    if (status === "idle") {
      remainingMsRef.current = m * 60000;
      setRemainingMs(remainingMsRef.current);
    }
  }

  function handleSubjectChange(value: string) {
    setSubjectId(value);
    if (taskId) {
      const selected = tasks.find((t) => t.id === taskId);
      if (!selected || selected.subjectId !== value) {
        setTaskId("");
      }
    }
  }

  function start() {
    if (status === "running") return;
    if (!subjectId) {
      setSaveError("Select a subject before starting the timer");
      return;
    }
    if (status === "paused") {
      deadlineAtRef.current = Date.now() + remainingMsRef.current;
      setStatus("running");
      return;
    }
    if (status === "completed") return;
    if (remainingMsRef.current <= 0) return;
    startedAtRef.current = Date.now();
    totalMsRef.current = remainingMsRef.current;
    deadlineAtRef.current = Date.now() + remainingMsRef.current;
    setStatus("running");
  }

  function pause() {
    if (status !== "running") return;
    remainingMsRef.current = Math.max(0, deadlineAtRef.current - Date.now());
    setRemainingMs(remainingMsRef.current);
    setStatus("paused");
  }

  function reset() {
    completionSavedRef.current = false;
    setSaveError(null);
    applyModeDuration(mode);
    setStatus("idle");
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteStudySession(deleting.id);
      setFlash("Study session deleted");
      setDeleting(null);
      await loadSessions();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete session");
    } finally {
      setDeleteBusy(false);
    }
  }

  const subjectTasks = useMemo(
    () => tasks.filter((t) => t.subjectId === subjectId),
    [tasks, subjectId]
  );

  const selectedSubject = subjects.find((s) => s.id === subjectId) ?? null;
  const subjectColor = selectedSubject?.color ?? null;

  const totalPlannedMs = modeDurationSeconds(mode, customMinutes) * 1000;
  const elapsedFraction =
    totalPlannedMs > 0
      ? Math.min(1, Math.max(0, (totalPlannedMs - remainingMs) / totalPlannedMs))
      : 0;
  const progressPercent = Math.round(elapsedFraction * 100);
  const ringColor = subjectColor ?? "#2563eb";

  const todayTotal = sessions.reduce((sum, s) => sum + s.duration, 0);
  const todayCount = sessions.length;
  const currentSessionMinutes = modeDurationSeconds(mode, customMinutes) / 60;

  const controlsDisabled = saving;
  const locked = status === "running" || status === "paused";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Timer</h1>
          <p className="text-gray-500 mt-1">
            Focus sessions and Pomodoro timer.
          </p>
        </div>
      </div>

      {flash && (
        <div className="p-3 rounded-lg bg-emerald-50 text-sm text-emerald-700 border border-emerald-200">
          {flash}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-wrap gap-2">
            {STUDY_SESSION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => selectMode(t)}
                disabled={locked}
                title={MODE_DESCRIPTIONS[t]}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  mode === t
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {MODE_LABELS[t]}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {MODE_DESCRIPTIONS[mode]}
          </p>

          {mode === "CUSTOM" && (
            <div className="mt-4 max-w-[180px]">
              <label
                htmlFor="timer-custom-minutes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Duration (minutes)
              </label>
              <input
                id="timer-custom-minutes"
                type="number"
                min={1}
                max={240}
                value={customMinutes}
                disabled={locked}
                onChange={(e) => handleCustomMinutesChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="timer-subject"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Subject
              </label>
              <div className="relative">
                <select
                  id="timer-subject"
                  value={subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={locked}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              {subjects.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Add a subject first to start studying.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="timer-task"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Task <span className="text-gray-400">(optional)</span>
              </label>
              <select
                id="timer-task"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                disabled={locked || !subjectId}
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
          </div>

          <div className="mt-8 flex flex-col items-center">
            <div
              className="relative h-60 w-60 rounded-full flex items-center justify-center transition-[background] duration-300"
              style={{
                background: `conic-gradient(${ringColor} ${progressPercent}%, #e5e7eb ${progressPercent}%)`,
              }}
            >
              <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
                {status === "completed" ? (
                  <>
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={backgroundColor(subjectColor)}
                    >
                      <Icon
                        name="check"
                        className="h-6 w-6 text-white"
                      />
                    </div>
                    <p className="mt-3 font-semibold text-gray-900">
                      Session complete
                    </p>
                    {saving ? (
                      <p className="text-sm text-gray-500 mt-1">Saving...</p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">
                        {formatMinutes(totalPlannedMs / 60000)} studied
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-5xl font-bold text-gray-900 tabular-nums tracking-tight">
                      {formatCountdown(remainingMs)}
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-500">
                      {MODE_LABELS[mode]}
                    </p>
                    {selectedSubject && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={backgroundColor(subjectColor)}
                        />
                        {selectedSubject.name}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {saveError && (
              <div className="mt-4 w-full max-w-md p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">
                {saveError}
                {status === "completed" && !saving && (
                  <button
                    onClick={() =>
                      void saveSession(
                        Math.max(1, Math.round(totalPlannedMs / 60000)),
                        new Date().toISOString()
                      )
                    }
                    className="ml-2 underline font-medium"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {status === "idle" && (
                <button
                  onClick={start}
                  disabled={controlsDisabled || !subjectId}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-6 py-2.5 hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  <Icon name="play" className="h-4 w-4" />
                  Start
                </button>
              )}
              {status === "running" && (
                <>
                  <button
                    onClick={pause}
                    disabled={controlsDisabled}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Icon name="pause" className="h-4 w-4" />
                    Pause
                  </button>
                  <button
                    onClick={finishAndSave}
                    disabled={controlsDisabled}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-6 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    <Icon name="check" className="h-4 w-4" />
                    Finish & Save
                  </button>
                  <button
                    onClick={reset}
                    disabled={controlsDisabled}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Icon name="refresh" className="h-4 w-4" />
                    Reset
                  </button>
                </>
              )}
              {status === "paused" && (
                <>
                  <button
                    onClick={start}
                    disabled={controlsDisabled}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-6 py-2.5 hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    <Icon name="play" className="h-4 w-4" />
                    Resume
                  </button>
                  <button
                    onClick={finishAndSave}
                    disabled={controlsDisabled}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-6 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    <Icon name="check" className="h-4 w-4" />
                    Finish & Save
                  </button>
                  <button
                    onClick={reset}
                    disabled={controlsDisabled}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Icon name="refresh" className="h-4 w-4" />
                    Reset
                  </button>
                </>
              )}
              {status === "completed" && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-6 py-2.5 hover:bg-primary-700 transition-colors"
                >
                  <Icon name="refresh" className="h-4 w-4" />
                  New Session
                </button>
              )}
            </div>
            {status === "idle" && !subjectId && (
              <p className="mt-2 text-xs text-gray-500">
                Select a subject to start the timer.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <SummaryCard
            label="Today's Study Time"
            value={formatMinutes(todayTotal)}
          />
          <SummaryCard
            label="Number of Sessions"
            value={String(todayCount)}
          />
          <SummaryCard
            label="Current session duration"
            value={formatMinutes(currentSessionMinutes)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Today's Sessions
        </h2>
        {loading ? (
          <p className="text-gray-500 py-8 text-center">
            Loading today's sessions...
          </p>
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
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
              <Icon name="timer" className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No sessions completed today
            </h3>
            <p className="text-gray-500 mt-1">
              Complete a timer session and it will show up here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={backgroundColor(session.subject?.color ?? null)}
                    >
                      <span className={textOnColor(session.subject?.color ?? null)}>
                        {session.subject?.name ?? "No subject"}
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[session.type]}`}
                    >
                      {MODE_LABELS[session.type]}
                    </span>
                    {session.task && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        <Icon name="tasks" className="h-3 w-3" />
                        {session.task.title}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1.5">
                    <span className="font-medium text-gray-700">
                      {formatMinutes(session.duration)}
                    </span>
                    {" · "}
                    {formatTime(session.startedAt)} –{" "}
                    {session.endedAt ? formatTime(session.endedAt) : "..."}
                  </p>
                </div>
                <button
                  onClick={() => setDeleting(session)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors sm:shrink-0"
                  aria-label="Delete session"
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleting && (
        <Modal title="Delete Study Session" onClose={() => setDeleting(null)}>
          <p className="text-gray-600">
            Are you sure you want to delete this study session and its{" "}
            <span className="font-medium text-gray-900">
              {formatMinutes(deleting.duration)}
            </span>{" "}
            of recorded study time? This action cannot be undone.
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}