// app/register/page.tsx
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { hash } from "bcryptjs";
import Link from "next/link";

export default function RegisterPage() {
  async function register(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "")
      .toLowerCase()
      .trim();
    const password = String(formData.get("password") || "");

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Ese correo ya está registrado.");

    const passwordHash = await hash(password, 10);
    await prisma.user.create({ data: { name, email, password: passwordHash } });

    await signIn("credentials", { redirectTo: "/admin", email, password });
  }

  return (
    <div className="max-w-md mx-auto boho-card p-6">
      <h1 className="boho-h2 mb-2" style={{ fontFamily: "var(--font-serif)" }}>
        Crear cuenta
      </h1>
      <p className="boho-muted mb-6">Gestiona tus invitaciones ✿</p>
      <form action={register} className="space-y-4">
        <div>
          <label>Nombre</label>
          <input name="name" placeholder="Tu nombre" />
        </div>
        <div>
          <label>Email</label>
          <input name="email" type="email" required />
        </div>
        <div>
          <label>Contraseña</label>
          <input name="password" type="password" minLength={6} required />
        </div>
        <button className="boho-btn w-full" type="submit">
          Crear cuenta
        </button>
      </form>
      <p className="text-sm mt-4">
        ¿Ya tienes cuenta?{" "}
        <Link className="underline" href="/login">
          Entrar
        </Link>
      </p>
    </div>
  );
}
