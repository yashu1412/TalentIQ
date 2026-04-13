"use client";

type StatusDotProps = {
  status: "active" | "pending" | "error" | "idle";
  size?: number;
  label?: string;
};

const STATUS_COLORS: Record<string, string> = {
  active:  "#22C55E",
  pending: "#F59E0B",
  error:   "#F43F5E",
  idle:    "#71717a",
};

export default function StatusDot({ status, size = 8, label }: StatusDotProps) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.idle;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          boxShadow: status !== "idle" ? `0 0 ${size + 2}px ${color}` : "none",
          display: "inline-block",
          animation: status === "active" ? "pulse-green 2s infinite" :
                     status === "pending" ? "pulse-amber 2s infinite" :
                     status === "error" ? "pulse-rose 2s infinite" : "none",
        }}
      />
      {label && (
        <span style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</span>
      )}
    </span>
  );
}
