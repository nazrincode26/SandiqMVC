import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = { title: "Parametrlər" };

/** AccountController.Settings ([Authorize]) */
export default async function SettingsPage() {
  const user = await requireUser();
  return <SettingsForm initial={{ FullName: user.fullName, Email: user.email, Phone: user.phone ?? "" }} />;
}
