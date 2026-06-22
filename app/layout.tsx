import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gym Log",
  description: "A simple training check-in log"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
