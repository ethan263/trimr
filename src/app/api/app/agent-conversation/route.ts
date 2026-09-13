import { NextRequest, NextResponse } from "next/server";

import { getAppAuthSession } from "@/lib/auth/require-app-session";
import { recordOperatorConversation } from "@/lib/data/agents";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAppAuthSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    conversationId?: unknown;
  } | null;
  const conversationId =
    typeof body?.conversationId === "string" ? body.conversationId.trim() : "";
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required." },
      { status: 400 },
    );
  }

  try {
    const conversation = await recordOperatorConversation({ conversationId });
    return NextResponse.json(
      { ok: true, conversationId: conversation.externalConversationId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to record conversation.";
    console.error("Unable to record operator agent conversation", error);
    return NextResponse.json(
      { error: message },
      { status: message.includes("valid conversation") ? 400 : 500 },
    );
  }
}
