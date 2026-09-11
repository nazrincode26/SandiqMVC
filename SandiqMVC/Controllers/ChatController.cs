using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;

namespace SandiqMVC.Controllers;

public class ChatController : Controller
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly SandiqMvcDbContext _context;

    public ChatController(IHttpClientFactory httpClientFactory, IConfiguration configuration, SandiqMvcDbContext context)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _context = context;
    }

    public class ChatTurn
    {
        public string Role { get; set; } = "user";
        public string Text { get; set; } = string.Empty;
    }

    public class ChatCartItem
    {
        public int ProductId { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public string Lang { get; set; } = "az";
        public List<ChatTurn>? History { get; set; }
        public List<ChatCartItem>? Cart { get; set; }
        public List<ChatCartItem>? Favorites { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Ask([FromBody] ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Length > 1000)
        {
            return BadRequest();
        }

        var apiKey = _configuration["Gemini:ApiKey"];
        var model = _configuration["Gemini:Model"] ?? "gemini-2.0-flash";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Json(new { reply = FallbackMessage(request.Lang) });
        }

        var contents = new List<object>();
        if (request.History != null)
        {
            foreach (var turn in request.History.TakeLast(20))
            {
                contents.Add(new
                {
                    role = turn.Role == "model" ? "model" : "user",
                    parts = new[] { new { text = turn.Text } }
                });
            }
        }
        contents.Add(new
        {
            role = "user",
            parts = new[] { new { text = request.Message } }
        });

        var systemPrompt = await BuildSystemPromptAsync(request.Lang, request.Cart, request.Favorites);

        var payload = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            },
            contents
        };

        var client = _httpClientFactory.CreateClient();
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        try
        {
            var json = JsonSerializer.Serialize(payload);
            var response = await client.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json"));

            if (!response.IsSuccessStatusCode)
            {
                return Json(new { reply = FallbackMessage(request.Lang) });
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseBody);

            string? reply = null;
            if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var firstCandidate = candidates[0];
                if (firstCandidate.TryGetProperty("content", out var content) &&
                    content.TryGetProperty("parts", out var parts) && parts.GetArrayLength() > 0)
                {
                    reply = parts[0].GetProperty("text").GetString();
                }
            }

            return Json(new { reply = reply ?? FallbackMessage(request.Lang) });
        }
        catch
        {
            return Json(new { reply = FallbackMessage(request.Lang) });
        }
    }

    private static string FallbackMessage(string lang) => lang switch
    {
        "ru" => "Извините, сейчас не могу ответить. Попробуйте позже.",
        "en" => "Sorry, I can't answer right now. Please try again later.",
        _ => "Üzr istəyirəm, hazırda cavab verə bilmirəm. Bir az sonra yenidən cəhd edin."
    };

    private async Task<string> BuildSystemPromptAsync(string lang, List<ChatCartItem>? cart, List<ChatCartItem>? favorites)
    {
        var langName = lang switch
        {
            "ru" => "русском",
            "en" => "English",
            _ => "Azərbaycan"
        };

        var catalog = await _context.Products
            .Where(p => p.Status == "approved")
            .Include(p => p.Category)
            .OrderByDescending(p => p.CreatedAt)
            .Take(200)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.Price,
                p.Condition,
                p.Location,
                Category = p.Category != null ? p.Category.Name : null
            })
            .ToListAsync();

        var catalogText = new StringBuilder();
        if (catalog.Any())
        {
            foreach (var p in catalog)
            {
                catalogText.AppendLine($"- #{p.Id} | {p.Title} | {p.Price.ToString("0.##")} ₼ | Kateqoriya: {p.Category ?? "-"} | Vəziyyət: {(p.Condition == "new" ? "Yeni" : "İşlənmiş")} | Yer: {p.Location ?? "-"}");
            }
        }
        else
        {
            catalogText.AppendLine("(Hazırda saytda təsdiqlənmiş elan yoxdur.)");
        }

        var userSection = new StringBuilder();
        var isAuthenticated = User.Identity?.IsAuthenticated == true;
        if (isAuthenticated)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var currentUser = await _context.Users.FindAsync(userId);

            userSection.AppendLine($"İstifadəçi daxil olub: {currentUser?.FullName} ({currentUser?.Email}).");

            var myListings = await _context.Products
                .Where(p => p.SubmittedByUserId == userId && p.Status != "deleted")
                .OrderByDescending(p => p.CreatedAt)
                .Take(20)
                .Select(p => new { p.Id, p.Title, p.Price, p.Status })
                .ToListAsync();

            if (myListings.Any())
            {
                userSection.AppendLine("Bu istifadəçinin öz elanları:");
                foreach (var l in myListings)
                {
                    var statusAz = l.Status switch { "approved" => "təsdiqlənib", "rejected" => "rədd edilib", _ => "gözləyir" };
                    userSection.AppendLine($"  - #{l.Id} {l.Title} — {l.Price.ToString("0.##")} ₼ ({statusAz})");
                }
            }
            else
            {
                userSection.AppendLine("Bu istifadəçinin hələ elanı yoxdur.");
            }
        }
        else
        {
            userSection.AppendLine("İstifadəçi hesaba daxil olmayıb (qonaq).");
        }

        if (cart != null && cart.Any())
        {
            userSection.AppendLine("İstifadəçinin səbətindəki məhsullar:");
            foreach (var c in cart)
            {
                userSection.AppendLine($"  - {c.Title} — {c.Price.ToString("0.##")} ₼ x {c.Quantity}");
            }
        }
        else
        {
            userSection.AppendLine("İstifadəçinin səbəti boşdur.");
        }

        if (favorites != null && favorites.Any())
        {
            userSection.AppendLine("İstifadəçinin favorilərindəki məhsullar:");
            foreach (var f in favorites)
            {
                userSection.AppendLine($"  - {f.Title} — {f.Price.ToString("0.##")} ₼");
            }
        }
        else
        {
            userSection.AppendLine("İstifadəçinin favorilər siyahısı boşdur.");
        }

        return $@"Sən Sandıq adlı 2-ci əl əşya alqı-satqı saytının (lalafo.az/tap.az kimi elanlar saytı) köməkçi chatbotusan.

Sayt haqqında faktlar:
- İstifadəçi qeydiyyatdan keçib (email/şifrə və ya Google ilə) elan yerləşdirə bilər. Elan admin tərəfindən yoxlanılıb təsdiqləndikdən sonra saytda görünür.
- İstifadəçi ""Mənim elanlarım"" səhifəsində öz elanlarını redaktə edə və silə bilər.
- Elanı redaktə etdikdə, o yenidən admin təsdiqinə göndərilir (status ""gözləyir"" olur).
- Axtarış yuxarıdakı axtarış qutusu ilə, kateqoriya səhifəsində qiymət aralığı, vəziyyət (yeni/işlənmiş) filtri və sıralama mövcuddur.
- Səbətə əlavə etmək üçün ""Səbətə at"" düyməsi, favorilərə əlavə üçün ürək (♥) işarəsi istifadə olunur.
- Sifariş vermək üçün səbətdən ""Sifarişi tamamla""ya keçilir, ödəniş kart üzərinə köçürmə ilə olur, admin təsdiqindən sonra satıcı ilə əlaqə saxlanılır.
- Şifrəni unutduqda giriş səhifəsindəki ""Şifrəni unutdum"" linki ilə qeydiyyatdan keçdiyi emailə 6 rəqəmli kod göndərilir.
- Qaydalar: silah, narkotik, saxta sənəd və qanunla qadağan olunmuş məhsulların satışı qəti qadağandır. Elanda göstərilən şəkil və təsvir məhsulun real vəziyyətinə uyğun olmalıdır.
- Təhlükəsiz alış-veriş: açıq və camaatlı yerlərdə görüş, məhsulu yoxladıqdan sonra ödəniş, ön ödəniş tələb edən və ya bazar qiymətindən çox aşağı olan şübhəli təkliflərə etibar etməmək.
- Əlaqə: email elaqe@sandiq.az, Instagram @sandiq.

CANLI SAYT MƏLUMATI (hazırkı təsdiqlənmiş elanlar, bu siyahı hər sualda yenilənir):
{catalogText}

İSTİFADƏÇİ HAQQINDA MƏLUMAT:
{userSection}

Davranış qaydaları:
- Yalnız Sandıq saytı, alış-veriş, elan yerləşdirmə, hesab və bənzər mövzularda kömək et.
- Sayt mövzusundan tamamilə kənar suallara (siyasət, tibbi məsləhət, proqramlaşdırma tapşırıqları və s.) nəzakətlə imtina et və söhbəti Sandıqla bağlı mövzuya yönləndir.
- Məhsul tövsiyə edərkən YALNIZ yuxarıdakı ""Canlı sayt məlumatı"" siyahısındakı elanlardan istifadə et — orada olmayan məhsulu heç vaxt uydurma.
- İstifadəçi büdcə və kateqoriya deyərsə (məs. ""geyimdə 20 manata nə var""), siyahını filtrləyib uyğun elanları (#nömrə, ad, qiymət) təqdim et. Kateqoriya deyilməyibsə, hansı kateqoriyada axtardığını soruş.
- İstifadəçi öz elanları, səbəti və ya favoriləri haqqında soruşsa, yuxarıdakı ""İstifadəçi haqqında məlumat"" bölməsindən cavab ver.
- Qısa, aydın və dostcasına cavab ver — lazımsız uzun mətn yazma.
- İstifadəçinin yazdığı dildə cavab ver. Dil aydın deyilsə, {langName} dilində cavab ver.";
    }
}
