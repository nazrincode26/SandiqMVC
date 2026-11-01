import "@/styles/admin/style.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s - Admin - Sandıq", default: "Admin - Sandıq" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
