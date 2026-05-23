"use client";

import { Activity, ClipboardList, DatabaseZap, KeyRound, LayoutDashboard, Lock, Menu, ServerCog, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/atomics";
import { cn } from "@/shared/utils/cn";

import { useAdminSession } from "../session";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/service-accounts", label: "Service accounts", icon: ServerCog },
  { href: "/service-tokens", label: "Service tokens", icon: KeyRound },
  { href: "/embeddings", label: "Embeddings", icon: DatabaseZap },
  { href: "/audit-events", label: "Audit events", icon: ClipboardList },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { clearAdminPassword } = useAdminSession();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-white/10 bg-prism-navy text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="grid size-9 place-items-center rounded-xl bg-white text-prism-navy">
          <span className="text-sm font-bold">P</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Prizmatic</p>
          <p className="text-xs text-white/60">Admin console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/72 transition duration-150 hover:bg-white/8 hover:text-white",
                active && "bg-white/12 text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset]",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start text-white/72 hover:bg-white/8 hover:text-white"
          onClick={clearAdminPassword}
        >
          <Lock className="size-4" />
          Lock dashboard
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background text-prism-body">
      <div className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</div>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-prism-navy/40 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative h-full w-72">{sidebar}</div>
        </div>
      ) : null}

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur md:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileOpen(current => !current)}
            aria-label="Toggle navigation"
          >
            {isMobileOpen ? <X /> : <Menu />}
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-prism-teal-500">Operator dashboard</p>
            <h1 className="truncate text-lg font-semibold text-prism-heading md:text-xl">
              {navItems.find(item => isActivePath(pathname, item.href))?.label ?? "Overview"}
            </h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-prism-muted sm:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-prism-teal-500/40" />
              <span className="relative inline-flex size-2 rounded-full bg-prism-teal-500" />
            </span>
            Admin session active
          </div>
          <Activity className="hidden size-5 text-prism-muted md:block" />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
