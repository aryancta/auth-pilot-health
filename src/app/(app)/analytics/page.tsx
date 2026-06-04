"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCaseStore } from "@/lib/store";
import { useMounted } from "@/lib/use-mounted";
import { caseMetrics, denialPatterns, currency } from "@/lib/metrics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, ShieldAlert, Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  const cases = useCaseStore((s) => s.cases);
  const mounted = useMounted();

  const metrics = useMemo(() => caseMetrics(cases), [cases]);
  const patterns = useMemo(() => denialPatterns(cases), [cases]);

  if (!mounted) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  const maxPayerDenied = Math.max(1, ...patterns.byPayer.map((p) => p.denied));
  const maxProcDenied = Math.max(1, ...patterns.byProcedure.map((p) => p.denied));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Denial patterns</h1>
        <p className="text-sm text-muted-foreground">
          Where denials cluster, so operations can fix root causes instead of
          chasing one case at a time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          tone="text-emerald-600"
          label="First-pass approval"
          value={`${metrics.approvalRate}%`}
          sub="of decided cases approved on submission"
        />
        <StatCard
          icon={ShieldAlert}
          tone="text-rose-600"
          label="Open denials"
          value={String(metrics.denied)}
          sub="awaiting appeal action"
        />
        <StatCard
          icon={Sparkles}
          tone="text-violet-600"
          label="Overturned on appeal"
          value={String(metrics.overturned)}
          sub={`${currency(metrics.valueRescued)} rescued`}
        />
        <StatCard
          icon={TrendingDown}
          tone="text-amber-600"
          label="Value in appeal now"
          value={currency(metrics.valueAtRisk)}
          sub="at stake across active appeals"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Denials by payer</CardTitle>
            <CardDescription>
              Volume of denied or appealed cases per payer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {patterns.byPayer.map((p) => (
              <div key={p.payer}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{p.payer}</span>
                  <span className="text-muted-foreground">
                    {p.denied} denied / {p.total} total
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-rose-500"
                    style={{ width: `${(p.denied / maxPayerDenied) * 100}%` }}
                  />
                </div>
                {p.overturned > 0 && (
                  <div className="mt-1 text-xs text-emerald-700">
                    {p.overturned} overturned on appeal
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Denials by procedure</CardTitle>
            <CardDescription>
              Which procedures draw the most pushback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {patterns.byProcedure.map((p) => (
              <div key={p.procedure}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{p.procedure}</span>
                  <span className="text-muted-foreground">
                    {p.denied} flagged / {p.total} total
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${(p.denied / maxProcDenied) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-accent/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <div className="font-semibold">Found a pattern worth fixing?</div>
            <p className="text-sm text-muted-foreground">
              Jump back to the board to work the open cases driving these numbers.
            </p>
          </div>
          <Link href="/dashboard">
            <Button>Open case board</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <Icon className={`h-4 w-4 ${tone}`} />
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
