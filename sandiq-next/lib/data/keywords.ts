import "server-only";
import { unstable_cache } from "next/cache";
import { adminDb } from "../firebase/admin";
import { TAGS } from "./common";

export interface SearchKeyword {
  keyword: string;
  lang: string;
  categoryId: number;
}

const loadKeywords = unstable_cache(
  async (): Promise<SearchKeyword[]> => {
    const snap = await adminDb().collection("searchKeywords").get();
    return snap.docs.map((d) => ({
      keyword: String(d.get("keyword") ?? ""),
      lang: String(d.get("lang") ?? "az"),
      categoryId: Number(d.get("categoryId") ?? 0),
    }));
  },
  ["search-keywords-v1"],
  { tags: [TAGS.keywords] }
);

export async function getKeywords(): Promise<SearchKeyword[]> {
  return loadKeywords();
}

/** _TitleKeywordsDatalist: distinct AZ keywords, ordered. */
export async function getTitleKeywords(): Promise<string[]> {
  const az = (await getKeywords()).filter((k) => k.lang === "az").map((k) => k.keyword);
  // SQL Server's default case-insensitive collation ordered these; a base collator is the closest match.
  const collator = new Intl.Collator("en", { sensitivity: "base" });
  return [...new Set(az)].sort(collator.compare);
}

/** ListingsController.IsValidTitleAsync */
export async function isValidTitle(title: string | null | undefined): Promise<boolean> {
  if (!title || !title.trim()) return false;
  const normalized = title.trim().toLowerCase();
  return (await getKeywords()).some((k) => k.lang === "az" && k.keyword.toLowerCase() === normalized);
}
