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
        var requested = await _context.Categories.Include(c => c.Subcategories).FirstOrDefaultAsync(c => c.Id == id);
        if (requested == null) return NotFound();

        IQueryable<Product> query;
        Category topCategory;
        int? selectedSubcategoryId = null;

        if (requested.ParentId.HasValue)
        {
            // The requested id is itself a subcategory: filter products by it, but display the parent's subcategory list for navigation.
            topCategory = await _context.Categories.Include(c => c.Subcategories).FirstAsync(c => c.Id == requested.ParentId.Value);
            selectedSubcategoryId = requested.Id;
            query = _context.Products.Where(p => p.Status == "approved" && p.SubcategoryId == requested.Id);
        }
        else
        {
            topCategory = requested;
            query = _context.Products.Where(p => p.Status == "approved" && p.CategoryId == requested.Id);
        }

        query = ApplyFilters(query, minPrice, maxPrice, condition, sort);

        var products = await query.ToListAsync();

        var model = new CategoryPageViewModel
        {
            Category = topCategory,
            Products = products,
            Subcategories = topCategory.Subcategories.ToList(),
            SelectedSubcategoryId = selectedSubcategoryId
        };

        return View(model);
    }

    [HttpGet]
    public async Task<IActionResult> SearchSuggestions(string q, string lang = "az")
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
        {
            return Json(Array.Empty<object>());
        }

        var term = q.Trim().ToLowerInvariant();
        var validLang = lang is "az" or "ru" or "en" ? lang : "az";

        var keywords = await _context.SearchKeywords
            .Where(k => k.Lang == validLang)
            .Include(k => k.Category)
            .ToListAsync();

        var suggestions = keywords
            .Where(k => k.Category != null && (k.Keyword.Contains(term) || term.Contains(k.Keyword)))
            .Select(k => k.Category!)
            .GroupBy(c => c.Id)
            .Select(g => g.First())
            .Take(8)
            .Select(c => new
            {
                id = c.Id,
                name = validLang == "ru" ? (c.NameRu ?? c.Name) : validLang == "en" ? (c.NameEn ?? c.Name) : c.Name
            });

        return Json(suggestions);
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
            "newest" => query.OrderByDescending(p => p.CreatedAt),
            "oldest" => query.OrderBy(p => p.CreatedAt),
            _ => query.OrderBy(p => p.Title),
        };

        return query;
    }
}