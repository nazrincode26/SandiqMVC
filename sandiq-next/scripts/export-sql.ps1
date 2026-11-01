# Exports every table of the old Sandiq SQL Server database to JSON files for
# scripts/migrate-from-sql.ts. It only runs SELECT statements; nothing is changed.
#
#   powershell -ExecutionPolicy Bypass -File scripts/export-sql.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/export-sql.ps1 -ConnectionString "Server=...;Database=SandiqMvcDb;..."
param(
    [string]$ConnectionString = "Server=.\SQLEXPRESS;Database=SandiqMvcDb;Trusted_Connection=True;TrustServerCertificate=True",
    [string]$OutDir = "migration-data"
)

$tables = @("Users", "Categories", "Products", "ProductImages", "ProductReviews", "SellerReviews",
            "ListingRequests", "Orders", "OrderItems", "PaymentCards", "SearchKeywords")

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$connection = New-Object System.Data.SqlClient.SqlConnection $ConnectionString
$connection.Open()
try {
    foreach ($table in $tables) {
        $command = $connection.CreateCommand()
        $command.CommandText = "SELECT * FROM [$table] FOR JSON PATH, INCLUDE_NULL_VALUES"
        $reader = $command.ExecuteReader()
        $builder = New-Object System.Text.StringBuilder
        while ($reader.Read()) { [void]$builder.Append($reader.GetString(0)) }
        $reader.Close()
        $json = $builder.ToString()
        if (-not $json) { $json = "[]" }
        [System.IO.File]::WriteAllText((Join-Path (Resolve-Path $OutDir) "$table.json"), $json, (New-Object System.Text.UTF8Encoding $false))
        Write-Host "Exported $table"
    }
}
finally {
    $connection.Close()
}
