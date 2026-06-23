import Link from "next/link";
import { AuthButton } from "./AuthButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <main className="shell"><nav className="nav"><Link href="/">Today</Link><Link href="/plan">Plan</Link><Link href="/nutrition">Nutrition</Link><Link href="/history">History</Link><span style={{ marginLeft: "auto" }}><AuthButton /></span></nav>{children}</main>;
}
