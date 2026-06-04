import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  FileSearch,
  Scale,
  Send,
  Gavel,
  PenLine,
  ArrowRight,
  Bot,
  UserCheck,
  ClipboardList,
} from "lucide-react";

const STAGES = [
  { icon: ClipboardList, name: "Intake", text: "Referral lands, an RPA robot opens a Maestro Case." },
  { icon: FileSearch, name: "Evidence", text: "Agent Builder agent extracts diagnoses and chart evidence." },
  { icon: Scale, name: "Rule match", text: "CrewAI agent checks payer criteria and flags gaps." },
  { icon: Send, name: "Submission", text: "Robot files to the portal after clinician sign-off." },
  { icon: Gavel, name: "Decision", text: "Robot polls for the payer determination." },
  { icon: PenLine, name: "Appeal", text: "Agent drafts a citation-backed appeal, clinician signs." },
];

const STATS = [
  { value: "< 12%", label: "of denials are ever appealed today" },
  { value: "3 of 4", label: "health plans already use AI for prior auth" },
  { value: "Hours", label: "of staff time lost per case on portals and calls" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Wordmark />
          <nav className="ml-auto flex items-center gap-2">
            <Link href="/analytics" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Denial patterns
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                Settings
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Open case board</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-5 gap-1.5 border-primary/30 text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                UiPath AgentHack - Maestro Case
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Prior authorization that keeps a clinician in charge of every denial.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Auth Pilot Health runs every prior auth as a living case. Agents
                extract the chart, match payer rules, and draft appeals, while a
                mandatory human gate keeps every medical-necessity decision legal,
                auditable, and yours.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button size="lg" variant="outline">
                    See denial patterns
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Runs out of the box with seeded synthetic patients. Add your own
                Anthropic key in Settings to see live extraction and drafting.
              </p>
            </div>

            <div className="relative">
              <HeroPanel />
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="text-3xl font-bold text-primary">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            One case, six stages, always governed
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Each request moves through the full lifecycle as a Maestro Case. The
            case manager agent coordinates stage agents, RPA robots, and the
            people who stay accountable for the outcome.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.name}
                  className="rounded-xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Stage {i + 1}
                    </div>
                  </div>
                  <div className="mt-3 font-semibold">{stage.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{stage.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4 gap-1.5 border-rose-300 text-rose-700">
                <UserCheck className="h-3.5 w-3.5" />
                The human gate is the feature
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tight">
                Compliance by design, not as an afterthought
              </h2>
              <p className="mt-3 text-muted-foreground">
                2025 laws in Texas, Arizona, and Maryland prohibit an automated
                system from being the sole basis for a medical-necessity denial,
                and CMS&apos;s WISeR model brings AI prior auth to Medicare in
                January 2026. Auth Pilot Health is built around that mandate: the
                case pauses at a human task before anything is submitted or
                appealed, and every step is logged in an audit trail you can
                replay.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {[
                  "Maestro pauses for a clinician before submission and before any appeal is sent",
                  "Every agent recommendation and human decision is timestamped and versioned",
                  "Supervisors can pause, resume, and inspect any live case instance",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href="/dashboard">
                  <Button className="gap-2">
                    Walk a case end to end
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <ArchitectureDiagram />
          </div>
        </div>
      </section>

      <footer className="border-t bg-secondary/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
          <Wordmark />
          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground sm:ml-auto">
            <Link href="/dashboard" className="hover:text-foreground">
              Case board
            </Link>
            <Link href="/analytics" className="hover:text-foreground">
              Denial patterns
            </Link>
            <Link href="/settings" className="hover:text-foreground">
              Settings
            </Link>
          </nav>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted-foreground sm:px-6">
          Built for UiPath AgentHack. All patients, payers, and policies shown
          are synthetic and for demonstration only.
        </div>
      </footer>
    </div>
  );
}

function HeroPanel() {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          PA-20455 - Brain MRI
        </div>
        <Badge variant="outline" className="border-rose-300 text-rose-700">
          Appeal stage
        </Badge>
      </div>
      <div className="mt-4 space-y-3">
        {[
          { icon: Bot, who: "Clinical Evidence Agent", what: "Extracted papilledema + focal deficit", tone: "text-indigo-600" },
          { icon: Scale, who: "Payer-Rules Agent", what: "All 3 criteria met against NEU-009", tone: "text-indigo-600" },
          { icon: Gavel, who: "Status Poll Robot", what: "Payer auto-denied: code MN-204", tone: "text-amber-600" },
          { icon: PenLine, who: "Appeal Agent", what: "Drafted citation-backed appeal", tone: "text-indigo-600" },
        ].map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.who}
              className="flex items-center gap-3 rounded-lg border bg-background p-3"
            >
              <Icon className={`h-4 w-4 ${row.tone}`} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{row.who}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {row.what}
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-3 rounded-lg border-2 border-rose-300 bg-rose-50 p-3">
          <UserCheck className="h-4 w-4 text-rose-600" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-rose-800">
              Paused: clinician sign-off required
            </div>
            <div className="text-xs text-rose-700">
              Dr. Helen Yoo must approve before the appeal is sent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Orchestration under one governance layer
      </div>
      <svg viewBox="0 0 360 260" className="mt-3 w-full" role="img" aria-label="Architecture diagram">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="hsl(215 16% 47%)" />
          </marker>
        </defs>
        <rect x="10" y="10" width="340" height="240" rx="12" fill="hsl(187 60% 96%)" stroke="hsl(187 92% 26%)" strokeOpacity="0.3" />
        <text x="24" y="32" fontSize="11" fontWeight="700" fill="hsl(187 92% 22%)">
          UiPath Maestro Case
        </text>

        <g fontSize="10" fill="hsl(222 47% 18%)" textAnchor="middle">
          <rect x="30" y="48" width="120" height="40" rx="8" fill="white" stroke="hsl(214 32% 80%)" />
          <text x="90" y="66">Evidence Agent</text>
          <text x="90" y="79" fill="hsl(215 16% 47%)">Agent Builder</text>

          <rect x="210" y="48" width="120" height="40" rx="8" fill="white" stroke="hsl(214 32% 80%)" />
          <text x="270" y="66">Payer-Rules Agent</text>
          <text x="270" y="79" fill="hsl(215 16% 47%)">CrewAI (external)</text>

          <rect x="30" y="150" width="120" height="40" rx="8" fill="white" stroke="hsl(214 32% 80%)" />
          <text x="90" y="168">RPA Robots</text>
          <text x="90" y="181" fill="hsl(215 16% 47%)">Portal + polling</text>

          <rect x="210" y="150" width="120" height="40" rx="8" fill="hsl(346 77% 95%)" stroke="hsl(346 77% 60%)" />
          <text x="270" y="168" fill="hsl(346 77% 35%)" fontWeight="700">Human Gate</text>
          <text x="270" y="181" fill="hsl(346 60% 45%)">Clinician sign-off</text>
        </g>

        <line x1="90" y1="88" x2="90" y2="150" stroke="hsl(215 16% 47%)" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="150" y1="68" x2="210" y2="68" stroke="hsl(215 16% 47%)" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="270" y1="88" x2="270" y2="150" stroke="hsl(215 16% 47%)" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="210" y1="170" x2="150" y2="170" stroke="hsl(215 16% 47%)" strokeWidth="1.5" markerEnd="url(#arrow)" />

        <text x="180" y="226" fontSize="10" textAnchor="middle" fill="hsl(215 16% 47%)">
          Audit trail logs every step and decision
        </text>
      </svg>
    </div>
  );
}
