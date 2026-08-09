import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath =
    typeof params.next === "string" && params.next.startsWith("/")
      ? params.next
      : "/";

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <section className="relative w-full max-w-md overflow-hidden rounded-2xl px-6 py-10 sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(200,16,46,0.22),transparent_55%),linear-gradient(135deg,#1c2430_0%,#2f6b4f_55%,#c8102e_120%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 80h160M80 0v160' stroke='%23fff' stroke-opacity='.08' stroke-width='1'/%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />
        <div className="relative z-10 text-white">
          <p className="brand-mark font-[family-name:var(--font-display)] text-4xl tracking-tight animate-rise">
            TJ Pantry
          </p>
          <h1 className="mt-3 text-lg font-medium text-white/90 animate-rise-delay">
            Sign in to your pantry
          </h1>
          <p className="mt-2 text-sm text-white/65 animate-rise-delay">
            Each household member can use their own account.
          </p>
          <LoginForm nextPath={nextPath} />
        </div>
      </section>
    </div>
  );
}
