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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={hover ? { 
        translateY: -8, 
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      } : {}}
      className={cn(
        "group relative overflow-hidden glass-card",
        hover && "glass-card-hover",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
      
      {/* Dynamic Border Glow */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--color-teal-600)]/10 via-transparent to-[var(--color-violet)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated Shine Effect */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
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
    primary: "bg-gradient-to-r from-[var(--color-teal-600)] to-[var(--color-violet)] text-white shadow-[0_0_20px_rgba(55,138,221,0.3)]",
    secondary: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
    outline: "border-2 border-[var(--color-teal-600)]/50 text-[var(--color-teal-300)] hover:bg-[var(--color-teal-600)]/10"
  };

  return (
    <motion.button
      whileHover={{ 
        scale: 1.05, 
        y: -2,
        boxShadow: glow ? "0 10px 30px -5px rgba(55,138,221,0.5)" : "none"
      }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative px-6 py-3 rounded-xl font-bold transition-all duration-300 overflow-hidden group",
        variants[variant],
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700 ease-in-out" />
    </motion.button>
  );
}
