import type {
  PriorAuthCase,
  ExtractedEvidence,
  RuleMatchResult,
  RuleCriterion,
} from "./types";
import { findPolicy } from "./payer-rules";

// Deterministic synthetic evidence so the demo always tells the same story.
export function buildEvidence(c: PriorAuthCase): ExtractedEvidence {
  const cpt = c.procedure.cpt;
  const now = new Date().toISOString();
  const base: ExtractedEvidence = {
    status: "extracted",
    model: "Claude via UiPath AI Trust Layer",
    extractedAt: now,
    narrative: "",
    diagnoses: [c.primaryDiagnosis],
    priorTreatments: [],
    documents: [],
  };

  if (cpt === "72148" || cpt === "72146" || cpt === "72141") {
    base.narrative = `${c.patient.age}-year-old ${
      c.patient.sex === "F" ? "female" : "male"
    } with progressive low back pain and radicular symptoms over 9 weeks. Conservative therapy attempted. Neurologic findings on exam support advanced imaging.`;
    base.diagnoses = [
      c.primaryDiagnosis,
      { icd10: "M54.16", name: "Radiculopathy, lumbar region" },
    ];
    base.priorTreatments = [
      { id: "t1", label: "Physical therapy", value: "8 weeks documented", source: "PT discharge summary", confidence: 0.95 },
      { id: "t2", label: "NSAID trial", value: "Naproxen 500mg BID x 4 weeks", source: "Medication list", confidence: 0.92 },
    ];
    base.documents = [
      { id: "d1", label: "Neuro exam", value: "Positive straight-leg raise, diminished reflex", source: "Progress note", confidence: 0.9 },
      { id: "d2", label: "Pain duration", value: "9 weeks, progressive", source: "Progress note", confidence: 0.94 },
    ];
  } else if (cpt === "70551" || cpt === "70553") {
    base.narrative = `${c.patient.age}-year-old ${
      c.patient.sex === "F" ? "female" : "male"
    } with new progressive neurologic symptoms. Prior imaging reviewed. Initial management attempted with partial response.`;
    base.priorTreatments = [
      { id: "t1", label: "Medication trial", value: "Documented, partial response", source: "Medication list", confidence: 0.9 },
    ];
    base.documents = [
      { id: "d1", label: "Prior CT", value: "Reviewed and documented", source: "Radiology report", confidence: 0.95 },
      { id: "d2", label: "Neuro exam", value: "Focal findings documented", source: "Neurology note", confidence: 0.88 },
    ];
  } else if (cpt === "29881" || cpt === "29880" || cpt === "27447") {
    base.narrative = `${c.patient.age}-year-old ${
      c.patient.sex === "F" ? "female" : "male"
    } with mechanical joint pain and imaging-confirmed structural pathology. Conservative therapy attempted with functional limitation on exam.`;
    base.priorTreatments = [
      { id: "t1", label: "Physical therapy", value: "7 weeks", source: "PT note", confidence: 0.95 },
      { id: "t2", label: "Injection", value: "Corticosteroid injection", source: "Procedure note", confidence: 0.93 },
    ];
    base.documents = [
      { id: "d1", label: "Imaging", value: "Structural pathology confirmed", source: "Radiology report", confidence: 0.97 },
      { id: "d2", label: "Functional limitation", value: "Locking and instability", source: "Ortho note", confidence: 0.9 },
    ];
  } else {
    base.narrative = `${c.patient.age}-year-old ${
      c.patient.sex === "F" ? "female" : "male"
    }. Clinical evidence extracted from the chart for the requested procedure.`;
    base.documents = [
      { id: "d1", label: "Clinical note", value: "Indication documented", source: "Progress note", confidence: 0.85 },
    ];
  }
  return base;
}

