"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard, FileText, Briefcase, Bot, Video,
  ListTodo, BarChart2, Zap, Bell, Search, Users,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import StatusDot from "@/components/ui/StatusDot";

const NAV_ITEMS = [
  { href: "/dashboard",       icon: LayoutDashboard, label: "Dashboard",      color: "#378ADD" },
  { href: "/resume",          icon: FileText,         label: "Resume AI",     color: "#378ADD" },
  { href: "/job-analysis",    icon: Briefcase,        label: "Job Match",     color: "#378ADD" },
  { href: "/copilot",         icon: Bot,              label: "AI Copilot",    color: "#378ADD" },
  { href: "/mock-interview",  icon: Zap,              label: "Mock Interview",color: "#8B5CF6" },
  { href: "/live-interview",  icon: Video,            label: "Live Room",     color: "#F59E0B" },
  { href: "/groups",          icon: Users,            label: "Group Chat",    color: "#10B981" },
  { href: "/tracker",         icon: ListTodo,         label: "Tracker",       color: "#378ADD" },
  { href: "/analytics",       icon: BarChart2,        label: "Analytics",     color: "#60A5FA" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-screen bg-[#0a0a0a]" />;
  }

  return (
    <div className="flex h-screen" style={{ background: "#0a0a0a" }}>

      {/* ── SIDEBAR ── */}
      <aside
        className="hidden md:flex flex-col custom-scrollbar"
        style={{
          width: 240, minWidth: 240,
          background: "rgba(10,10,10,0.97)",
          borderRight: "1px solid #161616",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5" style={{ borderBottom: "1px solid #161616" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#378ADD" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "#FFFFFF" }}>
            TalentIQ
          </span>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 mx-3 my-3 rounded-xl" style={{ background: "rgba(22,22,22,0.6)", border: "1px solid #262626" }}>
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#FFFFFF" }}>
                  {user.fullName || user.firstName || "User"}
                </p>
                <p className="text-xs truncate" style={{ color: "#71717a" }}>
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          <p className="text-xs font-mono px-3 py-2 mt-2" style={{ color: "#262626", letterSpacing: "0.12em" }}>NAVIGATION</p>
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
        <div className="p-4" style={{ borderTop: "1px solid #161616" }}>
          <div className="flex items-center gap-2">
            <StatusDot status="active" size={6} />
            <span className="text-xs" style={{ color: "#52525b" }}>Systems Operational</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 py-3.5 shrink-0"
          style={{ background: "rgba(10,10,10,0.9)", borderBottom: "1px solid #161616", backdropFilter: "blur(12px)" }}
        >
          {/* Search */}
          <div className="flex items-center gap-3 rounded-xl px-3 py-2 flex-1 max-w-xs" style={{ background: "rgba(22,22,22,0.7)", border: "1px solid #262626" }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#52525b" }} />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm flex-1"
              style={{ color: "#A1A1AA", fontFamily: "DM Sans, sans-serif" }}
            />
          </div>

          {/* Right */}
          <div className="flex items-center gap-4 ml-4">
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: "#71717a" }}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#F43F5E" }} />
            </button>

            <div className="flex items-center gap-2 text-xs" style={{ color: "#52525b" }}>
              <StatusDot status="active" size={6} />
              <span className="hidden sm:inline">Systems Operational</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
          <div className="gradient-strip shrink-0 mb-6" />
          {children}
        </div>
      </main>
    </div>
  );
}
