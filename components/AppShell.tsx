import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <main className="shell"><nav className="nav"><Link href="/">Today</Link><Link href="/plan">Plan</Link><Link href="/history">History</Link></nav>{children}</main>;
}
