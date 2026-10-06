import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Download, Search, Trash2, X } from "lucide-react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { fetchResponsesWithAnswers, deleteResponse } from "../../services/responsesService";
import { Button } from "../../components/ui/Button";

interface AnswerRow {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string;
  questions?: { question_text: string };
}

interface ResponseRow {
  id: string;
  session_id: string;
  user_id: string | null;
  submitted_at: string | null;
  created_at: string;
}

const PAGE_SIZE = 8;

export default function AdminResponses() {
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [search, setSearch] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ResponseRow | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { responses: r, answers: a } = await fetchResponsesWithAnswers();
      setResponses(r as ResponseRow[]);
      setAnswers(a as AnswerRow[]);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load responses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const answersByResponse = useMemo(() => {
    const map: Record<string, AnswerRow[]> = {};
    answers.forEach((a) => {
      map[a.response_id] = map[a.response_id] || [];
      map[a.response_id].push(a);
    });
    return map;
  }, [answers]);

  const filtered = useMemo(() => {
    let list = responses.filter((r) => {
      if (!search) return true;
      const text = (answersByResponse[r.id] || [])
        .map((a) => a.answer_text)
        .join(" ")
        .toLowerCase();
      return (
        text.includes(search.toLowerCase()) ||
        r.session_id.toLowerCase().includes(search.toLowerCase())
      );
    });
    list = list.sort((a, b) =>
      sortDesc
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return list;
  }, [responses, search, sortDesc, answersByResponse]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  async function handleDelete(id: string) {
    if (!confirm("Delete this response permanently?")) return;
    try {
      await deleteResponse(id);
      toast.success("Response deleted.");
      setResponses((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete this response.");
    }
  }

  function handleExport() {
    const rows = filtered.map((r) => {
      const row: Record<string, string> = {
        session_id: r.session_id,
        submitted_at: r.submitted_at || "",
        has_account: r.user_id ? "yes" : "no",
      };
      (answersByResponse[r.id] || []).forEach((a) => {
        row[a.questions?.question_text || a.question_id] = a.answer_text;
      });
      return row;
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "responses.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Responses</h1>
        <Button variant="secondary" onClick={handleExport} type="button">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 rounded-2xl border px-4 py-2.5"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        >
          <Search size={16} style={{ color: "var(--text-secondary)" }} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search answers or session id..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <button
          onClick={() => setSortDesc((s) => !s)}
          className="rounded-2xl border px-4 py-2.5 text-sm"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        >
          Sort: {sortDesc ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading responses...</p>
      ) : paginated.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No responses yet.</p>
      ) : (
        <div className="space-y-3">
          {paginated.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="romantic-card flex cursor-pointer items-center justify-between rounded-2xl p-4"
              onClick={() => setSelected(r)}
            >
              <div>
                <p className="text-sm font-medium">
                  {(answersByResponse[r.id] || [])[0]?.answer_text || "Anonymous response"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {new Date(r.created_at).toLocaleString()} ·{" "}
                  {r.user_id ? "Account linked" : "Anonymous"}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(r.id);
                }}
                className="rounded-full p-2 text-red-500 hover:bg-red-500/10"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-3 text-sm">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          style={{ borderColor: "var(--border-color)" }}
        >
          Prev
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          style={{ borderColor: "var(--border-color)" }}
        >
          Next
        </button>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="romantic-card max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6"
              style={{ background: "var(--surface)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-xl font-semibold">Response Detail</h3>
                <button onClick={() => setSelected(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {(answersByResponse[selected.id] || []).map((a) => (
                  <div key={a.id}>
                    <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                      {a.questions?.question_text || "Question"}
                    </p>
                    <p className="text-sm">{a.answer_text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
