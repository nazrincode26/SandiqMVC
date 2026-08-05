using Microsoft.EntityFrameworkCore;
using SandiqMVC.Models;

namespace SandiqMVC.DAL;

public class SandiqMvcDbContext : DbContext
{
    public SandiqMvcDbContext(DbContextOptions<SandiqMvcDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }

    //burabax

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
    }
}