import { NextRequest, NextResponse } from "next/server";
import { buildAppealLetter } from "@/lib/agents";
import { callClaude } from "@/lib/anthropic";
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

  const fallback = buildAppealLetter(c);
  const apiKey = req.headers.get("x-user-anthropic-key");

  if (apiKey) {
    try {
      const system =
        "You are a prior authorization appeals specialist. You draft professional, citation-backed appeal letters contesting a payer denial. Reference the documented evidence and policy criteria. The letter must state it is pending clinician sign-off before submission. Use no em dashes. Keep it under 350 words.";
      const metCriteria = c.ruleMatch.criteria
        .filter((cr) => cr.status === "met")
        .map((cr) => `${cr.text} (${cr.citation})`)
        .join("; ");
      const prompt = `Draft an appeal letter. Patient: ${c.patient.name}, ${c.patient.mrn}. Procedure: ${c.procedure.name} (CPT ${c.procedure.cpt}). Payer: ${c.payer.name}. Policy: ${c.ruleMatch.payerPolicy} (${c.ruleMatch.policyId}). Denial reason: ${c.decision.reason || "insufficient documentation"}. Met criteria: ${metCriteria}. Referring provider: ${c.referringProvider.name}.`;
      const result = await callClaude(apiKey, system, prompt, 900);
      if (result.text) {
        return NextResponse.json({
          appeal: { draftLetter: result.text, citations: fallback.citations },
          live: true,
        });
      }
    } catch (err) {
      return NextResponse.json({
        appeal: fallback,
        live: false,
        warning:
          err instanceof Error ? err.message : "Live model call failed, used demo draft.",
      });
    }
  }

  return NextResponse.json({ appeal: fallback, live: false });
}
