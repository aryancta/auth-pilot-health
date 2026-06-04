"use client";

import { useState } from "react";
import type { HumanTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCaseStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { relativeTime } from "@/lib/utils";
import { UserCheck, Check, X, ShieldAlert } from "lucide-react";

export function HumanTaskCard({
  caseId,
  task,
}: {
  caseId: string;
  task: HumanTask;
}) {
  const decideTask = useCaseStore((s) => s.decideTask);
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<null | "approve" | "reject" | "override">(
    null
  );

  const isOpen = task.status === "open";

  function submit(decision: "approved" | "rejected" | "overridden") {
    decideTask(caseId, task.id, decision, note.trim());
    setMode(null);
    setNote("");
    toast({
      variant: decision === "rejected" ? "destructive" : "success",
      title:
        decision === "approved"
          ? "Signed off"
          : decision === "overridden"
            ? "Overridden with note"
            : "Sent back",
      description: `${task.title} - logged to the audit trail.`,
    });
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        isOpen ? "border-rose-300 bg-rose-50/60" : "bg-secondary/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isOpen ? "bg-rose-100 text-rose-700" : "bg-muted text-muted-foreground"
          }`}
        >
          {task.kind === "appeal_signoff" ? (
            <ShieldAlert className="h-4 w-4" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{task.title}</span>
            <TaskStatusBadge status={task.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {task.description}
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            Assigned to {task.assignee} - opened {relativeTime(task.createdAt)}
          </div>

          {!isOpen && task.note && (
            <div className="mt-2 rounded-md bg-background p-2 text-xs">
              <span className="font-medium">Clinician note: </span>
              {task.note}
            </div>
          )}

          {isOpen && mode === null && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="success" onClick={() => setMode("approve")}>
                <Check className="h-4 w-4" />
                {task.kind === "appeal_signoff" ? "Review and sign" : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMode("override")}
              >
                <ShieldAlert className="h-4 w-4" />
                Override
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMode("reject")}
              >
                <X className="h-4 w-4" />
                Send back
              </Button>
            </div>
          )}

          {isOpen && mode !== null && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder={
                  mode === "override"
                    ? "Document your clinical reasoning for overriding the recommendation (required for audit)."
                    : "Add a note for the audit trail (optional)."
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={mode === "reject" ? "destructive" : "success"}
                  disabled={mode === "override" && note.trim().length === 0}
                  onClick={() =>
                    submit(
                      mode === "approve"
                        ? "approved"
                        : mode === "override"
                          ? "overridden"
                          : "rejected"
                    )
                  }
                >
                  Confirm{" "}
                  {mode === "approve"
                    ? "sign-off"
                    : mode === "override"
                      ? "override"
                      : "send back"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setMode(null);
                    setNote("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: HumanTask["status"] }) {
  if (status === "open") return <Badge variant="destructive">Open</Badge>;
  if (status === "approved") return <Badge variant="success">Approved</Badge>;
  if (status === "overridden") return <Badge variant="warning">Overridden</Badge>;
  return <Badge variant="muted">Sent back</Badge>;
}
