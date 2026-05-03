"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { COLOR_PRESETS } from "@/lib/tag-colors";

// ─── 型定義 ─────────────────────────────────────────────────
interface TagDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  activeBg: string;
  badgeCls: string;
  description: string;
}

interface Memo {
  id: number;
  content: string;
  tag: string;
  ai_comment: string | null;
  feedback: string | null;
  completed: number;
  ai_error?: string;
  created_at: string;
}

const ALL_FILTER = {
  id: "all",
  label: "すべて",
  emoji: "📋",
  color: "text-gray-700",
  bg: "bg-gray-100 hover:bg-gray-200",
  activeBg: "bg-gray-200 ring-2 ring-gray-400 ring-offset-1",
};

const FALLBACK_TAG: TagDef = {
  id: "unknown",
  label: "不明",
  emoji: "🏷️",
  color: "text-gray-700",
  bg: "bg-gray-100 hover:bg-gray-200",
  activeBg: "bg-gray-200 ring-2 ring-gray-400 ring-offset-1",
  badgeCls: "bg-gray-100 text-gray-800 border-gray-200",
  description: "",
};

// ─── タグ変更ドロップダウン ──────────────────────────────────
function TagSelector({
  memoId,
  currentTag,
  tags,
  onChanged,
}: {
  memoId: number;
  currentTag: string;
  tags: TagDef[];
  onChanged: (updated: Memo) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const def = tags.find((t) => t.id === currentTag) ?? FALLBACK_TAG;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = async (newTag: string) => {
    if (newTag === currentTag) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/memos/${memoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: newTag }),
      });
      if (res.ok) onChanged(await res.json());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        title="タグを変更"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer hover:opacity-80 ${def.badgeCls} ${saving ? "opacity-50" : ""}`}
      >
        {saving
          ? <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          : <span>{def.emoji}</span>
        }
        {def.label}
        <span className="opacity-60">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[130px]">
          {tags.map((t) => (
            <button key={t.id} onClick={() => handleSelect(t.id)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${t.id === currentTag ? "font-semibold" : ""}`}>
              <span>{t.emoji}</span>{t.label}
              {t.id === currentTag && <span className="ml-auto text-gray-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── フィードバック入力 ─────────────────────────────────────
function FeedbackSection({ memo, onChanged }: { memo: Memo; onChanged: (updated: Memo) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memo.feedback ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(memo.feedback ?? "");
  }, [memo.feedback, editing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: draft }),
      });
      if (res.ok) { onChanged(await res.json()); setEditing(false); }
    } finally { setSaving(false); }
  };

  if (!editing) {
    return (
      <div className="px-4 pb-3 pt-1 border-t border-gray-100">
        {memo.feedback ? (
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">💬 フィードバック</p>
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{memo.feedback}</p>
            </div>
            <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600 shrink-0 mt-0.5">編集</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <span>＋</span> フィードバックを追加
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pb-3 pt-2 border-t border-gray-100 space-y-2">
      <p className="text-xs text-gray-500">💬 フィードバック</p>
      <textarea
        value={draft} onChange={(e) => setDraft(e.target.value)}
        placeholder="このアウトプットへの感想・修正点など..."
        rows={3} autoFocus
        className="w-full text-xs text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
      <div className="flex gap-2 justify-end">
        <button onClick={() => { setDraft(memo.feedback ?? ""); setEditing(false); }}
          className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          キャンセル
        </button>
        <button onClick={handleSave} disabled={saving}
          className="text-xs px-3 py-1 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1">
          {saving && <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
          保存
        </button>
      </div>
    </div>
  );
}

// ─── メモカード ─────────────────────────────────────────────
function MemoCard({
  memo, tags, expandedId, onExpand, onUpdated, onDeleted,
}: {
  memo: Memo;
  tags: TagDef[];
  expandedId: number | null;
  onExpand: (id: number | null) => void;
  onUpdated: (updated: Memo) => void;
  onDeleted: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memo.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingComplete, setTogglingComplete] = useState(false);

  const def = tags.find((t) => t.id === memo.tag) ?? FALLBACK_TAG;
  const isExpanded = expandedId === memo.id;
  const isCompleted = memo.completed === 1;
  const isTask = memo.tag === "task";
  const showResearch = memo.tag === "research" && memo.ai_comment;

  const handleSaveEdit = async () => {
    if (!draft.trim() || draft.trim() === memo.content) { setEditing(false); return; }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft.trim() }),
      });
      if (res.ok) { onUpdated(await res.json()); setEditing(false); }
    } finally { setSavingEdit(false); }
  };

  const handleToggleComplete = async () => {
    setTogglingComplete(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !isCompleted }),
      });
      if (res.ok) onUpdated(await res.json());
    } finally { setTogglingComplete(false); }
  };

  const handleDelete = async () => {
    if (!confirm("このメモを削除しますか？")) return;
    await fetch(`/api/memos/${memo.id}`, { method: "DELETE" });
    onDeleted(memo.id);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-opacity ${isCompleted && isTask ? "opacity-60" : ""} ${isCompleted && isTask ? "border-gray-100" : "border-gray-200"}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* タスクのみ完了チェックボックス */}
          {isTask && (
            <button
              onClick={handleToggleComplete}
              disabled={togglingComplete}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isCompleted ? "bg-blue-500 border-blue-500 text-white" : "border-gray-300 hover:border-blue-400"}`}
            >
              {isCompleted && <span className="text-xs leading-none">✓</span>}
            </button>
          )}
          {/* タスク以外はemoji */}
          {!isTask && (
            <span className="text-lg leading-none mt-0.5">{def.emoji}</span>
          )}

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={draft} onChange={(e) => setDraft(e.target.value)}
                  autoFocus rows={3}
                  className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <div className="flex gap-2">
                  <button onClick={() => { setDraft(memo.content); setEditing(false); }}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                    キャンセル
                  </button>
                  <button onClick={handleSaveEdit} disabled={savingEdit}
                    className="text-xs px-3 py-1 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50">
                    {savingEdit ? "保存中..." : "保存"}
                  </button>
                </div>
              </div>
            ) : (
              <p className={`text-gray-900 text-sm leading-relaxed break-words ${isCompleted && isTask ? "line-through text-gray-400" : ""}`}>
                {memo.content}
              </p>
            )}

            {!editing && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <TagSelector memoId={memo.id} currentTag={memo.tag} tags={tags} onChanged={onUpdated} />
                <span className="text-xs text-gray-400">{formatDate(memo.created_at)}</span>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600">編集</button>
                  <button onClick={handleDelete} className="text-xs text-gray-300 hover:text-red-400">削除</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* リサーチのみ: AIコメント */}
      {showResearch && (
        <>
          <button onClick={() => onExpand(isExpanded ? null : memo.id)}
            className="w-full px-4 py-2 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors border-t border-gray-100">
            <span>🔍 リサーチ結果</span>
            <span className="ml-auto">{isExpanded ? "▲" : "▼"}</span>
          </button>
          {isExpanded && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{memo.ai_comment}</p>
            </div>
          )}
        </>
      )}

      {/* フィードバック */}
      <FeedbackSection memo={memo} onChanged={onUpdated} />
    </div>
  );
}

// ─── タグ管理モーダル ────────────────────────────────────────
function TagsModal({ tags, onClose, onTagsChanged }: {
  tags: TagDef[];
  onClose: () => void;
  onTagsChanged: () => void;
}) {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const [colorIdx, setColorIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toId = (l: string) =>
    l.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 32);

  const handleAdd = async () => {
    if (!label.trim() || !emoji.trim()) return;
    setSaving(true);
    setError(null);
    const preset = COLOR_PRESETS[colorIdx];
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: toId(label),
          label: label.trim(),
          emoji: emoji.trim(),
          color: preset.color,
          bg: preset.bg,
          activeBg: preset.activeBg,
          badgeCls: preset.badgeCls,
          description: `custom tag: ${label.trim()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onTagsChanged();
      setLabel(""); setEmoji("🏷️");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }
      onTagsChanged();
    } finally { setDeletingId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">タグ管理</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* 既存タグ一覧 */}
          {tags.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-1">
              <span className="text-base">{t.emoji}</span>
              <span className="text-sm text-gray-700 flex-1">{t.label}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${t.badgeCls}`}>{t.label}</span>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={deletingId === t.id}
                className="text-xs text-gray-300 hover:text-red-400 disabled:opacity-50 shrink-0"
              >
                {deletingId === t.id ? "..." : "削除"}
              </button>
            </div>
          ))}
        </div>

        {/* 新規タグ追加フォーム */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          <p className="text-xs font-medium text-gray-500">新しいタグを追加</p>
          <div className="flex gap-2">
            <input
              value={emoji} onChange={(e) => setEmoji(e.target.value)}
              placeholder="🏷️" maxLength={4}
              className="w-12 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <input
              value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="タグ名（例：書籍）"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
          </div>
          {/* カラー選択 */}
          <div className="flex gap-2 flex-wrap">
            {COLOR_PRESETS.map((p, i) => (
              <button key={p.name} onClick={() => setColorIdx(i)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${i === colorIdx ? "scale-125 border-gray-600" : "border-transparent"}`}
                style={{ background: `var(--color-${p.name}-400, #9ca3af)` }}
                title={p.name}
              >
                <span className={`block w-full h-full rounded-full ${p.badgeCls.split(" ")[0]}`}></span>
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd} disabled={saving || !label.trim()}
            className="w-full py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40"
          >
            {saving ? "追加中..." : "追加"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── メインページ ────────────────────────────────────────────
const SAVE_STEPS = [
  { delay: 0,     msg: "AIが分類中..." },
  { delay: 3000,  msg: "🌐 Webを検索中..." },
  { delay: 15000, msg: "結果をまとめています..." },
];

export default function Home() {
  const [tags, setTags] = useState<TagDef[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingMsg, setSavingMsg] = useState("分析中...");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const savingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // タグ取得
  const fetchTags = useCallback(async () => {
    const res = await fetch("/api/tags");
    setTags(await res.json());
  }, []);

  // メモ取得
  const fetchMemos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("tag", filter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/memos${params.size ? `?${params}` : ""}`);
      setMemos(await res.json());
    } finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { fetchTags(); }, [fetchTags]);
  useEffect(() => { fetchMemos(); }, [fetchMemos]);

  // 保存進捗メッセージ
  const startSavingProgress = () => {
    setSavingMsg(SAVE_STEPS[0].msg);
    savingTimers.current = SAVE_STEPS.slice(1).map(({ delay, msg }) =>
      setTimeout(() => setSavingMsg(msg), delay)
    );
  };
  const stopSavingProgress = () => {
    savingTimers.current.forEach(clearTimeout);
    savingTimers.current = [];
    setSavingMsg("分析中...");
  };

  const handleSave = async () => {
    if (!input.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    startSavingProgress();
    try {
      const res = await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) {
        const newMemo: Memo = await res.json();
        setInput("");
        setMemos((prev) => [newMemo, ...prev]);
        if (newMemo.tag === "research") setExpandedId(newMemo.id);
        if (newMemo.ai_error) setSaveError(`AI分析エラー: ${newMemo.ai_error}`);
      }
    } finally {
      setSaving(false);
      stopSavingProgress();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave();
  };

  const handleMemoUpdated = (updated: Memo) => {
    setMemos((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleMemoDeleted = (id: number) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
  };

  // 検索は300msデバウンス
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchMemos(), 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <h1 className="text-xl font-bold text-gray-900">思いつきメモ</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">Claude AI powered</span>
            <button onClick={() => setShowTagsModal(true)}
              className="text-gray-400 hover:text-gray-600 text-lg" title="タグ管理">⚙️</button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 入力エリア */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <textarea
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="思いついたことを書いてください...（Ctrl+Enter で保存）"
            rows={3}
            className="w-full resize-none text-gray-900 placeholder-gray-400 focus:outline-none text-base"
            disabled={saving}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {saving ? savingMsg : "Claude がタグ付け・分析を自動で行います"}
            </span>
            <button
              onClick={handleSave} disabled={!input.trim() || saving}
              className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>{savingMsg}</>
              ) : "保存"}
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2 text-sm text-red-700">
            <span>⚠️</span><span className="flex-1">{saveError}</span>
            <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* 検索バー */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔎</span>
          <input
            value={search} onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="メモを検索..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm"
          />
          {search && (
            <button onClick={() => { setSearch(""); fetchMemos(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>

        {/* フィルタータブ */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${ALL_FILTER.color} ${filter === "all" ? ALL_FILTER.activeBg : ALL_FILTER.bg}`}>
            <span>{ALL_FILTER.emoji}</span>{ALL_FILTER.label}
          </button>
          {tags.map((t) => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${t.color} ${filter === t.id ? t.activeBg : t.bg}`}>
              <span>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>

        {/* メモ一覧 */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 py-12">読み込み中...</div>
          ) : memos.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              {search ? `「${search}」に一致するメモがありません` :
               filter === "all" ? "まだメモがありません" :
               `${tags.find((t) => t.id === filter)?.label ?? filter}のメモがありません`}
            </div>
          ) : (
            memos.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                tags={tags}
                expandedId={expandedId}
                onExpand={setExpandedId}
                onUpdated={handleMemoUpdated}
                onDeleted={handleMemoDeleted}
              />
            ))
          )}
        </div>
      </main>

      {/* タグ管理モーダル */}
      {showTagsModal && (
        <TagsModal
          tags={tags}
          onClose={() => setShowTagsModal(false)}
          onTagsChanged={() => { fetchTags(); fetchMemos(); }}
        />
      )}
    </div>
  );
}
