import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STAGE_LABELS,
  type CaseStage,
  type Urgency,
  type DecisionOutcome,
  type CaseRunState,
} from "@/lib/types";
import { Pause, Play, UserCheck, Circle } from "lucide-react";

export function StageBadge({ stage }: { stage: CaseStage }) {
  const tone: Record<CaseStage, string> = {
    intake: "bg-slate-100 text-slate-700",
    evidence: "bg-sky-100 text-sky-800",
    rule_match: "bg-indigo-100 text-indigo-800",
    submission: "bg-amber-100 text-amber-900",
    decision: "bg-violet-100 text-violet-800",
    appeal: "bg-rose-100 text-rose-800",
    closed: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone[stage]
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  if (urgency === "routine")
    return <Badge variant="muted">Routine</Badge>;
  if (urgency === "urgent")
    return <Badge variant="warning">Urgent</Badge>;
  return <Badge variant="destructive">Expedited</Badge>;
}

export function DecisionBadge({ outcome }: { outcome: DecisionOutcome }) {
  if (outcome === "approved")
    return <Badge variant="success">Approved</Badge>;
  if (outcome === "denied")
    return <Badge variant="destructive">Denied</Badge>;
  if (outcome === "partial")
    return <Badge variant="warning">Partial</Badge>;
  return <Badge variant="muted">Pending</Badge>;
}

export function RunStateBadge({ state }: { state: CaseRunState }) {
  if (state === "paused")
    return (
      <Badge variant="warning" className="gap-1">
        <Pause className="h-3 w-3" /> Paused
      </Badge>
    );
  if (state === "waiting_human")
    return (
      <Badge variant="outline" className="gap-1 border-rose-300 text-rose-700">
        <UserCheck className="h-3 w-3" /> Waiting on clinician
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 border-emerald-300 text-emerald-700">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Running
    </Badge>
  );
}

export function ActorDot({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    agent: "bg-indigo-500",
    robot: "bg-amber-500",
    clinician: "bg-rose-500",
    coordinator: "bg-sky-500",
    system: "bg-slate-400",
  };
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", map[kind] || "bg-slate-400")}
    />
  );
}
