import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, safeReturnUrl } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = { title: { absolute: "Admin Girişi - Sandıq" } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Admin AccountController.Login (GET) */
export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const returnKey = Object.keys(sp).find((k) => k.toLowerCase() === "returnurl");
  const rawReturn = returnKey ? sp[returnKey] : undefined;
  const returnUrl = Array.isArray(rawReturn) ? rawReturn[0] : rawReturn;

  const user = await getCurrentUser();
  if (user?.isAdmin) redirect(safeReturnUrl(returnUrl) ?? "/admin");
  const accessDenied = user !== null;

  return (
    <div className="admin-login">
      <div className="admin-login__box">
        {accessDenied ? (
          <>
            <h2>
              Giriş qadağandır <span>Admin</span>
            </h2>
            <p style={{ textAlign: "center", marginBottom: 16 }}>Bu hesabın admin panelinə giriş icazəsi yoxdur.</p>
            <form action="/account/logout" method="post">
              <button type="submit">Çıxış et və başqa hesabla daxil ol</button>
            </form>
          </>
        ) : (
          <>
            <h2>
              Sandıq <span>Admin</span>
            </h2>
            <AdminLoginForm returnUrl={safeReturnUrl(returnUrl)} />
          </>
        )}
      </div>
    </div>
  );
}
