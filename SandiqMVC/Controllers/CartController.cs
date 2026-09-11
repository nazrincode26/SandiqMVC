using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;
using SandiqMVC.Models;

namespace SandiqMVC.Controllers;

public class CartController : Controller
{
    private readonly SandiqMvcDbContext _context;

    public CartController(SandiqMvcDbContext context)
    {
        _context = context;
    }

    public IActionResult Index()
    {
        return View();
    }

    [Authorize]
    public async Task<IActionResult> Checkout()
    {
        ViewBag.PaymentCards = await _context.PaymentCards
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        return View();
    }

    public class PlaceOrderItem
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class PlaceOrderRequest
    {
        public List<PlaceOrderItem> Items { get; set; } = new();
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest request)
    {
        if (request.Items == null || !request.Items.Any())
        {
            return BadRequest(new { message = "Səbət boşdur." });
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();

        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id) && p.Status == "approved")
            .ToDictionaryAsync(p => p.Id);

        var order = new Order
        {
            BuyerUserId = userId,
            Status = "pending"
        };

        var skippedOwnListings = 0;

        foreach (var line in request.Items)
        {
            if (!products.TryGetValue(line.ProductId, out var product)) continue;
            if (product.SubmittedByUserId == userId)
            {
                skippedOwnListings++;
                continue;
            }
            var quantity = Math.Max(1, line.Quantity);

            var lineTotal = product.Price * quantity;
            var fee = Math.Round(lineTotal * Order.PlatformFeeRate, 2);
            var sellerAmount = lineTotal - fee;

            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                Title = product.Title,
                UnitPrice = product.Price,
                Quantity = quantity,
                SellerUserId = product.SubmittedByUserId,
                PlatformFeeAmount = fee,
                SellerAmount = sellerAmount
            });
        }

        if (!order.Items.Any())
        {
            var message = skippedOwnListings > 0
                ? "Öz elanınızı ala bilməzsiniz."
                : "Səbətdəki məhsullar artıq mövcud deyil.";
            return BadRequest(new { message });
        }

        order.TotalAmount = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        order.PlatformFeeAmount = order.Items.Sum(i => i.PlatformFeeAmount);
        order.SellerPayoutAmount = order.Items.Sum(i => i.SellerAmount);

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Json(new { orderId = order.Id, skippedOwnListings });
    }

    [Authorize]
    public async Task<IActionResult> OrderConfirmation(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.BuyerUserId == userId);

        if (order == null) return NotFound();

        return View(order);
    }

    [Authorize]
    public async Task<IActionResult> MyOrders()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var orders = await _context.Orders
            .Include(o => o.Items)
            .Where(o => o.BuyerUserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return View(orders);
    }
}
