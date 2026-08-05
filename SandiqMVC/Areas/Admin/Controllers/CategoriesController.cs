using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.Areas.Admin.ViewModels;
using SandiqMVC.DAL;
using SandiqMVC.Models;
using SandiqMVC.ViewModels;

namespace SandiqMVC.Areas.Admin.Controllers;

[Area("Admin")]
[Authorize(Roles = "Admin")]
public class CategoriesController : Controller
{
    private readonly SandiqMvcDbContext _context;

    public CategoriesController(SandiqMvcDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var categories = await _context.Categories
            .Where(c => c.ParentId == null)
            .Include(c => c.Subcategories)
            .ToListAsync();
        return View(categories);
    }

    [HttpGet]
    public IActionResult Create()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Create(CategoryViewModel model)
    {
        if (!ModelState.IsValid) return View(model);

        var category = new Category
        {
            Name = model.Name,
            NameRu = model.NameRu,
            NameEn = model.NameEn,
            Icon = model.Icon,
            ParentId = model.ParentId
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();

        var model = new CategoryViewModel
        {
            Id = category.Id,
            Name = category.Name,
            NameRu = category.NameRu,
            NameEn = category.NameEn,
            Icon = category.Icon
        };

        return View(model);
    }

    [HttpPost]
    public async Task<IActionResult> Edit(CategoryViewModel model)
    {
        if (!ModelState.IsValid) return View(model);

        var category = await _context.Categories.FindAsync(model.Id);
        if (category == null) return NotFound();

        category.Name = model.Name;
        category.NameRu = model.NameRu;
        category.NameEn = model.NameEn;
        category.Icon = model.Icon;
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Search(string q)
    {
        var products = string.IsNullOrWhiteSpace(q)
            ? new List<Product>()
            : await _context.Products
                .Where(p => p.Status == "approved" && p.Title.Contains(q))
                .ToListAsync();

        var model = new CategoryPageViewModel
        {
            Category = new Category { Name = $"Axtarış: \"{q}\"" },
            Products = products
        };

        return View("Index", model);
    }
}