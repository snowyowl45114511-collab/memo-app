import { NextRequest, NextResponse } from "next/server";
import { getDb, rowToTagDef } from "@/lib/db";
import type { TagDef } from "@/lib/tags";

export async function GET() {
  const db = await getDb();
  const { rows } = await db.execute("SELECT * FROM tags ORDER BY sortOrder ASC");
  return NextResponse.json(rows.map(rowToTagDef));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, label, emoji, color, bg, activeBg, badgeCls, description } =
    body as Partial<TagDef>;

  if (!id || !label || !emoji) {
    return NextResponse.json(
      { error: "id, label, emoji は必須です" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const { rows } = await db.execute("SELECT MAX(sortOrder) as m FROM tags");
  const maxOrder = rows[0].m != null ? Number(rows[0].m) : -1;

  try {
    await db.execute({
      sql: "INSERT INTO tags (id, label, emoji, color, bg, activeBg, badgeCls, description, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        id, label, emoji,
        color ?? "text-gray-700",
        bg ?? "bg-gray-100 hover:bg-gray-200",
        activeBg ?? "bg-gray-200 ring-2 ring-gray-400 ring-offset-1",
        badgeCls ?? "bg-gray-100 text-gray-800 border-gray-200",
        description ?? "",
        maxOrder + 1,
      ],
    });
  } catch {
    return NextResponse.json(
      { error: "同じIDのタグが既に存在します" },
      { status: 409 }
    );
  }

  const { rows: tagRows } = await db.execute({
    sql: "SELECT * FROM tags WHERE id = ?",
    args: [id],
  });
  return NextResponse.json(rowToTagDef(tagRows[0]), { status: 201 });
}
