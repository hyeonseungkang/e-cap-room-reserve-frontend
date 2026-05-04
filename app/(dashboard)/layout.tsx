import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="min-h-screen p-4 pt-18 lg:ml-64 lg:p-6 lg:pt-6">{children}</main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
