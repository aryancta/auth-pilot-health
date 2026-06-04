import { NextRequest, NextResponse } from "next/server";
import { buildEvidence } from "@/lib/agents";
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

  const evidence = buildEvidence(c);
  const apiKey = req.headers.get("x-user-anthropic-key");

  if (apiKey) {
    try {
      const system =
        "You are a clinical-evidence extraction assistant for prior authorization. You summarize a patient chart into a concise, factual clinical narrative. Never invent findings. Use no em dashes.";
      const prompt = `Patient: ${c.patient.age} year old ${c.patient.sex}. Procedure requested: ${c.procedure.name} (CPT ${c.procedure.cpt}). Primary diagnosis: ${c.primaryDiagnosis.name} (${c.primaryDiagnosis.icd10}). Write a 2 to 3 sentence clinical narrative supporting the medical necessity review. Keep it factual and concise.`;
      const result = await callClaude(apiKey, system, prompt, 400);
      if (result.text) {
        evidence.narrative = result.text;
        evidence.model = result.model;
      }
      return NextResponse.json({ evidence, live: true });
    } catch (err) {
      return NextResponse.json({
        evidence,
        live: false,
        warning:
          err instanceof Error ? err.message : "Live model call failed, used demo extraction.",
      });
    }
  }

  return NextResponse.json({ evidence, live: false });
}
