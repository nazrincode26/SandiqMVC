using System.Security.Claims;
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
            Image = await SaveImageAsync(model.ImageFile),
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
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.SubmittedByUserId == userId);
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
            ExistingImage = product.Image,
            Categories = await _context.Categories.Where(c => c.ParentId == null).Include(c => c.Subcategories).ToListAsync()
        };

        return View(model);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Edit(SandiqMVC.ViewModels.EditListingViewModel model)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == model.Id && p.SubmittedByUserId == userId);
        if (product == null) return NotFound();

        if (!ModelState.IsValid)
        {
            model.ExistingImage = product.Image;
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

        if (model.ImageFile != null && model.ImageFile.Length > 0)
        {
            request.Image = await SaveImageAsync(model.ImageFile);
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