import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import { GripVertical, Plus, Trash2, Pencil, Eye, EyeOff } from "lucide-react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { Button } from "../../components/ui/Button";
import {
  fetchAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from "../../services/questionsService";
import type { Question, QuestionType } from "../../types";

const QUESTION_TYPES: QuestionType[] = [
  "TEXT",
  "LONG_TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "YES_NO",
];

const emptyDraft: Omit<Question, "id"> = {
  question_text: "",
  question_type: "TEXT",
  options: null,
  is_required: true,
  is_active: true,
  display_order: 0,
  introduction_text: "",
  conditional_question_id: null,
  conditional_value: null,
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<Question | (typeof emptyDraft) | null>(null);
  const [optionsText, setOptionsText] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetchAllQuestions();
    setQuestions(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const items = Array.from(questions);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setQuestions(items);
    await reorderQuestions(
      items.map((q, i) => ({ id: q.id, display_order: i + 1 }))
    );
  }

  async function handleToggleActive(q: Question) {
    await updateQuestion(q.id, { is_active: !q.is_active });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    try {
      await deleteQuestion(id);
      toast.success("Question deleted.");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete this question.");
    }
  }

  function openEdit(q?: Question) {
    if (q) {
      setEditing(q);
      setOptionsText((q.options || []).join(", "));
    } else {
      setEditing({ ...emptyDraft, display_order: questions.length + 1 });
      setOptionsText("");
    }
  }

  async function handleSave() {
    if (!editing || !editing.question_text.trim()) {
      toast.error("Please enter the question text.");
      return;
    }
    const options = optionsText.trim()
      ? optionsText.split(",").map((o) => o.trim()).filter(Boolean)
      : null;

    try {
      if ("id" in editing) {
        await updateQuestion(editing.id, { ...editing, options });
        toast.success("Question updated.");
      } else {
        await createQuestion({ ...editing, options });
        toast.success("Question added.");
      }
      setEditing(null);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save this question.");
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Questions</h1>
        <Button onClick={() => openEdit()} type="button">
          <Plus size={16} /> Add Question
        </Button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading questions...</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                {questions.map((q, index) => (
                  <Draggable key={q.id} draggableId={q.id} index={index}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className="romantic-card flex items-center gap-3 rounded-2xl p-4"
                      >
                        <span {...dragProvided.dragHandleProps} className="cursor-grab" style={{ color: "var(--text-secondary)" }}>
                          <GripVertical size={18} />
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{q.question_text}</p>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {q.question_type} {q.is_required ? "· required" : "· optional"}{" "}
                            {!q.is_active && "· hidden"}
                          </p>
                        </div>
                        <button onClick={() => handleToggleActive(q)} className="rounded-full p-2" style={{ color: "var(--text-secondary)" }}>
                          {q.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button onClick={() => openEdit(q)} className="rounded-full p-2" style={{ color: "var(--accent)" }}>
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="rounded-full p-2 text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="romantic-card max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6"
            style={{ background: "var(--surface)" }}
          >
            <h3 className="font-serif mb-4 text-xl font-semibold">
              {"id" in editing ? "Edit Question" : "New Question"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Question Text</label>
                <textarea
                  value={editing.question_text}
                  onChange={(e) => setEditing({ ...editing, question_text: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Introduction (optional)</label>
                <input
                  value={editing.introduction_text || ""}
                  onChange={(e) => setEditing({ ...editing, introduction_text: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select
                  value={editing.question_type}
                  onChange={(e) =>
                    setEditing({ ...editing, question_type: e.target.value as QuestionType })
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              {(editing.question_type === "SINGLE_CHOICE" ||
                editing.question_type === "MULTIPLE_CHOICE") && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Options (comma separated)
                  </label>
                  <input
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_required}
                    onChange={(e) => setEditing({ ...editing, is_required: e.target.checked })}
                  />
                  Required
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditing(null)} type="button">
                Cancel
              </Button>
              <Button onClick={handleSave} type="button">
                Save Question
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
