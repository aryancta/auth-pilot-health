"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useMounted } from "@/lib/use-mounted";
import { loadKeys, saveKeys, clearKeys, type ApiKeys } from "@/lib/settings";
import {
  KeyRound,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const mounted = useMounted();
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeys>({ anthropic: "" });
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKeys(loadKeys());
  }, []);

  if (!mounted) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  const hasKey = keys.anthropic.trim().length > 0;

  function handleSave() {
    saveKeys({ anthropic: keys.anthropic.trim() });
    setSaved(true);
    toast({
      variant: "success",
      title: "Settings saved",
      description: hasKey
        ? "Live agent calls are enabled in this browser."
        : "Running in demo mode with seeded data.",
    });
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    clearKeys();
    setKeys({ anthropic: "" });
    toast({ title: "Key cleared", description: "Back to demo mode." });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Connect your own model key to run agents live. Everything works
          without one in demo mode.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Anthropic Claude API key
          </CardTitle>
          <CardDescription>
            Sponsored by the hackathon through the UiPath AI Trust Layer. Leave
            blank for demo mode. Powers live clinical-evidence narration and
            appeal-letter drafting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm">
              {hasKey ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Live mode active</span>
                </>
              ) : (
                <>
                  <Badge variant="muted">Demo mode</Badge>
                  <span className="text-muted-foreground">
                    Using seeded synthetic data
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="anthropic-key">API key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="anthropic-key"
                  name="anthropic-key"
                  type={show ? "text" : "password"}
                  placeholder="sk-ant-..."
                  value={keys.anthropic}
                  onChange={(e) =>
                    setKeys((k) => ({ ...k, anthropic: e.target.value }))
                  }
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide key" : "Show key"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Get a free key at console.anthropic.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}>
              {saved ? <CheckCircle2 className="h-4 w-4" /> : null}
              {saved ? "Saved" : "Save settings"}
            </Button>
            {hasKey && (
              <Button variant="outline" onClick={handleClear}>
                <Trash2 className="h-4 w-4" />
                Clear key
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            How your key is handled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Stored only in this browser&apos;s localStorage under
              <code className="ml-1 rounded bg-muted px-1 text-xs">
                authpilothealth_api_keys
              </code>
              .
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Sent only on the request that needs it, as a header the server
              reads but never persists or logs.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Never committed to the repo and never written to disk on the
              server.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo preferences</CardTitle>
          <CardDescription>
            Local display options for this browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PreferenceRow
            label="Show synthetic-data banner"
            desc="Display the synthetic data reminder in the header."
            defaultChecked
          />
          <PreferenceRow
            label="Compact case cards"
            desc="Tighter spacing on the case board."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PreferenceRow({
  label,
  desc,
  defaultChecked,
}: {
  label: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={on} onCheckedChange={setOn} aria-label={label} />
    </div>
  );
}
