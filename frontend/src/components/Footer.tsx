import Link from "next/link";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-[var(--border-default)] relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-teal-600)]">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight">TalentIQ</span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] max-w-xs text-center md:text-left">
              The next generation of project-driven career intelligence for ambitious professionals.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-12">
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm uppercase tracking-widest text-[var(--color-teal-300)]">
                Project Hub
              </h4>
              <div className="flex flex-col gap-2">
                {["Modules", "User Journey", "Pricing", "Support"].map(l => (
                  <Link
                    key={l}
                    href="#"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--color-teal-300)] transition-colors"
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm uppercase tracking-widest text-[var(--color-teal-300)]">
                Compliance
              </h4>
              <div className="flex flex-col gap-2">
                {["Privacy", "Terms", "Security", "Cookies"].map(l => (
                  <Link
                    key={l}
                    href="#"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--color-teal-300)] transition-colors"
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-20 pt-8 border-t border-[var(--border-default)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            © 2026 TalentIQ · Built with ❤️ by{" "}
            <span className="text-[var(--color-teal-300)] font-semibold">Yashpalsingh Pawara</span>

          </p>
          <div className="flex gap-6">
            <Link
              href="https://github.com/yashu1412"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--color-teal-300)] transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://github.com/yashu1412/TaltRoom-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--color-teal-300)] transition-colors"
            >
              Source
            </Link>
            <Link
              href="#"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--color-teal-300)] transition-colors"
            >
              LinkedIn
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
