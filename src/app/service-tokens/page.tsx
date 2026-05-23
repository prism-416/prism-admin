import type { Metadata } from "next";

import { ServiceTokensAdmin } from "@/domains/admin/components/ServiceTokensAdmin";

export const metadata: Metadata = {
  title: "Service Tokens",
};

export default function ServiceTokensPage() {
  return <ServiceTokensAdmin />;
}
