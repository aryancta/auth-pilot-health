export type CaseStage =
  | "intake"
  | "evidence"
  | "rule_match"
  | "submission"
  | "decision"
  | "appeal"
  | "closed";

export type Urgency = "routine" | "urgent" | "expedited";

export type DecisionOutcome = "pending" | "approved" | "denied" | "partial";

export type AppealStatus =
  | "none"
  | "drafting"
  | "awaiting_signoff"
  | "signed"
  | "submitted"
  | "overturned"
  | "upheld";

export type ActorKind =
  | "agent"
  | "robot"
  | "clinician"
  | "coordinator"
  | "system";

export type CaseRunState = "running" | "paused" | "waiting_human";

export interface Patient {
  name: string;
  mrn: string;
  dob: string;
  age: number;
  sex: "F" | "M" | "X";
}

export interface Procedure {
  cpt: string;
  name: string;
  site?: string;
}

export interface Diagnosis {
  icd10: string;
  name: string;
}

export interface Provider {
  name: string;
  npi: string;
  specialty: string;
}

export interface Payer {
  id: string;
  name: string;
  plan: string;
}

export interface EvidenceItem {
  id: string;
  label: string;
  value: string;
  source: string;
  confidence: number;
}

export interface ExtractedEvidence {
  status: "pending" | "extracted";
  narrative: string;
  diagnoses: Diagnosis[];
  priorTreatments: EvidenceItem[];
  documents: EvidenceItem[];
  extractedAt?: string;
  model?: string;
}

export interface RuleCriterion {
  id: string;
  text: string;
  status: "met" | "missing" | "partial";
  rationale: string;
  citation?: string;
}

export interface RuleMatchResult {
  status: "pending" | "matched";
  payerPolicy: string;
  policyId: string;
  confidence: number;
  criteria: RuleCriterion[];
  missingItems: string[];
  readiness: number;
  framework: string;
  matchedAt?: string;
}

export interface SubmissionInfo {
  status: "not_submitted" | "submitting" | "submitted" | "acknowledged";
  portalRef?: string;
  submittedAt?: string;
  portal?: string;
  robot?: string;
}

export interface DecisionInfo {
  outcome: DecisionOutcome;
  reason?: string;
  denialCode?: string;
  decidedAt?: string;
}

export interface AppealInfo {
  status: AppealStatus;
  draftLetter?: string;
  citations: string[];
  draftedAt?: string;
  signedBy?: string;
  signedAt?: string;
}

export interface HumanTask {
  id: string;
  title: string;
  description: string;
  kind: "submission_approval" | "appeal_signoff" | "evidence_review";
  assignee: string;
  status: "open" | "approved" | "rejected" | "overridden";
  createdAt: string;
  decidedAt?: string;
  note?: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actorKind: ActorKind;
  actor: string;
  action: string;
  detail: string;
  stage: CaseStage;
}

export interface PriorAuthCase {
  id: string;
  title: string;
  patient: Patient;
  procedure: Procedure;
  primaryDiagnosis: Diagnosis;
  payer: Payer;
  referringProvider: Provider;
  urgency: Urgency;
  stage: CaseStage;
  runState: CaseRunState;
  createdAt: string;
  updatedAt: string;
  slaDueAt: string;
  coordinator: string;
  clinician: string;
  estimatedValue: number;
  evidence: ExtractedEvidence;
  ruleMatch: RuleMatchResult;
  submission: SubmissionInfo;
  decision: DecisionInfo;
  appeal: AppealInfo;
  humanTasks: HumanTask[];
  auditTrail: AuditEvent[];
}

export const STAGE_ORDER: CaseStage[] = [
  "intake",
  "evidence",
  "rule_match",
  "submission",
  "decision",
  "appeal",
  "closed",
];

export const STAGE_LABELS: Record<CaseStage, string> = {
  intake: "Intake",
  evidence: "Evidence Gathering",
  rule_match: "Rule Matching",
  submission: "Submission",
  decision: "Decision",
  appeal: "Appeal",
  closed: "Closed",
};

export const STAGE_BLURB: Record<CaseStage, string> = {
  intake: "Referral received, case opened",
  evidence: "Clinical evidence agent extracting the chart",
  rule_match: "Payer-rules agent checking medical necessity",
  submission: "RPA robot filing to the payer portal",
  decision: "Awaiting or recording the payer determination",
  appeal: "Drafting and signing a citation-backed appeal",
  closed: "Resolved and archived with full audit trail",
};
