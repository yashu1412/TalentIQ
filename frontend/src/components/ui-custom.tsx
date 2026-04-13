import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { translateY: -4, scale: 1.01 } : {}}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300",
        hover && "hover:border-white/20 hover:bg-white/[0.08] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        className
      )}
    >
      <div className="relative z-10 p-6">{children}</div>
      {/* Ambient Glow effect */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  glow?: boolean;
  children: React.ReactNode;
}

export function GlowButton({ 
  variant = "primary", 
  glow = true, 
  children, 
  className, 
  ...props 
}: GlowButtonProps) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-purple-600 text-white hover:bg-purple-700",
    outline: "bg-transparent border border-white/20 text-white hover:bg-white/10"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2",
        variants[variant],
        glow && variant === "primary" && "shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]",
        glow && variant === "secondary" && "shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
