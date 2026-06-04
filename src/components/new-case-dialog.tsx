"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCaseStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { Plus, FileUp } from "lucide-react";

const REFERRAL_PRESETS = [
  {
    label: "Lumbar MRI - Meridian",
    procedureName: "MRI lumbar spine without contrast",
    cpt: "72148",
    diagnosisName: "Radiculopathy, lumbar region",
    icd10: "M54.16",
    payerId: "meridian",
    payerName: "Meridian Health Plan",
    plan: "Meridian PPO Select",
  },
  {
    label: "Brain MRI - NorthStar",
    procedureName: "MRI brain without contrast",
    cpt: "70551",
    diagnosisName: "Migraine, unspecified",
    icd10: "G43.909",
    payerId: "northstar",
    payerName: "NorthStar Mutual",
    plan: "NorthStar HMO Plus",
  },
  {
    label: "Knee arthroscopy - Gulf Coast",
    procedureName: "Arthroscopy, knee, with meniscectomy",
    cpt: "29881",
    diagnosisName: "Derangement of meniscus, right knee",
    icd10: "M23.205",
    payerId: "gulfcoast",
    payerName: "Gulf Coast Care",
    plan: "Gulf Coast EPO",
  },
];

export function NewCaseDialog() {
  const [open, setOpen] = useState(false);
  const [presetIdx, setPresetIdx] = useState(0);
  const [patientName, setPatientName] = useState("Jordan Avery");
  const [mrn, setMrn] = useState("MRN-600421");
  const [age, setAge] = useState("52");
  const [providerName, setProviderName] = useState("Dr. Lena Ortiz");
  const addCase = useCaseStore((s) => s.addCase);
  const router = useRouter();
  const { toast } = useToast();

  const preset = REFERRAL_PRESETS[presetIdx];

  function handleSubmit() {
    const id = addCase({
      patientName: patientName || "New Patient",
      mrn: mrn || "MRN-000000",
      age: parseInt(age, 10) || 50,
      sex: "F",
      procedureName: preset.procedureName,
      cpt: preset.cpt,
      diagnosisName: preset.diagnosisName,
      icd10: preset.icd10,
      payerId: preset.payerId,
      payerName: preset.payerName,
      plan: preset.plan,
      providerName: providerName || "Referring Provider",
      urgency: "routine",
    });
    setOpen(false);
    toast({
      title: "Case opened",
      description: `${id} created and routed to intake. Run the evidence agent next.`,
    });
    router.push(`/cases/${id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New prior auth
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Drop in a referral</DialogTitle>
          <DialogDescription>
            Open a new prior authorization case. In production an intake robot
            parses the referral PDF. Here, pick a synthetic referral to start.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Referral type</Label>
            <div className="grid gap-2">
              {REFERRAL_PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPresetIdx(i)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    i === presetIdx
                      ? "border-primary bg-accent text-accent-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  <FileUp className="h-4 w-4 shrink-0" />
                  <span>
                    {p.label}
                    <span className="block text-xs text-muted-foreground">
                      {p.procedureName} - CPT {p.cpt}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="patientName">Patient name</Label>
              <Input
                id="patientName"
                name="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mrn">MRN</Label>
              <Input
                id="mrn"
                name="mrn"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider">Referring provider</Label>
              <Input
                id="provider"
                name="provider"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Open case</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
