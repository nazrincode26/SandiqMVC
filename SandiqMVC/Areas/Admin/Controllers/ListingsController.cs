using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.Areas.Admin.ViewModels;
using SandiqMVC.DAL;
using SandiqMVC.Models;

namespace SandiqMVC.Areas.Admin.Controllers;

[Area("Admin")]
[Authorize(Roles = "Admin")]
public class ListingsController : Controller
{
    private readonly SandiqMvcDbContext _context;

    public ListingsController(SandiqMvcDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var pendingProducts = await _context.Products
            .Where(p => p.Status == "pending")
            .Include(p => p.Category)
            .Include(p => p.SubmittedBy)
            .ToListAsync();

        return View(pendingProducts);
    }

    [HttpPost]
    public async Task<IActionResult> Approve(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Status = "approved";
        product.ApprovedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    public async Task<IActionResult> Reject(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Status = "rejected";
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> AllListings(string filter = "all")
    {
        var query = _context.Products.Include(p => p.Category).Include(p => p.SubmittedBy).AsQueryable();

        if (filter == "active")
        {
            query = query.Where(p => p.Status != "deleted");
        }
        else if (filter == "deleted")
        {
            query = query.Where(p => p.Status == "deleted");
        }

        var products = await query.ToListAsync();

        ViewBag.CurrentFilter = filter;
        ViewBag.Categories = await _context.Categories.Where(c => c.ParentId == null).Include(c => c.Subcategories).ToListAsync();

        return View(products);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAdmin(AdminListingViewModel model)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var product = new Product
        {
            Title = model.Title,
            Description = model.Description,
            Price = model.Price,
            CategoryId = model.CategoryId,
            SubcategoryId = model.SubcategoryId,
            Condition = model.Condition,
            Location = model.Location,
            SubmittedByUserId = userId,
            Status = "approved"
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(AllListings));
    }

    [HttpPost]
    public async Task<IActionResult> EditAdmin(AdminListingViewModel model)
    {
        var product = await _context.Products.FindAsync(model.Id);
        if (product == null) return NotFound();

        product.Title = model.Title;
        product.Description = model.Description;
        product.Price = model.Price;
        product.CategoryId = model.CategoryId;
        product.SubcategoryId = model.SubcategoryId;
        product.Condition = model.Condition;
        product.Location = model.Location;

        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(AllListings));
    }

    [HttpPost]
    public async Task<IActionResult> SoftDelete(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Status = "deleted";
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(AllListings));
    }

    [HttpPost]
    public async Task<IActionResult> HardDelete(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(AllListings));
    }

    [HttpPost]
    public async Task<IActionResult> Restore(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Status = "approved";
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(AllListings));
    }
}
