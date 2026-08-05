using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;
using SandiqMVC.Models;

namespace SandiqMVC.Controllers;

public class ListingsController : Controller
{
    private readonly SandiqMvcDbContext _context;

    public ListingsController(SandiqMvcDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Create()
    {
        var model = new SandiqMVC.ViewModels.CreateListingViewModel
        {
            Categories = await _context.Categories.Where(c => c.ParentId == null).Include(c => c.Subcategories).ToListAsync()
        };

        return View(model);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(SandiqMVC.ViewModels.CreateListingViewModel model)
    {
        if (!model.AcceptTerms)
        {
            ModelState.AddModelError(string.Empty, "Zəhmət olmasa elan paylaşma şərtlərini oxuyub qəbul edin.");
        }

        if (!ModelState.IsValid)
        {
            model.Categories = await _context.Categories.Where(c => c.ParentId == null).Include(c => c.Subcategories).ToListAsync();
            return View(model);
        }

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
            Status = "pending"
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return RedirectToAction("Index", "Home");
    }

    [Authorize]
    public async Task<IActionResult> MyListings()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var listings = await _context.Products
            .Where(p => p.SubmittedByUserId == userId)
            .ToListAsync();

        return View(listings);
    }
}
