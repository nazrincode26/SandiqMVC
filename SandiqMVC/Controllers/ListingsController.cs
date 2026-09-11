using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;
using SandiqMVC.Models;

namespace SandiqMVC.Controllers;

public class ListingsController : Controller
{
    private readonly SandiqMvcDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public ListingsController(SandiqMvcDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    private async Task<string?> SaveImageAsync(IFormFile? imageFile)
    {
        if (imageFile == null || imageFile.Length == 0)
        {
            return null;
        }

        var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "products");
        Directory.CreateDirectory(uploadsFolder);

        var extension = Path.GetExtension(imageFile.FileName);
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await imageFile.CopyToAsync(stream);
        }

        return $"/uploads/products/{fileName}";
    }

    private async Task<List<string>> SaveImagesAsync(List<IFormFile>? imageFiles)
    {
        var paths = new List<string>();
        if (imageFiles == null)
        {
            return paths;
        }

        foreach (var file in imageFiles.Take(Product.MaxImages))
        {
            var path = await SaveImageAsync(file);
            if (path != null)
            {
                paths.Add(path);
            }
        }

        return paths;
    }

    private async Task<bool> IsValidTitleAsync(string? title)
    {
        if (string.IsNullOrWhiteSpace(title)) return false;

        var normalized = title.Trim();
        var keywords = await _context.SearchKeywords.Where(k => k.Lang == "az").Select(k => k.Keyword).ToListAsync();
        return keywords.Contains(normalized, StringComparer.OrdinalIgnoreCase);
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

        if (model.ImageFiles != null && model.ImageFiles.Count > Product.MaxImages)
        {
            ModelState.AddModelError(string.Empty, $"Maksimum {Product.MaxImages} şəkil yükləyə bilərsiniz.");
        }

        if (!string.IsNullOrWhiteSpace(model.Title) && !await IsValidTitleAsync(model.Title))
        {
            ModelState.AddModelError(nameof(model.Title), "Başlıq yalnız siyahıdakı açar sözlərdən biri ola bilər.");
        }

        if (!ModelState.IsValid)
        {
            model.Categories = await _context.Categories.Where(c => c.ParentId == null).Include(c => c.Subcategories).ToListAsync();
            return View(model);
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var imagePaths = await SaveImagesAsync(model.ImageFiles);

        var product = new Product
        {
            Title = model.Title,
            Description = model.Description,
            Price = model.Price,
            CategoryId = model.CategoryId,
            SubcategoryId = model.SubcategoryId,
            Condition = model.Condition,
            Location = model.Location,
            Image = imagePaths.FirstOrDefault(),
            SubmittedByUserId = userId,
            Status = "pending"
        };

        for (var i = 0; i < imagePaths.Count; i++)
        {
            product.Images.Add(new ProductImage { Path = imagePaths[i], SortOrder = i });
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return RedirectToAction("Index", "Home");
    }

    [Authorize]
    public async Task<IActionResult> MyListings()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var listings = await _context.Products
            .Where(p => p.SubmittedByUserId == userId && p.Status != "deleted")
            .ToListAsync();

        var pendingRequests = await _context.ListingRequests
            .Where(r => r.Status == "pending" && r.RequestedByUserId == userId)
            .ToListAsync();

        ViewBag.PendingRequestTypeByProductId = pendingRequests.ToDictionary(r => r.ProductId, r => r.Type);

        return View(listings);
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var product = await _context.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id && p.SubmittedByUserId == userId);
        if (product == null) return NotFound();

        var model = new SandiqMVC.ViewModels.EditListingViewModel
        {
            Id = product.Id,
            Title = product.Title,
            Description = product.Description ?? string.Empty,
            Price = product.Price,
            CategoryId = product.CategoryId,
            SubcategoryId = product.SubcategoryId,
            Condition = product.Condition ?? "used",
            Location = product.Location,
            ExistingImages = GetProductImagePaths(product),
            Categories = await _context.Categories.Where(c => c.ParentId == null).Include(c => c.Subcategories).ToListAsync()
        };

        return View(model);
    }

    private static List<string> GetProductImagePaths(Product product)
    {
        if (product.Images.Any())
        {
            return product.Images.OrderBy(i => i.SortOrder).Select(i => i.Path).ToList();
        }

        return product.Image != null ? new List<string> { product.Image } : new List<string>();
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Edit(SandiqMVC.ViewModels.EditListingViewModel model)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var product = await _context.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == model.Id && p.SubmittedByUserId == userId);
        if (product == null) return NotFound();

        if (model.ImageFiles != null && model.ImageFiles.Count > Product.MaxImages)
        {
            ModelState.AddModelError(string.Empty, $"Maksimum {Product.MaxImages} şəkil yükləyə bilərsiniz.");
        }

        if (!string.IsNullOrWhiteSpace(model.Title) && !await IsValidTitleAsync(model.Title))
        {
            ModelState.AddModelError(nameof(model.Title), "Başlıq yalnız siyahıdakı açar sözlərdən biri ola bilər.");
        }

        if (!ModelState.IsValid)
        {
            model.ExistingImages = GetProductImagePaths(product);
            model.Categories = await _context.Categories.Where(c => c.ParentId == null).Include(c => c.Subcategories).ToListAsync();
            return View(model);
        }

        var hasPendingRequest = await _context.ListingRequests
            .AnyAsync(r => r.ProductId == product.Id && r.Status == "pending");

        if (hasPendingRequest)
        {
            TempData["Message"] = "Bu elan üçün artıq gözləyən sorğu var. Admin baxana qədər yeni sorğu göndərə bilməzsiniz.";
            return RedirectToAction(nameof(MyListings));
        }

        var request = new ListingRequest
        {
            ProductId = product.Id,
            RequestedByUserId = userId,
            Type = "edit",
            Title = model.Title,
            Description = model.Description,
            Price = model.Price,
            CategoryId = model.CategoryId,
            SubcategoryId = model.SubcategoryId,
            Condition = model.Condition,
            Location = model.Location
        };

        var newImagePaths = await SaveImagesAsync(model.ImageFiles);
        if (newImagePaths.Any())
        {
            request.Image = newImagePaths.First();
            request.ImagesJson = JsonSerializer.Serialize(newImagePaths);
        }

        _context.ListingRequests.Add(request);
        await _context.SaveChangesAsync();

        TempData["Message"] = "Redaktə sorğunuz göndərildi. Admin təsdiqindən sonra dəyişikliklər tətbiq olunacaq.";
        return RedirectToAction(nameof(MyListings));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.SubmittedByUserId == userId);
        if (product == null) return NotFound();

        var hasPendingRequest = await _context.ListingRequests
            .AnyAsync(r => r.ProductId == product.Id && r.Status == "pending");

        if (hasPendingRequest)
        {
            TempData["Message"] = "Bu elan üçün artıq gözləyən sorğu var. Admin baxana qədər yeni sorğu göndərə bilməzsiniz.";
            return RedirectToAction(nameof(MyListings));
        }

        _context.ListingRequests.Add(new ListingRequest
        {
            ProductId = product.Id,
            RequestedByUserId = userId,
            Type = "delete"
        });
        await _context.SaveChangesAsync();

        TempData["Message"] = "Silmə sorğunuz göndərildi. Admin təsdiqindən sonra elan silinəcək.";
        return RedirectToAction(nameof(MyListings));
    }
}