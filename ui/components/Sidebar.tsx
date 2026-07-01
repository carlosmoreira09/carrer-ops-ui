"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "◉", group: "Overview" },
  { href: "/tracker", label: "Tracker", icon: "▤", group: "Overview" },
  { href: "/pipeline", label: "Pipeline", icon: "▸", group: "Sourcing" },
  { href: "/scan", label: "Scan", icon: "⧉", group: "Sourcing" },
  { href: "/reports", label: "Reports", icon: "❏", group: "Sourcing" },
  { href: "/artifacts", label: "Artifacts", icon: "⬦", group: "Assets" },
  { href: "/profile", label: "Profile & CV", icon: "◈", group: "Assets" },
  { href: "/settings", label: "Settings", icon: "⚙", group: "System" },
];

export function Sidebar() {
  const pathname = usePathname();
  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <aside className="w-60 shrink-0 border-r border-[var(--color-border-soft)] bg-[var(--color-panel)] flex flex-col">
      <div className="px-5 py-5 border-b border-[var(--color-border-soft)]">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-accent)] text-lg">◆</span>
          <span className="font-semibold tracking-tight">career-ops</span>
        </div>
        <div className="text-[0.68rem] text-[var(--color-faint)] mt-1 uppercase tracking-widest">
          Command Center
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {groups.map((group) => (
          <div key={group} className="mb-4">
            <div className="label px-2.5 mb-1.5">{group}</div>
            {NAV.filter((n) => n.group === group).map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <span className="w-4 text-center opacity-90">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-[var(--color-border-soft)] text-[0.68rem] text-[var(--color-faint)]">
        Local · files are source of truth
      </div>
    </aside>
  );
}
