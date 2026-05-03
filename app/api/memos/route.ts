import { NextRequest, NextResponse } from "next/server";
import { getDb, rowToMemo } from "@/lib/db";
import { analyzeMemo } from "@/lib/claude";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const search = searchParams.get("search")?.trim();

  const db = await getDb();

  let sql = "SELECT * FROM memos";
  const args: (string | number)[] = [];
  const conditions: string[] = [];

  if (tag && tag !== "all") {
    conditions.push("tag = ?");
    args.push(tag);
  }
  if (search) {
    conditions.push("content LIKE ?");
    args.push(`%${search}%`);
  }
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";

  const { rows } = await db.execute({ sql, args });
  return NextResponse.json(rows.map(rowToMemo));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { content } = body as { content: string };

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const db = await getDb();
  const insertResult = await db.execute({
    sql: "INSERT INTO memos (content, tag) VALUES (?, 'idea')",
    args: [content.trim()],
  });
  const memoId = Number(insertResult.lastInsertRowid);

  try {
    const analysis = await analyzeMemo(content.trim());
    await db.execute({
      sql: "UPDATE memos SET tag = ?, ai_comment = ? WHERE id = ?",
      args: [analysis.tag, analysis.comment, memoId],
    });
    const { rows } = await db.execute({
      sql: "SELECT * FROM memos WHERE id = ?",
      args: [memoId],
    });
    return NextResponse.json(rowToMemo(rows[0]), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Claude analysis failed:", message);
    const { rows } = await db.execute({
      sql: "SELECT * FROM memos WHERE id = ?",
      args: [memoId],
    });
    return NextResponse.json(
      { ...rowToMemo(rows[0]), ai_error: message },
      { status: 201 }
    );
  }
}
