import { NextRequest, NextResponse } from "next/server";
import { getDb, rowToMemo } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM memos WHERE id = ?", args: [Number(id)] });
  return new NextResponse(null, { status: 204 });
}

// タグ変更 / フィードバック / 本文編集 / 完了トグル
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { tag, feedback, content, completed } = body as {
    tag?: string;
    feedback?: string;
    content?: string;
    completed?: boolean;
  };

  const db = await getDb();

  if (tag !== undefined) {
    const { rows } = await db.execute("SELECT id FROM tags");
    const validIds = rows.map((r) => String(r.id));
    if (!validIds.includes(tag)) {
      return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
    }
    await db.execute({
      sql: "UPDATE memos SET tag = ? WHERE id = ?",
      args: [tag, Number(id)],
    });
  }

  if (feedback !== undefined) {
    await db.execute({
      sql: "UPDATE memos SET feedback = ? WHERE id = ?",
      args: [feedback.trim() === "" ? null : feedback.trim(), Number(id)],
    });
  }

  if (content !== undefined) {
    if (!content.trim()) {
      return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 });
    }
    await db.execute({
      sql: "UPDATE memos SET content = ? WHERE id = ?",
      args: [content.trim(), Number(id)],
    });
  }

  if (completed !== undefined) {
    await db.execute({
      sql: "UPDATE memos SET completed = ? WHERE id = ?",
      args: [completed ? 1 : 0, Number(id)],
    });
  }

  const { rows } = await db.execute({
    sql: "SELECT * FROM memos WHERE id = ?",
    args: [Number(id)],
  });
  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rowToMemo(rows[0]));
}