const KEY_TO_LABEL: Record<string, string> = {
  conservative_therapy: "Physical therapy",
  physical_therapy: "Physical therapy",
  neuro_exam: "Neuro exam",
  radiculopathy: "Neuro exam",
  xray: "X-ray",
  radiograph: "X-ray",
  ct: "Prior CT",
  prior_imaging: "Prior CT",
  headache: "Neuro exam",
  seizure: "Neuro exam",
  medication_trial: "Medication trial",
  mri: "Imaging",
  imaging_confirmation: "Imaging",
  injection: "Injection",
  functional_limitation: "Functional limitation",
  exam_findings: "Functional limitation",
  pathology: "Pathology",
  biopsy: "Pathology",
  staging: "Imaging",
  guideline_alignment: "Imaging",
  labs: "Clinical note",
  performance_status: "Clinical note",
}; // maps policy evidence keys to extracted evidence labels

export function buildRuleMatch(c: PriorAuthCase): RuleMatchResult {
  const policy = findPolicy(c.payer.id, c.procedure.cpt);
  const evidenceLabels = new Set(
    [
      ...c.evidence.priorTreatments.map((t) => t.label),
      ...c.evidence.documents.map((d) => d.label),
    ].map((l) => l.toLowerCase())
  );

  if (!policy) {
    return {
      status: "matched",
      payerPolicy: "General medical-necessity review",
      policyId: "GEN-000",
      framework: "CrewAI payer-rules crew (UiPath governed)",
      confidence: 0.75,
      readiness: 80,
      matchedAt: new Date().toISOString(),
      criteria: [],
      missingItems: [],
    };
  }

  const criteria: RuleCriterion[] = policy.criteria.map((tpl) => {
    const satisfied = tpl.evidenceKeys.some((k) => {
      const label = KEY_TO_LABEL[k];
      return label && evidenceLabels.has(label.toLowerCase());
    });
    return {
      id: tpl.id,
      text: tpl.text,
      status: satisfied ? "met" : "missing",
      rationale: satisfied
        ? `Supported by extracted evidence. ${tpl.rationale}`
        : `No supporting evidence found in the chart. ${tpl.rationale}`,
      citation: tpl.citation,
    };
  });

  const missingItems = criteria
    .filter((c) => c.status === "missing")
    .map((c) => c.text);
  const metCount = criteria.filter((c) => c.status === "met").length;
  const readiness = Math.round((metCount / criteria.length) * 100);

  return {
    status: "matched",
    payerPolicy: policy.title,
    policyId: policy.policyId,
    framework: "CrewAI payer-rules crew (UiPath governed)",
    confidence: 0.8 + (readiness / 100) * 0.18,
    readiness,
    matchedAt: new Date().toISOString(),
    criteria,
    missingItems,
  };
}

export function buildAppealLetter(c: PriorAuthCase): {
  draftLetter: string;
  citations: string[];
} {
  const metCriteria = c.ruleMatch.criteria.filter((cr) => cr.status === "met");
  const citations = [
    ...metCriteria.map((cr) => cr.citation || "").filter(Boolean),
    "ACR Appropriateness Criteria for the requested study",
  ];
  const evidenceLines = c.evidence.documents
    .map((d) => `- ${d.label}: ${d.value}`)
    .join("\n");

  const draftLetter = `RE: Appeal of Prior Authorization Denial - ${c.patient.name}, ${c.patient.mrn}
Authorization reference: ${c.submission.portalRef || "pending"}
Procedure: ${c.procedure.name} (CPT ${c.procedure.cpt})

Dear Medical Director,

We respectfully appeal the denial of the above prior authorization. ${
    c.decision.reason ||
    "The determination did not fully account for the documented clinical evidence."
  }

The medical record satisfies the applicable medical-necessity criteria under ${
    c.ruleMatch.payerPolicy
  } (${c.ruleMatch.policyId}):
${evidenceLines || "- Clinical findings documented in the chart"}

Each criterion below was reviewed against the record:
${metCriteria.map((cr) => `- ${cr.text}: ${cr.rationale}`).join("\n")}

Delaying this medically necessary service risks avoidable harm. We ask that the denial be overturned and the authorization approved.

This appeal was prepared for clinician review and is pending sign-off before submission.

Sincerely,
Utilization Review, on behalf of ${c.referringProvider.name}`;

  return { draftLetter, citations };
}
