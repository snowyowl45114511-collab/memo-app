import { NextResponse } from "next/server";
import { getDb, rowToMemo } from "@/lib/db";

/**
 * GET /api/export
 * フィードバック付きメモを全件 JSON で返す。
 * システム改修時のデータ分析・プロンプト改善に使用する。
 *
 * クエリパラメータ:
 *   ?feedback_only=true  フィードバックが入力済みのメモのみ返す
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const feedbackOnly = searchParams.get("feedback_only") === "true";

  const db = await getDb();
  const sql = feedbackOnly
    ? "SELECT * FROM memos WHERE feedback IS NOT NULL AND feedback != '' ORDER BY created_at DESC"
    : "SELECT * FROM memos ORDER BY created_at DESC";

  const { rows } = await db.execute(sql);

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    total: rows.length,
    memos: rows.map(rowToMemo),
  });
}
