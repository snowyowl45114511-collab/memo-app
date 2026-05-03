// ─── タグ定義 ───────────────────────────────────────────────
// タグを追加するときはこの配列に要素を足すだけでOKです。
// フロントエンド・API・Claude プロンプトすべてここを参照します。

export interface TagDef {
  id: string;
  label: string;
  emoji: string;
  /** テキスト色 (Tailwind) */
  color: string;
  /** 非アクティブ時の背景 (Tailwind) */
  bg: string;
  /** アクティブ時の背景 (Tailwind) */
  activeBg: string;
  /** バッジ色 (Tailwind) */
  badgeCls: string;
  /** Claude へ渡す英語の説明 */
  description: string;
}

export const TAGS: TagDef[] = [
  {
    id: "task",
    label: "タスク",
    emoji: "✅",
    color: "text-blue-700",
    bg: "bg-blue-100 hover:bg-blue-200",
    activeBg: "bg-blue-200 ring-2 ring-blue-400 ring-offset-1",
    badgeCls: "bg-blue-100 text-blue-800 border-blue-200",
    description: "actionable todo — something the writer needs to DO",
  },
  {
    id: "research",
    label: "リサーチ",
    emoji: "🔍",
    color: "text-purple-700",
    bg: "bg-purple-100 hover:bg-purple-200",
    activeBg: "bg-purple-200 ring-2 ring-purple-400 ring-offset-1",
    badgeCls: "bg-purple-100 text-purple-800 border-purple-200",
    description: "something the writer wants to know more about — investigate or look up",
  },
  {
    id: "idea",
    label: "アイデア",
    emoji: "💡",
    color: "text-yellow-700",
    bg: "bg-yellow-100 hover:bg-yellow-200",
    activeBg: "bg-yellow-200 ring-2 ring-yellow-400 ring-offset-1",
    badgeCls: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "creative concept, insight, or inspiration — not immediately actionable",
  },
];

// ヘルパー
export const TAG_IDS = TAGS.map((t) => t.id);
export const TAG_MAP = Object.fromEntries(TAGS.map((t) => [t.id, t])) as Record<string, TagDef>;
