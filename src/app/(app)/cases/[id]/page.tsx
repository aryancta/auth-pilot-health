"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCaseStore } from "@/lib/store";
import { useMounted } from "@/lib/use-mounted";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_BLURB,
  type CaseStage,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StageBadge,
  UrgencyBadge,
  DecisionBadge,
  RunStateBadge,
  ActorDot,
} from "@/components/status";
import { WorkflowPanel } from "@/components/case/workflow-panel";
import { HumanTaskCard } from "@/components/case/human-task-card";
import { useToast } from "@/components/ui/use-toast";
import { currency } from "@/lib/metrics";
import { formatDateTime, relativeTime } from "@/lib/utils";
import {
  ArrowLeft,
  Pause,
  Play,
  Check,
  AlertTriangle,
  FileText,
  Stethoscope,
  Building2,
  Clock,
} from "lucide-react";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const mounted = useMounted();
  const c = useCaseStore((s) => s.cases.find((x) => x.id === params.id));
  const setRunState = useCaseStore((s) => s.setRunState);
  const { toast } = useToast();

  const sortedAudit = useMemo(
    () =>
      c
        ? [...c.auditTrail].sort(
            (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
          )
        : [],
    [c]
  );

  if (!mounted) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!c) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-xl font-semibold">Case not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This case is not in the current board. It may have been reset.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to case board
          </Button>
        </Link>
      </div>
    );
  }

  const openTasks = c.humanTasks.filter((t) => t.status === "open");
  const resolvedTasks = c.humanTasks.filter((t) => t.status !== "open");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Case board
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {c.id}
            <span>-</span>
            <span>{c.patient.name}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {c.procedure.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StageBadge stage={c.stage} />
            <UrgencyBadge urgency={c.urgency} />
            <DecisionBadge outcome={c.decision.outcome} />
            <RunStateBadge state={c.runState} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {c.runState === "paused" ? (
            <Button
              variant="outline"
              onClick={() => {
                setRunState(c.id, "running");
                toast({ title: "Case resumed", description: `${c.id} is running again.` });
              }}
            >
              <Play className="h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setRunState(c.id, "paused");
                toast({ title: "Case paused", description: `${c.id} paused by supervisor.` });
              }}
            >
              <Pause className="h-4 w-4" />
              Pause instance
            </Button>
          )}
        </div>
      </div>

      <StageTimeline current={c.stage} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
              <CardDescription>
                The case manager agent surfaces the next action for this stage.
                Agents recommend, the clinician decides.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {c.runState === "paused" ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <Pause className="h-4 w-4" />
                  Instance paused. Resume to continue the workflow.
                </div>
              ) : (
                <WorkflowPanel c={c} />
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="evidence">
            <TabsList>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="rules">Rule match</TabsTrigger>
              {c.appeal.status !== "none" && (
                <TabsTrigger value="appeal">Appeal</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="evidence">
              <EvidencePanel c={c} />
            </TabsContent>
            <TabsContent value="rules">
              <RulePanel c={c} />
            </TabsContent>
            {c.appeal.status !== "none" && (
              <TabsContent value="appeal">
                <AppealPanel c={c} />
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className={openTasks.length ? "border-rose-300 ring-1 ring-rose-200" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Human gate
                {openTasks.length > 0 && (
                  <Badge variant="destructive">{openTasks.length} open</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Clinician sign-off required by law before any medical-necessity
                decision is sent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {openTasks.length === 0 && resolvedTasks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No human tasks yet. They appear when the case reaches the
                  submission or appeal gate.
                </p>
              )}
              {openTasks.map((t) => (
                <HumanTaskCard key={t.id} caseId={c.id} task={t} />
              ))}
              {resolvedTasks.map((t) => (
                <HumanTaskCard key={t.id} caseId={c.id} task={t} />
              ))}
            </CardContent>
          </Card>

          <CaseFacts c={c} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Audit trail
          </CardTitle>
          <CardDescription>
            Every recommendation and human decision, timestamped and versioned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l pl-6">
            {sortedAudit.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[1.6rem] top-1 flex h-3 w-3 items-center justify-center">
                  <ActorDot kind={e.actorKind} />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{e.action}</span>
                  <Badge variant="muted" className="text-[10px]">
                    {STAGE_LABELS[e.stage]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{e.detail}</p>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {e.actor} - {formatDateTime(e.at)} ({relativeTime(e.at)})
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function StageTimeline({ current }: { current: CaseStage }) {
  const stages = STAGE_ORDER;
  const currentIdx = stages.indexOf(current);
  return (
    <Card>
      <CardContent className="overflow-x-auto p-4">
        <div className="flex min-w-max items-center gap-1">
          {stages.map((stage, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={stage} className="flex items-center">
                <div className="flex flex-col items-center gap-1 px-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      active
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                        : done
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-[11px] ${
                      active ? "font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
                {i < stages.length - 1 && (
                  <div
                    className={`h-0.5 w-8 ${
                      i < currentIdx ? "bg-success" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {STAGE_BLURB[current]}
        </p>
      </CardContent>
    </Card>
  );
}

function EvidencePanel({ c }: { c: { evidence: import("@/lib/types").ExtractedEvidence } }) {
  const e = c.evidence;
  if (e.status === "pending") {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Evidence has not been extracted yet. Run the clinical evidence agent
          from the Next steps panel.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Extracted clinical evidence
        </CardTitle>
        {e.model && (
          <CardDescription>
            Source model: {e.model}
            {e.extractedAt ? ` - ${relativeTime(e.extractedAt)}` : ""}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Clinical narrative
          </div>
          <p className="mt-1 text-sm">{e.narrative}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Diagnoses
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {e.diagnoses.map((d) => (
                <li key={d.icd10}>
                  <span className="font-mono text-xs text-muted-foreground">
                    {d.icd10}
                  </span>{" "}
                  {d.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Prior treatments
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {e.priorTreatments.map((t) => (
                <li key={t.id}>
                  <span className="font-medium">{t.label}:</span> {t.value}
                </li>
              ))}
              {e.priorTreatments.length === 0 && (
                <li className="text-muted-foreground">None documented</li>
              )}
            </ul>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Supporting documentation
          </div>
          <div className="mt-2 space-y-2">
            {e.documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{d.label}:</span> {d.value}
                  <div className="text-xs text-muted-foreground">{d.source}</div>
                </div>
                <Badge variant="muted">{Math.round(d.confidence * 100)}%</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RulePanel({ c }: { c: import("@/lib/types").PriorAuthCase }) {
  const r = c.ruleMatch;
  if (r.status === "pending") {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Rules have not been matched yet. Run the payer-rules agent from the
          Next steps panel.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{r.payerPolicy}</span>
          <Badge variant={r.readiness === 100 ? "success" : "warning"}>
            {r.readiness}% ready
          </Badge>
        </CardTitle>
        <CardDescription>
          {r.policyId} - matched by {r.framework} - confidence{" "}
          {Math.round(r.confidence * 100)}%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {r.criteria.map((cr) => (
          <div
            key={cr.id}
            className={`rounded-md border p-3 ${
              cr.status === "missing" ? "border-amber-300 bg-amber-50/60" : ""
            }`}
          >
            <div className="flex items-start gap-2">
              {cr.status === "met" ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              )}
              <div>
                <div className="text-sm font-medium">{cr.text}</div>
                <p className="text-sm text-muted-foreground">{cr.rationale}</p>
                {cr.citation && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {cr.citation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {r.missingItems.length > 0 && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            <span className="font-semibold">Missing before clean submission:</span>
            <ul className="mt-1 list-inside list-disc">
              {r.missingItems.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AppealPanel({ c }: { c: import("@/lib/types").PriorAuthCase }) {
  const a = c.appeal;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Appeal letter</span>
          <Badge
            variant={
              a.status === "awaiting_signoff"
                ? "destructive"
                : a.status === "signed" || a.status === "overturned"
                  ? "success"
                  : "muted"
            }
          >
            {a.status === "awaiting_signoff"
              ? "Awaiting sign-off"
              : a.status === "signed"
                ? "Signed and sent"
                : a.status === "overturned"
                  ? "Overturned (won)"
                  : a.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          {a.signedBy
            ? `Signed by ${a.signedBy}`
            : "Drafted by the appeal agent, pending clinician sign-off."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border bg-secondary/30 p-4 text-xs leading-relaxed">
          {a.draftLetter}
        </pre>
        {a.citations.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Citations
            </div>
            <ul className="mt-1 space-y-1 text-sm">
              {a.citations.map((cit) => (
                <li key={cit} className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {cit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CaseFacts({ c }: { c: import("@/lib/types").PriorAuthCase }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Case facts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Fact icon={Stethoscope} label="Patient">
          {c.patient.name} - {c.patient.age}
          {c.patient.sex}, {c.patient.mrn}
        </Fact>
        <Fact icon={FileText} label="Procedure">
          {c.procedure.name}
          <div className="text-xs text-muted-foreground">CPT {c.procedure.cpt}</div>
        </Fact>
        <Fact icon={FileText} label="Diagnosis">
          {c.primaryDiagnosis.name}
          <div className="text-xs text-muted-foreground">
            {c.primaryDiagnosis.icd10}
          </div>
        </Fact>
        <Fact icon={Building2} label="Payer">
          {c.payer.name}
          <div className="text-xs text-muted-foreground">{c.payer.plan}</div>
        </Fact>
        <Fact icon={Stethoscope} label="Referring provider">
          {c.referringProvider.name}
          <div className="text-xs text-muted-foreground">
            {c.referringProvider.specialty}
          </div>
        </Fact>
        <div className="grid grid-cols-2 gap-3 border-t pt-3">
          <div>
            <div className="text-xs text-muted-foreground">Coordinator</div>
            <div>{c.coordinator}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Clinician</div>
            <div>{c.clinician}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Estimated value</div>
            <div>{currency(c.estimatedValue)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">SLA due</div>
            <div>{relativeTime(c.slaDueAt)}</div>
          </div>
        </div>
        {c.submission.portalRef && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground">Portal reference</div>
            <div className="font-mono text-xs">{c.submission.portalRef}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
