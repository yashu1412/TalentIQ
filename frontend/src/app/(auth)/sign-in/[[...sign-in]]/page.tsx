import { SignIn } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "absolute", top: "15%", left: "20%",
          width: 420, height: 420,
          background: "radial-gradient(circle, rgba(55,138,221,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute", bottom: "10%", right: "15%",
          width: 360, height: 360,
          background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 relative z-10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "#378ADD", boxShadow: "0 0 20px rgba(55,138,221,0.4)" }}
        >
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, color: "#FFFFFF" }}>
          TalentIQ
        </span>
      </Link>

      {/* Branded wrapper around Clerk */}
      <div
        className="relative z-10 w-full max-w-sm"
        style={{
          background: "rgba(22,22,22,0.55)",
          border: "1px solid rgba(38,38,38,0.8)",
          borderRadius: 20,
          backdropFilter: "blur(20px)",
          padding: 2,
          boxShadow: "0 0 40px rgba(55,138,221,0.08)",
        }}
      >
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none border-0 p-6",
              headerTitle: "text-white",
              headerSubtitle: "text-[#A1A1AA]",
              socialButtonsBlockButton:
                "bg-[#161616] border border-[#262626] text-[#E4E4E7] hover:bg-[#262626] transition-colors",
              dividerLine: "bg-slate-700",
              dividerText: "text-[#A1A1AA]",
              formFieldLabel: "text-[#A1A1AA]",
              formFieldInput:
                "bg-[#0a0a0a]/80 border border-[#262626] text-white focus:border-[#378ADD] focus:ring-1 focus:ring-[#378ADD] rounded-lg",
              formButtonPrimary:
                "bg-[#2E73B8] hover:bg-[#378ADD] text-white rounded-lg transition-colors",
              footerActionLink: "text-[#60A5FA] hover:text-[#60A5FA]",
              identityPreviewText: "text-[#D4D4D8]",
              identityPreviewEditButton: "text-[#60A5FA]",
            },
          }}
        />
      </div>

      <p className="mt-6 text-xs relative z-10" style={{ color: "#52525b" }}>
        AI-powered career intelligence platform
      </p>
    </div>
  );
}
