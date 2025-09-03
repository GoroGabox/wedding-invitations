// app/layout.tsx
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Quicksand, Playfair_Display } from "next/font/google";
import Link from "next/link";
import { auth, signOut } from "@/auth";

const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata = {
  title: "Wedding Invitations – Boho Chic",
  description: "Create wedding events, guest lists, gift registry, and RSVP.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  async function doLogout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }
  return (
    <html lang="es">
      <body
        className={`${quicksand.variable} ${playfair.variable} antialiased min-h-screen`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <header className="sticky top-0 z-30 backdrop-blur bg-sand/70 border-b">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-semibold"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              ✿ Boho&nbsp;Invites
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              {session?.user ? (
                <>
                  <Link href="/admin" className="boho-outline">
                    Mis eventos
                  </Link>
                  <form action={doLogout}>
                    <button className="boho-outline" type="submit">
                      Salir
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="boho-outline">
                    Entrar
                  </Link>
                  <Link href="/register" className="boho-btn">
                    Crear cuenta
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-sm boho-muted">
          Hecho con amor · Boho Chic · {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
