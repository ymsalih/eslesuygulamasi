"use client";
import { useActionState } from "react";
import { loginAction } from "@/app/yonetim/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="card admin-login">
      <h1>Yönetim paneli</h1>
      <p className="muted small">Sadece moderatörler içindir. Tüm işlemler kayıt altına alınır.</p>
      <label>Kullanıcı adı<input type="text" name="kullanici" autoComplete="username" required maxLength={100} /></label>
      <label>Parola<input type="password" name="parola" autoComplete="current-password" required maxLength={200} /></label>
      {state?.error && <p className="error">{state.error}</p>}
      <button className="primary" disabled={pending}>{pending ? "Kontrol ediliyor…" : "Giriş yap"}</button>
    </form>
  );
}
