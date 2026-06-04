"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCaseStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Case Board", icon: LayoutDashboard },
  { href: "/analytics", label: "Denial Patterns", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const resetDemo = useCaseStore((s) => s.resetDemo);
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="shrink-0">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground lg:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Synthetic data only
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetDemo();
                toast({
                  title: "Demo reset",
                  description: "All cases restored to their seeded state.",
                });
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset demo
            </Button>
          </div>
        </div>
        <nav className="flex items-center gap-1 border-t px-4 py-2 md:hidden">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
