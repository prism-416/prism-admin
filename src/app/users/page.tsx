import type { Metadata } from "next";

import { UserActivityAdmin } from "@/domains/admin/components/UserActivityAdmin";

export const metadata: Metadata = {
  title: "User activity",
};

export default function UsersPage() {
  return <UserActivityAdmin />;
}
