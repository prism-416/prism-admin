import type { Metadata } from "next";

import { AuditEventsAdmin } from "@/domains/admin/components/AuditEventsAdmin";

export const metadata: Metadata = {
  title: "Audit Events",
};

export default function AuditEventsPage() {
  return <AuditEventsAdmin />;
}
