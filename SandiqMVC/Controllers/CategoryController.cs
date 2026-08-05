using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;
using SandiqMVC.Models;
using SandiqMVC.ViewModels;

namespace SandiqMVC.Controllers;

public class CategoryController : Controller
{
    private readonly SandiqMvcDbContext _context;

    public CategoryController(SandiqMvcDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(int id, decimal? minPrice, decimal? maxPrice, string? condition, string? sort)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();

        var query = _context.Products
            .Where(p => p.Status == "approved" && p.CategoryId == id)
            .AsQueryable();

        query = ApplyFilters(query, minPrice, maxPrice, condition, sort);

        var products = await query.ToListAsync();

        var model = new CategoryPageViewModel
        {
            Category = category,
            Products = products
        };

        return View(model);
    }

    public async Task<IActionResult> Search(string q, decimal? minPrice, decimal? maxPrice, string? condition, string? sort)
    {
        var query = string.IsNullOrWhiteSpace(q)
            ? Enumerable.Empty<Product>().AsQueryable()
            : _context.Products.Where(p => p.Status == "approved" && p.Title.Contains(q));

        query = ApplyFilters(query, minPrice, maxPrice, condition, sort);

        var products = await query.ToListAsync();

        var model = new CategoryPageViewModel
        {
            Category = new Category { Name = $"Axtarış: \"{q}\"" },
            Products = products
        };

        return View("Index", model);
    }

    private static IQueryable<Product> ApplyFilters(IQueryable<Product> query, decimal? minPrice, decimal? maxPrice, string? condition, string? sort)
    {
        if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice.Value);
        if (!string.IsNullOrEmpty(condition)) query = query.Where(p => p.Condition == condition);

        query = sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "oldest" => query.OrderBy(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt),
        };

        return query;
    }
}