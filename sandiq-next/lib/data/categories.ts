import "server-only";
import { unstable_cache } from "next/cache";
import { adminDb } from "../firebase/admin";
import { TAGS } from "./common";

export interface Category {
  id: number;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  icon: string | null;
  parentId: number | null;
}

export interface CategoryNode extends Category {
  subcategories: Category[];
}

const loadAllCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const snap = await adminDb().collection("categories").get();
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: Number(data.id ?? d.id),
          name: data.name ?? "",
          nameRu: data.nameRu ?? null,
          nameEn: data.nameEn ?? null,
          icon: data.icon ?? null,
          parentId: typeof data.parentId === "number" ? data.parentId : null,
        };
      })
      .sort((a, b) => a.id - b.id);
  },
  ["categories-all-v1"],
  { tags: [TAGS.categories] }
);

export async function getAllCategories(): Promise<Category[]> {
  return loadAllCategories();
}

/** Top-level categories with their subcategories (Include(c => c.Subcategories)). */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const all = await getAllCategories();
  return all
    .filter((c) => c.parentId === null)
    .map((c) => ({ ...c, subcategories: all.filter((s) => s.parentId === c.id) }));
}

export async function getCategoryById(id: number): Promise<Category | null> {
  return (await getAllCategories()).find((c) => c.id === id) ?? null;
}

export function categoriesForClient(tree: CategoryNode[]) {
  return tree.map((c) => ({
    id: c.id,
    name: c.name,
    nameRu: c.nameRu ?? c.name,
    nameEn: c.nameEn ?? c.name,
    subcategories: c.subcategories.map((s) => ({
      id: s.id,
      name: s.name,
      nameRu: s.nameRu ?? s.name,
      nameEn: s.nameEn ?? s.name,
    })),
  }));
}

export type ClientCategory = ReturnType<typeof categoriesForClient>[number];
