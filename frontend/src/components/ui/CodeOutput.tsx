"use client";

type CodeOutputProps = {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  runtimeMs?: number;
};

export default function CodeOutput({ stdout, stderr, exitCode, runtimeMs }: CodeOutputProps) {
  if (!stdout && !stderr) return null;
  return (
    <div
      style={{
        background: "rgba(10,10,10,0.95)",
        border: "1px solid #262626",
        borderRadius: 8,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 13,
        padding: "12px 16px",
        overflow: "auto",
        maxHeight: 240,
      }}
    >
      {stdout && (
        <pre style={{ color: "#4ADE80", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {stdout}
        </pre>
      )}
      {stderr && (
        <pre style={{ color: "#F43F5E", margin: 0, marginTop: stdout ? 8 : 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {stderr}
        </pre>
      )}
      <div style={{ marginTop: 8, display: "flex", gap: 12, fontSize: 11, color: "#52525b" }}>
        <span>exit: <strong style={{ color: exitCode === 0 ? "#4ADE80" : "#F43F5E" }}>{exitCode ?? 0}</strong></span>
        {runtimeMs != null && <span>runtime: <strong style={{ color: "#60A5FA" }}>{runtimeMs}ms</strong></span>}
      </div>
    </div>
  );
}
