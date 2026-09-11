using Google.Apis.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;
using SandiqMVC.Models;
using SandiqMVC.Services;
using SandiqMVC.ViewModels;
using System.Security.Claims;

namespace SandiqMVC.Controllers;

public class AccountController : Controller
{
    private readonly SandiqMvcDbContext _context;
    private readonly EmailService _emailService;
    private readonly IConfiguration _configuration;

    public AccountController(SandiqMvcDbContext context, EmailService emailService, IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
    }

    [HttpGet]
    public IActionResult Register()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        var phone = model.Phone;
        if (!NormalizePhone(ref phone, required: false, out var phoneError))
        {
            ModelState.AddModelError(nameof(model.Phone), phoneError!);
        }
        model.Phone = phone;

        if (!ModelState.IsValid) return View(model);

        if (await _context.Users.AnyAsync(u => u.Email == model.Email))
        {
            ModelState.AddModelError("", "Bu email artıq qeydiyyatdan keçib.");
            return View(model);
        }

        var user = new User
        {
            FullName = model.FullName,
            Email = model.Email,
            Phone = model.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await SignInUser(user);

        return RedirectToAction("Index", "Home");
    }

    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;

        if (!ModelState.IsValid) return View(model);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

        if (user == null || user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash))
        {
            ModelState.AddModelError("", "Email və ya şifrə yanlışdır.");
            return View(model);
        }

        await SignInUser(user);

        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
        {
            return Redirect(returnUrl);
        }

        return RedirectToAction("Index", "Home");
    }

    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction("Index", "Home");
    }

    public class GoogleLoginRequest
    {
        public string Credential { get; set; } = string.Empty;
    }

    [HttpPost]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        GoogleJsonWebSignature.Payload payload;

        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _configuration["Google:ClientId"] }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(request.Credential, settings);
        }
        catch (Exception)
        {
            return BadRequest();
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);

        if (user == null)
        {
            user = new User
            {
                FullName = payload.Name ?? payload.Email,
                Email = payload.Email,
                GoogleId = payload.Subject
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else if (user.GoogleId == null)
        {
            user.GoogleId = payload.Subject;
            await _context.SaveChangesAsync();
        }

        await SignInUser(user);

        return Ok(new { needsPhone = string.IsNullOrWhiteSpace(user.Phone) });
    }

    [Authorize]
    [HttpGet]
    public IActionResult CompleteProfile()
    {
        return View();
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CompleteProfile(CompleteProfileViewModel model)
    {
        var phone = model.Phone;
        if (!NormalizePhone(ref phone, required: true, out var phoneError))
        {
            ModelState.AddModelError(nameof(model.Phone), phoneError!);
        }
        model.Phone = phone ?? string.Empty;

        if (!ModelState.IsValid) return View(model);

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.Phone = model.Phone;
        await _context.SaveChangesAsync();

        return RedirectToAction("Index", "Home");
    }

    [HttpGet]
    public IActionResult ForgotPassword()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordViewModel model)
    {
        if (!ModelState.IsValid) return View(model);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

        if (user != null)
        {
            var code = new Random().Next(100000, 999999).ToString();
            user.ResetToken = code;
            user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);
            await _context.SaveChangesAsync();

            await _emailService.SendPasswordResetEmailAsync(user.Email, code);
        }

        ViewBag.Success = true;
        return View(model);
    }

    [HttpGet]
    public IActionResult ResetPassword()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
    {
        if (!ModelState.IsValid) return View(model);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

        if (user == null || user.ResetToken != model.Code || user.ResetTokenExpiry < DateTime.UtcNow)
        {
            ModelState.AddModelError("", "Kod yanlışdır və ya vaxtı bitib.");
            return View(model);
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
        user.ResetToken = null;
        user.ResetTokenExpiry = null;
        await _context.SaveChangesAsync();

        ViewBag.Success = true;
        return View(model);
    }

    private static bool NormalizePhone(ref string? phone, bool required, out string? error)
    {
        error = null;
        var trimmed = phone?.Trim();

        if (string.IsNullOrWhiteSpace(trimmed) || trimmed == "+994")
        {
            phone = null;
            if (required)
            {
                error = "Telefon nömrəsi tələb olunur.";
                return false;
            }
            return true;
        }

        if (!System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"^\+994 \d{2} \d{3} \d{2} \d{2}$"))
        {
            error = "Telefon nömrəsi düzgün formatda deyil (+994 XX XXX XX XX).";
            return false;
        }

        phone = trimmed;
        return true;
    }

    private async Task SignInUser(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.IsAdmin ? "Admin" : "User")
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> Settings()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        var model = new SettingsViewModel
        {
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone
        };

        return View(model);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Settings(SettingsViewModel model)
    {
        var phone = model.Phone;
        if (!NormalizePhone(ref phone, required: false, out var phoneError))
        {
            ModelState.AddModelError(nameof(model.Phone), phoneError!);
        }
        model.Phone = phone;

        if (!ModelState.IsValid) return View(model);

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.FullName = model.FullName;
        user.Email = model.Email;
        user.Phone = model.Phone;
        await _context.SaveChangesAsync();

        await SignInUser(user);

        ViewBag.Success = true;
        return View(model);
    }
}