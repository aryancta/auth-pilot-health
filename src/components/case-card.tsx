"use client";

import Link from "next/link";
import type { PriorAuthCase } from "@/lib/types";
import { Card } from "@/components/ui/card";
import {
  StageBadge,
  UrgencyBadge,
  DecisionBadge,
  RunStateBadge,
} from "@/components/status";
import { currency } from "@/lib/metrics";
import { relativeTime } from "@/lib/utils";
import { AlertTriangle, UserCheck } from "lucide-react";

export function CaseCard({ c }: { c: PriorAuthCase }) {
  const openTask = c.humanTasks.find((t) => t.status === "open");
  const missing = c.ruleMatch.missingItems.length;

  return (
    <Link href={`/cases/${c.id}`} className="block">
      <Card className="card group cursor-pointer p-4 transition-all hover:border-primary/40 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">{c.id}</div>
            <div className="truncate font-semibold group-hover:text-primary">
              {c.procedure.name}
            </div>
          </div>
          <UrgencyBadge urgency={c.urgency} />
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          {c.patient.name} - {c.patient.age}
          {c.patient.sex}
        </div>
        <div className="text-xs text-muted-foreground">{c.payer.name}</div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StageBadge stage={c.stage} />
          {c.decision.outcome !== "pending" && (
            <DecisionBadge outcome={c.decision.outcome} />
          )}
        </div>

        {openTask && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-800">
            <UserCheck className="h-3.5 w-3.5" />
            Action: {openTask.title}
          </div>
        )}

        {!openTask && missing > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900">
            <AlertTriangle className="h-3.5 w-3.5" />
            {missing} missing item{missing > 1 ? "s" : ""} before submission
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <RunStateBadge state={c.runState} />
          <span>{currency(c.estimatedValue)}</span>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          Updated {relativeTime(c.updatedAt)}
        </div>
      </Card>
    </Link>
  );
}
