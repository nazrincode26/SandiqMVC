using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;
using SandiqMVC.Models;

namespace SandiqMVC.Controllers;

public class ProductController : Controller
{
    private readonly SandiqMvcDbContext _context;

    public ProductController(SandiqMvcDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Details(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.SubmittedBy)
            .Include(p => p.Reviews).ThenInclude(r => r.User)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id && p.Status == "approved");

        if (product == null) return NotFound();

        product.ViewCount++;
        await _context.SaveChangesAsync();

        var sellerReviews = await _context.SellerReviews
            .Include(r => r.Reviewer)
            .Where(r => r.SellerId == product.SubmittedByUserId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        ViewBag.SellerReviews = sellerReviews;
        ViewBag.SellerAverageRating = sellerReviews.Count > 0 ? sellerReviews.Average(r => r.Rating) : (double?)null;

        if (User.Identity?.IsAuthenticated == true)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            ViewBag.CurrentUserId = userId;
            ViewBag.HasReviewedProduct = product.Reviews.Any(r => r.UserId == userId);
            ViewBag.HasReviewedSeller = sellerReviews.Any(r => r.ReviewerUserId == userId);
        }

        return View(product);
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AddProductReview(int productId, int rating, string? comment)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null) return NotFound();

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        rating = Math.Clamp(rating, 1, 5);

        var alreadyReviewed = await _context.ProductReviews
            .AnyAsync(r => r.ProductId == productId && r.UserId == userId);

        if (!alreadyReviewed && product.SubmittedByUserId != userId)
        {
            _context.ProductReviews.Add(new ProductReview
            {
                ProductId = productId,
                UserId = userId,
                Rating = rating,
                Comment = comment
            });
            await _context.SaveChangesAsync();
        }

        return RedirectToAction(nameof(Details), new { id = productId });
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AddSellerReview(int sellerId, int productId, int rating, string? comment)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        rating = Math.Clamp(rating, 1, 5);

        var alreadyReviewed = await _context.SellerReviews
            .AnyAsync(r => r.SellerId == sellerId && r.ReviewerUserId == userId);

        if (!alreadyReviewed && sellerId != userId)
        {
            _context.SellerReviews.Add(new SellerReview
            {
                SellerId = sellerId,
                ReviewerUserId = userId,
                Rating = rating,
                Comment = comment
            });
            await _context.SaveChangesAsync();
        }

        return RedirectToAction(nameof(Details), new { id = productId });
    }
}