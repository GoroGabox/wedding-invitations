// app/login/page.tsx
import { signIn } from "@/auth";
import Link from "next/link";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const callbackUrl = String(formData.get("callbackUrl") || "/admin");
    await signIn("credentials", { redirectTo: callbackUrl, email, password });
  }

  return (
    <div className="max-w-md mx-auto boho-card p-6">
      <h1 className="boho-h2 mb-2" style={{ fontFamily: "var(--font-serif)" }}>
        Iniciar sesión
      </h1>
      <p className="boho-muted mb-6">Bienvenido de vuelta ✿</p>
      <form action={login} className="space-y-4">
        <input type="hidden" name="callbackUrl" />
        <div>
          <label>Email</label>
          <input name="email" type="email" required />
        </div>
        <div>
          <label>Contraseña</label>
          <input name="password" type="password" required />
        </div>
        <button className="boho-btn w-full" type="submit">
          Entrar
        </button>
      </form>
      <p className="text-sm mt-4">
        ¿No tienes cuenta?{" "}
        <Link className="underline" href="/register">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
