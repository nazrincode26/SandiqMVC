using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;

namespace SandiqMVC.Areas.Admin.Controllers;

[Area("Admin")]
[Authorize(Roles = "Admin")]
public class RequestsController : Controller
{
    private readonly SandiqMvcDbContext _context;

    public RequestsController(SandiqMvcDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var requests = await _context.ListingRequests
            .Include(r => r.Product).ThenInclude(p => p!.Category)
            .Include(r => r.RequestedBy)
            .Where(r => r.Status == "pending")
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        ViewBag.Categories = await _context.Categories.ToListAsync();

        return View(requests);
    }

    [HttpPost]
    public async Task<IActionResult> Approve(int id)
    {
        var request = await _context.ListingRequests
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null) return NotFound();
        if (request.Status != "pending" || request.Product == null) return RedirectToAction(nameof(Index));

        if (request.Type == "edit")
        {
            var product = request.Product;
            product.Title = request.Title ?? product.Title;
            product.Description = request.Description;
            product.Price = request.Price ?? product.Price;
            product.CategoryId = request.CategoryId ?? product.CategoryId;
            product.SubcategoryId = request.SubcategoryId;
            product.Condition = request.Condition;
            product.Location = request.Location;

            if (!string.IsNullOrEmpty(request.Image))
            {
                product.Image = request.Image;
            }
        }
        else if (request.Type == "delete")
        {
            request.Product.Status = "deleted";
        }

        request.Status = "approved";
        request.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    public async Task<IActionResult> Reject(int id)
    {
        var request = await _context.ListingRequests.FindAsync(id);
        if (request == null) return NotFound();

        request.Status = "rejected";
        request.ReviewedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }
}
