export interface PolicyCriterionTemplate {
  id: string;
  text: string;
  rationale: string;
  citation: string;
  evidenceKeys: string[];
}

export interface PayerPolicy {
  policyId: string;
  payerId: string;
  payerName: string;
  procedureMatch: string[];
  title: string;
  criteria: PolicyCriterionTemplate[];
}

// Synthetic medical-necessity policies modeled on public payer criteria.
// These are illustrative only and use no real patient or proprietary data.
export const PAYER_POLICIES: PayerPolicy[] = [
  {
    policyId: "MERIDIAN-RAD-014",
    payerId: "meridian",
    payerName: "Meridian Health Plan",
    procedureMatch: ["72148", "72146", "72141"],
    title: "Advanced Imaging - MRI of the Spine",
    criteria: [
      {
        id: "c1",
        text: "Conservative therapy of at least 6 weeks documented and failed",
        rationale:
          "Plan requires a trial of physical therapy, NSAIDs, or activity modification before advanced imaging.",
        citation: "Meridian Medical Policy RAD-014 section 3.2",
        evidenceKeys: ["conservative_therapy", "physical_therapy"],
      },
      {
        id: "c2",
        text: "Neurologic deficit or red-flag symptom documented",
        rationale:
          "Progressive weakness, radiculopathy, or red-flag findings justify imaging.",
        citation: "Meridian Medical Policy RAD-014 section 3.3",
        evidenceKeys: ["neuro_exam", "radiculopathy"],
      },
      {
        id: "c3",
        text: "Recent radiographs (X-ray) on file within 60 days",
        rationale:
          "Plain films must precede MRI unless a red-flag emergency exists.",
        citation: "Meridian Medical Policy RAD-014 section 4.1",
        evidenceKeys: ["xray", "radiograph"],
      },
    ],
  },
  {
    policyId: "NORTHSTAR-NEU-009",
    payerId: "northstar",
    payerName: "NorthStar Mutual",
    procedureMatch: ["70551", "70553"],
    title: "MRI of the Brain - Medical Necessity",
    criteria: [
      {
        id: "c1",
        text: "Documented new or progressive neurologic symptoms",
        rationale: "Headache with red flags, focal deficit, or seizure onset.",
        citation: "NorthStar Policy NEU-009 section 2.1",
        evidenceKeys: ["neuro_exam", "headache", "seizure"],
      },
      {
        id: "c2",
        text: "Prior CT or imaging reviewed and documented",
        rationale: "Prior imaging avoids duplicate studies.",
        citation: "NorthStar Policy NEU-009 section 2.4",
        evidenceKeys: ["ct", "prior_imaging"],
      },
      {
        id: "c3",
        text: "Failure of initial management where applicable",
        rationale: "Symptomatic management trial documented when indicated.",
        citation: "NorthStar Policy NEU-009 section 3.0",
        evidenceKeys: ["conservative_therapy", "medication_trial"],
      },
    ],
  },
  {
    policyId: "GULFCOAST-ORT-022",
    payerId: "gulfcoast",
    payerName: "Gulf Coast Care",
    procedureMatch: ["29881", "29880", "27447"],
    title: "Knee Arthroscopy and Joint Procedures",
    criteria: [
      {
        id: "c1",
        text: "MRI or imaging confirming structural pathology",
        rationale: "Meniscal tear or loose body confirmed on imaging.",
        citation: "Gulf Coast Policy ORT-022 section 1.2",
        evidenceKeys: ["mri", "imaging_confirmation"],
      },
      {
        id: "c2",
        text: "Conservative therapy trial of 6 weeks documented",
        rationale: "PT, bracing, or injections attempted first.",
        citation: "Gulf Coast Policy ORT-022 section 2.1",
        evidenceKeys: ["conservative_therapy", "injection", "physical_therapy"],
      },
      {
        id: "c3",
        text: "Functional limitation documented on exam",
        rationale: "Locking, instability, or persistent pain affecting function.",
        citation: "Gulf Coast Policy ORT-022 section 2.3",
        evidenceKeys: ["functional_limitation", "exam_findings"],
      },
    ],
  },
  {
    policyId: "EVERGREEN-ONC-031",
    payerId: "evergreen",
    payerName: "Evergreen Assurance",
    procedureMatch: ["J9271", "96413", "77301"],
    title: "Oncology Infusion and Radiation Planning",
    criteria: [
      {
        id: "c1",
        text: "Pathology-confirmed diagnosis on file",
        rationale: "Biopsy or pathology report supporting the indication.",
        citation: "Evergreen Policy ONC-031 section 1.1",
        evidenceKeys: ["pathology", "biopsy"],
      },
      {
        id: "c2",
        text: "Regimen consistent with NCCN guideline category",
        rationale: "Requested agent aligns with compendia for the indication.",
        citation: "Evergreen Policy ONC-031 section 2.2",
        evidenceKeys: ["staging", "guideline_alignment"],
      },
      {
        id: "c3",
        text: "Baseline labs and performance status documented",
        rationale: "Organ function and ECOG status support treatment.",
        citation: "Evergreen Policy ONC-031 section 3.0",
        evidenceKeys: ["labs", "performance_status"],
      },
    ],
  },
];

export function findPolicy(payerId: string, cpt: string): PayerPolicy | null {
  return (
    PAYER_POLICIES.find(
      (p) => p.payerId === payerId && p.procedureMatch.includes(cpt)
    ) ||
    PAYER_POLICIES.find((p) => p.procedureMatch.includes(cpt)) ||
    null
  );
}
