import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getCategoryTree } from "@/lib/data/categories";
import { deleteCategory } from "../../actions";
import CategoryModal, { AddSubButton, CreateCategoryButton, EditCategoryButton } from "./CategoryModal";
import ConfirmForm from "../ConfirmForm";

export const metadata: Metadata = { title: "Kateqoriyalar" };

/** Admin CategoriesController.Index */
export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getCategoryTree();

  return (
    <CategoryModal>
      <div className="admin-page-header">
        <h2>Kateqoriyalar</h2>
        <CreateCategoryButton />
      </div>

      <div className="category-list">
        {categories.map((category) => (
          <div key={category.id} className="category-card">
            <div className="category-card__row">
              <span className="category-card__name">{category.name}</span>
              <div className="category-card__actions">
                <AddSubButton id={category.id} name={category.name} />
                <EditCategoryButton category={category} />
                <ConfirmForm action={deleteCategory} id={category.id} message="Silmək istədiyinizə əminsiniz?" className="d-inline">
                  <button type="submit" className="admin-btn admin-btn--danger">Sil</button>
                </ConfirmForm>
              </div>
            </div>
            {category.subcategories.length > 0 && (
              <div className="category-card__subs">
                {category.subcategories.map((sub) => (
                  <div key={sub.id} className="category-card__sub-row">
                    <span>{sub.name}</span>
                    <div className="category-card__actions">
                      <EditCategoryButton category={sub} />
                      <ConfirmForm action={deleteCategory} id={sub.id} message="Silmək istədiyinizə əminsiniz?" className="d-inline">
                        <button type="submit" className="admin-btn admin-btn--danger">Sil</button>
                      </ConfirmForm>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </CategoryModal>
  );
}
