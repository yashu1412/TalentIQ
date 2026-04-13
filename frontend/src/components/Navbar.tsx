"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Zap, Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { href: "#features",    label: "Features"    },
  { href: "#how-it-works",label: "How It Works" },
  { href: "/studynotion", label: "StudyNotion" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(10,10,10,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(38,38,38,0.6)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#378ADD" }}>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "#FFFFFF" }}>
            TalentIQ
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm transition-colors hover:text-[#60A5FA]"
              style={{ color: "#A1A1AA", fontWeight: 500 }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth CTA */}
        <div className="hidden md:flex items-center gap-4">
          <SignedIn>
            <Link
              href="/dashboard"
              className="glow-btn glow-btn-primary text-sm py-2 px-5"
            >
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-medium transition-colors hover:text-[#60A5FA]"
              style={{ color: "#A1A1AA" }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="glow-btn glow-btn-primary text-sm py-2 px-5"
            >
              Get Started Free
            </Link>
          </SignedOut>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg"
          style={{ color: "#A1A1AA" }}
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-6 py-5 space-y-4"
          style={{ background: "rgba(10,10,10,0.97)", borderTop: "1px solid #161616" }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm transition-colors hover:text-[#60A5FA]"
              style={{ color: "#A1A1AA" }}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-3" style={{ borderTop: "1px solid #161616" }}>
            <SignedIn>
              <Link href="/dashboard" className="glow-btn glow-btn-primary justify-center" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="glow-btn justify-center" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link href="/sign-up" className="glow-btn glow-btn-primary justify-center" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  );
}
