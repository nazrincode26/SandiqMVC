using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;
using SandiqMVC.Models;

namespace SandiqMVC.Areas.Admin.Controllers;

[Area("Admin")]
[Authorize(Roles = "Admin")]
public class PaymentCardsController : Controller
{
    private readonly SandiqMvcDbContext _context;

    public PaymentCardsController(SandiqMvcDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var cards = await _context.PaymentCards.OrderBy(c => c.SortOrder).ToListAsync();
        return View(cards);
    }

    private static string? NormalizeCardNumber(string? raw)
    {
        var digits = new string((raw ?? string.Empty).Where(char.IsDigit).ToArray());
        return digits.Length == 16 ? string.Join(" ", Enumerable.Range(0, 4).Select(i => digits.Substring(i * 4, 4))) : null;
    }

    [HttpPost]
    public async Task<IActionResult> Create(PaymentCard model)
    {
        var normalized = NormalizeCardNumber(model.CardNumber);
        if (normalized == null)
        {
            TempData["Message"] = "Kart nömrəsi düz 16 rəqəmdən ibarət olmalıdır.";
            return RedirectToAction(nameof(Index));
        }

        model.CardNumber = normalized;
        _context.PaymentCards.Add(model);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    public async Task<IActionResult> Edit(PaymentCard model)
    {
        var card = await _context.PaymentCards.FindAsync(model.Id);
        if (card == null) return NotFound();

        var normalized = NormalizeCardNumber(model.CardNumber);
        if (normalized == null)
        {
            TempData["Message"] = "Kart nömrəsi düz 16 rəqəmdən ibarət olmalıdır.";
            return RedirectToAction(nameof(Index));
        }

        card.BankName = model.BankName;
        card.CardNumber = normalized;
        card.CardHolderName = model.CardHolderName;
        card.SortOrder = model.SortOrder;
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var card = await _context.PaymentCards.FindAsync(id);
        if (card == null) return NotFound();

        card.IsActive = !card.IsActive;
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var card = await _context.PaymentCards.FindAsync(id);
        if (card == null) return NotFound();

        _context.PaymentCards.Remove(card);
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }
}
