import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getAllCategories } from "@/lib/data/categories";
import { getApprovedProducts, productFromDoc, type Product } from "@/lib/data/products";
import { formatPlain } from "@/lib/format";

interface ChatTurn {
  role: string;
  text: string;
}
interface ChatCartItem {
  title: string;
  price: number;
  quantity: number;
}

const fallbackMessage = (lang: string) =>
  lang === "ru"
    ? "Извините, сейчас не могу ответить. Попробуйте позже."
    : lang === "en"
      ? "Sorry, I can't answer right now. Please try again later."
      : "Üzr istəyirəm, hazırda cavab verə bilmirəm. Bir az sonra yenidən cəhd edin.";

function cleanItems(value: unknown): ChatCartItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map((i) => ({
    title: String((i as Record<string, unknown>)?.title ?? "").slice(0, 200),
    price: Number((i as Record<string, unknown>)?.price) || 0,
    quantity: Number((i as Record<string, unknown>)?.quantity) || 1,
  }));
}

/** ChatController.BuildSystemPromptAsync */
async function buildSystemPrompt(lang: string, cart: ChatCartItem[], favorites: ChatCartItem[]) {
  const langName = lang === "ru" ? "русском" : lang === "en" ? "English" : "Azərbaycan";
  const [products, categories, user] = await Promise.all([getApprovedProducts(), getAllCategories(), getCurrentUser()]);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const catalog = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 200);
  let catalogText = "";
  if (catalog.length) {
    for (const p of catalog) {
      catalogText += `- #${p.id} | ${p.title} | ${formatPlain(p.price)} ₼ | Kateqoriya: ${categoryName.get(p.categoryId) ?? "-"} | Vəziyyət: ${p.condition === "new" ? "Yeni" : "İşlənmiş"} | Yer: ${p.location ?? "-"}\n`;
    }
  } else {
    catalogText += "(Hazırda saytda təsdiqlənmiş elan yoxdur.)\n";
  }

  let userSection = "";
  if (user) {
    userSection += `İstifadəçi daxil olub: ${user.fullName} (${user.email}).\n`;
    const snap = await adminDb().collection("products").where("submittedByUserId", "==", user.uid).get();
    const myListings = snap.docs
      .map((d) => productFromDoc(d))
      .filter((p): p is Product => p !== null && p.status !== "deleted")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);
    if (myListings.length) {
      userSection += "Bu istifadəçinin öz elanları:\n";
      for (const l of myListings) {
        const statusAz = l.status === "approved" ? "təsdiqlənib" : l.status === "rejected" ? "rədd edilib" : "gözləyir";
        userSection += `  - #${l.id} ${l.title} — ${formatPlain(l.price)} ₼ (${statusAz})\n`;
      }
    } else {
      userSection += "Bu istifadəçinin hələ elanı yoxdur.\n";
    }
  } else {
    userSection += "İstifadəçi hesaba daxil olmayıb (qonaq).\n";
  }

  if (cart.length) {
    userSection += "İstifadəçinin səbətindəki məhsullar:\n";
    for (const c of cart) userSection += `  - ${c.title} — ${formatPlain(c.price)} ₼ x ${c.quantity}\n`;
  } else {
    userSection += "İstifadəçinin səbəti boşdur.\n";
  }

  if (favorites.length) {
    userSection += "İstifadəçinin favorilərindəki məhsullar:\n";
    for (const f of favorites) userSection += `  - ${f.title} — ${formatPlain(f.price)} ₼\n`;
  } else {
    userSection += "İstifadəçinin favorilər siyahısı boşdur.\n";
  }

  return `Sən Sandıq adlı 2-ci əl əşya alqı-satqı saytının (lalafo.az/tap.az kimi elanlar saytı) köməkçi chatbotusan.

Sayt haqqında faktlar:
- İstifadəçi qeydiyyatdan keçib (email/şifrə və ya Google ilə) elan yerləşdirə bilər. Elan admin tərəfindən yoxlanılıb təsdiqləndikdən sonra saytda görünür.
- İstifadəçi "Mənim elanlarım" səhifəsində öz elanlarını redaktə edə və silə bilər.
- Elanı redaktə etdikdə, o yenidən admin təsdiqinə göndərilir (status "gözləyir" olur).
- Axtarış yuxarıdakı axtarış qutusu ilə, kateqoriya səhifəsində qiymət aralığı, vəziyyət (yeni/işlənmiş) filtri və sıralama mövcuddur.
- Səbətə əlavə etmək üçün "Səbətə at" düyməsi, favorilərə əlavə üçün ürək (♥) işarəsi istifadə olunur.
- Sifariş vermək üçün səbətdən "Sifarişi tamamla"ya keçilir, ödəniş kart üzərinə köçürmə ilə olur, admin təsdiqindən sonra satıcı ilə əlaqə saxlanılır.
- Şifrəni unutduqda giriş səhifəsindəki "Şifrəni unutdum" linki ilə qeydiyyatdan keçdiyi emailə 6 rəqəmli kod göndərilir.
- Qaydalar: silah, narkotik, saxta sənəd və qanunla qadağan olunmuş məhsulların satışı qəti qadağandır. Elanda göstərilən şəkil və təsvir məhsulun real vəziyyətinə uyğun olmalıdır.
- Təhlükəsiz alış-veriş: açıq və camaatlı yerlərdə görüş, məhsulu yoxladıqdan sonra ödəniş, ön ödəniş tələb edən və ya bazar qiymətindən çox aşağı olan şübhəli təkliflərə etibar etməmək.
- Əlaqə: email elaqe@sandiq.az, Instagram @sandiq.

CANLI SAYT MƏLUMATI (hazırkı təsdiqlənmiş elanlar, bu siyahı hər sualda yenilənir):
${catalogText}

İSTİFADƏÇİ HAQQINDA MƏLUMAT:
${userSection}

Davranış qaydaları:
- Yalnız Sandıq saytı, alış-veriş, elan yerləşdirmə, hesab və bənzər mövzularda kömək et.
- Sayt mövzusundan tamamilə kənar suallara (siyasət, tibbi məsləhət, proqramlaşdırma tapşırıqları və s.) nəzakətlə imtina et və söhbəti Sandıqla bağlı mövzuya yönləndir.
- Məhsul tövsiyə edərkən YALNIZ yuxarıdakı "Canlı sayt məlumatı" siyahısındakı elanlardan istifadə et — orada olmayan məhsulu heç vaxt uydurma.
- İstifadəçi büdcə və kateqoriya deyərsə (məs. "geyimdə 20 manata nə var"), siyahını filtrləyib uyğun elanları (#nömrə, ad, qiymət) təqdim et. Kateqoriya deyilməyibsə, hansı kateqoriyada axtardığını soruş.
- İstifadəçi öz elanları, səbəti və ya favoriləri haqqında soruşsa, yuxarıdakı "İstifadəçi haqqında məlumat" bölməsindən cavab ver.
- Qısa, aydın və dostcasına cavab ver — lazımsız uzun mətn yazma.
- İstifadəçinin yazdığı dildə cavab ver. Dil aydın deyilsə, ${langName} dilində cavab ver.`;
}

/** ChatController.Ask — proxies the question to Gemini with the site context. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message : "";
  const lang = typeof body.lang === "string" ? body.lang : "az";
  if (!message.trim() || message.length > 1000) return new NextResponse(null, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  if (!apiKey) return NextResponse.json({ reply: fallbackMessage(lang) });

  const history: ChatTurn[] = Array.isArray(body.history) ? (body.history as ChatTurn[]).slice(-20) : [];
  const contents = [
    ...history.map((turn) => ({
      role: turn?.role === "model" ? "model" : "user",
      parts: [{ text: String(turn?.text ?? "").slice(0, 4000) }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const systemPrompt = await buildSystemPrompt(lang, cleanItems(body.cart), cleanItems(body.favorites));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] }, contents }),
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ reply: fallbackMessage(lang) });
    const data = await res.json();
    const reply: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return NextResponse.json({ reply: reply ?? fallbackMessage(lang) });
  } catch {
    return NextResponse.json({ reply: fallbackMessage(lang) });
  }
}
