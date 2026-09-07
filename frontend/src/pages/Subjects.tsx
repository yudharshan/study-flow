import { useCallback, useEffect, useState } from "react";
import {
  createSubject,
  deleteSubject,
  fetchSubjects,
  updateSubject,
  type Subject,
  type SubjectInput,
} from "../lib/subjects";
import { backgroundColor } from "../lib/colors";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import SubjectForm from "../components/subjects/SubjectForm";

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [flash, setFlash] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await fetchSubjects();
      setSubjects(data.subjects);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load subjects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  function openAdd() {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(subject: Subject) {
    setEditing(subject);
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(input: SubjectInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await updateSubject(editing.id, input);
        setFlash("Subject updated");
      } else {
        await createSubject(input);
        setFlash("Subject added");
      }
      closeForm();
      await loadSubjects();
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
      await deleteSubject(deleting.id);
      setFlash("Subject deleted");
      setDeleting(null);
      await loadSubjects();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete subject");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-500 mt-1">
            Manage your courses and subjects.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition-colors"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add Subject
        </button>
      </div>

      {flash && (
        <div className="p-3 rounded-lg bg-emerald-50 text-sm text-emerald-700 border border-emerald-200">
          {flash}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 py-8">Loading subjects...</p>
      ) : loadError ? (
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700">
          <p className="font-medium mb-3">{loadError}</p>
          <button
            onClick={loadSubjects}
            className="rounded-lg bg-red-100 text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
            <Icon name="subjects" className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No subjects yet
          </h2>
          <p className="text-gray-500 mt-1 mb-6">
            Add your first subject to start organizing your study flow.
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition-colors"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={() => openEdit(subject)}
              onDelete={() => setDeleting(subject)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <Modal
          title={editing ? "Edit Subject" : "Add Subject"}
          onClose={closeForm}
        >
          <SubjectForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            submitting={submitting}
            error={formError}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete Subject" onClose={() => setDeleting(null)}>
          <p className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-900">{deleting.name}</span>?
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

function SubjectCard({
  subject,
  onEdit,
  onDelete,
}: {
  subject: Subject;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const taskCount = subject._count?.tasks;

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="h-2" style={backgroundColor(subject.color)} />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {subject.name}
            </h3>
            {taskCount !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                {taskCount} task{taskCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <span
            className="h-4 w-4 rounded-full shrink-0"
            style={backgroundColor(subject.color)}
          />
        </div>
        {subject.description && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
            {subject.description}
          </p>
        )}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Icon name="edit" className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Icon name="trash" className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
