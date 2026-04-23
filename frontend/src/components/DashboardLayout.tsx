"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import {
  LayoutDashboard, FileText, Briefcase, Bot, Video,
  ListTodo, BarChart2, Zap, Bell, Search, Users, History, Map,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import StatusDot from "@/components/ui/StatusDot";
import { authApi } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard",       icon: LayoutDashboard, label: "Dashboard",      color: "var(--color-teal-600)" },
  { href: "/resume",          icon: FileText,         label: "Resume AI",     color: "var(--color-teal-600)" },
  { href: "/job-analysis",    icon: Briefcase,        label: "Job Match",     color: "var(--color-teal-600)" },
  { href: "/copilot",         icon: Bot,              label: "AI Copilot",    color: "var(--color-teal-600)" },
  { href: "/mock-interview",  icon: Zap,              label: "Mock Interview",color: "var(--color-violet)" },
  { href: "/live-interview",  icon: Video,            label: "Live Room",     color: "var(--color-amber)" },
  { href: "/interview-replay",icon: History,          label: "Replay",        color: "var(--color-violet)" },
  { href: "/groups",          icon: Users,            label: "Group Chat",    color: "#10B981" },
  { href: "/tracker",         icon: ListTodo,         label: "Tracker",       color: "var(--color-teal-600)" },
  { href: "/roadmap",         icon: Map,              label: "Roadmap",       color: "var(--color-teal-300)" },
  { href: "/analytics",       icon: BarChart2,        label: "Analytics",     color: "var(--color-teal-300)" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      const sync = async () => {
        try {
          const token = await getToken();
          if (token) {
            await authApi.syncUser(
              {
                email: user.primaryEmailAddress?.emailAddress,
                full_name: user.fullName || user.firstName || "TalentIQ User",
              },
              token
            );
          }
        } catch (e) {
          console.error("Failed to sync user", e);
        }
      };
      sync();
    }
  }, [user, getToken]);

  if (!mounted) {
    return <div className="flex h-screen bg-[var(--bg-primary)]" />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">

      {/* ── SIDEBAR ── */}
      <aside
        className="hidden md:flex flex-col custom-scrollbar w-60 min-w-[240px] bg-[var(--bg-primary)] border-r border-[var(--border-default)]"
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[var(--border-default)]">
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--color-teal-600)]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-extrabold text-lg text-[var(--text-primary)] group-hover:text-[var(--color-teal-300)] transition-colors">
              TalentIQ
            </span>
          </Link>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
                  {user.fullName || user.firstName || "User"}
                </p>
                <p className="text-xs truncate text-[var(--text-muted)]">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-mono px-3 py-2 mt-2 text-[var(--border-mid)] uppercase tracking-[0.2em]">NAVIGATION</p>
          {NAV_ITEMS.map(({ href, icon: Icon, label, color }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-item ${active ? "active" : ""}`}
                style={active ? { color } : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={active ? { color } : undefined} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom status */}
        <div className="p-4 border-t border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <StatusDot status="active" size={6} />
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">System Optimal</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4 bg-[var(--bg-deep)] border border-[var(--border-default)] px-4 py-2 rounded-xl w-96">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search across TalentIQ..." 
              className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-deep)] text-[var(--text-muted)] hover:text-[var(--color-teal-300)] transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <Link href="/copilot" className="glow-btn text-xs py-2 px-4">
              <Bot className="w-4 h-4" /> AI Copilot
            </Link>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
