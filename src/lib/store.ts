"use client";

import { create } from "zustand";
import type {
  PriorAuthCase,
  AuditEvent,
  CaseStage,
  HumanTask,
} from "./types";
import { SEED_CASES } from "./seed";
import { buildRuleMatch } from "./agents";
import { getAnthropicKey } from "./settings";

let auditCounter = 100000;
function newAuditId() {
  auditCounter += 1;
  return `aud-live-${auditCounter}`;
}

function logEvent(
  c: PriorAuthCase,
  partial: Omit<AuditEvent, "id" | "at">
): PriorAuthCase {
  const event: AuditEvent = {
    id: newAuditId(),
    at: new Date().toISOString(),
    ...partial,
  };
  return {
    ...c,
    updatedAt: event.at,
    auditTrail: [...c.auditTrail, event],
  };
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  const key = getAnthropicKey();
  if (key) headers["x-user-anthropic-key"] = key;
  return headers;
}

interface CaseState {
  cases: PriorAuthCase[];
  busy: Record<string, string | null>;
  getCase: (id: string) => PriorAuthCase | undefined;
  setBusy: (id: string, label: string | null) => void;
  update: (id: string, fn: (c: PriorAuthCase) => PriorAuthCase) => void;
  addCase: (input: NewCaseInput) => string;
  runEvidence: (id: string) => Promise<{ live: boolean; warning?: string }>;
  runRuleMatch: (id: string) => Promise<void>;
  resolveMissingEvidence: (id: string) => void;
  requestSubmissionApproval: (id: string) => void;
  decideTask: (
    id: string,
    taskId: string,
    decision: "approved" | "rejected" | "overridden",
    note: string
  ) => void;
  submitToPortal: (id: string) => void;
  recordDecision: (id: string, outcome: "approved" | "denied") => void;
  draftAppeal: (id: string) => Promise<{ live: boolean; warning?: string }>;
  setRunState: (id: string, state: PriorAuthCase["runState"]) => void;
  resetDemo: () => void;
}

export interface NewCaseInput {
  patientName: string;
  mrn: string;
  age: number;
  sex: "F" | "M" | "X";
  procedureName: string;
  cpt: string;
  diagnosisName: string;
  icd10: string;
  payerId: string;
  payerName: string;
  plan: string;
  providerName: string;
  urgency: PriorAuthCase["urgency"];
}

let caseSeq = 20500;

