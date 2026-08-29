import { NextResponse } from "next/server";
import { parseIntent } from "@/lib/ai/parse-intent";
import { ProviderError } from "@/lib/ai/types";
import { validateAndNormalizeIntent } from "@/lib/ai/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Request body must be valid JSON" }, { status: 400 });
  }

  const text = body && typeof body === "object" && "text" in body ? (body as { text?: unknown }).text : undefined;
  if (typeof text !== "string" || !text.trim()) return NextResponse.json({ success: false, error: "text is required" }, { status: 400 });
  if (text.trim().length > 2_000) return NextResponse.json({ success: false, error: "text must be 2,000 characters or fewer" }, { status: 400 });

  try {
    const intent = validateAndNormalizeIntent(await parseIntent(text.trim()));
    return NextResponse.json({ success: true, intent });
  } catch (error) {
    if (error instanceof ProviderError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    if (error instanceof Error && error.message.startsWith("Unsupported LLM_PROVIDER")) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: false, error: "The intent response could not be validated" }, { status: 422 });
  }
}
