import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await getDb();

  // 使用中のメモ数を確認
  const { rows: memoRows } = await db.execute({
    sql: "SELECT COUNT(*) as n FROM memos WHERE tag = ?",
    args: [id],
  });
  const n = Number(memoRows[0][0]);
  if (n > 0) {
    return NextResponse.json(
      { error: `このタグは ${n} 件のメモで使用中のため削除できません` },
      { status: 409 }
    );
  }

  // 最後の1つは削除不可
  const { rows: tagRows } = await db.execute("SELECT COUNT(*) as total FROM tags");
  if (Number(tagRows[0][0]) <= 1) {
    return NextResponse.json(
      { error: "タグは最低1つ必要です" },
      { status: 409 }
    );
  }

  await db.execute({ sql: "DELETE FROM tags WHERE id = ?", args: [id] });
  return new NextResponse(null, { status: 204 });
}
