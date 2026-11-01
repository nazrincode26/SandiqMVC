import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

/** Admin HomeController.Index */
export default async function AdminHome() {
  await requireAdmin();
  redirect("/admin/categories");
}
