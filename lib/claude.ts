import Anthropic from "@anthropic-ai/sdk";
import { getDb, rowToTagDef } from "./db";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AnalysisResult {
  tag: string;
  comment: string;
}

export async function analyzeMemo(content: string): Promise<AnalysisResult> {
  // タグ定義をDBから動的に取得（UIで追加されたタグも反映）
  const db = await getDb();
  const { rows } = await db.execute("SELECT * FROM tags ORDER BY sortOrder ASC");
  const tags = rows.map(rowToTagDef);

  const tagIds = tags.map((t) => t.id);
  const tagDescriptions = tags
    .map((t) => `**${t.id}** — ${t.description}`)
    .join("\n");

  const tools: Anthropic.Tool[] = [
    {
      name: "analyze_memo",
      description:
        "Analyze the memo content, classify it into one tag, and generate a relevant comment",
      input_schema: {
        type: "object",
        properties: {
          tag: {
            type: "string",
            enum: tagIds,
            description: "The tag that best fits the memo",
          },
          comment: {
            type: "string",
            description:
              "For task: step-by-step procedure. For research: web search summary and key points. For idea: brushed-up suggestions and possibilities.",
          },
          search_query: {
            type: "string",
            description:
              "Only for research tag: the search query to look up. Leave empty for task/idea.",
          },
        },
        required: ["tag", "comment"],
      },
    },
  ];

  const classifyResponse = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    tools,
    tool_choice: { type: "tool", name: "analyze_memo" },
    system: `You are a memo classification assistant. Read the memo and classify it strictly into one of the available tags.

## Available tags

${tagDescriptions}

## Classification rules (defaults — adjust if custom tags are present)

**task** — Keywords: やること、する、買う、送る、連絡、予約、作る、直す、提出、TODO, fix, buy, send, call, book, submit.
Examples: "牛乳を買う", "メールを送る", "バグを直す"

**research** — Keywords: 調べる、気になる、知りたい、とは、仕組み、learn, look into, how does, what is.
Examples: "量子コンピュータについて調べる", "Rustの所有権モデルを理解したい"

**idea** — Keywords: いいかも、面白そう、どうだろう、アイデア、concept, what if, imagine.
Examples: "アプリのUIをもっとシンプルにしたらいいかも"

## When in doubt
- Clear verb of action → task
- Asks "what/how/why" → research
- Otherwise → idea

Respond in the same language as the memo (Japanese memos → Japanese comment, English memos → English comment).`,
    messages: [
      {
        role: "user",
        content: `Classify this memo:\n\n${content}`,
      },
    ],
  });

  const toolUse = classifyResponse.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Claude did not call the analyze_memo tool");
  }

  const input = toolUse.input as {
    tag: string;
    comment: string;
    search_query?: string;
  };

  let finalComment = input.comment;

  // research タグかつ検索クエリがある場合は Web 検索
  if (input.tag === "research" && input.search_query) {
    const searchTools: Anthropic.Messages.ToolUnion[] = [
      { type: "web_search_20260209", name: "web_search" },
    ];

    const searchResponse = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      tools: searchTools,
      system:
        "You are a research assistant. Search the web and summarize findings concisely in Japanese if the original memo is in Japanese, otherwise in English.",
      messages: [
        {
          role: "user",
          content: `Search for information about: ${input.search_query}\n\nOriginal memo: ${content}\n\nProvide a concise summary of what you find.`,
        },
      ],
    });

    // 最後のTextBlockを使う（最初は「検索します」という前置きのため）
    const textBlocks = searchResponse.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    const lastTextBlock = textBlocks[textBlocks.length - 1];
    if (lastTextBlock?.text.trim()) {
      finalComment = lastTextBlock.text;
    }
  }

  return {
    tag: input.tag,
    comment: finalComment,
  };
}
