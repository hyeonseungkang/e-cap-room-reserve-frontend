import { Spinner } from "@/components/ui/spinner";

export function LoadingPage() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-border bg-card">
      <Spinner size="md" />
    </div>
  );
}

export function LoadingTable() {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-card">
      <Spinner size="md" />
    </div>
  );
}
