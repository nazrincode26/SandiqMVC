import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";

function Flower() {
  return (
    <>
      <svg className="flower-svg" width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="0" x2="20" y2="12" stroke="#7A8B5C" strokeWidth="2" />
        <g transform="translate(20,22)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse key={deg} cx="0" cy="-8" rx="3" ry="9" fill="#FFFFFF" stroke="#E5DCC8" strokeWidth="0.5" transform={`rotate(${deg})`} />
          ))}
          <circle cx="0" cy="0" r="5" fill="#F4C542" />
          <circle cx="0" cy="0" r="5" fill="none" stroke="#D9A62E" strokeWidth="0.5" />
        </g>
      </svg>
      <svg className="bee-icon" width="16" height="12" viewBox="0 0 16 12" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="8" cy="6" rx="6" ry="4" fill="#F4C542" />
        <path d="M4 4 Q8 2, 12 4" stroke="#3D2B1E" strokeWidth="1.5" fill="none" />
        <path d="M4 6 Q8 8, 12 6" stroke="#3D2B1E" strokeWidth="1.5" fill="none" />
        <ellipse cx="3" cy="3" rx="3" ry="2" fill="#FFFFFF" opacity="0.6" transform="rotate(-20 3 3)" />
        <ellipse cx="4" cy="8" rx="3" ry="2" fill="#FFFFFF" opacity="0.6" transform="rotate(20 4 8)" />
      </svg>
    </>
  );
}

/** Areas/Admin/Views/Shared/_AdminLayout.cshtml */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const db = adminDb();
  const [requests, orders] = await Promise.all([
    db.collection("listingRequests").where("status", "==", "pending").count().get(),
    db.collection("orders").where("status", "==", "pending").count().get(),
  ]);
  const pendingRequestCount = requests.data().count;
  const pendingOrderCount = orders.data().count;

  return (
    <>
      <header id="header">
        <div className="admin-header__container">
          <a href="/admin/listings" className="admin-header__logo">
            Sandıq <span>Admin</span>
          </a>
          <nav className="admin-header__nav">
            <a href="/">Sayta bax</a>
            <a href="/admin/listings">Gözləyən elanlar</a>
            <a href="/admin/listings/alllistings">Bütün elanlar</a>
            <a href="/admin/requests">
              Sorğular
              {pendingRequestCount > 0 && <span className="admin-nav-badge">{pendingRequestCount}</span>}
            </a>
            <a href="/admin/categories">Kateqoriyalar</a>
            <a href="/admin/orders">
              Sifarişlər
              {pendingOrderCount > 0 && <span className="admin-nav-badge">{pendingOrderCount}</span>}
            </a>
            <a href="/admin/paymentcards">Ödəniş kartları</a>
            <a href="/account/logout">Çıxış</a>
          </nav>
        </div>
        <div className="header-flower header-flower--left">
          <Flower />
        </div>
        <div className="header-flower header-flower--right">
          <Flower />
        </div>
      </header>

      <main>{children}</main>
    </>
  );
}
