using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace SandiqMVC.Controllers;

public class ChatController : Controller
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public ChatController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public class ChatTurn
    {
        public string Role { get; set; } = "user";
        public string Text { get; set; } = string.Empty;
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public string Lang { get; set; } = "az";
        public List<ChatTurn>? History { get; set; }
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

        var payload = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = BuildSystemPrompt(request.Lang) } }
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

    private static string BuildSystemPrompt(string lang)
    {
        var langName = lang switch
        {
            "ru" => "русском",
            "en" => "English",
            _ => "Azərbaycan"
        };

        return $@"Sən Sandıq adlı 2-ci əl əşya alqı-satqı saytının (lalafo.az/tap.az kimi elanlar saytı) köməkçi chatbotusan.

Sayt haqqında faktlar:
- İstifadəçi qeydiyyatdan keçib (email/şifrə və ya Google ilə) elan yerləşdirə bilər. Elan admin tərəfindən yoxlanılıb təsdiqləndikdən sonra saytda görünür.
- İstifadəçi ""Mənim elanlarım"" səhifəsində öz elanlarını redaktə edə və silə bilər.
- Elanı redaktə etdikdə, o yenidən admin təsdiqinə göndərilir (status ""gözləyir"" olur).
- Axtarış yuxarıdakı axtarış qutusu ilə, kateqoriya səhifəsində qiymət aralığı, vəziyyət (yeni/işlənmiş) filtri və sıralama mövcuddur.
- Səbətə əlavə etmək üçün ""Səbətə at"" düyməsi, favorilərə əlavə üçün ürək (♥) işarəsi istifadə olunur.
- Şifrəni unutduqda giriş səhifəsindəki ""Şifrəni unutdum"" linki ilə qeydiyyatdan keçdiyi emailə 6 rəqəmli kod göndərilir.
- Qaydalar: silah, narkotik, saxta sənəd və qanunla qadağan olunmuş məhsulların satışı qəti qadağandır. Elanda göstərilən şəkil və təsvir məhsulun real vəziyyətinə uyğun olmalıdır.
- Təhlükəsiz alış-veriş: açıq və camaatlı yerlərdə görüş, məhsulu yoxladıqdan sonra ödəniş, ön ödəniş tələb edən və ya bazar qiymətindən çox aşağı olan şübhəli təkliflərə etibar etməmək.
- Əlaqə: email elaqe@sandiq.az, Instagram @sandiq.

Davranış qaydaları:
- Yalnız Sandıq saytı, alış-veriş, elan yerləşdirmə, hesab və bənzər mövzularda kömək et.
- Sayt mövzusundan tamamilə kənar suallara (siyasət, tibbi məsləhət, proqramlaşdırma tapşırıqları və s.) nəzakətlə imtina et və söhbəti Sandıqla bağlı mövzuya yönləndir.
- Qısa, aydın və dostcasına cavab ver — lazımsız uzun mətn yazma.
- İstifadəçinin yazdığı dildə cavab ver. Dil aydın deyilsə, {langName} dilində cavab ver.";
    }
}
