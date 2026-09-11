using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;

namespace SandiqMVC.Areas.Admin.Controllers;

[Area("Admin")]
[Authorize(Roles = "Admin")]
public class OrdersController : Controller
{
    private readonly SandiqMvcDbContext _context;

    public OrdersController(SandiqMvcDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(string filter = "pending")
    {
        var query = _context.Orders
            .Include(o => o.Buyer)
            .Include(o => o.Items).ThenInclude(i => i.Seller)
            .AsQueryable();

        if (filter == "pending")
        {
            query = query.Where(o => o.Status == "pending");
        }
        else if (filter == "confirmed")
        {
            query = query.Where(o => o.Status == "confirmed");
        }

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();

        ViewBag.CurrentFilter = filter;
        return View(orders);
    }

    [HttpPost]
    public async Task<IActionResult> Confirm(int id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();

        order.Status = "confirmed";
        order.ConfirmedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    public async Task<IActionResult> Cancel(int id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();

        order.Status = "cancelled";
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }
}
