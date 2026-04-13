// This layout is intentionally minimal.
// All sidebar/topbar chrome lives in DashboardLayout.tsx (client component)
// which each page imports directly — avoiding double-layout rendering.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
