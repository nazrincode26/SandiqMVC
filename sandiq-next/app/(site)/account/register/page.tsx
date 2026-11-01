import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Qeydiyyat" };

export default function RegisterPage() {
  return <RegisterForm />;
}
