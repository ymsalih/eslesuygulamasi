import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfig, getAdmin } from "@/lib/admin/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Giriş" };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/yonetim");
  const cfg = adminConfig();
  if (!cfg.ok) {
    return (
      <div className="card admin-warning admin-login">
        <h1>Yönetim paneli kapalı</h1>
        <p>{cfg.error}</p>
        <p className="muted small">Ayrıntılar: docs/KURULUM.md, &quot;Yönetim paneli&quot; bölümü.</p>
      </div>
    );
  }
  return <LoginForm />;
}
