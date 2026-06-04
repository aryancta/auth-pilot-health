import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label="Auth Pilot Health logo"
    >
      <rect width="40" height="40" rx="10" fill="hsl(187 92% 26%)" />
      <path
        d="M20 8.5l9 4v6.2c0 5.6-3.7 9.8-9 11.8-5.3-2-9-6.2-9-11.8V12.5l9-4z"
        fill="hsl(180 100% 97%)"
        opacity="0.95"
      />
      <path
        d="M15 20.2h2.6l1.6-4 2 7 1.8-4.4h2.4"
        fill="none"
        stroke="hsl(187 92% 26%)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logo />
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">
          Auth Pilot Health
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Prior Auth Case Manager
        </div>
      </div>
    </div>
  );
}
