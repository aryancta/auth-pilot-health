import type { PriorAuthCase } from "./types";

export function caseMetrics(cases: PriorAuthCase[]) {
  const active = cases.filter((c) => c.stage !== "closed");
  const awaitingHuman = cases.filter((c) =>
    c.humanTasks.some((t) => t.status === "open")
  );
  const inAppeal = cases.filter((c) => c.stage === "appeal");
  const approved = cases.filter((c) => c.decision.outcome === "approved");
  const denied = cases.filter(
    (c) => c.decision.outcome === "denied" && c.appeal.status !== "overturned"
  );
  const overturned = cases.filter((c) => c.appeal.status === "overturned");

  const decided = cases.filter(
    (c) => c.decision.outcome === "approved" || c.decision.outcome === "denied"
  );
  const firstPassApproved = approved.length;
  const approvalRate = decided.length
    ? Math.round((firstPassApproved / decided.length) * 100)
    : 0;

  const valueAtRisk = inAppeal.reduce((sum, c) => sum + c.estimatedValue, 0);
  const valueRescued = overturned.reduce(
    (sum, c) => sum + c.estimatedValue,
    0
  );

  return {
    total: cases.length,
    active: active.length,
    awaitingHuman: awaitingHuman.length,
    inAppeal: inAppeal.length,
    approved: approved.length,
    denied: denied.length,
    overturned: overturned.length,
    approvalRate,
    valueAtRisk,
    valueRescued,
  };
}

export function denialPatterns(cases: PriorAuthCase[]) {
  const byPayer = new Map<
    string,
    { payer: string; total: number; denied: number; overturned: number }
  >();
  const byProcedure = new Map<
    string,
    { procedure: string; total: number; denied: number }
  >();

  for (const c of cases) {
    const p = byPayer.get(c.payer.name) || {
      payer: c.payer.name,
      total: 0,
      denied: 0,
      overturned: 0,
    };
    p.total += 1;
    if (c.decision.outcome === "denied") p.denied += 1;
    if (c.appeal.status === "overturned") p.overturned += 1;
    byPayer.set(c.payer.name, p);

    const procKey = c.procedure.name;
    const pr = byProcedure.get(procKey) || {
      procedure: procKey,
      total: 0,
      denied: 0,
    };
    pr.total += 1;
    if (
      c.decision.outcome === "denied" ||
      c.appeal.status === "overturned" ||
      c.appeal.status === "awaiting_signoff"
    )
      pr.denied += 1;
    byProcedure.set(procKey, pr);
  }

  return {
    byPayer: Array.from(byPayer.values()).sort((a, b) => b.denied - a.denied),
    byProcedure: Array.from(byProcedure.values()).sort(
      (a, b) => b.denied - a.denied
    ),
  };
}

export function currency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
