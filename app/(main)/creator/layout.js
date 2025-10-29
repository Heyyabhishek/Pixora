import { Camera } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Creator Dashboard - Pixora",
  description: "Manage your appointments and availability",
};

export default async function CreatorDashboardLayout({ children }) {
  return (
    <div className="container mx-auto px-4 py-30">
      <PageHeader icon={<Camera />} title="Creator Dashboard" />

      {children}
    </div>
  );
}