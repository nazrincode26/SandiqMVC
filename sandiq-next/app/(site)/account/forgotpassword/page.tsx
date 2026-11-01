import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Şifrəni unutdum" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
