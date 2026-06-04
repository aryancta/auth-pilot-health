import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Wordmark />
      <div>
        <div className="text-5xl font-bold text-primary">404</div>
        <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          That page is not part of Auth Pilot Health. Head back to the case
          board to keep working.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/">
          <Button variant="outline">Home</Button>
        </Link>
        <Link href="/dashboard">
          <Button>Case board</Button>
        </Link>
      </div>
    </div>
  );
}
