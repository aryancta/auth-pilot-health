"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCaseStore } from "@/lib/store";
import { useMounted } from "@/lib/use-mounted";
import { caseMetrics, currency } from "@/lib/metrics";
import { STAGE_ORDER, STAGE_LABELS, type CaseStage } from "@/lib/types";
import { CaseCard } from "@/components/case-card";
import { NewCaseDialog } from "@/components/new-case-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  FolderOpen,
  PenLine,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";

const BOARD_STAGES: CaseStage[] = [
  "intake",
  "evidence",
  "rule_match",
  "submission",
  "decision",
  "appeal",
  "closed",
];

export default function DashboardPage() {
  const cases = useCaseStore((s) => s.cases);
  const mounted = useMounted();

  const metrics = useMemo(() => caseMetrics(cases), [cases]);
  const grouped = useMemo(() => {
    const map: Record<CaseStage, typeof cases> = {
      intake: [],
      evidence: [],
      rule_match: [],
      submission: [],
      decision: [],
      appeal: [],
      closed: [],
    };
    for (const c of cases) map[c.stage].push(c);
    return map;
  }, [cases]);

  const actionQueue = useMemo(
    () =>
      cases.filter((c) => c.humanTasks.some((t) => t.status === "open")),
    [cases]
  );

  if (!mounted) {
    return <BoardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Case board</h1>
          <p className="text-sm text-muted-foreground">
            Every prior authorization as a living Maestro Case, from intake to
            appeal.
          </p>
        </div>
        <NewCaseDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          icon={FolderOpen}
          label="Active cases"
          value={String(metrics.active)}
          tone="text-sky-600"
        />
        <MetricCard
          icon={UserCheck}
          label="Awaiting clinician"
          value={String(metrics.awaitingHuman)}
          tone="text-rose-600"
          highlight={metrics.awaitingHuman > 0}
        />
        <MetricCard
          icon={PenLine}
          label="In appeal"
          value={String(metrics.inAppeal)}
          tone="text-amber-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="First-pass approval"
          value={`${metrics.approvalRate}%`}
          tone="text-emerald-600"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Value in appeal"
          value={currency(metrics.valueAtRisk)}
          tone="text-violet-600"
        />
      </div>

      {actionQueue.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
              <UserCheck className="h-4 w-4" />
              Human gate: {actionQueue.length} case
              {actionQueue.length > 1 ? "s" : ""} need a clinician
            </div>
            <div className="flex flex-wrap gap-2">
              {actionQueue.map((c) => (
                <Link key={c.id} href={`/cases/${c.id}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-rose-300 bg-white text-rose-700 hover:bg-rose-100"
                  >
                    {c.id} - {c.patient.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {BOARD_STAGES.map((stage) => (
            <div key={stage} className="w-72 shrink-0">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold">
                  {STAGE_LABELS[stage]}
                </span>
                <Badge variant="muted">{grouped[stage].length}</Badge>
              </div>
              <div className="space-y-3">
                {grouped[stage].length === 0 ? (
                  <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                    No cases
                  </div>
                ) : (
                  grouped[stage].map((c) => <CaseCard key={c.id} c={c} />)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-rose-300 ring-1 ring-rose-200" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <Icon className={`h-4 w-4 ${tone}`} />
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function BoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 w-72 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
