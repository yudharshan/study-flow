import { FormEvent, useState } from "react";
import type { Subject, SubjectInput } from "../../lib/subjects";
import { SUBJECT_COLORS } from "../../lib/colors";

interface SubjectFormProps {
  initial?: Subject;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: SubjectInput) => void;
  onCancel: () => void;
}

export default function SubjectForm({
  initial,
  submitting,
  error,
  onSubmit,
  onCancel,
}: SubjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? SUBJECT_COLORS[0].value);
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setFormError("Subject name is required");
      return;
    }
    setFormError(null);
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="subject-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name
        </label>
        <input
          id="subject-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g. Mathematics"
        />
        {formError && <p className="mt-1 text-sm text-red-600">{formError}</p>}
      </div>

      <div>
        <label
          htmlFor="subject-description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="subject-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          placeholder="Optional description"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </span>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              title={c.label}
              aria-label={`Select ${c.label}`}
              className={`h-8 w-8 rounded-full transition-transform ${
                color === c.value
                  ? "ring-2 ring-offset-2 ring-gray-900 scale-110"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
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
          {submitting
            ? "Saving..."
            : initial
              ? "Save Changes"
              : "Add Subject"}
        </button>
      </div>
    </form>
  );
}