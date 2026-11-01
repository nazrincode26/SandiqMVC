import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Sandıq",
  icons: { icon: { url: "/assets/images/logo.png", type: "image/png" } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Browser extensions (e.g. QuillBot, Grammarly) add attributes to <html>/<body>
    // before React loads; this ignores only those attribute differences.
    <html lang="az" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
