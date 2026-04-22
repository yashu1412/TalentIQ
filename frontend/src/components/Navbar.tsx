"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Zap, Menu, X, ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";

const NAV_LINKS = [
  { href: "#features",    label: "Features"    },
  { href: "#how-it-works",label: "How It Works" },
  { href: "/studynotion", label: "StudyNotion" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled 
          ? "bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-default)] py-2" 
          : "bg-transparent border-b border-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-teal-600)] shadow-[var(--glow-teal)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-[var(--color-teal-600)] to-[var(--color-teal-300)] bg-clip-text text-transparent">
            TalentIQ
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--color-teal-300)] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side: Theme + Auth */}
        <div className="hidden md:flex items-center gap-6">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--color-teal-300)] hover:border-[var(--color-teal-600)] transition-all"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <SignedIn>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="glow-btn glow-btn-primary text-sm py-2 px-5"
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          <SignedOut>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--color-teal-300)] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="glow-btn glow-btn-primary text-sm py-2 px-5"
              >
                Get Started Free
              </Link>
            </div>
          </SignedOut>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-muted)]"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            className="p-2 text-[var(--text-muted)]"
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--border-default)] px-6 py-6 space-y-4 animate-fade-in-up">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block text-lg font-medium text-[var(--text-muted)] hover:text-[var(--color-teal-300)]"
            >
              {label}
            </Link>
          ))}
          <div className="pt-4 border-t border-[var(--border-default)]">
            <SignedIn>
              <div className="flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="glow-btn glow-btn-primary text-sm py-2 px-5"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <div className="flex flex-col gap-4">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-[var(--text-muted)]"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="glow-btn glow-btn-primary text-sm py-2 px-5 text-center"
                >
                  Get Started Free
                </Link>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  );
}