function cloneSeed(): PriorAuthCase[] {
  return JSON.parse(JSON.stringify(SEED_CASES)) as PriorAuthCase[];
}

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: cloneSeed(),
  busy: {},

  getCase: (id) => get().cases.find((c) => c.id === id),

  setBusy: (id, label) =>
    set((s) => ({ busy: { ...s.busy, [id]: label } })),

  update: (id, fn) =>
    set((s) => ({
      cases: s.cases.map((c) => (c.id === id ? fn(c) : c)),
    })),

  addCase: (input) => {
    caseSeq += 1;
    const id = `PA-${caseSeq}`;
    const now = new Date().toISOString();
    const newCase: PriorAuthCase = {
      id,
      title: input.procedureName,
      patient: {
        name: input.patientName,
        mrn: input.mrn,
        dob: "1980-01-01",
        age: input.age,
        sex: input.sex,
      },
      procedure: { cpt: input.cpt, name: input.procedureName },
      primaryDiagnosis: { icd10: input.icd10, name: input.diagnosisName },
      payer: { id: input.payerId, name: input.payerName, plan: input.plan },
      referringProvider: {
        name: input.providerName,
        npi: "0000000000",
        specialty: "Referring",
      },
      urgency: input.urgency,
      stage: "intake",
      runState: "running",
      createdAt: now,
      updatedAt: now,
      slaDueAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      coordinator: "Priya Nair",
      clinician: "Dr. Marcus Bell",
      estimatedValue: 1450,
      evidence: {
        status: "pending",
        narrative: "",
        diagnoses: [],
        priorTreatments: [],
        documents: [],
      },
      ruleMatch: {
        status: "pending",
        payerPolicy: "Pending match",
        policyId: "",
        confidence: 0,
        criteria: [],
        missingItems: [],
        readiness: 0,
        framework: "CrewAI payer-rules crew (UiPath governed)",
      },
      submission: { status: "not_submitted" },
      decision: { outcome: "pending" },
      appeal: { status: "none", citations: [] },
      humanTasks: [],
      auditTrail: [
        {
          id: newAuditId(),
          at: now,
          actorKind: "coordinator",
          actor: "Intake",
          action: "Case opened",
          detail: `New prior authorization opened for ${input.procedureName}.`,
          stage: "intake",
        },
      ],
    };
    set((s) => ({ cases: [newCase, ...s.cases] }));
    return id;
  },

  runEvidence: async (id) => {
    const c = get().getCase(id);
    if (!c) return { live: false };
    get().setBusy(id, "Extracting clinical evidence");
    try {
      const res = await fetch("/api/agents/evidence", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ case: c }),
      });
      const data = await res.json();
      get().update(id, (cur) => {
        let next = {
          ...cur,
          stage: "evidence" as CaseStage,
          evidence: data.evidence,
        };
        next = logEvent(next, {
          actorKind: "agent",
          actor: "Clinical Evidence Agent (Agent Builder)",
          action: "Evidence extracted",
          detail: data.live
            ? "Live extraction via Claude on the UiPath AI Trust Layer."
            : "Pulled diagnoses, prior treatments, and documentation using context grounding.",
          stage: "evidence",
        });
        return next;
      });
      return { live: !!data.live, warning: data.warning };
    } finally {
      get().setBusy(id, null);
    }
  },

  runRuleMatch: async (id) => {
    const c = get().getCase(id);
    if (!c) return;
    get().setBusy(id, "Matching payer rules");
    try {
      const res = await fetch("/api/agents/rule-match", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ case: c }),
      });
      const data = await res.json();
      get().update(id, (cur) => {
        let next = {
          ...cur,
          stage: "rule_match" as CaseStage,
          ruleMatch: data.ruleMatch,
        };
        const missing = data.ruleMatch.missingItems.length;
        next = logEvent(next, {
          actorKind: "agent",
          actor: "Payer-Rules Agent (CrewAI)",
          action: "Policy matched",
          detail: `Evaluated against ${data.ruleMatch.payerPolicy}. Readiness ${data.ruleMatch.readiness}%${
            missing ? `, ${missing} item(s) missing.` : ", all criteria met."
          }`,
          stage: "rule_match",
        });
        if (missing > 0) {
          next = logEvent(next, {
            actorKind: "system",
            actor: "Maestro Case Manager",
            action: "Missing-evidence flag raised",
            detail: "Case held before submission until missing evidence is resolved.",
            stage: "rule_match",
          });
        }
        return next;
      });
    } finally {
      get().setBusy(id, null);
    }
  },

  resolveMissingEvidence: (id) => {
    get().update(id, (cur) => {
      const now = new Date().toISOString();
      const missingDocs = cur.ruleMatch.criteria
        .filter((cr) => cr.status === "missing")
        .map((cr, i) => ({
          id: `d-resolve-${i}-${Date.now()}`,
          label: cr.text.includes("X-ray") || cr.text.includes("radiograph")
            ? "X-ray"
            : cr.text.includes("CT")
              ? "Prior CT"
              : "Clinical note",
          value: "Attached by coordinator (synthetic)",
          source: "Records request",
          confidence: 0.95,
        }));
      const withEvidence: PriorAuthCase = {
        ...cur,
        evidence: {
          ...cur.evidence,
          documents: [...cur.evidence.documents, ...missingDocs],
        },
      };
      const ruleMatch = buildRuleMatch(withEvidence);
      let next: PriorAuthCase = { ...withEvidence, ruleMatch };
      next = logEvent(next, {
        actorKind: "coordinator",
        actor: "Priya Nair",
        action: "Missing evidence attached",
        detail: "Coordinator attached the requested documentation and re-ran the payer-rules agent.",
        stage: "rule_match",
      });
      next = logEvent(next, {
        actorKind: "agent",
        actor: "Payer-Rules Agent (CrewAI)",
        action: "Policy re-matched",
        detail: `Readiness now ${ruleMatch.readiness}%. ${
          ruleMatch.missingItems.length ? "Items still missing." : "All criteria met."
        }`,
        stage: "rule_match",
      });
      void now;
      return next;
    });
  },

  requestSubmissionApproval: (id) => {
    get().update(id, (cur) => {
      const task: HumanTask = {
        id: `ht-${id}-sub-${Date.now()}`,
        title: `Approve submission to ${cur.payer.name}`,
        description:
          "Clinician sign-off required before the RPA robot submits to the payer portal.",
        kind: "submission_approval",
        assignee: cur.clinician,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      let next = { ...cur, humanTasks: [...cur.humanTasks, task] };
      next = logEvent(next, {
        actorKind: "system",
        actor: "Maestro Case Manager",
        action: "Human task created",
        detail: `Submission approval routed to ${cur.clinician}.`,
        stage: cur.stage,
      });
      return next;
    });
  },

  decideTask: (id, taskId, decision, note) => {
    get().update(id, (cur) => {
      const now = new Date().toISOString();
      const task = cur.humanTasks.find((t) => t.id === taskId);
      let next = {
        ...cur,
        humanTasks: cur.humanTasks.map((t) =>
          t.id === taskId
            ? { ...t, status: decision, decidedAt: now, note }
            : t
        ),
      };
      if (!task) return next;

      const verb =
        decision === "approved"
          ? "approved"
          : decision === "overridden"
            ? "overrode"
            : "rejected";
      next = logEvent(next, {
        actorKind: "clinician",
        actor: cur.clinician,
        action: `Human gate: ${verb}`,
        detail: `${task.title}. ${note || "No note provided."}`,
        stage: cur.stage,
      });

      if (task.kind === "appeal_signoff" && decision === "approved") {
        next = {
          ...next,
          appeal: {
            ...next.appeal,
            status: "signed",
            signedBy: cur.clinician,
            signedAt: now,
          },
        };
        next = logEvent(next, {
          actorKind: "robot",
          actor: "Appeal Submit Robot (RPA)",
          action: "Appeal submitted",
          detail: "Clinician-signed appeal filed to the payer.",
          stage: "appeal",
        });
        next = { ...next, runState: "running" };
      }
      return next;
    });
  },

  submitToPortal: (id) => {
    get().update(id, (cur) => {
      const ref = `${cur.payer.id.slice(0, 3).toUpperCase()}-AUTH-${Math.floor(
        100000 + Math.random() * 899999
      )}`;
      const now = new Date().toISOString();
      let next: PriorAuthCase = {
        ...cur,
        stage: "submission" as CaseStage,
        submission: {
          status: "submitted" as const,
          portal: `${cur.payer.name} Provider Portal`,
          robot: "Portal Submit Robot",
          portalRef: ref,
          submittedAt: now,
        },
      };
      next = logEvent(next, {
        actorKind: "robot",
        actor: "Portal Submit Robot (RPA)",
        action: "Submitted to portal",
        detail: `Filed to ${cur.payer.name}, reference ${ref}. Polling for status.`,
        stage: "submission",
      });
      return next;
    });
  },

  recordDecision: (id, outcome) => {
    get().update(id, (cur) => {
      const now = new Date().toISOString();
      let next: PriorAuthCase = {
        ...cur,
        stage: outcome === "denied" ? ("appeal" as CaseStage) : ("decision" as CaseStage),
        submission: { ...cur.submission, status: "acknowledged" },
        decision: {
          outcome,
          decidedAt: now,
          reason:
            outcome === "approved"
              ? "Approved. Medical-necessity criteria satisfied."
              : "Payer automated review returned a denial citing insufficient documentation.",
          denialCode: outcome === "denied" ? "MN-204" : undefined,
        },
      };
      next = logEvent(next, {
        actorKind: "robot",
        actor: "Status Poll Robot (RPA)",
        action: `Decision received: ${outcome.toUpperCase()}`,
        detail:
          outcome === "approved"
            ? "Payer approved the authorization."
            : "Payer denied. Case advancing to the appeal stage.",
        stage: outcome === "denied" ? "appeal" : "decision",
      });
      if (outcome === "denied") {
        next = logEvent(next, {
          actorKind: "system",
          actor: "Maestro Case Manager",
          action: "Stage advanced: Appeal",
          detail: "Denial triggered automatic advance to the appeal stage.",
          stage: "appeal",
        });
      }
      return next;
    });
  },

  draftAppeal: async (id) => {
    const c = get().getCase(id);
    if (!c) return { live: false };
    get().setBusy(id, "Drafting appeal letter");
    try {
      const res = await fetch("/api/agents/appeal", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ case: c }),
      });
      const data = await res.json();
      get().update(id, (cur) => {
        const now = new Date().toISOString();
        const task: HumanTask = {
          id: `ht-${id}-appeal-${Date.now()}`,
          title: "Sign off on appeal letter before it is sent",
          description:
            "By law a clinician must review and sign before any appeal is sent to the payer.",
          kind: "appeal_signoff",
          assignee: cur.clinician,
          status: "open",
          createdAt: now,
        };
        let next: PriorAuthCase = {
          ...cur,
          stage: "appeal",
          runState: "waiting_human",
          appeal: {
            status: "awaiting_signoff",
            draftLetter: data.appeal.draftLetter,
            citations: data.appeal.citations,
            draftedAt: now,
          },
          humanTasks: [...cur.humanTasks, task],
        };
        next = logEvent(next, {
          actorKind: "agent",
          actor: "Appeal Drafting Agent",
          action: "Appeal letter drafted",
          detail: data.live
            ? "Live citation-backed draft via Claude. Case paused for clinician sign-off."
            : "Citation-backed appeal drafted. Case paused for clinician sign-off.",
          stage: "appeal",
        });
        next = logEvent(next, {
          actorKind: "system",
          actor: "Maestro Case Manager",
          action: "Case paused (waiting on human)",
          detail: `No outbound action until ${cur.clinician} signs the appeal.`,
          stage: "appeal",
        });
        return next;
      });
      return { live: !!data.live, warning: data.warning };
    } finally {
      get().setBusy(id, null);
    }
  },

  setRunState: (id, state) => {
    get().update(id, (cur) => {
      let next = { ...cur, runState: state };
      const label =
        state === "paused"
          ? "Case paused"
          : state === "running"
            ? "Case resumed"
            : "Case waiting on human";
      next = logEvent(next, {
        actorKind: "system",
        actor: "Supervisor Console",
        action: label,
        detail:
          state === "paused"
            ? "A supervisor paused this Maestro instance."
            : state === "running"
              ? "A supervisor resumed this Maestro instance."
              : "Case is waiting on a human task.",
        stage: cur.stage,
      });
      return next;
    });
  },

  resetDemo: () => set({ cases: cloneSeed(), busy: {} }),
}));
