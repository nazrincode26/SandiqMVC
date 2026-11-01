import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCategoryById } from "@/lib/data/categories";
import { parseId } from "@/lib/data/common";
import CategoryForm from "../../CategoryForm";

export const metadata: Metadata = { title: "Kateqoriyanı redaktə et" };

/** Admin CategoriesController.Edit (GET) */
export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = parseId((await params).id);
  const category = id ? await getCategoryById(id) : null;
  if (!category) notFound();

  return (
    <>
      <h2>Kateqoriyanı redaktə et</h2>
      <CategoryForm
        mode="edit"
        initial={{
          Id: String(category.id),
          Name: category.name,
          NameRu: category.nameRu ?? "",
          NameEn: category.nameEn ?? "",
          Icon: category.icon ?? "",
        }}
      />
    </>
  );
}
