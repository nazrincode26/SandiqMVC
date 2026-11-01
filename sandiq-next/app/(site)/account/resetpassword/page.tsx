import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Şifrəni sıfırla" };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
