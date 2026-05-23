import type { Metadata } from "next";

import { EmbeddingsAdmin } from "@/domains/admin/components/EmbeddingsAdmin";

export const metadata: Metadata = {
  title: "Embeddings",
};

export default function EmbeddingsPage() {
  return <EmbeddingsAdmin />;
}
