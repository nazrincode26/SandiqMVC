"use client";

/** Shown when an admin operation fails (e.g. deleting a category that is still in use). */
export default function AdminError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div>
      <h2>Xəta baş verdi</h2>
      <p>Gözlənilməz bir xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.</p>
      {error.digest && (
        <p>
          Request ID: <code>{error.digest}</code>
        </p>
      )}
      <p>
        <a href="/admin">Admin panelə qayıt</a>
      </p>
    </div>
  );
}
