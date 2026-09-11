using Microsoft.EntityFrameworkCore;
using SandiqMVC.Models;

namespace SandiqMVC.DAL;

public class SandiqMvcDbContext : DbContext
{
    public SandiqMvcDbContext(DbContextOptions<SandiqMvcDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductReview> ProductReviews { get; set; }
    public DbSet<SellerReview> SellerReviews { get; set; }
    public DbSet<ListingRequest> ListingRequests { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<PaymentCard> PaymentCards { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<SearchKeyword> SearchKeywords { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>()
            .HasOne(c => c.Parent)
            .WithMany(c => c.Subcategories)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Subcategory)
            .WithMany()
            .HasForeignKey(p => p.SubcategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.SubmittedBy)
            .WithMany()
            .HasForeignKey(p => p.SubmittedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProductReview>()
            .HasOne(r => r.Product)
            .WithMany(p => p.Reviews)
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProductReview>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SellerReview>()
            .HasOne(r => r.Seller)
            .WithMany()
            .HasForeignKey(r => r.SellerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SellerReview>()
            .HasOne(r => r.Reviewer)
            .WithMany()
            .HasForeignKey(r => r.ReviewerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ListingRequest>()
            .HasOne(r => r.Product)
            .WithMany()
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ListingRequest>()
            .HasOne(r => r.RequestedBy)
            .WithMany()
            .HasForeignKey(r => r.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProductImage>()
            .HasOne(i => i.Product)
            .WithMany(p => p.Images)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Buyer)
            .WithMany()
            .HasForeignKey(o => o.BuyerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderItem>()
            .HasOne(i => i.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(i => i.Product)
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderItem>()
            .HasOne(i => i.Seller)
            .WithMany()
            .HasForeignKey(i => i.SellerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SearchKeyword>()
            .HasOne(k => k.Category)
            .WithMany()
            .HasForeignKey(k => k.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}