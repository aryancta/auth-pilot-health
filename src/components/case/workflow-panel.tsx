"use client";

import { useState } from "react";
import type { PriorAuthCase } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useCaseStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import {
  Bot,
  Scale,
  Send,
  Gavel,
  PenLine,
  Loader2,
  UserCheck,
  Paperclip,
  CheckCircle2,
} from "lucide-react";

export function WorkflowPanel({ c }: { c: PriorAuthCase }) {
  const store = useCaseStore();
  const busy = useCaseStore((s) => s.busy[c.id]);
  const { toast } = useToast();
  const [decisionPending, setDecisionPending] = useState(false);

  const openSubmissionTask = c.humanTasks.find(
    (t) => t.kind === "submission_approval" && t.status === "open"
  );
  const approvedSubmission = c.humanTasks.find(
    (t) =>
      t.kind === "submission_approval" &&
      (t.status === "approved" || t.status === "overridden")
  );
  const missing = c.ruleMatch.missingItems.length;

  async function handleEvidence() {
    const res = await store.runEvidence(c.id);
    toast({
      title: res.live ? "Evidence extracted (live Claude)" : "Evidence extracted",
      description: res.warning
        ? res.warning
        : "Clinical evidence pulled from the chart.",
    });
  }

  async function handleRuleMatch() {
    await store.runRuleMatch(c.id);
    toast({
      title: "Payer rules matched",
      description: "CrewAI agent scored the case against the payer policy.",
    });
  }

  async function handleAppeal() {
    const res = await store.draftAppeal(c.id);
    toast({
      title: res.live ? "Appeal drafted (live Claude)" : "Appeal drafted",
      description: "Case paused at the human gate for clinician sign-off.",
    });
  }

  function handleDecision(outcome: "approved" | "denied") {
    setDecisionPending(true);
    setTimeout(() => {
      store.recordDecision(c.id, outcome);
      setDecisionPending(false);
      toast({
        variant: outcome === "denied" ? "destructive" : "success",
        title: outcome === "denied" ? "Payer denied" : "Payer approved",
        description:
          outcome === "denied"
            ? "Case auto-advanced to the appeal stage."
            : "Authorization approved.",
      });
    }, 900);
  }

  const steps: React.ReactNode[] = [];

  if (c.evidence.status === "pending") {
    steps.push(
      <ActionRow
        key="evidence"
        icon={Bot}
        title="Run clinical evidence agent"
        desc="Agent Builder agent extracts diagnoses, prior treatments, and documentation from the chart."
        busy={busy === "Extracting clinical evidence"}
        label="Run evidence agent"
        onClick={handleEvidence}
      />
    );
  } else if (c.ruleMatch.status === "pending") {
    steps.push(
      <ActionRow
        key="rulematch"
        icon={Scale}
        title="Run payer-rules agent"
        desc="External CrewAI agent compares the case to the payer medical-necessity policy."
        busy={busy === "Matching payer rules"}
        label="Run rule-matching agent"
        onClick={handleRuleMatch}
      />
    );
  }

  if (
    c.ruleMatch.status === "matched" &&
    missing > 0 &&
    !openSubmissionTask &&
    !approvedSubmission &&
    c.submission.status === "not_submitted"
  ) {
    steps.push(
      <ActionRow
        key="resolve"
        icon={Paperclip}
        title="Resolve missing evidence"
        desc="Attach the documentation the payer policy requires, then re-run the match so the request goes out clean."
        label="Attach missing docs and re-match"
        onClick={() => {
          store.resolveMissingEvidence(c.id);
          toast({
            title: "Missing evidence resolved",
            description: "Documentation attached and the policy re-scored.",
          });
        }}
      />
    );
  }

  if (
    c.ruleMatch.status === "matched" &&
    !openSubmissionTask &&
    !approvedSubmission &&
    c.submission.status === "not_submitted"
  ) {
    steps.push(
      <ActionRow
        key="request"
        icon={UserCheck}
        title="Send to clinician for submission approval"
        desc={
          missing > 0
            ? "Some criteria are still missing. The clinician can approve, override with a note, or send it back."
            : "All criteria met. A clinician must sign off before the robot submits."
        }
        label="Open human gate"
        onClick={() => {
          store.requestSubmissionApproval(c.id);
          toast({
            title: "Routed to clinician",
            description: `Submission approval sent to ${c.clinician}.`,
          });
        }}
      />
    );
  }

  if (openSubmissionTask) {
    steps.push(
      <InfoRow
        key="awaiting-sub"
        icon={UserCheck}
        title="Waiting on the clinician"
        desc="Submission is paused at the human gate. Resolve the task in the Human gate panel."
      />
    );
  }

  if (
    approvedSubmission &&
    c.submission.status === "not_submitted"
  ) {
    steps.push(
      <ActionRow
        key="submit"
        icon={Send}
        title="Submit to payer portal"
        desc="RPA robot files the authorization to the payer portal and begins polling for a status."
        label="Run portal submit robot"
        onClick={() => {
          store.submitToPortal(c.id);
          toast({
            title: "Submitted to portal",
            description: "Portal Submit Robot filed the request.",
          });
        }}
      />
    );
  }

  if (
    c.submission.status === "submitted" &&
    c.decision.outcome === "pending"
  ) {
    steps.push(
      <div
        key="decision"
        className="rounded-lg border p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Gavel className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Poll for payer decision</div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              The status robot is polling the portal. Simulate the determination
              the payer returns.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="success"
                disabled={decisionPending}
                onClick={() => handleDecision("approved")}
              >
                {decisionPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Returns approved
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={decisionPending}
                onClick={() => handleDecision("denied")}
              >
                {decisionPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gavel className="h-4 w-4" />
                )}
                Returns denied
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (
    c.stage === "appeal" &&
    c.decision.outcome === "denied" &&
    c.appeal.status === "none"
  ) {
    steps.push(
      <ActionRow
        key="appeal"
        icon={PenLine}
        title="Draft the appeal letter"
        desc="The appeal agent drafts a citation-backed letter, then Maestro pauses for mandatory clinician sign-off."
        busy={busy === "Drafting appeal letter"}
        label="Draft appeal"
        onClick={handleAppeal}
      />
    );
  }

  if (c.appeal.status === "awaiting_signoff") {
    steps.push(
      <InfoRow
        key="awaiting-appeal"
        icon={UserCheck}
        title="Appeal paused for clinician sign-off"
        desc="By law a clinician must review and sign the appeal before it is sent. Resolve it in the Human gate panel."
      />
    );
  }

  if (steps.length === 0) {
    steps.push(
      <InfoRow
        key="done"
        icon={CheckCircle2}
        title="No agent action pending"
        desc="This stage is complete. Review the audit trail for the full history."
      />
    );
  }

  return <div className="space-y-3">{steps}</div>;
}

function ActionRow({
  icon: Icon,
  title,
  desc,
  label,
  onClick,
  busy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  label: string;
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
          <Button
            size="sm"
            className="mt-3"
            onClick={onClick}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {busy ? "Working..." : label}
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
    </div>
  );
}
