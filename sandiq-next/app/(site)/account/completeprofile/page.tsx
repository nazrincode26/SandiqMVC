import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import CompleteProfileForm from "./CompleteProfileForm";

export const metadata: Metadata = { title: "Profili tamamla" };

/** AccountController.CompleteProfile ([Authorize]) */
export default async function CompleteProfilePage() {
  await requireUser();
  return <CompleteProfileForm />;
}
