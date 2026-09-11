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
    private readonly IWebHostEnvironment _environment;

    public ListingsController(SandiqMvcDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    private async Task<List<string>> SaveImagesAsync(List<IFormFile>? imageFiles)
    {
        var paths = new List<string>();
        if (imageFiles == null)
        {
            return paths;
        }

        var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "products");
        Directory.CreateDirectory(uploadsFolder);

        foreach (var file in imageFiles.Take(Product.MaxImages))
        {
            if (file == null || file.Length == 0) continue;

            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            paths.Add($"/uploads/products/{fileName}");
        }

        return paths;
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
        var query = _context.Products.Include(p => p.Category).Include(p => p.SubmittedBy).Include(p => p.Images).AsQueryable();

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
            Status = "approved"
        };

        for (var i = 0; i < imagePaths.Count; i++)
        {
            product.Images.Add(new ProductImage { Path = imagePaths[i], SortOrder = i });
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(AllListings));
    }

    [HttpPost]
    public async Task<IActionResult> EditAdmin(AdminListingViewModel model)
    {
        var product = await _context.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == model.Id);
        if (product == null) return NotFound();

        product.Title = model.Title;
        product.Description = model.Description;
        product.Price = model.Price;
        product.CategoryId = model.CategoryId;
        product.SubcategoryId = model.SubcategoryId;
        product.Condition = model.Condition;
        product.Location = model.Location;

        if (model.ImageFiles != null && model.ImageFiles.Any(f => f.Length > 0))
        {
            var imagePaths = await SaveImagesAsync(model.ImageFiles);
            _context.ProductImages.RemoveRange(product.Images);
            product.Images.Clear();
            for (var i = 0; i < imagePaths.Count; i++)
            {
                product.Images.Add(new ProductImage { ProductId = product.Id, Path = imagePaths[i], SortOrder = i });
            }
            product.Image = imagePaths.FirstOrDefault() ?? product.Image;
        }

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
