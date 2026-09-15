"use client";

import { LayoutDashboard, Menu, Plus, Trophy, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/torneos", label: "Torneos", icon: Trophy },
  { href: "/jugadores", label: "Jugadores", icon: Users },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`label-mono flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition ${
              active
                ? "bg-sidebar-active text-white"
                : "text-sidebar-foreground hover:bg-sidebar-active/60 hover:text-white"
            }`}
          >
            <Icon size={17} className={active ? "text-accent" : ""} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="text-xl" aria-hidden>
            🏓
          </span>
          <span className="text-base font-bold tracking-tight">Spin Tournament</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-active"
        >
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-sidebar py-4">
            <div className="flex items-center justify-between px-4 pb-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-white"
              >
                <span className="text-xl" aria-hidden>
                  🏓
                </span>
                <span className="text-base font-bold tracking-tight">Spin Tournament</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menu"
                className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-active"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-4 px-3">
              <Link
                href="/torneos/nuevo"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Plus size={16} />
                Nuevo torneo
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar py-5 md:flex">
        <Link href="/" className="flex items-center gap-2 px-5 pb-6 text-white">
          <span className="text-2xl" aria-hidden>
            🏓
          </span>
          <div>
            <p className="text-base font-bold leading-tight tracking-tight">Spin Tournament</p>
            <p className="label-mono text-[10px] text-sidebar-foreground">Table Tennis</p>
          </div>
        </Link>
        <NavLinks pathname={pathname} />
        <div className="mt-auto px-3 pt-6">
          <Link
            href="/torneos/nuevo"
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus size={16} />
            Nuevo torneo
          </Link>
        </div>
      </aside>
    </>
  );
}
