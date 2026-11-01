import { NextResponse, type NextRequest } from "next/server";
import { getAllCategories } from "@/lib/data/categories";
import { getKeywords } from "@/lib/data/keywords";

/** CategoryController.SearchSuggestions */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const langParam = request.nextUrl.searchParams.get("lang") ?? "az";
  if (!q.trim() || q.trim().length < 2) return NextResponse.json([]);

  const term = q.trim().toLowerCase();
  const lang = langParam === "ru" || langParam === "en" ? langParam : "az";
  const [keywords, categories] = await Promise.all([getKeywords(), getAllCategories()]);
  const byId = new Map(categories.map((c) => [c.id, c]));

  const seen = new Set<number>();
  const result: { id: number; name: string }[] = [];
  for (const k of keywords) {
    if (k.lang !== lang) continue;
    const category = byId.get(k.categoryId);
    if (!category) continue;
    if (!(k.keyword.includes(term) || term.includes(k.keyword))) continue;
    if (seen.has(category.id)) continue;
    seen.add(category.id);
    result.push({
      id: category.id,
      name: lang === "ru" ? category.nameRu ?? category.name : lang === "en" ? category.nameEn ?? category.name : category.name,
    });
    if (result.length === 8) break;
  }
  return NextResponse.json(result);
}
