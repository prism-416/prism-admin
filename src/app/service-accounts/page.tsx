import type { Metadata } from "next";

import { ServiceAccountsAdmin } from "@/domains/admin/components/ServiceAccountsAdmin";

export const metadata: Metadata = {
  title: "Service Accounts",
};

export default function ServiceAccountsPage() {
  return <ServiceAccountsAdmin />;
}
