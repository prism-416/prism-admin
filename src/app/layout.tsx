import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { AdminPasswordGate } from "@/domains/admin/components/AdminPasswordGate";
import { AdminShell } from "@/domains/admin/components/AdminShell";
import { AppProviders } from "@/domains/admin/session";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: {
    default: "Prizmatic Admin",
    template: "Prizmatic Admin | %s",
  },
  description: "Operator dashboard for Prizmatic service health, internal tokens, and audit events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProviders>
          <AdminPasswordGate>
            <AdminShell>{children}</AdminShell>
          </AdminPasswordGate>
        </AppProviders>
      </body>
    </html>
  );
}
