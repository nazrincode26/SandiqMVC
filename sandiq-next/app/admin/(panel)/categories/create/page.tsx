import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import CategoryForm from "../CategoryForm";

export const metadata: Metadata = { title: "Yeni kateqoriya" };

/** Admin CategoriesController.Create (GET) */
export default async function CreateCategoryPage() {
  await requireAdmin();
  return (
    <>
      <h2>Yeni kateqoriya</h2>
      <CategoryForm mode="create" initial={{ Id: "0", Name: "", NameRu: "", NameEn: "", Icon: "" }} />
    </>
  );
}
