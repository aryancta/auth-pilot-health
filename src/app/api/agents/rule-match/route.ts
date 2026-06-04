import { NextRequest, NextResponse } from "next/server";
import { buildRuleMatch } from "@/lib/agents";
import type { PriorAuthCase } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { case?: PriorAuthCase };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const c = body.case;
  if (!c) {
    return NextResponse.json({ error: "Missing case" }, { status: 400 });
  }

  const ruleMatch = buildRuleMatch(c);
  return NextResponse.json({ ruleMatch, live: false });
}
