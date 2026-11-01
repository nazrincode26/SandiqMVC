import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

/** Views/Home/Privacy.cshtml (template page, not linked from the menus). */
export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Use this page to detail your site&apos;s privacy policy.</p>
    </>
  );
}
