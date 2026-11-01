// Seeds reference data, like Program.cs did on startup.
//   npm run seed                      -> search keywords (only if the collection is empty)
//   npm run seed -- --with-categories -> also the category tree the keywords refer to
//                                       (only if there are no categories yet; for fresh
//                                        projects/emulators — real data comes from the migration)
import { readFileSync } from "node:fs";
import { args, commitInChunks, db, hasFlag, target } from "./lib.ts";

interface KeywordEntry {
  keyword: string;
  lang: string;
  categoryIds: number[];
}

// Category ids from the comment in DAL/SearchKeywordSeedData.cs.
// Only Azerbaijani names are known; RU/EN can be filled in from the admin panel.
const CATEGORY_TREE: { id: number; name: string; parentId: number | null }[] = [
  { id: 7, name: "Geyim", parentId: null },
  { id: 8, name: "Əşyalar", parentId: null },
  { id: 9, name: "Qab-qacaq", parentId: null },
  { id: 10, name: "Yeməklər", parentId: null },
  { id: 11, name: "Əl işləri", parentId: null },
  { id: 12, name: "Digər", parentId: null },
  { id: 13, name: "Kişi geyimləri", parentId: 7 },
  { id: 14, name: "Qadın geyimləri", parentId: 7 },
  { id: 15, name: "Uşaq geyimləri", parentId: 7 },
  { id: 16, name: "Digər", parentId: 7 },
  { id: 17, name: "Böyük əşyalar", parentId: 8 },
  { id: 18, name: "Kiçik əşyalar", parentId: 8 },
  { id: 19, name: "Digər", parentId: 8 },
  { id: 20, name: "Muncuq", parentId: 11 },
  { id: 21, name: "Toxuma", parentId: 11 },
  { id: 22, name: "Digər", parentId: 11 },
];

async function main() {
  console.log(`Seeding ${target}${args.length ? ` with ${args.join(" ")}` : ""}`);

  if (hasFlag("--with-categories")) {
    const existing = await db.collection("categories").limit(1).get();
    if (existing.empty) {
      await commitInChunks([
        ...CATEGORY_TREE.map((c) => (b: FirebaseFirestore.WriteBatch) =>
          b.set(db.collection("categories").doc(String(c.id)), { ...c, nameRu: null, nameEn: null, icon: null })
        ),
        (b: FirebaseFirestore.WriteBatch) => b.set(db.collection("counters").doc("categories"), { value: 22 }, { merge: true }),
      ]);
      console.log(`Created ${CATEGORY_TREE.length} categories.`);
    } else {
      console.log("Categories already exist; skipped.");
    }
  }

  const keywords = await db.collection("searchKeywords").limit(1).get();
  if (!keywords.empty) {
    console.log("Search keywords already exist; skipped.");
    return;
  }
  const entries = JSON.parse(readFileSync(new URL("./data/search-keywords.json", import.meta.url), "utf8")) as KeywordEntry[];
  const ops = entries.flatMap((e) =>
    e.categoryIds.map((categoryId) => (b: FirebaseFirestore.WriteBatch) =>
      b.set(db.collection("searchKeywords").doc(), { keyword: e.keyword.toLowerCase(), lang: e.lang, categoryId })
    )
  );
  await commitInChunks(ops);
  console.log(`Created ${ops.length} search keywords.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
