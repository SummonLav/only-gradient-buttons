import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "only-gradient-buttons",
  description: "A personal collection of beautiful gradient buttons.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
